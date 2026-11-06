import {
  CommunityGroup,
  CommunityMessage,
  CommunityMute,
  PollData,
  EventData,
  AchievementData,
  MessageType,
} from '../types/community';
import { ClassRoom } from '../types/admin';
import { getClassesBySchool } from './adminStorage';
import { ALL_EGYPTIAN_GRADES, parseEgyptianClassDetails } from './egyptianSchoolUtils';
import { getStoredSession } from './storage';

const STORAGE_KEYS = {
  GROUPS: 'school_communities_groups_v2',
  MESSAGES: 'school_communities_messages_v2',
  MUTES: 'school_communities_mutes_v2',
  LOCKS: 'school_communities_locks_v2',
};

// Immediate cleanup of old legacy community storage to clear duplicate data
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('school_communities_groups_v1');
    localStorage.removeItem('school_communities_messages_v1');
  } catch {}
}

/**
 * Completely clears all cached community groups and messages, forcing a fresh clean rebuild
 */
export function clearCommunityStorage(schoolId?: string): void {
  try {
    localStorage.removeItem('school_communities_groups_v1');
    localStorage.removeItem('school_communities_groups_v2');
    localStorage.removeItem('school_communities_messages_v1');
    localStorage.removeItem('school_communities_messages_v2');
    if (schoolId) {
      getAllGroups(schoolId);
    }
    notifyCommunityDataChanged('community_reconciled');
  } catch (e) {
    console.error('Failed to clear community storage', e);
  }
}

function getAuthHeaders(overrideSchoolId?: string, overrideRole?: string): HeadersInit {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const role = overrideRole || session?.userRole || 'school_admin';
  const schoolId = overrideSchoolId || session?.schoolId;

  if (session?.sessionToken) {
    headers['Authorization'] = `Bearer ${session.sessionToken}`;
  }

  headers['X-User-Role'] = role;
  if (schoolId) {
    headers['X-School-Id'] = schoolId;
  }

  return headers;
}

export function getGradeCommunityId(schoolId: string, gradeName: string): string {
  const cleanGrade = (gradeName || 'الصف الدراسي').trim().replace(/[\/\s\\]+/g, '-');
  return `comm-grade-${schoolId}-${cleanGrade}`;
}

export function getClassCommunityId(schoolId: string, classId: string): string {
  const cleanId = (classId || 'cls-1').trim().replace(/[\/\s\\]+/g, '-');
  return `comm-class-${schoolId}-${cleanId}`;
}

// Initial Seed Data Generator
function getInitialGroups(schoolId: string): CommunityGroup[] {
  const classes = getClassesBySchool(schoolId) || [];
  const groups: CommunityGroup[] = [];

  // 1. Manually include all 12 Egyptian Grades (الصفوف) for every school
  ALL_EGYPTIAN_GRADES.forEach((gradeName) => {
    const gradeGroupId = getGradeCommunityId(schoolId, gradeName);
    groups.push({
      id: gradeGroupId,
      schoolId,
      type: 'grade',
      gradeId: gradeName,
      gradeName: gradeName,
      name: gradeName,
      description: `المجتمع الرسمي لطلاب ومعلمي ${gradeName}`,
      icon: '🏫',
      membersCount: 0,
      onlineCount: 0,
      unreadCount: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    });
  });

  // 2. Auto add class community named with the exact name of the class (no hardcoded prefixes)
  if (classes && classes.length > 0) {
    classes.forEach((c) => {
      const classGroupId = getClassCommunityId(schoolId, c.id);
      groups.push({
        id: classGroupId,
        schoolId,
        type: 'class',
        gradeId: c.gradeLevel || '',
        gradeName: c.gradeLevel || '',
        classId: c.id,
        className: c.name,
        name: c.name,
        description: `المجموعة الخاصة بفصل ${c.name}`,
        icon: '👨‍🎓',
        membersCount: c.studentCount || 0,
        onlineCount: 0,
        unreadCount: 0,
        isLocked: false,
        createdAt: new Date().toISOString(),
      });
    });
  }

  return groups;
}

