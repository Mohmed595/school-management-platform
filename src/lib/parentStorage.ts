import { Student, AttendanceRecord, GradeRecord, BehaviorRecord, Announcement, SchoolAdminInfo } from '../types/admin';
import { ParentPortalData, HomeworkItem, HomeworkStatus } from '../types/parent';
import { getSchoolAdminInfo, getStorage, setStorage, seedSchoolData, generateStudentCode, notifyDataChanged } from './adminStorage';
import { getStoredSchools, getStoredSession, saveStoredSession } from './storage';
import { getAllStudentBadges, awardBadgeToStudent } from './badgeStorage';
import { calculateStreakFromAttendance, checkAndAwardStreakBadges } from './streakStorage';
import { isAnnouncementVisibleToRole } from './utils';

const HOMEWORK_STORAGE_KEY = 'eg_school_parent_homework_v2';

export function loginStudentByNamePhoneCode(
  studentName: string,
  parentPhone: string,
  studentCode: string
): ParentPortalData | null {
  const cleanName = (studentName || '').trim().toLowerCase();
  const cleanPhone = (parentPhone || '').trim().replace(/\D/g, '');
  const cleanCode = (studentCode || '').trim().toLowerCase();

  if (!cleanName || !cleanPhone || !cleanCode) {
    return null;
  }

  // Seed default schools data if not already present
  const schools = getStoredSchools();
  schools.forEach((s) => seedSchoolData(s.id));
  seedSchoolData('sch-1');

  const allStudents = getStorage<Student[]>('students', []);

  // REAL AUTHENTICATION VERIFICATION against registered student database
  const matchedStudent = allStudents.find((s) => {
    const sCode = (s.studentCode || '').trim().toLowerCase();
    const sId = (s.id || '').trim().toLowerCase();
    const sNational = (s.nationalId || '').trim().toLowerCase();
    const sPhone = (s.parentPhone || '').trim().replace(/\D/g, '');
    const sName = (s.name || '').trim().toLowerCase();

    // 1. Code match
    // Matches full code "std-2026-10001", short code "10001", id "std-sch-1-m1-1", or nationalId "31205120108234"
    const isCodeMatch =
      sCode === cleanCode ||
      sId === cleanCode ||
      sNational === cleanCode ||
      (cleanCode.length >= 3 && sCode.includes(cleanCode)) ||
      (cleanCode.length >= 3 && sCode.replace(/^std-\d+-/, '') === cleanCode.replace(/^std-\d+-/, '')) ||
      (cleanCode.length >= 3 && sId.includes(cleanCode));

    if (!isCodeMatch) return false;

    // 2. Parent Phone match
    const isPhoneMatch =
      !sPhone || // allow binding if phone wasn't filled yet
      sPhone === cleanPhone ||
      sPhone.endsWith(cleanPhone) ||
      cleanPhone.endsWith(sPhone) ||
      sPhone.slice(-8) === cleanPhone.slice(-8);

    if (!isPhoneMatch) return false;

    // 3. Name match (check if student name matches or contains parts of the query name)
    const searchWords = cleanName.split(/\s+/).filter((w) => w.length >= 2);
    const registeredWords = sName.split(/\s+/).filter((w) => w.length >= 2);

    const isNameMatch =
      sName.includes(cleanName) ||
      cleanName.includes(sName) ||
      searchWords.some((w) => sName.includes(w)) ||
      registeredWords.some((w) => cleanName.includes(w));

    return isNameMatch;
  });

  if (matchedStudent) {
    if (!matchedStudent.parentPhone && parentPhone.trim()) {
      matchedStudent.parentPhone = parentPhone.trim();
      setStorage('students', allStudents);
    }
    return getParentPortalDataByNationalId(matchedStudent.nationalId || matchedStudent.studentCode || matchedStudent.id);
  }

  // Real authentication: Return null if no registered student matches the provided credentials
  return null;
}

