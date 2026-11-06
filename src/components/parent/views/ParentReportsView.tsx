import React, { useState } from 'react';
import {
  TrendingUp,
  CalendarCheck,
  Calendar,
  Lock,
  CheckCircle2,
  FileText,
  Award,
  Star,
  Clock,
  AlertCircle,
  X,
  ChevronLeft,
  Sparkles,
  Info,
  BookOpen,
} from 'lucide-react';
import { ParentPortalData } from '../../../types/parent';
import { getStoredSession } from '../../../lib/storage';
import {
  getWeeklyReportsSchedule,
  getMonthlyReportsSchedule,
  getStudentReportDetails,
  checkReportAccessPermission,
  WeeklySlotInfo,
  MonthlySlotInfo,
  DetailedStudentReport,
  persistReportLog,
} from '../../../lib/reportsStorage';

interface ParentReportsViewProps {
  data: ParentPortalData;
}

export function ParentReportsView({ data }: ParentReportsViewProps) {
  const [activeReportModal, setActiveReportModal] = useState<DetailedStudentReport | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const student = data.student;
  const schoolId = data.schoolInfo.schoolId;

  // Security Verification
  const userSession = getStoredSession();
  const userRole = userSession?.userRole || 'student';
  const userSchoolId = userSession?.schoolId || schoolId;
  const userStudentId = userSession?.studentId || student.id;

  const weeklySlots = getWeeklyReportsSchedule(schoolId);
  const monthlySlots = getMonthlyReportsSchedule(schoolId);

  // Latest available weekly report (if any)
  const availableWeeklySlots = weeklySlots.filter((s) => s.isAvailable);
  const latestWeeklySlot = availableWeeklySlots[availableWeeklySlots.length - 1];
  const upcomingWeeklySlot = weeklySlots.find((s) => !s.isAvailable);

  // Latest available monthly report (if any)
  const availableMonthlySlots = monthlySlots.filter((s) => s.isAvailable);
  const latestMonthlySlot = availableMonthlySlots[availableMonthlySlots.length - 1];
  const upcomingMonthlySlot = monthlySlots.find((s) => !s.isAvailable);

  const handleOpenReport = (
    reportType: 'weekly' | 'monthly',
    periodStart: string,
    periodEnd: string,
    availableAt: string,
    isAvailable: boolean,
    slotTitle: string,
    month?: number,
    year?: number
  ) => {
    // 🛡️ Security Check
    const perm = checkReportAccessPermission(
      userRole,
      userSchoolId,
      userStudentId,
      schoolId,
      student.id
    );

    if (!perm.allowed) {
      setAccessError(perm.reason || 'غير مصرح لك باستعراض هذا التقرير');
      return;
    }

    setAccessError(null);

    const reportDetails = getStudentReportDetails(
      schoolId,
      student.id,
      reportType,
      periodStart,
      periodEnd,
      availableAt,
      isAvailable,
      slotTitle
    );

    // Persist unique report log
    persistReportLog(reportDetails, month, year);

    setActiveReportModal(reportDetails);
  };

  return (
    <div className="space-y-6 dir-rtl font-sans text-slate-800 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 translate-y-[-20%] translate-x-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-100 border border-white/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>تقارير الأداء المدرسية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              📈 تقاريري
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-xl leading-relaxed">
              ملخص بسيط وواضح عن حضورك، سلوكك، درجاتك وأوسمتك المكتسبة لمتابعة تقدمك المستمر.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-right shrink-0">
            <p className="text-[10px] text-blue-200 font-bold">الطالب الحالي</p>
            <p className="font-extrabold text-sm text-white">{student.name}</p>
            <p className="text-[11px] text-blue-100">{student.className}</p>
          </div>
        </div>
      </div>

      {/* Security Error Toast if blocked */}
      {accessError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-xs font-bold">{accessError}</p>
        </div>
      )}

      {/* Primary Report Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: WEEKLY REPORT */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">📅 التقرير الأسبوعي</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    يغطي الأسبوع المدرسي المنقضي (السبت - الخميس)
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {availableWeeklySlots.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متاح الآن ✅</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    🔒 متاح يوم الجمعة
                    {upcomingWeeklySlot ? ` (${upcomingWeeklySlot.formattedAvailableAt})` : ''}
                  </span>
                </span>
              )}
            </div>

            {/* Description Info Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
              {availableWeeklySlots.length > 0 ? (
                <div>
                  <p className="font-bold text-slate-900">آخر أسبوع مكتمل:</p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    {latestWeeklySlot?.formattedPeriodRange}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يتم إصدار التقرير الأسبوعي الجديد تلقائياً كل يوم جمعة.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-amber-800">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    التقرير الأسبوعي يتوفر فور اكتمال الأسبوع المدرسي الأول بدءاً من تاريخ تسجيل الحضور.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button & List */}
          <div className="space-y-3 pt-2">
            {availableWeeklySlots.length > 0 ? (
              <button
                onClick={() =>
                  handleOpenReport(
                    'weekly',
                    latestWeeklySlot.periodStart,
                    latestWeeklySlot.periodEnd,
                    latestWeeklySlot.availableAt,
                    true,
                    `التقرير الأسبوعي (${latestWeeklySlot.formattedPeriodRange})`
                  )
                }
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>[عرض التقرير الأسبوعي الحالي]</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold py-3 px-4 rounded-xl text-sm cursor-not-allowed border border-slate-200"
              >
                <Lock className="w-4 h-4" />
                <span>🔒 التقرير غير متاح بعد</span>
              </button>
            )}

            {/* Previous Weeks Dropdown / List if multiple available */}
            {availableWeeklySlots.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 mb-2">التقارير الأسبوعية السابقة:</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableWeeklySlots.slice(0, -1).reverse().map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() =>
                        handleOpenReport(
                          'weekly',
                          slot.periodStart,
                          slot.periodEnd,
                          slot.availableAt,
                          true,
                          `التقرير الأسبوعي (${slot.formattedPeriodRange})`
                        )
                      }
                      className="w-full flex items-center justify-between text-xs px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <span>أسبوع: {slot.formattedPeriodRange}</span>
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: MONTHLY REPORT */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">📊 التقرير الشهري</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    ملخص شامل لشهر دراسي كامل
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {availableMonthlySlots.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متاح الآن ✅</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    🔒 متاح في{' '}
                    {upcomingMonthlySlot ? upcomingMonthlySlot.formattedAvailableAt : 'الشهر القادم'}
                  </span>
                </span>
              )}
            </div>

            {/* Description Info Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
              {availableMonthlySlots.length > 0 ? (
                <div>
                  <p className="font-bold text-slate-900">آخر شهر متاح:</p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    {latestMonthlySlot?.monthNameArabic} ({latestMonthlySlot?.formattedPeriodRange})
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يتم إصدار التقرير الشهري بعد مرور شهر تقويمي كامل من بدء تسجيل الحضور.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-amber-800">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    يتوفر أول تقرير شهري بتاريخ{' '}
                    <span className="font-extrabold underline">
                      {upcomingMonthlySlot ? upcomingMonthlySlot.formattedAvailableAt : 'بعد شهر'}
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button & List */}
          <div className="space-y-3 pt-2">
            {availableMonthlySlots.length > 0 ? (
              <button
                onClick={() =>
                  handleOpenReport(
                    'monthly',
                    latestMonthlySlot.periodStart,
                    latestMonthlySlot.periodEnd,
                    latestMonthlySlot.availableAt,
                    true,
                    `التقرير الشهري (${latestMonthlySlot.monthNameArabic})`,
                    latestMonthlySlot.month,
                    latestMonthlySlot.year
                  )
                }
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>[عرض التقرير الشهري الحالي]</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold py-3 px-4 rounded-xl text-sm cursor-not-allowed border border-slate-200"
              >
                <Lock className="w-4 h-4" />
                <span>🔒 التقرير غير متاح بعد</span>
              </button>
            )}

            {/* Previous Months List if multiple available */}
            {availableMonthlySlots.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 mb-2">التقارير الشهرية السابقة:</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableMonthlySlots.slice(0, -1).reverse().map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() =>
                        handleOpenReport(
                          'monthly',
                          slot.periodStart,
                          slot.periodEnd,
                          slot.availableAt,
                          true,
                          `التقرير الشهري (${slot.monthNameArabic})`,
                          slot.month,
                          slot.year
                        )
                      }
                      className="w-full flex items-center justify-between text-xs px-3 py-2 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <span>تقرير: {slot.monthNameArabic}</span>
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REPORT MODAL DETAIL VIEW */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 dir-rtl overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 my-auto flex flex-col">
            {/* Modal Top Nav Bar */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    activeReportModal.reportType === 'weekly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {activeReportModal.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    الفترة: {activeReportModal.formattedPeriodRange}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveReportModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 flex-1">
              {/* SECTION 1: 📅 الحضور */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-blue-600" />
                    <span>📅 الحضور والغياب</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">سجل الانضباط</span>
                </div>

                {activeReportModal.attendance.hasData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {/* Present */}
                      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3">
                        <span className="text-xs font-bold text-emerald-800 block mb-0.5">
                          🟢 أيام الحضور
                        </span>
                        <span className="text-2xl font-black text-emerald-700">
                          {activeReportModal.attendance.presentDays}
                        </span>
                      </div>

                      {/* Absent */}
                      <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3">
                        <span className="text-xs font-bold text-rose-800 block mb-0.5">
                          🔴 أيام الغياب
                        </span>
                        <span className="text-2xl font-black text-rose-700">
                          {activeReportModal.attendance.absentDays}
                        </span>
                      </div>

                      {/* Late */}
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3">
                        <span className="text-xs font-bold text-amber-800 block mb-0.5">
                          🟡 أيام التأخير
                        </span>
                        <span className="text-2xl font-black text-amber-700">
                          {activeReportModal.attendance.lateDays}
                        </span>
                      </div>
                    </div>

                    {/* Exam Marks if available in this period */}
                    {activeReportModal.examGrades.length > 0 && (
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 space-y-2">
                        <p className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>نتائج الاختبارات المسجلة في هذه الفترة:</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeReportModal.examGrades.map((grade, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-blue-200/60 rounded-lg p-2 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-800">{grade.subjectName}</span>
                              <span className="font-extrabold text-blue-700 dir-ltr">
                                {grade.score} / {grade.maxScore}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center text-slate-500 text-xs font-medium">
                    لا توجد بيانات كافية حتى الآن
                  </div>
                )}
              </div>

              {/* SECTION 2: 📝 السلوك */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>📝 السلوك والملاحظات</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">النقاط السلوكية</span>
                </div>

                {activeReportModal.behavior.hasData ? (
                  <div className="space-y-2.5">
                    {/* Positive Records */}
                    {activeReportModal.behavior.positiveRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start justify-between text-xs gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span className="text-emerald-600 font-black">🟢</span>
                            <span>{rec.title}</span>
                          </p>
                          {rec.note && <p className="text-emerald-800 text-[11px]">{rec.note}</p>}
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-[11px] shrink-0">
                          +{rec.points} نقطة
                        </span>
                      </div>
                    ))}

                    {/* Negative Records */}
                    {activeReportModal.behavior.negativeRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex items-start justify-between text-xs gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-950 flex items-center gap-1.5">
                            <span className="text-rose-600 font-black">🔴</span>
                            <span>{rec.title}</span>
                          </p>
                          {rec.note && <p className="text-rose-800 text-[11px]">{rec.note}</p>}
                        </div>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-extrabold text-[11px] shrink-0">
                          -{rec.points} نقطة
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center text-slate-500 text-xs font-medium">
                    لا توجد بيانات كافية حتى الآن
                  </div>
                )}
              </div>

              {/* SECTION 3: 🏆 الأوسمة */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>🏆 الأوسمة والإنجازات</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">شارات التميز</span>
                </div>

                {activeReportModal.badges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeReportModal.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center gap-3 text-xs"
                      >
                        <div className="text-2xl p-2 bg-white rounded-lg shadow-2xs border border-amber-100">
                          {badge.icon || '🏆'}
                        </div>
                        <div>
                          <p className="font-extrabold text-amber-950">{badge.name}</p>
                          <p className="text-[10px] text-amber-800 font-medium">
                            تم الحصول عليه: {badge.awardedAt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center text-slate-500 text-xs font-medium">
                    لا توجد بيانات كافية حتى الآن
                  </div>
                )}
              </div>

              {/* SECTION 4: ملخص الأسبوع / ملخص الشهر */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <h4 className="font-black text-sm text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>
                      {activeReportModal.reportType === 'weekly' ? 'ملخص الأسبوع' : 'ملخص الشهر'}
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                    تقييم آلي دقيق
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {activeReportModal.summaryText}
                </p>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-[11px] text-slate-400 font-medium">
                جمهورية مصر العربية - منصة تقارير الطالب
              </p>
              <button
                onClick={() => setActiveReportModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