// Storage Helpers & Self-Healing Reconciliation
export function getAllGroups(schoolId: string): CommunityGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    let allGroups: CommunityGroup[] = raw ? JSON.parse(raw) : [];

    const existingSchoolGroups = allGroups.filter((g) => g.schoolId === schoolId);
    const classes = getClassesBySchool(schoolId) || [];

    // 1. EXACTLY THE 12 STANDARD EGYPTIAN GRADES (الصفوف)
    // No duplicates, no "مجتمع الصف..." prefixes, strictly the 12 standard grades
    const cleanGradeGroups: CommunityGroup[] = ALL_EGYPTIAN_GRADES.map((gradeName) => {
      const canonicalGradeId = getGradeCommunityId(schoolId, gradeName);
      const existing = existingSchoolGroups.find(
        (g) =>
          g.type === 'grade' &&
          (g.id === canonicalGradeId ||
            g.gradeName === gradeName ||
            g.name === gradeName ||
            g.name === `مجتمع ${gradeName}`)
      );

      return {
        id: canonicalGradeId,
        schoolId,
        type: 'grade' as const,
        gradeId: gradeName,
        gradeName: gradeName,
        name: gradeName,
        description: `المجتمع الرسمي لطلاب ومعلمي ${gradeName}`,
        icon: '🏫',
        membersCount: 0,
        onlineCount: 0,
        unreadCount: 0,
        isLocked: existing?.isLocked || false,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
    });

    // 2. EXACTLY ONE GROUP PER ACTIVE CLASS (الفصول)
    // Named with the exact name of the class (c.name), no hardcoded prefixes, no leftover duplicates
    const cleanClassGroups: CommunityGroup[] = classes.map((c) => {
      const canonicalClassId = getClassCommunityId(schoolId, c.id);
      const existing = existingSchoolGroups.find(
        (g) =>
          g.type === 'class' &&
          (g.id === canonicalClassId ||
            g.classId === c.id ||
            g.className === c.name ||
            g.name === c.name ||
            g.name === `مجتمع ${c.name}` ||
            g.name === `مجتمع فصل ${c.name}` ||
            g.name === `فصل ${c.name}`)
      );

      return {
        id: canonicalClassId,
        schoolId,
        type: 'class' as const,
        gradeId: c.gradeLevel || '',
        gradeName: c.gradeLevel || '',
        classId: c.id,
        className: c.name,
        name: c.name,
        description: `المجموعة الخاصة بفصل ${c.name}`,
        icon: '👨‍🎓',
        membersCount: c.studentCount !== undefined ? c.studentCount : (existing?.membersCount || 0),
        onlineCount: 0,
        unreadCount: 0,
        isLocked: existing?.isLocked || false,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
    });

    // 3. COMBINE ONLY THE CLEAN GROUPS (12 Grades + Active Classes)
    const reconciledSchoolGroups = [...cleanGradeGroups, ...cleanClassGroups];

    // Check if localStorage needs to be updated (clearing old duplicates like "مجتمع ...")
    const needsUpdate =
      existingSchoolGroups.length !== reconciledSchoolGroups.length ||
      existingSchoolGroups.some(
        (g) =>
          !reconciledSchoolGroups.some((rg) => rg.id === g.id && rg.name === g.name) ||
          g.name.startsWith('مجتمع ')
      );

    if (needsUpdate || !raw) {
      allGroups = allGroups.filter((g) => g.schoolId !== schoolId).concat(reconciledSchoolGroups);
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(allGroups));
    }

    return reconciledSchoolGroups;
  } catch (e) {
    console.error('Failed to load community groups', e);
    return getInitialGroups(schoolId);
  }
}

/**
 * Synchronizes or reconciles Class CommunityGroups immediately in localStorage
 * Scoped strictly to schoolId
 */
export function syncClassCommunityGroup(classRoom: ClassRoom): void {
  try {
    if (!classRoom || !classRoom.schoolId) return;
    getAllGroups(classRoom.schoolId);
    notifyCommunityDataChanged('community_groups_updated');
  } catch (err) {
    console.error('Failed to sync class community group:', err);
  }
}

/**
 * Removes a deleted class's derived community group from client localStorage
 */
export function syncDeletedClassCommunity(classId: string, schoolId: string): void {
  try {
    if (!classId || !schoolId) return;
    getAllGroups(schoolId);
    notifyCommunityDataChanged('community_groups_updated');
  } catch (err) {
    console.error('Failed to sync deleted class community:', err);
  }
}

export function notifyCommunityDataChanged(type: string = 'community_updated') {
  window.dispatchEvent(
    new CustomEvent('community_data_changed', {
      detail: { type, timestamp: Date.now() },
    })
  );
}

export function saveGroups(groups: CommunityGroup[]): void {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    let all: CommunityGroup[] = existingRaw ? JSON.parse(existingRaw) : [];
    if (groups.length > 0) {
      const currentSchoolId = groups[0].schoolId;
      all = all.filter((g) => g.schoolId !== currentSchoolId).concat(groups);
    }
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(all));
    notifyCommunityDataChanged('community_groups_updated');
  } catch (e) {
    console.error('Failed to save community groups', e);
  }
}

