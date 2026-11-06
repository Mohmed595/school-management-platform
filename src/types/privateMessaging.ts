export type MessageUserRole = 'student' | 'teacher' | 'attendance_teacher' | 'school_admin' | 'owner';

export interface ConversationParticipant {
  id: string;
  role: string;
  name: string;
  details: string;
}

export interface PrivateConversation {
  id: string;
  schoolId: string;
  otherParticipant: ConversationParticipant;
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isFromMe: boolean;
}

export interface RecipientSearchResult {
  id: string;
  role: string;
  name: string;
  details: string;
}
