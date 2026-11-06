import { pgTable, text, integer, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  role: text('role').default('user'),
  schoolId: text('school_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_users_school').on(table.schoolId),
  index('idx_users_email').on(table.email),
]);

export const schoolInfoTable = pgTable('school_info', {
  schoolId: text('school_id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  licenseKey: text('license_key'),
  adminEmail: text('admin_email'),
  adminPassword: text('admin_password'),
  governorate: text('governorate'),
  educationalDistrict: text('educational_district'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  principalName: text('principal_name'),
  principalPhone: text('principal_phone'),
  principalEmail: text('principal_email'),
  academicYear: text('academic_year'),
  subscription: text('subscription').default('أساسي'),
  status: text('status').default('نشطة'),
  studentAuthMode: text('student_auth_mode').default('ministry_code'),
  licenseExpiry: text('license_expiry'),
  stage: text('stage'),
  attendanceStartDate: text('attendance_start_date'),
  enableThreeLateRule: boolean('enable_three_late_rule').default(true),
  studentsCount: integer('students_count').default(0),
  teachersCount: integer('teachers_count').default(0),
  logoUrl: text('logo_url'),
  createdAt: text('created_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('uq_school_code').on(table.code),
  index('idx_school_info_status').on(table.status),
]);

export const classesTable = pgTable('classes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  gradeLevel: text('grade_level').notNull(),
  capacity: integer('capacity').default(35),
  roomNumber: text('room_number'),
  advisorTeacherName: text('advisor_teacher_name'),
}, (table) => [
  index('idx_classes_school').on(table.schoolId),
  index('idx_classes_school_grade').on(table.schoolId, table.gradeLevel),
]);

export const studentsTable = pgTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  studentCode: text('student_code'),
  ministryCode: text('ministry_code'),
  nationalId: text('national_id'),
  classId: text('class_id'),
  className: text('class_name'),
  gradeLevel: text('grade_level'),
  birthDate: text('birth_date'),
  gender: text('gender'),
  status: text('status').default('منتظم'),
  parentName: text('parent_name'),
  parentPhone: text('parent_phone'),
  parentEmail: text('parent_email'),
  address: text('address'),
  joinDate: text('join_date'),
  avatar_layout_uid: text('avatar_layout_uid').default('theme_default_blue'),
}, (table) => [
  index('idx_students_school').on(table.schoolId),
  index('idx_students_class').on(table.classId),
  index('idx_students_school_class').on(table.schoolId, table.classId),
  uniqueIndex('uq_students_school_code').on(table.schoolId, table.studentCode),
  uniqueIndex('uq_students_school_ministry_code').on(table.schoolId, table.ministryCode),
  uniqueIndex('uq_students_school_national').on(table.schoolId, table.nationalId),
  index('idx_students_ministry_code').on(table.ministryCode),
  index('idx_students_national_id').on(table.nationalId),
  index('idx_students_parent_phone').on(table.parentPhone),
]);

export const teachersTable = pgTable('teachers', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  nationalId: text('national_id'),
  phone: text('phone'),
  email: text('email'),
  username: text('username'),
  password: text('password'),
  specialization: text('specialization'),
  status: text('status').default('نشط'),
  assignedClasses: jsonb('assigned_classes').$type<string[]>().default([]),
  assignedSubjects: jsonb('assigned_subjects').$type<string[]>().default([]),
  isAttendanceOfficer: boolean('is_attendance_officer').default(false),
  joinDate: text('join_date'),
}, (table) => [
  index('idx_teachers_school').on(table.schoolId),
  uniqueIndex('uq_teachers_school_username').on(table.schoolId, table.username),
  index('idx_teachers_school_phone').on(table.schoolId, table.phone),
  index('idx_teachers_school_national').on(table.schoolId, table.nationalId),
]);

export const calendarTasksTable = pgTable('calendar_tasks', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  priority: text('priority').default('medium'),
  status: text('status').default('pending'),
  assignedTo: text('assigned_to'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => [
  index('idx_calendar_tasks_school').on(table.schoolId),
  index('idx_calendar_tasks_school_date').on(table.schoolId, table.date),
]);

export const communityMessagesTable = pgTable('community_messages', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  communityId: text('community_id'),
  groupId: text('group_id'),
  gradeId: text('grade_id'),
  classId: text('class_id'),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(),
  senderAvatar: text('sender_avatar'),
  senderBadge: text('sender_badge'),
  type: text('type').default('text'),
  message: text('message'),
  content: text('content'),
  createdAt: text('created_at'),
  formattedTime: text('formatted_time'),
  isDeleted: boolean('is_deleted').default(false),
  pollData: jsonb('poll_data'),
  eventData: jsonb('event_data'),
  achievementData: jsonb('achievement_data'),
  replyTo: jsonb('reply_to'),
  reactions: jsonb('reactions'),
  isPinned: boolean('is_pinned').default(false),
  editedAt: text('edited_at'),
  deletedAt: text('deleted_at'),
  timestamp: text('timestamp'),
}, (table) => [
  index('idx_community_msg_scope').on(table.schoolId, table.communityId, table.createdAt),
  index('idx_community_msg_school').on(table.schoolId),
]);

