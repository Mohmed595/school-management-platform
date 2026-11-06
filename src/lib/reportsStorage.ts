import { AttendanceRecord, GradeRecord, BehaviorRecord } from '../types/admin';
import { School } from '../types';
import { getStoredSchools, saveStoredSchools } from './storage';
import { getStorage, setStorage, notifyDataChanged } from './adminStorage';
import { getStudentBadges } from './badgeStorage';
import { StudentBadge, Badge } from '../types/badge';

export interface StoredReportRecord {
  id: string; // school_student_period
  school_id: string;
  student_id: string;
  report_type: 'weekly' | 'monthly';
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  available_at: string; // YYYY-MM-DD
  status: 'available' | 'locked';
  month?: number;
  year?: number;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY_STUDENT_REPORTS = 'eg_student_reports_v1';

export const EGYPTIAN_MONTH_NAMES_AR: Record<number, string> = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'مايو',
  6: 'يونيو',
  7: 'يوليو',
  8: 'أغسطس',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر',
};

export const ARABIC_WEEKDAYS: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

/**
 * Parses YYYY-MM-DD cleanly into local Date without UTC offset shifts
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formats local Date to YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats date into Arabic display string, e.g. "11 سبتمبر 2026" or "الجمعة، 11 سبتمبر 2026"
 */
export function formatArabicDateDisplay(dateStr: string, includeDayName: boolean = false): string {
  try {
    const dt = parseLocalDate(dateStr);
    const dayName = ARABIC_WEEKDAYS[dt.getDay()];
    const dayNum = dt.getDate();
    const monthName = EGYPTIAN_MONTH_NAMES_AR[dt.getMonth() + 1];
    const yearNum = dt.getFullYear();

    if (includeDayName) {
      return `${dayName}، ${dayNum} ${monthName} ${yearNum}`;
    }
    return `${dayNum} ${monthName} ${yearNum}`;
  } catch {
    return dateStr;
  }
}

/**
 * Get or initialize attendance_start_date for a school
 */
export function getSchoolAttendanceStartDate(schoolId: string): string | null {
  const schools = getStoredSchools();
  const school = schools.find((s) => s.id === schoolId);
  if (school && school.attendance_start_date) {
    return school.attendance_start_date;
  }

  // Fallback: Check if any attendance records exist for this school in storage
  const allAttendance = getStorage<AttendanceRecord[]>('attendance', []).filter(
    (a) => a.schoolId === schoolId
  );
  if (allAttendance.length > 0) {
    const dates = allAttendance.map((a) => a.date).sort();
    const earliestDate = dates[0];
    if (earliestDate) {
      setSchoolAttendanceStartDate(schoolId, earliestDate);
      return earliestDate;
    }
  }

  return null;
}

/**
 * Sets attendance_start_date when attendance is submitted for the FIRST time ever.
 * Value must NEVER change automatically once established.
 */
export function ensureSchoolAttendanceStartDate(schoolId: string, submissionDate?: string): string {
  const existing = getSchoolAttendanceStartDate(schoolId);
  if (existing) {
    return existing; // Value must never automatically change afterward
  }

  const dateToSet = submissionDate || formatLocalDate(new Date());
  setSchoolAttendanceStartDate(schoolId, dateToSet);
  return dateToSet;
}

function setSchoolAttendanceStartDate(schoolId: string, dateStr: string): void {
  const schools = getStoredSchools();
  const idx = schools.findIndex((s) => s.id === schoolId);
  if (idx >= 0) {
    schools[idx].attendance_start_date = dateStr;
    saveStoredSchools(schools);
  }
}

/**
 * Finds the NEXT Friday on or after given dateStr
 */
export function getNextFridayFromDate(startDateStr: string): string {
  const dt = parseLocalDate(startDateStr);
  const dayOfWeek = dt.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  // Days to add to reach Friday (5)
  let daysToAdd = (5 - dayOfWeek + 7) % 7;
  // If dateStr is already a Friday, the prompt states:
  // "Find the next Friday after that date" (or Friday itself if release day)
  if (daysToAdd === 0) daysToAdd = 0; // release day
  const target = new Date(dt);
  target.setDate(dt.getDate() + daysToAdd);
  return formatLocalDate(target);
}

export interface WeeklySlotInfo {
  id: string; // school_student_start_end
  schoolId: string;
  periodStart: string; // Saturday
  periodEnd: string;   // Thursday
  availableAt: string; // Friday
  isAvailable: boolean;
  formattedAvailableAt: string;
  formattedPeriodRange: string;
}

/**
 * Calculates Weekly Reports Schedule for a school relative to today
 */
