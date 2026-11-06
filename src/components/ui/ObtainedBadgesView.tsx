import React, { useState, useEffect } from 'react';
import { Award, X, Sparkles, CheckCircle2, Lock, Trophy, Info, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';
import { getAllBadges, getGroupedStudentBadges, getGroupedTeacherBadges } from '../../lib/badgeStorage';
import { fetchStudentBadgesApi, fetchTeacherBadgesApi, fetchStudentPointsApi } from '../../lib/schoolApi';
import { getStoredSession } from '../../lib/storage';
import { Badge, GroupedStudentBadge, GroupedTeacherBadge, BadgeRarity, StudentPointsResult } from '../../types/badge';
import { formatArabicNumber } from '../../lib/utils';

interface ObtainedBadgesViewProps {
  accountType: 'student' | 'teacher' | 'attendance';
  entityId: string;
  entityName: string;
  schoolName: string;
}

export function ObtainedBadgesView({
  accountType,
  entityId,
  entityName,
  schoolName,
}: ObtainedBadgesViewProps) {
  const [allSystemBadges, setAllSystemBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Array<GroupedStudentBadge | GroupedTeacherBadge>>([]);
  const [selectedBadge, setSelectedBadge] = useState<{
    badge: Badge;
    isEarned: boolean;
    count?: number;
    latestAssignment?: {
      awardedAt: string;
      awardedBy: string;
      note?: string;
    };
  } | null>(null);
  const [studentPoints, setStudentPoints] = useState<StudentPointsResult | null>(null);

  const loadData = async () => {
    const session = getStoredSession();
    const currentSchoolId = session?.schoolId || 'sch-1';
    const relevantType = accountType === 'student' ? 'student' : 'teacher';

    if (accountType === 'student') {
      fetchStudentPointsApi(currentSchoolId, entityId)
        .then((res) => setStudentPoints(res))
        .catch(() => {});
    }

    try {
      if (accountType === 'teacher' || accountType === 'attendance') {
        const { assignments, badges } = await fetchTeacherBadgesApi(currentSchoolId, entityId);
        const filteredBadges = (badges || []).filter(
          (b: Badge) => (b.targetType === relevantType || b.targetType === 'all') && b.isActive
        );
        setAllSystemBadges(filteredBadges);

        // Group teacher assignments
        const map = new Map<string, GroupedTeacherBadge>();
        for (const assignment of assignments) {
          const badge = filteredBadges.find((b) => b.id === assignment.badgeId);
          if (!badge) continue;
          const existing = map.get(badge.id);
          if (existing) {
            existing.count += 1;
            existing.assignments.push(assignment);
          } else {
            map.set(badge.id, {
              badge,
              count: 1,
              assignments: [assignment],
              latestAssignment: assignment,
            });
          }
        }
        setEarnedBadges(Array.from(map.values()));
      } else {
        let { assignments, badges } = await fetchStudentBadgesApi(currentSchoolId, entityId);
        if (!assignments || assignments.length === 0) {
          const localItems = getGroupedStudentBadges(entityId, currentSchoolId);
          if (localItems.length > 0) {
            assignments = localItems.flatMap((i) => i.assignments);
          }
        }

        const allBadgesList = (badges && badges.length > 0) ? badges : getAllBadges(currentSchoolId);
        const filteredBadges = allBadgesList.filter(
          (b: Badge) => (b.targetType === relevantType || b.targetType === 'all') && b.isActive !== false
        );
        setAllSystemBadges(filteredBadges);

        // Group student assignments
        const map = new Map<string, GroupedStudentBadge>();
        for (const assignment of assignments || []) {
          let badge = allBadgesList.find((b) => b.id === assignment.badgeId);
          if (!badge) {
            badge = allBadgesList.find((b) => b.id.includes(assignment.badgeId) || assignment.badgeId.includes(b.id));
          }
          if (!badge) {
            badge = {
              id: assignment.badgeId,
              schoolId: currentSchoolId,
              name: assignment.badgeId.includes('star') ? '🌟 نجم الشهر المتميز' : '🏆 وسام التفوق والاجتهاد',
              nameEn: 'Achievement Badge',
              description: 'وسام تقديري للتميز والاجتهاد',
              icon: assignment.badgeId.includes('star') ? '🌟' : '🏆',
              color: assignment.badgeId.includes('star') ? '#8B5CF6' : '#F59E0B',
              rarity: 'Epic',
              targetType: 'student',
              isActive: true,
              hasAnimatedBorder: true,
              limitType: 'none',
              maxQuantity: 0,
              createdAt: assignment.awardedAt || '2026-07-28',
            };
          }
          const existing = map.get(badge.id);
          if (existing) {
            existing.count += 1;
            existing.assignments.push(assignment);
          } else {
            map.set(badge.id, {
              badge,
              count: 1,
              assignments: [assignment],
              latestAssignment: assignment,
            });
          }
        }
        setEarnedBadges(Array.from(map.values()));
      }
    } catch (e) {
      const system = getAllBadges(currentSchoolId);
      const filteredSystem = system.filter(
        (b) => (b.targetType === relevantType || b.targetType === 'all') && b.isActive !== false
      );
      setAllSystemBadges(filteredSystem);

      if (accountType === 'teacher' || accountType === 'attendance') {
        const items = getGroupedTeacherBadges(entityId, currentSchoolId);
        setEarnedBadges(items);
      } else {
        const items = getGroupedStudentBadges(entityId, currentSchoolId);
        setEarnedBadges(items);
      }
    }
  };

  useEffect(() => {
    loadData();

    const handleStorage = () => loadData();
    window.addEventListener('school_data_changed', handleStorage);
    window.addEventListener('badges_updated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('school_data_changed', handleStorage);
      window.removeEventListener('badges_updated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [entityId, accountType]);

  // Map earned badges by badge id for fast O(1) lookup
  const earnedMap = new Map<string, GroupedStudentBadge | GroupedTeacherBadge>();
  earnedBadges.forEach((item) => {
    earnedMap.set(item.badge.id, item);
  });

  // Calculate statistics (obtained badges only)
  const earnedBadgesCount = earnedBadges.length;
  const limitedBadgesCount = earnedBadges.filter(
    (b) => b.badge.limitType && b.badge.limitType !== 'none'
  ).length;

  // Build items list with ONLY earned/obtained badges
  const badgesWithStatus = earnedBadges.map((item) => {
    return {
      badge: item.badge,
      isEarned: true,
      count: item.count,
      latestAssignment: item.latestAssignment,
    };
  });

  const displayedBadges = badgesWithStatus;

  // Rarity tag helper
  const getRarityPill = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'Mythical':
        return (
          <span className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            Mythical
          </span>
        );
      case 'Legendary':
        return (
          <span className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/80 shadow-2xs">
            Legendary
          </span>
        );
      case 'Epic':
        return (
          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            Epic
          </span>
        );
      case 'Rare':
        return (
          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Rare
          </span>
        );
      default:
        return (
          <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Common
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto dir-rtl select-none p-2 sm:p-4 font-sans">
      {/* 1. HEADER TITLE SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Award className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">الأوسمة</h1>
            <p className="text-xs text-slate-500 font-bold">
              إنجازاتك التي حصلت عليها خلال رحلتك الدراسية
            </p>
          </div>
        </div>
      </div>

      {/* 2. TOP PROGRESS BANNER CARD (إنجازاتي) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Right Info Section (RTL) */}
        <div className="space-y-4 flex-1 w-full text-right">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">إنجازاتي</h2>
              <p className="text-xs font-extrabold text-slate-400">
                إجمالي الأوسمة المحصلة
              </p>
            </div>

            {/* Score Display (Shows ONLY obtained badges count) */}
            <div className="flex items-baseline gap-1 font-sans">
              <span className="text-3xl sm:text-4xl font-black text-amber-500 leading-none">
                {formatArabicNumber(earnedBadgesCount)}
              </span>
            </div>
          </div>

          {/* Progress Fill Bar */}
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 h-full rounded-full transition-all duration-700 ease-out shadow-2xs"
              style={{ width: earnedBadgesCount > 0 ? '100%' : '0%' }}
            />
          </div>

          {/* Student Total Points & Breakdown (Authoritative from PostgreSQL) */}
          {accountType === 'student' && studentPoints && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>مجموع نقاط الطالب</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                  تحديث مباشر ⚡
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                {/* Total Points */}
                <div className="bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-orange-500/15 border border-amber-300/80 rounded-2xl p-3 flex items-center justify-between sm:justify-start gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                    <Trophy className="w-5 h-5 text-amber-100 fill-amber-100/30" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-amber-900/80 leading-none mb-1">إجمالي النقاط</p>
                    <p className="text-xl font-black text-amber-950 font-sans tracking-tight leading-none">
                      {formatArabicNumber(studentPoints.totalPoints)} <span className="text-xs font-bold text-amber-800">نقطة</span>
                    </p>
                  </div>
                </div>

                {/* Badges Points */}
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3 flex items-center justify-between sm:justify-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-black shrink-0">
                    <Award className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-amber-900/70 leading-none mb-1">نقاط الأوسمة</p>
                    <p className="text-base font-black text-amber-700 font-sans leading-none">
                      {formatArabicNumber(studentPoints.badgePoints)}
                    </p>
                  </div>
                </div>

                {/* Attendance Points */}
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-3 flex items-center justify-between sm:justify-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black shrink-0">
                    <Calendar className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-emerald-900/70 leading-none mb-1">نقاط الحضور</p>
                    <p className="text-base font-black text-emerald-700 font-sans leading-none">
                      {formatArabicNumber(studentPoints.attendancePoints)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Left Circular Ring Gauge Section (RTL) */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 sm:w-28 sm:h-28 transform -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r="36"
              stroke="currentColor"
              strokeWidth="7"
              className="text-slate-100"
              fill="transparent"
            />
            <circle
              cx="45"
              cy="45"
              r="36"
              stroke="currentColor"
              strokeWidth="7"
              strokeDasharray={226}
              strokeDashoffset={earnedBadgesCount > 0 ? 0 : 226}
              strokeLinecap="round"
              className="text-amber-500 transition-all duration-700 ease-out"
              fill="transparent"
            />
          </svg>

          {/* Inside Ring Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
            <Trophy className="w-5 h-5 text-amber-500 mb-0.5 stroke-[2.2]" />
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans leading-none">
              {formatArabicNumber(earnedBadgesCount)}
            </span>
            <span className="text-[9px] font-black text-slate-400 mt-0.5 leading-tight max-w-[65px]">
              أوسمة حصلت عليها
            </span>
          </div>
        </div>
      </div>

      {/* 3. GRID OF BADGE CARDS (2 Columns) */}
      {displayedBadges.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center bg-slate-50/60 rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center my-4 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center text-3xl shadow-2xs">
            🏅
          </div>
          <h3 className="text-base font-black text-slate-800">لا توجد أوسمة محصلة بعد</h3>
          <p className="text-xs font-bold text-slate-400 max-w-xs">
            لم تحصل على أي أوسمة بعد. واصل اجتهادك لتكريمك بها قريباً!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {displayedBadges.map(({ badge, isEarned, count, latestAssignment }) => (
            <button
              key={badge.id}
              onClick={() =>
                setSelectedBadge({
                  badge,
                  isEarned,
                  count,
                  latestAssignment,
                })
              }
              className={`bg-white rounded-3xl p-4 sm:p-6 border transition-all cursor-pointer flex flex-col items-center justify-between text-center space-y-3 relative overflow-hidden group min-h-[220px] active:scale-98 ${
                isEarned
                  ? 'border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-md'
                  : 'border-slate-200/60 opacity-80 hover:opacity-100 bg-slate-50/40'
              }`}
            >
              {/* Top Left Tag for Earned Item */}
              {isEarned && (
                <div className="absolute top-3 left-3 z-10">
                  {count > 1 ? (
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs dir-ltr">
                      ×{count}
                    </span>
                  ) : (
                    <span className="bg-amber-100/90 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200/80 shadow-2xs flex items-center gap-1">
                      جديد ✨
                    </span>
                  )}
                </div>
              )}

              {/* Top Right Lock Icon for Unearned Item */}
              {!isEarned && (
                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
              )}

              {/* Center Badge Icon Container */}
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-105 shrink-0 ${
                  isEarned
                    ? 'bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/60 border border-amber-200/80 shadow-inner'
                    : 'bg-slate-100/80 border border-slate-200/60 grayscale filter contrast-75'
                }`}
              >
                {badge.icon &&
                (badge.icon.startsWith('data:') ||
                  badge.icon.startsWith('http') ||
                  badge.icon.startsWith('/')) ? (
                  <img
                    src={badge.icon}
                    alt={badge.name}
                    className="w-14 h-14 sm:w-18 sm:h-18 object-contain p-1 drop-shadow-xs"
                  />
                ) : (
                  <span>{badge.icon || '🏅'}</span>
                )}
              </div>

              {/* Title & Rarity Label */}
              <div className="space-y-1.5 w-full">
                <h3
                  className={`font-black text-xs sm:text-sm line-clamp-2 leading-snug ${
                    isEarned ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {badge.name}
                </h3>

                {getRarityPill(badge.rarity)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 5. BADGE DETAIL MODAL POPUP */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative dir-rtl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Header */}
            <div className="text-center space-y-2 pt-2">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto shadow-md relative ${
                  selectedBadge.isEarned
                    ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300'
                    : 'bg-slate-100 border-2 border-slate-200 grayscale opacity-80'
                }`}
              >
                {selectedBadge.badge.icon &&
                (selectedBadge.badge.icon.startsWith('data:') ||
                  selectedBadge.badge.icon.startsWith('http') ||
                  selectedBadge.badge.icon.startsWith('/')) ? (
                  <img
                    src={selectedBadge.badge.icon}
                    alt={selectedBadge.badge.name}
                    className="w-18 h-18 object-contain"
                  />
                ) : (
                  <span>{selectedBadge.badge.icon || '🏅'}</span>
                )}

                {!selectedBadge.isEarned && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {getRarityPill(selectedBadge.badge.rarity)}
                <h3 className="text-lg font-black text-slate-900">{selectedBadge.badge.name}</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
                  {selectedBadge.badge.description}
                </p>
              </div>
            </div>

            {/* Info Box */}
            {selectedBadge.isEarned ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                {selectedBadge.latestAssignment?.awardedBy && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-bold">الجهة المانحة:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedBadge.latestAssignment.awardedBy}
                    </span>
                  </div>
                )}

                {selectedBadge.latestAssignment?.awardedAt && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-bold">تاريخ المنح:</span>
                    <span className="font-extrabold text-slate-900">
                      {selectedBadge.latestAssignment.awardedAt}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-bold">مرات الحصول عليه:</span>
                  <span className="font-sans font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md">
                    ×{selectedBadge.count || 1}
                  </span>
                </div>

                {selectedBadge.latestAssignment?.note && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-bold block mb-1">سبب التكريم:</span>
                    <p className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-slate-800 font-bold">
                      "{selectedBadge.latestAssignment.note}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-black">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>كيفية الحصول على هذا الوسام:</span>
                </div>
                <p className="text-amber-800 font-extrabold leading-relaxed">
                  يُمنح هذا الوسام بقرار رسمي من إدارة المدرسة فور تحقيق المعايير الشرفية والأكاديمية المطلوبة. واصل تميزك للتتويج به!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer active:scale-98"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
