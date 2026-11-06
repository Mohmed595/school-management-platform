import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Target,
  Zap,
  Award,
  Shield,
  Check,
  ChevronLeft,
  Sparkles,
  Info,
  Clock,
  Star,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import { StudentStreakInfo, STREAK_MILESTONES } from '../../lib/streakStorage';
import { formatArabicNumber } from '../../lib/utils';

interface AttendanceStreakCardProps {
  streak: StudentStreakInfo;
  variant?: 'full' | 'compact' | 'badge';
  className?: string;
  onNavigateToBadges?: () => void;
}

export function AttendanceStreakCard({
  streak,
  variant = 'full',
  className = '',
  onNavigateToBadges,
}: AttendanceStreakCardProps) {
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  const {
    currentStreak,
    longestStreak,
    streakTier,
    streakTitle,
    nextMilestone,
    daysToNextMilestone,
    milestoneProgress,
    recentDays,
    streakMultiplier,
    streakStatus,
  } = streak;

  // Mini Pill / Badge variant
  if (variant === 'badge') {
    return (
      <span
        dir="rtl"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-300 text-amber-900 shadow-2xs ${className}`}
      >
        <span className="relative flex items-center justify-center">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
        </span>
        <span>{formatArabicNumber(currentStreak)} أيام مواظبة</span>
      </span>
    );
  }

  // Compact variant (For top headers or sidebar widgets)
  if (variant === 'compact') {
    return (
      <div
        dir="rtl"
        className={`bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between gap-3 relative overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-3 z-10 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <Flame className="w-6 h-6 text-amber-200 fill-amber-300 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wide">سلسلة المواظبة</span>
              <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.2 rounded-md">
                {streakTitle}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black tracking-tight leading-tight">
              {formatArabicNumber(currentStreak)} يوماً متتالياً 🔥
            </div>
          </div>
        </div>

        <div className="text-left shrink-0 z-10">
          <span className="text-[10px] font-bold text-amber-100 block">هدف المواظبة</span>
          <span className="text-xs font-black text-white bg-black/20 px-2 py-0.5 rounded-lg border border-white/20">
            {daysToNextMilestone <= 0 ? 'اكتمل الهدف' : `باقي ${formatArabicNumber(daysToNextMilestone)} يوم`}
          </span>
        </div>
      </div>
    );
  }

  // Full Rich Dashboard Card Variant
  return (
    <div
      dir="rtl"
      className={`bg-white rounded-3xl border border-amber-200/90 p-5 sm:p-6 shadow-2xs space-y-4 relative overflow-hidden text-right ${className}`}
    >
      {/* Soft warm background decorative glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-amber-100/60 to-orange-100/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Flame className="w-7 h-7 text-amber-100 fill-amber-200" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white text-[10px] font-black">
              ✓
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                سلسلة المواظبة اليومية
              </h3>
              <span className="text-[11px] font-black text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{streakTitle}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              كل يوم حضور مستمر يعزز استمراريتك ويقربك من تحقيق هدف المواظبة التالي
            </p>
          </div>
        </div>

        {/* Multiplier / Bonus Chip */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
          <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
          <div className="text-right">
            <span className="text-[10px] font-extrabold text-amber-800 block leading-none">مضاعف التميز</span>
            <span className="text-xs font-black text-orange-700 font-sans">{streakMultiplier}x نقاط إضافية</span>
          </div>
        </div>
      </div>

      {/* Main Counter & Progress Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-amber-100">السلسلة النشطة الحالية</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-white">
                {formatArabicNumber(currentStreak)}
              </span>
              <span className="text-base sm:text-lg font-black text-amber-100">
                أيام حضور متتالية دون غياب 🔥
              </span>
            </div>
            <p className="text-xs text-amber-100/90 font-medium">
              أطول سلسلة سابقة: <strong className="text-white font-bold">{formatArabicNumber(longestStreak)} يوماً</strong>
            </p>
          </div>

          {/* Selected Element: Attendance Goal Streak Box */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 hover:border-white/40 p-3.5 sm:p-4 rounded-2xl sm:text-left text-right space-y-2 shrink-0 transition-all shadow-inner">
            <div className="flex items-center justify-between sm:justify-start gap-2.5 text-xs font-black text-amber-100">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-200 stroke-[2.5]" />
                <span>الهدف القادم: {formatArabicNumber(nextMilestone)} أيام</span>
              </span>
              <span className="text-[10px] font-bold bg-black/20 text-white/95 px-2 py-0.5 rounded-full border border-white/10 font-sans">
                {formatArabicNumber(currentStreak)} / {formatArabicNumber(nextMilestone)}
              </span>
            </div>

            <div className="w-full sm:w-40 bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/20">
              <div
                className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.min(100, Math.max(8, milestoneProgress))}%` }}
              />
            </div>

            <div className="text-[11px] font-bold text-white/95 flex items-center justify-between sm:justify-start gap-1.5">
              {daysToNextMilestone <= 0 ? (
                <span className="font-black text-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  تم إكمال الهدف بنجاح! 🎯
                </span>
              ) : (
                <span>
                  متبقي <span className="font-black text-amber-200 font-sans">{formatArabicNumber(daysToNextMilestone)}</span> {daysToNextMilestone === 1 ? 'يوم' : daysToNextMilestone === 2 ? 'يومان' : 'أيام'} لتحقيق الهدف
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Weekly Streak Track */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>حالة المواظبة هذا الأسبوع (الأحد - الخميس)</span>
          </span>
          <button
            onClick={() => setShowMilestonesModal(true)}
            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>محطات الأهداف</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {recentDays.map((day, idx) => {
            const isAttended = day.status === 'حاضر' || day.isStreakDay;
            const isAbsent = day.status === 'غائب';
            const isLate = day.status === 'متأخر';

            return (
              <div
                key={`${day.date}-${idx}`}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                  isAttended
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                    : isAbsent
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : isLate
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-extrabold block">{day.dayName}</span>

                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs">
                  {isAttended && (
                    <div className="relative">
                      <Flame className="w-5 h-5 text-amber-500 fill-amber-400 animate-pulse" />
                    </div>
                  )}
                  {isAbsent && <span className="text-rose-600 text-sm font-black">✕</span>}
                  {isLate && <Clock className="w-4 h-4 text-amber-600" />}
                  {!isAttended && !isAbsent && !isLate && (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>

                <span className="text-[9px] font-bold text-slate-500 font-mono">
                  {day.formattedDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Bottom Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
          <span>
            {currentStreak >= 7
              ? 'أداء استثنائي! استمر بنفس الحماس لضمان تصدر لوحة شرف المواظبة.'
              : 'حافظ على حضورك يوم غد لرفع السلسلة وتحقيق هدف المواظبة التالي.'}
          </span>
        </div>

        {onNavigateToBadges && (
          <button
            onClick={onNavigateToBadges}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-black rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            لوحة التكريم
          </button>
        )}
      </div>

      {/* Modal: Milestones Map */}
      <AnimatePresence>
        {showMilestonesModal && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowMilestonesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-base text-slate-900">محطات وأهداف المواظبة</h3>
                </div>
                <button
                  onClick={() => setShowMilestonesModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {STREAK_MILESTONES.map((m) => {
                  const isUnlocked = currentStreak >= m.days;
                  return (
                    <div
                      key={m.badgeId}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isUnlocked
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            isUnlocked ? 'bg-amber-200/80 shadow-sm' : 'bg-slate-200'
                          }`}
                        >
                          {m.icon}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm">{m.title}</h4>
                          <p className="text-[11px] font-medium text-slate-600">{m.desc}</p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        {isUnlocked ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مكتمل
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px]">
                            {m.days} يوماً
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowMilestonesModal(false)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl transition-all cursor-pointer"
              >
                فهمت، سأواصل الالتزام بالهدف!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
