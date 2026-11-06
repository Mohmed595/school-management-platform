export type CommunityType = 'grade' | 'class';

export interface CommunityGroup {
  id: string;
  schoolId: string;
  type: CommunityType;
  gradeId: string;
  gradeName: string;
  classId?: string;
  className?: string;
  name: string; // e.g., "مجتمع أولى إعدادي" or "مجتمع فصل 1/1"
  description: string;
  icon: string; // Emoji or icon code
  membersCount: number;
  onlineCount: number;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  pinnedMessageId?: string;
  isLocked: boolean; // Locked by admin
  createdAt: string;
}

export type MessageType = 'text' | 'announcement' | 'poll' | 'event' | 'achievement';

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // User IDs who voted for this option
}

export interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
}

export interface EventData {
  title: string;
  date: string; // e.g. "الخميس المقبل - 5 أغسطس"
  time: string; // e.g. "08:00 صباحاً"
  location?: string; // e.g. "المسرح المدرسي"
  attendees: string[]; // User IDs who added to calendar
}

export interface AchievementData {
  studentId: string;
  studentName: string;
  badgeTitle: string;
  badgeCategory?: string;
  icon?: string;
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  schoolId: string;
  gradeId: string;
  classId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'admin';
  senderAvatar?: string;
  senderBadge?: string; // e.g. "إدارة المدرسة" or "معلم المادة" or "طالب"
  message: string;
  type: MessageType;
  createdAt: string; // ISO date string
  formattedTime: string; // e.g. "10:30 ص"
  editedAt?: string;
  deletedAt?: string;
  isDeleted?: boolean;
  isPinned?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    message: string;
  };
  reactions: Record<string, string[]>; // emoji key -> array of userIds
  poll?: PollData;
  event?: EventData;
  achievement?: AchievementData;
}

export interface CommunityMute {
  id: string;
  schoolId: string;
  communityId: string;
  userId: string;
  userName: string;
  mutedBy: string;
  mutedAt: string;
  reason?: string;
}

export interface CommunityNotification {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  body: string;
  communityId: string;
  messageId?: string;
  type: 'new_message' | 'announcement' | 'pinned' | 'mention';
  isRead: boolean;
  createdAt: string;
}
