import { Badge, StudentBadge, TeacherBadge, GroupedStudentBadge, GroupedTeacherBadge } from '../types/badge';
import { getStorage, setStorage, notifyDataChanged } from './adminStorage';
import { triggerAutomaticAchievementMessage } from './communityStorage';
import { PRELOADED_BADGES } from '../data/preloadedBadges';
import {
  awardStudentBadgeApi,
  awardTeacherBadgeApi,
  saveBadgeApi,
  deleteBadgeApi,
  deleteStudentBadgeAssignmentApi,
  deleteTeacherBadgeAssignmentApi,
  fetchSchoolBadgesApi,
  unboxStudentBadgeApi,
} from './schoolApi';

export const BADGES_STORAGE_KEY = 'system_badges_v1';
export const STUDENT_BADGES_STORAGE_KEY = 'student_badges_v1';
export const TEACHER_BADGES_STORAGE_KEY = 'teacher_badges_v1';

// Default Administrative Badge (Restricted to Owner/Admin)
export const DEFAULT_OWNER_BADGE: Badge = {
  id: 'badge-owner-mythical',
  name: '👑 وسام الإدارة العليا والمالك',
  nameEn: 'Owner & Executive Leadership',
  description: 'وسام شرفي مخصص لمسؤولي وإدارة المنظومة',
  icon: '👑',
  color: '#D4AF37',
  rarity: 'Mythical',
  targetType: 'admin',
  isActive: true,
  hasAnimatedBorder: true,
  isHidden: false,
  createdAt: '2026-07-28',
  limitType: 'forever',
  maxQuantity: 3,
};

// Default Student Excellence Badge (Unlimited Standard Student Badge)
export const DEFAULT_STUDENT_EXCELLENCE_BADGE: Badge = {
  id: 'badge-student-excellence',
  name: '🏆 وسام التفوق والاجتهاد',
  nameEn: 'Excellence & Diligence',
  description: 'وسام تقديري يُمنح للطالب تقديراً لتفوقه واجتهاده الدراسي وانضباطه',
  icon: '🏆',
  color: '#F59E0B',
  rarity: 'Epic',
  targetType: 'student',
  isActive: true,
  hasAnimatedBorder: true,
  isHidden: false,
  createdAt: '2026-07-28',
  limitType: 'none',
};

// Default Monthly Limited Badge (Limited to max 5 students per month)
export const DEFAULT_MONTHLY_BADGE: Badge = {
  id: 'badge-star-monthly',
  name: '🌟 نجم الشهر المتميز',
  nameEn: 'Monthly Star',
  description: 'وسام تقديري يتجدد شهرياً لأفضل 5 طلاب متفوقين خلال الشهر',
  icon: '🌟',
  color: '#8B5CF6',
  rarity: 'Legendary',
  targetType: 'student',
  isActive: true,
  hasAnimatedBorder: true,
  isHidden: false,
  createdAt: '2026-07-28',
  limitType: 'monthly',
  maxQuantity: 5,
};

// Default Teacher Badges
export const DEFAULT_TEACHER_BADGE_1: Badge = {
  id: 'badge-teacher-creative',
  name: '🏅 المعلم المبدع والقدوة',
  nameEn: 'Exemplary Teacher',
  description: 'وسام التميز والتفاني في إلهام الطلاب والابتكار في التدريس',
  icon: '🏅',
  color: '#2563EB',
  rarity: 'Legendary',
  targetType: 'teacher',
  isActive: true,
  hasAnimatedBorder: true,
  isHidden: false,
  createdAt: '2026-07-28',
  limitType: 'none',
};