export const communityMutesTable = pgTable('community_mutes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  communityId: text('community_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  mutedBy: text('muted_by').notNull(),
  mutedAt: text('muted_at').notNull(),
  reason: text('reason'),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_community_mutes_school').on(table.schoolId, table.communityId),
]);

export const communityLocksTable = pgTable('community_locks', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  communityId: text('community_id').notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  lockedBy: text('locked_by'),
  lockedAt: text('locked_at'),
  updatedAt: text('updated_at'),
}, (table) => [
  index('idx_community_locks_school').on(table.schoolId, table.communityId),
]);

export const attendanceSessionsTable = pgTable('attendance_sessions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  date: text('date').notNull(),
  completedAt: text('completed_at').notNull(),
  totalClassesCount: integer('total_classes_count').default(0),
  totalStudentsCount: integer('total_students_count').default(0),
  presentCount: integer('present_count').default(0),
  absentCount: integer('absent_count').default(0),
  lateCount: integer('late_count').default(0),
  durationMinutes: integer('duration_minutes').default(0),
  teacherName: text('teacher_name'),
}, (table) => [
  index('idx_attendance_sessions_school').on(table.schoolId),
  index('idx_attendance_sessions_school_date').on(table.schoolId, table.date),
]);

export const subjectsTable = pgTable('subjects', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  gradeLevels: jsonb('grade_levels').$type<string[]>().default([]),
  maxScore: integer('max_score').default(100),
  passScore: integer('pass_score').default(50),
  teacherNames: jsonb('teacher_names').$type<string[]>().default([]),
}, (table) => [
  index('idx_subjects_school').on(table.schoolId),
]);

export const attendanceTable = pgTable('attendance', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  classId: text('class_id'),
  className: text('class_name'),
  date: text('date').notNull(),
  status: text('status').notNull(), // حاضر / غائب / متأخر
  notes: text('notes'),
}, (table) => [
  index('idx_attendance_school').on(table.schoolId),
  index('idx_attendance_student').on(table.studentId),
  index('idx_attendance_school_date').on(table.schoolId, table.date),
  index('idx_attendance_school_class_date').on(table.schoolId, table.classId, table.date),
  index('idx_attendance_school_student_date').on(table.schoolId, table.studentId, table.date),
]);

export const gradesTable = pgTable('grades', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  classId: text('class_id'),
  className: text('class_name'),
  subjectId: text('subject_id'),
  subjectName: text('subject_name').notNull(),
  examName: text('exam_name').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').default(100),
  date: text('date'),
  notes: text('notes'),
}, (table) => [
  index('idx_grades_school').on(table.schoolId),
  index('idx_grades_student').on(table.studentId),
  index('idx_grades_school_student').on(table.schoolId, table.studentId),
]);

export const behaviorTable = pgTable('behavior', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  classId: text('class_id'),
  type: text('type').notNull(), // إيجابي / سلبي
  title: text('title').notNull(),
  points: integer('points').notNull(),
  date: text('date'),
  notes: text('notes'),
  reportedBy: text('reported_by'),
}, (table) => [
  index('idx_behavior_school').on(table.schoolId),
  index('idx_behavior_student').on(table.studentId),
  index('idx_behavior_school_student').on(table.schoolId, table.studentId),
]);

export const parentsTable = pgTable('parents', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  nationalId: text('national_id'),
  phone: text('phone'),
  email: text('email'),
  studentIds: jsonb('student_ids').$type<string[]>().default([]),
  relationship: text('relationship'),
  occupation: text('occupation'),
  address: text('address'),
}, (table) => [
  index('idx_parents_school').on(table.schoolId),
  index('idx_parents_phone').on(table.phone),
]);

