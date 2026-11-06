import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Search,
  RotateCcw,
  CheckCheck,
  Building2,
  Timer,
  Trophy,
  Flame,
  X,
  Check,
  Users,
  AlertTriangle,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
} from 'lucide-react';
import { ClassRoom, Student, AttendanceStatus, AttendanceRecord } from '../../types/admin';
import {
  getArabicFormattedTodayDate,
  saveAttendanceSession,
  getAttendanceSessionForDate,
  checkSchoolAttendanceStatusForDate,
} from '../../lib/attendanceStorage';
import { saveAttendanceSessionApi } from '../../lib/schoolApi';
import {
  saveAttendanceRecords,
  batchAssignStudentClasses,
  notifyDataChanged,
  getStorage,
  setStorage,
  getClassesBySchool,
  getStudentsBySchool,
  dedupeById,
} from '../../lib/adminStorage';
import { getGradeLevelFromClassName, ALL_EGYPTIAN_GRADES, mapEgyptianSheetName } from '../../lib/egyptianSchoolUtils';
import {
  saveAttendanceWizardDraft,
  getAttendanceWizardDraft,
  clearAttendanceWizardDraft,
  enqueuePendingAttendanceBatch,
  getPendingAttendanceBatches,
  flushPendingAttendanceQueue,
} from '../../lib/attendanceOfflineSync';

interface AttendanceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  students: Student[];
  schoolId: string;
  teacherId: string;
  teacherName: string;
  onCompleteSession: () => void;
  initialClassId?: string | null;
}

// Egyptian grade level sort rank helper (strictly ascending: الأول الابتدائي -> الثالث الثانوي)
function getGradeSortRank(gradeLevel?: string): number {
  if (!gradeLevel) return 99;
  const directIdx = ALL_EGYPTIAN_GRADES.indexOf(gradeLevel);
  if (directIdx !== -1) return directIdx;

  if (gradeLevel.includes('روضة أولى') || gradeLevel.includes('KG1')) return -2;
  if (gradeLevel.includes('روضة ثانية') || gradeLevel.includes('KG2')) return -1;
  if (gradeLevel.includes('الأول الابتدائي') || gradeLevel.includes('الاول الابتدائي') || gradeLevel.includes('1 ابتدائي') || gradeLevel.includes('1 ب')) return 0;
  if (gradeLevel.includes('الثاني الابتدائي') || gradeLevel.includes('الثانى الابتدائي') || gradeLevel.includes('2 ابتدائي') || gradeLevel.includes('2 ب')) return 1;
  if (gradeLevel.includes('الثالث الابتدائي') || gradeLevel.includes('3 ابتدائي') || gradeLevel.includes('3 ب')) return 2;
  if (gradeLevel.includes('الرابع الابتدائي') || gradeLevel.includes('4 ابتدائي') || gradeLevel.includes('4 ب')) return 3;
  if (gradeLevel.includes('الخامس الابتدائي') || gradeLevel.includes('5 ابتدائي') || gradeLevel.includes('5 ب')) return 4;
  if (gradeLevel.includes('السادس الابتدائي') || gradeLevel.includes('6 ابتدائي') || gradeLevel.includes('6 ب')) return 5;
  if (gradeLevel.includes('الأول الإعدادي') || gradeLevel.includes('الاول الاعدادي') || gradeLevel.includes('1 اعدادي') || gradeLevel.includes('1 ع')) return 6;
  if (gradeLevel.includes('الثاني الإعدادي') || gradeLevel.includes('الثانى الاعدادي') || gradeLevel.includes('2 اعدادي') || gradeLevel.includes('2 ع')) return 7;
  if (gradeLevel.includes('الثالث الإعدادي') || gradeLevel.includes('3 اعدادي') || gradeLevel.includes('3 ع')) return 8;
  if (gradeLevel.includes('الأول الثانوي') || gradeLevel.includes('الاول الثانوي') || gradeLevel.includes('1 ثانوي')) return 9;
  if (gradeLevel.includes('الثاني الثانوي') || gradeLevel.includes('الثانى الثانوي') || gradeLevel.includes('2 ثانوي')) return 10;
  if (gradeLevel.includes('الثالث الثانوي') || gradeLevel.includes('3 ثانوي')) return 11;
  return 99;
}

