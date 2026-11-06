import { AttendanceRecord, Student } from '../types/admin';
import { getStorage } from './adminStorage';
import { awardBadgeToStudent, getAllBadges } from './badgeStorage';

export type StreakTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type StreakStatus = 'active' | 'at_risk' | 'broken' | 'new';

export interface StreakDayItem {
  date: string;
  dayName: string;
  formattedDate: string;
  status: 'حاضر' | 'غائب' | 'متأخر' | 'عطلة' | 'غير_مسجل';
  isStreakDay: boolean;
}

export interface StudentStreakInfo {
  studentId: string;
  studentName: string;
  schoolId: string;
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  streakTier: StreakTier;
  streakTitle: string;
  nextMilestone: number;
  daysToNextMilestone: number;
  milestoneProgress: number; // 0 to 100
  lastAttendedDate: string | null;
  isTodayPresent: boolean;
  recentDays: StreakDayItem[];
  streakMultiplier: number;
}

// Milestone thresholds and attendance goal definitions
export const STREAK_MILESTONES = [
  { days: 3, tier: 'bronze' as StreakTier, title: 'محطة الانطلاقة 🌱', badgeId: 'badge-streak-3', icon: '🎯', desc: 'هدف حضور 3 أيام متتالية دون غياب' },
  { days: 7, tier: 'silver' as StreakTier, title: 'هدف الأسبوع الكامل ⭐', badgeId: 'badge-streak-7', icon: '⭐', desc: 'هدف حضور أسبوع دراسي كامل دون أي غياب' },
  { days: 14, tier: 'gold' as StreakTier, title: 'محطة الانضباط المتواصل 🎯', badgeId: 'badge-streak-14', icon: '🔥', desc: 'هدف أسبوعين متتاليين من المواظبة المستمرة' },
  { days: 30, tier: 'platinum' as StreakTier, title: 'محطة الالتزام الشهري 🛡️', badgeId: 'badge-streak-30', icon: '🛡️', desc: 'هدف شهر كامل من الانضباط والمواظبة اليومية' },
  { days: 50, tier: 'diamond' as StreakTier, title: 'قمة المواظبة المدرسية 👑', badgeId: 'badge-streak-50', icon: '👑', desc: 'سلسلة تاريخية من الحضور المتواصل وتحقيق الأهداف' },
];

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Helper to determine streak tier from streak count
export function getStreakTier(days: number): { tier: StreakTier; title: string; multiplier: number } {
  if (days >= 50) return { tier: 'diamond', title: 'أسطورة الالتزام المدرسي 👑', multiplier: 2.0 };
  if (days >= 30) return { tier: 'platinum', title: 'درع المواظبة الفولاذي 🛡️', multiplier: 1.8 };
  if (days >= 14) return { tier: 'gold', title: 'نجم الانضباط المتواصل 🏆', multiplier: 1.5 };
  if (days >= 7) return { tier: 'silver', title: 'أسبوع من الالتزام ⭐', multiplier: 1.3 };
  if (days >= 3) return { tier: 'bronze', title: 'شعلة المواظبة 🔥', multiplier: 1.1 };
  return { tier: 'bronze', title: 'بداية السلسلة 🌱', multiplier: 1.0 };
}