export function getUserAccessibleGroups(
  schoolId: string,
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent',
  userGradeName?: string,
  userClassName?: string,
  teacherAssignedClasses?: string[]
): CommunityGroup[] {
  const allGroups = getAllGroups(schoolId);

  // Admin and Owner see ALL groups in their school
  if (userRole === 'admin' || userRole === 'owner') {
    return allGroups;
  }

  // Teacher sees class groups for assigned classes + corresponding grades from the 12 grades
  if (userRole === 'teacher') {
    const assigned = (teacherAssignedClasses || []).map((c) => c.trim()).filter(Boolean);
    const classes = getClassesBySchool(schoolId) || [];

    if (assigned.length > 0) {
      const teacherGroups: CommunityGroup[] = [];
      const distinctGrades = new Set<string>();

      // 1. Class communities for assigned classes
      assigned.forEach((acName) => {
        const classObj = classes.find((c) => c.name === acName || c.id === acName);
        const classGroupId = getClassCommunityId(schoolId, classObj ? classObj.id : acName);

        let matchingClass = allGroups.find(
          (g) =>
            g.schoolId === schoolId &&
            g.type === 'class' &&
            (g.id === classGroupId || g.className === acName || g.name === acName || g.classId === acName)
        );

        const gradeLevel = classObj?.gradeLevel || parseEgyptianClassDetails(undefined, acName).gradeName;
        if (gradeLevel) distinctGrades.add(gradeLevel);

        if (!matchingClass) {
          matchingClass = {
            id: classGroupId,
            schoolId,
            type: 'class',
            gradeId: gradeLevel || '',
            gradeName: gradeLevel || '',
            classId: classObj ? classObj.id : acName,
            className: acName,
            name: acName,
            description: `المجموعة الخاصة بفصل ${acName}`,
            icon: '👨‍🎓',
            membersCount: classObj?.studentCount || 0,
            onlineCount: 0,
            unreadCount: 0,
            isLocked: false,
            createdAt: new Date().toISOString(),
          };
        }
        if (!teacherGroups.some((g) => g.id === matchingClass!.id)) {
          teacherGroups.push(matchingClass);
        }
      });

      // 2. Grade communities corresponding to assigned classes (from the 12 grades)
      distinctGrades.forEach((gName) => {
        const gradeGroupId = getGradeCommunityId(schoolId, gName);
        let matchingGrade = allGroups.find(
          (g) =>
            g.schoolId === schoolId &&
            g.type === 'grade' &&
            (g.id === gradeGroupId || g.gradeName === gName || g.name === gName || g.name === `مجتمع ${gName}`)
        );

        if (!matchingGrade) {
          matchingGrade = {
            id: gradeGroupId,
            schoolId,
            type: 'grade',
            gradeId: gName,
            gradeName: gName,
            name: gName,
            description: `المجتمع الرسمي لطلاب ومعلمي ${gName}`,
            icon: '🏫',
            membersCount: 0,
            onlineCount: 0,
            unreadCount: 0,
            isLocked: false,
            createdAt: new Date().toISOString(),
          };
        }
        if (!teacherGroups.some((g) => g.id === matchingGrade!.id)) {
          teacherGroups.push(matchingGrade);
        }
      });

      return teacherGroups;
    }

    return allGroups;
  }

  // Student / Parent: Strictly sees their own Class (الفصل) and Grade (الصف from the 12 grades)
  const rawClass = (userClassName || '').trim();
  const rawGrade = (userGradeName || '').trim();
  const details = parseEgyptianClassDetails(rawGrade, rawClass);

  const targetGradeName = rawGrade || details.gradeName || 'الصف الأول الابتدائي';
  const targetClassName = rawClass || 'فصل 1';

  // 1. Locate student's class group from allGroups
  let matchedClass = allGroups.find(
    (g) =>
      g.type === 'class' &&
      (g.name === targetClassName ||
        g.className === targetClassName ||
        (g.classId && g.classId === targetClassName) ||
        g.name === `مجتمع ${targetClassName}` ||
        (targetClassName && g.className && (g.className.includes(targetClassName) || targetClassName.includes(g.className))))
  );

  const effectiveGradeName = matchedClass?.gradeName || targetGradeName;

  // 2. Locate student's grade group from the 12 grades in allGroups
  let matchedGrade = allGroups.find(
    (g) =>
      g.type === 'grade' &&
      (g.name === effectiveGradeName ||
        g.gradeName === effectiveGradeName ||
        g.name === `مجتمع ${effectiveGradeName}` ||
        (effectiveGradeName && g.gradeName && (g.gradeName.includes(effectiveGradeName) || effectiveGradeName.includes(g.gradeName))))
  );

  // If still not matched, try matching normalized grade details
  if (!matchedGrade) {
    const normGrade = parseEgyptianClassDetails(effectiveGradeName).gradeName;
    matchedGrade = allGroups.find((g) => g.type === 'grade' && (g.name === normGrade || g.gradeName === normGrade));
  }

  // Fallback creation if neither exists in reconciled list
  if (!matchedClass) {
    const classGroupId = getClassCommunityId(schoolId, targetClassName);
    matchedClass = {
      id: classGroupId,
      schoolId,
      type: 'class',
      gradeId: effectiveGradeName,
      gradeName: effectiveGradeName,
      classId: targetClassName,
      className: targetClassName,
      name: targetClassName,
      description: `المجموعة الخاصة بفصل ${targetClassName}`,
      icon: '👨‍🎓',
      membersCount: 0,
      onlineCount: 0,
      unreadCount: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
  }

  if (!matchedGrade) {
    const gradeGroupId = getGradeCommunityId(schoolId, effectiveGradeName);
    matchedGrade = {
      id: gradeGroupId,
      schoolId,
      type: 'grade',
      gradeId: effectiveGradeName,
      gradeName: effectiveGradeName,
      name: effectiveGradeName,
      description: `المجتمع الرسمي لطلاب ومعلمي ${effectiveGradeName}`,
      icon: '🏫',
      membersCount: 0,
      onlineCount: 0,
      unreadCount: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
  }

  // Return strictly the student's Class (الفصل) and Grade (الصف) communities
  if (matchedGrade.name === matchedClass.name || targetClassName === effectiveGradeName) {
    return [matchedClass];
  }
  return [matchedClass, matchedGrade];
}

// ----------------------------------------------------
// AUTHORITATIVE POSTGRESQL API CLIENT METHODS
// ----------------------------------------------------

/**
 * Fetch messages directly from PostgreSQL central database for the school/community
 */
export async function fetchCommunityMessagesApi(
  schoolId: string,
  communityId?: string,
  options?: { limit?: number; before?: string }
): Promise<CommunityMessage[] & { hasMore: boolean; nextCursor: string | null }> {
  const queryParams = new URLSearchParams();
  if (communityId) queryParams.set('communityId', communityId);
  if (options?.limit) queryParams.set('limit', String(options.limit));
  if (options?.before) queryParams.set('before', options.before);

  const qs = queryParams.toString();
  const url = `/api/schools/${encodeURIComponent(schoolId)}/community/messages${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(schoolId),
  });

  if (!response.ok) {
    let errorMsg = `فشل جلب الرسائل من قاعدة البيانات (رمز: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const messages: CommunityMessage[] & { hasMore: boolean; nextCursor: string | null } = Object.assign(
    data.messages || [],
    {
      hasMore: Boolean(data.hasMore),
      nextCursor: data.nextCursor || null,
    }
  );

  // Update in-memory local cache for initial fetch
  if (!options?.before) {
    updateLocalMessagesCache(schoolId, communityId, messages);
  }

  return messages;
}

/**
 * Post a new message to PostgreSQL Central Database
 */
export async function sendCommunityMessageApi(
  schoolId: string,
  communityId: string,
  sender: { id: string; name: string; role: 'student' | 'teacher' | 'admin'; badge?: string; avatar?: string },
  text: string,
  type: MessageType = 'text',
  extraData?: {
    replyTo?: { id: string; senderName: string; message: string };
    poll?: PollData;
    event?: EventData;
    achievement?: AchievementData;
  }
): Promise<CommunityMessage> {
  // Check client-side moderation rules first
  if (isUserMuted(schoolId, communityId, sender.id)) {
    throw new Error('عفواً، لا يمكنك الإرسال لأنك مكتوم في هذا المجتمع.');
  }

  const groups = getAllGroups(schoolId);
  const group = groups.find((g) => g.id === communityId);
  if (group && group.isLocked && sender.role === 'student') {
    throw new Error('عفواً، المحادثة مغلقة حالياً بواسطة الإدارة.');
  }

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const payload: Partial<CommunityMessage> = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    communityId,
    schoolId,
    gradeId: group?.gradeId || '',
    classId: group?.classId,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.avatar,
    senderBadge: sender.badge || (sender.role === 'admin' ? 'إدارة المدرسة' : sender.role === 'teacher' ? 'معلم' : 'طالب'),
    message: text,
    type,
    createdAt: now.toISOString(),
    formattedTime,
    reactions: {},
    replyTo: extraData?.replyTo,
    poll: extraData?.poll,
    event: extraData?.event,
    achievement: extraData?.achievement,
  };

  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/community/messages`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId, sender.role),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `فشل حفظ الرسالة في قاعدة البيانات (رمز: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const result = await response.json();
  const savedMessage: CommunityMessage = result.message;

  // Update Group Last Message metadata locally
  if (group) {
    const updatedGroups = groups.map((g) => {
      if (g.id === communityId) {
        return {
          ...g,
          lastMessage: `${sender.name.split(' ')[0]}: ${text.substring(0, 40)}${text.length > 40 ? '...' : ''}`,
          lastMessageTime: formattedTime,
        };
      }
      return g;
    });
    saveGroups(updatedGroups);
  }

  return savedMessage;
}

/**
 * Edit a community message in PostgreSQL
 */
export async function editCommunityMessageApi(
  schoolId: string,
  messageId: string,
  newText: string,
  userId: string,
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent'
): Promise<CommunityMessage> {
  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/community/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(schoolId, userRole === 'owner' ? 'school_admin' : userRole),
      body: JSON.stringify({ message: newText }),
    }
  );

  if (!response.ok) {
    let errorMsg = 'تعذر تعديل الرسالة على الخادم';
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.message;
}

/**
 * Delete a community message from PostgreSQL
 */
export async function deleteCommunityMessageApi(
  schoolId: string,
  messageId: string,
  userId: string,
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent'
): Promise<void> {
  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/community/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(schoolId, userRole === 'owner' ? 'school_admin' : userRole),
    }
  );

  if (!response.ok) {
    let errorMsg = 'تعذر حذف الرسالة على الخادم';
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }
}

