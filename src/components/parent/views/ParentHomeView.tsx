import React from 'react';
import { motion } from 'motion/react';
import { ParentPortalData, ParentViewTab } from '../../../types/parent';
import {
  GraduationCap,
  Calendar,
  Star,
  Bell,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Award,
  Shield,
  FileText,
  Users,
  Target,
  ClipboardCheck,
  Crown,
  Flame,
} from 'lucide-react';
import { formatArabicNumber } from '../../../lib/utils';
import { AvatarDisplay } from '../../ui/AvatarDisplay';
import { getUserAvatarLayoutUid } from '../../../lib/avatarLayouts';
import { AttendanceStreakCard } from '../../ui/AttendanceStreakCard';
import { getStudentStreakInfo } from '../../../lib/streakStorage';
import { getStudentBadges } from '../../../lib/badgeStorage';

interface ParentHomeViewProps {
  data: ParentPortalData;
  onNavigateTab: (tab: ParentViewTab) => void;
}

export function ParentHomeView({ data, onNavigateTab }: ParentHomeViewProps) {
  const { student, schoolInfo, stats, attendance, announcements, streak: initialStreak } = data;

  const currentSchoolId = student?.schoolId || (schoolInfo as any)?.schoolId || (schoolInfo as any)?.id || 'sch-1';
  const streak = initialStreak || getStudentStreakInfo(student.id, currentSchoolId);
  const studentBadges = getStudentBadges(student.id, currentSchoolId);
  const latestBadgeItem = studentBadges.length > 0 ? studentBadges[0] : null;

  // Calculate attendance parameters from real stats & data
  const rawPresentDaysCount =
    attendance
      ? attendance.filter((a) => (a.status as string) === 'حاضر' || (a.status as string) === 'present').length
      : (stats.presentDays ?? 23);

  const lateDaysCount =
    attendance
      ? attendance.filter((a) => (a.status as string) === 'متأخر' || (a.status as string) === 'late').length
      : (stats.lateDays ?? 0);

  const absentDaysCount =
    attendance
      ? attendance.filter((a) => (a.status as string) === 'غائب' || (a.status as string) === 'absent').length
      : (stats.absentDays ?? 2);

  // Late ('متأخر') is counted as present ('حاضر') for total attendance percentage and present slice
  const presentDaysCount = rawPresentDaysCount + lateDaysCount;

  const totalRecordedDays = presentDaysCount + absentDaysCount;
  const totalDaysCount = totalRecordedDays > 0 ? totalRecordedDays : 25;

  const attendancePercentage = totalDaysCount > 0 ? Math.round((presentDaysCount / totalDaysCount) * 100) : 92;

  // Determine status text & colors based on calculated attendance percentage
  let statusText = 'ممتاز';
  let statusTextColor = 'text-emerald-300';
  let statusDotBg = 'bg-emerald-400';

  if (attendancePercentage >= 90) {
    statusText = 'ممتاز';
    statusTextColor = 'text-emerald-300';
    statusDotBg = 'bg-emerald-400';
  } else if (attendancePercentage >= 80) {
    statusText = 'جيد جداً';
    statusTextColor = 'text-emerald-300';
    statusDotBg = 'bg-emerald-400';
  } else if (attendancePercentage >= 70) {
    statusText = 'جيد';
    statusTextColor = 'text-amber-300';
    statusDotBg = 'bg-amber-400';
  } else {
    statusText = 'يحتاج إلى تحسين';
    statusTextColor = 'text-rose-300';
    statusDotBg = 'bg-rose-400';
  }

  return (
    <div className="space-y-5 dir-rtl">
      {/* 1. STUDENT PROFILE CARD (Identity Section) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden"
      >
        {/* Subtle decorative background accent */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-amber-50/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-right relative z-10">
          {/* Avatar with Status Badge and Gold Crown */}
          <div className="relative shrink-0 order-1 sm:order-2">
            <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-3xl bg-gradient-to-b from-blue-50 to-indigo-50/70 border-2 border-blue-100 flex items-center justify-center p-2 relative shadow-xs">
              {/* Gold Crown on top corner */}
              <div className="absolute -top-2.5 -right-2 bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/90 p-1.5 rounded-full shadow-xs z-10">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-400" />
              </div>

              {/* Avatar Display */}
              <AvatarDisplay
                layoutUid={student.avatar_layout_uid || getUserAvatarLayoutUid(student.id)}
                name={student.name}
                size="xl"
              />

              {/* Status Pill Badge at bottom */}
              {attendancePercentage > 91 && (
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full ring-2 ring-white shadow-xs whitespace-nowrap">
                  {student.status || 'منتظم'}
                </span>
              )}
            </div>
          </div>

          {/* Student Information Hierarchy */}
          <div className="flex-1 space-y-2.5 order-2 sm:order-1">
            {/* Top Pill Badges */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-extrabold px-3 py-1 bg-blue-50/90 text-blue-700 rounded-full border border-blue-100 inline-flex items-center gap-1.5 shadow-2xs">
                <span>👋 مرحباً بك</span>
              </span>
              <span className="text-[11px] font-black px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 border border-amber-200/90 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                <span>{formatArabicNumber(streak.currentStreak)} أيام مواظبة متتالية 🔥</span>
              </span>
            </div>

            {/* Student Name */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {student.name || 'طالب مسجل'}
            </h1>

            {/* Class & Grade Name */}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl w-fit mx-auto sm:mx-0">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {student.gradeLevel
                  ? `${student.gradeLevel} - ${student.className || 'فصل 1'}`
                  : student.className || 'الفصل الدراسي'}
              </span>
            </div>

            {/* Student Points Showcase */}
            {data.points && (
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full">
                <div
                  id="student-points-summary-card"
                  onClick={() => onNavigateTab('badges')}
                  className="group w-full sm:w-auto inline-flex flex-wrap items-center justify-between sm:justify-start gap-3 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-200 hover:border-amber-300 hover:bg-amber-50/90 px-4 py-2.5 rounded-2xl shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4 fill-white" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                      <span className="text-slate-600 font-medium text-xs">نقاط الطالب:</span>
                      <span className="text-lg font-black text-amber-900 font-sans tracking-tight">
                        {formatArabicNumber(data.points.totalPoints)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] font-extrabold text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-xl border border-amber-200/70">
                    <span>الأوسمة: {formatArabicNumber(data.points.badgePoints)}</span>
                    <span className="text-amber-300">•</span>
                    <span>الحضور: {formatArabicNumber(data.points.attendancePoints)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 2. ATTENDANCE HERO CARD (نسبة الحضور) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden"
      >
        <div className="flex flex-row items-center justify-between gap-3 sm:gap-6 relative z-10 dir-rtl">
          {/* Right Side in RTL: Stats & CTA */}
          <div className="flex-1 space-y-2 text-right">
            {/* Header: Title + Calendar Icon */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
              <Calendar className="w-4 h-4 text-white shrink-0" />
              <span>نسبة الحضور</span>
            </div>

            <p className="text-[11px] text-blue-100/80 font-medium">آخر تحديث اليوم</p>

            {/* Main Percentage */}
            <div className="text-4xl sm:text-6xl font-black tracking-tight font-sans text-white leading-tight">
              {formatArabicNumber(attendancePercentage)}%
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-bold pt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${statusDotBg} animate-pulse shrink-0`} />
              <span className={statusTextColor}>{statusText}</span>
            </div>

            {/* Report Button */}
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('attendance')}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] text-xs font-black rounded-full shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>عرض التقرير والسلسلة</span>
              </button>
            </div>
          </div>

          {/* Left Side in RTL: SVG Circular Gauge Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background track circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  className="stroke-white/20"
                  strokeWidth="11"
                  fill="transparent"
                />
                {/* Active progress arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  className="stroke-white transition-all duration-1000 ease-out"
                  strokeWidth="11"
                  strokeDasharray={389.56}
                  strokeDashoffset={389.56 * (1 - Math.min(100, Math.max(0, attendancePercentage)) / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Sparkle highlight at upper area */}
              <div className="absolute top-2.5 right-3 text-white/90 pointer-events-none">
                <Sparkles className="w-3.5 h-3.5" />
              </div>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center text-white mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans leading-tight">
                  {formatArabicNumber(presentDaysCount)} / {formatArabicNumber(totalDaysCount)}
                </span>
                <span className="text-[11px] font-bold text-blue-100/90 mt-0.5">يوم حاضر</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. ATTENDANCE STREAK CARD (سلسلة المواظبة اليومية) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.08 }}
      >
        <AttendanceStreakCard
          streak={streak}
          onNavigateToBadges={() => onNavigateTab('badges')}
        />
      </motion.div>

      {/* 3. NEXT STEP CARD (الخطوة التالية) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-[#f0fdf4] border border-emerald-100 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-5"
      >
        {/* Left: Circular Checklist Graphic */}
        <div className="relative shrink-0 order-1 sm:order-2">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100/70 border-4 border-emerald-200/80 flex items-center justify-center relative">
            <ClipboardCheck className="w-10 h-10 text-emerald-600" />
            <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Right: Content & Action */}
        <div className="space-y-1.5 text-center sm:text-right flex-1 order-2 sm:order-1">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-extrabold text-emerald-800">
            <Target className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>الخطوة التالية</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900">
            تقريرك الأسبوعي جاهز.
          </h3>

          <p className="text-xs text-slate-600 font-medium">
            اطّلع على ملخص حضورك وسلوكك هذا الأسبوع.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5"
            >
              <span>عرض سجل الحضور والمواظبة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 4. TWO GRID CARDS (آخر إنجاز & السلوك) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Card A: Latest Achievement (آخر إنجاز) */}
        <div
          onClick={() => onNavigateTab('badges')}
          className="bg-[#f8f5ff] border border-purple-100 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:border-purple-200 transition-all cursor-pointer"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-700">
              <Award className="w-4 h-4" />
              <span>آخر إنجاز</span>
            </div>
            <h4 className="text-base font-black text-slate-900">
              {latestBadgeItem ? latestBadgeItem.badge.name : 'أوسمة التميز'}
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {latestBadgeItem
                ? `حصل عليه الطالب (${studentBadges.length} أوسمة إجمالاً)`
                : 'اضغط لعرض الأوسمة والجوائز'}
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100/90 rounded-2xl flex items-center justify-center shrink-0 relative text-2xl sm:text-3xl">
            {latestBadgeItem?.badge.icon && latestBadgeItem.badge.icon.length <= 4 ? (
              <span>{latestBadgeItem.badge.icon}</span>
            ) : (
              <Award className="w-9 h-9 text-purple-700" />
            )}
            <Sparkles className="w-4 h-4 text-purple-500 absolute -top-1 -right-1" />
          </div>
        </div>

        {/* Card B: Behavior (السلوك) */}
        <div
          onClick={() => onNavigateTab('behavior')}
          className="bg-[#f0f9ff] border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:border-blue-200 transition-all cursor-pointer"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600">
              <Shield className="w-4 h-4" />
              <span>السلوك</span>
            </div>
            <h4 className="text-base font-black text-slate-900">سلوك ممتاز</h4>
            <p className="text-xs text-slate-500 font-medium">لا توجد ملاحظات سلبية</p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100/80 rounded-full flex items-center justify-center shrink-0 ring-4 ring-emerald-500/20 text-emerald-600">
            <CheckCircle2 className="w-9 h-9" />
          </div>
        </div>
      </motion.div>

      {/* 5. RECENT NOTIFICATIONS CARD (آخر الإشعارات) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="font-black text-sm">آخر الإشعارات</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('announcements')}
          className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                {announcements[0]?.title || 'لا توجد إعلانات جديدة حالياً'}
              </p>
              <span className="text-[11px] text-slate-400 font-medium">
                {announcements[0]?.publishDate || 'الإعلانات والتعاميم المدرسية'}
              </span>
            </div>
          </div>

          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100">
          <button
            onClick={() => onNavigateTab('announcements')}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>عرض جميع الإشعارات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
