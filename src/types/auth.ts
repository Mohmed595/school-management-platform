export type UserRole = 'owner' | 'school_admin' | 'teacher' | 'attendance_teacher' | 'parent';

export interface TrustedDeviceSession {
  id: string; // Unique Session ID (e.g. tds_...)
  deviceId: string;
  userId: string;
  userRole: UserRole;
  schoolId?: string;
  schoolName?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  userDisplayName: string;
  avatarUid?: string;
  tokenHash: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string; // ISO date, exactly 300 days from creation
  revokedAt?: string | null;
  metadata?: Record<string, any>;
}

export interface SavedAccountItem {
  sessionId: string;
  sessionToken: string;
  deviceId: string;
  userId: string;
  userRole: UserRole;
  userDisplayName: string;
  schoolId?: string;
  schoolName?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  avatarUid?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  remainingDays: number;
  isCurrent?: boolean;
}

export interface TrustedDeviceInfo {
  deviceId: string;
  deviceName: string;
  isTrusted: boolean;
  totalSavedAccounts: number;
  activeSessionId?: string;
  createdAt?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  remainingDays?: number;
}