export const DEFAULT_ATTENDANCE_BADGE_1: Badge = {
  id: 'badge-attendance-guardian',
  name: '🎯 حارس الانضباط الميداني',
  nameEn: 'Field Guardian',
  description: 'وسام الدقة العالية والأمانة في توثيق الحضور والغياب اليومي بالمدرسة',
  icon: '🎯',
  color: '#059669',
  rarity: 'Mythical',
  targetType: 'teacher',
  isActive: true,
  hasAnimatedBorder: true,
  isHidden: false,
  createdAt: '2026-07-28',
  limitType: 'none',
};

// Initialize & get system badges (strictly isolated per school, no mock fallback data)
export function getAllBadges(schoolId?: string): Badge[] {
  const badges = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
  if (!schoolId) {
    return badges;
  }
  // Return strictly badges created for this school
  return badges.filter((b) => b.schoolId === schoolId);
}

/**
 * Get Badge Limit Status (used count, remaining quantity, and whether it can be awarded)
 */
export function getBadgeLimitInfo(badgeId: string): {
  limitType: 'none' | 'monthly' | 'forever';
  maxQuantity: number;
  usedCount: number;
  remaining: number;
  isAvailable: boolean;
  currentMonthKey: string;
} {
  const badges = getAllBadges();
  const badge = badges.find((b) => b.id === badgeId);
  const limitType = badge?.limitType || 'none';
  const maxQuantity = badge?.maxQuantity || 0;

  const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const studentAssignments = getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
  const teacherAssignments = getStorage<TeacherBadge[]>(TEACHER_BADGES_STORAGE_KEY, []);
  const allAssignments = [
    ...studentAssignments.map((a) => ({ badgeId: a.badgeId, awardedMonthKey: a.awardedMonthKey })),
    ...teacherAssignments.map((a) => ({ badgeId: a.badgeId, awardedMonthKey: a.awardedMonthKey })),
  ];

  if (limitType === 'none' || !maxQuantity) {
    return {
      limitType: 'none',
      maxQuantity: Infinity,
      usedCount: 0,
      remaining: Infinity,
      isAvailable: true,
      currentMonthKey,
    };
  }

  let usedCount = 0;
  if (limitType === 'forever') {
    // Count total awards ever given for this badge across all students
    usedCount = allAssignments.filter((a) => a.badgeId === badgeId).length;
  } else if (limitType === 'monthly') {
    // Count awards given in the current month for this badge
    usedCount = allAssignments.filter((a) => {
      if (a.badgeId !== badgeId) return false;
      if (a.awardedMonthKey) {
        return a.awardedMonthKey === currentMonthKey;
      }
      return false;
    }).length;
  }

  const remaining = Math.max(0, maxQuantity - usedCount);
  const isAvailable = remaining > 0;

  return {
    limitType,
    maxQuantity,
    usedCount,
    remaining,
    isAvailable,
    currentMonthKey,
  };
}

// Get student badges with badge details populated
export function getStudentBadges(studentId: string, schoolId?: string): Array<{ assignment: StudentBadge; badge: Badge }> {
  const allAssignments = getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
  const systemBadges = getAllBadges(schoolId);
  const allStudents = getStorage<any[]>('students', []);
  const currentStudent = allStudents.find(
    (s) =>
      s.id === studentId ||
      s.nationalId === studentId ||
      s.studentCode === studentId ||
      (studentId && s.name && s.name.trim().toLowerCase() === studentId.trim().toLowerCase())
  );

  const studentAssignments = allAssignments.filter((a) => {
    if (a.studentId === studentId) return true;
    if (currentStudent) {
      if (
        a.studentId === currentStudent.id ||
        (currentStudent.nationalId && a.studentId === currentStudent.nationalId) ||
        (currentStudent.studentCode && a.studentId === currentStudent.studentCode)
      ) {
        return true;
      }
    }
    return false;
  });

  return studentAssignments
    .map((assignment) => {
      let badge = systemBadges.find((b) => b.id === assignment.badgeId);
      if (!badge) {
        badge = systemBadges.find((b) => b.id.includes(assignment.badgeId) || assignment.badgeId.includes(b.id));
      }
      if (!badge) {
        // Resilient fallback badge so the awarded badge is always visible and celebrated
        const isOwner = assignment.badgeId.includes('owner');
        const isStar = assignment.badgeId.includes('star');
        badge = {
          id: assignment.badgeId,
          schoolId: schoolId || 'sch-1',
          name: isOwner ? '👑 وسام الإدارة العليا' : isStar ? '🌟 نجم الشهر المتميز' : '🏆 وسام التفوق والاجتهاد',
          nameEn: isOwner ? 'Executive Leadership' : isStar ? 'Monthly Star' : 'Excellence Badge',
          description: 'وسام تقديري للتميز والاجتهاد',
          icon: isOwner ? '👑' : isStar ? '🌟' : '🏆',
          color: isOwner ? '#D4AF37' : isStar ? '#8B5CF6' : '#F59E0B',
          rarity: isOwner ? 'Mythical' : isStar ? 'Legendary' : 'Epic',
          targetType: isOwner ? 'admin' : 'student',
          isActive: true,
          hasAnimatedBorder: true,
          limitType: 'none',
          maxQuantity: 0,
          createdAt: assignment.awardedAt || '2026-07-28',
        };
      }
      return { assignment, badge };
    });
}