export const announcementsTable = pgTable('announcements', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  type: text('type').default('general').notNull(), // 'general' | 'poll' | 'event'
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetAudience: text('target_audience').default('الجميع'),
  authorName: text('author_name'),
  date: text('date'),
  priority: text('priority').default('عادي'),
  important: boolean('important').default(false),
  // Poll-specific fields
  pollOptions: jsonb('poll_options').$type<{ id: string; text: string; votesCount: number }[]>().default([]),
  pollVotes: jsonb('poll_votes').$type<{ userId: string; userName?: string; userRole?: string; selectedOptionIds: string[]; votedAt: string }[]>().default([]),
  pollExpiresAt: text('poll_expires_at'),
  allowMultiple: boolean('allow_multiple').default(false),
  // Event-specific fields
  eventDate: text('event_date'),
  eventTime: text('event_time'),
  eventLocation: text('event_location'),
  eventOrganizer: text('event_organizer'),
  eventRsvps: jsonb('event_rsvps').$type<{ userId: string; userName: string; userRole: string; status: 'attending' | 'interested' | 'declined'; rsvpAt: string }[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_announcements_school').on(table.schoolId),
  index('idx_announcements_school_date').on(table.schoolId, table.date),
  index('idx_announcements_school_type').on(table.schoolId, table.type),
]);

export const homeworkTable = pgTable('homework', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id'),
  classId: text('class_id'),
  className: text('class_name'),
  subjectName: text('subject_name').notNull(),
  teacherName: text('teacher_name'),
  title: text('title').notNull(),
  description: text('description'),
  assignedDate: text('assigned_date'),
  dueDate: text('due_date'),
  status: text('status').default('قيد التنفيذ'),
}, (table) => [
  index('idx_homework_school').on(table.schoolId),
  index('idx_homework_class').on(table.classId),
  index('idx_homework_student').on(table.studentId),
  index('idx_homework_school_class').on(table.schoolId, table.classId),
]);

export const badgesTable = pgTable('badges', {
  id: text('id').primaryKey(),
  schoolId: text('school_id'),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  color: text('color').default('#D4AF37'),
  rarity: text('rarity').notNull().default('Mythical'),
  targetType: text('target_type').notNull().default('student'),
  isActive: boolean('is_active').default(true),
  hasAnimatedBorder: boolean('has_animated_border').default(true),
  limitType: text('limit_type').default('none'),
  maxQuantity: integer('max_quantity').default(0),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_badges_school').on(table.schoolId),
]);

export const studentBadgesTable = pgTable('student_badges', {
  id: text('id').primaryKey(),
  schoolId: text('school_id'),
  studentId: text('student_id').notNull(),
  badgeId: text('badge_id').notNull(),
  awardedBy: text('awarded_by').default('إدارة المدرسة'),
  awardedAt: text('awarded_at'),
  note: text('note'),
  isUnboxed: boolean('is_unboxed').default(false),
}, (table) => [
  index('idx_student_badges_student').on(table.studentId),
  index('idx_student_badges_school').on(table.schoolId),
  index('idx_student_badges_school_student').on(table.schoolId, table.studentId),
]);

export const teacherBadgesTable = pgTable('teacher_badges', {
  id: text('id').primaryKey(),
  schoolId: text('school_id'),
  teacherId: text('teacher_id').notNull(),
  badgeId: text('badge_id').notNull(),
  awardedBy: text('awarded_by').default('إدارة المدرسة'),
  awardedAt: text('awarded_at'),
  note: text('note'),
}, (table) => [
  index('idx_teacher_badges_teacher').on(table.teacherId),
  index('idx_teacher_badges_school').on(table.schoolId),
]);

export const smsLogsTable = pgTable('sms_logs', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id'),
  phone: text('phone').notNull(),
  message: text('message').notNull(),
  provider: text('provider').default('SMSMode'),
  status: text('status').notNull(), // 'تم التسليم' | 'فشل'
  providerMessageId: text('provider_message_id'),
  sentAt: text('sent_at').notNull(),
  error: text('error'),
}, (table) => [
  index('idx_sms_logs_school_sent_at').on(table.schoolId, table.sentAt),
]);

