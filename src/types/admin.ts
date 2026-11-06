export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر';
export type BehaviorType = 'إيجابي' | 'سلبي';
export type AnnouncementPriority = 'عادي' | 'هام' | 'عاجل جداً';
export type AnnouncementAudience = 'جميع المدارس' | 'المعلمين' | 'الطلاب' | 'أولياء الأمور';

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  studentCode?: string; // Auto generated student ID e.g. STD-2026-89421
  ministryCode?: string; // Egyptian Ministry of Education code (كود الوزارة)
  nationalId: string; // 14-digit Egyptian National ID (الرقم القومي)
  classId: string;
  className: string;
  gradeLevel?: string;
  isClassAssigned?: boolean; // True once assigned to a specific class (e.g. 1/1, 2/2) vs initial grade pool
  age?: string | number;
  birthDate: string;
  gender: 'ذكر' | 'أنثى';
  avatar_layout_uid?: string; // Foreign key to avatar_layouts (AVL-000001 to AVL-000025)
  photoUrl?: string;
  status: 'منتظم' | 'موقوف' | 'منقول';
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  joinDate: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  avatar_layout_uid?: string; // Foreign key to avatar_layouts (AVL-000001 to AVL-000025)
  username?: string; // Credentials for teacher / attendance login
  password?: string;
  isAttendanceOfficer?: boolean; // True if this account is the school's single attendance teacher
  specialization: string;
  status: 'نشط' | 'إجازة' | 'غير نشط';
  assignedClasses: string[]; // Class names e.g. ["الصف الأول أ", "الصف الثاني ب"]
  assignedSubjects: string[]; // Subject names e.g. ["اللغة العربية", "التربية الدينية"]
  joinDate: string;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string; // e.g. "1/1", "1/2", "2/1" (Egyptian format: grade/class_number)
  gradeLevel: string; // e.g. "الصف الأول الإعدادي"
  stage?: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال';
  grade?: number; // 1, 2, 3...
  class_number?: number; // 1, 2, 3...
  roomNumber?: string;
  capacity: number;
  studentCount?: number;
  headTeacherId?: string;
  headTeacherName?: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string; // e.g. "اللغة العربية"
  code: string; // e.g. "AR101"
  gradeLevel: string;
  maxScore: number;
  passScore: number;
  teacherNames: string[];
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}

export interface GradeRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  examName: string; // e.g. "منتصف الفصل" | "الاختبار النهائي" | "اختبار الشهر الأول"
  score: number;
  maxScore: number;
  date: string;
  notes?: string;
}

export interface BehaviorRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: BehaviorType;
  title: string;
  points: number;
  date: string; // YYYY-MM-DD
  notes: string;
  reportedBy: string;
}

export interface Parent {
  id: string;
  schoolId: string;
  name: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  address?: string;
  childrenIds: string[];
  childrenNames?: string[];
  studentIds?: string[];
}

export type AnnouncementType = 'general' | 'poll' | 'event';

export interface PollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface PollVote {
  userId: string;
  userName?: string;
  userRole?: string;
  selectedOptionIds: string[];
  votedAt: string;
}

export interface EventRsvp {
  userId: string;
  userName: string;
  userRole: string;
  status: 'attending' | 'interested' | 'declined';
  rsvpAt: string;
}

export interface Announcement {
  id: string;
  schoolId: string;
  type?: AnnouncementType;
  title: string;
  content: string;
  targetAudience: AnnouncementAudience | string;
  priority: AnnouncementPriority | string;
  publishDate: string;
  date?: string;
  important?: boolean;
  isScheduled?: boolean;
  author: string;
  authorName?: string;

  // Poll fields
  pollOptions?: PollOption[];
  pollVotes?: PollVote[];
  pollExpiresAt?: string;
  allowMultiple?: boolean;

  // Event fields
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventOrganizer?: string;
  eventRsvps?: EventRsvp[];

  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolAdminInfo {
  schoolId: string;
  name: string;
  logoUrl?: string;
  code: string;
  licenseKey: string;
  governorate: string;
  educationalDistrict: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  academicYear: string;
  themeColor?: string;
  studentAuthMode?: 'ministry_code' | 'legacy';
  enableThreeLateRule?: boolean;
}

export interface SchoolAdminData {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  licenseKey: string;
  licenseExpiry?: string;
  principalName: string;
  phone?: string;
  email?: string;
  address?: string;
  academicYear?: string;
  themeColor?: string;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  grades?: GradeRecord[];
  behavior: BehaviorRecord[];
  parents: Parent[];
  announcements: Announcement[];
}

export type CalendarPriority = 'low' | 'medium' | 'high';
export type CalendarStatus = 'pending' | 'completed';

export interface CalendarTask {
  id: string;
  school_id: string;
  schoolId?: string;
  title: string;
  description?: string;
  priority: CalendarPriority;
  status: CalendarStatus;
  task_date: string; // YYYY-MM-DD
  date?: string;
  assignedTo?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type AdminViewTab =
  | 'dashboard'
  | 'private_messages'
  | 'community'
  | 'calendar'
  | 'leaderboard'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'attendance'
  | 'behavior'
  | 'badges'
  | 'infractions'
  | 'adminActions'
  | 'announcements'
  | 'reports'
  | 'extensions'
  | 'settings'
  | 'ai_assistant';

