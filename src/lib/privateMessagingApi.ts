import { getStoredSession } from './storage';
import {
  PrivateConversation,
  PrivateMessage,
  RecipientSearchResult,
} from '../types/privateMessaging';

function getAuthHeaders(overrideSchoolId?: string): HeadersInit {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.sessionToken) {
    headers['Authorization'] = `Bearer ${session.sessionToken}`;
  }

  const schoolId = overrideSchoolId || session?.schoolId;
  if (schoolId) {
    headers['X-School-Id'] = schoolId;
  }
  if (session?.userRole) {
    headers['X-User-Role'] = session.userRole;
  }
  if (session?.studentId) {
    headers['X-Student-Id'] = session.studentId;
  }
  const userId = session?.id || session?.studentId || session?.teacherId;
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  if (session?.studentCode) {
    headers['X-Student-Code'] = session.studentCode;
  }
  if (session?.studentName) {
    headers['X-Student-Name'] = encodeURIComponent(session.studentName);
  }
  if (session?.className) {
    headers['X-Class-Name'] = encodeURIComponent(session.className);
  }

  return headers;
}

/**
 * Fetches all private conversations for the current authenticated user in the school
 */
export async function fetchPrivateConversationsApi(schoolId: string): Promise<PrivateConversation[]> {
  const response = await fetch(`/api/schools/${schoolId}/private-conversations`, {
    method: 'GET',
    headers: getAuthHeaders(schoolId),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'فشل تحميل المحادثات الخاصة');
  }

  return data.conversations || [];
}

/**
 * Fetches messages for a specific private conversation
 */
export async function fetchPrivateMessagesApi(
  schoolId: string,
  conversationId: string,
  options?: { limit?: number; before?: string }
): Promise<{
  conversation: any;
  messages: PrivateMessage[];
  hasMore: boolean;
  oldestCursor: string | null;
  dailyLimit?: number;
  dailySentCount?: number;
  dailyRemaining?: number;
}> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.before) params.set('before', options.before);

  const url = `/api/schools/${schoolId}/private-conversations/${conversationId}/messages${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(schoolId),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'فشل تحميل رسائل المحادثة');
  }

  return {
    conversation: data.conversation,
    messages: data.messages || [],
    hasMore: Boolean(data.hasMore),
    oldestCursor: data.oldestCursor || null,
    dailyLimit: typeof data.dailyLimit === 'number' ? data.dailyLimit : 55,
    dailySentCount: typeof data.dailySentCount === 'number' ? data.dailySentCount : 0,
    dailyRemaining: typeof data.dailyRemaining === 'number' ? data.dailyRemaining : 55,
  };
}

/**
 * Starts a new 1-to-1 private conversation
 */
export async function startPrivateConversationApi(
  schoolId: string,
  payload: {
    recipientType: 'student' | 'teacher';
    recipientId: string;
    initialMessage: string;
  }
): Promise<{ conversationId: string; message: PrivateMessage }> {
  const response = await fetch(`/api/schools/${schoolId}/private-conversations`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'فشل بدء المحادثة');
  }

  return {
    conversationId: data.conversationId,
    message: data.message,
  };
}

/**
 * Sends a reply in an existing conversation
 */
export async function sendPrivateMessageApi(
  schoolId: string,
  conversationId: string,
  body: string
): Promise<PrivateMessage> {
  const response = await fetch(`/api/schools/${schoolId}/private-conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(schoolId),
    body: JSON.stringify({ body }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'فشل إرسال الرسالة');
  }

  return data.message;
}

/**
 * Search sanitized recipients within the school (student or teacher)
 */
export async function searchPrivateRecipientsApi(
  schoolId: string,
  type: 'student' | 'teacher',
  query?: string
): Promise<RecipientSearchResult[]> {
  const params = new URLSearchParams();
  params.set('type', type);
  if (query) params.set('q', query.trim());

  const response = await fetch(`/api/schools/${schoolId}/private-conversations/recipients?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(schoolId),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'فشل البحث عن المستلمين');
  }

  return data.recipients || [];
}

/**
 * Explicitly marks incoming unread messages as read
 */
export async function markPrivateConversationAsReadApi(
  schoolId: string,
  conversationId: string
): Promise<void> {
  try {
    await fetch(`/api/schools/${schoolId}/private-conversations/${conversationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(schoolId),
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Returns EventSource URL for real-time private messages
 */
export function getPrivateMessagingEventSourceUrl(
  schoolId: string,
  userRole?: string,
  userId?: string,
  userName?: string
): string {
  const session = getStoredSession();
  const params = new URLSearchParams();
  if (session?.sessionToken) {
    params.set('token', session.sessionToken);
  }
  const effectiveRole = userRole || session?.userRole;
  if (effectiveRole) params.set('role', effectiveRole);
  const effectiveUserId = userId || session?.id || session?.studentId || session?.teacherId;
  if (effectiveUserId) params.set('userId', effectiveUserId);
  const effectiveName = userName || session?.studentName || session?.name;
  if (effectiveName) params.set('name', effectiveName);
  params.set('schoolId', schoolId);

  return `/api/schools/${encodeURIComponent(schoolId)}/private-conversations/stream?${params.toString()}`;
}

