import { Student, AttendanceRecord, GradeRecord, BehaviorRecord, Announcement, SchoolAdminInfo } from './admin';
import { AdministrativeAction } from './adminAction';
import { StudentStreakInfo } from '../lib/streakStorage';
import { StudentPointsResult } from './badge';

export type ParentViewTab =
  | 'home'
  | 'private_messages'
  | 'community'
  | 'leaderboard'
  | 'reports'
  | 'badges'
  | 'attendance'
  | 'behavior'
  | 'announcements'
  | 'notifications'
  | 'tickets'
  | 'profile';

export type HomeworkStatus = 'مكتمل' | 'قيد التنفيذ' | 'متأخر';

export interface HomeworkItem {
  id: string;
  schoolId: string;
  studentId?: string;
  classId?: string;
  className?: string;
  subjectName: string;
  teacherName?: string;
  title: string;
  description?: string;
  assignedDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  status: HomeworkStatus;
}

export interface ParentPortalData {
  student: Student;
  schoolInfo: SchoolAdminInfo;
  attendance: AttendanceRecord[];
  grades?: GradeRecord[];
  behavior: BehaviorRecord[];
  homework: HomeworkItem[];
  announcements: Announcement[];
  adminActions?: AdministrativeAction[];
  streak?: StudentStreakInfo;
  points?: StudentPointsResult;
  badges?: any[];
  stats: {
    attendancePercentage: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overallGpa: number;
    overallGradeLabel: string;
    positivePoints: number;
    negativePoints: number;
    pendingHomeworkCount: number;
  };
}