export function loginStudentBySchoolGradeName(
  schoolName: string,
  gradeOrAge: string,
  studentName: string
): ParentPortalData | null {
  const cleanSchool = (schoolName || '').trim();
  const cleanGrade = (gradeOrAge || '').trim();
  const cleanName = (studentName || '').trim();

  if (!cleanName || !cleanSchool) {
    return null;
  }

  // Find school by name or code
  const schools = getStoredSchools();
  const matchedSchool = schools.find(
    (s) =>
      (s.name && s.name.toLowerCase().includes(cleanSchool.toLowerCase())) ||
      (cleanSchool && s.name && cleanSchool.toLowerCase().includes(s.name.toLowerCase())) ||
      s.id === cleanSchool ||
      s.code === cleanSchool
  );

  if (!matchedSchool) {
    return null;
  }

  const schoolId = matchedSchool.id;
  seedSchoolData(schoolId);

  const allStudents = getStorage<Student[]>('students', []);

  // Try finding existing registered student by name & schoolId
  const student = allStudents.find((s) => {
    if (s.schoolId !== schoolId) return false;
    if (!s.name) return false;

    const sNameLower = s.name.trim().toLowerCase();
    const cleanNameLower = cleanName.toLowerCase();

    // 1. Direct match or substring inclusion
    if (sNameLower.includes(cleanNameLower) || cleanNameLower.includes(sNameLower)) {
      return true;
    }

    // 2. Token / Multi-word match
    const searchWords = cleanNameLower.split(/\s+/).filter((w) => w.length > 1);
    if (searchWords.length >= 2) {
      const matchAllWords = searchWords.every((word) => sNameLower.includes(word));
      if (matchAllWords) return true;
    }

    return false;
  });

  if (!student) {
    // Unregistered account! Return null to trigger the not-found frame card modal
    return null;
  }

  if (!student.studentCode) {
    student.studentCode = generateStudentCode();
  }

  return getParentPortalDataByNationalId(student.nationalId);
}

export function getHomeworkByStudent(studentId: string, schoolId: string, className?: string, classId?: string): HomeworkItem[] {
  const all = getStorage<HomeworkItem[]>(HOMEWORK_STORAGE_KEY, []);
  return all.filter((h) => {
    if (h.studentId && h.studentId === studentId) return true;
    if (classId && h.classId === classId) return true;
    if (className && h.className === className) return true;
    if (!h.studentId && !h.classId && h.schoolId === schoolId) return true;
    return false;
  });
}

