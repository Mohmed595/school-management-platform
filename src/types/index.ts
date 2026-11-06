export type Governorate = 
  | 'القاهرة'
  | 'الجيزة'
  | 'الإسكندرية'
  | 'الشرقية'
  | 'الدقهلية'
  | 'البحيرة'
  | 'القليوبية'
  | 'الغربية'
  | 'المنوفية'
  | 'أسيوط'
  | 'سوهاج'
  | 'الفيوم'
  | 'المنيا'
  | 'قنا'
  | 'بورسعيد'
  | 'السويس'
  | 'الأقصر'
  | 'أسوان';

export const EGYPT_GOVERNORATES: Governorate[] = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الشرقية',
  'الدقهلية',
  'البحيرة',
  'القليوبية',
  'الغربية',
  'المنوفية',
  'أسيوط',
  'سوهاج',
  'الفيوم',
  'المنيا',
  'قنا',
  'بورسعيد',
  'السويس',
  'الأقصر',
  'أسوان',
];

export type SubscriptionPlan = 'أساسي' | 'احترافي' | 'بريميوم';

export type SchoolStatus = 'نشطة' | 'معلقة';

export const EGYPTIAN_GRADE_LEVELS = [
  'KG1 - روضة أولى',
  'KG2 - روضة ثانية',
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
] as const;

export type EgyptianGradeLevel = typeof EGYPTIAN_GRADE_LEVELS[number];

export interface School {
  id: string;
  name: string;
  code: string;           // Auto generated e.g. EG-CAI-1024
  licenseKey: string;     // Auto generated e.g. LIC-2026-X89F-72K9
  adminEmail?: string;    // Login email
  adminPassword?: string; // Login password
  governorate: Governorate;
  studentsCount: number;
  teachersCount: number;
  subscription: SubscriptionPlan;
  status: SchoolStatus;
  createdAt: string;      // Auto generated ISO date string
  principalName: string;
  principalPhone: string;
  principalEmail: string;
  licenseExpiry: string;
  stage?: string;
  attendance_start_date?: string;
}

export interface License {
  id: string;
  schoolId: string;
  schoolName: string;
  key: string;
  plan: SubscriptionPlan;
  issueDate: string;
  expiryDate: string;
  status: 'نشط' | 'منتهي' | 'ملغي';
  autoRenew: boolean;
}

export interface UserSession {
  id?: string;
  email?: string;
  name?: string;
  role?: 'owner';
  avatar_layout_uid?: string;
  avatarUrl?: string;
  lastLogin?: string;
  isAuthenticated?: boolean;
  userRole?: 'owner' | 'school_admin' | 'teacher' | 'attendance_teacher' | 'parent';
  schoolId?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  gradeLevel?: string;
  teacherId?: string;
  userDisplayName?: string;
  isTrustedDevice?: boolean;
  trustedSessionId?: string;
  trustedExpiresAt?: string;
  sessionToken?: string;
}


export type ViewTab = 'dashboard' | 'schools' | 'licenses' | 'analytics' | 'database' | 'platform_usage' | 'settings' | 'ai_assistant' | 'messages' | 'tickets';