/**
 * Toggle reaction on a message in PostgreSQL
 */
export async function toggleMessageReactionApi(
  schoolId: string,
  messageId: string,
  currentReactions: Record<string, string[]>,
  emoji: string,
  userId: string
): Promise<Record<string, string[]>> {
  const reactions = { ...(currentReactions || {}) };
  const currentVoters = reactions[emoji] || [];

  if (currentVoters.includes(userId)) {
    reactions[emoji] = currentVoters.filter((id) => id !== userId);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    reactions[emoji] = [...currentVoters, userId];
  }

  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/community/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(schoolId),
      body: JSON.stringify({ reactions }),
    }
  );

  if (!response.ok) {
    throw new Error('فشل تحديث التفاعل في قاعدة البيانات');
  }

  return reactions;
}

/**
 * Vote in a poll in PostgreSQL
 */
export async function voteInPollApi(
  schoolId: string,
  messageId: string,
  currentPoll: PollData,
  optionId: string,
  userId: string
): Promise<PollData> {
  const poll = { ...currentPoll };

  // Remove previous votes by this user in any option
  poll.options = poll.options.map((opt) => {
    const votes = opt.votes.filter((id) => id !== userId);
    if (opt.id === optionId) {
      votes.push(userId);
    }
    return { ...opt, votes };
  });

  poll.totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);

  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/community/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(schoolId),
      body: JSON.stringify({ poll }),
    }
  );

  if (!response.ok) {
    throw new Error('فشل تسجيل التصويت في قاعدة البيانات');
  }

  return poll;
}