/**
 * Get Grouped Student Badges (groups duplicate badges for a student, returning count e.g. X2, X3)
 */
export function getGroupedStudentBadges(studentId: string, schoolId?: string): GroupedStudentBadge[] {
  const items = getStudentBadges(studentId, schoolId);
  const map = new Map<string, GroupedStudentBadge>();

  for (const item of items) {
    const existing = map.get(item.badge.id);
    if (existing) {
      existing.count += 1;
      existing.assignments.push(item.assignment);
    } else {
      map.set(item.badge.id, {
        badge: item.badge,
        count: 1,
        assignments: [item.assignment],
        latestAssignment: item.assignment,
      });
    }
  }

  return Array.from(map.values());
}

// Get all student badge assignments
export function getAllStudentBadges(): StudentBadge[] {
  return getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
}

// Get unboxed/unopened student badges for gift cutscene
export function getUnboxedBadgesForStudent(
  studentId: string,
  schoolId?: string
): Array<{ assignment: StudentBadge; badge: Badge }> {
  const studentItems = getStudentBadges(studentId, schoolId);
  return studentItems.filter((item) => item.assignment.isUnboxed === false);
}

// Mark badge assignment as unboxed/seen
export function markBadgeAsUnboxed(assignmentId: string, schoolId?: string): void {
  const allAssignments = getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
  const idx = allAssignments.findIndex((a) => a.id === assignmentId);
  if (idx >= 0) {
    allAssignments[idx].isUnboxed = true;
    const targetSchoolId = schoolId || allAssignments[idx].schoolId || 'sch-1';
    setStorage(STUDENT_BADGES_STORAGE_KEY, allAssignments);
    notifyDataChanged('badges_updated');
    if (targetSchoolId && assignmentId) {
      unboxStudentBadgeApi(targetSchoolId, assignmentId).catch(() => {});
    }
  }
}

