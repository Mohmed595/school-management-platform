import { AttendanceRecord, Student } from '../types/admin';
import { AdministrativeAction } from '../types/adminAction';
import { getStorage, setStorage, notifyDataChanged, getStudentsBySchool, getTeachersBySchool } from './adminStorage';
import { getAllAdminActions } from './adminActionStorage';
import {
  fetchSmartSuspensionAlertsApi,
  createSmartSuspensionAlertApi,
  resolveSmartSuspensionAlertApi,
  fetchSmartSuspensionAuditLogsApi,
} from './schoolApi';
import { getStoredSession } from './storage';

export interface SmartSuspensionAlert {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  grade: string;
  className: string;
  attendanceStatus: 'حاضر' | 'متأخر';
  suspensionId: string;
  suspensionStartDate: string;
  suspensionEndDate: string;
  suspensionReason: string;
  attendanceTeacherId?: string | null;
  attendanceTeacherName: string;
  recordedTime: string; // e.g. "10:30 صباحاً"
  recordedDate: string; // YYYY-MM-DD
  status: 'active' | 'resolved';
  resolvedAction?: 'corrected_attendance' | 'ended_suspension' | 'ignored' | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  ignoreReason?: string | null;
  createdAt: string; // ISO string
  priority: 'High';
  color: 'orange';
  persistent: true;
}

export interface SmartRuleAuditLog {
  id: string;
  schoolId: string;
  alertId: string;
  studentId: string;
  studentName: string;
  teacherName: string;
  adminName: string;
  actionTaken: 'تصحيح الحضور' | 'إنهاء الإيقاف' | 'تجاهل مع سبب' | 'إنشاء التنبيه الآلي';
  timestamp: string; // ISO date string
  reason?: string | null;
}

const SMART_ALERTS_KEY = 'smart_suspension_alerts_v1';
const SMART_AUDIT_KEY = 'smart_suspension_audit_v1';

// Helper to format current time in Arabic (e.g., "10:15 صباحاً")
export function getArabicFormattedTime(date: Date = new Date()): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}

// ----------------------------------------------------
// GETTERS (Local Cache Fallback)
// ----------------------------------------------------

export function getAllSmartSuspensionAlerts(schoolId?: string): SmartSuspensionAlert[] {
  const alerts = getStorage<SmartSuspensionAlert[]>(SMART_ALERTS_KEY, []);
  if (!schoolId) return alerts;
  return alerts.filter((a) => a.schoolId === schoolId);
}

export function getActiveSmartSuspensionAlerts(schoolId?: string): SmartSuspensionAlert[] {
  return getAllSmartSuspensionAlerts(schoolId).filter((a) => a.status === 'active');
}

export function getSmartRuleAuditLogs(schoolId?: string): SmartRuleAuditLog[] {
  const logs = getStorage<SmartRuleAuditLog[]>(SMART_AUDIT_KEY, []);
  if (!schoolId) return logs;
  return logs.filter((l) => l.schoolId === schoolId);
}

// ----------------------------------------------------
// SERVER FETCH & SYNC (NO notifyDataChanged on fetch)
// ----------------------------------------------------

export async function fetchAndSyncSmartSuspensionAlerts(schoolId: string): Promise<SmartSuspensionAlert[]> {
  try {
    const alerts = await fetchSmartSuspensionAlertsApi(schoolId);
    // Merge into local cache
    const existing = getStorage<SmartSuspensionAlert[]>(SMART_ALERTS_KEY, []);
    const otherSchools = existing.filter((a) => a.schoolId !== schoolId);
    const updated = [...alerts, ...otherSchools];
    setStorage(SMART_ALERTS_KEY, updated);
    return alerts;
  } catch (err) {
    return getAllSmartSuspensionAlerts(schoolId);
  }
}