export const trustedDeviceSessionsTable = pgTable('trusted_device_sessions', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  userId: text('user_id').notNull(),
  userRole: text('user_role').notNull(),
  schoolId: text('school_id'),
  schoolName: text('school_name'),
  studentId: text('student_id'),
  studentName: text('student_name'),
  studentCode: text('student_code'),
  className: text('class_name'),
  userDisplayName: text('user_display_name').notNull(),
  avatarUid: text('avatar_uid'),
  tokenHash: text('token_hash').notNull(),
  deviceName: text('device_name').default('هذا الجهاز'),
  createdAt: text('created_at').notNull(),
  lastUsedAt: text('last_used_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  revokedAt: text('revoked_at'),
  metadata: jsonb('metadata'),
}, (table) => [
  index('idx_sessions_device').on(table.deviceId),
  index('idx_sessions_user').on(table.userId),
  index('idx_sessions_token_hash').on(table.tokenHash),
  index('idx_sessions_school').on(table.schoolId),
  index('idx_sessions_device_revoked').on(table.deviceId, table.revokedAt),
  index('idx_sessions_expires_at').on(table.expiresAt),
]);

export const adminActionsTable = pgTable('admin_actions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  className: text('class_name'),
  actionType: text('action_type').notNull(), // 'parent_summons' | 'temporary_suspension' | 'expulsion'
  title: text('title').notNull(),
  summonsDate: text('summons_date'),
  summonsTime: text('summons_time'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  reason: text('reason').notNull(),
  notes: text('notes'),
  status: text('status').default('نشط'),
  createdBy: text('created_by').default('إدارة المدرسة'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => [
  index('idx_admin_actions_school').on(table.schoolId),
  index('idx_admin_actions_student').on(table.studentId),
  index('idx_admin_actions_school_student').on(table.schoolId, table.studentId),
]);

export const smartSuspensionAlertsTable = pgTable('smart_suspension_alerts', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  studentCode: text('student_code').notNull(),
  grade: text('grade').notNull(),
  className: text('class_name').notNull(),
  attendanceStatus: text('attendance_status').notNull(), // 'حاضر' | 'متأخر'
  suspensionId: text('suspension_id').notNull(),
  suspensionStartDate: text('suspension_start_date').notNull(),
  suspensionEndDate: text('suspension_end_date').notNull(),
  suspensionReason: text('suspension_reason').notNull(),
  attendanceTeacherId: text('attendance_teacher_id'),
  attendanceTeacherName: text('attendance_teacher_name').notNull(),
  recordedTime: text('recorded_time').notNull(),
  recordedDate: text('recorded_date').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'resolved'
  resolvedAction: text('resolved_action'), // 'corrected_attendance' | 'ended_suspension' | 'ignored'
  resolvedBy: text('resolved_by'),
  resolvedAt: text('resolved_at'),
  ignoreReason: text('ignore_reason'),
  createdAt: text('created_at').notNull(),
  priority: text('priority').default('High'),
  color: text('color').default('orange'),
  persistent: boolean('persistent').default(true),
}, (table) => [
  index('idx_suspension_alerts_school').on(table.schoolId),
  index('idx_suspension_alerts_student').on(table.studentId),
  index('idx_suspension_alerts_school_status').on(table.schoolId, table.status),
]);

export const smartSuspensionAuditLogsTable = pgTable('smart_suspension_audit_logs', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  alertId: text('alert_id').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  teacherName: text('teacher_name').notNull(),
  adminName: text('admin_name').notNull(),
  actionTaken: text('action_taken').notNull(), // 'تصحيح الحضور' | 'إنهاء الإيقاف' | 'تجاهل مع سبب' | 'إنشاء التنبيه الآلي'
  timestamp: text('timestamp').notNull(),
  reason: text('reason'),
}, (table) => [
  index('idx_suspension_logs_school').on(table.schoolId),
  index('idx_suspension_logs_alert').on(table.alertId),
]);

export const supportTicketsTable = pgTable('support_tickets', {
  id: text('id').primaryKey(),
  ticketCode: text('ticket_code').notNull(),
  schoolId: text('school_id').notNull(),
  schoolName: text('school_name'),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  studentCode: text('student_code'),
  className: text('class_name'),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: text('status').default('جديدة').notNull(), // 'جديدة' | 'قيد المراجعة' | 'تم الرد' | 'مغلقة'
  createdAt: text('created_at').notNull(),
  createdDate: text('created_date').notNull(), // YYYY-MM-DD for fast daily quota check
  updatedAt: text('updated_at').notNull(),
  answeredAt: text('answered_at'),
  answeredBy: text('answered_by'),
}, (table) => [
  index('idx_tickets_school').on(table.schoolId),
  index('idx_tickets_student').on(table.studentId),
  index('idx_tickets_student_date').on(table.studentId, table.createdDate),
  index('idx_tickets_code').on(table.ticketCode),
]);

