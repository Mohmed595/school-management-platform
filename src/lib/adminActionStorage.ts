import { AdministrativeAction, ParentNotification } from '../types/adminAction';
import { AttendanceRecord } from '../types/admin';
import { getSchoolAdminData, getStorage, setStorage, notifyDataChanged } from './adminStorage';
import { getStudentBadges } from './badgeStorage';
import {
  fetchAdminActionsApi,
  fetchStudentAdminActionsApi,
  createAdminActionApi,
  deleteAdminActionApi,
} from './schoolApi';
import { getStoredSession } from './storage';

const ACTIONS_STORAGE_KEY = 'admin_actions_list_v1';
const READ_NOTIFICATIONS_KEY_PREFIX = 'read_notifs_v1_';

export function getAllAdminActions(schoolId?: string): AdministrativeAction[] {
  const actions = getStorage<AdministrativeAction[]>(ACTIONS_STORAGE_KEY, []);
  if (!schoolId) return actions;
  return actions.filter((a) => a.schoolId === schoolId);
}

export function getStudentAdminActions(studentId: string): AdministrativeAction[] {
  const actions = getStorage<AdministrativeAction[]>(ACTIONS_STORAGE_KEY, []);
  return actions.filter((a) => a.studentId === studentId);
}

export async function fetchAndSyncAdminActions(schoolId: string): Promise<AdministrativeAction[]> {
  try {
    const actions = await fetchAdminActionsApi(schoolId);
    setStorage(ACTIONS_STORAGE_KEY, actions);
    return actions;
  } catch (err) {
    return getAllAdminActions(schoolId);
  }
}

export async function fetchAndSyncStudentAdminActions(schoolId: string, studentId: string): Promise<AdministrativeAction[]> {
  try {
    const actions = await fetchStudentAdminActionsApi(schoolId, studentId);
    // Merge into local cache
    const existing = getStorage<AdministrativeAction[]>(ACTIONS_STORAGE_KEY, []);
    const otherActions = existing.filter((a) => a.studentId !== studentId);
    const updated = [...actions, ...otherActions];
    setStorage(ACTIONS_STORAGE_KEY, updated);
    return actions;
  } catch (err) {
    return getStudentAdminActions(studentId);
  }
}

export async function createAdminAction(
  actionData: Omit<AdministrativeAction, 'id' | 'createdAt' | 'status'>
): Promise<AdministrativeAction> {
  const session = getStoredSession();
  const schoolId = actionData.schoolId || session?.schoolId || 'sch-1';

  // Direct PostgreSQL Call First (Authoritative)
  const newAction = await createAdminActionApi(schoolId, actionData);

  // Update client cache ONLY on DB success
  const actions = getStorage<AdministrativeAction[]>(ACTIONS_STORAGE_KEY, []);
  const updatedActions = [newAction, ...actions.filter((a) => a.id !== newAction.id)];
  setStorage(ACTIONS_STORAGE_KEY, updatedActions);

  // Trigger real-time sync across school app & parent portal
  notifyDataChanged('admin_action_created');

  return newAction;
}

export async function deleteAdminAction(actionId: string, schoolId?: string): Promise<void> {
  const session = getStoredSession();
  const effectiveSchoolId = schoolId || session?.schoolId || 'sch-1';

  // Direct PostgreSQL Call First (Authoritative)
  await deleteAdminActionApi(effectiveSchoolId, actionId);

  // Update client cache ONLY on DB success
  const actions = getStorage<AdministrativeAction[]>(ACTIONS_STORAGE_KEY, []);
  const filtered = actions.filter((a) => a.id !== actionId);
  setStorage(ACTIONS_STORAGE_KEY, filtered);
  notifyDataChanged('admin_action_deleted');
}

// ----------------------------------------------------
// PARENT NOTIFICATION CENTER SYNTHESIS
// ----------------------------------------------------

function getReadNotificationIds(studentId: string): Set<string> {
  const list = getStorage<string[]>(READ_NOTIFICATIONS_KEY_PREFIX + studentId, []);
  return new Set(list);
}