export async function fetchAndSyncSmartRuleAuditLogs(schoolId: string): Promise<SmartRuleAuditLog[]> {
  try {
    const logs = await fetchSmartSuspensionAuditLogsApi(schoolId);
    // Merge into local cache
    const existing = getStorage<SmartRuleAuditLog[]>(SMART_AUDIT_KEY, []);
    const otherSchools = existing.filter((l) => l.schoolId !== schoolId);
    const updated = [...logs, ...otherSchools];
    setStorage(SMART_AUDIT_KEY, updated);
    return logs;
  } catch (err) {
    return getSmartRuleAuditLogs(schoolId);
  }
}

// ----------------------------------------------------
// AUDIT LOG HELPER
// ----------------------------------------------------

export function addSmartRuleAuditLog(logData: Omit<SmartRuleAuditLog, 'id' | 'timestamp'>): SmartRuleAuditLog {
  const logs = getSmartRuleAuditLogs(logData.schoolId);
  const newLog: SmartRuleAuditLog = {
    ...logData,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const existing = getStorage<SmartRuleAuditLog[]>(SMART_AUDIT_KEY, []);
  setStorage(SMART_AUDIT_KEY, [newLog, ...existing.filter((l) => l.id !== newLog.id)]);
  return newLog;
}

// ----------------------------------------------------
// RULE EVALUATION ENGINE
// ----------------------------------------------------

/**
 * IF Student has an active suspension AND Today's attendance is "Present" or "Late"
 * THEN Create a Critical Alert immediately after attendance is saved, written authoritatively to PostgreSQL.
 */
export async function evaluateAttendanceForSuspensionRule(
  schoolId: string,
  records: (AttendanceRecord & { attendance_teacher_id?: string })[],
  teacherNameFallback?: string
): Promise<SmartSuspensionAlert[]> {
  const presentOrLateRecords = records.filter((r) => r.status === 'حاضر' || r.status === 'متأخر');
  if (presentOrLateRecords.length === 0) return [];

  const allAdminActions = getAllAdminActions(schoolId);
  const activeSuspensions = allAdminActions.filter(
    (a) => a.actionType === 'temporary_suspension' && a.status === 'نشط'
  );

  if (activeSuspensions.length === 0) return [];

  const students = getStudentsBySchool(schoolId);
  const teachers = getTeachersBySchool(schoolId);
  const existingAlerts = getAllSmartSuspensionAlerts(schoolId);

  const createdAlerts: SmartSuspensionAlert[] = [];
  const updatedAlerts = [...existingAlerts];
  const now = new Date();
  const nowIso = now.toISOString();
  const timeFormatted = getArabicFormattedTime(now);

  for (const rec of presentOrLateRecords) {
    // Find if student has active suspension matching attendance date
    const studentSuspension = activeSuspensions.find((susp) => {
      if (susp.studentId !== rec.studentId) return false;

      // Date check
      const recDate = rec.date; // YYYY-MM-DD
      const start = susp.startDate || '1970-01-01';
      const end = susp.endDate || '2099-12-31';

      return recDate >= start && recDate <= end;
    });

    if (!studentSuspension) continue;

    // Check if an active alert already exists for this student on this date
    const isAlreadyAlerted = existingAlerts.some(
      (a) =>
        a.studentId === rec.studentId &&
        a.recordedDate === rec.date &&
        a.status === 'active'
    );

    if (isAlreadyAlerted) continue;

    // Resolve Teacher Name
    const studentObj = students.find((s) => s.id === rec.studentId);
    let teacherName = teacherNameFallback || 'مسؤول الحضور';

    if (rec.attendance_teacher_id) {
      const teacherObj = teachers.find((t) => t.id === rec.attendance_teacher_id);
      if (teacherObj) teacherName = teacherObj.name;
    }

    // Determine Grade/Stage
    const gradeName = rec.className || studentObj?.className || 'الصف غير محدد';

    const newAlert: SmartSuspensionAlert = {
      id: `alert-susp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId,
      studentId: rec.studentId,
      studentName: rec.studentName || studentObj?.name || 'طالب',
      studentCode: studentObj?.studentCode || rec.studentId,
      grade: gradeName,
      className: gradeName,
      attendanceStatus: rec.status as 'حاضر' | 'متأخر',
      suspensionId: studentSuspension.id,
      suspensionStartDate: studentSuspension.startDate || rec.date,
      suspensionEndDate: studentSuspension.endDate || rec.date,
      suspensionReason: studentSuspension.reason,
      attendanceTeacherId: rec.attendance_teacher_id || null,
      attendanceTeacherName: teacherName,
      recordedTime: timeFormatted,
      recordedDate: rec.date,
      status: 'active',
      createdAt: nowIso,
      priority: 'High',
      color: 'orange',
      persistent: true,
    };

    try {
      // 1. Authoritative write to PostgreSQL
      await createSmartSuspensionAlertApi(schoolId, newAlert);

      // 2. Cache locally
      updatedAlerts.unshift(newAlert);
      createdAlerts.push(newAlert);

      // Record audit log entry in cache
      addSmartRuleAuditLog({
        schoolId,
        alertId: newAlert.id,
        studentId: newAlert.studentId,
        studentName: newAlert.studentName,
        teacherName: newAlert.attendanceTeacherName,
        adminName: 'النظام الآلي (مراقبة الإيقاف الذكية)',
        actionTaken: 'إنشاء التنبيه الآلي',
        reason: `تم اكتشاف تسجيل الطالب كـ "${rec.status}" رغم وجود قرار إيقاف نشط للفترة من ${newAlert.suspensionStartDate} إلى ${newAlert.suspensionEndDate}`,
      });
    } catch (err) {
      console.error('[SMART_SUSPENSION] Error creating alert in PostgreSQL:', err);
    }
  }

  if (createdAlerts.length > 0) {
    const existing = getStorage<SmartSuspensionAlert[]>(SMART_ALERTS_KEY, []);
    const otherSchools = existing.filter((a) => a.schoolId !== schoolId);
    setStorage(SMART_ALERTS_KEY, [...updatedAlerts, ...otherSchools]);
    notifyDataChanged('smart_suspension_alert_created');
  }

  return createdAlerts;
}

// ----------------------------------------------------
// ALERT RESOLUTION ACTIONS (SERVER-AUTHORITATIVE)
// ----------------------------------------------------

/**
 * Action 1: Correct Attendance (تصحيح الحضور)
 * Server changes student status to "غائب" in DB attendance and marks alert as resolved with audit log
 */
export async function resolveCorrectAttendance(
  alertId: string,
  adminName: string = 'إدارة المدرسة',
  schoolIdOverride?: string
): Promise<void> {
  const alerts = getAllSmartSuspensionAlerts();
  const alert = alerts.find((a) => a.id === alertId);
  const schoolId = alert?.schoolId || schoolIdOverride || getStoredSession()?.schoolId || 'sch-1';

  // 1. Server-authoritative DB execution
  await resolveSmartSuspensionAlertApi(schoolId, {
    alertId,
    action: 'correct_attendance',
    adminName,
  });

  // 2. Update local Attendance cache
  if (alert) {
    const attendanceKey = 'attendance';
    const allAttendance = getStorage<AttendanceRecord[]>(attendanceKey, []);
    const updatedAttendance = allAttendance.map((rec) => {
      if (rec.studentId === alert.studentId && rec.date === alert.recordedDate) {
        return { ...rec, status: 'غائب' as const };
      }
      return rec;
    });
    setStorage(attendanceKey, updatedAttendance);

    // 3. Update local alert cache
    alert.status = 'resolved';
    alert.resolvedAction = 'corrected_attendance';
    alert.resolvedBy = adminName;
    alert.resolvedAt = new Date().toISOString();
    setStorage(SMART_ALERTS_KEY, alerts);

    // 4. Update local audit log cache
    addSmartRuleAuditLog({
      schoolId,
      alertId: alert.id,
      studentId: alert.studentId,
      studentName: alert.studentName,
      teacherName: alert.attendanceTeacherName,
      adminName,
      actionTaken: 'تصحيح الحضور',
      reason: 'تم تغيير حالة الحضور من "حاضر" إلى "غائب" لتوافق قرار الإيقاف الساري.',
    });
  }

  // 5. Notify subscribers
  notifyDataChanged('smart_suspension_alert_resolved');
}

/**
 * Action 2: End Suspension (إنهاء الإيقاف)
 * Server changes suspension status to "منتهي" in DB admin_actions and marks alert as resolved with audit log
 */
export async function resolveEndSuspension(
  alertId: string,
  adminName: string = 'إدارة المدرسة',
  schoolIdOverride?: string
): Promise<void> {
  const alerts = getAllSmartSuspensionAlerts();
  const alert = alerts.find((a) => a.id === alertId);
  const schoolId = alert?.schoolId || schoolIdOverride || getStoredSession()?.schoolId || 'sch-1';

  // 1. Server-authoritative DB execution
  await resolveSmartSuspensionAlertApi(schoolId, {
    alertId,
    action: 'end_suspension',
    adminName,
  });

  // 2. Update local Administrative Actions cache
  if (alert) {
    const actionsKey = 'admin_actions_list_v1';
    const allActions = getStorage<AdministrativeAction[]>(actionsKey, []);
    const updatedActions = allActions.map((act) => {
      if (act.id === alert.suspensionId) {
        return { ...act, status: 'منتهي' as const };
      }
      return act;
    });
    setStorage(actionsKey, updatedActions);

    // 3. Update local alert cache
    alert.status = 'resolved';
    alert.resolvedAction = 'ended_suspension';
    alert.resolvedBy = adminName;
    alert.resolvedAt = new Date().toISOString();
    setStorage(SMART_ALERTS_KEY, alerts);

    // 4. Update local audit log cache
    addSmartRuleAuditLog({
      schoolId,
      alertId: alert.id,
      studentId: alert.studentId,
      studentName: alert.studentName,
      teacherName: alert.attendanceTeacherName,
      adminName,
      actionTaken: 'إنهاء الإيقاف',
      reason: 'تم إنهاء قرار الإيقاف المؤقت عن الدراسة رسمياً والسماح للطالب بالحضور.',
    });
  }

  // 5. Notify subscribers
  notifyDataChanged('smart_suspension_alert_resolved');
}

/**
 * Action 3: Ignore Alert with Reason (تجاهل مع كتابة سبب)
 * Server marks alert as resolved with recorded reason and creates audit log
 */
export async function resolveIgnoreAlert(
  alertId: string,
  adminName: string,
  ignoreReason: string,
  schoolIdOverride?: string
): Promise<void> {
  const alerts = getAllSmartSuspensionAlerts();
  const alert = alerts.find((a) => a.id === alertId);
  const schoolId = alert?.schoolId || schoolIdOverride || getStoredSession()?.schoolId || 'sch-1';

  // 1. Server-authoritative DB execution
  await resolveSmartSuspensionAlertApi(schoolId, {
    alertId,
    action: 'ignore',
    adminName,
    ignoreReason: ignoreReason.trim(),
  });

  // 2. Update local alert cache
  if (alert) {
    alert.status = 'resolved';
    alert.resolvedAction = 'ignored';
    alert.ignoreReason = ignoreReason.trim();
    alert.resolvedBy = adminName;
    alert.resolvedAt = new Date().toISOString();
    setStorage(SMART_ALERTS_KEY, alerts);

    // 3. Update local audit log cache
    addSmartRuleAuditLog({
      schoolId,
      alertId: alert.id,
      studentId: alert.studentId,
      studentName: alert.studentName,
      teacherName: alert.attendanceTeacherName,
      adminName,
      actionTaken: 'تجاهل مع سبب',
      reason: ignoreReason.trim(),
    });
  }

  // 4. Notify subscribers
  notifyDataChanged('smart_suspension_alert_resolved');
}

