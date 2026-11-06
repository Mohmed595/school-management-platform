import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { ROLE_AVATARS } from '../../lib/avatarLayouts';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Building2,
  Users,
  Timer,
  Play,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Printer,
  X,
  ShieldAlert,
  ChevronRight,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  getArabicFormattedTodayDate,
  checkSchoolAttendanceStatusForDate,
  getAttendanceSessionForDate,
} from '../../lib/attendanceStorage';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getAttendanceBySchool,
  getStorage,
} from '../../lib/adminStorage';
import { WeeklyAttendanceChartCard } from './WeeklyAttendanceChartCard';
import { getTopSchoolStreaks } from '../../lib/streakStorage';
import { formatArabicNumber } from '../../lib/utils';
import { ClassRoom, Student, AttendanceRecord } from '../../types/admin';
import { getGradeLevelFromClassName } from '../../lib/egyptianSchoolUtils';
import { AttendanceTab } from './AttendanceTeacherSidebar';

interface AttendanceTeacherHomeProps {
  schoolId: string;
  schoolName: string;
  teacherName: string;
  classes?: ClassRoom[];
  students?: Student[];
  onStartWizard: (classId?: string) => void;
  onNavigateTab?: (tab: AttendanceTab) => void;
}

export function AttendanceTeacherHome({
  schoolId,
  schoolName,
  teacherName,
  classes,
  students,
  onStartWizard,
  onNavigateTab,
}: AttendanceTeacherHomeProps) {
  const [, setRefreshKey] = useState(0);

  // Active view filters
  const [classSearchTerm, setClassSearchTerm] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [classStatusFilter, setClassStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'absent' | 'consecutive' | 'late'>('all');
  const [watchlistSearch, setWatchlistSearch] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('school_data_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('school_data_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const todayInfo = getArabicFormattedTodayDate();
  const status = checkSchoolAttendanceStatusForDate(schoolId, todayInfo.isoDate);
  const sessionInfo = getAttendanceSessionForDate(schoolId, todayInfo.isoDate);

  // School data resolution
  const schoolClasses = useMemo(() => {
    return (classes && classes.length > 0) ? classes : getClassesBySchool(schoolId);
  }, [classes, schoolId]);

  const schoolStudents = useMemo(() => {
    return (students && students.length > 0) ? students : getStudentsBySchool(schoolId);
  }, [students, schoolId]);

  // Today's attendance records from database/storage
  const todayRecords = useMemo(() => {
    return getAttendanceBySchool(schoolId, todayInfo.isoDate);
  }, [schoolId, todayInfo.isoDate]);

  // Group today's records by classId
  const recordsByClassId = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    todayRecords.forEach((rec) => {
      if (!rec.classId) return;
      let list = map.get(rec.classId);
      if (!list) {
        list = [];
        map.set(rec.classId, list);
      }
      list.push(rec);
    });
    return map;
  }, [todayRecords]);

  // Students by class map
  const studentsByClassId = useMemo(() => {
    const map = new Map<string, Student[]>();
    schoolStudents.forEach((st) => {
      const cId = st.classId || 'unassigned';
      let list = map.get(cId);
      if (!list) {
        list = [];
        map.set(cId, list);
      }
      list.push(st);
    });
    return map;
  }, [schoolStudents]);

  // Real attendance rate calculation
  const totalRecorded = status.presentCount + status.absentCount + status.lateCount;
  const attendanceRate = totalRecorded > 0
    ? Math.round(((status.presentCount + status.lateCount) / totalRecorded) * 100)
    : (status.isCompleted ? 100 : 0);

  const unassignedStudentsCount = useMemo(() => {
    return schoolStudents.filter((s) => s.isClassAssigned === false || !s.classId).length;
  }, [schoolStudents]);

  // Distinct grade levels in school for clean tabs
  const gradeLevels = useMemo(() => {
    const set = new Set<string>();
    schoolClasses.forEach((c) => {
      const g = c.gradeLevel || getGradeLevelFromClassName(c.name);
      if (g) set.add(g);
    });
    return Array.from(set);
  }, [schoolClasses]);

  // Class completion stats
  const classStatusList = useMemo(() => {
    return schoolClasses.map((cls) => {
      const recs = recordsByClassId.get(cls.id) || [];
      const enrolledStudents = studentsByClassId.get(cls.id) || [];
      const studentCount = enrolledStudents.length || cls.studentCount || 0;
      const isCompleted = recs.length > 0 || status.isCompleted;

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      if (recs.length > 0) {
        recs.forEach((r) => {
          if (r.status === 'حاضر') presentCount++;
          else if (r.status === 'غائب') absentCount++;
          else if (r.status === 'متأخر') lateCount++;
        });
      } else if (isCompleted) {
        presentCount = studentCount;
      }

      const total = presentCount + absentCount + lateCount;
      const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

      return {
        cls,
        studentCount,
        isCompleted,
        presentCount,
        absentCount,
        lateCount,
        rate,
      };
    });
  }, [schoolClasses, recordsByClassId, studentsByClassId, status.isCompleted]);

  const completedClassesCount = classStatusList.filter((c) => c.isCompleted).length;
  const pendingClassesCount = schoolClasses.length - completedClassesCount;
  const schoolProgressPercent = schoolClasses.length > 0
    ? Math.round((completedClassesCount / schoolClasses.length) * 100)
    : 0;

  // Filtered classes according to user selection
  const filteredClasses = useMemo(() => {
    return classStatusList.filter(({ cls, isCompleted }) => {
      // Grade filter
      if (selectedGradeFilter !== 'all') {
        const g = cls.gradeLevel || getGradeLevelFromClassName(cls.name);
        if (g !== selectedGradeFilter) return false;
      }
      // Status filter
      if (classStatusFilter === 'pending' && isCompleted) return false;
      if (classStatusFilter === 'completed' && !isCompleted) return false;

      // Search term
      if (classSearchTerm.trim()) {
        const query = classSearchTerm.trim().toLowerCase();
        const matchName = cls.name.toLowerCase().includes(query);
        const matchGrade = (cls.gradeLevel || '').toLowerCase().includes(query);
        const matchRoom = (cls.roomNumber || '').toLowerCase().includes(query);
        if (!matchName && !matchGrade && !matchRoom) return false;
      }

      return true;
    });
  }, [classStatusList, selectedGradeFilter, classStatusFilter, classSearchTerm]);

  // Watchlist: compute absent and late students today + calculate consecutive absences
  const allSchoolAttendance = useMemo(() => {
    return getStorage<AttendanceRecord[]>('attendance', []).filter((a) => a.schoolId === schoolId);
  }, [schoolId]);

  const watchlistItems = useMemo(() => {
    // Map of studentId -> past dates marked as absent before today
    const pastAbsentDatesByStudent = new Map<string, string[]>();
    allSchoolAttendance.forEach((rec) => {
      if (rec.status === 'غائب' && rec.date !== todayInfo.isoDate) {
        let dates = pastAbsentDatesByStudent.get(rec.studentId);
        if (!dates) {
          dates = [];
          pastAbsentDatesByStudent.set(rec.studentId, dates);
        }
        dates.push(rec.date);
      }
    });

    const items: Array<{
      student: Student;
      className: string;
      status: 'غائب' | 'متأخر';
      consecutiveDays: number;
      isCriticalDropoutRisk: boolean;
    }> = [];

    todayRecords.forEach((rec) => {
      if (rec.status === 'غائب' || rec.status === 'متأخر') {
        const student = schoolStudents.find((s) => s.id === rec.studentId) || {
          id: rec.studentId,
          schoolId,
          name: rec.studentName || 'طالب',
          nationalId: '',
          classId: rec.classId || '',
          className: rec.className || 'الفصل',
          birthDate: '',
          gender: 'ذكر' as const,
          status: 'منتظم' as const,
          parentName: 'ولي الأمر',
          parentPhone: '01000000000',
          address: '',
          joinDate: '',
        };

        let consecutive = 1;
        if (rec.status === 'غائب') {
          const pastAbsents = pastAbsentDatesByStudent.get(rec.studentId) || [];
          // Count recent consecutive days
          consecutive += Math.min(pastAbsents.length, 5);
        }

        const isCriticalDropoutRisk = rec.status === 'غائب' && consecutive >= 3;

        items.push({
          student,
          className: rec.className || student.className || 'الفصل',
          status: rec.status as 'غائب' | 'متأخر',
          consecutiveDays: consecutive,
          isCriticalDropoutRisk,
        });
      }
    });

    return items;
  }, [todayRecords, allSchoolAttendance, schoolStudents, schoolId, todayInfo.isoDate]);

  const filteredWatchlist = useMemo(() => {
    return watchlistItems.filter((item) => {
      if (watchlistFilter === 'absent' && item.status !== 'غائب') return false;
      if (watchlistFilter === 'late' && item.status !== 'متأخر') return false;
      if (watchlistFilter === 'consecutive' && !item.isCriticalDropoutRisk) return false;

      if (watchlistSearch.trim()) {
        const q = watchlistSearch.trim().toLowerCase();
        const matchName = item.student.name.toLowerCase().includes(q);
        const matchClass = item.className.toLowerCase().includes(q);
        const matchPhone = (item.student.parentPhone || '').includes(q);
        if (!matchName && !matchClass && !matchPhone) return false;
      }

      return true;
    });
  }, [watchlistItems, watchlistFilter, watchlistSearch]);

  const criticalDropoutCount = watchlistItems.filter((i) => i.isCriticalDropoutRisk).length;

  return (
    <div className="space-y-6 font-['Cairo',sans-serif] dir-rtl pb-10">
      {/* ================= 1. VERIFIED OPERATIONAL HEADER ================= */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <AvatarDisplay layoutUid={ROLE_AVATARS.ATTENDANCE_TEACHER} size="md" showGlow={true} />
            <div>
              {/* Quiet unboxed metadata with subtle dot separators */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                <span className="font-semibold text-blue-700">{todayInfo.fullFormatted}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>العام الدراسي 2026/2027</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-700 font-bold">{schoolName}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                لوحة مسؤول الحضور والغياب اليومي
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                المسؤول المعتمد: <span className="font-bold text-slate-800">{teacherName}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Status Control */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer flex items-center gap-2 border border-slate-200/70"
              title="طباعة التقرير اليومي الرسمي"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>طباعة كشف اليوم</span>
            </button>

            <button
              onClick={() => onStartWizard()}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${
                status.isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
              }`}
            >
              {status.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>مراجعة أو تعديل الرصد</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>بدء رصد الحضور الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ================= 2. OPERATIONAL PROGRESS / HERO CALLOUT ================= */}
      {!status.isCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold">
                <Timer className="w-4 h-4 text-amber-300" />
                <span>جلسة الرصد اليومي نشطة</span>
                <span aria-hidden="true">·</span>
                <span>{todayInfo.dayName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {schoolClasses.length > 0 && completedClassesCount > 0
                  ? `تم رصد ${completedClassesCount} من ${schoolClasses.length} فصول (${schoolProgressPercent}%)`
                  : 'رصد الحضور الصباحي لكافة فصول المدرسة'}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                {unassignedStudentsCount > 0
                  ? `يوجد ${unassignedStudentsCount} طالباً سيتم تأكيد توزيعهم على فصولهم أثناء الرصد لمرة واحدة تلقائياً.`
                  : `متبقي ${pendingClassesCount} فصول بحاجة لإتمام رصد الحضور واعتماد كشوف الطلاب اليومية.`}
              </p>

              {/* School Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-200 mb-1">
                  <span>نسبة إنجاز المدرسة اليوم</span>
                  <span className="font-mono tabular-nums">{schoolProgressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-blue-950/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, schoolProgressPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onStartWizard()}
                className="px-6 py-3.5 bg-white text-blue-800 hover:bg-blue-50 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <Play className="w-4 h-4 fill-blue-800 text-blue-800 group-hover:scale-110 transition-transform" />
                <span>استكمال رصد فصول المدرسة</span>
                <ArrowLeft className="w-4 h-4 text-blue-600 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold mb-0.5">
                <span>تم اعتماد وتوثيق حضور اليوم بالكامل ✓</span>
                {sessionInfo?.completedAt && (
                  <>
                    <span aria-hidden="true" className="text-emerald-400">·</span>
                    <span className="font-mono tabular-nums">الساعة {sessionInfo.completedAt}</span>
                  </>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                كافة فصول المدرسة ({schoolClasses.length} فصلاً) مسجلة ومعتمدة لدى إدارة المدرسة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                نسبة الحضور الإجمالية اليوم بلغت <strong className="text-emerald-700 font-mono tabular-nums">{attendanceRate}%</strong> عبر {status.totalStudents} طالباً.
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartWizard()}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            تعديل أو مراجعة السجلات
          </button>
        </motion.div>
      )}

      {/* ================= 3. TABULAR METRICS STRIP ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">معدل الحضور</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono tabular-nums">
            {attendanceRate}%
          </div>
          <p className="text-[11px] text-slate-400 font-medium">مواظبة اليوم المدرسي</p>
        </div>

        {/* Metric 2: Present */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-emerald-700">حاضر</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {status.presentCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">طالب ملتزم بالحضور</p>
        </div>

        {/* Metric 3: Absent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-red-700">غائب</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 font-mono tabular-nums">
            {status.absentCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">حالات غياب اليوم</p>
        </div>

        {/* Metric 4: Late */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-amber-700">متأخر</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
            {status.lateCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">تأخر صباحي</p>
        </div>

        {/* Metric 5: Classes */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">فصول المدرسة</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {completedClassesCount} <span className="text-xs font-bold text-slate-400">/ {schoolClasses.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {pendingClassesCount === 0 ? 'اكتملت جميع الفصول' : `متبقي ${pendingClassesCount} فصول`}
          </p>
        </div>
      </div>

      {/* ================= 4. CLASSROOM ATTENDANCE DIRECTORY ================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>فصول المدرسة ومتابعة الرصد اليومي</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك رصد أي فصل مباشرة أو مراجعة كشوف الطلاب والغياب لكل غرفة دراسية.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={classSearchTerm}
              onChange={(e) => setClassSearchTerm(e.target.value)}
              placeholder="ابحث باسم الفصل أو المرحلة..."
              className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setClassStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                classStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة الفصول ({schoolClasses.length})
            </button>
            <button
              onClick={() => setClassStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                classStatusFilter === 'pending'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              في انتظار الرصد ({pendingClassesCount})
            </button>
            <button
              onClick={() => setClassStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                classStatusFilter === 'completed'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المكتملة ({completedClassesCount})
            </button>
          </div>

          {/* Grade Selector */}
          {gradeLevels.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
              <button
                onClick={() => setSelectedGradeFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGradeFilter === 'all'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:text-slate-800 bg-slate-50 border border-transparent'
                }`}
              >
                جميع الصفوف
              </button>
              {gradeLevels.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGradeFilter(g)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedGradeFilter === g
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-500 hover:text-slate-800 bg-slate-50 border border-transparent'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Classes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-bold text-slate-600">لا توجد فصول مطابقة للبحث أو الفلتر المحدد</p>
            </div>
          ) : (
            filteredClasses.map(({ cls, studentCount, isCompleted, presentCount, absentCount, lateCount, rate }) => (
              <div
                key={cls.id}
                className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-3 ${
                  isCompleted
                    ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    : 'bg-amber-50/20 border-amber-200/70 hover:border-amber-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>{cls.name}</span>
                        {cls.roomNumber && (
                          <span className="text-[11px] font-medium text-slate-400">
                            (غرفة {cls.roomNumber})
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cls.gradeLevel || getGradeLevelFromClassName(cls.name)} ·{' '}
                        <span className="font-bold text-slate-700 font-mono tabular-nums">{studentCount}</span> طالب
                      </p>
                    </div>

                    {isCompleted ? (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>معتمد</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>في الانتظار</span>
                      </span>
                    )}
                  </div>

                  {/* Attendance Rate & Breakdown */}
                  {isCompleted ? (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">نسبة الحضور:</span>
                        <span className="font-mono text-blue-700 tabular-nums">{rate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 font-medium">
                        <span className="text-emerald-700 font-semibold">{presentCount} حاضر</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-red-600 font-semibold">{absentCount} غائب</span>
                        {lateCount > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-amber-700 font-semibold">{lateCount} متأخر</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-amber-100/70 text-xs text-amber-800">
                      لم يتم تسجيل كشف حضور هذا الفصل لليوم بعد.
                    </div>
                  )}
                </div>

                {/* Direct Action Button */}
                <button
                  onClick={() => onStartWizard(cls.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCompleted
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <span>مراجعة وتعديل الفصل</span>
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>رصد حضور هذا الفصل</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= 5. DAILY ABSENCE & RISK WATCHLIST ================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>كشف الغياب اليومي وحالات المتابعة الحرجة</span>
              </h2>
              {criticalDropoutCount > 0 && (
                <span className="text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  {criticalDropoutCount} إنذار غياب متتالي
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة مباشرة للطلاب الغائبين اليوم وحالات الغياب المتكرر للتواصل مع أولياء الأمور ومنع التسرب.
            </p>
          </div>

          {/* Search in Watchlist */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={watchlistSearch}
              onChange={(e) => setWatchlistSearch(e.target.value)}
              placeholder="ابحث باسم الطالب أو الفصل..."
              className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Watchlist Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          <button
            onClick={() => setWatchlistFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              watchlistFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            الكل ({watchlistItems.length})
          </button>
          <button
            onClick={() => setWatchlistFilter('absent')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              watchlistFilter === 'absent'
                ? 'bg-red-600 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            الغياب اليومي ({watchlistItems.filter((i) => i.status === 'غائب').length})
          </button>
          <button
            onClick={() => setWatchlistFilter('consecutive')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              watchlistFilter === 'consecutive'
                ? 'bg-red-700 text-white'
                : 'text-red-700 hover:bg-red-100 bg-red-50 border border-red-200'
            }`}
          >
            إنذار غياب 3+ أيام ({criticalDropoutCount})
          </button>
          <button
            onClick={() => setWatchlistFilter('late')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
              watchlistFilter === 'late'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            المتأخرون صباحاً ({watchlistItems.filter((i) => i.status === 'متأخر').length})
          </button>
        </div>

        {/* Watchlist Table / List */}
        {filteredWatchlist.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-xs font-bold text-slate-700">لا توجد حالات غياب أو تأخير مسجلة في هذا القسم</p>
            <p className="text-[11px] text-slate-400 mt-0.5">نسبة الانضباط ممتازة لليوم</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">اسم الطالب</th>
                  <th className="py-2.5 px-3">الفصل</th>
                  <th className="py-2.5 px-3">الحالة اليوم</th>
                  <th className="py-2.5 px-3">توالي الغياب</th>
                  <th className="py-2.5 px-3">ولي الأمر</th>
                  <th className="py-2.5 px-3 text-center">إجراء التواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWatchlist.map((item) => (
                  <tr
                    key={item.student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.isCriticalDropoutRisk ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.isCriticalDropoutRisk && (
                          <span title="إنذار غياب رسمي">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          </span>
                        )}
                        <span>{item.student.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{item.className}</td>
                    <td className="py-2.5 px-3 font-bold">
                      {item.status === 'غائب' ? (
                        <span className="text-red-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {item.consecutiveDays > 1 ? (
                        <span
                          className={`font-bold ${
                            item.consecutiveDays >= 3 ? 'text-red-700 font-black' : 'text-slate-700'
                          }`}
                        >
                          {item.consecutiveDays} أيام متتالية
                        </span>
                      ) : (
                        <span className="text-slate-400">يوم واحد</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>
                        <p className="font-medium text-slate-800">{item.student.parentName || 'ولي الأمر'}</p>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {item.student.parentPhone || 'غير مسجل'}
                        </p>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.student.parentPhone ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`tel:${item.student.parentPhone}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                            title="اتصال هاتفي"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/2${item.student.parentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `السلام عليكم، نفيدكم بغياب الطالب/ة ${item.student.name} اليوم عن مدرسة ${schoolName}. نرجو الاطمئنان وإفادتنا.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="إرسال رسالة واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">لا يوجد هاتف</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 6. WEEKLY ATTENDANCE GRAPH ================= */}
      <WeeklyAttendanceChartCard
        schoolId={schoolId}
        percentage={attendanceRate}
        title="التحليل البياني للحضور الأسبوعي"
        singleWeekOnly={true}
      />

      {/* ================= 7. TOP ATTENDANCE STREAKS ================= */}
      {(() => {
        const topStreaks = getTopSchoolStreaks(schoolId, 3);
        if (topStreaks.length === 0) return null;
        return (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    أبطال الالتزام وسلاسل المواظبة بالمدرسة 🔥
                  </h3>
                  <p className="text-xs text-slate-500">
                    الطلاب الأكثر انتظاماً دون انقطاع لتكريمهم وتحفيز السلوك الإيجابي.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab?.('leaderboard')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                عرض لوحة الأوائل ←
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topStreaks.map((item, idx) => (
                <div
                  key={item.studentId}
                  className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.studentName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.streakTitle || 'طالب متميز'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono tabular-nums shrink-0">
                    <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{formatArabicNumber(item.currentStreak)} يوم</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ================= 8. PRINTABLE OFFICIAL DAILY REPORT MODAL ================= */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 print:p-0 print:border-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    كشف الحضور والغياب اليومي الرسمي
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {schoolName} · تاريخ {todayInfo.fullFormatted}
                  </p>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">إجمالي الطلاب</span>
                  <strong className="text-sm font-black font-mono tabular-nums">{status.totalStudents}</strong>
                </div>
                <div>
                  <span className="text-emerald-700 block">الحاضرين</span>
                  <strong className="text-sm font-black text-emerald-700 font-mono tabular-nums">{status.presentCount}</strong>
                </div>
                <div>
                  <span className="text-red-700 block">الغائبين</span>
                  <strong className="text-sm font-black text-red-700 font-mono tabular-nums">{status.absentCount}</strong>
                </div>
                <div>
                  <span className="text-blue-700 block">نسبة الحضور</span>
                  <strong className="text-sm font-black text-blue-700 font-mono tabular-nums">{attendanceRate}%</strong>
                </div>
              </div>

              {/* Class by class breakdown */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2 px-3">الفصل</th>
                      <th className="py-2 px-3">المرحلة</th>
                      <th className="py-2 px-3 text-center">المقيدين</th>
                      <th className="py-2 px-3 text-center">حاضر</th>
                      <th className="py-2 px-3 text-center">غائب</th>
                      <th className="py-2 px-3 text-center">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStatusList.map(({ cls, studentCount, presentCount, absentCount, rate }) => (
                      <tr key={cls.id}>
                        <td className="py-2 px-3 font-bold text-slate-900">{cls.name}</td>
                        <td className="py-2 px-3 text-slate-500">{cls.gradeLevel}</td>
                        <td className="py-2 px-3 text-center font-mono tabular-nums">{studentCount}</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-bold font-mono tabular-nums">{presentCount}</td>
                        <td className="py-2 px-3 text-center text-red-600 font-bold font-mono tabular-nums">{absentCount}</td>
                        <td className="py-2 px-3 text-center font-bold text-blue-700 font-mono tabular-nums">{rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature section */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 px-4">
                <div>
                  <p className="font-bold">مسؤول الحضور والغياب:</p>
                  <p className="mt-1 text-slate-900 font-black">{teacherName}</p>
                </div>
                <div>
                  <p className="font-bold">مدير المدرسة:</p>
                  <p className="mt-1 text-slate-400">.................................</p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
