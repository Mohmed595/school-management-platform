export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical' | 'other' | (string & {});
export type BadgeTargetType = 'student' | 'teacher' | 'attendance_teacher' | 'admin' | 'other' | (string & {});
export type BadgeLimitType = 'none' | 'monthly' | 'forever';

export interface Badge {
  id: string;
  schoolId?: string;
  name: string;
  nameEn?: string;
  description: string;
  icon: string;
  color: string;
  rarity: BadgeRarity;
  targetType: BadgeTargetType;
  isActive: boolean;
  hasAnimatedBorder?: boolean;
  isHidden?: boolean;
  createdAt: string;

  // Limited Badges System
  limitType?: BadgeLimitType; // 'none' (unlimited), 'monthly' (resets every month), 'forever' (fixed limit forever)
  maxQuantity?: number; // Maximum number of students allowed for this badge in its limit scope
}

export interface StudentBadge {
  id: string;
  schoolId?: string;
  studentId: string;
  badgeId: string;
  awardedBy: string;
  awardedAt: string;
  awardedMonthKey?: string; // Format: "YYYY-MM" (e.g. "2026-07") for tracking monthly limits
  note?: string;
  isUnboxed?: boolean;
}

export interface TeacherBadge {
  id: string;
  schoolId?: string;
  teacherId: string;
  badgeId: string;
  awardedBy: string;
  awardedAt: string;
  awardedMonthKey?: string;
  note?: string;
}

export interface StudentWithBadges {
  studentId: string;
  badges: Array<{
    assignment: StudentBadge;
    badge: Badge;
  }>;
}

export interface GroupedStudentBadge {
  badge: Badge;
  count: number;
  assignments: StudentBadge[];
  latestAssignment: StudentBadge;
}

export interface GroupedTeacherBadge {
  badge: Badge;
  count: number;
  assignments: TeacherBadge[];
  latestAssignment: TeacherBadge;
}

export interface StudentPointsBreakdown {
  badges: {
    rareCount: number;
    epicCount: number;
    legendaryCount: number;
    mythicalCount: number;
    unknownCount: number;
    totalBadgeCount: number;
    points: number;
  };
  attendance: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    otherCount: number;
    totalDays: number;
    points: number;
  };
}

export interface StudentPointsResult {
  success: boolean;
  schoolId: string;
  studentId: string;
  studentName?: string;
  totalPoints: number;
  badgePoints: number;
  attendancePoints: number;
  breakdown: StudentPointsBreakdown;
  calculatedAt: string;
}


