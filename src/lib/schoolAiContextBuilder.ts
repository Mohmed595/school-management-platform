import { SchoolAdminData, CalendarTask } from '../types/admin';
import type { SchoolExtension } from '../types/extensions';
import { getAllGroups, getCommunityMessages, getMutedUsers } from './communityStorage';
import { getCalendarTasksBySchool } from './calendarStorage';
import { getAllBadges, getAllStudentBadges, getAllTeacherBadges } from './badgeStorage';
import { getAllAdminActions } from './adminActionStorage';
import { getStudentStreakInfo } from './streakStorage';

export interface ComprehensiveSchoolAiContext {
  schoolName: string;
  schoolCode: string;
  academicYear: string;
  principalName: string;
  governorate?: string;
  phone: string;
  email: string;
  address: string;
  licenseKey: string;
  licenseExpiry: string;
  subscription?: string;

  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    totalAnnouncements: number;
    totalParents: number;
    totalAttendanceRecords: number;
    totalGradesCount: number;
    totalBehaviorRecords: number;
    totalCommunityGroups: number;
    totalCalendarEvents: number;
    totalBadgesAwarded: number;
    totalAdminActions: number;
  };

  // 1. DIRECTORY
  students: any[];
  teachers: any[];
  classes: any[];
  subjects: any[];
  parents: any[];

  // 2. ACADEMIC & ATTENDANCE
  attendance: any[];
  grades: any[];
  behavior: any[];
  announcements: any[];

  // 3. SETTINGS & EXTENSIONS
  settings: {
    schoolName: string;
    schoolCode: string;
    academicYear: string;
    principalName: string;
    phone: string;
    email: string;
    address: string;
    licenseKey: string;
    licenseExpiry: string;
    governorate?: string;
    educationalDistrict?: string;
  };
  extensions: {
    id: string;
    name: string;
    isEnabled: boolean;
    settings?: any;
  }[];

  // 4. COMMUNITY CHATS & DISCUSSIONS
  community: {
    groups: {
      id: string;
      name: string;
      type: string;
      description?: string;
      isLocked?: boolean;
      membersCount: number;
    }[];
    recentMessages: {
      groupId: string;
      groupName: string;
      senderName: string;
      senderRole: string;
      text: string;
      timestamp: string;
      replyToSnippet?: string;
      reactionsCount?: number;
    }[];
    activePolls: {
      groupId: string;
      question: string;
      options: { text: string; votes: number }[];
      totalVotes: number;
    }[];
    events: {
      groupId: string;
      title: string;
      date: string;
      location?: string;
    }[];
    mutes: {
      userId: string;
      userName: string;
      reason?: string;
      mutedAt: string;
    }[];
  };

  // 5. LEADERBOARD (الأوائل)
  leaderboard: {
    rank: number;
    studentId: string;
    studentName: string;
    className: string;
    points: number;
    streakDays: number;
    streakTitle: string;
    badgesCount: number;
  }[];

  // 6. SCHOOL CALENDAR & SCHEDULE
  calendar: {
    id: string;
    title: string;
    date: string;
    priority?: string;
    status?: string;
    description?: string;
  }[];

  // 7. BADGES & ACHIEVEMENTS
  badges: {
    availableBadges: {
      id: string;
      name: string;
      rarity: string;
      description: string;
    }[];
    awardedStudentBadges: {
      studentId: string;
      studentName: string;
      badgeId: string;
      badgeName: string;
      awardedAt: string;
      note?: string;
    }[];
    awardedTeacherBadges: {
      teacherId: string;
      teacherName: string;
      badgeId: string;
      badgeName: string;
      awardedAt: string;
    }[];
  };

  // 8. ADMINISTRATIVE ACTIONS
  adminActions: {
    id: string;
    studentId: string;
    studentName: string;
    actionType: string;
    title: string;
    reason: string;
    date: string;
    status: string;
  }[];
}