export function getWeeklyReportsSchedule(
  schoolId: string,
  todayStr: string = formatLocalDate(new Date())
): WeeklySlotInfo[] {
  const startDateStr = getSchoolAttendanceStartDate(schoolId);
  if (!startDateStr) {
    // Attendance hasn't started yet
    // Next Friday from today is default upcoming locked report
    const nextFri = getNextFridayFromDate(todayStr);
    return [
      {
        id: `weekly_${schoolId}_pending`,
        schoolId,
        periodStart: todayStr,
        periodEnd: todayStr,
        availableAt: nextFri,
        isAvailable: false,
        formattedAvailableAt: formatArabicDateDisplay(nextFri, true),
        formattedPeriodRange: 'غير متاح بعد',
      },
    ];
  }

  const firstFridayStr = getNextFridayFromDate(startDateStr);
  const slots: WeeklySlotInfo[] = [];

  // Generate weekly slots starting from firstFridayStr
  let currentFriDate = parseLocalDate(firstFridayStr);
  const todayDate = parseLocalDate(todayStr);

  // Loop through Fridays until we pass todayDate
  let keepGoing = true;
  let safetyCount = 0;

  while (keepGoing && safetyCount < 104) { // max 2 years
    safetyCount++;
    const currentFriStr = formatLocalDate(currentFriDate);
    const isAvailable = currentFriStr <= todayStr;

    // Report covers previous completed school week: Saturday -> Thursday
    // Thursday before release Friday
    const thursDate = new Date(currentFriDate);
    thursDate.setDate(currentFriDate.getDate() - 1);
    const periodEndStr = formatLocalDate(thursDate);

    // Saturday before Thursday
    const satDate = new Date(thursDate);
    satDate.setDate(thursDate.getDate() - 5);
    const periodStartStr = formatLocalDate(satDate);

    slots.push({
      id: `weekly_${schoolId}_${periodStartStr}_${periodEndStr}`,
      schoolId,
      periodStart: periodStartStr,
      periodEnd: periodEndStr,
      availableAt: currentFriStr,
      isAvailable,
      formattedAvailableAt: formatArabicDateDisplay(currentFriStr, true),
      formattedPeriodRange: `${formatArabicDateDisplay(periodStartStr)} - ${formatArabicDateDisplay(periodEndStr)}`,
    });

    if (currentFriStr > todayStr) {
      // Reached first locked upcoming Friday
      keepGoing = false;
    } else {
      // Advance by 7 days to next Friday
      currentFriDate.setDate(currentFriDate.getDate() + 7);
    }
  }

  return slots;
}

export interface MonthlySlotInfo {
  id: string; // school_month_year
  schoolId: string;
  year: number;
  month: number;
  monthNameArabic: string;
  periodStart: string;
  periodEnd: string;
  availableAt: string;
  isAvailable: boolean;
  formattedAvailableAt: string;
  formattedPeriodRange: string;
}

/**
 * Calculates Monthly Reports Schedule for a school relative to today
 */
export function getMonthlyReportsSchedule(
  schoolId: string,
  todayStr: string = formatLocalDate(new Date())
): MonthlySlotInfo[] {
  const startDateStr = getSchoolAttendanceStartDate(schoolId);
  if (!startDateStr) {
    const today = parseLocalDate(todayStr);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const availStr = formatLocalDate(nextMonth);
    return [
      {
        id: `monthly_${schoolId}_pending`,
        schoolId,
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth() + 1,
        monthNameArabic: EGYPTIAN_MONTH_NAMES_AR[nextMonth.getMonth() + 1],
        periodStart: todayStr,
        periodEnd: todayStr,
        availableAt: availStr,
        isAvailable: false,
        formattedAvailableAt: formatArabicDateDisplay(availStr),
        formattedPeriodRange: 'غير متاح بعد',
      },
    ];
  }

  const startDt = parseLocalDate(startDateStr);
  const origDay = startDt.getDate();
  const slots: MonthlySlotInfo[] = [];

  let n = 1;
  let keepGoing = true;
  let safety = 0;

  let prevReleaseStr = startDateStr;

  while (keepGoing && safety < 36) { // max 3 years
    safety++;
    // Target month: startDt + n months
    const targetY = startDt.getFullYear() + Math.floor((startDt.getMonth() + n) / 12);
    const targetM = ((startDt.getMonth() + n) % 12) + 1;

    // Days in target month
    const daysInMonth = new Date(targetY, targetM, 0).getDate();
    const relDay = Math.min(origDay, daysInMonth);

    const availDate = new Date(targetY, targetM - 1, relDay);
    const availStr = formatLocalDate(availDate);

    // period_end is 1 day before availDate
    const periodEndDt = new Date(availDate);
    periodEndDt.setDate(availDate.getDate() - 1);
    const periodEndStr = formatLocalDate(periodEndDt);

    const isAvailable = availStr <= todayStr;

    slots.push({
      id: `monthly_${schoolId}_${targetY}_${targetM}`,
      schoolId,
      year: targetY,
      month: targetM,
      monthNameArabic: `${EGYPTIAN_MONTH_NAMES_AR[targetM]} ${targetY}`,
      periodStart: prevReleaseStr,
      periodEnd: periodEndStr,
      availableAt: availStr,
      isAvailable,
      formattedAvailableAt: formatArabicDateDisplay(availStr),
      formattedPeriodRange: `${formatArabicDateDisplay(prevReleaseStr)} - ${formatArabicDateDisplay(periodEndStr)}`,
    });

    prevReleaseStr = availStr;

    if (availStr > todayStr) {
      keepGoing = false;
    } else {
      n++;
    }
  }

  return slots;
}