export function AttendanceWizardModal({
  isOpen,
  onClose,
  classes,
  students,
  schoolId,
  teacherId,
  teacherName,
  onCompleteSession,
  initialClassId,
}: AttendanceWizardModalProps) {
  const [mode, setMode] = useState<'wizard' | 'completed_summary'>('wizard');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'present' | 'absent'>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // In-memory instant fast maps for zero-lag interactions
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [studentClassMap, setStudentClassMap] = useState<Record<string, string>>({}); // studentId -> classId

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [finalDurationSeconds, setFinalDurationSeconds] = useState<number>(0);
  const [isFinalStep, setIsFinalStep] = useState<boolean>(false);
  const [assignedCountSummary, setAssignedCountSummary] = useState<number>(0);
  const [restoredDraftInfo, setRestoredDraftInfo] = useState<string | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [displayLimit, setDisplayLimit] = useState<number>(50);

  // Precompute student streaks in a single fast pass when modal is open
  const studentStreaksMap = useMemo(() => {
    if (!isOpen) return new Map<string, number>();
    const map = new Map<string, number>();
    try {
      const allAttendance = getStorage<AttendanceRecord[]>('attendance', []);
      const studentRecordsMap = new Map<string, AttendanceRecord[]>();
      allAttendance.forEach((rec) => {
        if (!rec?.studentId) return;
        let arr = studentRecordsMap.get(rec.studentId);
        if (!arr) {
          arr = [];
          studentRecordsMap.set(rec.studentId, arr);
        }
        arr.push(rec);
      });

      studentRecordsMap.forEach((records, stId) => {
        const sorted = records
          .filter((r) => r && r.date)
          .sort((a, b) => (a.date > b.date ? 1 : -1));
        let runningStreak = 0;
        sorted.forEach((r) => {
          if (r.status === 'حاضر' || r.status === 'متأخر') {
            runningStreak++;
          } else {
            runningStreak = 0;
          }
        });
        if (runningStreak > 0) {
          map.set(stId, runningStreak);
        }
      });
    } catch (e) {
      console.warn('Streak map pass error:', e);
    }
    return map;
  }, [isOpen]);

  // 1. Effective Classes: Use passed classes, or local storage, or auto-derive from students
  const effectiveClasses = useMemo(() => {
    if (classes && classes.length > 0) return classes;

    const localClasses = getClassesBySchool(schoolId);
    if (localClasses && localClasses.length > 0) return localClasses;

    const cachedClasses = getStorage<ClassRoom[]>(`school_${schoolId}_classes`, []);
    if (cachedClasses && cachedClasses.length > 0) return cachedClasses;

    // Dynamically derive classes from students
    const effectiveSts = (students && students.length > 0) ? students : getStudentsBySchool(schoolId);
    const derivedClasses: ClassRoom[] = [];
    const usedClassNames = new Set<string>();

    effectiveSts.forEach((s) => {
      const c = (s.className || '').trim();
      if (c && c !== 'بدون فصل' && c !== 'غير محدد') {
        usedClassNames.add(c);
      }
    });

    if (usedClassNames.size > 0) {
      let idx = 1;
      usedClassNames.forEach((cName) => {
        const mapped = mapEgyptianSheetName(cName);
        const gradeLevel = mapped.gradeLevel || getGradeLevelFromClassName(cName) || 'المرحلة الدراسية';
        derivedClasses.push({
          id: `cls-${schoolId}-${idx++}`,
          schoolId,
          name: cName,
          gradeLevel,
          capacity: 40,
        });
      });
    } else {
      const gradesSet = new Set<string>();
      effectiveSts.forEach((s) => {
        const g = s.gradeLevel && s.gradeLevel !== 'المرحلة الدراسية'
          ? s.gradeLevel
          : getGradeLevelFromClassName(s.className || '');
        if (g && g !== 'المرحلة الدراسية') {
          gradesSet.add(g);
        }
      });

      if (gradesSet.size > 0) {
        let idx = 1;
        gradesSet.forEach((g) => {
          derivedClasses.push({
            id: `cls-${schoolId}-${idx++}`,
            schoolId,
            name: `${g} - فصل 1`,
            gradeLevel: g,
            capacity: 40,
          });
          derivedClasses.push({
            id: `cls-${schoolId}-${idx++}`,
            schoolId,
            name: `${g} - فصل 2`,
            gradeLevel: g,
            capacity: 40,
          });
        });
      } else {
        derivedClasses.push({
          id: `cls-${schoolId}-1`,
          schoolId,
          name: 'فصل 1/1',
          gradeLevel: 'الصف الأول الابتدائي',
          capacity: 40,
        });
      }
    }

    if (derivedClasses.length > 0) {
      try {
        const allStored = getStorage<ClassRoom[]>('classes', []);
        const otherSchools = allStored.filter((c) => c.schoolId !== schoolId);
        setStorage('classes', dedupeById([...otherSchools, ...derivedClasses]));
        setStorage(`school_${schoolId}_classes`, derivedClasses);
        notifyDataChanged('classes');
      } catch (e) {
        console.warn('Error caching derived classes in wizard:', e);
      }
    }

    return derivedClasses;
  }, [classes, students, schoolId]);

  // 2. Effective Students
  const effectiveStudents = useMemo(() => {
    if (students && students.length > 0) return students;
    const local = getStudentsBySchool(schoolId);
    if (local && local.length > 0) return local;
    return getStorage<Student[]>(`school_${schoolId}_students`, []);
  }, [students, schoolId]);

  const getStudentGrade = useCallback((st: Student): string => {
    if (st.gradeLevel && st.gradeLevel !== 'المرحلة الدراسية') return st.gradeLevel;
    if (st.className && st.className !== 'بدون فصل') {
      const derived = getGradeLevelFromClassName(st.className);
      if (derived && derived !== 'المرحلة الدراسية') return derived;
    }
    const matched = effectiveClasses.find((c) => c.id === st.classId || c.name === st.className);
    if (matched) return matched.gradeLevel || getGradeLevelFromClassName(matched.name);
    return st.gradeLevel || 'الصف الأول الابتدائي';
  }, [effectiveClasses]);

  // First Day Mode is true if any student hasn't had their class assigned confirmed (isClassAssigned !== true)
  // or if there are multiple classes per grade where students haven't been distributed
  const isFirstDayMode = useMemo(() => {
    if (!effectiveStudents || effectiveStudents.length === 0) return false;
    const hasUnconfirmed = effectiveStudents.some((s) => s.isClassAssigned !== true);
    return hasUnconfirmed;
  }, [effectiveStudents]);

  // Sorted Classes (Ascending: 1/1, 1/2, 2/1, 2/2, 3/1...)
  const sortedClasses = useMemo(() => {
    return [...effectiveClasses].sort((a, b) => {
      const rankA = getGradeSortRank(a.gradeLevel || getGradeLevelFromClassName(a.name));
      const rankB = getGradeSortRank(b.gradeLevel || getGradeLevelFromClassName(b.name));
      if (rankA !== rankB) return rankA - rankB;

      const numA = a.class_number || parseInt((a.name.match(/\d+\/(\d+)/) || [])[1] || '1', 10);
      const numB = b.class_number || parseInt((b.name.match(/\d+\/(\d+)/) || [])[1] || '1', 10);
      return numA - numB;
    });
  }, [effectiveClasses]);

  // Map of classes grouped by Grade Level
  const classesByGrade = useMemo(() => {
    const map = new Map<string, ClassRoom[]>();
    sortedClasses.forEach((cls) => {
      const g = cls.gradeLevel || getGradeLevelFromClassName(cls.name) || 'المرحلة الدراسية';
      if (!map.has(g)) {
        map.set(g, []);
      }
      map.get(g)!.push(cls);
    });
    return map;
  }, [sortedClasses]);

  // Distinct Grade Levels in School (Sorted strictly ascending from الأول الابتدائي to الثالث الثانوي)
  const sortedGradeLevels = useMemo(() => {
    const gradesSet = new Set<string>();
    effectiveClasses.forEach((c) => {
      const g = c.gradeLevel || getGradeLevelFromClassName(c.name);
      if (g) gradesSet.add(g);
    });
    effectiveStudents.forEach((s) => {
      const g = getStudentGrade(s);
      if (g) gradesSet.add(g);
    });

    const list = Array.from(gradesSet);
    if (list.length === 0 && effectiveClasses.length > 0) {
      return ['المرحلة الدراسية'];
    }
    return list.sort((a, b) => getGradeSortRank(a) - getGradeSortRank(b));
  }, [effectiveClasses, effectiveStudents, getStudentGrade]);

  // Total steps in wizard
  const totalSteps = isFirstDayMode
    ? Math.max(1, sortedGradeLevels.length)
    : Math.max(1, sortedClasses.length);

  // Initialize or check status whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setSubmitError(null);
      return;
    }

    const todayInfo = getArabicFormattedTodayDate();
    const existingStatus = checkSchoolAttendanceStatusForDate(schoolId, todayInfo.isoDate);
    const existingSession = getAttendanceSessionForDate(schoolId, todayInfo.isoDate);

    // Initial student class assignments and attendance maps
    const initialClassMap: Record<string, string> = {};
    const initialStatusMap: Record<string, AttendanceStatus> = {};

    effectiveStudents.forEach((st) => {
      const matched = effectiveClasses.find((c) => c.id === st.classId || c.name === st.className);
      if (matched) {
        initialClassMap[st.id] = matched.id;
      } else {
        const stGrade = getStudentGrade(st);
        const gradeClasses = classesByGrade.get(stGrade) || [];
        if (gradeClasses.length > 0) {
          initialClassMap[st.id] = gradeClasses[0].id;
        } else if (effectiveClasses.length > 0) {
          initialClassMap[st.id] = effectiveClasses[0].id;
        }
      }
      initialStatusMap[st.id] = 'حاضر';
    });

    setStudentClassMap(initialClassMap);
    setStudentStatusMap(initialStatusMap);

    if (initialClassId) {
      const targetIdx = sortedClasses.findIndex((c) => c.id === initialClassId);
      if (targetIdx !== -1) {
        setCurrentStep(targetIdx);
        setMode('wizard');
        setIsFinalStep(false);
        setElapsedSeconds(0);
        setStartTime(Date.now());
        setRestoredDraftInfo(null);
        return;
      }
    }

    if (existingStatus.isCompleted || existingSession) {
      setMode('completed_summary');
      setIsFinalStep(false);
      setElapsedSeconds(0);
      setFinalDurationSeconds((existingSession?.durationMinutes || 1) * 60);
      setRestoredDraftInfo(null);
    } else {
      // Check if an auto-saved draft exists for today to prevent data loss
      const draft = getAttendanceWizardDraft(schoolId, todayInfo.isoDate);
      if (draft && draft.studentStatusMap && Object.keys(draft.studentStatusMap).length > 0) {
        setStudentClassMap((prev) => ({ ...prev, ...draft.studentClassMap }));
        setStudentStatusMap((prev) => ({ ...prev, ...(draft.studentStatusMap as Record<string, AttendanceStatus>) }));
        setCurrentStep(draft.currentStep || 0);
        setElapsedSeconds(draft.elapsedSeconds || 0);
        setStartTime(Date.now() - (draft.elapsedSeconds ? draft.elapsedSeconds * 1000 : 0));
        setRestoredDraftInfo('⚡ تم استعادة مسودة الرصد المحفوظة تلقائياً لمتابعة العمل دون ضياع أي بيانات.');
      } else {
        setRestoredDraftInfo(null);
        setCurrentStep(0);
        setElapsedSeconds(0);
        setStartTime(Date.now());
      }
      setMode('wizard');
      setIsFinalStep(false);
      setFinalDurationSeconds(0);
    }
  }, [isOpen, initialClassId, schoolId, effectiveClasses, effectiveStudents, classesByGrade, getStudentGrade, sortedClasses]);

  // Timer interval
  useEffect(() => {
    if (!isOpen || isFinalStep || mode === 'completed_summary') return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, startTime, isFinalStep, mode]);

  // Auto-save draft on status or class assignment change
  useEffect(() => {
    if (!isOpen || isFinalStep || mode !== 'wizard') return;
    if (Object.keys(studentStatusMap).length === 0) return;

    const timeout = setTimeout(() => {
      const today = getArabicFormattedTodayDate();
      saveAttendanceWizardDraft(schoolId, today.isoDate, {
        studentStatusMap,
        studentClassMap,
        currentStep,
        elapsedSeconds,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [isOpen, isFinalStep, mode, schoolId, studentStatusMap, studentClassMap, currentStep, elapsedSeconds]);

  if (!isOpen) return null;

  const todayInfo = getArabicFormattedTodayDate();
  const existingSession = getAttendanceSessionForDate(schoolId, todayInfo.isoDate);
  const schoolStatus = checkSchoolAttendanceStatusForDate(schoolId, todayInfo.isoDate);

  // CURRENT STEP CONTEXT
  // In First Day Mode: Step represents a Grade Level (e.g. الصف الأول الابتدائي)
  // In Normal Mode: Step represents a Class (e.g. 1/1 ابتدائي)
  const currentGradeLevel = isFirstDayMode
    ? (sortedGradeLevels[currentStep] || sortedGradeLevels[0] || 'المرحلة الدراسية')
    : (sortedClasses[currentStep]?.gradeLevel || getGradeLevelFromClassName(sortedClasses[currentStep]?.name) || 'المرحلة الدراسية');

  // Classes belonging to this grade level
  const currentGradeClasses = classesByGrade.get(currentGradeLevel) || effectiveClasses.filter((c) => {
    const cg = c.gradeLevel || getGradeLevelFromClassName(c.name);
    return cg === currentGradeLevel;
  });

  const currentClass = !isFirstDayMode ? (sortedClasses[currentStep] || sortedClasses[0] || null) : null;

  // Students in current step
  const currentStepStudents = isFirstDayMode
    ? effectiveStudents.filter((s) => getStudentGrade(s) === currentGradeLevel)
    : effectiveStudents.filter((s) => {
        const cId = studentClassMap[s.id] || s.classId;
        return cId === currentClass?.id || s.className === currentClass?.name;
      });

  // Filtered Students for search and tabs
  const filteredStudents = currentStepStudents.filter((std) => {
    const status = studentStatusMap[std.id] || 'حاضر';
    if (filterTab === 'present' && status !== 'حاضر') return false;
    if (filterTab === 'absent' && status === 'حاضر') return false;

    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.trim().toLowerCase();
    return (
      std.name.toLowerCase().includes(q) ||
      (std.studentCode && std.studentCode.toLowerCase().includes(q)) ||
      (std.ministryCode && std.ministryCode.toLowerCase().includes(q)) ||
      (std.nationalId && std.nationalId.includes(q))
    );
  });

  // Current Step Live Counts
  let stepPresentCount = 0;
  let stepAbsentCount = 0;
  let stepLateCount = 0;

  currentStepStudents.forEach((st) => {
    const stStatus = studentStatusMap[st.id] || 'حاضر';
    if (stStatus === 'حاضر') stepPresentCount++;
    else if (stStatus === 'غائب') stepAbsentCount++;
    else if (stStatus === 'متأخر') stepLateCount++;
  });

  // Fast In-Memory Handlers (No lag, instant React state update)
  const handleAssignStudentClass = (studentId: string, classId: string) => {
    setStudentClassMap((prev) => {
      if (prev[studentId] === classId) return prev;
      return { ...prev, [studentId]: classId };
    });
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setStudentStatusMap((prev) => {
      if (prev[studentId] === status) return prev;
      return { ...prev, [studentId]: status };
    });
  };

  const handleSetAllPresent = () => {
    setStudentStatusMap((prev) => {
      const next = { ...prev };
      currentStepStudents.forEach((st) => {
        next[st.id] = 'حاضر';
      });
      return next;
    });
  };

  // Step Navigation
  const handleNextStep = async () => {
    setSubmitError(null);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setStudentSearchQuery('');
      setFilterTab('all');
    } else {
      await saveAllAndFinishSession();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setStudentSearchQuery('');
      setFilterTab('all');
    }
  };

  // Calculate global totals
  const calculateGlobalTotals = () => {
    let globalPresent = 0;
    let globalAbsent = 0;
    let globalLate = 0;

    effectiveStudents.forEach((st) => {
      const stStatus = studentStatusMap[st.id] || 'حاضر';
      if (stStatus === 'حاضر') globalPresent++;
      else if (stStatus === 'غائب') globalAbsent++;
      else if (stStatus === 'متأخر') globalLate++;
    });

    return { globalPresent, globalAbsent, globalLate, globalTotalStudents: effectiveStudents.length };
  };

  // Final Submit & Batch Save
  const saveAllAndFinishSession = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const todayInfo = getArabicFormattedTodayDate();
      const totals = calculateGlobalTotals();
      const calculatedDurationSecs = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      const nowIso = new Date().toISOString();

      // 1. Prepare batch class assignments
      const classByIdMap = new Map(effectiveClasses.map((c) => [c.id, c]));
      const assignmentsToPersist: Array<{ studentId: string; classId: string; className: string; gradeLevel: string }> = [];

      effectiveStudents.forEach((st) => {
        const assignedClassId = studentClassMap[st.id];
        const assignedClass = assignedClassId ? classByIdMap.get(assignedClassId) : null;
        if (assignedClass) {
          if (st.classId !== assignedClass.id || st.className !== assignedClass.name || !st.isClassAssigned) {
            assignmentsToPersist.push({
              studentId: st.id,
              classId: assignedClass.id,
              className: assignedClass.name,
              gradeLevel: assignedClass.gradeLevel,
            });
          }
        }
      });

      if (assignmentsToPersist.length > 0) {
        await batchAssignStudentClasses(schoolId, assignmentsToPersist);
        setAssignedCountSummary(assignmentsToPersist.length);
      }

      // 2. Prepare attendance records for all students under their assigned classes
      const fallbackClass = effectiveClasses[0] || { id: 'cls-general', name: 'الفصل العام', gradeLevel: 'المرحلة الدراسية' };
      const attendanceRecordsToSave = effectiveStudents.map((std) => {
        const assignedClassId = studentClassMap[std.id] || std.classId || fallbackClass.id;
        const assignedClass = (assignedClassId ? classByIdMap.get(assignedClassId) : null) || fallbackClass;
        const status = studentStatusMap[std.id] || 'حاضر';

        return {
          id: `att-${schoolId}-${std.id}-${todayInfo.isoDate}`,
          schoolId,
          studentId: std.id,
          studentName: std.name,
          classId: assignedClass.id,
          className: assignedClass.name,
          date: todayInfo.isoDate,
          status,
          attendance_teacher_id: teacherId,
          created_at: nowIso,
        };
      });

      // 3. Save Session Metadata
      const completionTimeStr = new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const sessionObj = {
        date: todayInfo.isoDate,
        schoolId,
        completedAt: completionTimeStr,
        totalClassesCount: effectiveClasses.length,
        totalStudentsCount: totals.globalTotalStudents,
        presentCount: totals.globalPresent,
        absentCount: totals.globalAbsent,
        lateCount: totals.globalLate,
        durationMinutes: Math.max(1, Math.round(calculatedDurationSecs / 60)),
        teacherName,
      };

      // 4. Save attendance records (resilient offline-first)
      let networkFailed = false;
      try {
        await saveAttendanceRecords(attendanceRecordsToSave);
      } catch (saveErr) {
        console.warn('[Attendance Wizard]: saveAttendanceRecords error handled:', saveErr);
        networkFailed = true;
      }

      try {
        await saveAttendanceSessionApi(schoolId, sessionObj);
      } catch (e) {
        console.warn('[Attendance Wizard]: saveAttendanceSessionApi offline/network warning:', e);
        networkFailed = true;
      }

      // Always persist session metadata locally
      saveAttendanceSession(sessionObj);

      // If network failed or device is offline, ensure sessionObj is attached to pending batch
      if (networkFailed || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        enqueuePendingAttendanceBatch(
          schoolId,
          attendanceRecordsToSave,
          sessionObj,
          'تم الحفظ بأمان محلياً بانتظار عودة الاتصال بالإنترنت'
        );
        setIsOfflineSaved(true);
      } else {
        setIsOfflineSaved(false);
      }

      // Clear wizard draft as session has now been finalized and persisted safely
      clearAttendanceWizardDraft(schoolId, todayInfo.isoDate);

      notifyDataChanged('attendance');
      notifyDataChanged('students');

      setFinalDurationSeconds(calculatedDurationSecs);
      setElapsedSeconds(calculatedDurationSecs);
      setIsFinalStep(true);
      onCompleteSession();
    } catch (err: any) {
      console.error('Attendance batch save error:', err);
      setSubmitError(err?.message || 'تعذر استكمال الحفظ. تم الاحتفاظ بمسودة بياناتك بأمان.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} ثانية`;
    return `${m} دقيقة و ${s} ثانية`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 font-['Cairo',sans-serif] dir-rtl overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-[#F8FAFC] w-full h-full sm:h-[94vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80"
      >
        {/* ================= 0. NO STUDENTS REGISTERED EMPTY STATE ================= */}
        {effectiveStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-white overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 border border-amber-200 shadow-xs">
              <Users className="w-10 h-10 text-amber-600" />
            </div>

            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 mb-3">
              لا توجد بيانات طلاب حالياً
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              لم يتم استيراد كشف الطلاب لهذه المدرسة بعد
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
              لبدء رصد الحضور وتوزيع الفصول، يرجى استيراد كشف الطلاب عبر ملف Excel من لوحة تحكم إدارة المدرسة أو إضافة الطلاب للبدء فوراً.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>العودة للرئيسية</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : mode === 'completed_summary' && !isFinalStep ? (
          /* ================= 1. ALREADY COMPLETED SUMMARY SCREEN ================= */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-white overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 mb-2">
              حضور اليوم مكتمل ومعتمد
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              تم تسجيل واعتماد حضور اليوم بالفعل
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mb-6 leading-relaxed">
              كشوف الحضور والغياب اليومية لجميع فصول المدرسة ({schoolStatus.totalClasses || effectiveClasses.length} فصل) مسجلة ومحفوظة بنجاح بتاريخ{' '}
              <span className="font-bold text-slate-800">{todayInfo.fullFormatted}</span>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-600 mb-6 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-1.5 text-blue-700">
                <Clock className="w-4 h-4" />
                <span>وقت الاعتماد: {existingSession?.completedAt || 'تم اليوم'}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>المعتمد: {existingSession?.teacherName || teacherName}</span>
              </div>
            </div>

            <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8 text-right space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">إجمالي الطلاب</span>
                  <span className="text-xl font-extrabold text-slate-900">{schoolStatus.totalStudents}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 block">الحاضرين</span>
                  <span className="text-xl font-extrabold text-emerald-800">{schoolStatus.presentCount}</span>
                </div>
                <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                  <span className="text-[11px] font-bold text-red-700 block">الغائبين</span>
                  <span className="text-xl font-extrabold text-red-800">{schoolStatus.absentCount}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>إغلاق والعودة للرئيسية</span>
                <Check className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('wizard');
                  setCurrentStep(0);
                  setIsFinalStep(false);
                  setStartTime(Date.now());
                }}
                className="w-full sm:w-auto py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>تعديل كشوف اليوم</span>
              </button>
            </div>
          </div>
        ) : isFinalStep ? (
          /* ================= 2. FINAL STEP SUCCESS SCREEN ================= */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-white overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-sm animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 mb-3">
              إنجاز يومي مكتمل وتوزيع منظم
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              🎉 تم تسجيل حضور جميع الطلاب بنجاح
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mb-6 leading-relaxed">
              {assignedCountSummary > 0
                ? `تم اعتماد الحضور وتسكين ${assignedCountSummary} طالباً في فصولهم الدراسية بنجاح.`
                : 'تم اعتماد كشوف الحضور والغياب اليومية بالنظام لجميع الفصول.'}
            </p>

            <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8 text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="text-xs font-bold text-slate-500">ملخص الحضور اليومي الإجمالي</span>
                <span className="text-xs font-mono font-bold text-blue-600 flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>استغرق: {formatTime(finalDurationSeconds || elapsedSeconds)}</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block">إجمالي الطلاب</span>
                  <span className="text-xl font-extrabold text-slate-900">{calculateGlobalTotals().globalTotalStudents}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 block">الحاضرين</span>
                  <span className="text-xl font-extrabold text-emerald-800">{calculateGlobalTotals().globalPresent}</span>
                </div>
                <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                  <span className="text-[11px] font-bold text-red-700 block">الغائبين</span>
                  <span className="text-xl font-extrabold text-red-800">{calculateGlobalTotals().globalAbsent}</span>
                </div>
              </div>
            </div>

            {/* Offline sync banner if offline or pending batches exist */}
            {(isOfflineSaved || getPendingAttendanceBatches(schoolId).length > 0) && (
              <div className="w-full max-w-xl bg-amber-50 border border-amber-200/90 rounded-2xl p-4 text-right mb-6 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black text-amber-950">
                      تم حفظ الكشف بأمان في الذاكرة المحلية للجهاز (وضع عدم الاتصال)
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      تم تأمين كافة سجلات الحضور والغياب على جهازك لضمان عدم ضياع أي بيانات. ستتم المزامنة التلقائية مع الخادم فور عودة الإنترنت، أو يمكنك الضغط على الزر أدناه للمزامنة الآن.
                    </p>
                    {syncFeedback && (
                      <p className="text-xs font-bold text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200 mt-2">
                        {syncFeedback}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={isManualSyncing}
                      onClick={async () => {
                        setIsManualSyncing(true);
                        setSyncFeedback(null);
                        try {
                          const res = await flushPendingAttendanceQueue(schoolId);
                          setSyncFeedback(res.message);
                          if (res.failedCount === 0) {
                            setIsOfflineSaved(false);
                          }
                        } catch (err: any) {
                          setSyncFeedback('تعذرت المزامنة: يرجى التأكد من اتصال الجهاز بالإنترنت.');
                        } finally {
                          setIsManualSyncing(false);
                        }
                      }}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                      <span>{isManualSyncing ? 'جارِ المزامنة مع الخادم...' : 'مزامنة السجلات المعلقة الآن'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-sm py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>تم، إغلاق والعودة للبوابة</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ================= 3. ACTIVE WIZARD SCREEN ================= */
          <>
            {/* Draft Auto-Restore Notice */}
            {restoredDraftInfo && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between animate-fadeIn shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restoredDraftInfo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRestoredDraftInfo(null)}
                  className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 cursor-pointer"
                  title="إغلاق التنبيه"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Top Header */}
            <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                {/* Right: Step Title */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                    {isFirstDayMode ? `صف ${currentStep + 1} من ${totalSteps}` : `فصل ${currentStep + 1} من ${totalSteps}`}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span>{isFirstDayMode ? currentGradeLevel : currentClass?.name}</span>
                    </h2>
                  </div>
                </div>

                {/* Left: Close */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Step Pills Bar (Ascending from First to Last) */}
              <div className="overflow-x-auto pb-1 flex items-center gap-1.5 scrollbar-none">
                {isFirstDayMode
                  ? sortedGradeLevels.map((gName, idx) => {
                      const isCurrent = idx === currentStep;
                      const isDone = idx < currentStep;
                      return (
                        <button
                          key={gName}
                          type="button"
                          onClick={() => {
                            setCurrentStep(idx);
                            setStudentSearchQuery('');
                            setFilterTab('all');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs font-black'
                              : isDone
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {gName} {isDone && '✓'}
                        </button>
                      );
                    })
                  : sortedClasses.map((cls, idx) => {
                      const isCurrent = idx === currentStep;
                      const isDone = idx < currentStep;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setCurrentStep(idx);
                            setStudentSearchQuery('');
                            setFilterTab('all');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs font-black'
                              : isDone
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cls.name} {isDone && '✓'}
                        </button>
                      );
                    })}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="px-4 sm:px-6 pt-3 pb-1 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder={`بحث سريع باسم الطالب في ${isFirstDayMode ? currentGradeLevel : currentClass?.name}...`}
                  className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Students List Area (Scrollable with Zero-Lag Cards) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
              {filteredStudents.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-bold">
                  لا يوجد طلاب مسجلين في هذا القسم أو مطابقين للبحث.
                </div>
              ) : (
                <>
                  {filteredStudents.slice(0, displayLimit).map((student, idx) => {
                    const status = studentStatusMap[student.id] || 'حاضر';
                    const isPresent = status === 'حاضر';
                    const isAbsent = status === 'غائب';
                    const isLate = status === 'متأخر';
                    const streakVal = studentStreaksMap.get(student.id) || 0;

                    // Current assigned class for this student
                    const assignedClassId = studentClassMap[student.id] || student.classId || currentGradeClasses[0]?.id || effectiveClasses[0]?.id;

                    // Classes to show in buttons: all classes for this student's grade
                    const availableClasses = currentGradeClasses.length > 0 ? currentGradeClasses : effectiveClasses;

                    return (
                      <div
                        key={student.id}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white ${
                          isAbsent
                            ? 'border-red-300 ring-2 ring-red-500/20 bg-red-50/20'
                            : isLate
                            ? 'border-amber-300 ring-2 ring-amber-500/20 bg-amber-50/20'
                            : 'border-slate-200/90 hover:border-blue-300'
                        }`}
                      >
                        {/* Right: Student Name & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              isAbsent
                                ? 'bg-red-100 text-red-700'
                                : isLate
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                {student.name}
                              </h4>
                              {streakVal >= 3 && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 shrink-0"
                                  title={`سلسلة مواظبة متصلة: ${streakVal} يوم`}
                                >
                                  <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
                                  <span>{streakVal}د</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Choosing Class Segmented Buttons (Always visible and functional) */}
                        {availableClasses.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 w-full md:w-auto overflow-x-auto">
                            <span className="text-[10px] font-bold text-slate-500 pl-1 shrink-0">الفصل:</span>
                            <div className="flex items-center gap-1 flex-nowrap sm:flex-wrap shrink-0">
                              {availableClasses.map((cls) => {
                                const isSelected = assignedClassId === cls.id || (student.className === cls.name && !studentClassMap[student.id]);
                                return (
                                  <button
                                    key={cls.id}
                                    type="button"
                                    onClick={() => handleAssignStudentClass(student.id, cls.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                                      isSelected
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {cls.name} {isSelected && '✓'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Left: Attendance Status Buttons (حاضر / غائب / متأخر) */}
                        <div className="grid grid-cols-3 gap-1.5 w-full md:w-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'حاضر')}
                            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>حاضر</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'غائب')}
                            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isAbsent
                                ? 'bg-red-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>غائب</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'متأخر')}
                            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isLate
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>متأخر</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {filteredStudents.length > displayLimit && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setDisplayLimit((prev) => prev + 50)}
                      className="py-2 px-5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs"
                    >
                      عرض المزيد من الطلاب (يوجد {filteredStudents.length - displayLimit} طالباً إضافياً)
                    </button>
                  </div>
                )}
              </>
            )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center justify-between">
                <span>{submitError}</span>
                <button type="button" onClick={() => setSubmitError(null)} className="text-red-500 hover:text-red-700 text-sm font-black cursor-pointer">✕</button>
              </div>
            )}

            {/* Bottom Footer Navigation */}
            <div className="bg-white border-t border-slate-200 p-3 sm:px-6 shrink-0 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 0 || isSubmitting}
                className="py-2.5 px-4 sm:px-5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <div className="text-center hidden md:block">
                <span className="text-xs text-slate-500 font-bold">
                  {isFirstDayMode ? currentGradeLevel : currentClass?.name} ({stepPresentCount} حاضر من {currentStepStudents.length})
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-black text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>جاري الحفظ... ⏳</span>
                ) : (
                  <>
                    <span>
                      {currentStep === totalSteps - 1
                        ? (isFirstDayMode ? 'اعتماد وحفظ الحضور وتسكين الفصول' : 'إنهاء وحفظ الحضور اليومي')
                        : (isFirstDayMode ? 'التالي (الصف القادم)' : 'التالي (الفصل القادم)')}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
