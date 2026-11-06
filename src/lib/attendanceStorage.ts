import { AttendanceRecord, AttendanceStatus, ClassRoom, Student } from '../types/admin';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getAttendanceBySchool,
  saveAttendanceRecords,
  getSchoolAdminInfo,
  notifyDataChanged,
} from './adminStorage';

export interface AttendanceCompletionSession {
  date: string;
  schoolId: string;
  completedAt: string; // ISO string or time string e.g. "09:45 AM"
  totalClassesCount: number;
  totalStudentsCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  durationMinutes: number;
  teacherName: string;
}

const ATTENDANCE_SESSIONS_KEY = 'eg_attendance_sessions_v1';

// Format current Arabic date with day name e.g. "الخميس 27 يوليو 2026"
export function getArabicFormattedTodayDate(): { isoDate: string; dayName: string; fullFormatted: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
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

  const dayName = dayNames[now.getDay()];
  const monthName = monthNames[now.getMonth()];
  const fullFormatted = `${dayName} ${now.getDate()} ${monthName} ${year}`;

  return { isoDate, dayName, fullFormatted };
}

// Get session completion metadata for a date
export function getAttendanceSessionForDate(
  schoolId: string,
  dateIso: string
): AttendanceCompletionSession | null {
  try {
    const raw = localStorage.getItem(ATTENDANCE_SESSIONS_KEY);
    if (!raw) return null;
    const sessions: AttendanceCompletionSession[] = JSON.parse(raw);
    return sessions.find((s) => s.schoolId === schoolId && s.date === dateIso) || null;
  } catch {
    return null;
  }
}

// Save completion session metadata
export function saveAttendanceSession(session: AttendanceCompletionSession): void {
  try {
    const raw = localStorage.getItem(ATTENDANCE_SESSIONS_KEY);
    const sessions: AttendanceCompletionSession[] = raw ? JSON.parse(raw) : [];
    const index = sessions.findIndex((s) => s.schoolId === session.schoolId && s.date === session.date);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(ATTENDANCE_SESSIONS_KEY, JSON.stringify(sessions));
    notifyDataChanged('attendance_sessions');
  } catch (err) {
    console.error('Failed to save attendance session', err);
  }
}

// Check if all classes in school have attendance recorded for a date
export function checkSchoolAttendanceStatusForDate(
  schoolId: string,
  dateIso: string
): {
  isCompleted: boolean;
  totalClasses: number;
  completedClassesCount: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  sessionInfo: AttendanceCompletionSession | null;
} {
  const classes = getClassesBySchool(schoolId);
  const students = getStudentsBySchool(schoolId);
  const records = getAttendanceBySchool(schoolId, dateIso);
  const sessionInfo = getAttendanceSessionForDate(schoolId, dateIso);

  const totalClasses = classes.length;
  const totalStudents = students.length;

  // Count how many classes have at least one record for dateIso
  const classIdsWithRecords = new Set(records.map((r) => r.classId));
  const completedClassesCount = classes.filter((c) => classIdsWithRecords.has(c.id)).length;

  // Completed if sessionInfo exists OR all classes have records recorded OR records exist for today
  const isCompleted = !!sessionInfo || (completedClassesCount >= totalClasses && totalClasses > 0) || records.length > 0;

  if (totalClasses === 0 && !isCompleted) {
    return {
      isCompleted: false,
      totalClasses: 0,
      completedClassesCount: 0,
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      sessionInfo: null,
    };
  }

  let presentCount = sessionInfo ? sessionInfo.presentCount : 0;
  let absentCount = sessionInfo ? sessionInfo.absentCount : 0;
  let lateCount = sessionInfo ? sessionInfo.lateCount : 0;

  if (!sessionInfo && records.length > 0) {
    records.forEach((r) => {
      if (r.status === 'حاضر') presentCount++;
      else if (r.status === 'غائب') absentCount++;
      else if (r.status === 'متأخر') lateCount++;
    });
  }

  return {
    isCompleted,
    totalClasses: sessionInfo ? sessionInfo.totalClassesCount : totalClasses,
    completedClassesCount: isCompleted ? totalClasses : completedClassesCount,
    totalStudents: sessionInfo ? sessionInfo.totalStudentsCount : (totalStudents || records.length),
    presentCount,
    absentCount,
    lateCount,
    sessionInfo,
  };
}

// Bulk save attendance for a class
export async function saveClassAttendanceBatch(
  schoolId: string,
  classObj: ClassRoom,
  dateIso: string,
  studentStatusMap: Record<string, AttendanceStatus>,
  attendanceTeacherId: string
): Promise<void> {
  const students = getStudentsBySchool(schoolId).filter(
    (s) => s.classId === classObj.id || s.className === classObj.name
  );

  const nowIso = new Date().toISOString();

  const recordsToSave: (AttendanceRecord & { attendance_teacher_id?: string; created_at?: string })[] =
    students.map((std) => {
      const status = studentStatusMap[std.id] || 'حاضر';
      return {
        id: `att-${schoolId}-${std.id}-${dateIso}`,
        schoolId,
        studentId: std.id,
        studentName: std.name,
        classId: classObj.id,
        className: classObj.name,
        date: dateIso,
        status,
        attendance_teacher_id: attendanceTeacherId,
        created_at: nowIso,
      };
    });

  await saveAttendanceRecords(recordsToSave);
}