// Award a badge to a student (validates limit quantities and persists to PostgreSQL)
export async function awardBadgeToStudent(
  studentId: string,
  badgeId: string,
  awardedBy: string = 'إدارة المدرسة',
  note?: string,
  schoolId?: string
): Promise<StudentBadge> {
  const targetSchoolId = schoolId || 'sch-1';
  let systemBadges = getAllBadges(targetSchoolId);
  let targetBadge = systemBadges.find((b) => b.id === badgeId);

  // If badge not found in local cache, attempt to sync from server
  if (!targetBadge) {
    try {
      const serverBadges = await fetchSchoolBadgesApi(targetSchoolId);
      if (Array.isArray(serverBadges) && serverBadges.length > 0) {
        const currentBadges = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
        const mergedMap = new Map<string, Badge>();
        currentBadges.forEach((b) => mergedMap.set(b.id, b));
        serverBadges.forEach((b) => mergedMap.set(b.id, b));
        const updatedBadges = Array.from(mergedMap.values());
        setStorage(BADGES_STORAGE_KEY, updatedBadges);
        systemBadges = getAllBadges(targetSchoolId);
        targetBadge = systemBadges.find((b) => b.id === badgeId);
      }
    } catch (e) {
      console.warn('Failed to fetch server badges for award lookup fallback', e);
    }
  }

  // If still not found by exact ID, check by partial/prefix match or provide dynamic fallback
  if (!targetBadge) {
    targetBadge = systemBadges.find((b) => b.id.includes(badgeId) || badgeId.includes(b.id));
  }

  // If still not found, construct a fallback badge definition to prevent blocking
  if (!targetBadge) {
    const isOwner = badgeId.includes('owner');
    const isStar = badgeId.includes('star');
    targetBadge = {
      id: badgeId,
      schoolId: targetSchoolId,
      name: isOwner ? '👑 وسام الإدارة العليا' : isStar ? '🌟 نجم الشهر المتميز' : '🏆 وسام تقديري',
      nameEn: isOwner ? 'Owner & Leadership' : isStar ? 'Monthly Star' : 'Honorable Badge',
      description: 'وسام تقديري للتميز',
      icon: isOwner ? '👑' : isStar ? '🌟' : '🏆',
      color: isOwner ? '#D4AF37' : isStar ? '#8B5CF6' : '#2563EB',
      rarity: isOwner ? 'Mythical' : isStar ? 'Legendary' : 'Epic',
      targetType: isOwner ? 'admin' : 'student',
      isActive: true,
      hasAnimatedBorder: true,
      limitType: isOwner ? 'forever' : isStar ? 'monthly' : 'none',
      maxQuantity: isOwner ? 3 : isStar ? 5 : 0,
      createdAt: '2026-07-28',
    };
    // Cache it
    const current = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
    current.push(targetBadge);
    setStorage(BADGES_STORAGE_KEY, current);
  }

  // Validate Quantity Limits
  const limitInfo = getBadgeLimitInfo(badgeId);
  if (!limitInfo.isAvailable) {
    if (limitInfo.limitType === 'monthly') {
      throw new Error(
        `تم استنفاذ العدد الأقصى المتاح لوسام "${targetBadge.name}" لهذا الشهر (${limitInfo.maxQuantity} طلاب). تتجدد الكمية في بداية الشهر القادم.`
      );
    } else if (limitInfo.limitType === 'forever') {
      throw new Error(
        `تم استنفاذ العدد الأقصى المتاح لوسام "${targetBadge.name}" كلياً (${limitInfo.maxQuantity} طلاب للأبد).`
      );
    }
  }

  // 1. Await Central PostgreSQL DB Award operation FIRST
  const dbAward = await awardStudentBadgeApi(targetSchoolId, {
    studentId,
    badgeId,
    awardedBy,
    note,
  });

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const newAssignment: StudentBadge = {
    id: dbAward.id || `sb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    schoolId: targetSchoolId,
    studentId,
    badgeId,
    awardedBy: dbAward.awardedBy || awardedBy,
    awardedAt: dbAward.awardedAt || new Date().toISOString(),
    awardedMonthKey: currentMonthKey,
    note: dbAward.note || note,
    isUnboxed: false,
  };

  // 2. Update local UI state/cache only after DB success
  const allAssignments = getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
  allAssignments.unshift(newAssignment);
  setStorage(STUDENT_BADGES_STORAGE_KEY, allAssignments);

  // Also publish an official Announcement notification in the school system
  const allStudents = getStorage<any[]>('students', []);
  const targetStudent = allStudents.find((s) => s.id === studentId);
  const studentSchoolId = targetStudent?.schoolId || targetSchoolId;

  const allAnnouncements = getStorage<any[]>('announcements', []);
  const badgeAnnouncement = {
    id: `anc-badge-${Date.now()}`,
    schoolId: studentSchoolId,
    targetAudience: 'الجميع',
    title: `🏅 وسام تقديري جديد: ${targetBadge?.name || 'وسام متميز'}`,
    content: `تهانينا! تم منح الطالب وسام "${targetBadge?.name || ''}" التقديري من قبل ${awardedBy}.${
      note ? ` ملاحظة الإدارة: ${note}` : ''
    }`,
    publishDate: new Date().toISOString().split('T')[0],
    publisher: awardedBy,
    priority: 'عالي',
  };
  allAnnouncements.unshift(badgeAnnouncement);
  setStorage('announcements', allAnnouncements);
  notifyDataChanged('announcements');

  // Trigger Phone / Browser OS Native Notification if supported
  triggerPhoneNotification(
    `🏅 تم منحك وسام جديد: ${targetBadge?.name || 'وسام متميز'}`,
    `مبارك! افتح التطبيق للكشف عن هدية وسامك الجديد [${targetBadge?.rarity || 'Mythical'}]`
  );

  // Send automatic community achievement post to student's age/grade and class communities
  try {
    const student = allStudents.find((s) => s.id === studentId);
    if (student) {
      triggerAutomaticAchievementMessage(
        student.schoolId || targetSchoolId,
        student.id,
        student.name,
        targetBadge?.name || 'وسام تقديري',
        student.className,
        student.gradeName || student.className
      );
    }
  } catch (e) {
    console.error('Failed to trigger automatic community message for badge award', e);
  }

  notifyDataChanged('badges_updated');

  return newAssignment;
}

// Helper to send phone / browser notification
export function triggerPhoneNotification(title: string, body: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png',
          dir: 'rtl',
        });
      } catch (e) {
        console.log('Notification trigger skipped', e);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png',
              dir: 'rtl',
            });
          } catch (e) {
            console.log('Notification trigger skipped', e);
          }
        }
      });
    }
  }
}

// Remove a badge assignment via PostgreSQL
export async function removeBadgeFromStudent(assignmentId: string, schoolId: string = 'sch-1'): Promise<void> {
  await deleteStudentBadgeAssignmentApi(schoolId, assignmentId);
  const allAssignments = getStorage<StudentBadge[]>(STUDENT_BADGES_STORAGE_KEY, []);
  const filtered = allAssignments.filter((a) => a.id !== assignmentId);
  setStorage(STUDENT_BADGES_STORAGE_KEY, filtered);
  notifyDataChanged('badges_updated');
}

// Delete a badge definition completely from PostgreSQL and localStorage
export async function deleteBadge(badgeId: string, schoolId?: string): Promise<void> {
  const badges = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
  const targetBadge = badges.find((b) => b.id === badgeId);
  const targetSchoolId = schoolId || targetBadge?.schoolId || '';

  if (targetSchoolId) {
    try {
      await deleteBadgeApi(targetSchoolId, badgeId);
    } catch (e) {
      console.warn('Failed to delete badge on server API:', e);
    }
  }

  const filtered = badges.filter((b) => b.id !== badgeId);
  setStorage(BADGES_STORAGE_KEY, filtered);
  notifyDataChanged('badges_updated');
}

// Create a new badge in PostgreSQL
export async function createBadge(badgeData: Omit<Badge, 'id' | 'createdAt'>, schoolId: string): Promise<Badge> {
  const saved = await saveBadgeApi(schoolId, badgeData);
  const badges = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
  const filtered = badges.filter((b) => b.id !== saved.id);
  filtered.push({ ...saved, schoolId });
  setStorage(BADGES_STORAGE_KEY, filtered);
  notifyDataChanged('badges_updated');
  return saved;
}

// Get all teacher badge assignments
export function getAllTeacherBadges(): TeacherBadge[] {
  return getStorage<TeacherBadge[]>(TEACHER_BADGES_STORAGE_KEY, []);
}

// Get badges for a specific teacher
export function getTeacherBadges(teacherId: string, schoolId?: string): Array<{ assignment: TeacherBadge; badge: Badge }> {
  const allAssignments = getAllTeacherBadges();
  const systemBadges = getAllBadges(schoolId);

  const teacherAssignments = allAssignments.filter((a) => a.teacherId === teacherId);

  return teacherAssignments
    .map((assignment) => {
      const badge = systemBadges.find((b) => b.id === assignment.badgeId);
      if (!badge) return null;
      return { assignment, badge };
    })
    .filter((item): item is { assignment: TeacherBadge; badge: Badge } => item !== null);
}

/**
 * Get Grouped Teacher Badges (groups duplicate badges for a teacher, returning count e.g. X2, X3)
 */
export function getGroupedTeacherBadges(teacherId: string, schoolId?: string): GroupedTeacherBadge[] {
  const items = getTeacherBadges(teacherId, schoolId);
  const map = new Map<string, GroupedTeacherBadge>();

  for (const item of items) {
    const existing = map.get(item.badge.id);
    if (existing) {
      existing.count += 1;
      existing.assignments.push(item.assignment);
    } else {
      map.set(item.badge.id, {
        badge: item.badge,
        count: 1,
        assignments: [item.assignment],
        latestAssignment: item.assignment,
      });
    }
  }

  return Array.from(map.values());
}

// Award a badge to a teacher or attendance officer (persists to PostgreSQL)
export async function awardBadgeToTeacher(
  teacherId: string,
  badgeId: string,
  awardedBy: string = 'إدارة المدرسة',
  note?: string,
  schoolId?: string
): Promise<TeacherBadge> {
  const targetSchoolId = schoolId || 'sch-1';
  let systemBadges = getAllBadges(targetSchoolId);
  let targetBadge = systemBadges.find((b) => b.id === badgeId);

  // If badge not found in local cache, attempt to sync from server
  if (!targetBadge) {
    try {
      const serverBadges = await fetchSchoolBadgesApi(targetSchoolId);
      if (Array.isArray(serverBadges) && serverBadges.length > 0) {
        const currentBadges = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
        const mergedMap = new Map<string, Badge>();
        currentBadges.forEach((b) => mergedMap.set(b.id, b));
        serverBadges.forEach((b) => mergedMap.set(b.id, b));
        const updatedBadges = Array.from(mergedMap.values());
        setStorage(BADGES_STORAGE_KEY, updatedBadges);
        systemBadges = getAllBadges(targetSchoolId);
        targetBadge = systemBadges.find((b) => b.id === badgeId);
      }
    } catch (e) {
      console.warn('Failed to fetch server badges for teacher award fallback', e);
    }
  }

  // If still not found by exact ID, check by partial/prefix match or provide dynamic fallback
  if (!targetBadge) {
    targetBadge = systemBadges.find((b) => b.id.includes(badgeId) || badgeId.includes(b.id));
  }

  // If still not found, construct a fallback badge definition to prevent blocking
  if (!targetBadge) {
    const isCreative = badgeId.includes('creative') || badgeId.includes('teacher');
    targetBadge = {
      id: badgeId,
      schoolId: targetSchoolId,
      name: isCreative ? '🏅 المعلم المبدع والقدوة' : '🎯 حارس الانضباط الميداني',
      nameEn: isCreative ? 'Exemplary Teacher' : 'Field Guardian',
      description: 'وسام تقديري للتميز التربوي',
      icon: isCreative ? '🏅' : '🎯',
      color: isCreative ? '#2563EB' : '#059669',
      rarity: isCreative ? 'Legendary' : 'Mythical',
      targetType: 'teacher',
      isActive: true,
      hasAnimatedBorder: true,
      limitType: 'none',
      maxQuantity: 0,
      createdAt: '2026-07-28',
    };
    // Cache it
    const current = getStorage<Badge[]>(BADGES_STORAGE_KEY, []);
    current.push(targetBadge);
    setStorage(BADGES_STORAGE_KEY, current);
  }

  // Validate Quantity Limits
  const limitInfo = getBadgeLimitInfo(badgeId);
  if (!limitInfo.isAvailable) {
    if (limitInfo.limitType === 'monthly') {
      throw new Error(
        `تم استنفاذ العدد الأقصى المتاح لوسام "${targetBadge.name}" لهذا الشهر (${limitInfo.maxQuantity}). تتجدد الكمية في بداية الشهر القادم.`
      );
    } else if (limitInfo.limitType === 'forever') {
      throw new Error(
        `تم استنفاذ العدد الأقصى المتاح لوسام "${targetBadge.name}" كلياً (${limitInfo.maxQuantity} للأبد).`
      );
    }
  }

  // 1. Await PostgreSQL DB Award operation FIRST
  const dbAward = await awardTeacherBadgeApi(targetSchoolId, {
    teacherId,
    badgeId,
    awardedBy,
    note,
  });

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const newAssignment: TeacherBadge = {
    id: dbAward.id || `tb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    schoolId: targetSchoolId,
    teacherId,
    badgeId,
    awardedBy: dbAward.awardedBy || awardedBy,
    awardedAt: dbAward.awardedAt || new Date().toISOString(),
    awardedMonthKey: currentMonthKey,
    note: dbAward.note || note,
  };

  // 2. Update local state only on DB success
  const allAssignments = getStorage<TeacherBadge[]>(TEACHER_BADGES_STORAGE_KEY, []);
  allAssignments.unshift(newAssignment);
  setStorage(TEACHER_BADGES_STORAGE_KEY, allAssignments);

  // Publish announcement
  const allTeachers = getStorage<any[]>('teachers', []);
  const targetTeacher = allTeachers.find((t) => t.id === teacherId);
  const teacherSchoolId = targetTeacher?.schoolId || targetSchoolId;

  const allAnnouncements = getStorage<any[]>('announcements', []);
  const badgeAnnouncement = {
    id: `anc-tbadge-${Date.now()}`,
    schoolId: teacherSchoolId,
    title: `🏅 وسام تقديري جديد لكادر المدرسة: ${targetBadge?.name || 'وسام متميز'}`,
    content: `تهانينا للمكرم! تم منح وسام "${targetBadge?.name || ''}" التقديري من قبل ${awardedBy}.${
      note ? ` ملاحظة الإدارة: ${note}` : ''
    }`,
    publishDate: new Date().toISOString().split('T')[0],
    publisher: awardedBy,
    priority: 'عالي',
  };
  allAnnouncements.unshift(badgeAnnouncement);
  setStorage('announcements', allAnnouncements);
  notifyDataChanged('announcements');

  triggerPhoneNotification(
    `🏅 تم منح وسام جديد لمعلم/محضر: ${targetBadge?.name || 'وسام متميز'}`,
    `تكريم رسمي من إدارتك لوسام [${targetBadge?.rarity || 'Legendary'}]`
  );

  notifyDataChanged('badges_updated');

  return newAssignment;
}

// Remove a teacher badge assignment via PostgreSQL
export async function removeBadgeFromTeacher(assignmentId: string, schoolId: string = 'sch-1'): Promise<void> {
  await deleteTeacherBadgeAssignmentApi(schoolId, assignmentId);
  const allAssignments = getStorage<TeacherBadge[]>(TEACHER_BADGES_STORAGE_KEY, []);
  const filtered = allAssignments.filter((a) => a.id !== assignmentId);
  setStorage(TEACHER_BADGES_STORAGE_KEY, filtered);
  notifyDataChanged('badges_updated');
}