export const supportTicketRepliesTable = pgTable('support_ticket_replies', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull(),
  schoolId: text('school_id').notNull(),
  senderRole: text('sender_role').notNull(), // 'student' | 'owner' | 'school_admin'
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_ticket_replies_ticket').on(table.ticketId),
  index('idx_ticket_replies_school').on(table.schoolId),
]);

export const privateConversationsTable = pgTable('private_conversations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  participant1Id: text('participant_1_id').notNull(),
  participant1Role: text('participant_1_role').notNull(),
  participant1Name: text('participant_1_name').notNull(),
  participant1Details: text('participant_1_details'),
  participant2Id: text('participant_2_id').notNull(),
  participant2Role: text('participant_2_role').notNull(),
  participant2Name: text('participant_2_name').notNull(),
  participant2Details: text('participant_2_details'),
  lastMessageBody: text('last_message_body'),
  lastMessageSenderId: text('last_message_sender_id'),
  lastMessageAt: text('last_message_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_pconv_school').on(table.schoolId),
  index('idx_pconv_p1').on(table.participant1Id),
  index('idx_pconv_p2').on(table.participant2Id),
  index('idx_pconv_updated').on(table.updatedAt),
  uniqueIndex('uq_pconv_participants').on(table.schoolId, table.participant1Id, table.participant2Id),
]);

export const privateMessagesTable = pgTable('private_messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  schoolId: text('school_id').notNull(),
  senderId: text('sender_id').notNull(),
  senderRole: text('sender_role').notNull(),
  senderName: text('sender_name').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
  readAt: text('read_at'),
}, (table) => [
  index('idx_pmsg_conv').on(table.conversationId),
  index('idx_pmsg_school').on(table.schoolId),
  index('idx_pmsg_created').on(table.createdAt),
  index('idx_pmsg_unread').on(table.conversationId, table.senderId, table.readAt),
]);

export const systemExtensionsTable = pgTable('system_extensions', {
  id: text('id').primaryKey(), // e.g. 'student_features_control'
  name: text('name').notNull(),
  nameEn: text('name_en'),
  description: text('description').notNull(),
  icon: text('icon').notNull().default('SlidersHorizontal'),
  category: text('category').notNull().default('student'),
  defaultEnabled: boolean('default_enabled').default(true).notNull(),
  isSystemLocked: boolean('is_system_locked').default(false).notNull(),
  defaultSettings: jsonb('default_settings').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const schoolExtensionsTable = pgTable('school_extensions', {
  id: text('id').primaryKey(), // `${schoolId}_${extensionId}`
  schoolId: text('school_id').notNull(),
  extensionId: text('extension_id').notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  settings: jsonb('settings').$type<Record<string, any>>().default({}),
  activatedAt: timestamp('activated_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'),
}, (table) => [
  uniqueIndex('uq_school_extension').on(table.schoolId, table.extensionId),
  index('idx_school_extensions_school').on(table.schoolId),
  index('idx_school_extensions_lookup').on(table.schoolId, table.extensionId, table.isEnabled),
]);

export const infractionMemosTable = pgTable('infraction_memos', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  teacherId: text('teacher_id').notNull(),
  teacherName: text('teacher_name').notNull(),
  subjectName: text('subject_name'),
  date: text('date').notNull(),
  time: text('time'),
  students: jsonb('students').$type<Array<{
    studentId: string;
    studentName: string;
    classId?: string;
    className?: string;
    nationalId?: string;
    studentCode?: string;
  }>>().notNull(),
  reason: text('reason').notNull(),
  location: text('location').default('الفصل'),
  urgency: text('urgency').default('عادي'), // 'عادي' | 'عاجل' | 'طارئ'
  requestedAction: text('requested_action').default('اتخاذ اللازم'), // 'استدعاء ولي أمر' | 'طرد مؤقت' | 'اتخاذ اللازم'
  status: text('status').default('قيد المراجعة').notNull(), // 'قيد المراجعة' | 'تم استدعاء ولي أمر' | 'تم الفصل المؤقت' | 'تم الحفظ والتخطي'
  adminDecision: jsonb('admin_decision').$type<{
    actionType: 'parent_summons' | 'temporary_suspension' | 'skip';
    decisionNotes?: string;
    decisionDate: string;
    decidedBy: string;
    actionIds?: string[];
  }>(),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => [
  index('idx_infraction_memos_school').on(table.schoolId),
  index('idx_infraction_memos_teacher').on(table.schoolId, table.teacherId),
  index('idx_infraction_memos_status').on(table.schoolId, table.status),
]);




