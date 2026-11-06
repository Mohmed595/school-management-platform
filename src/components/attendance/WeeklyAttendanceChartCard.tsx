import React, { useState, useEffect } from 'react';
import { getAttendanceBySchool, getStudentsBySchool } from '../../lib/adminStorage';
import { getStoredSession } from '../../lib/storage';

interface WeeklyAttendanceChartCardProps {
  schoolId?: string;
  percentage?: number;
  title?: string;
  className?: string;
  singleWeekOnly?: boolean;
}

interface DayAttendanceData {
  dayName: string;
  weekLabel: string;
  isoDate: string;
  formattedDate: string;
  percentage: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalStudents: number;
  hasRealRecords: boolean;
  x: number;
  y: number;
}

export function WeeklyAttendanceChartCard({
  schoolId: propSchoolId,
  percentage: propPercentage,
  title = 'نسبة الحضور هذا الأسبوع',
  className = '',
  singleWeekOnly = true,
}: WeeklyAttendanceChartCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartData, setChartData] = useState<DayAttendanceData[]>([]);
  const [averagePercentage, setAveragePercentage] = useState<number>(propPercentage || 0);

  useEffect(() => {
    const activeSchoolId = propSchoolId || getStoredSession()?.schoolId || 'sch-1';

    const calculateAttendanceData = () => {
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
      const currentSunday = new Date(now);
      currentSunday.setDate(now.getDate() - currentDayOfWeek);

      const previousSunday = new Date(currentSunday);
      previousSunday.setDate(currentSunday.getDate() - 7);

      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      const totalDays = singleWeekOnly ? 5 : 10;
      const xStep = (470 - 30) / (totalDays - 1);

      const students = getStudentsBySchool(activeSchoolId);
      const totalSchoolStudents = students.length;

      const computed: DayAttendanceData[] = [];

      for (let i = 0; i < totalDays; i++) {
        let baseSunday: Date;
        let isSecondWeek = false;

        if (singleWeekOnly) {
          baseSunday = currentSunday;
          isSecondWeek = true;
        } else {
          isSecondWeek = i >= 5;
          baseSunday = isSecondWeek ? currentSunday : previousSunday;
        }

        const dayInWeek = i % 5;
        const dObj = new Date(baseSunday);
        dObj.setDate(baseSunday.getDate() + dayInWeek);
        const isoDate = dObj.toISOString().split('T')[0];
        const formattedDate = `${dObj.getDate()}/${dObj.getMonth() + 1}`;

        const records = getAttendanceBySchool(activeSchoolId, isoDate);

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let totalStudents = 0;
        let percentage = 0;
        let hasReal = false;

        if (records && records.length > 0) {
          hasReal = true;
          presentCount = records.filter((r) => r.status === 'حاضر').length;
          absentCount = records.filter((r) => r.status === 'غائب').length;
          lateCount = records.filter((r) => r.status === 'متأخر').length;
          totalStudents = records.length;
          // Present + Late counts as present percentage
          const totalAttended = presentCount + lateCount;
          percentage = totalStudents > 0 ? Math.round((totalAttended / totalStudents) * 100) : 0;
        } else {
          hasReal = false;
          presentCount = 0;
          absentCount = 0;
          lateCount = 0;
          totalStudents = totalSchoolStudents;
          percentage = 0;
        }

        const clampedPct = Math.max(0, Math.min(100, percentage));
        const y = 98 - (clampedPct / 100) * 76;
        const x = 30 + i * xStep;

        computed.push({
          dayName: dayNames[dayInWeek],
          weekLabel: singleWeekOnly ? 'الأسبوع الحالي' : isSecondWeek ? 'الأسبوع الحالي' : 'الأسبوع الماضي',
          isoDate,
          formattedDate,
          percentage,
          presentCount,
          absentCount,
          lateCount,
          totalStudents,
          hasRealRecords: hasReal,
          x,
          y,
        });
      }

      setChartData(computed);

      const daysWithData = computed.filter((d) => d.hasRealRecords);
      if (daysWithData.length > 0) {
        const sum = daysWithData.reduce((acc, curr) => acc + curr.percentage, 0);
        setAveragePercentage(Math.round(sum / daysWithData.length));
      } else if (propPercentage) {
        setAveragePercentage(propPercentage);
      } else {
        setAveragePercentage(0);
      }
    };

    calculateAttendanceData();

    const handleUpdate = () => calculateAttendanceData();
    window.addEventListener('school_data_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('school_data_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [propSchoolId, propPercentage, singleWeekOnly]);

  // Polyline coordinates
  const polylinePoints = chartData.map((d) => `${d.x},${d.y}`).join(' ');

  // SVG Area path coordinates (fill beneath line)
  const areaPoints = chartData.length > 0
    ? `30,98 ${polylinePoints} ${chartData[chartData.length - 1].x},98`
    : '';

  const todayIso = new Date().toISOString().split('T')[0];
  const defaultPoint =
    chartData.find((d) => d.isoDate === todayIso) ||
    chartData.find((d) => d.hasRealRecords) ||
    chartData[0] ||
    null;

  const activePoint = hoveredIndex !== null ? chartData[hoveredIndex] : defaultPoint;

  return (
    <div
      dir="rtl"
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3 text-right select-none ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {title}
          </h3>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="تحديث مباشر" />
        </div>

        <div className="flex items-center gap-2">
          {activePoint ? (
            <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
              {activePoint.weekLabel} - {activePoint.dayName} ({activePoint.formattedDate})
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
              الأسبوع الحالي
            </span>
          )}
        </div>
      </div>

      {/* SVG Straight Line & Area Gradient Chart (RTL Order) */}
      <div dir="ltr" className="pt-2 pb-1 relative [direction:ltr]">
        <svg
          className="w-full h-28 sm:h-32 overflow-visible"
          viewBox="0 0 500 120"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="attendanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines (100%, 50%, 0%) */}
          <line x1="20" y1="22" x2="480" y2="22" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
          <text x="12" y="25" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">100%</text>

          <line x1="20" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
          <text x="12" y="63" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">50%</text>

          <line x1="20" y1="98" x2="480" y2="98" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
          <text x="12" y="101" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">0%</text>

          {/* Active Hover Vertical Guide Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1="10"
              x2={activePoint.x}
              y2="98"
              stroke="#2563eb"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Soft Gradient Area under path */}
          {areaPoints && (
            <polygon
              points={areaPoints}
              fill="url(#attendanceAreaGrad)"
            />
          )}

          {/* Polyline line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Point Circles */}
          {chartData.map((d, idx) => {
            const isHovered = hoveredIndex === idx;
            const isActive = activePoint?.isoDate === d.isoDate;

            return (
              <g
                key={`${d.isoDate}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(idx)}
              >
                {/* Touch/Hover target area */}
                <circle cx={d.x} cy={d.y} r="16" fill="transparent" />

                {/* Outer Glow Ring on Active/Hovered */}
                {(isHovered || isActive) && (
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r="8"
                    fill="#3b82f6"
                    fillOpacity="0.3"
                  />
                )}

                {/* Main Point Circle */}
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={isHovered || isActive ? '5' : '3.5'}
                  fill={isHovered || isActive ? '#1d4ed8' : d.hasRealRecords ? '#2563eb' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* SVG Tooltip on Hover */}
                {isHovered && (
                  <g transform={`translate(${d.x}, ${Math.max(22, d.y - 18)})`}>
                    <rect
                      x="-50"
                      y="-26"
                      width="100"
                      height="26"
                      rx="6"
                      fill="#0f172a"
                      className="shadow-lg"
                    />
                    <text
                      x="0"
                      y="-10"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {d.dayName}: {d.percentage}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* X-Axis Day Labels */}
        <div dir="ltr" className={`grid ${singleWeekOnly ? 'grid-cols-5' : 'grid-cols-10'} gap-1.5 text-center text-[11px] font-bold text-slate-500 mt-1 [direction:ltr]`}>
          {chartData.map((d, idx) => {
            const isActive = activePoint?.isoDate === d.isoDate;
            return (
              <div
                key={`${d.isoDate}-${idx}-label`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(idx)}
                className={`cursor-pointer py-1.5 px-1 rounded-xl border transition-all flex flex-col items-center justify-center active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-black'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50/80 hover:border-blue-300'
                }`}
              >
                <span className="leading-tight">{d.dayName}</span>
                <span
                  className={`text-[9px] font-mono mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}
                >
                  {d.formattedDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Day Stats Breakdown Card below chart */}
      {activePoint && (
        <div
          dir="rtl"
          className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activePoint.hasRealRecords ? 'bg-blue-600' : 'bg-slate-400'}`} />
            <span>
              {activePoint.dayName} ({activePoint.formattedDate}):{' '}
              <strong className="text-blue-700 font-mono text-sm">{activePoint.percentage}%</strong>
              {!activePoint.hasRealRecords && (
                <span className="text-slate-400 text-[11px] mr-1">(لم يتم تسجيل الحضور)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-extrabold flex-wrap">
            <span className="text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md border border-emerald-200">
              حاضر: {activePoint.presentCount}
            </span>
            <span className="text-red-800 bg-red-100/90 px-2.5 py-0.5 rounded-md border border-red-200">
              غائب: {activePoint.absentCount}
            </span>
            <span className="text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-md border border-amber-200">
              متأخر: {activePoint.lateCount}
            </span>
            <span className="text-slate-700 bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-200">
              الإجمالي: {activePoint.totalStudents}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
