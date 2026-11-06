import React, { useState } from 'react';
import { ParentPortalData } from '../../../types/parent';
import {
  Star,
  ThumbsUp,
  AlertTriangle,
  MessageSquare,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Info,
  ChevronLeft,
  ChevronDown,
  Calendar,
  Users,
  Award,
} from 'lucide-react';
import { formatArabicNumber } from '../../../lib/utils';

interface ParentBehaviorViewProps {
  data: ParentPortalData;
}

export function ParentBehaviorView({ data }: ParentBehaviorViewProps) {
  const { behavior, stats } = data;

  const [filterType, setFilterType] = useState<'all' | 'إيجابي' | 'سلبي'>('all');
  const [showTimeline, setShowTimeline] = useState(true);

  // Compute actual counts strictly from real behavior records and stats in DB
  const posRecordsCount = behavior.filter((b) => b.type === 'إيجابي').length;
  const negRecordsCount = behavior.filter((b) => b.type === 'سلبي').length;
  const totalRecordsCount = behavior.length;

  const posPoints =
    stats?.positivePoints !== undefined
      ? stats.positivePoints
      : behavior
          .filter((b) => b.type === 'إيجابي')
          .reduce((acc, b) => acc + Math.abs(b.points), 0);

  const negPoints =
    stats?.negativePoints !== undefined
      ? stats.negativePoints
      : behavior
          .filter((b) => b.type === 'سلبي')
          .reduce((acc, b) => acc + Math.abs(b.points), 0);

  const posCount = posRecordsCount;
  const warnCount = negRecordsCount;
  const genCount = posPoints;
  const timeCount = totalRecordsCount;

  // Total pie-chart count: strictly (السلوكيات الإيجابية + الملاحظات التنبيهية)
  const chartTotal = posCount + warnCount;

  // Percentage calculations strictly for the two segments from chartTotal
  const posPercent = chartTotal > 0 ? Math.round((posCount / chartTotal) * 100) : 0;
  const warnPercent = chartTotal > 0 ? 100 - posPercent : 0;

  // Check empty state based on real DB records
  const hasNoData = totalRecordsCount === 0 && posPoints === 0 && negPoints === 0;

  const filteredBehavior = behavior.filter((b) => {
    if (filterType !== 'all' && b.type !== filterType) return false;
    return true;
  });

  // SVG Donut Chart parameters (strictly positive and warning segments)
  const fPos = chartTotal > 0 ? posCount / chartTotal : 0;
  const fWarn = chartTotal > 0 ? warnCount / chartTotal : 0;

  const R = 62;
  const C = 2 * Math.PI * R; // ~389.56
  const hasBothSegments = posCount > 0 && warnCount > 0;
  const gap = hasBothSegments ? 6 : 0;

  const sPosLen = Math.max(0, fPos * C - gap);
  const sWarnLen = Math.max(0, fWarn * C - gap);

  // Trigonometric Badge Position Calculation
  const R_badge = 84;
  const cx = 100;
  const cy = 100;

  const getBadgeCoords = (midFraction: number) => {
    const angleRad = midFraction * 2 * Math.PI - Math.PI / 2;
    const x = cx + R_badge * Math.cos(angleRad);
    const y = cy + R_badge * Math.sin(angleRad);
    return {
      left: `${(x / 200) * 100}%`,
      top: `${(y / 200) * 100}%`,
    };
  };

  const badgePosCoord = getBadgeCoords(fPos / 2);
  const badgeWarnCoord = getBadgeCoords(fPos + fWarn / 2);

  return (
    <div className="space-y-6 dir-rtl">
      {/* 1. MAIN SUMMARY CARD ( ملخص السلوك العام ) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-black text-lg">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <span>ملخص السلوك العام</span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mr-6">آخر 30 يوم</p>
          </div>
        </div>

        {hasNoData ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-bold text-slate-600">
              لا توجد بيانات سلوكية كافية حتى الآن.
            </p>
            <p className="text-xs text-slate-400">وسيظهر الملخص عند تسجيل أول تقييم.</p>
          </div>
        ) : (
          <>
            {/* Chart + Legend Row */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 sm:gap-8 pt-1">
              {/* Category Legend List */}
              <div className="w-full md:w-1/2 space-y-3">
                {/* Item 1: Positive */}
                <div className="flex items-center justify-between bg-blue-50/50 hover:bg-blue-50 p-3 rounded-2xl border border-blue-100/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      السلوكيات الإيجابية
                    </span>
                  </div>
                  <span className="bg-blue-100/90 text-blue-800 text-xs font-black px-3 py-1 rounded-xl font-sans">
                    {formatArabicNumber(posCount)}
                  </span>
                </div>

                {/* Item 2: General Evaluation */}
                <div className="flex items-center justify-between bg-amber-50/50 hover:bg-amber-50 p-3 rounded-2xl border border-amber-100/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      التقييم السلوكي العام
                    </span>
                  </div>
                  <span className="bg-amber-100/90 text-amber-800 text-xs font-black px-3 py-1 rounded-xl font-sans">
                    {formatArabicNumber(genCount)}
                  </span>
                </div>

                {/* Item 3: Warning Notes */}
                <div className="flex items-center justify-between bg-rose-50/50 hover:bg-rose-50 p-3 rounded-2xl border border-rose-100/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      الملاحظات التنبيهية
                    </span>
                  </div>
                  <span className="bg-rose-100/90 text-rose-800 text-xs font-black px-3 py-1 rounded-xl font-sans">
                    {formatArabicNumber(warnCount)}
                  </span>
                </div>

                {/* Item 4: Timeline & Log */}
                <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-3 rounded-2xl border border-slate-200/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      سجل التقييم والخط الزمني
                    </span>
                  </div>
                  <span className="bg-slate-200 text-slate-800 text-xs font-black px-3 py-1 rounded-xl font-sans">
                    {formatArabicNumber(timeCount)}
                  </span>
                </div>
              </div>

              {/* Donut Chart Container */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 shrink-0 flex items-center justify-center mx-auto">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {/* Empty state base track when 0 / 0 */}
                  {chartTotal === 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r={R}
                      className="stroke-slate-200"
                      strokeWidth="18"
                      fill="transparent"
                    />
                  )}

                  {/* Segment 1: Blue (السلوكيات الإيجابية) */}
                  {sPosLen > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r={R}
                      className="stroke-blue-600 transition-all duration-700"
                      strokeWidth="18"
                      strokeDasharray={`${sPosLen} ${C - sPosLen}`}
                      strokeDashoffset={0}
                      transform="rotate(-90 100 100)"
                      fill="transparent"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Segment 2: Red (الملاحظات التنبيهية) */}
                  {sWarnLen > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r={R}
                      className="stroke-rose-500 transition-all duration-700"
                      strokeWidth="18"
                      strokeDasharray={`${sWarnLen} ${C - sWarnLen}`}
                      strokeDashoffset={-(fPos * C)}
                      transform="rotate(-90 100 100)"
                      fill="transparent"
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {/* Center Text Summary */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                  {chartTotal > 0 ? (
                    <>
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans leading-none">
                        {formatArabicNumber(posPercent)}%
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-blue-600 mt-1">
                        سلوك إيجابي
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {posPercent >= 80 ? 'أداء ممتاز' : posPercent >= 50 ? 'أداء جيد' : 'يحتاج متابعة'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-black text-slate-400 tracking-tight font-sans leading-none">
                        0%
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
                        لا توجد ملاحظات
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        لم يسجل سلوكيات بعد
                      </span>
                    </>
                  )}
                </div>

                {/* Floating Percentage Badges */}
                {fPos > 0 && (
                  <div
                    className="absolute bg-blue-600 text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-md shadow-2xs -translate-x-1/2 -translate-y-1/2 font-sans pointer-events-none"
                    style={badgePosCoord}
                  >
                    {formatArabicNumber(posPercent)}%
                  </div>
                )}
                {fWarn > 0 && (
                  <div
                    className="absolute bg-rose-500 text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-md shadow-2xs -translate-x-1/2 -translate-y-1/2 font-sans pointer-events-none"
                    style={badgeWarnCoord}
                  >
                    {formatArabicNumber(warnPercent)}%
                  </div>
                )}
              </div>
            </div>

            {/* Positive Contextual Feedback Banner */}
            <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-blue-900">
                  {chartTotal === 0
                    ? 'في انتظار التقييم'
                    : posPercent >= 60
                    ? 'ممتاز!'
                    : 'تنبيه ومتابعة'}
                </h4>
                <p className="text-xs font-medium text-blue-700/90 leading-relaxed">
                  {chartTotal === 0
                    ? 'لم يتم تسجيل ملاحظات سلوكية بعد خلال هذه الفترة.'
                    : posPercent >= 60
                    ? 'أداء ابنك/ابنتك ممتاز. استمر في دعم سلوكه الإيجابي.'
                    : 'يوجد بعض الملاحظات التي تحتاج إلى المتابعة الدورية مع المدرسة.'}
                </p>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. COMPACT BEHAVIOR DETAILS SECTION ( تفاصيل السلوك ) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900">تفاصيل السلوك</h2>
            <p className="text-xs font-medium text-slate-400">آخر 30 يوم</p>
          </div>

          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-extrabold rounded-xl transition-all cursor-pointer border border-slate-200/60 inline-flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>{showTimeline ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-200 ${
                showTimeline ? '-rotate-90' : ''
              }`}
            />
          </button>
        </div>

        {/* 4 Compact Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: Positive */}
          <div className="bg-emerald-50/60 border border-emerald-100/90 rounded-2xl p-4 text-center space-y-2 hover:border-emerald-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-sans">
              {formatArabicNumber(posCount)}
            </div>
            <div className="text-xs font-bold text-emerald-900">السلوكيات الإيجابية</div>
          </div>

          {/* Card 2: General Evaluation */}
          <div className="bg-amber-50/60 border border-amber-100/90 rounded-2xl p-4 text-center space-y-2 hover:border-amber-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto">
              <Star className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-800 font-sans">
              {formatArabicNumber(genCount)}
            </div>
            <div className="text-xs font-bold text-amber-900">التقييم السلوكي العام</div>
          </div>

          {/* Card 3: Warning Notes */}
          <div className="bg-rose-50/60 border border-rose-100/90 rounded-2xl p-4 text-center space-y-2 hover:border-rose-200 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-800 font-sans">
              {formatArabicNumber(warnCount)}
            </div>
            <div className="text-xs font-bold text-rose-900">الملاحظات التنبيهية</div>
          </div>

          {/* Card 4: Timeline Log */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-2 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 font-sans">
              {formatArabicNumber(timeCount)}
            </div>
            <div className="text-xs font-bold text-slate-800">سجل التقييم والخط الزمني</div>
          </div>
        </div>

        {/* Parent Advice Box */}
        <div className="bg-blue-50/40 border border-blue-100/80 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/50">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-black text-blue-950">نصيحة لولي الأمر</h4>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              استمر في تشجيع ابنك على السلوك الإيجابي والمبادرات اليومية.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FULL BEHAVIOR TIMELINE & LOGS (Expandable) */}
      {showTimeline && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5 animate-in fade-in duration-200">
          {/* Header & Filter Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">
                سجل التقييم والخط الزمني للسلوك
              </h3>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                جميع السجلات ({formatArabicNumber(behavior.length)})
              </button>
              <button
                onClick={() => setFilterType('إيجابي')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'إيجابي'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                الإيجابية فقط ({formatArabicNumber(posRecordsCount)})
              </button>
              <button
                onClick={() => setFilterType('سلبي')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'سلبي'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                الملاحظات التوجيهية ({formatArabicNumber(negRecordsCount)})
              </button>
            </div>
          </div>

          {/* Timeline Items */}
          {filteredBehavior.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              لا توجد سجلات سلوكية مطابقة في الفئة المحددة.
            </div>
          ) : (
            <div className="relative border-r-2 border-slate-100 pr-6 space-y-5 my-2">
              {filteredBehavior.map((item) => {
                const isPositive = item.type === 'إيجابي';

                return (
                  <div key={item.id} className="relative">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -right-[31px] top-2 w-4 h-4 rounded-full ring-4 ring-white ${
                        isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />

                    {/* Entry Card */}
                    <div
                      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                        isPositive
                          ? 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                          : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs flex items-center gap-1 ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                                : 'bg-rose-100 text-rose-800 border border-rose-300/60'
                            }`}
                          >
                            {isPositive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                سلوك إيجابي (+{item.points} نقاط)
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                ملاحظة توجيهية ({item.points} نقاط)
                              </>
                            )}
                          </span>

                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.date}
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          المعلمين / المرشد: {item.reportedBy}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100 mt-2">
                        {item.notes}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
