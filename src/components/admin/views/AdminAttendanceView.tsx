import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Check,
  Building2,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Search,
  Users,
  TrendingUp,
  Flame,
  Trophy,
  Award,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { AttendanceRecord, ClassRoom, Student, AttendanceStatus } from '../../../types/admin';
import { WeeklyAttendanceChartCard } from '../../attendance/WeeklyAttendanceChartCard';
import { getTopSchoolStreaks, getStudentStreakInfo } from '../../../lib/streakStorage';
import { formatArabicNumber } from '../../../lib/utils';
import {
  getPendingAttendanceBatches,
  flushPendingAttendanceQueue,
  PendingAttendanceBatch,
} from '../../../lib/attendanceOfflineSync';

interface AdminAttendanceViewProps {
  schoolId: string;
  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => Promise<void> | void;
  onToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info') => void;
}

// Helper to get Arabic day name
function getArabicDayName(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()] || '';
}

// Helper to format date cleanly
function formatDateArabic(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function AdminAttendanceView({
  schoolId,
  classes,
  students,
  attendance,
  onSaveAttendance,
  onToast,
}: AdminAttendanceViewProps) {
  // Level 1: selectedDate (null = viewing Days List)
  // Level 2: selectedDate is set, selectedClassId is null = viewing Classes List for selectedDate
  // Level 3: selectedDate and selectedClassId are set = viewing Student List for selectedClassId & selectedDate
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Search queries
  const [searchDayQuery, setSearchDayQuery] = useState('');
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  // Local student attendance sheet for Level 3
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [isSaved, setIsSaved] = useState(false);

  const [pendingBatches, setPendingBatches] = useState<PendingAttendanceBatch[]>(() =>
    getPendingAttendanceBatches(schoolId)
  );
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleQueueChange = () => {
      setPendingBatches(getPendingAttendanceBatches(schoolId));
    };
    window.addEventListener('attendance_pending_queue', handleQueueChange);
    window.addEventListener('attendance_queue_flushed', handleQueueChange);
    window.addEventListener('online', handleQueueChange);
    return () => {
      window.removeEventListener('attendance_pending_queue', handleQueueChange);
      window.removeEventListener('attendance_queue_flushed', handleQueueChange);
      window.removeEventListener('online', handleQueueChange);
    };
  }, [schoolId]);

  // Generate recent school days list (excluding Friday=5 and Saturday=6 as weekend vacation days)
  const daysList = useMemo(() => {
    const list: string[] = [];
    const today = new Date();
    let offset = 0;
    while (list.length < 10) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const dayOfWeek = d.getDay();
      // 5 = Friday (الجمعة), 6 = Saturday (السبت)
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        list.push(d.toISOString().split('T')[0]);
      }
      offset++;
    }
    return list;
  }, []);

  // Pre-index attendance records by date and classId for fast O(1) lookups
  const indexedAttendance = useMemo(() => {
    const byDate = new Map<string, AttendanceRecord[]>();
    const byDateAndClass = new Map<string, AttendanceRecord[]>();

    attendance.forEach((r) => {
      if (!r || !r.date) return;
      // Index by Date
      let dateArr = byDate.get(r.date);
      if (!dateArr) {
        dateArr = [];
        byDate.set(r.date, dateArr);
      }
      dateArr.push(r);

      // Index by Date + Class
      if (r.classId) {
        const key = `${r.date}__${r.classId}`;
        let classArr = byDateAndClass.get(key);
        if (!classArr) {
          classArr = [];
          byDateAndClass.set(key, classArr);
        }
        classArr.push(r);
      }
    });

    // Map students count by classId
    const classStudentsCountMap = new Map<string, number>();
    students.forEach((s) => {
      if (s.classId) {
        classStudentsCountMap.set(s.classId, (classStudentsCountMap.get(s.classId) || 0) + 1);
      }
    });

    return { byDate, byDateAndClass, classStudentsCountMap };
  }, [attendance, students]);

  // Compute stats for a specific date across all students/classes
  const getDayStats = (dateStr: string) => {
    const dayRecords = indexedAttendance.byDate.get(dateStr) || [];

    if (dayRecords.length > 0) {
      const presentCount = dayRecords.filter((r) => r.status === 'حاضر' || r.status === 'متأخر').length;
      const absentCount = dayRecords.filter((r) => r.status === 'غائب').length;
      const lateCount = dayRecords.filter((r) => r.status === 'متأخر').length;
      const percentage = Math.round((presentCount / (dayRecords.length || 1)) * 100);

      return {
        presentCount,
        absentCount,
        lateCount,
        totalRecorded: dayRecords.length,
        percentage: Math.min(100, Math.max(0, percentage)),
        hasRecords: true,
      };
    }

    return {
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      totalRecorded: 0,
      percentage: 0,
      hasRecords: false,
    };
  };

  // Compute stats for a specific class on a specific date
  const getClassDayStats = (classId: string, dateStr: string) => {
    const classStudentsCount = indexedAttendance.classStudentsCountMap.get(classId) || 0;
    const classRecords = indexedAttendance.byDateAndClass.get(`${dateStr}__${classId}`) || [];

    if (classRecords.length > 0) {
      const presentCount = classRecords.filter((r) => r.status === 'حاضر' || r.status === 'متأخر').length;
      const absentCount = classRecords.filter((r) => r.status === 'غائب').length;
      const lateCount = classRecords.filter((r) => r.status === 'متأخر').length;
      const percentage = Math.round((presentCount / (classRecords.length || 1)) * 100);

      return {
        presentCount,
        absentCount,
        lateCount,
        totalStudents: classStudentsCount,
        percentage: Math.min(100, Math.max(0, percentage)),
        hasRecords: true,
      };
    }

    return {
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      totalStudents: classStudentsCount,
      percentage: 0,
      hasRecords: false,
    };
  };

  // Level 3 Effect: Initialize student attendance sheet when class & date are selected
  const activeClass = classes.find((c) => c.id === selectedClassId);
  const activeClassStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [selectedClassId, students]);

  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    const existingForClassAndDate = attendance.filter(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );

    const initialSheet: Record<string, { status: AttendanceStatus; notes: string }> = {};

    activeClassStudents.forEach((std) => {
      const match = existingForClassAndDate.find((a) => a.studentId === std.id);
      if (match) {
        initialSheet[std.id] = { status: match.status, notes: match.notes || '' };
      } else {
        initialSheet[std.id] = { status: 'حاضر', notes: '' };
      }
    });

    setRecords(initialSheet);
    setIsSaved(false);
  }, [selectedClassId, selectedDate, attendance, activeClassStudents]);

  // Handle student record edits in Level 3
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
    setIsSaved(false);
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status: prev[studentId]?.status || 'حاضر', notes },
    }));
    setIsSaved(false);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    activeClassStudents.forEach((std) => {
      updated[std.id] = { status: 'حاضر', notes: records[std.id]?.notes || '' };
    });
    setRecords(updated);
    setIsSaved(false);
    onToast('تحديد الكل كـ حاضر', `تم تحضير جميع طلاب ${activeClass?.name || 'الفصل'}`, 'info');
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate) return;
    setIsSaving(true);
    try {
      const toSave: AttendanceRecord[] = activeClassStudents.map((std) => {
        const rec = records[std.id] || { status: 'حاضر', notes: '' };
        return {
          id: `att-${schoolId}-${std.id}-${selectedDate}`,
          schoolId,
          studentId: std.id,
          studentName: std.name,
          classId: selectedClassId,
          className: activeClass?.name || 'الفصل',
          date: selectedDate,
          status: rec.status,
          notes: rec.notes,
        };
      });

      await onSaveAttendance(toSave);
      setIsSaved(true);
      onToast(
        'تم حفظ سجل الحضور والغياب بنجاح في قاعدة البيانات 📝',
        `فصل: ${activeClass?.name || ''} - تاريخ: ${selectedDate}`,
        'success'
      );
    } catch (err: any) {
      onToast('خطأ ❌', err?.message || 'فشل حفظ سجل الحضور في الخادم', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered student list for Level 3
  const filteredStudentsInClass = activeClassStudents.filter((s) => {
    if (!searchStudentQuery.trim()) return true;
    const q = searchStudentQuery.trim().toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(q))
    );
  });

  // Calculate Level 3 current count
  const level3RecordValues = Object.values(records) as Array<{ status: AttendanceStatus; notes: string }>;
  const level3PresentCount = level3RecordValues.filter((r) => r.status === 'حاضر').length;
  const level3LateCount = level3RecordValues.filter((r) => r.status === 'متأخر').length;
  const level3AbsentCount = level3RecordValues.filter((r) => r.status === 'غائب').length;

  // Filtered days list for Level 1
  const filteredDays = daysList.filter((dateStr) => {
    if (!searchDayQuery.trim()) return true;
    const dayName = getArabicDayName(dateStr);
    const formatted = formatDateArabic(dateStr);
    const q = searchDayQuery.trim().toLowerCase();
    return dayName.includes(q) || formatted.includes(q) || dateStr.includes(q);
  });

  // Filtered classes list for Level 2
  const filteredClasses = classes.filter((cls) => {
    if (!searchClassQuery.trim()) return true;
    const q = searchClassQuery.trim().toLowerCase();
    return cls.name.toLowerCase().includes(q) || (cls.gradeLevel && cls.gradeLevel.toLowerCase().includes(q));
  });

  // Top Streaks in School
  const topSchoolStreaks = useMemo(() => {
    return getTopSchoolStreaks(schoolId, 6);
  }, [schoolId, attendance]);

  // =========================================================================
  // LEVEL 3: Student Attendance List View
  // =========================================================================
  if (selectedDate && selectedClassId) {
    return (
      <div className="space-y-6 dir-rtl">
        {/* Navigation Breadcrumb & Back Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedClassId(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لفصول اليوم</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedClassId(null);
                  setSelectedDate(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition-all cursor-pointer"
              >
                <span>العودة لكافة الأيام</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-emerald-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تحضير الكل حاضر</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'تم الحفظ' : 'حفظ سجل الحضور'}</span>
              </button>
            </div>
          </div>

          {/* Header Info Banner */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-blue-900 font-black text-base sm:text-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>كشف حضور طلاب: {activeClass?.name || 'الفصل'}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                تاريخ اليوم: <span className="font-bold text-slate-800">{getArabicDayName(selectedDate)} ({formatDateArabic(selectedDate)})</span>
              </p>
            </div>

            {/* Class Stats Badges */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200/60 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                حاضر: {level3PresentCount}
              </span>
              <span className="px-3 py-1.5 bg-amber-100/80 text-amber-800 rounded-xl border border-amber-200/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                متأخر: {level3LateCount}
              </span>
              <span className="px-3 py-1.5 bg-red-100/80 text-red-800 rounded-xl border border-red-200/60 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                غائب: {level3AbsentCount}
              </span>
            </div>
          </div>
        </div>

        {/* Search Input for Student Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
              placeholder="ابحث برقم الطالب أو اسمه..."
              className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-xs font-bold text-slate-500">
            إجمالي الطلاب: {filteredStudentsInClass.length} طالب
          </span>
        </div>

        {/* Student Attendance Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">كود الطالب</th>
                  <th className="px-5 py-3.5">اسم الطالب الرباعي</th>
                  <th className="px-5 py-3.5 text-center">حالة الحضور</th>
                  <th className="px-5 py-3.5">ملاحظات ومبررات الغياب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudentsInClass.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-bold">
                      لا يوجد طلاب ينطبق عليهم هذا البحث في {activeClass?.name}
                    </td>
                  </tr>
                ) : (
                  filteredStudentsInClass.map((std, idx) => {
                    const currentRec = records[std.id] || { status: 'حاضر', notes: '' };
                    const stdStreak = getStudentStreakInfo(std.id, schoolId);
                    return (
                      <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-600 font-bold">
                          {std.studentCode || `STD-${std.id.slice(-4)}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 block">{std.name}</span>
                            {stdStreak.currentStreak >= 3 && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 shrink-0"
                                title={`سلسلة مواظبة متصلة: ${stdStreak.currentStreak} يوم`}
                              >
                                <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
                                <span>{formatArabicNumber(stdStreak.currentStreak)} يوم</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(std.id, 'حاضر')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                currentRec.status === 'حاضر'
                                  ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(std.id, 'متأخر')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                currentRec.status === 'متأخر'
                                  ? 'bg-amber-600 text-white shadow-2xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              متأخر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(std.id, 'غائب')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                currentRec.status === 'غائب'
                                  ? 'bg-red-600 text-white shadow-2xs scale-105'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              غائب
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <input
                            type="text"
                            value={currentRec.notes}
                            onChange={(e) => handleNotesChange(std.id, e.target.value)}
                            placeholder="اكتب ملاحظة أو السبب..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LEVEL 2: Classes Cards Grid for Selected Date (3 cards in a row)
  // =========================================================================
  if (selectedDate && !selectedClassId) {
    const dayName = getArabicDayName(selectedDate);
    const formattedDate = formatDateArabic(selectedDate);
    const dayOverallStats = getDayStats(selectedDate);

    return (
      <div className="space-y-6 dir-rtl">
        {/* Header with Back Button */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لكافة الأيام</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>اليوم المحدد: {dayName} ({formattedDate})</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-snug">
                سجل حضور الصفوف والمراحل ليوم {dayName}
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                اضغط على أي صف للاطلاع على كشف الحضور التفصيلي وتعديله
              </p>
            </div>

            {/* Overall Day Pill Metrics */}
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <span className="px-3.5 py-2 bg-blue-600 text-white rounded-xl shadow-2xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                نسبة اليوم العامة: {dayOverallStats.percentage}%
              </span>
              <span className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80">
                حضور: {dayOverallStats.presentCount}
              </span>
              <span className="px-3 py-2 bg-red-50 text-red-800 rounded-xl border border-red-200/80">
                غياب: {dayOverallStats.absentCount}
              </span>
            </div>
          </div>

          {/* Search Filter for Classes */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchClassQuery}
              onChange={(e) => setSearchClassQuery(e.target.value)}
              placeholder="ابحث باسم الفصل أو المرحلة..."
              className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Classes Cards Grid (3 in a row) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-bold">
              لا توجد فصول دراسية تطابق البحث
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const cStats = getClassDayStats(cls.id, selectedDate);
              const isHighRatio = cStats.percentage >= 85;
              const isMidRatio = cStats.percentage >= 70 && cStats.percentage < 85;

              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  {/* Class Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold rounded-md">
                        {cls.gradeLevel || 'المرحلة الدراسية'}
                      </span>
                      <h3 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                        {cls.name}
                      </h3>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">نسبة الحضور</span>
                      <span
                        className={`text-base font-black font-mono ${
                          !cStats.hasRecords
                            ? 'text-slate-400'
                            : isHighRatio
                            ? 'text-emerald-600'
                            : isMidRatio
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {cStats.hasRecords ? `${cStats.percentage}%` : 'غير مرصود'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">عدد الحضور</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {cStats.presentCount}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">عدد الغياب</span>
                      <span className="text-sm font-black text-red-600 font-mono">
                        {cStats.absentCount}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1 border-t border-slate-100">
                    <span>رائد الفصل: {cls.headTeacherName || 'غير محدد'}</span>
                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      عرض الطلاب
                      <ChevronLeft className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // LEVEL 1: Main Days Cards Grid (3 cards in a row)
  // =========================================================================
  return (
    <div className="space-y-6 dir-rtl">
      {/* Offline Pending Queue Notice */}
      {pendingBatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-amber-950">
                يوجد {pendingBatches.length} كشف حضور محفوظ محلياً بانتظار المزامنة مع الخادم المركزي
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                تم حفظ سجلات الحضور بأمان على هذا الجهاز في وضع عدم الاتصال لمنع فقدان البيانات. ستتم المزامنة تلقائياً بمجرد عودة الإنترنت.
              </p>
              {queueMessage && (
                <p className="text-xs font-bold text-blue-700 bg-blue-100/70 p-1.5 rounded-lg border border-blue-200 mt-1.5 inline-block">
                  {queueMessage}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={isSyncingQueue}
            onClick={async () => {
              setIsSyncingQueue(true);
              setQueueMessage(null);
              try {
                const res = await flushPendingAttendanceQueue(schoolId);
                setQueueMessage(res.message);
                setPendingBatches(getPendingAttendanceBatches(schoolId));
              } catch (e: any) {
                setQueueMessage('تعذرت المزامنة: يرجى التحقق من اتصال الإنترنت.');
              } finally {
                setIsSyncingQueue(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
            <span>{isSyncingQueue ? 'جارِ المزامنة...' : 'مزامنة السجلات الآن'}</span>
          </button>
        </div>
      )}

      {/* Title & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">سجلات الحضور والغياب اليومية</h2>
          </div>
          <p className="text-xs text-slate-500 font-bold mt-1">
            اختر اليوم لاستعراض نسبة الحضور وإحصائيات الفصول بالتفصيل
          </p>
        </div>

        {/* Search Input for Days */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchDayQuery}
            onChange={(e) => setSearchDayQuery(e.target.value)}
            placeholder="ابحث باليوم أو التاريخ (مثال: الخميس)..."
            className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Weekly Attendance Rate Card */}
      <WeeklyAttendanceChartCard percentage={92} />

      {/* Top Attendance Streaks Honor Board */}
      {topSchoolStreaks.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>لوحة شرف سلاسل المواظبة</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    أعلى الطلاب التزاماً
                  </span>
                </h3>
                <p className="text-[11px] font-bold text-slate-500">
                  الطلاب الأكثر مواظبة على الحضور دون انقطاع
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>مكافآت التميز ونقاط المواظبة</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topSchoolStreaks.map((item, idx) => {
              const matchedStudent = students.find((s) => s.id === item.studentId);
              return (
                <div
                  key={item.studentId}
                  className="bg-white/90 backdrop-blur-xs border border-amber-100 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-amber-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-white shadow-2xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {item.studentName}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        {matchedStudent?.className || item.streakTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                    <span className="text-xs font-black font-mono">
                      {formatArabicNumber(item.currentStreak)}
                    </span>
                    <span className="text-[10px] font-bold">يوم</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Days Grid (3 in a row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredDays.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-bold">
            لا توجد أيام تطابق بحثك
          </div>
        ) : (
          filteredDays.map((dateStr) => {
            const dayName = getArabicDayName(dateStr);
            const formattedDate = formatDateArabic(dateStr);
            const dStats = getDayStats(dateStr);

            const isHighRatio = dStats.percentage >= 85;
            const isMidRatio = dStats.percentage >= 70 && dStats.percentage < 85;

            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`bg-white hover:bg-slate-50/80 border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden ${
                  isToday
                    ? 'border-blue-400 ring-2 ring-blue-600/10'
                    : 'border-slate-200/80 hover:border-blue-400'
                }`}
              >
                {/* Today Badge */}
                {isToday && (
                  <div className="absolute top-0 left-0 bg-blue-600 text-white font-extrabold text-[9px] px-3 py-1 rounded-br-xl shadow-xs">
                    اليوم الحالي
                  </div>
                )}

                {/* Day Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {dayName}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">
                      {formattedDate}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                {/* Core Metrics Cards Inside Day Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-3">
                  {/* Percentage Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">نسبة الحضور</span>
                    <span
                      className={`text-lg font-black font-mono ${
                        !dStats.hasRecords
                          ? 'text-slate-400'
                          : isHighRatio
                          ? 'text-emerald-600'
                          : isMidRatio
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {dStats.hasRecords ? `${dStats.percentage}%` : 'غير مرصود'}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        !dStats.hasRecords
                          ? 'bg-slate-300'
                          : isHighRatio
                          ? 'bg-emerald-500'
                          : isMidRatio
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${dStats.hasRecords ? dStats.percentage : 0}%` }}
                    />
                  </div>

                  {/* Attendance & Absence Count Row */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-200/60">
                    <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2">
                      <span className="block text-[10px] font-bold text-emerald-800">عدد الحضور</span>
                      <span className="text-base font-black text-emerald-700 font-mono">
                        {dStats.presentCount}
                      </span>
                    </div>

                    <div className="bg-red-50/80 border border-red-100 rounded-xl p-2">
                      <span className="block text-[10px] font-bold text-red-800">عدد الغياب</span>
                      <span className="text-base font-black text-red-600 font-mono">
                        {dStats.absentCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Click Action Callout */}
                <div className="flex items-center justify-between text-xs font-extrabold text-blue-600 pt-1">
                  <span>استعراض فصول اليوم</span>
                  <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