export interface DetailedStudentReport {
  id: string;
  schoolId: string;
  studentId: string;
  reportType: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  availableAt: string;
  isAvailable: boolean;
  formattedAvailableAt: string;
  formattedPeriodRange: string;
  title: string;
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalRecordedDays: number;
    hasData: boolean;
  };
  behavior: {
    positiveRecords: Array<{ id: string; title: string; points: number; date: string; note?: string }>;
    negativeRecords: Array<{ id: string; title: string; points: number; date: string; note?: string }>;
    hasData: boolean;
  };
  badges: Array<{ id: string; name: string; icon: string; rarity: string; awardedAt: string }>;
  examGrades: Array<{ subjectName: string; score: number; maxScore: number; date: string }>;
  summaryText: string;
  hasAnyData: boolean;
}

/**
 * Compiles and fetches detailed student report data strictly from stored database records
 */
export function getStudentReportDetails(
  schoolId: string,
  studentId: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  availableAt: string,
  isAvailable: boolean,
  slotTitle: string
): DetailedStudentReport {
  // 1. Fetch Attendance Records for this student & period
  const allAttendance = getStorage<AttendanceRecord[]>('attendance', []).filter(
    (a) => a.schoolId === schoolId && a.studentId === studentId && a.date >= periodStart && a.date <= periodEnd
  );

  const presentDays = allAttendance.filter((a) => a.status === 'حاضر').length;
  const absentDays = allAttendance.filter((a) => a.status === 'غائب').length;
  const lateDays = allAttendance.filter((a) => a.status === 'متأخر').length;
  const totalRecordedDays = allAttendance.length;
  const attendanceHasData = totalRecordedDays > 0;

  // 2. Fetch Behavior Records
  const allBehavior = getStorage<BehaviorRecord[]>('behavior', []).filter(
    (b) => b.schoolId === schoolId && b.studentId === studentId && b.date >= periodStart && b.date <= periodEnd
  );

  const positiveRecords = allBehavior
    .filter((b) => b.type === 'إيجابي' || b.points > 0)
    .map((b) => ({
      id: b.id,
      title: b.title || b.notes || 'ملاحظة إيجابية',
      points: Math.abs(b.points || 1),
      date: b.date,
      note: b.notes,
    }));

  const negativeRecords = allBehavior
    .filter((b) => b.type === 'سلبي' || b.points < 0)
    .map((b) => ({
      id: b.id,
      title: b.title || b.notes || 'ملاحظة سلبية',
      points: Math.abs(b.points || 1),
      date: b.date,
      note: b.notes,
    }));

  const behaviorHasData = positiveRecords.length > 0 || negativeRecords.length > 0;

  // 3. Fetch Badges Earned
  const studentBadgeItems = getStudentBadges(studentId);
  const badgesEarned = studentBadgeItems
    .filter((sb) => {
      const awarded = sb.assignment.awardedAt;
      return awarded && awarded >= periodStart && awarded <= periodEnd;
    })
    .map((sb) => ({
      id: sb.badge.id,
      name: sb.badge.name,
      icon: sb.badge.icon,
      rarity: sb.badge.rarity,
      awardedAt: sb.assignment.awardedAt || periodStart,
    }));

  // 4. Fetch Exam Grades
  const allGrades = getStorage<GradeRecord[]>('grades', []).filter(
    (g) => g.schoolId === schoolId && g.studentId === studentId && g.date >= periodStart && g.date <= periodEnd
  );

  const examGrades = allGrades.map((g) => ({
    subjectName: g.subjectName || 'المادة',
    score: g.score,
    maxScore: g.maxScore || 20,
    date: g.date,
  }));

  const hasAnyData = attendanceHasData || behaviorHasData || badgesEarned.length > 0 || examGrades.length > 0;

  // 5. Construct Summary Text strictly from actual stored data
  let summaryText = 'لا توجد بيانات كافية حتى الآن';

  if (hasAnyData) {
    const parts: string[] = [];

    if (attendanceHasData) {
      if (absentDays === 0 && lateDays === 0) {
        parts.push(`حضور ممتاز بنسبة 100% خلال الفترة المسجلة (${presentDays} أيام حضور).`);
      } else {
        parts.push(`تم تسجيل ${presentDays} أيام حضور، و${absentDays} أيام غياب، و${lateDays} أيام تأخير.`);
      }
    }

    if (positiveRecords.length > 0) {
      parts.push(`حقق الطالب ${positiveRecords.length} ملاحظات سلوكية إيجابية مشرفة.`);
    }

    if (negativeRecords.length > 0) {
      parts.push(`توجد ${negativeRecords.length} تنبيهات سلوكية تتطلب المتابعة والتحسين.`);
    }

    if (badgesEarned.length > 0) {
      parts.push(`تم الحصول على ${badgesEarned.length} أوسمة إنجاز جديدة.`);
    }

    if (examGrades.length > 0) {
      parts.push(`تتوفر نتائج ${examGrades.length} اختبارات خلال هذه الفترة.`);
    }

    summaryText = parts.join(' ');
  }

  return {
    id: `${reportType}_${schoolId}_${studentId}_${periodStart}_${periodEnd}`,
    schoolId,
    studentId,
    reportType,
    periodStart,
    periodEnd,
    availableAt,
    isAvailable,
    formattedAvailableAt: formatArabicDateDisplay(availableAt, true),
    formattedPeriodRange: `${formatArabicDateDisplay(periodStart)} - ${formatArabicDateDisplay(periodEnd)}`,
    title: slotTitle,
    attendance: {
      presentDays,
      absentDays,
      lateDays,
      totalRecordedDays,
      hasData: attendanceHasData,
    },
    behavior: {
      positiveRecords,
      negativeRecords,
      hasData: behaviorHasData,
    },
    badges: badgesEarned,
    examGrades,
    summaryText,
    hasAnyData,
  };
}