export function markNotificationAsRead(studentId: string, notificationId: string): void {
  const readSet = getReadNotificationIds(studentId);
  readSet.add(notificationId);
  setStorage(READ_NOTIFICATIONS_KEY_PREFIX + studentId, Array.from(readSet));
  notifyDataChanged('notification_read');
}

export function markAllNotificationsAsRead(studentId: string, notifications: ParentNotification[]): void {
  const readSet = getReadNotificationIds(studentId);
  notifications.forEach((n) => readSet.add(n.id));
  setStorage(READ_NOTIFICATIONS_KEY_PREFIX + studentId, Array.from(readSet));
  notifyDataChanged('notification_read_all');
}

export function getStudentNotifications(
  schoolId: string,
  studentId: string,
  serverAdminActions?: AdministrativeAction[]
): ParentNotification[] {
  const notifications: ParentNotification[] = [];
  const readSet = getReadNotificationIds(studentId);
  const schoolData = getSchoolAdminData(schoolId);

  // 1. Administrative Actions (Parent Summons, Temporary Suspensions & Expulsions)
  // Use provided serverAdminActions if available, otherwise read from local synced storage
  const adminActions = serverAdminActions && serverAdminActions.length > 0
    ? serverAdminActions.filter((a) => a.studentId === studentId)
    : getStudentAdminActions(studentId);

  for (const act of adminActions) {
    if (act.actionType === 'parent_summons') {
      notifications.push({
        id: `notif-action-${act.id}`,
        schoolId,
        studentId,
        category: 'parent_summons',
        title: `🚨 استدعاء ولي أمر - ${act.studentName}`,
        message: `نرجو تكرمكم بالحضور للمدرسة بتاريخ ${act.summonsDate || ''} الساعة ${act.summonsTime || ''}. السبب: ${act.reason}${act.notes ? ` (${act.notes})` : ''}`,
        date: act.createdAt,
        isRead: readSet.has(`notif-action-${act.id}`),
        priority: 'عالي',
        relatedId: act.id,
        targetTab: 'profile',
      });
    } else if (act.actionType === 'temporary_suspension') {
      notifications.push({
        id: `notif-action-${act.id}`,
        schoolId,
        studentId,
        category: 'temporary_suspension',
        title: `⚠️ قرار إيقاف مؤقت عن الدراسة`,
        message: `تم اتخاذ قرار إيقاف مؤقت عن الدراسة للطالب للفترة من ${act.startDate || ''} إلى ${act.endDate || ''}. السبب: ${act.reason}${act.notes ? ` (${act.notes})` : ''}`,
        date: act.createdAt,
        isRead: readSet.has(`notif-action-${act.id}`),
        priority: 'عالي',
        relatedId: act.id,
        targetTab: 'profile',
      });
    } else if (act.actionType === 'expulsion') {
      notifications.push({
        id: `notif-action-${act.id}`,
        schoolId,
        studentId,
        category: 'expulsion',
        title: `🚫 قرار طرد / فصل نهائي من المدرسة`,
        message: `تم اتخاذ قرار فصل نهائي بحق الطالب من المدرسة. السبب: ${act.reason}${act.notes ? ` (${act.notes})` : ''}`,
        date: act.createdAt,
        isRead: readSet.has(`notif-action-${act.id}`),
        priority: 'عالي',
        relatedId: act.id,
        targetTab: 'profile',
      });
    }
  }

  // 2. School Announcements
  if (schoolData?.announcements) {
    for (const anc of schoolData.announcements) {
      if (anc.targetAudience === 'جميع المدارس' || anc.targetAudience === 'أولياء الأمور' || anc.targetAudience === 'الطلاب') {
        const isHigh = anc.priority === 'عاجل جداً' || anc.priority === 'هام';
        notifications.push({
          id: `notif-anc-${anc.id}`,
          schoolId,
          studentId,
          category: 'announcement',
          title: `📢 ${anc.title}`,
          message: anc.content,
          date: anc.publishDate || new Date().toISOString(),
          isRead: readSet.has(`notif-anc-${anc.id}`),
          priority: isHigh ? 'عالي' : 'عادي',
          relatedId: anc.id,
          targetTab: 'announcements',
        });
      }
    }
  }

  // 3. New Grades
  if (schoolData?.grades) {
    const studentGrades = schoolData.grades.filter((g) => g.studentId === studentId);
    for (const g of studentGrades) {
      const isLowScore = g.score < (g.maxScore * 0.5);
      notifications.push({
        id: `notif-grade-${g.id}`,
        schoolId,
        studentId,
        category: 'grade',
        title: `📊 نتيجة جديدة: ${g.subjectName}`,
        message: `تم رصد درجة ${g.score} من ${g.maxScore} في ${g.examName}.${g.notes ? ` ملاحظات: ${g.notes}` : ''}`,
        date: g.date || new Date().toISOString(),
        isRead: readSet.has(`notif-grade-${g.id}`),
        priority: isLowScore ? 'عالي' : 'عادي',
        relatedId: g.id,
        targetTab: 'home',
      });
    }
  }

  // 4. Behavior Notes
  if (schoolData?.behavior) {
    const studentBehaviors = schoolData.behavior.filter((b) => b.studentId === studentId);
    for (const b of studentBehaviors) {
      const isNegative = b.type === 'سلبي';
      notifications.push({
        id: `notif-beh-${b.id}`,
        schoolId,
        studentId,
        category: 'behavior',
        title: isNegative ? `⚠️ رصد سلوك سلبي (${b.points}- نقطة)` : `⭐ رصد سلوك إيجابي (${b.points}+ نقطة)`,
        message: `${b.title}: ${b.notes} (المشرف: ${b.reportedBy})`,
        date: b.date || new Date().toISOString(),
        isRead: readSet.has(`notif-beh-${b.id}`),
        priority: isNegative ? 'عالي' : 'عادي',
        relatedId: b.id,
        targetTab: 'behavior',
      });
    }
  }

  // 5. New Badges
  const studentBadges = getStudentBadges(studentId);
  for (const item of studentBadges) {
    const { assignment, badge } = item;
    notifications.push({
      id: `notif-badge-${assignment.id}`,
      schoolId,
      studentId,
      category: 'badge',
      title: `🏅 منح وسام جديد: ${badge.name}`,
      message: `مبروك! تم منح الطالب وسام "${badge.name}" (${badge.rarity}) من قِبَل ${assignment.awardedBy}.${assignment.note ? ` ملاحظة: ${assignment.note}` : ''}`,
      date: assignment.awardedAt || new Date().toISOString(),
      isRead: readSet.has(`notif-badge-${assignment.id}`),
      priority: 'عادي',
      relatedId: assignment.id,
      targetTab: 'profile',
    });
  }

  // 6. Converted 3-Late Attendance Notifications
  const allAttendance = getStorage<AttendanceRecord[]>('attendance', []);
  const studentAttendance = (schoolData?.attendance && schoolData.attendance.length > 0 ? schoolData.attendance : allAttendance).filter(
    (a) => a.studentId === studentId && (a.schoolId === schoolId || !a.schoolId)
  );

  for (const att of studentAttendance) {
    if (
      att.status === 'غائب' &&
      (att.notes?.includes('تحويل تلقائي إلى غائب') || att.notes?.includes('تكرار التأخير') || att.notes?.includes('التأخير للمرة الثالثة') || att.notes?.includes('قانون GGS'))
    ) {
      notifications.push({
        id: `notif-att-3late-${att.id || att.date}`,
        schoolId,
        studentId,
        category: 'attendance_late_rule',
        title: '⚠️ احتساب غياب لتكرار التأخير 3 أيام متتالية',
        message: `تم احتساب يوم ${att.date} كـ "غياب" رسمي للطالب لتكرار التأخير الصباحي لمدة 3 أيام متتالية، وفقاً للائحة الانضباط المدرسي.`,
        date: att.date ? `${att.date}T08:30:00Z` : new Date().toISOString(),
        isRead: readSet.has(`notif-att-3late-${att.id || att.date}`),
        priority: 'عالي',
        relatedId: att.id,
        targetTab: 'attendance',
      });
    }
  }

  // Sort by date descending
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return notifications;
}