/**
 * Toggle Event Calendar attendee in PostgreSQL
 */
export async function toggleEventCalendarApi(
  schoolId: string,
  messageId: string,
  currentEvent: EventData,
  userId: string
): Promise<{ isAdded: boolean; event: EventData }> {
  const event = { ...currentEvent };
  const attendees = event.attendees || [];
  let isAdded = false;

  if (attendees.includes(userId)) {
    event.attendees = attendees.filter((id) => id !== userId);
    isAdded = false;
  } else {
    event.attendees = [...attendees, userId];
    isAdded = true;
  }

  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/community/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(schoolId),
      body: JSON.stringify({ event }),
    }
  );

  if (!response.ok) {
    throw new Error('فشل تحديث المناسبة في قاعدة البيانات');
  }

  return { isAdded, event };
}

/**
 * Pin or unpin a community message in PostgreSQL
 */
export async function pinCommunityMessageApi(
  schoolId: string,
  communityId: string,
  messageId: string,
  isPinnedNow: boolean
): Promise<void> {
  const response = await fetch(
    `/api/schools/${encodeURIComponent(schoolId)}/community/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(schoolId),
      body: JSON.stringify({ isPinned: isPinnedNow }),
    }
  );

  if (!response.ok) {
    throw new Error('فشل تثبيت الرسالة في قاعدة البيانات');
  }

  const groups = getAllGroups(schoolId);
  const updatedGroups = groups.map((g) => {
    if (g.id === communityId) {
      return { ...g, pinnedMessageId: isPinnedNow ? messageId : undefined };
    }
    return g;
  });
  saveGroups(updatedGroups);
}

/**
 * Realtime EventSource (SSE) Subscriber for Community
 * Automatically receives live new messages, edits, and deletions from PostgreSQL
 */
export function subscribeToCommunityEvents(
  schoolId: string,
  communityId: string | undefined,
  onEvent: (event: {
    type:
      | 'connected'
      | 'new_message'
      | 'update_message'
      | 'delete_message'
      | 'user_muted'
      | 'user_unmuted'
      | 'group_lock_toggled';
    communityId: string;
    message?: CommunityMessage;
    messageId?: string;
    data?: any;
  }) => void
): () => void {
  const session = getStoredSession();
  const token = session?.sessionToken || '';

  const url = `/api/schools/${encodeURIComponent(schoolId)}/community/stream?${
    communityId ? `communityId=${encodeURIComponent(communityId)}&` : ''
  }token=${encodeURIComponent(token)}`;

  let eventSource: EventSource | null = null;
  let isClosed = false;

  try {
    eventSource = new EventSource(url);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data && !isClosed) {
          // Handle moderation event caching automatically
          if (data.type === 'user_muted' && data.data?.mute) {
            updateLocalMuteCache(schoolId, data.data.mute, true);
          } else if (data.type === 'user_unmuted' && data.data?.userId) {
            removeLocalMuteCache(schoolId, data.communityId, data.data.userId);
          } else if (data.type === 'group_lock_toggled' && data.communityId) {
            updateLocalGroupLockCache(schoolId, data.communityId, Boolean(data.data?.isLocked));
          }

          onEvent(data);
        }
      } catch (err) {
        // Silent parse guard
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects natively without log spam
    };
  } catch (err) {
    // Setup error guard
  }

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
  };
}

// Local Cache update helper (for instant sync across components)
function updateLocalMessagesCache(schoolId: string, communityId: string | undefined, newMsgs: CommunityMessage[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    let all: CommunityMessage[] = raw ? JSON.parse(raw) : [];
    if (communityId) {
      all = all.filter((m) => !(m.schoolId === schoolId && m.communityId === communityId)).concat(newMsgs);
    } else {
      all = all.filter((m) => m.schoolId !== schoolId).concat(newMsgs);
    }
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
  } catch (e) {}
}

function updateLocalMuteCache(schoolId: string, mute: CommunityMute, triggerEvent = true) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MUTES);
    let all: CommunityMute[] = raw ? JSON.parse(raw) : [];
    const exists = all.some((m) => m.schoolId === schoolId && m.communityId === mute.communityId && m.userId === mute.userId);
    if (!exists) {
      all.push(mute);
      localStorage.setItem(STORAGE_KEYS.MUTES, JSON.stringify(all));
      if (triggerEvent) notifyCommunityDataChanged('community_mute_changed');
    }
  } catch (e) {}
}

function removeLocalMuteCache(schoolId: string, communityId: string, userId: string, triggerEvent = true) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MUTES);
    let all: CommunityMute[] = raw ? JSON.parse(raw) : [];
    all = all.filter((m) => !(m.schoolId === schoolId && (m.communityId === communityId || m.communityId === 'all') && m.userId === userId));
    localStorage.setItem(STORAGE_KEYS.MUTES, JSON.stringify(all));
    if (triggerEvent) notifyCommunityDataChanged('community_mute_changed');
  } catch (e) {}
}

function updateLocalGroupLockCache(schoolId: string, communityId: string, isLocked: boolean, triggerEvent = true) {
  try {
    const groups = getAllGroups(schoolId);
    let changed = false;
    const updated = groups.map((g) => {
      if (g.id === communityId) {
        if (g.isLocked !== isLocked) changed = true;
        return { ...g, isLocked };
      }
      return g;
    });
    if (changed) {
      saveGroups(updated);
      if (triggerEvent) notifyCommunityDataChanged('community_lock_changed');
    }
  } catch (e) {}
}

// ----------------------------------------------------
// SYNCHRONOUS FALLBACK & UTILITY STORAGE METHODS
// ----------------------------------------------------
export function getAllMessagesRaw(): CommunityMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) return [];
    const messages: CommunityMessage[] = JSON.parse(raw);
    return messages;
  } catch (e) {
    return [];
  }
}

export function saveAllMessagesRaw(allMessages: CommunityMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
    notifyCommunityDataChanged('community_messages_updated');
  } catch (e) {
    console.error('Failed to save community messages', e);
  }
}

export function getCommunityMessages(schoolId: string, communityId: string): CommunityMessage[] {
  try {
    const allMessages = getAllMessagesRaw();
    return allMessages
      .filter((m) => m.schoolId === schoolId && m.communityId === communityId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export function saveMessages(messages: CommunityMessage[]): void {
  saveAllMessagesRaw(messages);
}

export function sendCommunityMessage(
  schoolId: string,
  communityId: string,
  sender: { id: string; name: string; role: 'student' | 'teacher' | 'admin'; badge?: string; avatar?: string },
  text: string,
  type: MessageType = 'text',
  extraData?: {
    replyTo?: { id: string; senderName: string; message: string };
    poll?: PollData;
    event?: EventData;
    achievement?: AchievementData;
  }
): CommunityMessage | null {
  // Fire async API call directly to PostgreSQL
  sendCommunityMessageApi(schoolId, communityId, sender, text, type, extraData).catch(() => {});

  const now = new Date();
  return {
    id: `msg-${Date.now()}`,
    communityId,
    schoolId,
    gradeId: '',
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.avatar,
    senderBadge: sender.badge,
    message: text,
    type,
    createdAt: now.toISOString(),
    formattedTime: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    reactions: {},
    replyTo: extraData?.replyTo,
    poll: extraData?.poll,
    event: extraData?.event,
    achievement: extraData?.achievement,
  };
}

export function editCommunityMessage(
  schoolId: string,
  messageId: string,
  newText: string,
  userId: string,
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent'
): { success: boolean; reason?: string } {
  editCommunityMessageApi(schoolId, messageId, newText, userId, userRole).catch(() => {});
  return { success: true };
}

export function deleteCommunityMessage(
  schoolId: string,
  messageId: string,
  userId: string,
  userRole: 'student' | 'teacher' | 'admin' | 'owner' | 'parent'
): { success: boolean; reason?: string } {
  deleteCommunityMessageApi(schoolId, messageId, userId, userRole).catch(() => {});
  return { success: true };
}

export function toggleMessageReaction(
  schoolId: string,
  messageId: string,
  emoji: string,
  userId: string
): void {
  const msgs = getCommunityMessages(schoolId, '');
  const msg = msgs.find((m) => m.id === messageId);
  toggleMessageReactionApi(schoolId, messageId, msg?.reactions || {}, emoji, userId).catch(() => {});
}

export function voteInPoll(
  schoolId: string,
  messageId: string,
  optionId: string,
  userId: string
): void {
  const msgs = getCommunityMessages(schoolId, '');
  const msg = msgs.find((m) => m.id === messageId);
  if (msg?.poll) {
    voteInPollApi(schoolId, messageId, msg.poll, optionId, userId).catch(() => {});
  }
}

export function toggleEventCalendar(
  schoolId: string,
  messageId: string,
  userId: string
): boolean {
  const msgs = getCommunityMessages(schoolId, '');
  const msg = msgs.find((m) => m.id === messageId);
  if (msg?.event) {
    toggleEventCalendarApi(schoolId, messageId, msg.event, userId).catch(() => {});
    return !msg.event.attendees?.includes(userId);
  }
  return false;
}

export function pinCommunityMessage(
  schoolId: string,
  communityId: string,
  messageId: string
): void {
  const msgs = getCommunityMessages(schoolId, communityId);
  const msg = msgs.find((m) => m.id === messageId);
  pinCommunityMessageApi(schoolId, communityId, messageId, !msg?.isPinned).catch(() => {});
}

// Moderation API (Mutes & Locks) - Server-Authoritative with Local Caching

export async function fetchMutedUsersApi(schoolId: string): Promise<CommunityMute[]> {
  try {
    const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/community/mutes`, {
      headers: getAuthHeaders(schoolId),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch mutes (${response.status})`);
    }
    const data = await response.json();
    const mutes: CommunityMute[] = Array.isArray(data.mutes) ? data.mutes : [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MUTES);
      let all: CommunityMute[] = raw ? JSON.parse(raw) : [];
      all = all.filter((m) => m.schoolId !== schoolId).concat(mutes);
      localStorage.setItem(STORAGE_KEYS.MUTES, JSON.stringify(all));
    } catch {}
    return mutes;
  } catch (e) {
    return getMutedUsers(schoolId);
  }
}

export async function toggleUserMuteApi(
  schoolId: string,
  communityId: string,
  userId: string,
  userName: string,
  mutedBy: string,
  reason?: string
): Promise<{ isMuted: boolean; mute?: CommunityMute }> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/community/mutes/toggle`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify({
      communityId,
      userId,
      userName,
      mutedBy,
      reason,
    }),
  });

  if (!response.ok) {
    let errMsg = `فشل تحديث حالة الكتم في الخادم (رمز: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const isMuted = Boolean(data.isMuted);

  if (isMuted && data.mute) {
    updateLocalMuteCache(schoolId, data.mute, true);
  } else {
    removeLocalMuteCache(schoolId, communityId, userId, true);
  }

  return { isMuted, mute: data.mute };
}

export async function fetchGroupLocksApi(schoolId: string): Promise<Record<string, boolean>> {
  try {
    const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/community/locks`, {
      headers: getAuthHeaders(schoolId),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch group locks (${response.status})`);
    }
    const data = await response.json();
    const locks: { communityId: string; isLocked: boolean }[] = Array.isArray(data.locks) ? data.locks : [];
    const lockMap: Record<string, boolean> = {};
    locks.forEach((l) => {
      lockMap[l.communityId] = l.isLocked;
      updateLocalGroupLockCache(schoolId, l.communityId, l.isLocked, false);
    });
    return lockMap;
  } catch (e) {
    return {};
  }
}

export async function toggleGroupLockApi(schoolId: string, communityId: string): Promise<boolean> {
  const response = await fetch(`/api/schools/${encodeURIComponent(schoolId)}/community/locks/toggle`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify({ communityId }),
  });

  if (!response.ok) {
    let errMsg = `فشل تغيير قفل المحادثة في الخادم (رمز: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const isLocked = Boolean(data.isLocked);
  updateLocalGroupLockCache(schoolId, communityId, isLocked, true);
  return isLocked;
}

export function getMutedUsers(schoolId: string): CommunityMute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MUTES);
    const mutes: CommunityMute[] = raw ? JSON.parse(raw) : [];
    return mutes.filter((m) => m.schoolId === schoolId);
  } catch (e) {
    return [];
  }
}