/**
 * Persistent Report Instance Management
 * Guarantees report uniqueness according to database constraints:
 * - Weekly: school + student + period_start + period_end
 * - Monthly: school + student + month + year
 */
export function persistReportLog(report: DetailedStudentReport, month?: number, year?: number): void {
  try {
    const all = getStorage<StoredReportRecord[]>(STORAGE_KEY_STUDENT_REPORTS, []);
    const nowIso = new Date().toISOString();

    const existingIndex = all.findIndex((r) => {
      if (r.school_id !== report.schoolId || r.student_id !== report.studentId) return false;
      if (r.report_type !== report.reportType) return false;
      if (report.reportType === 'weekly') {
        return r.period_start === report.periodStart && r.period_end === report.periodEnd;
      } else {
        return r.month === month && r.year === year;
      }
    });

    const recordToSave: StoredReportRecord = {
      id: report.id,
      school_id: report.schoolId,
      student_id: report.studentId,
      report_type: report.reportType,
      period_start: report.periodStart,
      period_end: report.periodEnd,
      available_at: report.availableAt,
      status: report.isAvailable ? 'available' : 'locked',
      month,
      year,
      created_at: existingIndex >= 0 ? all[existingIndex].created_at : nowIso,
      updated_at: nowIso,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = recordToSave;
    } else {
      all.unshift(recordToSave);
    }

    setStorage(STORAGE_KEY_STUDENT_REPORTS, all);
  } catch (err) {
    console.error('Failed to persist student report log', err);
  }
}

/**
 * Access Control Enforcement
 */
export function checkReportAccessPermission(
  userRole: string,
  userSchoolId?: string,
  userStudentId?: string,
  targetSchoolId?: string,
  targetStudentId?: string
): { allowed: boolean; reason?: string } {
  if (userRole === 'owner') {
    return { allowed: true };
  }

  if (userRole === 'school_admin') {
    if (userSchoolId === targetSchoolId) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'لا تملك صلاحية عرض تقارير طلاب من مدرسة أخرى' };
  }

  if (userRole === 'student' || userRole === 'parent') {
    if (userStudentId === targetStudentId) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'يمكنك فقط عرض التقارير الخاصة بحسابك' };
  }

  return { allowed: false, reason: 'غير مصرح لك باستعراض تقارير الطلاب' };
}
