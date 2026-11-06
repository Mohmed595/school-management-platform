import {
  SupportTicket,
  SupportTicketReply,
  TicketWithReplies,
  CreateTicketInput,
  DailyTicketUsage,
  TicketStatus,
} from '../types/ticket';
import { getStoredSession } from './storage';

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

export interface SupportTicketsResponseMeta {
  hasMore: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  stats?: {
    totalCount: number;
    newCount: number;
    inReviewCount: number;
    answeredCount: number;
    closedCount: number;
  };
}

/**
 * Fetches tickets available to the current user with server-side pagination & stats
 */
export async function fetchSupportTicketsApi(params?: {
  status?: string;
  schoolId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<SupportTicket[] & SupportTicketsResponseMeta> {
  const queryParams = new URLSearchParams();
  if (params?.status && params.status !== 'الكل' && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  if (params?.schoolId && params.schoolId !== 'all') {
    queryParams.append('schoolId', params.schoolId);
  }
  if (params?.search && params.search.trim()) {
    queryParams.append('search', params.search.trim());
  }
  if (params?.page) {
    queryParams.append('page', String(params.page));
  }
  if (params?.limit) {
    queryParams.append('limit', String(params.limit));
  }

  const url = `/api/support-tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل جلب قائمة التذاكر (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const ticketsList: SupportTicket[] = Array.isArray(data.tickets) ? data.tickets : [];

  const meta: SupportTicketsResponseMeta = {
    hasMore: Boolean(data.hasMore),
    page: Number(data.page || 1),
    totalPages: Number(data.totalPages || 1),
    totalCount: Number(data.totalCount || ticketsList.length),
    stats: data.stats || undefined,
  };

  return Object.assign(ticketsList, meta);
}

/**
 * Fetches a single ticket with full replies conversation history
 */
export async function fetchSupportTicketDetailsApi(ticketId: string): Promise<TicketWithReplies> {
  const response = await fetch(`/api/support-tickets/${ticketId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل جلب تفاصيل التذكرة (رمز الخطأ: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.ticket;
}

/**
 * Creates a new support ticket in PostgreSQL. Enforces server-side 2 tickets/day limit.
 */
export async function createSupportTicketApi(
  input: CreateTicketInput
): Promise<{ ticket: SupportTicket; usage: { usedToday: number; maxDaily: number; remainingToday: number } }> {
  const response = await fetch('/api/support-tickets', {
    method: 'POST',
    headers: getAuthHeaders(input.schoolId),
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error || `فشل إنشاء التذكرة (رمز الخطأ: ${response.status})`;
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.dailyLimitReached = data?.dailyLimitReached || response.status === 429;
    throw error;
  }

  return {
    ticket: data.ticket,
    usage: data.usage,
  };
}

/**
 * Submits a reply to an existing ticket
 */
export async function replySupportTicketApi(
  ticketId: string,
  message: string,
  newStatus?: TicketStatus
): Promise<{ reply: SupportTicketReply; updatedStatus: TicketStatus }> {
  const response = await fetch(`/api/support-tickets/${ticketId}/reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, newStatus }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error || `فشل إرسال الرد (رمز الخطأ: ${response.status})`;
    throw new Error(errorMsg);
  }

  return {
    reply: data.reply,
    updatedStatus: data.updatedStatus,
  };
}

/**
 * Updates the status of a ticket directly (Owner / School Admin)
 */
export async function updateSupportTicketStatusApi(
  ticketId: string,
  status: TicketStatus
): Promise<{ status: TicketStatus }> {
  const response = await fetch(`/api/support-tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error || `فشل تحديث حالة التذكرة (رمز الخطأ: ${response.status})`;
    throw new Error(errorMsg);
  }

  return {
    status: data.status,
  };
}

/**
 * Queries current student's daily tickets quota usage from the server
 */
export async function fetchMyDailyTicketUsageApi(): Promise<DailyTicketUsage> {
  const response = await fetch('/api/support-tickets/my-daily-usage', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMsg = `فشل استرجاع الحد اليومي للتذاكر`;
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.data;
}
