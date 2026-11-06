import { Student, Teacher, GradeRecord, BehaviorRecord, ClassRoom, Subject } from './admin';

export type TeacherViewTab = 'dashboard' | 'private_messages' | 'community' | 'leaderboard' | 'badges' | 'behavior' | 'infractions' | 'announcements' | 'profile';

export interface TeacherPortalData {
  teacher: Teacher;
  schoolId: string;
  schoolName: string;
  assignedClasses: ClassRoom[];
  assignedSubjects: Subject[];
  assignedStudents: Student[];
  recentGrades: GradeRecord[];
  recentBehavior: BehaviorRecord[];
  announcements?: any[];
}

export interface TeacherActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'grade' | 'behavior';
}
