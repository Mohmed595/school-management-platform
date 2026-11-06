export type TicketStatus = 'جديدة' | 'قيد المراجعة' | 'تم الرد' | 'مغلقة';

export interface SupportTicket {
  id: string;
  ticketCode: string;
  schoolId: string;
  schoolName?: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  category: string;
  subcategory: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  createdDate: string;
  updatedAt: string;
  answeredAt?: string | null;
  answeredBy?: string | null;
  repliesCount?: number;
}

export interface SupportTicketReply {
  id: string;
  ticketId: string;
  schoolId: string;
  senderRole: 'student' | 'owner' | 'school_admin';
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface TicketWithReplies extends SupportTicket {
  replies: SupportTicketReply[];
}

export interface CreateTicketInput {
  schoolId: string;
  schoolName?: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  category?: string;
  subcategory?: string;
  subject: string;
  description: string;
}

export interface DailyTicketUsage {
  usedToday: number;
  maxDaily: number;
  remainingToday: number;
  date: string;
  canCreate: boolean;
}
