import { ParentViewTab } from './parent';

export type AdministrativeActionType = 'parent_summons' | 'temporary_suspension' | 'expulsion';

export interface AdministrativeAction {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  actionType: AdministrativeActionType;
  title: string;
  
  // Parent Summons fields
  summonsDate?: string; // YYYY-MM-DD
  summonsTime?: string; // e.g. "10:00 صباحاً"
  
  // Temporary Suspension & Expulsion fields
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  
  reason: string;
  notes?: string;
  createdAt: string; // ISO date / string
  createdBy: string; // e.g. "إدارة المدرسة"
  status: 'نشط' | 'منتهي' | 'ملغى';
}

export type NotificationCategory =
  | 'announcement'
  | 'grade'
  | 'behavior'
  | 'badge'
  | 'parent_summons'
  | 'temporary_suspension'
  | 'expulsion'
  | 'attendance_late_rule';

export type NotificationPriority = 'عالي' | 'عادي';

export interface ParentNotification {
  id: string;
  schoolId: string;
  studentId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  priority: NotificationPriority;
  relatedId?: string;
  targetTab?: ParentViewTab;
}