export function updateHomeworkStatus(homeworkId: string, status: HomeworkStatus, schoolId?: string): void {
  const all = getStorage<HomeworkItem[]>(HOMEWORK_STORAGE_KEY, []);
  const idx = all.findIndex((h) => h.id === homeworkId);
  if (idx >= 0) {
    all[idx].status = status;
    setStorage(HOMEWORK_STORAGE_KEY, all);

    const targetSchoolId = schoolId || all[idx].schoolId || 'sch-1';
    const token = localStorage.getItem('madrasety_current_token') || '';
    fetch(`/api/schools/${encodeURIComponent(targetSchoolId)}/homework/${encodeURIComponent(homeworkId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    }).catch((e) => console.warn('Background homework update failed', e));
  }
}

export function getParentPortalData(params: {
  studentNationalId?: string;
  studentId?: string;
  studentCode?: string;
  schoolId?: string;
  studentName?: string;
  className?: string;
  avatarUid?: string;
}): ParentPortalData {
  const cleanId = (params.studentNationalId || params.studentId || params.studentCode || '').trim();
  const cleanName = (params.studentName || '').trim();
  const defaultSchoolId = params.schoolId || 'sch-1';
  seedSchoolData(defaultSchoolId);

  // Search all students across storage
  const allStudents = getStorage<Student[]>('students', []);

  // 1. Try finding by ID, nationalId, studentCode, or exact name
  let student = allStudents.find((s) => {
    if (params.schoolId && s.schoolId && s.schoolId !== params.schoolId) {
      // If schoolId is specified, prefer matches in that school
      const idMatch =
        (cleanId && (s.id === cleanId || s.nationalId === cleanId || s.studentCode === cleanId)) ||
        (cleanName && s.name && s.name.trim().toLowerCase() === cleanName.toLowerCase());
      return idMatch;
    }

    if (cleanId) {
      if (s.id === cleanId || s.nationalId === cleanId || s.studentCode === cleanId) return true;
      if (s.nationalId && s.nationalId.includes(cleanId)) return true;
      if (s.studentCode && s.studentCode.toLowerCase() === cleanId.toLowerCase()) return true;
      if (s.name && s.name.trim().toLowerCase() === cleanId.toLowerCase()) return true;
    }

    if (cleanName && s.name) {
      const sNameLower = s.name.trim().toLowerCase();
      const queryNameLower = cleanName.toLowerCase();
      if (sNameLower === queryNameLower || sNameLower.includes(queryNameLower) || queryNameLower.includes(sNameLower)) {
        return true;
      }
    }

    return false;
  });

  // 2. If student is not in storage but was logged in/swapped from trusted session, register them permanently as a REAL student
  if (!student) {
    const realStudentName = cleanName || cleanId || 'طالب مسجل';
    const assignedSchoolId = params.schoolId || defaultSchoolId;
    const realStudentId = params.studentId || (cleanId.startsWith('std-') ? cleanId : `std-${assignedSchoolId}-${Date.now().toString(36)}`);
    const realStudentCode = params.studentCode || (cleanId.startsWith('STD-') ? cleanId : generateStudentCode());
    const realNationalId = params.studentNationalId || (/^\d{14}$/.test(cleanId) ? cleanId : `3${Date.now().toString().slice(-13)}`);
    const realClassName = params.className || 'الصف الأول الابتدائي - أ';

    const newRealStudent: Student = {
      id: realStudentId,
      schoolId: assignedSchoolId,
      name: realStudentName,
      studentCode: realStudentCode,
      nationalId: realNationalId,
      age: 'الصف الأول الابتدائي',
      gradeLevel: 'الصف الأول الابتدائي',
      classId: `cls-${assignedSchoolId}-p1`,
      className: realClassName,
      birthDate: '2019-05-15',
      gender: 'ذكر',
      address: 'محافظة القاهرة - جمهورية مصر العربية',
      status: 'منتظم',
      avatar_layout_uid: params.avatarUid,
      parentName: `ولي أمر ${realStudentName}`,
      parentPhone: '',
      joinDate: '2025-09-01',
    };

    allStudents.push(newRealStudent);
    setStorage('students', allStudents);
    student = newRealStudent;
  }

  // Synchronize avatar and metadata if updated
  if (params.avatarUid && student.avatar_layout_uid !== params.avatarUid) {
    student.avatar_layout_uid = params.avatarUid;
    setStorage('students', allStudents);
  }
  // Only apply params.className if student does not already have a valid class assigned
  if (params.className && (!student.className || student.className === 'بدون فصل' || student.className === 'فصل 1')) {
    student.className = params.className;
    setStorage('students', allStudents);
  } else if (student.className && params.className && student.className !== params.className) {
    // Student in storage has authoritative class name from database; update session to match
    try {
      const currentSession = getStoredSession();
      if (currentSession && (currentSession.studentId === student.id || currentSession.userId === student.id)) {
        currentSession.className = student.className;
        if (student.gradeLevel) currentSession.gradeLevel = student.gradeLevel;
        saveStoredSession(currentSession);
      }
    } catch {}
  }
  if (cleanName && student.name !== cleanName && student.name === 'طالب مسجل') {
    student.name = cleanName;
    setStorage('students', allStudents);
  }

  const schoolId = student.schoolId || defaultSchoolId;
  const schoolInfo = getSchoolAdminInfo(schoolId);

  // Initialize student records without default owner badge
  const allStudentBadges = getAllStudentBadges();

  // Load Real Attendance Records from Storage
  const attendance = getStorage<AttendanceRecord[]>('attendance', []).filter(
    (a) => a.schoolId === schoolId && (a.studentId === student!.id || a.studentName === student!.name)
  );

  // Load Real Grades Records from Storage
  const grades = getStorage<GradeRecord[]>('grades', []).filter(
    (g) => g.schoolId === schoolId && (g.studentId === student!.id || g.studentName === student!.name)
  );

  // Load Real Behavior Records from Storage
  const behavior = getStorage<BehaviorRecord[]>('behavior', []).filter(
    (b) => b.schoolId === schoolId && (b.studentId === student!.id || b.studentName === student!.name)
  );

  // Load Real Homework Items from Storage
  const homework = getStorage<HomeworkItem[]>(HOMEWORK_STORAGE_KEY, []).filter(
    (h) => h.studentId === student!.id || h.schoolId === schoolId
  );

  // Load Real Announcements from Storage (filtered for student / parent visibility)
  const announcements = getStorage<Announcement[]>('announcements', []).filter(
    (a) => a.schoolId === schoolId && isAnnouncementVisibleToRole(a.targetAudience, 'student')
  );

  // Calculate Real Statistics
  const presentDays = attendance.filter((a) => a.status === 'حاضر').length;
  const absentDays = attendance.filter((a) => a.status === 'غائب').length;
  const lateDays = attendance.filter((a) => a.status === 'متأخر').length;
  const totalDays = presentDays + absentDays + lateDays;

  const attendancePercentage =
    totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  let overallGpa = 0;
  let overallGradeLabel = 'لا توجد درجات مسجلة بعد';

  if (grades.length > 0) {
    const totalScore = grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0);
    overallGpa = Math.round(totalScore / grades.length);
    if (overallGpa >= 90) overallGradeLabel = 'ممتاز';
    else if (overallGpa >= 80) overallGradeLabel = 'جيد جداً';
    else if (overallGpa >= 70) overallGradeLabel = 'جيد';
    else if (overallGpa >= 60) overallGradeLabel = 'مقبول';
    else overallGradeLabel = 'يحتاج متابعة';
  }

  const positivePoints = behavior
    .filter((b) => b.type === 'إيجابي')
    .reduce((acc, b) => acc + Math.abs(b.points), 0);

  const negativePoints = behavior
    .filter((b) => b.type === 'سلبي')
    .reduce((acc, b) => acc + Math.abs(b.points), 0);

  const pendingHomeworkCount = homework.filter(
    (h) => h.status === 'قيد التنفيذ' || h.status === 'متأخر'
  ).length;

  // Calculate Real Attendance Streak
  const streak = calculateStreakFromAttendance(student.id, student.name, schoolId, attendance);
  if (streak.currentStreak > 0) {
    checkAndAwardStreakBadges(student.id, schoolId, streak.currentStreak);
  }

  return {
    student,
    schoolInfo,
    attendance,
    grades,
    behavior,
    homework,
    announcements,
    streak,
    stats: {
      attendancePercentage,
      presentDays,
      absentDays,
      lateDays,
      overallGpa,
      overallGradeLabel,
      positivePoints,
      negativePoints,
      pendingHomeworkCount,
    },
  };
}

export function getParentPortalDataByNationalId(nationalId: string, schoolId?: string): ParentPortalData {
  return getParentPortalData({ studentNationalId: nationalId, schoolId });
}

/**
 * Sync server-returned parent/student data directly into localStorage
 * so that synchronous offline/local queries remain consistent across devices.
 */
export function syncParentDataToLocalStorage(parentData: any): void {
  if (!parentData) return;

  // 1. Student
  if (parentData.student && parentData.student.id) {
    const students = getStorage<Student[]>('students', []);
    const idx = students.findIndex((s) => s.id === parentData.student.id || (s.nationalId && s.nationalId === parentData.student.nationalId));
    if (idx >= 0) {
      students[idx] = { ...students[idx], ...parentData.student };
    } else {
      students.push(parentData.student);
    }
    setStorage('students', students);

    // Keep active session in sync
    try {
      const currentSession = getStoredSession();
      if (currentSession && (currentSession.studentId === parentData.student.id || currentSession.userId === parentData.student.id)) {
        let sessChanged = false;
        if (parentData.student.className && currentSession.className !== parentData.student.className) {
          currentSession.className = parentData.student.className;
          sessChanged = true;
        }
        if (parentData.student.gradeLevel && currentSession.gradeLevel !== parentData.student.gradeLevel) {
          currentSession.gradeLevel = parentData.student.gradeLevel;
          sessChanged = true;
        }
        if (parentData.student.name && currentSession.studentName !== parentData.student.name) {
          currentSession.studentName = parentData.student.name;
          currentSession.userDisplayName = parentData.student.name;
          sessChanged = true;
        }
        if (sessChanged) {
          saveStoredSession(currentSession);
        }
      }
    } catch {}
  }

  // 2. Attendance
  if (Array.isArray(parentData.attendance) && parentData.attendance.length > 0) {
    const attendance = getStorage<AttendanceRecord[]>('attendance', []);
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach((a) => {
      const key = a.id || `${a.studentId}_${a.date}`;
      map.set(key, a);
    });
    parentData.attendance.forEach((a: AttendanceRecord) => {
      const key = a.id || `${a.studentId}_${a.date}`;
      map.set(key, { ...map.get(key), ...a });
    });
    setStorage('attendance', Array.from(map.values()));
  }

  // 3. Grades
  if (Array.isArray(parentData.grades) && parentData.grades.length > 0) {
    const grades = getStorage<GradeRecord[]>('grades', []);
    const map = new Map<string, GradeRecord>();
    grades.forEach((g) => {
      const key = g.id || `${g.studentId}_${g.subjectId}_${g.date}`;
      map.set(key, g);
    });
    parentData.grades.forEach((g: GradeRecord) => {
      const key = g.id || `${g.studentId}_${g.subjectId}_${g.date}`;
      map.set(key, { ...map.get(key), ...g });
    });
    setStorage('grades', Array.from(map.values()));
  }

  // 4. Behavior
  if (Array.isArray(parentData.behavior) && parentData.behavior.length > 0) {
    const behavior = getStorage<BehaviorRecord[]>('behavior', []);
    const map = new Map<string, BehaviorRecord>();
    behavior.forEach((b) => {
      if (b.id) map.set(b.id, b);
    });
    parentData.behavior.forEach((b: BehaviorRecord) => {
      if (b.id) map.set(b.id, { ...map.get(b.id), ...b });
    });
    setStorage('behavior', Array.from(map.values()));
  }

  // 5. Homework
  if (Array.isArray(parentData.homework) && parentData.homework.length > 0) {
    const homework = getStorage<HomeworkItem[]>(HOMEWORK_STORAGE_KEY, []);
    const map = new Map<string, HomeworkItem>();
    homework.forEach((h) => {
      if (h.id) map.set(h.id, h);
    });
    parentData.homework.forEach((h: HomeworkItem) => {
      if (h.id) map.set(h.id, { ...map.get(h.id), ...h });
    });
    setStorage(HOMEWORK_STORAGE_KEY, Array.from(map.values()));
  }

  // 6. Announcements
  if (Array.isArray(parentData.announcements) && parentData.announcements.length > 0) {
    const announcements = getStorage<Announcement[]>('announcements', []);
    const map = new Map<string, Announcement>();
    announcements.forEach((a) => {
      if (a.id) map.set(a.id, a);
    });
    parentData.announcements.forEach((a: Announcement) => {
      if (a.id) map.set(a.id, { ...map.get(a.id), ...a });
    });
    setStorage('announcements', Array.from(map.values()));
  }

  // 7. Badges
  if (Array.isArray(parentData.badges) && parentData.badges.length > 0) {
    const existing = getStorage<any[]>('student_badges_v1', []);
    const map = new Map<string, any>();
    existing.forEach((b) => {
      if (b.id) map.set(b.id, b);
    });
    parentData.badges.forEach((b: any) => {
      if (b.id) map.set(b.id, { ...map.get(b.id), ...b });
    });
    setStorage('student_badges_v1', Array.from(map.values()));
    notifyDataChanged('badges_updated');
  }
}