export function buildComprehensiveSchoolAiContext(
  schoolData: SchoolAdminData,
  extensions: SchoolExtension[] = []
): ComprehensiveSchoolAiContext {
  const schoolId = schoolData.schoolId || 'sch-1';

  // 1. Community Data
  const groups = getAllGroups(schoolId);
  const recentMessages: ComprehensiveSchoolAiContext['community']['recentMessages'] = [];
  const activePolls: ComprehensiveSchoolAiContext['community']['activePolls'] = [];
  const communityEvents: ComprehensiveSchoolAiContext['community']['events'] = [];

  groups.forEach((g) => {
    // Recent messages for group
    const msgs = getCommunityMessages(schoolId, g.id);
    msgs.slice(-15).forEach((m) => {
      let rCount = 0;
      if (m.reactions && typeof m.reactions === 'object') {
        Object.values(m.reactions).forEach((val) => {
          if (Array.isArray(val)) rCount += val.length;
        });
      }

      recentMessages.push({
        groupId: g.id,
        groupName: g.name,
        senderName: m.senderName,
        senderRole: m.senderRole,
        text: m.message,
        timestamp: m.createdAt,
        replyToSnippet: m.replyTo?.message ? m.replyTo.message.slice(0, 40) : undefined,
        reactionsCount: rCount,
      });

      // Collect polls from messages
      if (m.poll) {
        const totalVotes = m.poll.options.reduce((acc: number, opt: any) => acc + (opt.votes?.length || 0), 0);
        activePolls.push({
          groupId: g.id,
          question: m.poll.question,
          options: m.poll.options.map((o: any) => ({
            text: o.text,
            votes: o.votes?.length || 0,
          })),
          totalVotes,
        });
      }

      // Collect events from messages
      if (m.event) {
        communityEvents.push({
          groupId: g.id,
          title: m.event.title,
          date: m.event.date,
          location: m.event.location,
        });
      }
    });
  });

  const mutes = getMutedUsers(schoolId).map((m) => ({
    userId: m.userId,
    userName: m.userName,
    reason: m.reason,
    mutedAt: m.mutedAt,
  }));

  // 2. School Calendar Tasks
  const calendarTasks = getCalendarTasksBySchool(schoolId).map((t: CalendarTask) => ({
    id: t.id,
    title: t.title,
    date: t.task_date || t.date || '',
    priority: t.priority,
    status: t.status,
    description: t.description,
  }));

  // 3. Badges Data
  const systemBadges = getAllBadges(schoolId);
  const allStudentBadges = getAllStudentBadges();
  const allTeacherBadges = getAllTeacherBadges();

  const studentNameMap = new Map<string, string>();
  schoolData.students.forEach((s) => studentNameMap.set(s.id, s.name));

  const teacherNameMap = new Map<string, string>();
  schoolData.teachers.forEach((t) => teacherNameMap.set(t.id, t.name));

  const badgeMap = new Map<string, string>();
  systemBadges.forEach((b) => badgeMap.set(b.id, b.name));

  const awardedStudentBadges = allStudentBadges.map((sb) => ({
    studentId: sb.studentId,
    studentName: studentNameMap.get(sb.studentId) || 'طالب',
    badgeId: sb.badgeId,
    badgeName: badgeMap.get(sb.badgeId) || sb.badgeId,
    awardedAt: sb.awardedAt || '',
    note: sb.note,
  }));

  const awardedTeacherBadges = allTeacherBadges.map((tb) => ({
    teacherId: tb.teacherId,
    teacherName: teacherNameMap.get(tb.teacherId) || 'معلم',
    badgeId: tb.badgeId,
    badgeName: badgeMap.get(tb.badgeId) || tb.badgeId,
    awardedAt: tb.awardedAt || '',
  }));

  // 4. Leaderboard (الأوائل) Calculation
  const leaderboard = schoolData.students
    .map((s) => {
      const streakInfo = getStudentStreakInfo(s.id, schoolId);
      const studentBadgesCount = allStudentBadges.filter((b) => b.studentId === s.id).length;
      const points = (streakInfo?.currentStreak || 1) * 20 + (studentBadgesCount * 50) + ((s as any).attendanceRate ? Math.round((s as any).attendanceRate * 2) : 100);
      return {
        studentId: s.id,
        studentName: s.name,
        className: s.className,
        points,
        streakDays: streakInfo?.currentStreak || 1,
        streakTitle: streakInfo?.streakTitle || 'المواظبة الأساسية',
        badgesCount: studentBadgesCount,
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 20)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  // 5. Admin Actions
  const adminActions = getAllAdminActions(schoolId).map((a) => ({
    id: a.id,
    studentId: a.studentId,
    studentName: a.studentName || studentNameMap.get(a.studentId) || 'طالب',
    actionType: a.actionType,
    title: a.title,
    reason: a.reason,
    date: a.createdAt || (a as any).date || '',
    status: a.status || 'نشط',
  }));

  // 6. Clean Directory
  const students = schoolData.students.map((s) => ({
    id: s.id,
    name: s.name,
    nationalId: s.nationalId,
    code: (s as any).code || s.id,
    className: s.className,
    gradeLevel: s.gradeLevel,
    status: s.status,
    attendanceRate: (s as any).attendanceRate,
    parentPhone: s.parentPhone,
    address: s.address,
    gender: s.gender,
    birthDate: s.birthDate,
  }));

  const teachers = schoolData.teachers.map((t) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    email: t.email,
    specialization: t.specialization,
    assignedClasses: t.assignedClasses,
    assignedSubjects: t.assignedSubjects,
    status: t.status,
  }));

  const classes = schoolData.classes.map((c) => ({
    id: c.id,
    name: c.name,
    gradeLevel: c.gradeLevel,
    roomNumber: c.roomNumber,
    capacity: c.capacity,
    studentCount: c.studentCount || (c as any).totalStudents,
    headTeacherName: c.headTeacherName,
  }));

  const grades = (schoolData.grades || []).map((g) => ({
    id: g.id,
    studentId: g.studentId,
    studentName: g.studentName,
    className: g.className,
    subjectName: g.subjectName,
    examName: g.examName,
    score: g.score,
    maxScore: g.maxScore,
    date: g.date,
  }));

  const behavior = (schoolData.behavior || []).map((b) => ({
    id: b.id,
    studentId: b.studentId,
    studentName: b.studentName,
    type: b.type,
    title: b.title,
    description: (b as any).description,
    date: b.date,
    reporterName: (b as any).reporterName,
  }));

  return {
    schoolName: schoolData.schoolName,
    schoolCode: schoolData.schoolCode,
    academicYear: schoolData.academicYear,
    principalName: schoolData.principalName,
    governorate: (schoolData as any).governorate,
    phone: schoolData.phone,
    email: schoolData.email,
    address: schoolData.address,
    licenseKey: schoolData.licenseKey,
    licenseExpiry: schoolData.licenseExpiry,
    subscription: (schoolData as any).subscription || 'بريميوم',

    stats: {
      totalStudents: schoolData.students.length,
      totalTeachers: schoolData.teachers.length,
      totalClasses: schoolData.classes.length,
      totalSubjects: schoolData.subjects.length,
      totalAnnouncements: schoolData.announcements.length,
      totalParents: schoolData.parents.length,
      totalAttendanceRecords: schoolData.attendance.length,
      totalGradesCount: grades.length,
      totalBehaviorRecords: behavior.length,
      totalCommunityGroups: groups.length,
      totalCalendarEvents: calendarTasks.length,
      totalBadgesAwarded: awardedStudentBadges.length + awardedTeacherBadges.length,
      totalAdminActions: adminActions.length,
    },

    students,
    teachers,
    classes,
    subjects: schoolData.subjects,
    parents: schoolData.parents,
    attendance: schoolData.attendance,
    grades,
    behavior,
    announcements: schoolData.announcements,

    settings: {
      schoolName: schoolData.schoolName,
      schoolCode: schoolData.schoolCode,
      academicYear: schoolData.academicYear,
      principalName: schoolData.principalName,
      phone: schoolData.phone,
      email: schoolData.email,
      address: schoolData.address,
      licenseKey: schoolData.licenseKey,
      licenseExpiry: schoolData.licenseExpiry,
      governorate: (schoolData as any).governorate,
      educationalDistrict: (schoolData as any).educationalDistrict,
    },

    extensions: extensions.map((ext) => ({
      id: ext.extensionId,
      name: ext.name,
      isEnabled: ext.isEnabled,
      settings: ext.settings,
    })),

    community: {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        description: g.description,
        isLocked: g.isLocked,
        membersCount: g.membersCount || 0,
      })),
      recentMessages,
      activePolls,
      events: communityEvents,
      mutes,
    },

    leaderboard,
    calendar: calendarTasks,

    badges: {
      availableBadges: systemBadges.map((b) => ({
        id: b.id,
        name: b.name,
        rarity: b.rarity,
        description: b.description,
      })),
      awardedStudentBadges,
      awardedTeacherBadges,
    },

    adminActions,
  };
}
