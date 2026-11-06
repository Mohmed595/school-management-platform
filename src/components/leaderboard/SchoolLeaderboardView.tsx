import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
  Users,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import {
  fetchSchoolLeaderboardApi,
  LeaderboardStudentItem,
  CurrentStudentRanking,
  LeaderboardSchoolSummary,
} from '../../lib/schoolApi';

interface SchoolLeaderboardViewProps {
  schoolId: string;
  currentStudentId?: string;
  userRole?: 'student' | 'parent' | 'teacher' | 'attendance_teacher' | 'admin' | 'owner';
  schoolName?: string;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CUSTOM MEDAL BADGE COMPONENT WITH RIBBON (Matches Image 1:1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MedalRibbonBadge({ rank }: { rank: 1 | 2 | 3 }) {
  const configs = {
    1: {
      bgCircle: 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500',
      borderColor: 'border-yellow-200',
      text: 'text-white',
      shadow: 'shadow-amber-500/40',
      ribbonColor: '#D97706',
    },
    2: {
      bgCircle: 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400',
      borderColor: 'border-slate-100',
      text: 'text-white',
      shadow: 'shadow-slate-400/40',
      ribbonColor: '#64748B',
    },
    3: {
      bgCircle: 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700',
      borderColor: 'border-amber-300',
      text: 'text-white',
      shadow: 'shadow-amber-700/40',
      ribbonColor: '#9A3412',
    },
  }[rank];

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Circle with rank number */}
      <div
        className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl ${configs.text} ${configs.bgCircle} border-2 sm:border-3 ${configs.borderColor} shadow-lg ${configs.shadow} relative z-10`}
      >
        <span>{rank}</span>
      </div>
      {/* Ribbon tails underneath */}
      <svg
        width="26"
        height="15"
        viewBox="0 0 24 14"
        fill="none"
        className="-mt-2 relative z-0"
      >
        <path d="M3 0L7.5 14L12 9L16.5 14L21 0H3Z" fill={configs.ribbonColor} />
      </svg>
    </div>
  );
}

export function SchoolLeaderboardView({
  schoolId,
  currentStudentId,
  userRole = 'student',
  schoolName,
}: SchoolLeaderboardViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudentItem[]>([]);
  const [currentStudent, setCurrentStudent] = useState<CurrentStudentRanking | undefined>(undefined);
  const [schoolSummary, setSchoolSummary] = useState<LeaderboardSchoolSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetchSchoolLeaderboardApi(schoolId);
      setLeaderboard(res.leaderboard || []);
      setCurrentStudent(res.currentStudent);
      setSchoolSummary(res.schoolSummary || null);
    } catch (err: any) {
      setError(err?.message || 'فشل في تحميل قائمة الأوائل');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData(true);
    };
    window.addEventListener('school_data_changed', handleUpdate);
    window.addEventListener('student_points_updated', handleUpdate);
    return () => {
      window.removeEventListener('school_data_changed', handleUpdate);
      window.removeEventListener('student_points_updated', handleUpdate);
    };
  }, [schoolId]);

  const filteredLeaderboard = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.className && item.className.toLowerCase().includes(q))
    );
  }, [leaderboard, searchQuery]);

  const top1 = leaderboard.find((s) => s.rank === 1);
  const top2 = leaderboard.find((s) => s.rank === 2);
  const top3 = leaderboard.find((s) => s.rank === 3);

  const formatPoints = (points: number) => {
    return Number(points || 0).toLocaleString('ar-EG');
  };

  if (loading && !refreshing) {
    return (
      <div className="w-full space-y-6 animate-pulse py-4 max-w-4xl mx-auto" dir="rtl">
        <div className="h-16 bg-slate-200/80 rounded-3xl w-64 mx-auto"></div>
        <div className="h-64 bg-amber-100/40 rounded-3xl border border-amber-200/60"></div>
        <div className="h-28 bg-white rounded-3xl border border-slate-200/80"></div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200/80"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-12 max-w-xl mx-auto text-center" dir="rtl">
        <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">تعذر تحميل قائمة الأوائل</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{error}</p>
          <button
            onClick={() => loadData(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto py-2 px-1 sm:px-0" dir="rtl">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HEADER SECTION (Matches Image 1:1)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative text-center pt-2 pb-1 space-y-1">
        {/* Decorative Sparkles - Kept outside text flow to prevent overlap */}
        <div className="absolute top-1 right-2 sm:right-12 text-yellow-400 opacity-60 text-xs pointer-events-none select-none">◆</div>
        <div className="absolute top-2 left-2 sm:left-16 text-blue-400 opacity-60 text-xs pointer-events-none select-none">◆</div>
        <div className="absolute top-0 right-1/4 text-amber-400 opacity-80 text-xs pointer-events-none select-none hidden sm:block">✨</div>
        <div className="absolute top-0 left-1/4 text-blue-400 opacity-80 text-xs pointer-events-none select-none hidden sm:block">✨</div>

        <div className="inline-flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            الأوائل
          </h1>
          <span className="text-2xl sm:text-3xl">👑</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-md mx-auto px-4">
          أفضل 100 طالب في المدرسة حسب النقاط المكتسبة
        </p>

        {/* Refresh button floating cleanly */}
        <div className="absolute left-0 top-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          EMPTY STATE (When no students or all students have 0 points)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {leaderboard.length === 0 || (schoolSummary && schoolSummary.topScore === 0) || (leaderboard[0] && leaderboard[0].points === 0) ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-black text-slate-900">لا توجد نقاط مسجلة للطلاب حتى الآن</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            سيتم احتساب النقاط وتصنيف الأوائل تلقائياً بمجرد تسجيل الحضور أو منح الأوسمة والسلوكيات الإيجابية للطلاب.
          </p>
        </div>
      ) : (
        <>
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              2. TOP 3 PODIUM CONTAINER (Exact 1:1 Light Style with Pedestals)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="relative rounded-3xl bg-gradient-to-b from-amber-50/60 via-orange-50/30 to-amber-100/50 p-3 sm:p-8 border border-amber-200/70 shadow-xs overflow-hidden">
            {/* Grid for Podium (RTL Order: #2 Right, #1 Center Tallest, #3 Left) */}
            <div className="relative z-10 grid grid-cols-3 gap-1.5 sm:gap-4 items-end max-w-2xl mx-auto pt-6 pb-2">
              
              {/* ━━━━ Column 1 (RTL Right): Rank #2 (Silver) ━━━━ */}
              <div className="flex flex-col items-center">
                {top2 ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Top Medal Ribbon */}
                    <div className="-mb-4 z-20">
                      <MedalRibbonBadge rank={2} />
                    </div>

                    {/* Card Container */}
                    <div className="w-full bg-white border-2 border-slate-300 rounded-2xl pt-6 pb-3 sm:pb-4 px-1 sm:px-4 text-center shadow-xs relative z-10 flex flex-col items-center min-h-[165px] sm:min-h-[195px] justify-between">
                      {/* Avatar & Name & Class */}
                      <div className="w-full flex flex-col items-center space-y-1 mt-1 relative z-10">
                        <AvatarDisplay
                          layoutUid={top2.avatar_layout_uid}
                          name={top2.name}
                          size="md"
                        />
                        <h3 className="font-black text-xs sm:text-base text-slate-900 leading-tight line-clamp-2 px-0.5" title={top2.name}>
                          {top2.name}
                        </h3>
                        {top2.className && (
                          <p className="text-[9px] sm:text-xs text-slate-500 font-medium truncate">
                            {top2.className}
                          </p>
                        )}
                      </div>

                      {/* Points */}
                      <div className="mt-1.5 text-center relative z-10">
                        <p className="text-base sm:text-2xl font-black text-slate-700 tracking-tight leading-none">
                          {formatPoints(top2.points)}
                        </p>
                        <p className="text-[9px] sm:text-xs font-bold text-slate-400 mt-0.5">
                          نقطة
                        </p>
                      </div>
                    </div>

                    {/* Pedestal Step */}
                    <div className="w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 h-6 sm:h-8 rounded-b-2xl -mt-2 shadow-xs" />
                  </div>
                ) : (
                  <div className="w-full h-36 rounded-2xl bg-white/60 border-2 border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                    شاغر
                  </div>
                )}
              </div>

              {/* ━━━━ Column 2 (Center): Rank #1 (Gold - Tallest & Elevated) ━━━━ */}
              <div className="flex flex-col items-center -mt-6 sm:-mt-8">
                {top1 ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Top Medal Ribbon */}
                    <div className="-mb-5 z-20">
                      <MedalRibbonBadge rank={1} />
                    </div>

                    {/* Card Container */}
                    <div className="w-full bg-white border-3 border-amber-400 rounded-2xl pt-7 pb-4 sm:pb-5 px-1 sm:px-4 text-center shadow-md relative z-10 flex flex-col items-center min-h-[195px] sm:min-h-[235px] justify-between">
                      {/* Avatar & Name & Class */}
                      <div className="w-full flex flex-col items-center space-y-1 mt-1 relative z-10">
                        <AvatarDisplay
                          layoutUid={top1.avatar_layout_uid}
                          name={top1.name}
                          size="lg"
                          showGlow={true}
                        />
                        <h2 className="font-black text-xs sm:text-lg text-slate-900 leading-tight line-clamp-2 px-0.5" title={top1.name}>
                          {top1.name}
                        </h2>
                        {top1.className && (
                          <p className="text-[9px] sm:text-xs text-slate-500 font-medium truncate">
                            {top1.className}
                          </p>
                        )}
                      </div>

                      {/* Points */}
                      <div className="mt-2 text-center relative z-10">
                        <p className="text-lg sm:text-3xl font-black text-amber-500 tracking-tight leading-none">
                          {formatPoints(top1.points)}
                        </p>
                        <p className="text-[9px] sm:text-xs font-bold text-amber-600/90 mt-0.5">
                          نقطة
                        </p>
                      </div>
                    </div>

                    {/* Pedestal Step */}
                    <div className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 h-8 sm:h-10 rounded-b-2xl -mt-2 shadow-xs" />
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-2xl bg-white/60 border-2 border-amber-200 flex items-center justify-center text-amber-400 text-xs font-bold">
                    شاغر
                  </div>
                )}
              </div>

              {/* ━━━━ Column 3 (RTL Left): Rank #3 (Bronze) ━━━━ */}
              <div className="flex flex-col items-center">
                {top3 ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Top Medal Ribbon */}
                    <div className="-mb-4 z-20">
                      <MedalRibbonBadge rank={3} />
                    </div>

                    {/* Card Container */}
                    <div className="w-full bg-white border-2 border-amber-600/60 rounded-2xl pt-6 pb-3 sm:pb-4 px-1 sm:px-4 text-center shadow-xs relative z-10 flex flex-col items-center min-h-[165px] sm:min-h-[195px] justify-between">
                      {/* Avatar & Name & Class */}
                      <div className="w-full flex flex-col items-center space-y-1 mt-1 relative z-10">
                        <AvatarDisplay
                          layoutUid={top3.avatar_layout_uid}
                          name={top3.name}
                          size="md"
                        />
                        <h3 className="font-black text-xs sm:text-base text-slate-900 leading-tight line-clamp-2 px-0.5" title={top3.name}>
                          {top3.name}
                        </h3>
                        {top3.className && (
                          <p className="text-[9px] sm:text-xs text-slate-500 font-medium truncate">
                            {top3.className}
                          </p>
                        )}
                      </div>

                      {/* Points */}
                      <div className="mt-1.5 text-center relative z-10">
                        <p className="text-base sm:text-2xl font-black text-amber-700 tracking-tight leading-none">
                          {formatPoints(top3.points)}
                        </p>
                        <p className="text-[9px] sm:text-xs font-bold text-amber-700/80 mt-0.5">
                          نقطة
                        </p>
                      </div>
                    </div>

                    {/* Pedestal Step */}
                    <div className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 h-5 sm:h-7 rounded-b-2xl -mt-2 shadow-xs" />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-2xl bg-white/60 border-2 border-amber-200 flex items-center justify-center text-amber-400 text-xs font-bold">
                    شاغر
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              3. MY RANK CARD (Matches Image 1:1)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {currentStudent && (
            <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-blue-100 shadow-xs">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center divide-x divide-x-reverse divide-blue-100">
                
                {/* 1. Rank Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3.5 pr-0 sm:pr-2 text-center sm:text-right">
                  <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-600 leading-tight">مركزك في الأوائل</p>
                    <p className="text-xl sm:text-3xl font-black text-blue-600 tracking-tight mt-0.5">
                      #{currentStudent.rank}
                    </p>
                    <p className="text-[9px] sm:text-[11px] font-medium text-slate-400 hidden sm:block">
                      من أصل {currentStudent.totalStudents} طالب
                    </p>
                  </div>
                </div>

                {/* 2. Current Points Section */}
                <div className="flex flex-col justify-center px-1 sm:px-6 text-center">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-600 leading-tight">نقاطك الحالية</p>
                  <p className="text-xl sm:text-3xl font-black text-blue-600 tracking-tight mt-0.5">
                    {formatPoints(currentStudent.points)}
                  </p>
                  <p className="text-[9px] sm:text-[11px] font-medium text-slate-400">نقطة</p>
                </div>

                {/* 3. Next Rank Progress Section */}
                <div className="pl-0 sm:pl-2 text-center sm:text-right">
                  {currentStudent.points <= 0 ? (
                    <>
                      <h4 className="text-[11px] sm:text-sm font-black text-blue-900 leading-tight line-clamp-1">
                        لا توجد نقاط مسجلة
                      </h4>
                      <p className="text-[9px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                        ابدأ بحضور الحصص واكتساب الأوسمة 🚀
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2.5">
                        <div className="flex-1 bg-slate-100 h-2 sm:h-3 rounded-full overflow-hidden">
                          <div className="bg-slate-300 h-full w-0 rounded-full" />
                        </div>
                        <span className="text-slate-400 text-xs sm:text-base leading-none">🏁</span>
                      </div>
                    </>
                  ) : currentStudent.rank === 1 ? (
                    <>
                      <h4 className="text-[11px] sm:text-sm font-black text-blue-900 leading-tight line-clamp-1">
                        مكتمل
                      </h4>
                      <p className="text-[9px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                        أنت بالمركز الأول! 🏆
                      </p>

                      {/* Progress bar + flag (100%) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2.5">
                        <div className="flex-1 bg-blue-100/90 h-2 sm:h-3 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full w-full rounded-full transition-all duration-500" />
                        </div>
                        <span className="text-amber-500 text-xs sm:text-base leading-none">🚩</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-[11px] sm:text-sm font-black text-blue-900 leading-tight line-clamp-1">
                        أنت قريب من المركز التالي!
                      </h4>
                      <p className="text-[9px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                        تفصلك {currentStudent.pointsNeeded} نقطة عن المركز #{currentStudent.nextRank}
                      </p>

                      {/* Progress bar + flag */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2.5">
                        <div className="flex-1 bg-blue-100/90 h-2 sm:h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  currentStudent.nextStudentPoints
                                    ? (currentStudent.points / currentStudent.nextStudentPoints) * 100
                                    : 75,
                                  15
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-amber-500 text-xs sm:text-base leading-none">🚩</span>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Staff Summary Card if not student */}
          {!currentStudent && schoolSummary && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  ملخص إحصائيات لوحة الشرف المدرسية
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[11px] font-semibold text-slate-500">إجمالي طلاب المدرسة</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {schoolSummary.totalStudents} طالب
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-800">أعلى رصيد نقاط في المدرسة</p>
                  <p className="text-xl font-black text-amber-600 mt-1">
                    {formatPoints(schoolSummary.topScore)} نقطة
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <p className="text-[11px] font-semibold text-blue-800">متوسط نقاط الأوائل</p>
                  <p className="text-xl font-black text-blue-600 mt-1">
                    {formatPoints(schoolSummary.averageTopPoints)} نقطة
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              4. TOP 100 LIST (Matches Image 1:1)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  قائمة الأوائل (أعلى 100 طالب)
                </h2>
                <span className="text-xl">🏆</span>
              </div>

              {/* Search in Leaderboard */}
              {leaderboard.length > 5 && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث عن طالب بالاسم أو الفصل..."
                    className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* List Rows */}
            <div className="space-y-2.5 pt-1">
              {filteredLeaderboard.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                  لا توجد نتائج مطابقة لبحثك في قائمة الأوائل
                </div>
              ) : (
                filteredLeaderboard.map((student) => {
                  const isCurrentStudent = currentStudentId && student.studentId === currentStudentId;
                  const isTop1 = student.rank === 1;
                  const isTop2 = student.rank === 2;
                  const isTop3 = student.rank === 3;

                  let rowStyle = 'bg-white border-slate-200/80 hover:bg-slate-50/80 text-slate-900';

                  if (isTop1) {
                    rowStyle =
                      'bg-gradient-to-l from-amber-100/90 via-amber-50/80 to-amber-100/90 border-amber-300 shadow-2xs text-amber-950';
                  } else if (isTop2) {
                    rowStyle =
                      'bg-slate-100/90 border-slate-300 text-slate-900';
                  } else if (isTop3) {
                    rowStyle =
                      'bg-amber-50/80 border-amber-200 text-amber-950';
                  }

                  if (isCurrentStudent) {
                    rowStyle += ' ring-2 ring-blue-500 ring-offset-2';
                  }

                  return (
                    <div
                      key={student.studentId}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${rowStyle}`}
                    >
                      {/* Right Side (RTL): Rank Badge/Number + Student Name + Class */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Badge for #1, #2, #3 OR simple Rank Number for others */}
                        {isTop1 || isTop2 || isTop3 ? (
                          <div className="shrink-0">
                            <MedalRibbonBadge rank={student.rank as 1 | 2 | 3} />
                          </div>
                        ) : (
                          <div className="w-8 text-center text-slate-800 font-black text-base sm:text-lg shrink-0">
                            {student.rank}
                          </div>
                        )}

                        {/* Avatar Display */}
                        <AvatarDisplay
                          layoutUid={student.avatar_layout_uid}
                          name={student.name}
                          size="sm"
                        />

                        {/* Name & Class */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 truncate" title={student.name}>
                              {student.name}
                            </h3>
                            {isCurrentStudent && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0 shadow-2xs">
                                أنت هنا 🌟
                              </span>
                            )}
                          </div>
                          {student.className && (
                            <p
                              className={`text-[11px] sm:text-xs font-semibold truncate mt-0.5 ${
                                isTop1
                                  ? 'text-amber-800'
                                  : isTop2
                                  ? 'text-slate-600'
                                  : isTop3
                                  ? 'text-amber-800'
                                  : 'text-slate-500'
                              }`}
                            >
                              {student.className}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Left Side (RTL): Points + Sparkles for #1 */}
                      <div className="flex items-center gap-2 shrink-0 text-left">
                        {isTop1 && <span className="text-amber-400 text-xs hidden sm:inline">✨</span>}
                        <div>
                          <p
                            className={`font-black text-lg sm:text-xl tracking-tight leading-none ${
                              isTop1
                                ? 'text-amber-600'
                                : isTop2
                                ? 'text-slate-700'
                                : isTop3
                                ? 'text-amber-700'
                                : 'text-slate-900'
                            }`}
                          >
                            {formatPoints(student.points)}
                          </p>
                          <p
                            className={`text-[10px] sm:text-xs font-bold mt-0.5 text-left ${
                              isTop1
                                ? 'text-amber-700'
                                : isTop2
                                ? 'text-slate-500'
                                : isTop3
                                ? 'text-amber-700'
                                : 'text-slate-400'
                            }`}
                          >
                            نقطة
                          </p>
                        </div>
                        {isTop1 && <span className="text-amber-400 text-xs hidden sm:inline">✨</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