// Calculate streak details from attendance records
export function calculateStreakFromAttendance(
  studentId: string,
  studentName: string,
  schoolId: string,
  studentRecords: AttendanceRecord[],
  allSchoolRecords?: AttendanceRecord[]
): StudentStreakInfo {
  // Sort student records chronologically (oldest to newest)
  const sorted = [...studentRecords]
    .filter((r) => r.date)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let lastAttendedDate: string | null = null;

  // Track distinct dates where the student has an attendance record
  const studentDateMap: Record<string, 'حاضر' | 'غائب' | 'متأخر'> = {};
  sorted.forEach((r) => {
    studentDateMap[r.date] = (r.status as 'حاضر' | 'غائب' | 'متأخر') || 'حاضر';
  });

  // Calculate streaks across recorded dates
  sorted.forEach((r) => {
    const isAttended = r.status === 'حاضر' || r.status === 'متأخر';
    if (isAttended) {
      runningStreak += 1;
      lastAttendedDate = r.date;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  });

  currentStreak = runningStreak;

  // If student has no recorded attendance or no current active run
  if (sorted.length === 0) {
    currentStreak = 0;
    longestStreak = 0;
    lastAttendedDate = null;
  } else if (currentStreak === 0 && sorted.some((r) => r.status === 'حاضر' || r.status === 'متأخر')) {
    // If student was absent or unrecorded on the last day, keep longest historical streak
    longestStreak = Math.max(longestStreak, 0);
  }

  // Today's date check
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayRecord = studentDateMap[todayIso];
  const isTodayPresent = todayRecord === 'حاضر' || todayRecord === 'متأخر';

  // Status check
  let streakStatus: StreakStatus = 'new';
  if (sorted.length === 0 || currentStreak === 0) {
    streakStatus = sorted.length === 0 ? 'new' : 'broken';
  } else if (currentStreak >= 3) {
    streakStatus = todayRecord === 'غائب' ? 'broken' : 'active';
  } else if (currentStreak > 0) {
    streakStatus = 'active';
  }

  const { tier, title, multiplier } = getStreakTier(currentStreak);

  // Next Milestone calculation
  let nextMilestone = 3;
  for (const m of STREAK_MILESTONES) {
    if (currentStreak < m.days) {
      nextMilestone = m.days;
      break;
    }
    nextMilestone = m.days + 15;
  }

  const prevMilestone = STREAK_MILESTONES.slice().reverse().find((m) => m.days <= currentStreak)?.days || 0;
  const daysToNextMilestone = Math.max(1, nextMilestone - currentStreak);
  const milestoneRange = Math.max(1, nextMilestone - prevMilestone);
  const progressInCurrentRange = Math.max(0, currentStreak - prevMilestone);
  const milestoneProgress = Math.min(100, Math.round((progressInCurrentRange / milestoneRange) * 100));

  // Build Recent 5 School Days (Sunday to Thursday)
  const recentDays: StreakDayItem[] = [];
  const currentDay = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - currentDay);

  for (let i = 0; i < 5; i++) {
    const dObj = new Date(sunday);
    dObj.setDate(sunday.getDate() + i);
    const dIso = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
    const dayName = ARABIC_DAYS[dObj.getDay()];
    const formattedDate = `${dObj.getDate()}/${dObj.getMonth() + 1}`;

    const recStatus = studentDateMap[dIso];
    let finalStatus: StreakDayItem['status'] = 'غير_مسجل';
    let isStreak = false;

    if (recStatus) {
      finalStatus = recStatus;
      isStreak = recStatus === 'حاضر' || recStatus === 'متأخر';
    } else {
      finalStatus = 'غير_مسجل';
      isStreak = false;
    }

    recentDays.push({
      date: dIso,
      dayName,
      formattedDate,
      status: finalStatus,
      isStreakDay: isStreak,
    });
  }

  return {
    studentId,
    studentName,
    schoolId,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    streakStatus,
    streakTier: tier,
    streakTitle: title,
    nextMilestone,
    daysToNextMilestone,
    milestoneProgress,
    lastAttendedDate,
    isTodayPresent,
    recentDays,
    streakMultiplier: multiplier,
  };
}

// Get streak info for any student
export function getStudentStreakInfo(studentId: string, schoolId: string = 'sch-1'): StudentStreakInfo {
  const allAttendance = getStorage<AttendanceRecord[]>('attendance', []);
  const allStudents = getStorage<Student[]>('students', []);

  const student = allStudents.find((s) => s.id === studentId);
  const studentName = student ? student.name : 'الطالب';
  const effectiveSchoolId = student?.schoolId || schoolId;

  const studentRecords = allAttendance.filter(
    (a) => a.schoolId === effectiveSchoolId && (a.studentId === studentId || a.studentName === studentName)
  );

  return calculateStreakFromAttendance(
    studentId,
    studentName,
    effectiveSchoolId,
    studentRecords,
    allAttendance.filter((a) => a.schoolId === effectiveSchoolId)
  );
}

// Get top streaks for a school (Leaderboard)
export function getTopSchoolStreaks(schoolId: string, limit: number = 5): StudentStreakInfo[] {
  const allStudents = getStorage<Student[]>('students', []).filter((s) => s.schoolId === schoolId);
  const allAttendance = getStorage<AttendanceRecord[]>('attendance', []).filter((a) => a.schoolId === schoolId);

  const streakList: StudentStreakInfo[] = allStudents.map((s) => {
    const studentRecords = allAttendance.filter((a) => a.studentId === s.id || a.studentName === s.name);
    return calculateStreakFromAttendance(s.id, s.name, schoolId, studentRecords);
  });

  return streakList
    .sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak)
    .slice(0, limit);
}

// Check and award streak badges
export function checkAndAwardStreakBadges(studentId: string, schoolId: string, streakCount: number): void {
  try {
    STREAK_MILESTONES.forEach((m) => {
      if (streakCount >= m.days) {
        awardBadgeToStudent(studentId, m.badgeId, schoolId, 'نظام سلاسل المواظبة');
      }
    });
  } catch (e) {
    // Non-blocking
    console.warn('Could not auto-award streak badge:', e);
  }
}
