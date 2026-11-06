import React, { useState, useEffect } from 'react';
import { ParentPortalData } from '../../../types/parent';
import { AttendanceRecord } from '../../../types/admin';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  AlertCircle,
  Info,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';
import { formatArabicNumber } from '../../../lib/utils';
import { AttendanceStreakCard } from '../../ui/AttendanceStreakCard';
import { getStudentStreakInfo } from '../../../lib/streakStorage';

interface ParentAttendanceViewProps {
  data: ParentPortalData;
}

export function ParentAttendanceView({ data }: ParentAttendanceViewProps) {
  const { attendance = [], stats, student, streak: initialStreak } = data;

  const streak = initialStreak || (student ? getStudentStreakInfo(student.id, student.schoolId) : undefined);

  // Derive real statistics from attendance records or stats prop
  const presentDays =
    stats?.presentDays !== undefined
      ? stats.presentDays
      : attendance.filter((a) => a.status === 'حاضر').length;

  const absentDays =
    stats?.absentDays !== undefined
      ? stats.absentDays
      : attendance.filter((a) => a.status === 'غائب').length;

  const lateDays =
    stats?.lateDays !== undefined
      ? stats.lateDays
      : attendance.filter((a) => a.status === 'متأخر').length;

  const totalRecordedDays = presentDays + absentDays + lateDays;
  const realPercent =
    totalRecordedDays > 0 ? Math.round(((presentDays + lateDays) / totalRecordedDays) * 100) : 0;

  // Smooth animated counter for top percentage
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    if (totalRecordedDays === 0) {
      setAnimatedPercent(0);
      return;
    }
    let start = 0;
    const duration = 300;
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = (realPercent - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment >= 0 && start >= realPercent) || (increment < 0 && start <= realPercent)) {
        setAnimatedPercent(realPercent);
        clearInterval(timer);
      } else {
        setAnimatedPercent(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [realPercent, totalRecordedDays]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState<{
    dateStr: string;
    dayNum: number;
    status?: string;
    notes?: string;
    className?: string;
  } | null>(null);

  const [showFullHistory, setShowFullHistory] = useState(false);

  // Map attendance records by date YYYY-MM-DD
  const attendanceMap: Record<string, AttendanceRecord> = {};
  attendance.forEach((rec) => {
    if (rec.date) {
      attendanceMap[rec.date] = rec;
    }
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDayOfMonth.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday

  const monthNames = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Status mapping and human tone
  const getHumanStatusDetails = (pct: number) => {
    if (pct >= 90) {
      return {
        label: 'ممتاز',
        badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        message: 'حضورك هذا العام الدراسي ممتاز.',
        ringColor: 'text-emerald-500',
        icon: Sparkles,
      };
    }
    if (pct >= 80) {
      return {
        label: 'جيد جداً',
        badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
        message: 'حضورك جيد جداً، استمر بنفس الالتزام.',
        ringColor: 'text-blue-500',
        icon: CheckCircle2,
      };
    }
    if (pct >= 70) {
      return {
        label: 'جيد',
        badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
        message: 'حضورك جيد، حاول الحفاظ على الحضور بانتظام.',
        ringColor: 'text-amber-500',
        icon: AlertCircle,
      };
    }
    return {
      label: 'يحتاج إلى تحسين',
      badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
      message: 'حاول المحافظة على حضورك بشكل أفضل لتفادي التنبيهات.',
      ringColor: 'text-rose-500',
      icon: XCircle,
    };
  };

  const statusInfo = getHumanStatusDetails(realPercent);
  const StatusIcon = statusInfo.icon;

  // Sort attendance history chronologically descending
  const sortedAttendance = [...attendance].sort((a, b) => (b.date > a.date ? 1 : -1));
  const recentRecords = showFullHistory ? sortedAttendance : sortedAttendance.slice(0, 4);

  // SMART EMPTY STATE: If no attendance records recorded yet
  if (totalRecordedDays === 0) {
    return (
      <div className="space-y-6 dir-rtl font-sans">
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-4 max-w-md mx-auto my-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CalendarIcon className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">سجل الحضور والغياب</h2>
            <p className="text-sm font-bold text-slate-700">لم يبدأ تسجيل الحضور في مدرستك بعد.</p>
            <p className="text-xs text-slate-400">سيظهر سجل الحضور والنسبة المئوية هنا فور بدء تسجيل الحضور اليومي.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 dir-rtl font-sans">
      {/* 1. TOP SUMMARY CARD (ملخص الحضور) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          {/* Right Info Section */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wide">
                ملخص الحضور
              </span>
              <span
                className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border ${statusInfo.badgeStyle}`}
              >
                {statusInfo.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
              {statusInfo.message}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1">
              <CalendarCheck2 className="w-3.5 h-3.5 text-slate-400" />
              <span>إجمالي الأيام المسجلة: {formatArabicNumber(totalRecordedDays)} يوم</span>
            </div>
          </div>

          {/* Left Side: Animated Progress Ring & Percentage */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={201}
                strokeDashoffset={201 - (201 * animatedPercent) / 100}
                strokeLinecap="round"
                className={`${statusInfo.ringColor} transition-all duration-500 ease-out`}
                fill="transparent"
              />
            </svg>

            {/* Inner Ring Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-2xl font-black text-slate-900 font-sans leading-none tracking-tight">
                {formatArabicNumber(animatedPercent)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ATTENDANCE STREAK CARD (سلسلة المواظبة اليومية) */}
      {streak && (
        <AttendanceStreakCard streak={streak} />
      )}

      {/* 3. THREE CORE STATISTICS CARDS */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Present Days */}
        <div className="bg-emerald-50/60 rounded-2xl p-3 sm:p-4 border border-emerald-100/90 shadow-2xs space-y-1.5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-emerald-800">أيام الحضور</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-emerald-700 font-sans leading-none">
            {formatArabicNumber(presentDays)}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/80">يوم حضور فعلي</p>
        </div>

        {/* Absent Days */}
        <div className="bg-rose-50/60 rounded-2xl p-3 sm:p-4 border border-rose-100/90 shadow-2xs space-y-1.5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-rose-800">أيام الغياب</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-rose-700 font-sans leading-none">
            {formatArabicNumber(absentDays)}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-rose-600/80">يوم غياب مسجل</p>
        </div>

        {/* Late Days */}
        <div className="bg-amber-50/60 rounded-2xl p-3 sm:p-4 border border-amber-100/90 shadow-2xs space-y-1.5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black text-amber-800">أيام التأخير</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-amber-700 font-sans leading-none">
            {formatArabicNumber(lateDays)}
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-amber-600/80">تأخر عن الطابور</p>
        </div>
      </div>

      {/* 3. ATTENDANCE CALENDAR (سجل الحضور) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        {/* Calendar Header with Month Nav */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm sm:text-base font-black text-slate-900">سجل الحضور الشهري</h2>
          </div>

          {/* Month Navigation Control */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm font-extrabold text-slate-800 px-2 min-w-[90px] text-center">
              {monthNames[month]} {formatArabicNumber(year)}
            </span>

            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend Indicator Bar */}
        <div className="flex items-center justify-around sm:justify-start sm:gap-6 text-[11px] font-extrabold text-slate-600 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            <span>حاضر</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
            <span>غائب</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
            <span>متأخر</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span>عطلة/لا يوجد</span>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] sm:text-xs font-black text-slate-400">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty leading cells */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 sm:h-14 rounded-2xl bg-slate-50/30" />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const record = attendanceMap[dateStr];

            const dateObj = new Date(year, month, dayNum);
            const isWeekend = dateObj.getDay() === 5 || dateObj.getDay() === 6; // Friday or Saturday

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() =>
                  setSelectedDayRecord({
                    dateStr,
                    dayNum,
                    status: record?.status,
                    notes: record?.notes,
                    className: record?.className,
                  })
                }
                className={`h-11 sm:h-14 rounded-2xl border p-1.5 sm:p-2 flex flex-col justify-between items-center transition-all cursor-pointer active:scale-95 min-h-[44px] ${
                  isWeekend
                    ? 'bg-slate-50/60 border-slate-100 text-slate-300'
                    : record?.status === 'حاضر'
                    ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400 text-emerald-900'
                    : record?.status === 'غائب'
                    ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400 text-rose-900'
                    : record?.status === 'متأخر'
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200/80 hover:border-indigo-300 text-slate-700'
                }`}
              >
                <span className="text-xs sm:text-sm font-black font-sans">
                  {formatArabicNumber(dayNum)}
                </span>

                {/* Status Dot Indicator */}
                <div className="mt-auto">
                  {record?.status === 'حاضر' && (
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 block shadow-2xs" />
                  )}
                  {record?.status === 'غائب' && (
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 block shadow-2xs" />
                  )}
                  {record?.status === 'متأخر' && (
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 block shadow-2xs" />
                  )}
                  {!record && !isWeekend && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 block" />
                  )}
                  {isWeekend && <span className="text-[9px] font-bold text-slate-300">عطلة</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT ATTENDANCE RECORDS (آخر تسجيلات الحضور) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            آخر تسجيلات الحضور
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {formatArabicNumber(attendance.length)} تسجيلات
          </span>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400">
            لا توجد تسجيلات حضور في هذه الفترة.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentRecords.map((rec, idx) => {
              const isPresent = rec.status === 'حاضر';
              const isAbsent = rec.status === 'غائب';

              return (
                <div
                  key={rec.id || idx}
                  className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    isPresent
                      ? 'bg-emerald-50/40 border-emerald-100/80'
                      : isAbsent
                      ? 'bg-rose-50/40 border-rose-100/80'
                      : 'bg-amber-50/40 border-amber-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                        isPresent
                          ? 'bg-emerald-100 text-emerald-700'
                          : isAbsent
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isPresent && <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />}
                      {isAbsent && <XCircle className="w-5 h-5 stroke-[2.2]" />}
                      {!isPresent && !isAbsent && <Clock className="w-5 h-5 stroke-[2.2]" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {rec.date}
                      </div>
                      {rec.notes ? (
                        <p className="text-[11px] font-semibold text-slate-600">
                          ملاحظة: {rec.notes}
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-slate-400">
                          {rec.className ? `الصف: ${rec.className}` : 'حضور مدرسي رسمي'}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl font-black text-xs ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-800'
                        : isAbsent
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Show full history toggle button */}
        {sortedAttendance.length > 4 && (
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 min-h-[44px]"
          >
            <span>{showFullHistory ? 'طي السجل' : 'عرض السجل الكامل'}</span>
            {showFullHistory ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
        )}
      </div>

      {/* 5. DAY DETAIL POPUP MODAL */}
      {selectedDayRecord && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedDayRecord(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4 text-right animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">تفاصيل الحضور</h3>
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">التاريخ:</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {selectedDayRecord.dateStr}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">الحالة:</span>
                <div>
                  {selectedDayRecord.status === 'حاضر' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      حاضر
                    </span>
                  )}
                  {selectedDayRecord.status === 'غائب' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100 text-rose-800 font-black text-xs">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      غائب
                    </span>
                  )}
                  {selectedDayRecord.status === 'متأخر' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-black text-xs">
                      <Clock className="w-4 h-4 text-amber-600" />
                      متأخر
                    </span>
                  )}
                  {!selectedDayRecord.status && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-600 font-black text-xs">
                      غير مسجل / عطلة
                    </span>
                  )}
                </div>
              </div>

              {selectedDayRecord.notes && (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 block">ملاحظات:</span>
                  <p className="text-amber-900 font-bold">{selectedDayRecord.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDayRecord(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl transition-all cursor-pointer active:scale-98 min-h-[44px]"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