export function isUserMuted(schoolId: string, communityId: string, userId: string): boolean {
  const mutes = getMutedUsers(schoolId);
  return mutes.some(
    (m) => m.userId === userId && (m.communityId === communityId || m.communityId === 'all')
  );
}

export async function toggleUserMute(
  schoolId: string,
  communityId: string,
  userId: string,
  userName: string,
  mutedBy: string
): Promise<boolean> {
  const res = await toggleUserMuteApi(schoolId, communityId, userId, userName, mutedBy);
  return res.isMuted;
}

export async function toggleGroupLock(schoolId: string, communityId: string): Promise<boolean> {
  return await toggleGroupLockApi(schoolId, communityId);
}

// Automatic achievement post triggered when student receives a badge
export function triggerAutomaticAchievementMessage(
  schoolId: string,
  studentId: string,
  studentName: string,
  badgeTitle: string,
  className?: string,
  gradeName?: string
): void {
  const groups = getAllGroups(schoolId);
  const userGrade = gradeName || className;

  // Retrieve student's accessible groups (grade/age community + class community)
  const accessibleGroups = getUserAccessibleGroups(
    schoolId,
    'student',
    userGrade,
    className
  );

  let targetGroups: CommunityGroup[] = [];

  if (accessibleGroups && accessibleGroups.length > 0) {
    targetGroups = accessibleGroups;
  } else {
    // Fallback: search groups by className or gradeName matching
    const matched = groups.filter(
      (g) =>
        (className && g.className && (g.className.includes(className) || className.includes(g.className))) ||
        (userGrade && g.gradeName && (g.gradeName.includes(userGrade) || userGrade.includes(g.gradeName))) ||
        (userGrade && g.name && (g.name.includes(userGrade) || userGrade.includes(g.name)))
    );
    if (matched.length > 0) {
      targetGroups = matched;
    } else if (groups.length > 0) {
      targetGroups = [groups[0]];
    }
  }

  // Deduplicate target groups by ID
  const groupMap = new Map<string, CommunityGroup>();
  targetGroups.forEach((g) => groupMap.set(g.id, g));
  const finalGroups = Array.from(groupMap.values());

  finalGroups.forEach((targetGroup) => {
    sendCommunityMessageApi(
      schoolId,
      targetGroup.id,
      { id: 'system', name: 'النظام الآلي للمدرسة', role: 'admin', badge: 'إنجاز مدرسة' },
      `🎉 تهانينا! حصل الطالب ${studentName} على ${badgeTitle}.`,
      'achievement',
      {
        achievement: {
          studentId,
          studentName,
          badgeTitle,
          icon: '🏆',
        },
      }
    ).catch((err) => console.warn('[Auto Achievement Notice]:', err));
  });
}

