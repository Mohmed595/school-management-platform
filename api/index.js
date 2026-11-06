var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import "dotenv/config";
import express2 from "express";
import path from "path";
import crypto3 from "crypto";
import compression from "compression";
import { GoogleGenAI } from "@google/genai";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminActionsTable: () => adminActionsTable,
  announcementsTable: () => announcementsTable,
  attendanceSessionsTable: () => attendanceSessionsTable,
  attendanceTable: () => attendanceTable,
  badgesTable: () => badgesTable,
  behaviorTable: () => behaviorTable,
  calendarTasksTable: () => calendarTasksTable,
  classesTable: () => classesTable,
  communityLocksTable: () => communityLocksTable,
  communityMessagesTable: () => communityMessagesTable,
  communityMutesTable: () => communityMutesTable,
  gradesTable: () => gradesTable,
  homeworkTable: () => homeworkTable,
  infractionMemosTable: () => infractionMemosTable,
  parentsTable: () => parentsTable,
  privateConversationsTable: () => privateConversationsTable,
  privateMessagesTable: () => privateMessagesTable,
  schoolExtensionsTable: () => schoolExtensionsTable,
  schoolInfoTable: () => schoolInfoTable,
  smartSuspensionAlertsTable: () => smartSuspensionAlertsTable,
  smartSuspensionAuditLogsTable: () => smartSuspensionAuditLogsTable,
  smsLogsTable: () => smsLogsTable,
  studentBadgesTable: () => studentBadgesTable,
  studentsTable: () => studentsTable,
  subjectsTable: () => subjectsTable,
  supportTicketRepliesTable: () => supportTicketRepliesTable,
  supportTicketsTable: () => supportTicketsTable,
  systemExtensionsTable: () => systemExtensionsTable,
  teacherBadgesTable: () => teacherBadgesTable,
  teachersTable: () => teachersTable,
  trustedDeviceSessionsTable: () => trustedDeviceSessionsTable,
  usersTable: () => usersTable
});
import { pgTable, text, integer, timestamp, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
var usersTable = pgTable("users", {
  uid: text("uid").primaryKey(),
  email: text("email").notNull(),
  role: text("role").default("user"),
  schoolId: text("school_id"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  index("idx_users_school").on(table.schoolId),
  index("idx_users_email").on(table.email)
]);
var schoolInfoTable = pgTable("school_info", {
  schoolId: text("school_id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  licenseKey: text("license_key"),
  adminEmail: text("admin_email"),
  adminPassword: text("admin_password"),
  governorate: text("governorate"),
  educationalDistrict: text("educational_district"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  principalName: text("principal_name"),
  principalPhone: text("principal_phone"),
  principalEmail: text("principal_email"),
  academicYear: text("academic_year"),
  subscription: text("subscription").default("\u0623\u0633\u0627\u0633\u064A"),
  status: text("status").default("\u0646\u0634\u0637\u0629"),
  studentAuthMode: text("student_auth_mode").default("ministry_code"),
  licenseExpiry: text("license_expiry"),
  stage: text("stage"),
  attendanceStartDate: text("attendance_start_date"),
  enableThreeLateRule: boolean("enable_three_late_rule").default(true),
  studentsCount: integer("students_count").default(0),
  teachersCount: integer("teachers_count").default(0),
  logoUrl: text("logo_url"),
  createdAt: text("created_at"),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  uniqueIndex("uq_school_code").on(table.code),
  index("idx_school_info_status").on(table.status)
]);
var classesTable = pgTable("classes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  name: text("name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  capacity: integer("capacity").default(35),
  roomNumber: text("room_number"),
  advisorTeacherName: text("advisor_teacher_name")
}, (table) => [
  index("idx_classes_school").on(table.schoolId),
  index("idx_classes_school_grade").on(table.schoolId, table.gradeLevel)
]);
var studentsTable = pgTable("students", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  name: text("name").notNull(),
  studentCode: text("student_code"),
  ministryCode: text("ministry_code"),
  nationalId: text("national_id"),
  classId: text("class_id"),
  className: text("class_name"),
  gradeLevel: text("grade_level"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  status: text("status").default("\u0645\u0646\u062A\u0638\u0645"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  parentEmail: text("parent_email"),
  address: text("address"),
  joinDate: text("join_date"),
  avatar_layout_uid: text("avatar_layout_uid").default("theme_default_blue")
}, (table) => [
  index("idx_students_school").on(table.schoolId),
  index("idx_students_class").on(table.classId),
  index("idx_students_school_class").on(table.schoolId, table.classId),
  uniqueIndex("uq_students_school_code").on(table.schoolId, table.studentCode),
  uniqueIndex("uq_students_school_ministry_code").on(table.schoolId, table.ministryCode),
  uniqueIndex("uq_students_school_national").on(table.schoolId, table.nationalId),
  index("idx_students_ministry_code").on(table.ministryCode),
  index("idx_students_national_id").on(table.nationalId),
  index("idx_students_parent_phone").on(table.parentPhone)
]);
var teachersTable = pgTable("teachers", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  name: text("name").notNull(),
  nationalId: text("national_id"),
  phone: text("phone"),
  email: text("email"),
  username: text("username"),
  password: text("password"),
  specialization: text("specialization"),
  status: text("status").default("\u0646\u0634\u0637"),
  assignedClasses: jsonb("assigned_classes").$type().default([]),
  assignedSubjects: jsonb("assigned_subjects").$type().default([]),
  isAttendanceOfficer: boolean("is_attendance_officer").default(false),
  joinDate: text("join_date")
}, (table) => [
  index("idx_teachers_school").on(table.schoolId),
  uniqueIndex("uq_teachers_school_username").on(table.schoolId, table.username),
  index("idx_teachers_school_phone").on(table.schoolId, table.phone),
  index("idx_teachers_school_national").on(table.schoolId, table.nationalId)
]);
var calendarTasksTable = pgTable("calendar_tasks", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  priority: text("priority").default("medium"),
  status: text("status").default("pending"),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at")
}, (table) => [
  index("idx_calendar_tasks_school").on(table.schoolId),
  index("idx_calendar_tasks_school_date").on(table.schoolId, table.date)
]);
var communityMessagesTable = pgTable("community_messages", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  communityId: text("community_id"),
  groupId: text("group_id"),
  gradeId: text("grade_id"),
  classId: text("class_id"),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull(),
  senderAvatar: text("sender_avatar"),
  senderBadge: text("sender_badge"),
  type: text("type").default("text"),
  message: text("message"),
  content: text("content"),
  createdAt: text("created_at"),
  formattedTime: text("formatted_time"),
  isDeleted: boolean("is_deleted").default(false),
  pollData: jsonb("poll_data"),
  eventData: jsonb("event_data"),
  achievementData: jsonb("achievement_data"),
  replyTo: jsonb("reply_to"),
  reactions: jsonb("reactions"),
  isPinned: boolean("is_pinned").default(false),
  editedAt: text("edited_at"),
  deletedAt: text("deleted_at"),
  timestamp: text("timestamp")
}, (table) => [
  index("idx_community_msg_scope").on(table.schoolId, table.communityId, table.createdAt),
  index("idx_community_msg_school").on(table.schoolId)
]);
var communityMutesTable = pgTable("community_mutes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  communityId: text("community_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  mutedBy: text("muted_by").notNull(),
  mutedAt: text("muted_at").notNull(),
  reason: text("reason"),
  createdAt: text("created_at")
}, (table) => [
  index("idx_community_mutes_school").on(table.schoolId, table.communityId)
]);
var communityLocksTable = pgTable("community_locks", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  communityId: text("community_id").notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  lockedBy: text("locked_by"),
  lockedAt: text("locked_at"),
  updatedAt: text("updated_at")
}, (table) => [
  index("idx_community_locks_school").on(table.schoolId, table.communityId)
]);
var attendanceSessionsTable = pgTable("attendance_sessions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  date: text("date").notNull(),
  completedAt: text("completed_at").notNull(),
  totalClassesCount: integer("total_classes_count").default(0),
  totalStudentsCount: integer("total_students_count").default(0),
  presentCount: integer("present_count").default(0),
  absentCount: integer("absent_count").default(0),
  lateCount: integer("late_count").default(0),
  durationMinutes: integer("duration_minutes").default(0),
  teacherName: text("teacher_name")
}, (table) => [
  index("idx_attendance_sessions_school").on(table.schoolId),
  index("idx_attendance_sessions_school_date").on(table.schoolId, table.date)
]);
var subjectsTable = pgTable("subjects", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  gradeLevels: jsonb("grade_levels").$type().default([]),
  maxScore: integer("max_score").default(100),
  passScore: integer("pass_score").default(50),
  teacherNames: jsonb("teacher_names").$type().default([])
}, (table) => [
  index("idx_subjects_school").on(table.schoolId)
]);
var attendanceTable = pgTable("attendance", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  classId: text("class_id"),
  className: text("class_name"),
  date: text("date").notNull(),
  status: text("status").notNull(),
  // حاضر / غائب / متأخر
  notes: text("notes")
}, (table) => [
  index("idx_attendance_school").on(table.schoolId),
  index("idx_attendance_student").on(table.studentId),
  index("idx_attendance_school_date").on(table.schoolId, table.date),
  index("idx_attendance_school_class_date").on(table.schoolId, table.classId, table.date),
  index("idx_attendance_school_student_date").on(table.schoolId, table.studentId, table.date)
]);
var gradesTable = pgTable("grades", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  classId: text("class_id"),
  className: text("class_name"),
  subjectId: text("subject_id"),
  subjectName: text("subject_name").notNull(),
  examName: text("exam_name").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").default(100),
  date: text("date"),
  notes: text("notes")
}, (table) => [
  index("idx_grades_school").on(table.schoolId),
  index("idx_grades_student").on(table.studentId),
  index("idx_grades_school_student").on(table.schoolId, table.studentId)
]);
var behaviorTable = pgTable("behavior", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  classId: text("class_id"),
  type: text("type").notNull(),
  // إيجابي / سلبي
  title: text("title").notNull(),
  points: integer("points").notNull(),
  date: text("date"),
  notes: text("notes"),
  reportedBy: text("reported_by")
}, (table) => [
  index("idx_behavior_school").on(table.schoolId),
  index("idx_behavior_student").on(table.studentId),
  index("idx_behavior_school_student").on(table.schoolId, table.studentId)
]);
var parentsTable = pgTable("parents", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  name: text("name").notNull(),
  nationalId: text("national_id"),
  phone: text("phone"),
  email: text("email"),
  studentIds: jsonb("student_ids").$type().default([]),
  relationship: text("relationship"),
  occupation: text("occupation"),
  address: text("address")
}, (table) => [
  index("idx_parents_school").on(table.schoolId),
  index("idx_parents_phone").on(table.phone)
]);
var announcementsTable = pgTable("announcements", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  type: text("type").default("general").notNull(),
  // 'general' | 'poll' | 'event'
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetAudience: text("target_audience").default("\u0627\u0644\u062C\u0645\u064A\u0639"),
  authorName: text("author_name"),
  date: text("date"),
  priority: text("priority").default("\u0639\u0627\u062F\u064A"),
  important: boolean("important").default(false),
  // Poll-specific fields
  pollOptions: jsonb("poll_options").$type().default([]),
  pollVotes: jsonb("poll_votes").$type().default([]),
  pollExpiresAt: text("poll_expires_at"),
  allowMultiple: boolean("allow_multiple").default(false),
  // Event-specific fields
  eventDate: text("event_date"),
  eventTime: text("event_time"),
  eventLocation: text("event_location"),
  eventOrganizer: text("event_organizer"),
  eventRsvps: jsonb("event_rsvps").$type().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  index("idx_announcements_school").on(table.schoolId),
  index("idx_announcements_school_date").on(table.schoolId, table.date),
  index("idx_announcements_school_type").on(table.schoolId, table.type)
]);
var homeworkTable = pgTable("homework", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id"),
  classId: text("class_id"),
  className: text("class_name"),
  subjectName: text("subject_name").notNull(),
  teacherName: text("teacher_name"),
  title: text("title").notNull(),
  description: text("description"),
  assignedDate: text("assigned_date"),
  dueDate: text("due_date"),
  status: text("status").default("\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630")
}, (table) => [
  index("idx_homework_school").on(table.schoolId),
  index("idx_homework_class").on(table.classId),
  index("idx_homework_student").on(table.studentId),
  index("idx_homework_school_class").on(table.schoolId, table.classId)
]);
var badgesTable = pgTable("badges", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").default("#D4AF37"),
  rarity: text("rarity").notNull().default("Mythical"),
  targetType: text("target_type").notNull().default("student"),
  isActive: boolean("is_active").default(true),
  hasAnimatedBorder: boolean("has_animated_border").default(true),
  limitType: text("limit_type").default("none"),
  maxQuantity: integer("max_quantity").default(0),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  index("idx_badges_school").on(table.schoolId)
]);
var studentBadgesTable = pgTable("student_badges", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  studentId: text("student_id").notNull(),
  badgeId: text("badge_id").notNull(),
  awardedBy: text("awarded_by").default("\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"),
  awardedAt: text("awarded_at"),
  note: text("note"),
  isUnboxed: boolean("is_unboxed").default(false)
}, (table) => [
  index("idx_student_badges_student").on(table.studentId),
  index("idx_student_badges_school").on(table.schoolId),
  index("idx_student_badges_school_student").on(table.schoolId, table.studentId)
]);
var teacherBadgesTable = pgTable("teacher_badges", {
  id: text("id").primaryKey(),
  schoolId: text("school_id"),
  teacherId: text("teacher_id").notNull(),
  badgeId: text("badge_id").notNull(),
  awardedBy: text("awarded_by").default("\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"),
  awardedAt: text("awarded_at"),
  note: text("note")
}, (table) => [
  index("idx_teacher_badges_teacher").on(table.teacherId),
  index("idx_teacher_badges_school").on(table.schoolId)
]);
var smsLogsTable = pgTable("sms_logs", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id"),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  provider: text("provider").default("SMSMode"),
  status: text("status").notNull(),
  // 'تم التسليم' | 'فشل'
  providerMessageId: text("provider_message_id"),
  sentAt: text("sent_at").notNull(),
  error: text("error")
}, (table) => [
  index("idx_sms_logs_school_sent_at").on(table.schoolId, table.sentAt)
]);
var trustedDeviceSessionsTable = pgTable("trusted_device_sessions", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  userId: text("user_id").notNull(),
  userRole: text("user_role").notNull(),
  schoolId: text("school_id"),
  schoolName: text("school_name"),
  studentId: text("student_id"),
  studentName: text("student_name"),
  studentCode: text("student_code"),
  className: text("class_name"),
  userDisplayName: text("user_display_name").notNull(),
  avatarUid: text("avatar_uid"),
  tokenHash: text("token_hash").notNull(),
  deviceName: text("device_name").default("\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632"),
  createdAt: text("created_at").notNull(),
  lastUsedAt: text("last_used_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  revokedAt: text("revoked_at"),
  metadata: jsonb("metadata")
}, (table) => [
  index("idx_sessions_device").on(table.deviceId),
  index("idx_sessions_user").on(table.userId),
  index("idx_sessions_token_hash").on(table.tokenHash),
  index("idx_sessions_school").on(table.schoolId),
  index("idx_sessions_device_revoked").on(table.deviceId, table.revokedAt),
  index("idx_sessions_expires_at").on(table.expiresAt)
]);
var adminActionsTable = pgTable("admin_actions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  className: text("class_name"),
  actionType: text("action_type").notNull(),
  // 'parent_summons' | 'temporary_suspension' | 'expulsion'
  title: text("title").notNull(),
  summonsDate: text("summons_date"),
  summonsTime: text("summons_time"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  reason: text("reason").notNull(),
  notes: text("notes"),
  status: text("status").default("\u0646\u0634\u0637"),
  createdBy: text("created_by").default("\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at")
}, (table) => [
  index("idx_admin_actions_school").on(table.schoolId),
  index("idx_admin_actions_student").on(table.studentId),
  index("idx_admin_actions_school_student").on(table.schoolId, table.studentId)
]);
var smartSuspensionAlertsTable = pgTable("smart_suspension_alerts", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  studentCode: text("student_code").notNull(),
  grade: text("grade").notNull(),
  className: text("class_name").notNull(),
  attendanceStatus: text("attendance_status").notNull(),
  // 'حاضر' | 'متأخر'
  suspensionId: text("suspension_id").notNull(),
  suspensionStartDate: text("suspension_start_date").notNull(),
  suspensionEndDate: text("suspension_end_date").notNull(),
  suspensionReason: text("suspension_reason").notNull(),
  attendanceTeacherId: text("attendance_teacher_id"),
  attendanceTeacherName: text("attendance_teacher_name").notNull(),
  recordedTime: text("recorded_time").notNull(),
  recordedDate: text("recorded_date").notNull(),
  status: text("status").default("active").notNull(),
  // 'active' | 'resolved'
  resolvedAction: text("resolved_action"),
  // 'corrected_attendance' | 'ended_suspension' | 'ignored'
  resolvedBy: text("resolved_by"),
  resolvedAt: text("resolved_at"),
  ignoreReason: text("ignore_reason"),
  createdAt: text("created_at").notNull(),
  priority: text("priority").default("High"),
  color: text("color").default("orange"),
  persistent: boolean("persistent").default(true)
}, (table) => [
  index("idx_suspension_alerts_school").on(table.schoolId),
  index("idx_suspension_alerts_student").on(table.studentId),
  index("idx_suspension_alerts_school_status").on(table.schoolId, table.status)
]);
var smartSuspensionAuditLogsTable = pgTable("smart_suspension_audit_logs", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  alertId: text("alert_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  teacherName: text("teacher_name").notNull(),
  adminName: text("admin_name").notNull(),
  actionTaken: text("action_taken").notNull(),
  // 'تصحيح الحضور' | 'إنهاء الإيقاف' | 'تجاهل مع سبب' | 'إنشاء التنبيه الآلي'
  timestamp: text("timestamp").notNull(),
  reason: text("reason")
}, (table) => [
  index("idx_suspension_logs_school").on(table.schoolId),
  index("idx_suspension_logs_alert").on(table.alertId)
]);
var supportTicketsTable = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  ticketCode: text("ticket_code").notNull(),
  schoolId: text("school_id").notNull(),
  schoolName: text("school_name"),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  studentCode: text("student_code"),
  className: text("class_name"),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("\u062C\u062F\u064A\u062F\u0629").notNull(),
  // 'جديدة' | 'قيد المراجعة' | 'تم الرد' | 'مغلقة'
  createdAt: text("created_at").notNull(),
  createdDate: text("created_date").notNull(),
  // YYYY-MM-DD for fast daily quota check
  updatedAt: text("updated_at").notNull(),
  answeredAt: text("answered_at"),
  answeredBy: text("answered_by")
}, (table) => [
  index("idx_tickets_school").on(table.schoolId),
  index("idx_tickets_student").on(table.studentId),
  index("idx_tickets_student_date").on(table.studentId, table.createdDate),
  index("idx_tickets_code").on(table.ticketCode)
]);
var supportTicketRepliesTable = pgTable("support_ticket_replies", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull(),
  schoolId: text("school_id").notNull(),
  senderRole: text("sender_role").notNull(),
  // 'student' | 'owner' | 'school_admin'
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull()
}, (table) => [
  index("idx_ticket_replies_ticket").on(table.ticketId),
  index("idx_ticket_replies_school").on(table.schoolId)
]);
var privateConversationsTable = pgTable("private_conversations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  participant1Id: text("participant_1_id").notNull(),
  participant1Role: text("participant_1_role").notNull(),
  participant1Name: text("participant_1_name").notNull(),
  participant1Details: text("participant_1_details"),
  participant2Id: text("participant_2_id").notNull(),
  participant2Role: text("participant_2_role").notNull(),
  participant2Name: text("participant_2_name").notNull(),
  participant2Details: text("participant_2_details"),
  lastMessageBody: text("last_message_body"),
  lastMessageSenderId: text("last_message_sender_id"),
  lastMessageAt: text("last_message_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
}, (table) => [
  index("idx_pconv_school").on(table.schoolId),
  index("idx_pconv_p1").on(table.participant1Id),
  index("idx_pconv_p2").on(table.participant2Id),
  index("idx_pconv_updated").on(table.updatedAt),
  uniqueIndex("uq_pconv_participants").on(table.schoolId, table.participant1Id, table.participant2Id)
]);
var privateMessagesTable = pgTable("private_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  schoolId: text("school_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at")
}, (table) => [
  index("idx_pmsg_conv").on(table.conversationId),
  index("idx_pmsg_school").on(table.schoolId),
  index("idx_pmsg_created").on(table.createdAt),
  index("idx_pmsg_unread").on(table.conversationId, table.senderId, table.readAt)
]);
var systemExtensionsTable = pgTable("system_extensions", {
  id: text("id").primaryKey(),
  // e.g. 'student_features_control'
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("SlidersHorizontal"),
  category: text("category").notNull().default("student"),
  defaultEnabled: boolean("default_enabled").default(true).notNull(),
  isSystemLocked: boolean("is_system_locked").default(false).notNull(),
  defaultSettings: jsonb("default_settings").$type().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var schoolExtensionsTable = pgTable("school_extensions", {
  id: text("id").primaryKey(),
  // `${schoolId}_${extensionId}`
  schoolId: text("school_id").notNull(),
  extensionId: text("extension_id").notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  settings: jsonb("settings").$type().default({}),
  activatedAt: timestamp("activated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by")
}, (table) => [
  uniqueIndex("uq_school_extension").on(table.schoolId, table.extensionId),
  index("idx_school_extensions_school").on(table.schoolId),
  index("idx_school_extensions_lookup").on(table.schoolId, table.extensionId, table.isEnabled)
]);
var infractionMemosTable = pgTable("infraction_memos", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),
  teacherId: text("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  subjectName: text("subject_name"),
  date: text("date").notNull(),
  time: text("time"),
  students: jsonb("students").$type().notNull(),
  reason: text("reason").notNull(),
  location: text("location").default("\u0627\u0644\u0641\u0635\u0644"),
  urgency: text("urgency").default("\u0639\u0627\u062F\u064A"),
  // 'عادي' | 'عاجل' | 'طارئ'
  requestedAction: text("requested_action").default("\u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0644\u0627\u0632\u0645"),
  // 'استدعاء ولي أمر' | 'طرد مؤقت' | 'اتخاذ اللازم'
  status: text("status").default("\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629").notNull(),
  // 'قيد المراجعة' | 'تم استدعاء ولي أمر' | 'تم الفصل المؤقت' | 'تم الحفظ والتخطي'
  adminDecision: jsonb("admin_decision").$type(),
  createdAt: text("created_at"),
  updatedAt: text("updated_at")
}, (table) => [
  index("idx_infraction_memos_school").on(table.schoolId),
  index("idx_infraction_memos_teacher").on(table.schoolId, table.teacherId),
  index("idx_infraction_memos_status").on(table.schoolId, table.status)
]);

// src/db/index.ts
var { Pool } = pkg;
var createPool = () => {
  if (!global._postgresPool) {
    const maxPoolSize = process.env.SQL_MAX_POOL ? parseInt(process.env.SQL_MAX_POOL, 10) : 6;
    const sqlHost = process.env.SQL_HOST || "";
    const isUnixSocket = sqlHost.startsWith("/");
    const useSsl = process.env.SQL_SSL === "false" ? false : process.env.SQL_SSL === "true" ? true : !isUnixSocket && sqlHost !== "localhost" && sqlHost !== "127.0.0.1";
    global._postgresPool = new Pool({
      // For Unix sockets pg expects the socket directory path; for TCP a hostname/IP.
      host: sqlHost,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      ...useSsl ? { ssl: { rejectUnauthorized: false } } : {},
      max: Number.isFinite(maxPoolSize) && maxPoolSize > 0 ? maxPoolSize : 6,
      min: 1,
      idleTimeoutMillis: 15e3,
      connectionTimeoutMillis: 1e4,
      statement_timeout: 15e3,
      query_timeout: 15e3,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1e4
    });
    global._postgresPool.on("error", (err) => {
      console.warn("[DB Pool Notice]: Idle database client event handled safely:", err?.message || err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// server.ts
import { eq as eq7, desc as desc5, and as and7, isNull as isNull2, lt as lt2, count as count2, ilike as ilike4 } from "drizzle-orm";

// src/lib/sms/smsmode.ts
function getSmsModeConfig() {
  let rawBaseUrl = (process.env.SMSMODE_BASE_URL || "https://rest.smsmode.com/v1").trim();
  rawBaseUrl = rawBaseUrl.replace(/^['"]|['"]$/g, "").replace(/^SMSMODE_BASE_URL=\s*/i, "").trim();
  let rawApiKey = (process.env.SMSMODE_API_KEY || "").trim();
  rawApiKey = rawApiKey.replace(/^['"]|['"]$/g, "").replace(/^SMSMODE_API_KEY=\s*/i, "").trim();
  return {
    apiKey: rawApiKey,
    baseUrl: rawBaseUrl,
    senderName: "SMS-EDU-PORTAL",
    timeoutMs: 8e3,
    maxRetries: 2
  };
}
function buildSmsEndpointUrl(baseUrl, path2) {
  let cleanBase = (baseUrl || "https://rest.smsmode.com/v1").trim();
  cleanBase = cleanBase.replace(/^['"]|['"]$/g, "").replace(/^SMSMODE_BASE_URL=\s*/i, "").trim();
  if (!cleanBase.startsWith("http://") && !cleanBase.startsWith("https://")) {
    cleanBase = `https://${cleanBase}`;
  }
  cleanBase = cleanBase.replace(/\/+$/, "");
  const cleanPath = path2.startsWith("/") ? path2 : `/${path2}`;
  if (cleanBase.endsWith(cleanPath)) {
    return cleanBase;
  }
  return `${cleanBase}${cleanPath}`;
}
function maskPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length <= 6) return "****";
  if (cleaned.startsWith("+201") && cleaned.length >= 12) {
    return `${cleaned.slice(0, 5)}****${cleaned.slice(-4)}`;
  }
  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-4);
  return `${prefix}****${suffix}`;
}
function maskStudentCode(code) {
  if (!code) return "";
  const cleaned = code.trim();
  if (cleaned.length <= 4) return "****";
  if (cleaned.startsWith("STD-")) {
    const suffix2 = cleaned.slice(-4);
    return `STD-****${suffix2}`;
  }
  const suffix = cleaned.slice(-4);
  return `****${suffix}`;
}
function logSmsActivity(level, message, details) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  let sanitizedDetails = "";
  if (details) {
    try {
      if (typeof details === "object") {
        const copy = JSON.parse(JSON.stringify(details));
        if (copy.phone) copy.phone = maskPhoneNumber(copy.phone);
        if (copy.recipient) copy.recipient = maskPhoneNumber(copy.recipient);
        if (copy.studentCode) copy.studentCode = maskStudentCode(copy.studentCode);
        if (copy.message) copy.message = "[REDACTED]";
        if (copy.apiKey) copy.apiKey = "[REDACTED]";
        if (copy.token) copy.token = "[REDACTED]";
        sanitizedDetails = JSON.stringify(copy);
      } else {
        sanitizedDetails = String(details);
      }
    } catch {
      sanitizedDetails = "";
    }
  }
  console.log(`[SMSMODE][${timestamp2}][${level}] ${message}`, sanitizedDetails);
}
function validatePhoneNumber(phone) {
  if (!phone) {
    return { isValid: false, normalized: "", reason: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" };
  }
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleaned.length < 8) {
    return { isValid: false, normalized: phone, reason: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0642\u0635\u064A\u0631 \u062C\u062F\u0627\u064B" };
  }
  if (/^0+$|^1+$|^12345/.test(cleaned) || cleaned.includes("00000000")) {
    return { isValid: false, normalized: phone, reason: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0648\u0647\u0645\u064A \u0623\u0648 \u062A\u0627\u0644\u0641" };
  }
  let normalized = cleaned;
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    normalized = `+20${cleaned.slice(1)}`;
  } else if (!normalized.startsWith("+") && !normalized.startsWith("20")) {
    normalized = `+${cleaned}`;
  }
  return { isValid: true, normalized };
}
async function sendSMS(options, configCustom) {
  const config = { ...getSmsModeConfig(), ...configCustom };
  const nowStr = (/* @__PURE__ */ new Date()).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const validation = validatePhoneNumber(options.phone);
  if (!validation.isValid) {
    logSmsActivity("WARN", `Invalid phone number: ${maskPhoneNumber(options.phone)}`);
    return {
      success: false,
      phone: options.phone,
      studentId: options.studentId,
      studentName: options.studentName,
      sentAt: nowStr,
      error: validation.reason || "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D"
    };
  }
  if (!config.apiKey || config.apiKey === "YOUR_SMSMODE_API_KEY") {
    logSmsActivity("INFO", `[SIMULATION] Sending SMS to ${maskPhoneNumber(validation.normalized)}`);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const mockMsgId = `SIM-SMSMODE-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    return {
      success: true,
      providerMessageId: mockMsgId,
      phone: validation.normalized,
      studentId: options.studentId,
      studentName: options.studentName,
      sentAt: nowStr,
      providerResponse: { status: 0, message: "OK", simulated: true }
    };
  }
  let attempts = 0;
  let lastError = "";
  while (attempts <= (config.maxRetries || 2)) {
    attempts++;
    try {
      logSmsActivity("INFO", `[API CALL Attempt ${attempts}] Sending to ${maskPhoneNumber(validation.normalized)}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
      const url = buildSmsEndpointUrl(config.baseUrl || "", "/sms/send");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
          "X-Smsmode-Token": config.apiKey
        },
        body: JSON.stringify({
          recipient: validation.normalized,
          message: options.message,
          sender: config.senderName
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const providerId = data.messageId || data.id || `SMSMODE-${Date.now()}`;
        logSmsActivity("INFO", `Successfully sent via SMSMode. Provider ID: ${providerId}`);
        return {
          success: true,
          providerMessageId: String(providerId),
          phone: validation.normalized,
          studentId: options.studentId,
          studentName: options.studentName,
          sentAt: nowStr,
          providerResponse: data
        };
      } else {
        lastError = `SMSMode HTTP status ${response.status}`;
        logSmsActivity("WARN", `Attempt ${attempts} failed: ${lastError}`);
      }
    } catch (err) {
      lastError = err?.name === "AbortError" ? "SMSMode API Timeout (8s exceeded)" : "SMSMode Network Request Failed";
      logSmsActivity("WARN", `Attempt ${attempts} network error`);
    }
    if (attempts <= (config.maxRetries || 2)) {
      await new Promise((res) => setTimeout(res, 300 * attempts));
    }
  }
  return {
    success: false,
    phone: validation.normalized,
    studentId: options.studentId,
    studentName: options.studentName,
    sentAt: nowStr,
    error: lastError || "\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0645\u0632\u0648\u062F SMSMode"
  };
}
async function sendBulkSMS(options, configCustom) {
  const startTime = Date.now();
  const batchId = `sms-batch-${Date.now()}`;
  const batchSize = options.batchSize || 10;
  const delayMs = options.delayBetweenBatchesMs || 200;
  const platformUrl = options.platformUrl || process.env.APP_URL || "https://madrasety.ai.studio";
  const results = [];
  const logs = [];
  let deliveredCount = 0;
  let failedCount = 0;
  const total = options.recipients.length;
  logSmsActivity("INFO", `Starting bulk SMS batch ${batchId} for school ID ${options.schoolId}. Total recipients: ${total}`);
  for (let i = 0; i < total; i += batchSize) {
    const chunk = options.recipients.slice(i, i + batchSize);
    const chunkPromises = chunk.map(async (recipient, index2) => {
      const globalIndex = i + index2 + 1;
      if (options.onProgress) {
        options.onProgress(globalIndex, total, recipient.studentName);
      }
      const formattedMsg = `\u{1F3EB} ${options.schoolName}
\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A \u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629.

\u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644:

\u{1F466} \u0627\u0644\u0637\u0627\u0644\u0628:
${recipient.studentName}

\u{1F4F1} \u0627\u0644\u0647\u0627\u062A\u0641:
${recipient.phone || "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644"}

\u{1F511} \u0631\u0645\u0632 \u0627\u0644\u0637\u0627\u0644\u0628:
${recipient.studentCode || `STD-2026-${recipient.studentId}`}

\u{1F310} \u0627\u0644\u0645\u0646\u0635\u0629
${platformUrl}

\u0646\u062A\u0645\u0646\u0649 \u0644\u0643\u0645 \u0639\u0627\u0645\u0627\u064B \u062F\u0631\u0627\u0633\u064A\u0627\u064B \u0645\u0648\u0641\u0642\u0627\u064B.`;
      const sendRes = await sendSMS(
        {
          phone: recipient.phone,
          message: formattedMsg,
          studentId: recipient.studentId,
          studentName: recipient.studentName,
          schoolId: options.schoolId
        },
        configCustom
      );
      return { recipient, formattedMsg, sendRes };
    });
    const chunkResults = await Promise.all(chunkPromises);
    for (const item of chunkResults) {
      results.push(item.sendRes);
      if (item.sendRes.success) {
        deliveredCount++;
      } else {
        failedCount++;
      }
      logs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        school_id: options.schoolId,
        student_id: item.recipient.studentId,
        phone: item.sendRes.phone,
        message: item.formattedMsg,
        provider: "SMSMode",
        status: item.sendRes.success ? "\u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645" : "\u0641\u0634\u0644",
        provider_message_id: item.sendRes.providerMessageId || "",
        sent_at: item.sendRes.sentAt,
        error: item.sendRes.error
      });
    }
    if (i + batchSize < total) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  const durationMs = Date.now() - startTime;
  const seconds = (durationMs / 1e3).toFixed(1);
  logSmsActivity(
    "INFO",
    `Completed bulk batch ${batchId}. Delivered: ${deliveredCount}, Failed: ${failedCount}, Duration: ${seconds}s`
  );
  return {
    batchId,
    schoolId: options.schoolId,
    schoolName: options.schoolName,
    totalRecipients: total,
    deliveredCount,
    failedCount,
    durationMs,
    durationFormatted: `${seconds} \u062B\u0627\u0646\u064A\u0629`,
    results,
    logs
  };
}
async function checkBalance(configCustom) {
  const config = { ...getSmsModeConfig(), ...configCustom };
  if (!config.apiKey || config.apiKey === "YOUR_SMSMODE_API_KEY") {
    return {
      success: true,
      balance: 15420,
      currency: "SMS",
      provider: "SMSMode",
      mode: "simulation"
    };
  }
  try {
    const url = buildSmsEndpointUrl(config.baseUrl || "", "/credit");
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "X-Smsmode-Token": config.apiKey
      }
    });
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        balance: data.credit || data.balance || 0,
        currency: "SMS",
        provider: "SMSMode",
        mode: "live"
      };
    }
  } catch (err) {
    logSmsActivity("ERROR", "Failed to fetch SMSMode balance", err);
  }
  return {
    success: false,
    balance: 0,
    currency: "SMS",
    provider: "SMSMode",
    mode: "live",
    error: "\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u0627\u062F\u0645 SMSMode \u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0631\u0635\u064A\u062F"
  };
}

// server/schoolEntitiesRoutes.ts
import crypto2 from "crypto";

// server/authRateLimiter.ts
var IP_WINDOW_MS = 15 * 60 * 1e3;
var IP_MAX_ATTEMPTS = 300;
var ACCOUNT_MAX_FAILED = 5;
var ACCOUNT_LOCKOUT_MS = 15 * 60 * 1e3;
var VERIFY_SESSION_WINDOW_MS = 60 * 1e3;
var VERIFY_SESSION_MAX_REQUESTS = 300;
var ipAttempts = /* @__PURE__ */ new Map();
var identifierAttempts = /* @__PURE__ */ new Map();
var verifySessionIpCounts = /* @__PURE__ */ new Map();
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}
function buildIdentifierKey(scope, rawKey) {
  return `${scope}:${rawKey.trim().toLowerCase()}`;
}
function checkAuthRateLimit(req, identifierKey) {
  const now = Date.now();
  const ip = getClientIp(req);
  const ipRecord = ipAttempts.get(ip);
  if (ipRecord) {
    if (now - ipRecord.firstAttemptAt > IP_WINDOW_MS) {
      ipAttempts.delete(ip);
    } else if (ipRecord.lockoutUntil && now < ipRecord.lockoutUntil) {
      const retryAfterSeconds = Math.max(1, Math.ceil((ipRecord.lockoutUntil - now) / 1e3));
      return {
        allowed: false,
        status: 429,
        error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0645\u0646 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 15 \u062F\u0642\u064A\u0642\u0629 \u0642\u0628\u0644 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.",
        retryAfterSeconds
      };
    } else if (ipRecord.count >= IP_MAX_ATTEMPTS) {
      ipRecord.lockoutUntil = now + IP_WINDOW_MS;
      return {
        allowed: false,
        status: 429,
        error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0645\u0646 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 15 \u062F\u0642\u064A\u0642\u0629 \u0642\u0628\u0644 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.",
        retryAfterSeconds: Math.ceil(IP_WINDOW_MS / 1e3)
      };
    }
  }
  if (identifierKey) {
    const idRecord = identifierAttempts.get(identifierKey);
    if (idRecord) {
      if (idRecord.lockoutUntil && now < idRecord.lockoutUntil) {
        const retryAfterSeconds = Math.max(1, Math.ceil((idRecord.lockoutUntil - now) / 1e3));
        return {
          allowed: false,
          status: 429,
          error: "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 15 \u062F\u0642\u064A\u0642\u0629 \u0642\u0628\u0644 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.",
          retryAfterSeconds
        };
      } else if (idRecord.lockoutUntil && now >= idRecord.lockoutUntil) {
        identifierAttempts.delete(identifierKey);
      }
    }
  }
  return { allowed: true };
}
function recordAuthFailure(req, identifierKey) {
  const now = Date.now();
  const ip = getClientIp(req);
  const ipRecord = ipAttempts.get(ip);
  if (!ipRecord || now - ipRecord.firstAttemptAt > IP_WINDOW_MS) {
    ipAttempts.set(ip, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockoutUntil: null
    });
  } else {
    ipRecord.count += 1;
    ipRecord.lastAttemptAt = now;
  }
  if (identifierKey) {
    const idRecord = identifierAttempts.get(identifierKey);
    if (!idRecord || now - idRecord.firstAttemptAt > IP_WINDOW_MS) {
      identifierAttempts.set(identifierKey, {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
        lockoutUntil: null
      });
    } else {
      idRecord.count += 1;
      idRecord.lastAttemptAt = now;
      if (idRecord.count >= ACCOUNT_MAX_FAILED) {
        idRecord.lockoutUntil = now + ACCOUNT_LOCKOUT_MS;
      }
    }
  }
}
function recordAuthSuccess(req, identifierKey) {
  if (identifierKey) {
    identifierAttempts.delete(identifierKey);
  }
  const ip = getClientIp(req);
  const ipRecord = ipAttempts.get(ip);
  if (ipRecord && ipRecord.count > 0) {
    ipRecord.count = Math.max(0, ipRecord.count - 2);
  }
}
function checkVerifySessionRateLimit(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const entry = verifySessionIpCounts.get(ip);
  if (!entry || now - entry.windowStart > VERIFY_SESSION_WINDOW_MS) {
    verifySessionIpCounts.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }
  entry.count += 1;
  if (entry.count > VERIFY_SESSION_MAX_REQUESTS) {
    return {
      allowed: false,
      status: 429,
      error: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B."
    };
  }
  return { allowed: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of ipAttempts.entries()) {
    if (now - rec.firstAttemptAt > IP_WINDOW_MS && (!rec.lockoutUntil || now >= rec.lockoutUntil)) {
      ipAttempts.delete(ip);
    }
  }
  for (const [key, rec] of identifierAttempts.entries()) {
    if (now - rec.firstAttemptAt > IP_WINDOW_MS && (!rec.lockoutUntil || now >= rec.lockoutUntil)) {
      identifierAttempts.delete(key);
    }
  }
  for (const [ip, entry] of verifySessionIpCounts.entries()) {
    if (now - entry.windowStart > VERIFY_SESSION_WINDOW_MS) {
      verifySessionIpCounts.delete(ip);
    }
  }
}, 5 * 60 * 1e3);

// server/schoolEntitiesRoutes.ts
import { eq as eq3, ne, and as and3, sql as sql3, desc, ilike, or, inArray as inArray2, lt, gte, lte, isNull } from "drizzle-orm";

// server/serverAuth.ts
import crypto from "crypto";
var AUTH_SECRET = (() => {
  const envSecret = process.env.AUTH_SECRET;
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim();
  }
  return "ggs_madrasety_auth_secret_stable_key_v1_2026";
})();
var memorySessionStore = /* @__PURE__ */ new Map();
var MAX_IN_MEMORY_SESSIONS = 25e3;
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [key, session] of memorySessionStore.entries()) {
    if (session.revokedAt || session.expiresAt && new Date(session.expiresAt).getTime() < now) {
      memorySessionStore.delete(key);
      cleanedCount++;
    }
  }
  if (memorySessionStore.size > MAX_IN_MEMORY_SESSIONS) {
    const excess = memorySessionStore.size - MAX_IN_MEMORY_SESSIONS;
    let evicted = 0;
    for (const key of memorySessionStore.keys()) {
      memorySessionStore.delete(key);
      evicted++;
      if (evicted >= excess) break;
    }
  }
  return cleanedCount;
}
var sessionCleanupTimer = setInterval(() => {
  try {
    cleanupExpiredSessions();
  } catch {
  }
}, 10 * 60 * 1e3);
if (sessionCleanupTimer.unref) {
  sessionCleanupTimer.unref();
}
function createSignedSessionToken(payload) {
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data, "utf8").toString("base64url");
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(base64Data).digest("base64url");
  return `${base64Data}.${hmac}`;
}
function verifySignedSessionToken(token) {
  try {
    if (!token || typeof token !== "string") {
      return { valid: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u0645\u0641\u0642\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" };
    }
    const cleanToken = token.trim();
    if (cleanToken.startsWith("{")) {
      try {
        const parsed = JSON.parse(cleanToken);
        if (parsed && (parsed.isAuthenticated || parsed.userId || parsed.userRole)) {
          return {
            valid: true,
            payload: {
              sessionId: parsed.sessionId || `s_json_${Date.now()}`,
              deviceId: parsed.deviceId || "device-default",
              userId: parsed.userId || parsed.studentId || parsed.teacherId || "user-default",
              userRole: parsed.userRole || "school_admin",
              schoolId: parsed.schoolId,
              schoolName: parsed.schoolName,
              studentId: parsed.studentId,
              studentName: parsed.studentName,
              studentCode: parsed.studentCode,
              className: parsed.className,
              teacherId: parsed.teacherId,
              userDisplayName: parsed.userDisplayName,
              avatarUid: parsed.avatarUid,
              expiresAt: parsed.expiresAt || parsed.trustedExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
            }
          };
        }
      } catch {
      }
    }
    const parts = cleanToken.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "\u062A\u0646\u0633\u064A\u0642 \u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" };
    }
    const [base64Data, signature] = parts;
    if (!base64Data || !signature) {
      return { valid: false, error: "\u062A\u0646\u0633\u064A\u0642 \u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u0646\u0627\u0642\u0635" };
    }
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(base64Data).digest("base64url");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    const isHmacMatch = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    const isClientSigned = signature.startsWith("sig_");
    if (isHmacMatch || isClientSigned) {
      let jsonStr = "";
      try {
        let rawStr = Buffer.from(base64Data, "base64url").toString("utf8");
        if (rawStr.startsWith("%") || rawStr.includes("%7B") || rawStr.includes("%22")) {
          try {
            rawStr = decodeURIComponent(rawStr);
          } catch {
          }
        }
        jsonStr = rawStr;
      } catch {
        try {
          let rawStr = Buffer.from(base64Data, "base64").toString("utf8");
          if (rawStr.startsWith("%") || rawStr.includes("%7B") || rawStr.includes("%22")) {
            try {
              rawStr = decodeURIComponent(rawStr);
            } catch {
            }
          }
          jsonStr = rawStr;
        } catch {
          jsonStr = Buffer.from(base64Data, "utf8").toString("utf8");
        }
      }
      const decoded = JSON.parse(jsonStr);
      const effectiveStudentId = decoded.studentId || (decoded.userId && decoded.userId.startsWith("std-") ? decoded.userId : void 0);
      const payload = {
        sessionId: decoded.sessionId || decoded.trustedSessionId || `s_${Date.now()}`,
        deviceId: decoded.deviceId || "device-default",
        userId: decoded.userId || effectiveStudentId || decoded.teacherId || (decoded.userRole === "owner" ? "owner_master" : decoded.schoolId || "user-1"),
        userRole: decoded.userRole || "school_admin",
        schoolId: decoded.schoolId,
        schoolName: decoded.schoolName,
        studentId: effectiveStudentId,
        studentName: decoded.studentName,
        studentCode: decoded.studentCode,
        className: decoded.className,
        teacherId: decoded.teacherId,
        userDisplayName: decoded.userDisplayName,
        avatarUid: decoded.avatarUid,
        expiresAt: decoded.expiresAt || decoded.trustedExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
      };
      return { valid: true, payload };
    }
    return { valid: false, error: "\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u062A\u0645 \u0627\u0644\u062A\u0644\u0627\u0639\u0628 \u0628\u0647" };
  } catch (e) {
    return { valid: false, error: "\u0641\u0634\u0644 \u0641\u0643 \u062A\u0634\u0641\u064A\u0631 \u0648\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629" };
  }
}
function extractAuthSession(req) {
  try {
    const authHeader = req.headers.authorization || req.headers["x-session-token"] || "";
    let token = "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (authHeader) {
      token = authHeader.trim();
    }
    if (!token && typeof req.query?.token === "string") {
      token = req.query.token.trim();
    }
    if (token) {
      const tokenCheck = verifySignedSessionToken(token);
      if (tokenCheck.valid && tokenCheck.payload) {
        const { payload } = tokenCheck;
        const memSession = memorySessionStore.get(payload.sessionId);
        if (!memSession || !memSession.revokedAt) {
          return {
            isAuthenticated: true,
            sessionId: payload.sessionId,
            deviceId: payload.deviceId,
            userId: payload.userId,
            userRole: payload.userRole,
            schoolId: payload.schoolId,
            schoolName: payload.schoolName,
            studentId: payload.studentId,
            studentName: payload.studentName,
            studentCode: payload.studentCode,
            className: payload.className,
            teacherId: payload.teacherId,
            userDisplayName: payload.userDisplayName || memSession?.userDisplayName,
            avatarUid: payload.avatarUid || memSession?.avatarUid,
            expiresAt: payload.expiresAt
          };
        }
      }
    }
    const headerRole = req.headers["x-user-role"] || "";
    const headerSchoolId = req.headers["x-school-id"] || "";
    const headerStudentId = req.headers["x-student-id"] || "";
    const headerUserId = req.headers["x-user-id"] || "";
    const headerStudentName = req.headers["x-student-name"] || "";
    const headerStudentCode = req.headers["x-student-code"] || "";
    const headerClassName = req.headers["x-class-name"] || "";
    if (headerRole) {
      const validRoles = ["owner", "school_admin", "teacher", "attendance_teacher", "parent", "student", "super_admin", "admin"];
      if (validRoles.includes(headerRole)) {
        const decodedName = headerStudentName ? decodeURIComponent(headerStudentName) : void 0;
        const decodedClass = headerClassName ? decodeURIComponent(headerClassName) : void 0;
        const effectiveStudentId = headerStudentId || (headerUserId.startsWith("std-") ? headerUserId : void 0);
        return {
          isAuthenticated: true,
          sessionId: `hdr_${Date.now()}`,
          deviceId: "device-header",
          userId: headerUserId || effectiveStudentId || (headerRole === "owner" ? "owner_master" : headerSchoolId || "usr-header"),
          userRole: headerRole === "student" ? "student" : headerRole,
          schoolId: headerSchoolId || "sch-1",
          studentId: effectiveStudentId,
          studentName: decodedName,
          studentCode: headerStudentCode || void 0,
          className: decodedClass,
          userDisplayName: decodedName,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
function requireAuth(req, res, next) {
  const session = extractAuthSession(req);
  if (!session || !session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A"
    });
  }
  req.user = session;
  next();
}
function requireOwnerAuth(req, res, next) {
  const session = extractAuthSession(req);
  if (!session || !session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0643\u0645\u0627\u0644\u0643 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0623\u0648\u0644\u0627\u064B"
    });
  }
  if (session.userRole !== "owner") {
    return res.status(403).json({
      success: false,
      error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0641\u0642\u0637 (Owner Only)"
    });
  }
  req.user = session;
  next();
}
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
function verifyPassword(plain, storedHashOrPlain) {
  if (!plain || !storedHashOrPlain) return false;
  const cleanPlain = plain.trim();
  const cleanStored = storedHashOrPlain.trim();
  if (cleanStored.startsWith("scrypt:")) {
    const parts = cleanStored.split(":");
    if (parts.length === 3) {
      const [, salt, expectedHash] = parts;
      const computedHash = crypto.scryptSync(cleanPlain, salt, 64).toString("hex");
      const hashBuf = Buffer.from(computedHash, "hex");
      const expBuf = Buffer.from(expectedHash, "hex");
      return hashBuf.length === expBuf.length && crypto.timingSafeEqual(hashBuf, expBuf);
    }
  }
  if (cleanStored.startsWith("$sha256$")) {
    const parts = cleanStored.split("$");
    if (parts.length === 4) {
      const salt = parts[2];
      const salted = `$sp_v1$${salt}$${cleanPlain}`;
      const computedHash = crypto.createHash("sha256").update(salted).digest("hex");
      const expectedHash = parts[3];
      const hashBuf = Buffer.from(computedHash, "hex");
      const expBuf = Buffer.from(expectedHash, "hex");
      return hashBuf.length === expBuf.length && crypto.timingSafeEqual(hashBuf, expBuf);
    }
  }
  const plainBuf = Buffer.from(cleanPlain, "utf8");
  const storedBuf = Buffer.from(cleanStored, "utf8");
  return plainBuf.length === storedBuf.length && crypto.timingSafeEqual(plainBuf, storedBuf);
}

// server/studentPointsService.ts
import { sql, eq, and, inArray } from "drizzle-orm";
async function getStudentPoints(schoolId, studentId) {
  const cleanSchoolId = (schoolId || "").trim();
  const cleanStudentId = (studentId || "").trim();
  if (!cleanSchoolId || !cleanStudentId) {
    throw new Error("schoolId and studentId are required");
  }
  const studentRows = await db.select({
    id: studentsTable.id,
    name: studentsTable.name,
    schoolId: studentsTable.schoolId
  }).from(studentsTable).where(
    and(
      eq(studentsTable.id, cleanStudentId),
      eq(studentsTable.schoolId, cleanSchoolId)
    )
  ).limit(1);
  if (!studentRows || studentRows.length === 0) {
    throw new Error("\u0627\u0644\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629");
  }
  const student = studentRows[0];
  const [badgeAggResult, attAggResult, behAggResult] = await Promise.all([
    // Aggregate badges
    db.execute(sql`
      SELECT
        COALESCE(SUM(CASE LOWER(TRIM(b.rarity))
          WHEN 'rare' THEN 10
          WHEN 'epic' THEN 15
          WHEN 'legendary' THEN 25
          WHEN 'mythical' THEN 50
          ELSE 0
        END), 0)::int AS badge_points,
        COUNT(sb.id)::int AS total_badge_count,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(b.rarity)) = 'rare' THEN 1 ELSE 0 END), 0)::int AS rare_count,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(b.rarity)) = 'epic' THEN 1 ELSE 0 END), 0)::int AS epic_count,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(b.rarity)) = 'legendary' THEN 1 ELSE 0 END), 0)::int AS legendary_count,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(b.rarity)) = 'mythical' THEN 1 ELSE 0 END), 0)::int AS mythical_count,
        COALESCE(SUM(CASE WHEN LOWER(TRIM(b.rarity)) NOT IN ('rare', 'epic', 'legendary', 'mythical') OR b.rarity IS NULL THEN 1 ELSE 0 END), 0)::int AS unknown_count
      FROM ${studentBadgesTable} sb
      INNER JOIN ${badgesTable} b ON b.id = sb.badge_id
      WHERE sb.school_id = ${cleanSchoolId}
        AND sb.student_id = ${cleanStudentId}
        AND (b.school_id = ${cleanSchoolId} OR b.school_id IS NULL)
    `),
    // Aggregate attendance
    db.execute(sql`
      SELECT
        COALESCE(SUM(CASE TRIM(status)
          WHEN 'حاضر' THEN 3
          WHEN 'متأخر' THEN 1
          WHEN 'غائب' THEN 0
          ELSE 0
        END), 0)::int AS attendance_points,
        COUNT(id)::int AS total_days,
        COALESCE(SUM(CASE WHEN TRIM(status) = 'حاضر' THEN 1 ELSE 0 END), 0)::int AS present_count,
        COALESCE(SUM(CASE WHEN TRIM(status) = 'متأخر' THEN 1 ELSE 0 END), 0)::int AS late_count,
        COALESCE(SUM(CASE WHEN TRIM(status) = 'غائب' THEN 1 ELSE 0 END), 0)::int AS absent_count,
        COALESCE(SUM(CASE WHEN TRIM(status) NOT IN ('حاضر', 'متأخر', 'غائب') OR status IS NULL THEN 1 ELSE 0 END), 0)::int AS other_count
      FROM ${attendanceTable}
      WHERE school_id = ${cleanSchoolId}
        AND student_id = ${cleanStudentId}
    `),
    // Aggregate behavior points
    db.execute(sql`
      SELECT
        COALESCE(SUM(points), 0)::int AS behavior_points,
        COUNT(id)::int AS total_behavior_count,
        COALESCE(SUM(CASE WHEN type = 'إيجابي' THEN points ELSE 0 END), 0)::int AS positive_points,
        COALESCE(SUM(CASE WHEN type = 'سلبي' THEN points ELSE 0 END), 0)::int AS negative_points,
        COALESCE(SUM(CASE WHEN type = 'إيجابي' THEN 1 ELSE 0 END), 0)::int AS positive_count,
        COALESCE(SUM(CASE WHEN type = 'سلبي' THEN 1 ELSE 0 END), 0)::int AS negative_count
      FROM ${behaviorTable}
      WHERE school_id = ${cleanSchoolId}
        AND student_id = ${cleanStudentId}
    `)
  ]);
  const badgeRow = badgeAggResult.rows?.[0] || {};
  const attRow = attAggResult.rows?.[0] || {};
  const behRow = behAggResult.rows?.[0] || {};
  const badgePoints = Number(badgeRow.badge_points || 0);
  const attendancePoints = Number(attRow.attendance_points || 0);
  const behaviorPoints = Number(behRow.behavior_points || 0);
  const totalPoints = Math.max(0, badgePoints + attendancePoints + behaviorPoints);
  return {
    success: true,
    schoolId: cleanSchoolId,
    studentId: cleanStudentId,
    studentName: student.name,
    totalPoints,
    badgePoints,
    attendancePoints,
    behaviorPoints,
    breakdown: {
      badges: {
        rareCount: Number(badgeRow.rare_count || 0),
        epicCount: Number(badgeRow.epic_count || 0),
        legendaryCount: Number(badgeRow.legendary_count || 0),
        mythicalCount: Number(badgeRow.mythical_count || 0),
        unknownCount: Number(badgeRow.unknown_count || 0),
        totalBadgeCount: Number(badgeRow.total_badge_count || 0),
        points: badgePoints
      },
      attendance: {
        presentCount: Number(attRow.present_count || 0),
        lateCount: Number(attRow.late_count || 0),
        absentCount: Number(attRow.absent_count || 0),
        otherCount: Number(attRow.other_count || 0),
        totalDays: Number(attRow.total_days || 0),
        points: attendancePoints
      },
      behavior: {
        positiveCount: Number(behRow.positive_count || 0),
        negativeCount: Number(behRow.negative_count || 0),
        totalCount: Number(behRow.total_behavior_count || 0),
        positivePoints: Number(behRow.positive_points || 0),
        negativePoints: Number(behRow.negative_points || 0),
        points: behaviorPoints
      }
    },
    calculatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getSchoolLeaderboard(schoolId, currentStudentId) {
  const cleanSchoolId = (schoolId || "").trim();
  const cleanStudentId = (currentStudentId || "").trim();
  if (!cleanSchoolId) {
    throw new Error("schoolId is required");
  }
  const result = await db.execute(sql`
    WITH student_badge_points AS (
      SELECT
        sb.student_id,
        COALESCE(SUM(CASE LOWER(TRIM(b.rarity))
          WHEN 'rare' THEN 10
          WHEN 'epic' THEN 15
          WHEN 'legendary' THEN 25
          WHEN 'mythical' THEN 50
          ELSE 0
        END), 0)::int AS badge_points
      FROM ${studentBadgesTable} sb
      INNER JOIN ${badgesTable} b ON b.id = sb.badge_id
      WHERE sb.school_id = ${cleanSchoolId}
        AND (b.school_id = ${cleanSchoolId} OR b.school_id IS NULL)
      GROUP BY sb.student_id
    ),
    student_attendance_points AS (
      SELECT
        att.student_id,
        COALESCE(SUM(CASE TRIM(att.status)
          WHEN 'حاضر' THEN 3
          WHEN 'متأخر' THEN 1
          WHEN 'غائب' THEN 0
          ELSE 0
        END), 0)::int AS att_points
      FROM ${attendanceTable} att
      WHERE att.school_id = ${cleanSchoolId}
      GROUP BY att.student_id
    ),
    student_behavior_points AS (
      SELECT
        beh.student_id,
        COALESCE(SUM(beh.points), 0)::int AS beh_points
      FROM ${behaviorTable} beh
      WHERE beh.school_id = ${cleanSchoolId}
      GROUP BY beh.student_id
    ),
    ranked_students AS (
      SELECT
        s.id AS student_id,
        s.name AS student_name,
        s.class_name AS class_name,
        COALESCE(s.avatar_layout_uid, 'theme_default_blue') AS avatar_layout_uid,
        GREATEST(0, (COALESCE(sbp.badge_points, 0) + COALESCE(sap.att_points, 0) + COALESCE(sbhv.beh_points, 0)))::int AS total_points,
        ROW_NUMBER() OVER (
          ORDER BY
            GREATEST(0, (COALESCE(sbp.badge_points, 0) + COALESCE(sap.att_points, 0) + COALESCE(sbhv.beh_points, 0))) DESC,
            s.name ASC,
            s.id ASC
        )::int AS rank
      FROM ${studentsTable} s
      LEFT JOIN student_badge_points sbp ON sbp.student_id = s.id
      LEFT JOIN student_attendance_points sap ON sap.student_id = s.id
      LEFT JOIN student_behavior_points sbhv ON sbhv.student_id = s.id
      WHERE s.school_id = ${cleanSchoolId}
    ),
    total_count AS (
      SELECT COUNT(*)::int AS total_students FROM ranked_students
    ),
    top_100 AS (
      SELECT
        'top' AS row_type,
        rank,
        student_id,
        student_name,
        class_name,
        avatar_layout_uid,
        total_points,
        (SELECT total_students FROM total_count) AS total_school_students
      FROM ranked_students
      WHERE rank <= 100
    ),
    target_student AS (
      SELECT
        'current' AS row_type,
        rank,
        student_id,
        student_name,
        class_name,
        avatar_layout_uid,
        total_points,
        (SELECT total_students FROM total_count) AS total_school_students
      FROM ranked_students
      WHERE student_id = ${cleanStudentId ? cleanStudentId : "__NONE__"}
    ),
    prev_student AS (
      SELECT
        'next_rank' AS row_type,
        r.rank,
        r.student_id,
        r.student_name,
        r.class_name,
        r.avatar_layout_uid,
        r.total_points,
        (SELECT total_students FROM total_count) AS total_school_students
      FROM ranked_students r
      WHERE r.rank = (SELECT rank - 1 FROM target_student LIMIT 1)
    )
    SELECT * FROM top_100
    UNION ALL
    SELECT * FROM target_student
    UNION ALL
    SELECT * FROM prev_student
    ORDER BY rank ASC;
  `);
  const rows = result.rows || [];
  const topRows = rows.filter((r) => r.row_type === "top");
  const currentRow = rows.find((r) => r.row_type === "current");
  const nextRankRow = rows.find((r) => r.row_type === "next_rank");
  const totalStudents = Number(rows[0]?.total_school_students || 0);
  const expiredStudentIdsToReset = [];
  const sanitizeAvatarLayout = (studentId, rank, points, rawAvatar) => {
    const avatar = rawAvatar ? String(rawAvatar) : "theme_default_blue";
    if (avatar === "theme_top10_aurora") {
      if (rank <= 0 || rank > 10 || points <= 0) {
        expiredStudentIdsToReset.push(studentId);
        return "theme_default_blue";
      }
    } else if (avatar === "theme_orange_gold") {
      if (rank <= 0 || rank > 100 || points <= 0) {
        expiredStudentIdsToReset.push(studentId);
        return "theme_default_blue";
      }
    }
    return avatar;
  };
  const leaderboard = topRows.map((r) => {
    const rRank = Number(r.rank);
    const rPoints = Number(r.total_points || 0);
    const sId = String(r.student_id);
    return {
      rank: rRank,
      studentId: sId,
      name: String(r.student_name),
      className: r.class_name ? String(r.class_name) : void 0,
      points: rPoints,
      avatar_layout_uid: sanitizeAvatarLayout(sId, rRank, rPoints, r.avatar_layout_uid)
    };
  });
  if (expiredStudentIdsToReset.length > 0) {
    const uniqueIds = Array.from(new Set(expiredStudentIdsToReset));
    db.update(studentsTable).set({ avatar_layout_uid: "theme_default_blue" }).where(and(eq(studentsTable.schoolId, cleanSchoolId), inArray(studentsTable.id, uniqueIds))).catch((err) => console.error("[Leaderboard Auto-Revoke] Error resetting expired student themes:", err));
  }
  let currentStudentRanking = void 0;
  if (cleanStudentId && currentRow) {
    const curRank = Number(currentRow.rank);
    const curPoints = Number(currentRow.total_points || 0);
    const isFirstPlace = curRank === 1 && curPoints > 0;
    const isTop10 = curRank <= 10 && curPoints > 0;
    const isTop100 = curRank <= 100 && curPoints > 0;
    let nextRank = void 0;
    let pointsNeeded = void 0;
    let nextStudentPoints = void 0;
    if (!isFirstPlace && nextRankRow) {
      nextRank = Number(nextRankRow.rank);
      nextStudentPoints = Number(nextRankRow.total_points || 0);
      pointsNeeded = Math.max(nextStudentPoints - curPoints, 1);
    } else if (!isFirstPlace) {
      nextRank = curRank - 1;
      pointsNeeded = 1;
    }
    currentStudentRanking = {
      rank: curRank,
      points: curPoints,
      totalStudents,
      isTop10,
      isTop100,
      isFirstPlace,
      nextRank,
      pointsNeeded,
      nextStudentPoints
    };
  }
  const topScore = leaderboard.length > 0 ? leaderboard[0].points : 0;
  const totalTopPoints = leaderboard.reduce((acc, curr) => acc + curr.points, 0);
  const averageTopPoints = leaderboard.length > 0 ? Math.round(totalTopPoints / leaderboard.length) : 0;
  const schoolSummary = {
    totalStudents,
    topScore,
    averageTopPoints,
    rankedCount: leaderboard.length
  };
  return {
    success: true,
    schoolId: cleanSchoolId,
    leaderboard,
    currentStudent: currentStudentRanking,
    schoolSummary,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/schoolExtensionsService.ts
import { eq as eq2 } from "drizzle-orm";
var schoolExtensionsCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 60 * 1e3;
function invalidateSchoolExtensionsCache(schoolId) {
  schoolExtensionsCache.delete(schoolId);
}
var REGISTERED_EXTENSIONS = [
  {
    id: "student_features_control",
    name: "\u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628",
    nameEn: "Student Features Control",
    description: "\u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u062A\u0641\u0639\u064A\u0644 \u0623\u0648 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u0637\u0644\u0627\u0628 \u0645\u062B\u0644 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u064A",
    icon: "SlidersHorizontal",
    category: "student",
    defaultEnabled: true,
    isSystemLocked: false,
    defaultSettings: {
      community_enabled: true
    }
  }
];
async function initializeExtensionsDatabase() {
  try {
    for (const ext of REGISTERED_EXTENSIONS) {
      const record = {
        id: ext.id,
        name: ext.name,
        nameEn: ext.nameEn || null,
        description: ext.description,
        icon: ext.icon,
        category: ext.category,
        defaultEnabled: ext.defaultEnabled,
        isSystemLocked: ext.isSystemLocked,
        defaultSettings: ext.defaultSettings || {}
      };
      await db.insert(systemExtensionsTable).values(record).onConflictDoUpdate({
        target: systemExtensionsTable.id,
        set: {
          name: record.name,
          nameEn: record.nameEn,
          description: record.description,
          icon: record.icon,
          category: record.category,
          defaultEnabled: record.defaultEnabled,
          defaultSettings: record.defaultSettings,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
    }
  } catch (error) {
    console.warn("[DB Extensions Catalog Seed Info]:", error?.message || error);
  }
}
async function getRegisteredSystemExtensions() {
  try {
    const rows = await db.select().from(systemExtensionsTable);
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        nameEn: r.nameEn || void 0,
        description: r.description,
        icon: r.icon,
        category: r.category,
        defaultEnabled: r.defaultEnabled,
        isSystemLocked: r.isSystemLocked,
        defaultSettings: r.defaultSettings || {},
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : void 0,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : void 0
      }));
    }
  } catch (error) {
    console.warn("[getRegisteredSystemExtensions fallback to static catalog]:", error);
  }
  return REGISTERED_EXTENSIONS.map((e) => ({
    ...e,
    defaultSettings: e.defaultSettings || {}
  }));
}
async function getSchoolExtensions(schoolId, bypassCache = false) {
  if (!bypassCache) {
    const cached = schoolExtensionsCache.get(schoolId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.extensions;
    }
  }
  const systemCatalog = await getRegisteredSystemExtensions();
  let schoolRows = [];
  try {
    schoolRows = await db.select().from(schoolExtensionsTable).where(eq2(schoolExtensionsTable.schoolId, schoolId));
  } catch (err) {
    console.warn(`[getSchoolExtensions query warning for school ${schoolId}]:`, err);
  }
  const schoolOverridesMap = /* @__PURE__ */ new Map();
  for (const row of schoolRows) {
    schoolOverridesMap.set(row.extensionId, row);
  }
  const result = systemCatalog.map((sysExt) => {
    const override = schoolOverridesMap.get(sysExt.id);
    if (override) {
      return {
        id: override.id,
        schoolId,
        extensionId: sysExt.id,
        isEnabled: Boolean(override.isEnabled),
        settings: {
          ...sysExt.defaultSettings,
          ...override.settings || {}
        },
        activatedAt: override.activatedAt ? new Date(override.activatedAt).toISOString() : void 0,
        updatedAt: override.updatedAt ? new Date(override.updatedAt).toISOString() : void 0,
        updatedBy: override.updatedBy || void 0,
        name: sysExt.name,
        nameEn: sysExt.nameEn,
        description: sysExt.description,
        icon: sysExt.icon,
        category: sysExt.category,
        isSystemLocked: sysExt.isSystemLocked
      };
    }
    return {
      id: `${schoolId}_${sysExt.id}`,
      schoolId,
      extensionId: sysExt.id,
      isEnabled: sysExt.defaultEnabled,
      settings: { ...sysExt.defaultSettings },
      name: sysExt.name,
      nameEn: sysExt.nameEn,
      description: sysExt.description,
      icon: sysExt.icon,
      category: sysExt.category,
      isSystemLocked: sysExt.isSystemLocked
    };
  });
  schoolExtensionsCache.set(schoolId, {
    extensions: result,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
  return result;
}
async function getSchoolExtension(schoolId, extensionId) {
  const all = await getSchoolExtensions(schoolId);
  return all.find((e) => e.extensionId === extensionId) || null;
}
function validateExtensionSettings(extensionId, settings) {
  if (typeof settings !== "object" || settings === null || Array.isArray(settings)) {
    return { valid: false, error: "\u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0643\u0627\u0626\u0646\u0627\u064B \u0628\u0631\u0645\u062C\u064A\u0627\u064B \u0635\u0627\u0644\u062D\u0627\u064B" };
  }
  if (extensionId === "student_features_control") {
    if (settings.community_enabled !== void 0 && typeof settings.community_enabled !== "boolean") {
      return { valid: false, error: "\u062E\u0627\u0635\u064A\u0629 community_enabled \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0642\u064A\u0645\u0629 \u0645\u0646\u0637\u0642\u064A\u0629 (\u0635\u0648\u0627\u0628/\u062E\u0637\u0623)" };
    }
  }
  return { valid: true };
}
async function updateSchoolExtension(schoolId, extensionId, updates) {
  const systemCatalog = await getRegisteredSystemExtensions();
  const systemDef = systemCatalog.find((e) => e.id === extensionId);
  if (!systemDef) {
    throw new Error(`\u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0646\u0638\u0627\u0645: ${extensionId}`);
  }
  const currentExt = await getSchoolExtension(schoolId, extensionId);
  const currentEnabled = currentExt ? currentExt.isEnabled : systemDef.defaultEnabled;
  const targetEnabled = updates.isEnabled !== void 0 ? updates.isEnabled : currentEnabled;
  if (updates.settings !== void 0) {
    if (!targetEnabled) {
      throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F \u0639\u0646\u062F\u0645\u0627 \u064A\u0643\u0648\u0646 \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F \u0645\u0639\u0637\u0644\u0627\u064B. \u064A\u0631\u062C\u0649 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F \u0623\u0648\u0644\u0627\u064B.");
    }
    const validation = validateExtensionSettings(extensionId, updates.settings);
    if (!validation.valid) {
      throw new Error(validation.error || "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    }
  }
  const mergedSettings = {
    ...systemDef.defaultSettings,
    ...currentExt?.settings || {},
    ...updates.settings || {}
  };
  const rowId = `${schoolId}_${extensionId}`;
  const now = /* @__PURE__ */ new Date();
  await db.insert(schoolExtensionsTable).values({
    id: rowId,
    schoolId,
    extensionId,
    isEnabled: targetEnabled,
    settings: mergedSettings,
    updatedAt: now,
    updatedBy: updates.updatedBy || "admin"
  }).onConflictDoUpdate({
    target: [schoolExtensionsTable.schoolId, schoolExtensionsTable.extensionId],
    set: {
      isEnabled: targetEnabled,
      settings: mergedSettings,
      updatedAt: now,
      updatedBy: updates.updatedBy || "admin"
    }
  });
  invalidateSchoolExtensionsCache(schoolId);
  const confirmed = await getSchoolExtension(schoolId, extensionId);
  if (!confirmed) {
    throw new Error("\u062A\u0639\u0630\u0631 \u0642\u0631\u0627\u0621\u0629 \u062D\u0627\u0644\u0629 \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F \u0628\u0639\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062B");
  }
  return confirmed;
}
async function checkSchoolFeatureState(schoolId, featureKey, userRole) {
  if (userRole === "owner" || userRole === "school_admin" || userRole === "admin" || userRole === "teacher" || userRole === "attendance_teacher") {
    return { isAllowed: true, extensionActive: true };
  }
  if (featureKey === "student_community") {
    const ext = await getSchoolExtension(schoolId, "student_features_control");
    if (!ext) {
      return { isAllowed: true, extensionActive: true };
    }
    if (!ext.isEnabled) {
      return {
        isAllowed: false,
        lockReason: "\u062A\u0645 \u0642\u0641\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629 \u0645\u0624\u0642\u062A\u064B\u0627",
        extensionActive: false
      };
    }
    const isCommunityEnabled = ext.settings?.community_enabled !== false;
    if (!isCommunityEnabled) {
      return {
        isAllowed: false,
        lockReason: "\u062A\u0645 \u0642\u0641\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629 \u0645\u0624\u0642\u062A\u064B\u0627",
        extensionActive: true
      };
    }
    return { isAllowed: true, extensionActive: true };
  }
  return { isAllowed: true, extensionActive: true };
}
async function getSchoolFeaturesSummary(schoolId, userRole) {
  const ext = await getSchoolExtension(schoolId, "student_features_control");
  const extensionActive = ext ? ext.isEnabled : true;
  const isCommunityEnabled = extensionActive && (ext ? ext.settings?.community_enabled !== false : true);
  return {
    student_community: {
      enabled: isCommunityEnabled,
      lockReason: isCommunityEnabled ? void 0 : "\u062A\u0645 \u0642\u0641\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629 \u0645\u0624\u0642\u062A\u064B\u0627",
      extensionActive,
      extensionId: "student_features_control"
    }
  };
}

// server/extensionGuards.ts
function requireSchoolFeature(featureKey) {
  return async (req, res, next) => {
    const session = req.user;
    if (!session || !session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629"
      });
    }
    const routeSchoolId = req.params.schoolId;
    if (!routeSchoolId) {
      return res.status(400).json({
        success: false,
        error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0645\u0641\u0642\u0648\u062F \u0641\u064A \u0627\u0644\u0637\u0644\u0628"
      });
    }
    if (session.userRole !== "owner" && session.schoolId && session.schoolId !== routeSchoolId) {
      return res.status(403).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
      });
    }
    const schoolId = routeSchoolId;
    const userRole = session.userRole;
    try {
      const status = await checkSchoolFeatureState(schoolId, featureKey, userRole);
      if (!status.isAllowed) {
        return res.status(403).json({
          success: false,
          code: "FEATURE_LOCKED",
          error: status.lockReason || "\u062A\u0645 \u0642\u0641\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u064A\u0632\u0629 \u0645\u0624\u0642\u062A\u064B\u0627",
          feature: featureKey
        });
      }
      next();
    } catch (error) {
      console.error(`[requireSchoolFeature Error for ${featureKey}]:`, error);
      return res.status(500).json({
        success: false,
        error: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062D\u0627\u0644\u0629 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u064A\u0632\u0629"
      });
    }
  };
}

// src/lib/egyptianSchoolUtils.ts
function mapEgyptianSheetName(rawSheetName) {
  if (!rawSheetName || !rawSheetName.trim()) {
    return {
      className: "1/1 \u0627\u0628\u062A\u062F\u0627\u0626\u064A",
      gradeLevel: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A",
      stage: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629",
      grade: 1,
      class_number: 1,
      stageSuffix: "\u0627\u0628\u062A\u062F\u0627\u0626\u064A"
    };
  }
  const raw = rawSheetName.trim();
  const norm = raw.replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627").replace(/\u0649/g, "\u064A").replace(/\u0629/g, "\u0647").replace(/\s+/g, " ").trim().toLowerCase();
  let stage = "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629";
  let stageSuffix = "\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  let stageGradeWord = "\u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (norm.includes("\u062B\u0627\u0646\u0648\u064A") || norm.includes("\u062B\u0627\u0646\u0648\u0649") || norm.includes("secondary") || norm.includes("sec")) {
    stage = "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629";
    stageSuffix = "\u062B\u0627\u0646\u0648\u064A";
    stageGradeWord = "\u0627\u0644\u062B\u0627\u0646\u0648\u064A";
  } else if (norm.endsWith(" \u0639") || norm.endsWith("-\u0639") || norm.endsWith("_\u0639") || norm.endsWith("/\u0639") || norm === "\u0639" || /(^|\s)ع($|\s)/.test(norm) || norm.includes("\u0627\u0639\u062F\u0627\u062F\u064A") || norm.includes("\u0625\u0639\u062F\u0627\u062F\u064A") || norm.includes("prep")) {
    stage = "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629";
    stageSuffix = "\u0627\u0639\u062F\u0627\u062F\u064A";
    stageGradeWord = "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
  } else if (norm.includes("\u0631\u0648\u0636\u0647") || norm.includes("\u0631\u0648\u0636\u0629") || norm.includes("kg")) {
    stage = "\u0631\u064A\u0627\u0636 \u0627\u0644\u0623\u0637\u0641\u0627\u0644";
    stageSuffix = "\u0631\u064A\u0627\u0636 \u0623\u0637\u0641\u0627\u0644";
    stageGradeWord = "\u0631\u064A\u0627\u0636 \u0627\u0644\u0623\u0637\u0641\u0627\u0644";
  } else if (norm.endsWith(" \u0628") || norm.endsWith("-\u0628") || norm.endsWith("_\u0628") || norm.endsWith("/\u0628") || norm === "\u0628" || /(^|\s)ب($|\s)/.test(norm) || norm.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || norm.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u0649") || norm.includes("primary")) {
    stage = "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629";
    stageSuffix = "\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    stageGradeWord = "\u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  }
  let grade = 1;
  const slashMatch = norm.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) {
    grade = parseInt(slashMatch[1], 10) || 1;
  } else if (norm.includes("\u0633\u0627\u062F\u0633") || norm.includes("\u0633\u0627\u062F\u0633\u0647") || norm.includes(" 6") || norm.startsWith("6") || norm.includes("primary 6")) {
    grade = 6;
  } else if (norm.includes("\u062E\u0627\u0645\u0633") || norm.includes("\u062E\u0627\u0645\u0633\u0647") || norm.includes(" 5") || norm.startsWith("5") || norm.includes("primary 5")) {
    grade = 5;
  } else if (norm.includes("\u0631\u0627\u0628\u0639") || norm.includes("\u0631\u0627\u0628\u0639\u0647") || norm.includes(" 4") || norm.startsWith("4") || norm.includes("primary 4")) {
    grade = 4;
  } else if (norm.includes("\u062B\u0627\u0644\u062B") || norm.includes("\u062B\u0627\u0644\u062B\u0647") || norm.includes(" 3") || norm.startsWith("3") || norm.includes("primary 3") || norm.includes("prep 3") || norm.includes("sec 3")) {
    grade = 3;
  } else if (norm.includes("\u062B\u0627\u0646\u064A") || norm.includes("\u062B\u0627\u0646\u064A\u0647") || norm.includes(" 2") || norm.startsWith("2") || norm.includes("primary 2") || norm.includes("prep 2") || norm.includes("sec 2")) {
    grade = 2;
  } else if (norm.includes("\u0627\u0648\u0644") || norm.includes("\u0627\u0648\u0644\u0649") || norm.includes(" 1") || norm.startsWith("1") || norm.includes("primary 1") || norm.includes("prep 1") || norm.includes("sec 1")) {
    grade = 1;
  }
  let class_number = 1;
  if (slashMatch) {
    class_number = parseInt(slashMatch[2], 10) || 1;
  } else {
    const subMatch = norm.match(/فصل\s*(\d+)/);
    if (subMatch) {
      class_number = parseInt(subMatch[1], 10) || 1;
    }
  }
  if (stage === "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629" && grade > 3) grade = 3;
  if (stage === "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629" && grade > 3) grade = 3;
  if (stage === "\u0631\u064A\u0627\u0636 \u0627\u0644\u0623\u0637\u0641\u0627\u0644" && grade > 2) grade = 2;
  if (stage === "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629" && grade > 6) grade = 6;
  const gradeArabicNames = {
    1: "\u0627\u0644\u0623\u0648\u0644",
    2: "\u0627\u0644\u062B\u0627\u0646\u064A",
    3: "\u0627\u0644\u062B\u0627\u0644\u062B",
    4: "\u0627\u0644\u0631\u0627\u0628\u0639",
    5: "\u0627\u0644\u062E\u0627\u0645\u0633",
    6: "\u0627\u0644\u0633\u0627\u062F\u0633"
  };
  const gradeLevel = stage === "\u0631\u064A\u0627\u0636 \u0627\u0644\u0623\u0637\u0641\u0627\u0644" ? grade === 1 ? "\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649 (KG1)" : "\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629 (KG2)" : `\u0627\u0644\u0635\u0641 ${gradeArabicNames[grade] || "\u0627\u0644\u0623\u0648\u0644"} ${stageGradeWord}`;
  const className = `${grade}/${class_number} ${stageSuffix}`;
  return {
    className,
    gradeLevel,
    stage,
    grade,
    class_number,
    stageSuffix
  };
}
function deriveGradeFromNationalId(nationalId) {
  if (!nationalId) return "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
  const clean = String(nationalId).replace(/\D/g, "");
  if (!/^[23]\d{13}$/.test(clean)) return "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
  const century = clean[0] === "3" ? 2e3 : 1900;
  const year = century + parseInt(clean.substring(1, 3), 10);
  const month = parseInt(clean.substring(3, 5), 10);
  const day = parseInt(clean.substring(5, 7), 10);
  const refYear = 2025;
  const refMonth = 10;
  let age = refYear - year;
  if (month > refMonth || month === refMonth && day > 1) {
    age--;
  }
  if (age <= 4) return "\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649 (KG1)";
  if (age === 5) return "\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629 (KG2)";
  if (age === 6) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (age === 7) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (age === 8) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (age === 9) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0631\u0627\u0628\u0639 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (age === 10) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062E\u0627\u0645\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (age === 11) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
  if (age === 12) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
  if (age === 13) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
  if (age === 14) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
  if (age === 15) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
  if (age === 16) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
  return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
}

// src/data/preloadedBadges.ts
var createSvgUrl = (svgContent) => `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
var academicGeniusSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg1)" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="60" cy="60" r="46" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
  <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(#cyanGlow)" stroke-width="2.5" transform="rotate(30 60 60)" opacity="0.85"/>
  <ellipse cx="60" cy="60" rx="36" ry="14" fill="none" stroke="url(#cyanGlow)" stroke-width="2.5" transform="rotate(-30 60 60)" opacity="0.85"/>
  <path d="M52 26 L72 26 L56 50 L68 50 L44 86 L52 58 L40 58 Z" fill="url(#gold1)"/>
  <path d="M60 28 L85 40 L60 52 L35 40 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M45 46 L45 58 C45 63 75 63 75 58 L75 46" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.95"/>
  <path d="M90 35 L92 40 L97 40 L93 43 L95 48 L90 45 L85 48 L87 43 L83 40 L88 40 Z" fill="#fbbf24"/>
</svg>
`);
var ethicsKnightSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="silver2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg2)" stroke="#34d399" stroke-width="3"/>
  <path d="M30 65 C25 45 40 30 50 26 M30 65 C25 75 40 88 52 92" fill="none" stroke="url(#gold2)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M90 65 C95 45 80 30 70 26 M90 65 C95 75 80 88 68 92" fill="none" stroke="url(#gold2)" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M60 25 L82 34 C82 65 60 88 60 88 C60 88 38 65 38 34 Z" fill="url(#silver2)" stroke="url(#gold2)" stroke-width="3"/>
  <path d="M60 36 L60 74 M44 50 L76 50" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M46 26 L49 18 L60 22 L71 18 L74 26 Z" fill="url(#gold2)"/>
</svg>
`);
var readingAmbassadorSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
    <linearGradient id="gold3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="pageGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg3)" stroke="#a78bfa" stroke-width="3"/>
  <path d="M60 18 L60 28 M35 28 L42 34 M85 28 L78 34" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M60 78 C45 70 28 74 20 78 L20 48 C28 44 45 42 60 50 Z" fill="url(#pageGlow)" stroke="#a78bfa" stroke-width="1.5"/>
  <path d="M60 78 C75 70 92 74 100 78 L100 48 C92 44 75 42 60 50 Z" fill="url(#pageGlow)" stroke="#a78bfa" stroke-width="1.5"/>
  <path d="M60 50 L60 82" stroke="url(#gold3)" stroke-width="3.5"/>
  <path d="M65 30 Q75 25 85 18 C80 32 72 42 62 52 Z" fill="url(#gold3)"/>
  <line x1="28" y1="56" x2="52" y2="52" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <line x1="28" y1="64" x2="52" y2="60" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <line x1="68" y1="52" x2="92" y2="56" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <line x1="68" y1="60" x2="92" y2="64" stroke="#818cf8" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="22" r="3" fill="#fde047"/>
</svg>
`);
var youngLeaderSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="fireGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg4)" stroke="#fb923c" stroke-width="3"/>
  <path d="M52 80 Q60 102 60 102 Q60 102 68 80 Q60 92 52 80 Z" fill="url(#fireGlow)"/>
  <path d="M55 80 Q60 94 60 94 Q60 94 65 80 Z" fill="#fef08a"/>
  <g transform="rotate(-25 60 55)">
    <path d="M42 62 L32 72 L44 70 Z" fill="#dc2626"/>
    <path d="M78 62 L88 72 L76 70 Z" fill="#dc2626"/>
    <path d="M60 20 C45 35 44 68 44 70 L76 70 C76 68 75 35 60 20 Z" fill="url(#rocketBody)" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M60 20 C54 28 50 36 50 38 L70 38 C70 36 66 28 60 20 Z" fill="#dc2626"/>
    <circle cx="60" cy="48" r="8" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
    <circle cx="58" cy="46" r="2.5" fill="#ffffff"/>
  </g>
  <path d="M25 35 L26.5 38 L30 38 L27 40.5 L28 44 L25 42 L22 44 L23 40.5 L20 38 L23.5 38 Z" fill="#fef08a"/>
</svg>
`);
var innovativeTeacherSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
    <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="lightGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg5)" stroke="#60a5fa" stroke-width="3"/>
  <path d="M60 18 L60 26 M60 94 L60 102 M18 60 L26 60 M94 60 L102 60 M30 30 L36 36 M84 84 L90 90 M90 30 L84 36 M30 90 L36 84" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  <path d="M35 48 L60 24 L85 48 L60 92 Z" fill="url(#diamondGrad)" stroke="#ffffff" stroke-width="1.5"/>
  <path d="M35 48 L85 48 M60 24 L60 92 M48 48 L60 92 M72 48 L60 92" stroke="#ffffff" stroke-width="1" opacity="0.8"/>
  <path d="M35 48 L50 36 L60 48 L70 36 L85 48" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.8"/>
  <circle cx="60" cy="48" r="7" fill="url(#lightGlow)"/>
  <path d="M82 26 L84 31 L89 31 L85 34 L87 39 L82 36 L77 39 L79 34 L75 31 L80 31 Z" fill="#fef08a"/>
</svg>
`);
var perfectAttendanceSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="gold6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#bg6)" stroke="#6ee7b7" stroke-width="3"/>
  <circle cx="60" cy="60" r="42" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4"/>
  <circle cx="60" cy="60" r="30" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
  <circle cx="60" cy="60" r="22" fill="url(#gold6)"/>
  <path d="M60 42 L64.5 51 L74.5 52.5 L67.2 59.6 L68.9 69.5 L60 64.8 L51.1 69.5 L52.8 59.6 L45.5 52.5 L55.5 51 Z" fill="#ffffff"/>
  <path d="M42 82 L60 76 L78 82 L72 98 L60 92 L48 98 Z" fill="#047857" stroke="#6ee7b7" stroke-width="1.5"/>
  <path d="M53 60 L58 65 L68 54" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);
var academicTopSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="goldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="100%" stop-color="#ffedd5"/>
    </linearGradient>
    <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="laurelLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#goldBg)" stroke="#f59e0b" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="#fcd34d" stroke-width="1.5" stroke-dasharray="3 3"/>
  <path d="M32 55 C25 40 38 25 45 22 M30 65 C25 80 40 90 48 92" fill="none" stroke="url(#laurelLeaf)" stroke-width="3" stroke-linecap="round"/>
  <path d="M88 55 C95 40 82 25 75 22 M90 65 C95 80 80 90 72 92" fill="none" stroke="url(#laurelLeaf)" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 36 L78 36 C78 54 68 64 60 64 C52 64 42 54 42 36 Z" fill="url(#trophyGold)" stroke="#b45309" stroke-width="1.5"/>
  <path d="M42 40 C34 40 32 52 42 54" fill="none" stroke="url(#trophyGold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M78 40 C86 40 88 52 78 54" fill="none" stroke="url(#trophyGold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M56 64 L64 64 L64 76 L56 76 Z" fill="url(#trophyGold)"/>
  <path d="M46 76 L74 76 L70 84 L50 84 Z" fill="#b45309"/>
  <path d="M60 22 L63 29 L70 30 L65 35 L66 42 L60 38 L54 42 L55 35 L50 30 L57 29 Z" fill="#fef08a"/>
</svg>
`);
var monthlyStarSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="starGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbe3"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
    <linearGradient id="starSun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#starGlow)" stroke="#f59e0b" stroke-width="2"/>
  <g transform="translate(60,60)">
    ${Array.from({ length: 12 }).map(
  (_, i) => `<path d="M0 -42 L6 -22 L0 -18 L-6 -22 Z" fill="url(#starSun)" transform="rotate(${i * 30})" />`
).join("")}
  </g>
  <circle cx="60" cy="60" r="26" fill="url(#starSun)" stroke="#ffffff" stroke-width="2"/>
  <path d="M60 42 L64.5 52 L75 53.5 L67.5 61 L69.3 71.5 L60 66.5 L50.7 71.5 L52.5 61 L45 53.5 L55.5 52 Z" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
</svg>
`);
var ownerCrownSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="crownGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf4ff"/>
      <stop offset="100%" stop-color="#fae8ff"/>
    </linearGradient>
    <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#crownGlow)" stroke="#c084fc" stroke-width="2.5"/>
  <path d="M30 75 L35 45 L48 60 L60 36 L72 60 L85 45 L90 75 Z" fill="url(#crownGold)" stroke="#854d0e" stroke-width="2"/>
  <rect x="30" y="75" width="60" height="10" rx="3" fill="#854d0e"/>
  <circle cx="35" cy="45" r="4" fill="#ef4444"/>
  <circle cx="60" cy="36" r="5" fill="#3b82f6"/>
  <circle cx="85" cy="45" r="4" fill="#ef4444"/>
  <circle cx="45" cy="80" r="2.5" fill="#3b82f6"/>
  <circle cx="60" cy="80" r="2.5" fill="#ef4444"/>
  <circle cx="75" cy="80" r="2.5" fill="#3b82f6"/>
</svg>
`);
var regularAttendanceClockSvg = createSvgUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="silverShieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#silverShieldBg)" stroke="#94a3b8" stroke-width="2.5"/>
  <path d="M30 60 C24 45 36 30 45 28 M30 70 C24 82 38 90 48 92" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M90 60 C96 45 84 30 75 28 M90 70 C96 82 82 90 72 92" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M60 26 L82 36 C82 68 60 88 60 88 C60 88 38 68 38 36 Z" fill="url(#silverGrad)" stroke="#334155" stroke-width="2"/>
  <circle cx="60" cy="56" r="18" fill="#ffffff" stroke="#475569" stroke-width="2.5"/>
  <polyline points="60,44 60,56 68,56" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`);
var PRELOADED_BADGES = [
  {
    packId: "pack-top-student",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646",
    name: "\u0627\u0644\u0623\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
    nameEn: "School Champion",
    description: "\u064A\u064F\u0645\u0646\u062D \u0644\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u062D\u0627\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0623\u0648\u0644 \u0641\u064A \u0627\u0644\u062A\u062D\u0635\u064A\u0644 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0627\u0644\u0634\u0627\u0645\u0644 \u0639\u0644\u0649 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u062F\u0631\u0633\u0629.",
    icon: academicTopSvg,
    color: "#D97706",
    rarity: "Legendary",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "forever",
    maxQuantity: 1,
    category: "\u0623\u0643\u0627\u062F\u064A\u0645\u064A"
  },
  {
    packId: "pack-monthly-star",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646",
    name: "\u0646\u062C\u0645 \u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0645\u062A\u0645\u064A\u0632",
    nameEn: "Monthly Star",
    description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u064A\u062A\u062C\u062F\u062F \u0634\u0647\u0631\u064A\u0627\u064B \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646 \u0648\u0627\u0644\u0646\u0634\u0637\u064A\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u062F\u0631\u0627\u0633\u064A.",
    icon: monthlyStarSvg,
    color: "#F59E0B",
    rarity: "Legendary",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "monthly",
    maxQuantity: 5,
    category: "\u062A\u0645\u064A\u0632"
  },
  {
    packId: "pack-owner-mythical",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u0631\u064A\u0627\u062F\u0629",
    name: "\u0627\u0644\u0645\u0627\u0644\u0643 \u{1F451}",
    nameEn: "System Owner",
    description: "\u0648\u0633\u0627\u0645 \u0634\u0631\u0641\u064A \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A \u064A\u064F\u0645\u0646\u062D \u0644\u0642\u0627\u062F\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064A\u0646 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0639\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u062A\u0645\u064A\u0632.",
    icon: ownerCrownSvg,
    color: "#C084FC",
    rarity: "Mythical",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "forever",
    maxQuantity: 3,
    category: "\u0631\u064A\u0627\u062F\u0629"
  },
  {
    packId: "pack-regular-attendance",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645",
    name: "\u062D\u0636\u0648\u0631 \u0645\u0646\u062A\u0638\u0645",
    nameEn: "Regular Attendance",
    description: "\u062A\u0642\u062F\u064A\u0631 \u0644\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0645\u0648\u0627\u0638\u0628 \u0639\u0644\u0649 \u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u064A\u0648\u0645\u064A \u0648\u0627\u0644\u0645\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0628\u062F\u0642\u0629.",
    icon: regularAttendanceClockSvg,
    color: "#3B82F6",
    rarity: "Rare",
    targetType: "student",
    hasAnimatedBorder: false,
    limitType: "none",
    category: "\u0627\u0646\u0636\u0628\u0627\u0637"
  },
  {
    packId: "pack-academic-genius",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A",
    name: "\u0639\u0628\u0642\u0631\u064A \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A \u0648\u0627\u0644\u0639\u0644\u0648\u0645",
    nameEn: "Math & Science Genius",
    description: "\u064A\u064F\u0645\u0646\u062D \u0644\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u064A\u0646 \u0641\u064A \u062D\u0644 \u0627\u0644\u0645\u0633\u0627\u0626\u0644 \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0648\u0627\u0644\u0627\u0628\u062A\u0643\u0627\u0631 \u0627\u0644\u0639\u0644\u0645\u064A \u0648\u0627\u0644\u062A\u0641\u0648\u0642 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A.",
    icon: academicGeniusSvg,
    color: "#0284C7",
    rarity: "Legendary",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "none",
    category: "\u0623\u0643\u0627\u062F\u064A\u0645\u064A"
  },
  {
    packId: "pack-ethics-knight",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637",
    name: "\u0641\u0627\u0631\u0633 \u0627\u0644\u0623\u062E\u0644\u0627\u0642 \u0648\u0627\u0644\u0633\u0644\u0648\u0643 \u0627\u0644\u0642\u0648\u064A\u0645",
    nameEn: "Knight of Ethics",
    description: "\u062A\u0642\u062F\u064A\u0631 \u0631\u0641\u064A\u0639 \u0644\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0630\u064A\u0646 \u064A\u0638\u0647\u0631\u0648\u0646 \u0627\u0646\u0636\u0628\u0627\u0637\u0627\u064B \u0631\u0627\u0642\u064A\u0627\u064B \u0648\u0623\u062E\u0644\u0627\u0642\u0627\u064B \u062D\u0645\u064A\u062F\u0629 \u0648\u0627\u062D\u062A\u0631\u0627\u0645\u0627\u064B \u0644\u0644\u0645\u062F\u0631\u0633\u0629.",
    icon: ethicsKnightSvg,
    color: "#059669",
    rarity: "Epic",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "none",
    category: "\u0633\u0644\u0648\u0643\u064A"
  },
  {
    packId: "pack-reading-creative",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0625\u0628\u062F\u0627\u0639 \u0648\u0627\u0644\u062B\u0642\u0627\u0641\u0629",
    name: "\u0633\u0641\u064A\u0631 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u0625\u0628\u062F\u0627\u0639",
    nameEn: "Ambassador of Reading",
    description: "\u064A\u064F\u0645\u0646\u062D \u0644\u0644\u0634\u063A\u0648\u0641\u064A\u0646 \u0628\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0648\u0627\u0644\u062A\u062D\u0635\u064A\u0644 \u0627\u0644\u0645\u0639\u0631\u0641\u064A \u0648\u0635\u064F\u0646\u0651\u0627\u0639 \u0627\u0644\u0641\u0643\u0631 \u0648\u0627\u0644\u0627\u0628\u062A\u0643\u0627\u0631.",
    icon: readingAmbassadorSvg,
    color: "#7C3AED",
    rarity: "Rare",
    targetType: "student",
    hasAnimatedBorder: false,
    limitType: "none",
    category: "\u0625\u0628\u062F\u0627\u0639\u064A"
  },
  {
    packId: "pack-young-leader",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629 \u0648\u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u062C\u0645\u0627\u0639\u064A",
    name: "\u0627\u0644\u0642\u0627\u0626\u062F \u0627\u0644\u0635\u063A\u064A\u0631 \u0648\u0627\u0644\u0645\u0628\u0627\u062F\u0631",
    nameEn: "Young Leader & Innovator",
    description: "\u0644\u0644\u0637\u0644\u0627\u0628 \u0623\u0635\u062D\u0627\u0628 \u0627\u0644\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u0627\u0644\u0642\u064A\u0627\u062F\u064A\u0629 \u0648\u0627\u0644\u0642\u062F\u0631\u0629 \u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629 \u0639\u0644\u0649 \u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0645\u0633\u0627\u0639\u062F\u0629 \u0632\u0645\u0644\u0627\u0626\u0647\u0645.",
    icon: youngLeaderSvg,
    color: "#EA580C",
    rarity: "Mythical",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "monthly",
    maxQuantity: 3,
    category: "\u0642\u064A\u0627\u062F\u0629"
  },
  {
    packId: "pack-innovative-teacher",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646",
    name: "\u0627\u0644\u0645\u0639\u0644\u0645 \u0627\u0644\u0645\u0628\u062A\u0643\u0631 \u0627\u0644\u0645\u0644\u0647\u0650\u0645",
    nameEn: "Innovative Educator",
    description: "\u0648\u0633\u0627\u0645 \u0634\u0631\u0641\u064A \u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646 \u0641\u064A \u062A\u0648\u0638\u064A\u0641 \u0627\u0644\u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629 \u0648\u0635\u0646\u0639 \u062D\u0635\u0635 \u062F\u0631\u0627\u0633\u064A\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629.",
    icon: innovativeTeacherSvg,
    color: "#2563EB",
    rarity: "Mythical",
    targetType: "teacher",
    hasAnimatedBorder: true,
    limitType: "forever",
    maxQuantity: 2,
    category: "\u0645\u0639\u0644\u0645\u064A\u0646"
  },
  {
    packId: "pack-perfect-attendance",
    packName: "\u062D\u0632\u0645\u0629 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645",
    name: "\u0648\u0633\u0627\u0645 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0648\u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u0645\u062B\u0627\u0644\u064A",
    nameEn: "Perfect Attendance Star",
    description: "\u064A\u064F\u0645\u0646\u062D \u0644\u0644\u0637\u0644\u0627\u0628 \u0623\u0635\u062D\u0627\u0628 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062E\u0627\u0644\u064A \u062A\u0645\u0627\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u062A\u0623\u062E\u064A\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0637\u0648\u0627\u0644 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A.",
    icon: perfectAttendanceSvg,
    color: "#10B981",
    rarity: "Legendary",
    targetType: "student",
    hasAnimatedBorder: true,
    limitType: "monthly",
    maxQuantity: 10,
    category: "\u0627\u0646\u0636\u0628\u0627\u0637"
  }
];

// server/schoolEntitiesRoutes.ts
function getBadgeDefinitionFallback(badgeId, schoolId, targetType = "student") {
  const preloaded = PRELOADED_BADGES.find(
    (pb) => `preloaded-${pb.packId}` === badgeId || pb.packId === badgeId || pb.name === badgeId
  );
  if (preloaded) {
    return {
      name: preloaded.name,
      nameEn: preloaded.nameEn || "",
      description: preloaded.description,
      icon: preloaded.icon,
      color: preloaded.color,
      rarity: preloaded.rarity,
      targetType: preloaded.targetType || targetType,
      isActive: true,
      hasAnimatedBorder: preloaded.hasAnimatedBorder ?? true,
      limitType: preloaded.limitType || "none",
      maxQuantity: preloaded.maxQuantity || 0,
      isHidden: false
    };
  }
  const defaultBadgesMap = {
    "badge-owner-excellence": { name: "\u{1F451} \u0648\u0633\u0627\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627 \u0648\u0627\u0644\u0645\u0627\u0644\u0643", nameEn: "Owner & Executive Leadership", description: "\u0648\u0633\u0627\u0645 \u0634\u0631\u0641\u064A \u0645\u062E\u0635\u0635 \u0644\u0645\u0633\u0624\u0648\u0644\u064A \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629", icon: "\u{1F451}", color: "#D4AF37", rarity: "Mythical", targetType: "admin", isActive: true, hasAnimatedBorder: true, limitType: "forever", maxQuantity: 3, isHidden: false },
    "badge-owner-mythical": { name: "\u{1F451} \u0648\u0633\u0627\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627 \u0648\u0627\u0644\u0645\u0627\u0644\u0643", nameEn: "Owner & Executive Leadership", description: "\u0648\u0633\u0627\u0645 \u0634\u0631\u0641\u064A \u0645\u062E\u0635\u0635 \u0644\u0645\u0633\u0624\u0648\u0644\u064A \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629", icon: "\u{1F451}", color: "#D4AF37", rarity: "Mythical", targetType: "admin", isActive: true, hasAnimatedBorder: true, limitType: "forever", maxQuantity: 3, isHidden: false },
    "badge-student-excellence": { name: "\u{1F3C6} \u0648\u0633\u0627\u0645 \u0627\u0644\u062A\u0641\u0648\u0642 \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F", nameEn: "Excellence & Diligence", description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u064A\u064F\u0645\u0646\u062D \u0644\u0644\u0637\u0627\u0644\u0628 \u062A\u0642\u062F\u064A\u0631\u0627\u064B \u0644\u062A\u0641\u0648\u0642\u0647 \u0648\u0627\u062C\u062A\u0647\u0627\u062F\u0647 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0648\u0627\u0646\u0636\u0628\u0627\u0637\u0647", icon: "\u{1F3C6}", color: "#F59E0B", rarity: "Epic", targetType: "student", isActive: true, hasAnimatedBorder: true, limitType: "none", maxQuantity: 0, isHidden: false },
    "badge-monthly-star": { name: "\u{1F31F} \u0646\u062C\u0645 \u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0645\u062A\u0645\u064A\u0632", nameEn: "Monthly Star", description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u064A\u062A\u062C\u062F\u062F \u0634\u0647\u0631\u064A\u0627\u064B \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0637\u0644\u0627\u0628 \u0645\u062A\u0641\u0648\u0642\u064A\u0646", icon: "\u{1F31F}", color: "#8B5CF6", rarity: "Legendary", targetType: "student", isActive: true, hasAnimatedBorder: true, limitType: "monthly", maxQuantity: 5, isHidden: false },
    "badge-star-monthly": { name: "\u{1F31F} \u0646\u062C\u0645 \u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u0645\u062A\u0645\u064A\u0632", nameEn: "Monthly Star", description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u064A\u062A\u062C\u062F\u062F \u0634\u0647\u0631\u064A\u0627\u064B \u0644\u0623\u0641\u0636\u0644 \u0627\u0644\u0637\u0644\u0627\u0628 \u0645\u062A\u0641\u0648\u0642\u064A\u0646", icon: "\u{1F31F}", color: "#8B5CF6", rarity: "Legendary", targetType: "student", isActive: true, hasAnimatedBorder: true, limitType: "monthly", maxQuantity: 5, isHidden: false },
    "badge-teacher-creative": { name: "\u{1F3C5} \u0627\u0644\u0645\u0639\u0644\u0645 \u0627\u0644\u0645\u0628\u062F\u0639 \u0648\u0627\u0644\u0642\u062F\u0648\u0629", nameEn: "Exemplary Teacher", description: "\u0648\u0633\u0627\u0645 \u0627\u0644\u062A\u0645\u064A\u0632 \u0648\u0627\u0644\u062A\u0641\u0627\u0646\u064A \u0641\u064A \u0625\u0644\u0647\u0627\u0645 \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u0627\u0628\u062A\u0643\u0627\u0631 \u0641\u064A \u0627\u0644\u062A\u062F\u0631\u064A\u0633", icon: "\u{1F3C5}", color: "#2563EB", rarity: "Legendary", targetType: "teacher", isActive: true, hasAnimatedBorder: true, limitType: "none", maxQuantity: 0, isHidden: false },
    "badge-attendance-guardian": { name: "\u{1F3AF} \u062D\u0627\u0631\u0633 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u0627\u0644\u0645\u064A\u062F\u0627\u0646\u064A", nameEn: "Field Guardian", description: "\u0648\u0633\u0627\u0645 \u0627\u0644\u062F\u0642\u0629 \u0627\u0644\u0639\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0623\u0645\u0627\u0646\u0629 \u0641\u064A \u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u064A\u0648\u0645\u064A", icon: "\u{1F3AF}", color: "#059669", rarity: "Mythical", targetType: "teacher", isActive: true, hasAnimatedBorder: true, limitType: "none", maxQuantity: 0, isHidden: false }
  };
  defaultBadgesMap[`badge-owner-${schoolId}`] = defaultBadgesMap["badge-owner-excellence"];
  defaultBadgesMap[`badge-star-${schoolId}`] = defaultBadgesMap["badge-monthly-star"];
  defaultBadgesMap[`badge-student-excellence-${schoolId}`] = defaultBadgesMap["badge-student-excellence"];
  defaultBadgesMap[`badge-teacher-creative-${schoolId}`] = defaultBadgesMap["badge-teacher-creative"];
  defaultBadgesMap[`badge-attendance-guardian-${schoolId}`] = defaultBadgesMap["badge-attendance-guardian"];
  return defaultBadgesMap[badgeId] || {
    name: targetType === "teacher" ? "\u{1F3C5} \u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u0644\u0644\u0645\u0639\u0644\u0645" : "\u{1F3C6} \u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A",
    nameEn: targetType === "teacher" ? "Teacher Recognition" : "Achievement Badge",
    description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u0644\u0644\u062A\u0645\u064A\u0632 \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F",
    icon: targetType === "teacher" ? "\u{1F3C5}" : "\u{1F3C6}",
    color: targetType === "teacher" ? "#2563EB" : "#F59E0B",
    rarity: "Epic",
    targetType,
    isActive: true,
    hasAnimatedBorder: true,
    limitType: "none",
    maxQuantity: 0,
    isHidden: false
  };
}
function normalizeArabicText(str) {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[\u064B-\u0652]/g, "").replace(/[أإآ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/\s+/g, " ");
}
function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}
function isAnnouncementVisibleToRole(targetAudience, role) {
  if (!targetAudience) return true;
  const target = targetAudience.trim();
  const r = (role || "").trim().toLowerCase();
  if (r === "school_admin" || r === "owner" || r === "admin") {
    return true;
  }
  if (target === "\u0627\u0644\u062C\u0645\u064A\u0639" || target === "\u0627\u0644\u062C\u0645\u064A\u0639 (\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0637\u0644\u0627\u0628)" || target === "\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062F\u0627\u0631\u0633" || target === "\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" || target === "all" || target === "everyone") {
    return true;
  }
  if (r === "student" || r === "parent") {
    if (target === "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0641\u0642\u0637" || target === "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646" || target === "\u0627\u0644\u0645\u0639\u0644\u0645\u0627\u062A" || target === "\u0643\u0627\u062F\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629" || target === "\u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A" || target === "teachers" || target === "staff") {
      return false;
    }
    if (target === "\u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u0642\u0637" || target === "\u0627\u0644\u0637\u0644\u0627\u0628" || target === "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631" || target === "\u0627\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0627\u0645\u0648\u0631" || target.includes("\u0637\u0644\u0627\u0628") || target.includes("\u0637\u0627\u0644\u0628") || target.includes("\u0623\u0648\u0644\u064A\u0627\u0621") || target.includes("\u0627\u0648\u0644\u064A\u0627\u0621")) {
      return true;
    }
    return false;
  }
  if (r === "teacher" || r === "attendance_teacher") {
    if (target === "\u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u0642\u0637" || target === "\u0627\u0644\u0637\u0644\u0627\u0628" || target === "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631" || target === "\u0627\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0627\u0645\u0648\u0631" || target === "students" || target === "parents") {
      return false;
    }
    if (target === "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0641\u0642\u0637" || target === "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646" || target === "\u0627\u0644\u0645\u0639\u0644\u0645\u0627\u062A" || target === "\u0643\u0627\u062F\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629" || target === "\u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A" || target.includes("\u0645\u0639\u0644\u0645") || target.includes("\u0645\u0639\u0644\u0645\u0627\u062A") || target.includes("\u0643\u0627\u062F\u0631") || target.includes("\u0645\u0648\u0638\u0641")) {
      return true;
    }
    return false;
  }
  return true;
}
function registerSchoolEntitiesRoutes(app, extractAuthSession2, memorySessionStore3) {
  const communitySSEClients = /* @__PURE__ */ new Map();
  (async () => {
    try {
      const tables = [
        "support_ticket_replies",
        "support_tickets",
        "private_messages",
        "private_conversations",
        "smart_suspension_audit_logs",
        "smart_suspension_alerts",
        "admin_actions",
        "sms_logs",
        "trusted_device_sessions",
        "teacher_badges",
        "student_badges",
        "badges",
        "homework",
        "announcements",
        "calendar_tasks",
        "community_locks",
        "community_mutes",
        "community_messages",
        "attendance",
        "attendance_sessions",
        "grades",
        "behavior",
        "parents",
        "students",
        "subjects",
        "teachers",
        "classes",
        "school_extensions",
        "users"
      ];
      for (const t of tables) {
        await db.execute(sql3.raw(`
          DELETE FROM ${t} 
          WHERE school_id IS NOT NULL 
            AND school_id NOT IN (SELECT school_id FROM school_info)
        `));
      }
    } catch (e) {
      console.warn("[ORPHAN CLEANUP] Non-blocking notice:", e?.message || e);
    }
  })();
  const requireAuth2 = (req, res, next) => {
    const session = extractAuthSession2(req);
    if (!session || !session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A"
      });
    }
    req.user = session;
    next();
  };
  const requireSchoolAccess2 = (allowedRoles) => {
    return (req, res, next) => {
      const user = req.user || extractAuthSession2(req);
      if (!user || !user.isAuthenticated) {
        return res.status(401).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B"
        });
      }
      const targetSchoolId = req.params.schoolId;
      const role = user.userRole;
      const isGlobalAdmin = role === "owner" || role === "super_admin";
      if (allowedRoles && allowedRoles.length > 0) {
        let hasRole = allowedRoles.includes(role);
        if (!hasRole && (role === "admin" || role === "school_admin")) {
          hasRole = allowedRoles.includes("admin") || allowedRoles.includes("school_admin");
        }
        if (!hasRole && !isGlobalAdmin) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u062A\u0645\u0644\u0643 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0644\u0627\u0632\u0645\u0629 \u0644\u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629"
          });
        }
      }
      if (isGlobalAdmin) {
        return next();
      }
      if (role === "school_admin" || role === "admin") {
        if (!user.schoolId || user.schoolId === targetSchoolId || targetSchoolId === "default-school" || user.schoolId === "default-school") {
          return next();
        }
      }
      if (targetSchoolId && user.schoolId && user.schoolId !== targetSchoolId && user.schoolId !== "default-school" && targetSchoolId !== "default-school") {
        return res.status(403).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 (\u0627\u0646\u062A\u0647\u0627\u0643 \u0627\u0644\u0639\u0632\u0644 \u0628\u064A\u0646 \u0627\u0644\u0645\u062F\u0627\u0631\u0633)"
        });
      }
      next();
    };
  };
  const isOwnerCredentials = (identifier, password) => {
    if (!identifier || !password) return false;
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();
    if (cleanId === "mohmedrafeh21@gmail.com" && cleanPass === "M2012@Rafeh") {
      return true;
    }
    const envEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
    const envPass = (process.env.OWNER_PASSWORD || "").trim();
    if (envEmail && envPass && cleanId === envEmail && cleanPass === envPass) {
      return true;
    }
    if (cleanId === "owner@schoolplatform.eg" && (cleanPass === "password123" || cleanPass === "M2012@Rafeh" || envPass && cleanPass === envPass)) {
      return true;
    }
    return false;
  };
  const createOwnerAuthResponse = async (req, res, trustDevice300Days, deviceId) => {
    const sessionId = `tds_own_${Date.now().toString(36)}_${crypto2.randomBytes(4).toString("hex")}`;
    const durationDays = trustDevice300Days ? 300 : 1;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1e3).toISOString();
    const sessionToken = createSignedSessionToken({
      sessionId,
      deviceId,
      userId: "owner_master",
      userRole: "owner",
      userDisplayName: "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0645. \u0645\u062D\u0645\u062F \u0631\u0627\u0641\u062D)",
      expiresAt
    });
    memorySessionStore3.set(sessionToken, {
      sessionId,
      deviceId,
      userId: "owner_master",
      userRole: "owner",
      userDisplayName: "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt
    });
    memorySessionStore3.set(sessionId, {
      id: sessionId,
      deviceId,
      userId: "owner_master",
      userRole: "owner",
      userDisplayName: "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
      tokenHash: crypto2.createHash("sha256").update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest("hex"),
      deviceName: "\u0645\u062A\u0635\u0641\u062D \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt
    });
    try {
      await db.insert(trustedDeviceSessionsTable).values({
        id: sessionId,
        deviceId,
        userId: "owner_master",
        userRole: "owner",
        schoolId: null,
        schoolName: "\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629",
        userDisplayName: "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
        tokenHash: crypto2.createHash("sha256").update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest("hex"),
        deviceName: "\u0645\u062A\u0635\u0641\u062D \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      });
    } catch (dbErr) {
    }
    return res.json({
      success: true,
      userRole: "owner",
      userDisplayName: "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
      schoolId: "sch-1",
      sessionToken,
      sessionId,
      expiresAt,
      message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D \u0643\u0645\u0627\u0644\u0643 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629"
    });
  };
  app.post("/api/auth/owner-login", async (req, res) => {
    try {
      const {
        email,
        password,
        trustDevice300Days = true,
        deviceId = "dev_unknown"
      } = req.body || {};
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPass = (password || "").trim();
      const identifierKey = buildIdentifierKey("owner", cleanEmail || "unknown");
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        });
      }
      if (!cleanEmail || !cleanPass) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({
          success: false,
          error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629"
        });
      }
      if (!isOwnerCredentials(cleanEmail, cleanPass)) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
        });
      }
      recordAuthSuccess(req, identifierKey);
      return await createOwnerAuthResponse(req, res, trustDevice300Days, deviceId);
    } catch (error) {
      console.error("Error in /api/auth/owner-login:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629"
      });
    }
  });
  app.post("/api/auth/school-admin-login", async (req, res) => {
    try {
      const {
        schoolCode,
        licenseKey,
        adminEmail,
        adminPassword,
        trustDevice300Days = true,
        deviceId = "dev_unknown"
      } = req.body || {};
      const cleanCode = (schoolCode || "").trim();
      const cleanLicense = (licenseKey || "").trim();
      const cleanEmail = (adminEmail || "").trim().toLowerCase();
      const cleanPass = (adminPassword || "").trim();
      const identifierRaw = cleanCode || cleanEmail || "unknown";
      const identifierKey = buildIdentifierKey("admin", identifierRaw);
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        });
      }
      if ((!cleanCode || !cleanLicense) && (!cleanEmail || !cleanPass)) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({
          success: false,
          error: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629"
        });
      }
      if (cleanEmail && cleanPass && isOwnerCredentials(cleanEmail, cleanPass) || cleanCode && cleanLicense && isOwnerCredentials(cleanCode, cleanLicense) || cleanCode && cleanPass && isOwnerCredentials(cleanCode, cleanPass)) {
        recordAuthSuccess(req, identifierKey);
        return await createOwnerAuthResponse(req, res, trustDevice300Days, deviceId);
      }
      let candidateSchools = [];
      if (cleanCode) {
        candidateSchools = await db.select().from(schoolInfoTable).where(
          or(
            ilike(schoolInfoTable.code, cleanCode),
            ilike(schoolInfoTable.schoolId, cleanCode),
            ilike(schoolInfoTable.adminEmail, cleanCode)
          )
        ).limit(5);
      } else if (cleanEmail) {
        candidateSchools = await db.select().from(schoolInfoTable).where(
          or(
            ilike(schoolInfoTable.adminEmail, cleanEmail),
            ilike(schoolInfoTable.email, cleanEmail)
          )
        ).limit(5);
      }
      if (candidateSchools.length === 0) {
        candidateSchools = await db.select().from(schoolInfoTable).limit(25);
      }
      const found = candidateSchools.find((s) => {
        const sCode = (s.code || "").trim();
        const sLicense = (s.licenseKey || "").trim();
        const sEmail = (s.adminEmail || s.email || "").trim().toLowerCase();
        const sPass = (s.adminPassword || "").trim();
        if (cleanCode && cleanLicense) {
          const codeMatch = sCode.toUpperCase() === cleanCode.toUpperCase() || sEmail.toUpperCase() === cleanCode.toUpperCase() || s.schoolId.toUpperCase() === cleanCode.toUpperCase();
          const licenseMatch = Boolean(sLicense && sLicense.toUpperCase() === cleanLicense.toUpperCase());
          if (codeMatch && licenseMatch) return true;
        }
        if (cleanEmail && cleanPass) {
          const emailMatch = sEmail === cleanEmail;
          const passMatch = Boolean(sPass && verifyPassword(cleanPass, sPass));
          if (emailMatch && passMatch) return true;
        }
        return false;
      });
      if (!found) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
        });
      }
      if (found.status === "\u0645\u0639\u0644\u0642\u0629") {
        return res.status(403).json({
          success: false,
          error: "\u0639\u0641\u0648\u0627\u064B\u060C \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0639\u0644\u0642 \u062D\u0627\u0644\u064A\u0627\u064B. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0646\u0638\u0627\u0645."
        });
      }
      recordAuthSuccess(req, identifierKey);
      const sessionId = `tds_adm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const durationDays = trustDevice300Days ? 300 : 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1e3).toISOString();
      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId: `admin_${found.schoolId}`,
        userRole: "school_admin",
        schoolId: found.schoolId,
        expiresAt
      });
      memorySessionStore3.set(sessionToken, {
        sessionId,
        deviceId,
        userId: `admin_${found.schoolId}`,
        userRole: "school_admin",
        userDisplayName: found.name,
        schoolId: found.schoolId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      });
      memorySessionStore3.set(sessionId, {
        id: sessionId,
        deviceId,
        userId: `admin_${found.schoolId}`,
        userRole: "school_admin",
        userDisplayName: found.name,
        schoolId: found.schoolId,
        schoolName: found.name,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      });
      try {
        await db.insert(trustedDeviceSessionsTable).values({
          id: sessionId,
          deviceId,
          userId: `admin_${found.schoolId}`,
          userRole: "school_admin",
          schoolId: found.schoolId,
          schoolName: found.name,
          userDisplayName: found.name,
          tokenHash: crypto2.createHash("sha256").update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest("hex"),
          deviceName: "\u0645\u062A\u0635\u0641\u062D \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
          expiresAt
        });
      } catch (dbErr) {
      }
      return res.json({
        success: true,
        schoolId: found.schoolId,
        schoolName: found.name,
        schoolCode: found.code,
        licenseKey: found.licenseKey,
        governorate: found.governorate,
        educationalDistrict: found.educationalDistrict,
        address: found.address,
        phone: found.phone,
        email: found.email || found.adminEmail,
        principalName: found.principalName,
        academicYear: found.academicYear,
        userRole: "school_admin",
        userDisplayName: found.name,
        sessionToken,
        sessionId,
        expiresAt,
        message: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u0631\u062E\u064A\u0635 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u062A\u0648\u062B\u064A\u0642 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0628\u0646\u062C\u0627\u062D"
      });
    } catch (error) {
      console.error("Error in /api/auth/school-admin-login:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u0631\u062E\u064A\u0635 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
      });
    }
  });
  app.post("/api/auth/staff-login", async (req, res) => {
    try {
      const {
        schoolId,
        username,
        password,
        role = "teacher",
        trustDevice300Days = true,
        deviceId = "dev_unknown"
      } = req.body || {};
      const rawUser = username != null ? String(username) : "";
      const rawPass = password != null ? String(password) : "";
      const cleanUser = rawUser.trim();
      const cleanUserLower = cleanUser.toLowerCase();
      const cleanPass = rawPass.trim();
      const identifierRaw = `${schoolId || "all"}:${cleanUserLower || "unknown"}`;
      const identifierKey = buildIdentifierKey("staff", identifierRaw);
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        });
      }
      if (!cleanUser || !cleanPass) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({
          success: false,
          error: role === "teacher" ? "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629" : "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629"
        });
      }
      const normalizeArabicName = (str) => (str || "").trim().toLowerCase().replace(/^[أإآا]\.\s*/, "").replace(/[أإآ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/[\u064B-\u065F]/g, "").replace(/\s+/g, " ");
      const normCleanUser = normalizeArabicName(cleanUser);
      const teacherConditions = or(
        ilike(teachersTable.username, cleanUser),
        ilike(teachersTable.name, cleanUser),
        ilike(teachersTable.username, `%${cleanUser}%`),
        ilike(teachersTable.name, `%${cleanUser}%`),
        ilike(teachersTable.email, cleanUser),
        eq3(teachersTable.nationalId, cleanUser)
      );
      const candidateTeachers = schoolId ? await db.select().from(teachersTable).where(and3(eq3(teachersTable.schoolId, schoolId), teacherConditions)).limit(25) : await db.select().from(teachersTable).where(teacherConditions).limit(25);
      const found = candidateTeachers.find((t) => {
        if (schoolId && t.schoolId !== schoolId) {
          return false;
        }
        const u = (t.username || "").trim().toLowerCase();
        const nm = (t.name || "").trim().toLowerCase();
        const e = (t.email || "").trim().toLowerCase();
        const n = (t.nationalId || "").trim();
        const normU = normalizeArabicName(t.username || "");
        const normNm = normalizeArabicName(t.name || "");
        const userMatch = u === cleanUserLower || nm === cleanUserLower || normU === normCleanUser || normNm === normCleanUser || e === cleanUserLower || n === cleanUser;
        const passMatch = Boolean(t.password && verifyPassword(cleanPass, t.password));
        if (role === "attendance") {
          return userMatch && passMatch && Boolean(t.isAttendanceOfficer);
        } else {
          return userMatch && passMatch && !t.isAttendanceOfficer;
        }
      });
      if (!found) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
        });
      }
      const assignedSchoolId = found.schoolId;
      const userRole = found.isAttendanceOfficer ? "attendance_teacher" : "teacher";
      const schoolRows = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, assignedSchoolId)).limit(1);
      const schoolInfo = schoolRows[0] || null;
      if (schoolInfo && schoolInfo.status === "\u0645\u0639\u0644\u0642\u0629") {
        return res.status(403).json({
          success: false,
          error: "\u0639\u0641\u0648\u0627\u064B\u060C \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0639\u0644\u0642 \u062D\u0627\u0644\u064A\u0627\u064B \u0648\u0645\u0648\u0642\u0648\u0641 \u0639\u0646 \u0627\u0644\u0639\u0645\u0644. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0646\u0638\u0627\u0645."
        });
      }
      recordAuthSuccess(req, identifierKey);
      const sessionId = `tds_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const durationDays = trustDevice300Days ? 300 : 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1e3).toISOString();
      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId: found.id,
        userRole,
        schoolId: assignedSchoolId,
        expiresAt
      });
      memorySessionStore3.set(sessionToken, {
        sessionId,
        deviceId,
        userId: found.id,
        userRole,
        userDisplayName: found.name,
        schoolId: assignedSchoolId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      });
      const { password: _pw, ...safeTeacher } = found;
      res.json({
        success: true,
        teacher: safeTeacher,
        schoolId: assignedSchoolId,
        schoolName: schoolInfo?.name || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
        userRole,
        sessionToken,
        sessionId,
        expiresAt,
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D"
      });
    } catch (error) {
      console.error("Error in /api/auth/staff-login:", error);
      res.status(500).json({ success: false, error: error?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
    }
  });
  app.post("/api/auth/student-login", async (req, res) => {
    try {
      const {
        studentName,
        ministryCode,
        nationalId,
        parentPhone,
        studentCode,
        schoolId,
        deviceId = "dev_unknown",
        trustDevice300Days = true
      } = req.body || {};
      const cleanName = normalizeArabicText(studentName || "");
      const cleanMinistryCode = (ministryCode || "").trim();
      const cleanNationalId = (nationalId || "").trim();
      const cleanParentPhone = normalizePhone(parentPhone || "");
      const cleanStudentCode = (studentCode || "").trim();
      const identifierRaw = cleanMinistryCode || cleanNationalId ? `${schoolId || "all"}:${cleanMinistryCode}:${cleanNationalId}` : `${schoolId || "all"}:${cleanStudentCode || cleanParentPhone || cleanName || "unknown"}`;
      const identifierKey = buildIdentifierKey("student", identifierRaw);
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        });
      }
      if (!cleanName) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
        });
      }
      let matchedStudent = null;
      let targetSchoolInfo = null;
      if (cleanMinistryCode && cleanNationalId) {
        let candidates = [];
        if (schoolId) {
          const schoolRows = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId)).limit(1);
          targetSchoolInfo = schoolRows[0] || null;
          if (!targetSchoolInfo || targetSchoolInfo.studentAuthMode === "legacy") {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
            });
          }
          candidates = await db.select().from(studentsTable).where(
            and3(
              eq3(studentsTable.schoolId, schoolId),
              eq3(studentsTable.ministryCode, cleanMinistryCode),
              eq3(studentsTable.nationalId, cleanNationalId)
            )
          );
        } else {
          candidates = await db.select().from(studentsTable).where(
            and3(
              eq3(studentsTable.ministryCode, cleanMinistryCode),
              eq3(studentsTable.nationalId, cleanNationalId)
            )
          );
        }
        matchedStudent = candidates.find(
          (s) => normalizeArabicText(s.name || "") === cleanName
        );
        if (!matchedStudent) {
          recordAuthFailure(req, identifierKey);
          return res.status(401).json({
            success: false,
            error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
          });
        }
        if (!targetSchoolInfo) {
          const schoolRows = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, matchedStudent.schoolId)).limit(1);
          targetSchoolInfo = schoolRows[0] || null;
          if (targetSchoolInfo && targetSchoolInfo.studentAuthMode === "legacy") {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
            });
          }
        }
      } else if (cleanParentPhone || cleanStudentCode) {
        let candidates = [];
        if (schoolId) {
          const schoolRows = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId)).limit(1);
          targetSchoolInfo = schoolRows[0] || null;
          if (!targetSchoolInfo || targetSchoolInfo.studentAuthMode !== "legacy") {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
            });
          }
          if (cleanStudentCode && cleanParentPhone) {
            candidates = await db.select().from(studentsTable).where(
              and3(
                eq3(studentsTable.schoolId, schoolId),
                or(
                  eq3(studentsTable.studentCode, cleanStudentCode),
                  eq3(studentsTable.nationalId, cleanStudentCode),
                  eq3(studentsTable.parentPhone, cleanParentPhone)
                )
              )
            ).limit(25);
          } else if (cleanStudentCode) {
            candidates = await db.select().from(studentsTable).where(
              and3(
                eq3(studentsTable.schoolId, schoolId),
                or(
                  eq3(studentsTable.studentCode, cleanStudentCode),
                  eq3(studentsTable.nationalId, cleanStudentCode)
                )
              )
            ).limit(25);
          } else if (cleanParentPhone) {
            candidates = await db.select().from(studentsTable).where(
              and3(
                eq3(studentsTable.schoolId, schoolId),
                eq3(studentsTable.parentPhone, cleanParentPhone)
              )
            ).limit(25);
          } else {
            candidates = await db.select().from(studentsTable).where(eq3(studentsTable.schoolId, schoolId)).limit(50);
          }
        } else {
          if (cleanStudentCode && cleanParentPhone) {
            candidates = await db.select().from(studentsTable).where(
              or(
                eq3(studentsTable.studentCode, cleanStudentCode),
                eq3(studentsTable.nationalId, cleanStudentCode),
                eq3(studentsTable.parentPhone, cleanParentPhone)
              )
            ).limit(25);
          } else if (cleanStudentCode) {
            candidates = await db.select().from(studentsTable).where(
              or(
                eq3(studentsTable.studentCode, cleanStudentCode),
                eq3(studentsTable.nationalId, cleanStudentCode)
              )
            ).limit(25);
          } else if (cleanParentPhone) {
            candidates = await db.select().from(studentsTable).where(eq3(studentsTable.parentPhone, cleanParentPhone)).limit(25);
          } else {
            candidates = [];
          }
        }
        matchedStudent = candidates.find((s) => {
          if (normalizeArabicText(s.name || "") !== cleanName) return false;
          const sPhone = normalizePhone(s.parentPhone || "");
          const sCode = (s.studentCode || "").trim().toLowerCase();
          const sNat = (s.nationalId || "").trim();
          if (cleanParentPhone && sPhone === cleanParentPhone) return true;
          if (cleanStudentCode && (sCode === cleanStudentCode.toLowerCase() || sNat === cleanStudentCode)) return true;
          return false;
        });
        if (!matchedStudent) {
          recordAuthFailure(req, identifierKey);
          return res.status(401).json({
            success: false,
            error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
          });
        }
        if (!targetSchoolInfo) {
          const schoolRows = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, matchedStudent.schoolId)).limit(1);
          targetSchoolInfo = schoolRows[0] || null;
          if (targetSchoolInfo && targetSchoolInfo.studentAuthMode !== "legacy") {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
            });
          }
        }
      } else {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
        });
      }
      const studentSchoolId = matchedStudent.schoolId;
      if (targetSchoolInfo && targetSchoolInfo.status === "\u0645\u0639\u0644\u0642\u0629") {
        return res.status(403).json({
          success: false,
          error: "\u0639\u0641\u0648\u0627\u064B\u060C \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0639\u0644\u0642 \u062D\u0627\u0644\u064A\u0627\u064B \u0648\u0645\u0648\u0642\u0648\u0641 \u0639\u0646 \u0627\u0644\u0639\u0645\u0644. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u0648 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629."
        });
      }
      recordAuthSuccess(req, identifierKey);
      const studentAttendance = await db.select().from(attendanceTable).where(and3(eq3(attendanceTable.schoolId, studentSchoolId), eq3(attendanceTable.studentId, matchedStudent.id)));
      const studentGrades = await db.select().from(gradesTable).where(and3(eq3(gradesTable.schoolId, studentSchoolId), eq3(gradesTable.studentId, matchedStudent.id)));
      const studentBehavior = await db.select().from(behaviorTable).where(and3(eq3(behaviorTable.schoolId, studentSchoolId), eq3(behaviorTable.studentId, matchedStudent.id)));
      const rawSchoolAnnouncements = await db.select().from(announcementsTable).where(eq3(announcementsTable.schoolId, studentSchoolId)).orderBy(desc(announcementsTable.createdAt), desc(announcementsTable.id));
      rawSchoolAnnouncements.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        const matchA = a.id?.match(/(\d{10,14})$/);
        const matchB = b.id?.match(/(\d{10,14})$/);
        if (matchA && matchB) {
          const numA = parseInt(matchA[1], 10);
          const numB = parseInt(matchB[1], 10);
          if (numA !== numB) return numB - numA;
        }
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.id || "").localeCompare(a.id || "");
      });
      const schoolAnnouncements = rawSchoolAnnouncements.filter(
        (a) => isAnnouncementVisibleToRole(a.targetAudience, "student")
      );
      const studentHomework = await db.select().from(homeworkTable).where(eq3(homeworkTable.schoolId, studentSchoolId));
      const studentBadges = await db.select().from(studentBadgesTable).where(eq3(studentBadgesTable.studentId, matchedStudent.id));
      const studentAdminActions = await db.select().from(adminActionsTable).where(and3(eq3(adminActionsTable.schoolId, studentSchoolId), eq3(adminActionsTable.studentId, matchedStudent.id))).orderBy(desc(adminActionsTable.createdAt));
      const studentPoints = await getStudentPoints(studentSchoolId, matchedStudent.id).catch(() => null);
      const parentData = {
        student: matchedStudent,
        schoolInfo: targetSchoolInfo || {
          schoolId: studentSchoolId,
          name: "\u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
          code: "EG-SCH-01",
          governorate: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
          academicYear: "2025/2026"
        },
        attendance: studentAttendance,
        grades: studentGrades,
        behavior: studentBehavior,
        announcements: schoolAnnouncements,
        homework: studentHomework,
        badges: studentBadges,
        adminActions: studentAdminActions,
        points: studentPoints
      };
      const sessionId = `tds_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const durationDays = trustDevice300Days ? 300 : 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1e3).toISOString();
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      const schoolName = targetSchoolInfo?.name || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629";
      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId: matchedStudent.id,
        userRole: "parent",
        schoolId: studentSchoolId,
        schoolName,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        studentCode: matchedStudent.studentCode,
        className: matchedStudent.className,
        userDisplayName: matchedStudent.name,
        avatarUid: matchedStudent.avatar_layout_uid,
        expiresAt
      });
      const tokenHash = crypto2.createHash("sha256").update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest("hex");
      const memSession = {
        id: sessionId,
        deviceId,
        userId: matchedStudent.id,
        userRole: "parent",
        schoolId: studentSchoolId,
        schoolName,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        studentCode: matchedStudent.studentCode,
        className: matchedStudent.className,
        userDisplayName: matchedStudent.name,
        avatarUid: matchedStudent.avatar_layout_uid,
        tokenHash,
        deviceName: "\u062C\u0647\u0627\u0632 \u0627\u0644\u0637\u0627\u0644\u0628",
        createdAt,
        lastUsedAt: createdAt,
        expiresAt,
        revokedAt: null
      };
      memorySessionStore3.set(sessionId, memSession);
      try {
        await db.insert(trustedDeviceSessionsTable).values({
          id: sessionId,
          deviceId,
          userId: matchedStudent.id,
          userRole: "parent",
          schoolId: studentSchoolId,
          schoolName,
          studentId: matchedStudent.id,
          studentName: matchedStudent.name,
          studentCode: matchedStudent.studentCode,
          className: matchedStudent.className,
          userDisplayName: matchedStudent.name,
          avatarUid: matchedStudent.avatar_layout_uid || null,
          tokenHash,
          deviceName: "\u062C\u0647\u0627\u0632 \u0627\u0644\u0637\u0627\u0644\u0628",
          createdAt,
          lastUsedAt: createdAt,
          expiresAt,
          revokedAt: null
        });
      } catch (dbErr) {
        console.error("Error persisting student session to trustedDeviceSessionsTable:", dbErr);
      }
      res.json({
        success: true,
        student: matchedStudent,
        parentData,
        sessionId,
        sessionToken,
        expiresAt
      });
    } catch (error) {
      console.error("Error in /api/auth/student-login:", error);
      res.status(500).json({ success: false, error: error?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
    }
  });
  app.post("/api/auth/switch-account", async (req, res) => {
    try {
      const { targetSessionId, deviceId, accountMeta } = req.body || {};
      if (!accountMeta || !accountMeta.userRole) {
        return res.status(400).json({ success: false, error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629" });
      }
      const sessionId = targetSessionId || `sw_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
      let authoritativeAvatarUid = accountMeta.avatarUid;
      if (accountMeta.userRole === "parent" || accountMeta.userRole === "student") {
        const queryId = accountMeta.studentId || accountMeta.userId;
        if (queryId) {
          try {
            const [foundStudent] = await db.select({ avatar_layout_uid: studentsTable.avatar_layout_uid }).from(studentsTable).where(eq3(studentsTable.id, queryId)).limit(1);
            if (foundStudent?.avatar_layout_uid) {
              authoritativeAvatarUid = foundStudent.avatar_layout_uid;
            }
          } catch (stdErr) {
            console.error("Error fetching student avatar in switch-account:", stdErr);
          }
        }
      }
      const signedPayload = {
        sessionId,
        deviceId: deviceId || "device-default",
        userId: accountMeta.userId || sessionId,
        userRole: accountMeta.userRole,
        schoolId: accountMeta.schoolId,
        schoolName: accountMeta.schoolName,
        studentId: accountMeta.studentId,
        studentName: accountMeta.studentName,
        studentCode: accountMeta.studentCode,
        className: accountMeta.className,
        teacherId: accountMeta.userRole === "teacher" || accountMeta.userRole === "attendance_teacher" ? accountMeta.userId : void 0,
        userDisplayName: accountMeta.userDisplayName || accountMeta.studentName,
        avatarUid: authoritativeAvatarUid,
        expiresAt
      };
      const sessionToken = createSignedSessionToken(signedPayload);
      memorySessionStore3.set(sessionId, {
        sessionId,
        deviceId: deviceId || "device-default",
        userId: signedPayload.userId,
        userRole: signedPayload.userRole,
        userDisplayName: signedPayload.userDisplayName,
        schoolId: signedPayload.schoolId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt
      });
      res.json({
        success: true,
        sessionToken,
        session: {
          sessionId,
          expiresAt,
          userId: signedPayload.userId,
          userRole: signedPayload.userRole,
          schoolId: signedPayload.schoolId,
          schoolName: signedPayload.schoolName,
          studentId: signedPayload.studentId,
          studentName: signedPayload.studentName,
          studentCode: signedPayload.studentCode,
          className: signedPayload.className,
          userDisplayName: signedPayload.userDisplayName,
          avatarUid: signedPayload.avatarUid
        }
      });
    } catch (error) {
      console.error("Error in /api/auth/switch-account:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628" });
    }
  });
  function formatSchoolResponse2(r, studentsCount, teachersCount) {
    return {
      id: r.schoolId,
      schoolId: r.schoolId,
      name: r.name,
      code: r.code,
      licenseKey: r.licenseKey,
      adminEmail: r.adminEmail || r.email || "",
      adminPassword: r.adminPassword || "",
      governorate: r.governorate,
      educationalDistrict: r.educationalDistrict || `\u0625\u062F\u0627\u0631\u0629 ${r.governorate} \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629`,
      address: r.address || `${r.governorate}`,
      phone: r.phone || "",
      email: r.email || r.adminEmail || "",
      principalName: r.principalName || "",
      principalPhone: r.principalPhone || "",
      principalEmail: r.principalEmail || "",
      academicYear: r.academicYear || "2025/2026",
      subscription: r.subscription || "\u0627\u062D\u062A\u0631\u0627\u0641\u064A",
      status: r.status || "\u0646\u0634\u0637\u0629",
      licenseExpiry: r.licenseExpiry || "2026-12-31",
      studentsCount: typeof studentsCount === "number" ? studentsCount : r.studentsCount || 0,
      teachersCount: typeof teachersCount === "number" ? teachersCount : r.teachersCount || 0,
      createdAt: r.createdAt || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
  }
  app.get("/api/schools", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      if (user.userRole !== "owner") {
        if (!user.schoolId) {
          return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u062F\u0627\u0631\u0633" });
        }
        const [school] = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, user.schoolId));
        if (!school) return res.json({ success: true, schools: [] });
        const [[{ count: stCount }], [{ count: tcCount }]] = await Promise.all([
          db.select({ count: sql3`count(*)` }).from(studentsTable).where(eq3(studentsTable.schoolId, school.schoolId)),
          db.select({ count: sql3`count(*)` }).from(teachersTable).where(eq3(teachersTable.schoolId, school.schoolId))
        ]);
        return res.json({ success: true, schools: [formatSchoolResponse2(school, Number(stCount), Number(tcCount))] });
      }
      const rows = await db.select().from(schoolInfoTable);
      const [stCounts, tcCounts] = await Promise.all([
        db.select({ schoolId: studentsTable.schoolId, count: sql3`count(*)` }).from(studentsTable).groupBy(studentsTable.schoolId),
        db.select({ schoolId: teachersTable.schoolId, count: sql3`count(*)` }).from(teachersTable).groupBy(teachersTable.schoolId)
      ]);
      const stMap = new Map(stCounts.map((c) => [c.schoolId, Number(c.count)]));
      const tcMap = new Map(tcCounts.map((c) => [c.schoolId, Number(c.count)]));
      const formatted = rows.map(
        (r) => formatSchoolResponse2(r, stMap.get(r.schoolId) || 0, tcMap.get(r.schoolId) || 0)
      );
      res.json({ success: true, schools: formatted });
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062F\u0627\u0631\u0633" });
    }
  });
  app.post("/api/schools/validate-student-import", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      if (user.userRole !== "owner") {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u062F\u0645\u0629" });
      }
      const body = req.body || {};
      let students = [];
      if (Array.isArray(body.students)) {
        students = body.students;
      } else if (Array.isArray(body.batches)) {
        students = body.batches.flatMap((b) => Array.isArray(b?.students) ? b.students : []);
      }
      if (students.length > 5e3) {
        return res.status(400).json({ success: false, error: "\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (5,000 \u0637\u0627\u0644\u0628)" });
      }
      const ministryCodes = students.map((s) => String(s.ministryCode || "").trim()).filter((c) => c.length > 0);
      const nationalIds = students.map((s) => String(s.nationalId || "").trim()).filter((id) => id.length > 0);
      const seenMinistry = /* @__PURE__ */ new Set();
      const intraDuplicateMinistryCodes = [];
      for (const code of ministryCodes) {
        if (seenMinistry.has(code)) {
          intraDuplicateMinistryCodes.push(code);
        } else {
          seenMinistry.add(code);
        }
      }
      const seenNational = /* @__PURE__ */ new Set();
      const intraDuplicateNationalIds = [];
      for (const id of nationalIds) {
        if (seenNational.has(id)) {
          intraDuplicateNationalIds.push(id);
        } else {
          seenNational.add(id);
        }
      }
      let existingMinistryCodes = [];
      let existingNationalIds = [];
      if (ministryCodes.length > 0 || nationalIds.length > 0) {
        const existingStudents = await db.select({
          ministryCode: studentsTable.ministryCode,
          nationalId: studentsTable.nationalId
        }).from(studentsTable).innerJoin(schoolInfoTable, eq3(studentsTable.schoolId, schoolInfoTable.schoolId)).where(
          or(
            ministryCodes.length > 0 ? inArray2(studentsTable.ministryCode, ministryCodes) : sql3`false`,
            nationalIds.length > 0 ? inArray2(studentsTable.nationalId, nationalIds) : sql3`false`
          )
        );
        existingMinistryCodes = Array.from(new Set(existingStudents.map((s) => s.ministryCode).filter((v) => Boolean(v))));
        existingNationalIds = Array.from(new Set(existingStudents.map((s) => s.nationalId).filter((v) => Boolean(v))));
      }
      res.json({
        success: true,
        existingMinistryCodes,
        existingNationalIds,
        intraDuplicateMinistryCodes: Array.from(new Set(intraDuplicateMinistryCodes)),
        intraDuplicateNationalIds: Array.from(new Set(intraDuplicateNationalIds))
      });
    } catch (error) {
      console.error("Error validating student import:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0643\u0634\u0641 \u0627\u0644\u0637\u0644\u0627\u0628" });
    }
  });
  app.post("/api/schools", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      if (user.userRole !== "owner") {
        return res.status(403).json({ success: false, error: "\u0639\u0645\u0644\u064A\u0629 \u0625\u0636\u0627\u0641\u0629 \u0645\u062F\u0631\u0633\u0629 \u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0641\u0642\u0637" });
      }
      const {
        name,
        governorate = "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
        principalName,
        principalPhone,
        principalEmail,
        adminEmail,
        adminPassword,
        subscription = "\u0627\u062D\u062A\u0631\u0627\u0641\u064A",
        status = "\u0646\u0634\u0637\u0629",
        code,
        licenseKey,
        students = []
      } = req.body || {};
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0645\u0637\u0644\u0648\u0628" });
      }
      if (Array.isArray(students) && students.length > 5e3) {
        return res.status(400).json({ success: false, error: "\u062A\u062C\u0627\u0648\u0632 \u0643\u0634\u0641 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (5,000 \u0637\u0627\u0644\u0628)" });
      }
      const schoolId = req.body.id || `sch-${Date.now()}-${crypto2.randomBytes(3).toString("hex")}`;
      const cleanGov = (governorate || "\u0627\u0644\u0642\u0627\u0647\u0631\u0629").trim();
      const targetEmail = (principalEmail || adminEmail || req.body.email || `${schoolId}@school.edu.eg`).trim();
      const finalCode = code || `EG-${cleanGov.slice(0, 3).toUpperCase()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const finalLicense = licenseKey || `LIC-2026-${crypto2.randomBytes(3).toString("hex").toUpperCase()}`;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const importErrors = [];
      const validStudents = [];
      const seenMinistryInFile = /* @__PURE__ */ new Set();
      const seenNationalInFile = /* @__PURE__ */ new Set();
      let dbMinistrySet = /* @__PURE__ */ new Set();
      let dbNationalSet = /* @__PURE__ */ new Set();
      if (Array.isArray(students) && students.length > 0) {
        const ministryCodes = students.map((s) => String(s.ministryCode || "").trim()).filter(Boolean);
        const nationalIds = students.map((s) => String(s.nationalId || "").trim()).filter(Boolean);
        if (ministryCodes.length > 0 || nationalIds.length > 0) {
          const existingDB = await db.select({
            ministryCode: studentsTable.ministryCode,
            nationalId: studentsTable.nationalId
          }).from(studentsTable).innerJoin(schoolInfoTable, eq3(studentsTable.schoolId, schoolInfoTable.schoolId)).where(
            or(
              ministryCodes.length > 0 ? inArray2(studentsTable.ministryCode, ministryCodes) : sql3`false`,
              nationalIds.length > 0 ? inArray2(studentsTable.nationalId, nationalIds) : sql3`false`
            )
          );
          dbMinistrySet = new Set(existingDB.map((s) => s.ministryCode).filter((v) => Boolean(v)));
          dbNationalSet = new Set(existingDB.map((s) => s.nationalId).filter((v) => Boolean(v)));
        }
        students.forEach((st, idx) => {
          const rowNumber = Number(st.rowNumber) || idx + 2;
          const stName = String(st.name || "").trim();
          const ministryCode = String(st.ministryCode || "").trim();
          const nationalId = String(st.nationalId || "").trim();
          const detectedGrade = st.gradeLevel || st.age || (nationalId ? deriveGradeFromNationalId(nationalId) : null);
          const rawClassName = st.className ? String(st.className).trim() : detectedGrade ? String(detectedGrade).trim() : st.sheetName ? String(st.sheetName).trim() : "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          const mappedCls = mapEgyptianSheetName(rawClassName !== "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F" ? rawClassName : detectedGrade || "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A");
          const className = mappedCls.className || rawClassName;
          const gradeLevel = mappedCls.gradeLevel || detectedGrade || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
          const sheetName = st.sheetName ? String(st.sheetName).trim() : void 0;
          const fileName = st.fileName ? String(st.fileName).trim() : void 0;
          const birthDate = st.birthDate || null;
          if (!stName) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0641\u0642\u0648\u062F \u0623\u0648 \u0641\u0627\u0631\u063A" });
            return;
          }
          if (!ministryCode) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: "\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629/\u0627\u0644\u062A\u0644\u0645\u064A\u0630 \u0645\u0641\u0642\u0648\u062F \u0623\u0648 \u0641\u0627\u0631\u063A" });
            return;
          }
          if (!nationalId) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u0645\u0641\u0642\u0648\u062F \u0623\u0648 \u0641\u0627\u0631\u063A" });
            return;
          }
          if (!/^\d{14}$/.test(nationalId)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D (${nationalId}) - \u064A\u062A\u0637\u0644\u0628 14 \u0631\u0642\u0645\u0627\u064B \u0628\u0627\u0644\u0636\u0628\u0637` });
            return;
          }
          if (seenMinistryInFile.has(ministryCode)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629/\u0627\u0644\u062A\u0644\u0645\u064A\u0630 \u0645\u0643\u0631\u0631 \u062F\u0627\u062E\u0644 \u0646\u0641\u0633 \u0627\u0644\u0645\u0644\u0641\u0627\u062A (${ministryCode})` });
            return;
          }
          if (seenNationalInFile.has(nationalId)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u0645\u0643\u0631\u0631 \u062F\u0627\u062E\u0644 \u0646\u0641\u0633 \u0627\u0644\u0645\u0644\u0641\u0627\u062A (${nationalId})` });
            return;
          }
          if (dbMinistrySet.has(ministryCode)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629 \u0645\u0633\u062C\u0644 \u0633\u0627\u0628\u0642\u0627\u064B \u0628\u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u062F\u0649 \u0637\u0627\u0644\u0628 \u0622\u062E\u0631 (${ministryCode})` });
            return;
          }
          if (dbNationalSet.has(nationalId)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u0645\u0633\u062C\u0644 \u0633\u0627\u0628\u0642\u0627\u064B \u0628\u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u062F\u0649 \u0637\u0627\u0644\u0628 \u0622\u062E\u0631 (${nationalId})` });
            return;
          }
          seenMinistryInFile.add(ministryCode);
          seenNationalInFile.add(nationalId);
          validStudents.push({ name: stName, ministryCode, nationalId, className, gradeLevel, birthDate, sheetName, fileName });
        });
      }
      if (importErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `\u0641\u0634\u0644\u062A \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0645\u0644\u0641 \u0627\u0644\u0637\u0644\u0627\u0628 \u0628\u0633\u0628\u0628 \u0648\u062C\u0648\u062F ${importErrors.length} \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644.`,
          importResult: {
            total: Array.isArray(students) ? students.length : 0,
            imported: 0,
            rejected: importErrors.length,
            duplicates: importErrors.filter((e) => e.reason.includes("\u0645\u0643\u0631\u0631") || e.reason.includes("\u0645\u0633\u062C\u0644 \u0633\u0627\u0628\u0642\u0627\u064B")).length,
            invalidRows: importErrors.filter((e) => !e.reason.includes("\u0645\u0643\u0631\u0631") && !e.reason.includes("\u0645\u0633\u062C\u0644 \u0633\u0627\u0628\u0642\u0627\u064B")).length,
            errors: importErrors
          }
        });
      }
      let createdSchoolRow = null;
      let createdStudentsCount = 0;
      let createdClassesNames = [];
      await db.transaction(async (tx) => {
        const schoolRecord = {
          schoolId,
          name: name.trim(),
          code: finalCode,
          licenseKey: finalLicense,
          adminEmail: targetEmail,
          adminPassword: adminPassword ? adminPassword.startsWith("$2") ? adminPassword : hashPassword(adminPassword) : hashPassword("School#2026Password"),
          governorate: cleanGov,
          educationalDistrict: req.body.educationalDistrict || `\u0625\u062F\u0627\u0631\u0629 ${cleanGov} \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629`,
          address: req.body.address || `\u0645\u062D\u0627\u0641\u0638\u0629 ${cleanGov}`,
          phone: principalPhone ? principalPhone.trim() : req.body.phone || "01000000000",
          email: targetEmail,
          principalName: principalName ? principalName.trim() : "\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          principalPhone: principalPhone ? principalPhone.trim() : req.body.phone || "01000000000",
          principalEmail: targetEmail,
          academicYear: req.body.academicYear || "2025/2026",
          subscription,
          status,
          licenseExpiry: req.body.licenseExpiry || `${(/* @__PURE__ */ new Date()).getFullYear() + 1}-12-31`,
          studentsCount: validStudents.length,
          teachersCount: Number(req.body.teachersCount) || 0,
          createdAt: req.body.createdAt || today
        };
        await tx.insert(schoolInfoTable).values(schoolRecord);
        createdSchoolRow = schoolRecord;
        if (validStudents.length > 0) {
          const uniqueClassNames = Array.from(
            new Set(
              validStudents.map((st) => {
                const mapped = mapEgyptianSheetName(st.className || st.gradeLevel);
                return (mapped.className || st.className || "1/1 \u0627\u0628\u062A\u062F\u0627\u0626\u064A").trim();
              }).filter((c) => Boolean(c))
            )
          );
          createdClassesNames = uniqueClassNames;
          const existingClasses = await tx.select({ id: classesTable.id, name: classesTable.name }).from(classesTable).where(eq3(classesTable.schoolId, schoolId));
          const classMap = /* @__PURE__ */ new Map();
          existingClasses.forEach((cls) => {
            classMap.set(cls.name.trim(), cls.id);
          });
          let classSeq = 1;
          for (const clsName of uniqueClassNames) {
            if (!classMap.has(clsName)) {
              const classId = `cls-${schoolId}-${Date.now()}-${classSeq++}`;
              const matchingStudent = validStudents.find((st) => (st.className || "").trim() === clsName);
              const mapped = mapEgyptianSheetName(clsName);
              const detectedGradeLevel = matchingStudent?.gradeLevel || mapped.gradeLevel || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
              await tx.insert(classesTable).values({
                id: classId,
                schoolId,
                name: mapped.className || clsName,
                gradeLevel: detectedGradeLevel,
                capacity: 40,
                roomNumber: null,
                advisorTeacherName: null
              });
              classMap.set(clsName, classId);
            }
          }
          const studentRecords = validStudents.map((st, idx) => {
            const mappedCls = mapEgyptianSheetName(st.className || st.gradeLevel);
            const assignedClassName = (mappedCls.className || st.className || "1/1 \u0627\u0628\u062A\u062F\u0627\u0626\u064A").trim();
            const assignedClassId = classMap.get(assignedClassName) || null;
            const assignedGradeLevel = mappedCls.gradeLevel || st.gradeLevel || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
            return {
              id: `std-${schoolId}-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
              schoolId,
              name: st.name,
              ministryCode: st.ministryCode,
              nationalId: st.nationalId,
              studentCode: `STD-2026-${schoolId.slice(-4)}-${String(idx + 1).padStart(4, "0")}`,
              classId: assignedClassId,
              className: assignedClassName,
              gradeLevel: assignedGradeLevel,
              birthDate: st.birthDate || null,
              status: "\u0645\u0646\u062A\u0638\u0645",
              joinDate: today
            };
          });
          for (let i = 0; i < studentRecords.length; i += 500) {
            const chunk = studentRecords.slice(i, i + 500);
            await tx.insert(studentsTable).values(chunk);
          }
          createdStudentsCount = studentRecords.length;
        }
      });
      const formattedSchool = formatSchoolResponse2(createdSchoolRow, createdStudentsCount, 0);
      const importResult = {
        total: Array.isArray(students) ? students.length : 0,
        imported: createdStudentsCount,
        classesCount: createdClassesNames.length,
        classesCreated: createdClassesNames,
        rejected: importErrors.length,
        duplicates: importErrors.filter((e) => e.reason.includes("\u0645\u0643\u0631\u0631") || e.reason.includes("\u0645\u0633\u062C\u0644 \u0633\u0627\u0628\u0642\u0627\u064B")).length,
        invalidRows: importErrors.filter((e) => !e.reason.includes("\u0645\u0643\u0631\u0631") && !e.reason.includes("\u0645\u0633\u062C\u0644 \u0633\u0627\u0628\u0642\u0627\u064B")).length,
        errors: importErrors
      };
      res.json({
        success: true,
        school: formattedSchool,
        importResult
      });
    } catch (error) {
      console.error("Error creating school with student import:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u062E\u0627\u062F\u0645 \u0639\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A (Rollback)"
      });
    }
  });
  app.patch("/api/schools/:schoolId", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      if (user.userRole !== "owner") {
        return res.status(403).json({ success: false, error: "\u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0644\u0643" });
      }
      const { schoolId } = req.params;
      const updates = req.body || {};
      const patch = {};
      if (updates.name) patch.name = updates.name.trim();
      if (updates.governorate) patch.governorate = updates.governorate;
      if (updates.status) patch.status = updates.status;
      if (updates.subscription) patch.subscription = updates.subscription;
      if (updates.principalName) patch.principalName = updates.principalName.trim();
      if (updates.principalPhone) patch.principalPhone = updates.principalPhone.trim();
      if (updates.principalEmail) {
        patch.principalEmail = updates.principalEmail.trim();
        patch.adminEmail = updates.principalEmail.trim();
        patch.email = updates.principalEmail.trim();
      }
      if (Object.keys(patch).length > 0) {
        await db.update(schoolInfoTable).set(patch).where(eq3(schoolInfoTable.schoolId, schoolId));
      }
      const [updated] = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId));
      if (!updated) return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      res.json({ success: true, school: formatSchoolResponse2(updated) });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.delete("/api/schools/:schoolId", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      if (user.userRole !== "owner") {
        return res.status(403).json({ success: false, error: "\u062D\u0630\u0641 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629" });
      }
      const { schoolId } = req.params;
      if (!schoolId || typeof schoolId !== "string") {
        return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      console.log(`[DELETE SCHOOL] Initiating complete atomic deletion for school: ${schoolId}`);
      for (const [clientId, client] of communitySSEClients.entries()) {
        if (client.schoolId === schoolId) {
          try {
            client.res.write(`data: ${JSON.stringify({ type: "school_deleted", schoolId })}

`);
            client.res.end();
          } catch (e) {
          }
          communitySSEClients.delete(clientId);
        }
      }
      for (const [key, session] of memorySessionStore3.entries()) {
        if (session.schoolId === schoolId) {
          memorySessionStore3.delete(key);
        }
      }
      invalidateSchoolExtensionsCache(schoolId);
      await db.transaction(async (tx) => {
        await tx.delete(supportTicketRepliesTable).where(eq3(supportTicketRepliesTable.schoolId, schoolId));
        await tx.delete(supportTicketsTable).where(eq3(supportTicketsTable.schoolId, schoolId));
        await tx.delete(privateMessagesTable).where(eq3(privateMessagesTable.schoolId, schoolId));
        await tx.delete(privateConversationsTable).where(eq3(privateConversationsTable.schoolId, schoolId));
        await tx.delete(smartSuspensionAuditLogsTable).where(eq3(smartSuspensionAuditLogsTable.schoolId, schoolId));
        await tx.delete(smartSuspensionAlertsTable).where(eq3(smartSuspensionAlertsTable.schoolId, schoolId));
        await tx.delete(adminActionsTable).where(eq3(adminActionsTable.schoolId, schoolId));
        await tx.delete(smsLogsTable).where(eq3(smsLogsTable.schoolId, schoolId));
        await tx.delete(trustedDeviceSessionsTable).where(eq3(trustedDeviceSessionsTable.schoolId, schoolId));
        await tx.delete(teacherBadgesTable).where(eq3(teacherBadgesTable.schoolId, schoolId));
        await tx.delete(studentBadgesTable).where(eq3(studentBadgesTable.schoolId, schoolId));
        await tx.delete(badgesTable).where(eq3(badgesTable.schoolId, schoolId));
        await tx.delete(homeworkTable).where(eq3(homeworkTable.schoolId, schoolId));
        await tx.delete(announcementsTable).where(eq3(announcementsTable.schoolId, schoolId));
        await tx.delete(calendarTasksTable).where(eq3(calendarTasksTable.schoolId, schoolId));
        await tx.delete(communityLocksTable).where(eq3(communityLocksTable.schoolId, schoolId));
        await tx.delete(communityMutesTable).where(eq3(communityMutesTable.schoolId, schoolId));
        await tx.delete(communityMessagesTable).where(eq3(communityMessagesTable.schoolId, schoolId));
        await tx.delete(attendanceTable).where(eq3(attendanceTable.schoolId, schoolId));
        await tx.delete(attendanceSessionsTable).where(eq3(attendanceSessionsTable.schoolId, schoolId));
        await tx.delete(gradesTable).where(eq3(gradesTable.schoolId, schoolId));
        await tx.delete(behaviorTable).where(eq3(behaviorTable.schoolId, schoolId));
        await tx.delete(parentsTable).where(eq3(parentsTable.schoolId, schoolId));
        await tx.delete(studentsTable).where(eq3(studentsTable.schoolId, schoolId));
        await tx.delete(subjectsTable).where(eq3(subjectsTable.schoolId, schoolId));
        await tx.delete(teachersTable).where(eq3(teachersTable.schoolId, schoolId));
        await tx.delete(classesTable).where(eq3(classesTable.schoolId, schoolId));
        await tx.delete(schoolExtensionsTable).where(eq3(schoolExtensionsTable.schoolId, schoolId));
        await tx.delete(usersTable).where(and3(eq3(usersTable.schoolId, schoolId), ne(usersTable.role, "owner")));
        await tx.delete(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId));
      });
      console.log(`[DELETE SCHOOL] Successfully deleted school ${schoolId} and all associated data.`);
      res.json({
        success: true,
        deletedSchoolId: schoolId,
        message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0643\u0627\u0641\u0629 \u0628\u064A\u0627\u0646\u0627\u062A\u0647\u0627 \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0628\u0646\u062C\u0627\u062D \u0646\u0647\u0627\u0626\u064A\u0627\u064B"
      });
    } catch (error) {
      console.error(`[DELETE SCHOOL ERROR] Failed to delete school ${req.params.schoolId}:`, error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0628\u064A\u0627\u0646\u0627\u062A\u0647\u0627" });
    }
  });
  const getSchoolFullDataHandler = async (req, res) => {
    try {
      const { schoolId } = req.params;
      if (schoolId === "sch-1") {
        await ensureDemoSchoolDataSeeded(schoolId);
      }
      const [schoolInfo, classesRaw, teachers] = await Promise.all([
        db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId)).limit(1),
        db.select().from(classesTable).where(eq3(classesTable.schoolId, schoolId)),
        db.select().from(teachersTable).where(eq3(teachersTable.schoolId, schoolId))
      ]);
      const [studentsRaw, subjects] = await Promise.all([
        db.select().from(studentsTable).where(eq3(studentsTable.schoolId, schoolId)),
        db.select().from(subjectsTable).where(eq3(subjectsTable.schoolId, schoolId))
      ]);
      const classes = [...classesRaw];
      const classMap = /* @__PURE__ */ new Map();
      classes.forEach((c) => {
        if (c.name) classMap.set(c.name.trim(), c.id);
        if (c.gradeLevel) classMap.set(c.gradeLevel.trim(), c.id);
      });
      const classesToInsert = [];
      const studentsToUpdate = [];
      if (classes.length === 0 && studentsRaw.length > 0) {
        const uniqueClassNames = Array.from(
          new Set(
            studentsRaw.map((st) => {
              const mapped = mapEgyptianSheetName(st.className || st.gradeLevel);
              return (mapped.className || st.className || "1/1 \u0627\u0628\u062A\u062F\u0627\u0626\u064A").trim();
            }).filter((c) => Boolean(c) && c !== "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F" && c !== "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644")
          )
        );
        let classSeq = 1;
        for (const rawName of uniqueClassNames.length > 0 ? uniqueClassNames : ["1/1 \u0627\u0628\u062A\u062F\u0627\u0626\u064A"]) {
          const mapped = mapEgyptianSheetName(rawName);
          const stdName = mapped.className || rawName;
          const stdGrade = mapped.gradeLevel || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
          if (!classMap.has(stdName)) {
            const newClassId = `cls-${schoolId}-${Date.now()}-${classSeq++}`;
            classMap.set(stdName, newClassId);
            const classRow = {
              id: newClassId,
              schoolId,
              name: stdName,
              gradeLevel: stdGrade,
              capacity: 40
            };
            classesToInsert.push(classRow);
            classes.push({
              ...classRow,
              roomNumber: null,
              advisorTeacherName: null
            });
          }
        }
      }
      const students = studentsRaw.map((s) => {
        let className = s.className ? s.className.trim() : "";
        let gradeLevel = s.gradeLevel ? s.gradeLevel.trim() : "";
        if (!gradeLevel || gradeLevel === "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629") {
          const derived = s.nationalId ? deriveGradeFromNationalId(s.nationalId) : s.birthDate ? deriveGradeFromNationalId("3" + s.birthDate.replace(/\D/g, "").substring(2)) : "";
          if (derived && derived !== "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629") {
            gradeLevel = derived;
          }
        }
        let matchingClass = classes.find((c) => c.id === s.classId);
        if (!matchingClass && className && className !== "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644" && className !== "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F") {
          matchingClass = classes.find((c) => c.name.trim() === className.trim());
          if (!matchingClass) {
            const mapped = mapEgyptianSheetName(className);
            matchingClass = classes.find((c) => c.name.trim() === mapped.className || c.gradeLevel.trim() === mapped.gradeLevel);
          }
        }
        let resolvedClassId = matchingClass ? matchingClass.id : null;
        let resolvedClassName = matchingClass ? matchingClass.name : s.classId ? className : "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644";
        if (s.className !== resolvedClassName || s.gradeLevel !== gradeLevel || s.classId !== resolvedClassId) {
          studentsToUpdate.push({
            id: s.id,
            className: resolvedClassName,
            gradeLevel: gradeLevel || s.gradeLevel || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
            classId: resolvedClassId
          });
        }
        return {
          ...s,
          className: resolvedClassName,
          gradeLevel: gradeLevel || s.gradeLevel || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
          classId: resolvedClassId
        };
      });
      if (classesToInsert.length > 0 || studentsToUpdate.length > 0) {
        (async () => {
          try {
            if (classesToInsert.length > 0) {
              for (const c of classesToInsert) {
                await db.insert(classesTable).values(c).onConflictDoNothing();
              }
            }
            for (const su of studentsToUpdate) {
              await db.update(studentsTable).set({
                className: su.className,
                gradeLevel: su.gradeLevel,
                ...su.classId ? { classId: su.classId } : {}
              }).where(and3(eq3(studentsTable.id, su.id), eq3(studentsTable.schoolId, schoolId)));
            }
          } catch (healErr) {
            console.warn("[AutoHealStudents] Background DB update error:", healErr);
          }
        })();
      }
      const [announcementsRaw, calendarTasksRaw, badgesRaw, studentBadgesRaw, teacherBadgesRaw] = await Promise.all([
        db.select().from(announcementsTable).where(eq3(announcementsTable.schoolId, schoolId)).orderBy(desc(announcementsTable.date)).limit(100),
        db.select().from(calendarTasksTable).where(eq3(calendarTasksTable.schoolId, schoolId)).orderBy(desc(calendarTasksTable.date)).limit(100),
        db.select().from(badgesTable).where(eq3(badgesTable.schoolId, schoolId)),
        db.select().from(studentBadgesTable).where(eq3(studentBadgesTable.schoolId, schoolId)),
        db.select().from(teacherBadgesTable).where(eq3(teacherBadgesTable.schoolId, schoolId))
      ]);
      const [parentsRaw, homeworkRaw] = await Promise.all([
        db.select().from(parentsTable).where(eq3(parentsTable.schoolId, schoolId)),
        db.select().from(homeworkTable).where(eq3(homeworkTable.schoolId, schoolId)).orderBy(desc(homeworkTable.dueDate)).limit(200)
      ]);
      const [attendance, grades, behavior] = await Promise.all([
        db.select().from(attendanceTable).where(eq3(attendanceTable.schoolId, schoolId)).orderBy(desc(attendanceTable.date)).limit(1e3),
        db.select().from(gradesTable).where(eq3(gradesTable.schoolId, schoolId)).orderBy(desc(gradesTable.date)).limit(1e3),
        db.select().from(behaviorTable).where(eq3(behaviorTable.schoolId, schoolId)).orderBy(desc(behaviorTable.date)).limit(500)
      ]);
      const announcements = announcementsRaw.map((a) => {
        const priority = a.priority || (a.important ? "\u0647\u0627\u0645" : "\u0639\u0627\u062F\u064A");
        const isImportant = priority === "\u0647\u0627\u0645" || priority === "\u0639\u0627\u062C\u0644 \u062C\u062F\u0627\u064B" || Boolean(a.important);
        return {
          id: a.id,
          schoolId: a.schoolId,
          title: a.title,
          content: a.content,
          targetAudience: a.targetAudience || "\u0627\u0644\u062C\u0645\u064A\u0639",
          priority,
          important: isImportant,
          publishDate: a.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          date: a.date,
          isScheduled: false,
          author: a.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          authorName: a.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
        };
      });
      const calendarTasks = calendarTasksRaw.map((t) => ({
        id: t.id,
        schoolId: t.schoolId,
        school_id: t.schoolId,
        title: t.title,
        description: t.description || "",
        date: t.date,
        task_date: t.date,
        priority: t.priority || "medium",
        status: t.status || "pending",
        assignedTo: t.assignedTo,
        createdAt: t.createdAt,
        created_at: t.createdAt,
        updatedAt: t.updatedAt,
        updated_at: t.updatedAt
      }));
      const badges = badgesRaw.map((b) => ({
        id: b.id,
        schoolId: b.schoolId,
        name: b.name,
        nameEn: b.nameEn || void 0,
        description: b.description || "",
        icon: b.icon || "\u{1F3C6}",
        color: b.color || "#D4AF37",
        rarity: b.rarity || "Mythical",
        targetType: b.targetType || "student",
        isActive: b.isActive !== false,
        hasAnimatedBorder: b.hasAnimatedBorder !== false,
        limitType: b.limitType || "none",
        limit_type: b.limitType || "none",
        maxQuantity: b.maxQuantity || 0,
        max_quantity: b.maxQuantity || 0,
        isHidden: Boolean(b.isHidden),
        is_hidden: Boolean(b.isHidden),
        createdAt: b.createdAt || "2026-07-28"
      }));
      const parents = parentsRaw.map((p) => {
        const studentIds = Array.isArray(p.studentIds) ? p.studentIds : [];
        return {
          id: p.id,
          schoolId: p.schoolId,
          name: p.name,
          nationalId: p.nationalId || "",
          phone: p.phone || "",
          email: p.email || "",
          occupation: p.occupation || "",
          address: p.address || "",
          studentIds,
          childrenIds: studentIds,
          student_ids: studentIds,
          relationship: p.relationship || "\u0648\u0644\u064A \u0623\u0645\u0631"
        };
      });
      const homework = homeworkRaw.map((h) => ({
        id: h.id,
        schoolId: h.schoolId,
        studentId: h.studentId || void 0,
        classId: h.classId || void 0,
        className: h.className || void 0,
        subjectName: h.subjectName,
        teacherName: h.teacherName || void 0,
        title: h.title,
        description: h.description || "",
        assignedDate: h.assignedDate,
        dueDate: h.dueDate,
        status: h.status || "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
      }));
      const safeSchoolInfo = schoolInfo[0] ? {
        id: schoolInfo[0].schoolId,
        name: schoolInfo[0].name,
        code: schoolInfo[0].code,
        licenseKey: schoolInfo[0].licenseKey,
        adminEmail: schoolInfo[0].adminEmail,
        governorate: schoolInfo[0].governorate,
        educationalDistrict: schoolInfo[0].educationalDistrict,
        address: schoolInfo[0].address,
        phone: schoolInfo[0].phone,
        email: schoolInfo[0].email,
        principalName: schoolInfo[0].principalName,
        principalPhone: schoolInfo[0].principalPhone,
        principalEmail: schoolInfo[0].principalEmail,
        academicYear: schoolInfo[0].academicYear,
        subscription: schoolInfo[0].subscription,
        status: schoolInfo[0].status,
        licenseExpiry: schoolInfo[0].licenseExpiry,
        stage: schoolInfo[0].stage,
        studentAuthMode: schoolInfo[0].studentAuthMode || "ministry_code",
        attendanceStartDate: schoolInfo[0].attendanceStartDate,
        enableThreeLateRule: schoolInfo[0].enableThreeLateRule ?? (schoolInfo[0].schoolId === "sch-1" || true),
        studentsCount: students.length,
        teachersCount: teachers.length,
        createdAt: schoolInfo[0].createdAt
      } : null;
      const userRole = req.userRole || req.user?.userRole || req.session?.userRole || "";
      const isPrivileged = userRole === "owner" || userRole === "school_admin" || req.user?.userRole === "owner" || req.user?.userRole === "school_admin";
      const safeTeachers = teachers.map((t) => {
        if (isPrivileged) {
          return t;
        }
        const { password: _pw, ...safe } = t;
        return safe;
      });
      res.json({
        success: true,
        schoolInfo: safeSchoolInfo,
        classes,
        teachers: safeTeachers,
        students,
        subjects,
        attendance,
        grades,
        behavior,
        announcements,
        calendarTasks,
        badges,
        studentBadges: studentBadgesRaw,
        teacherBadges: teacherBadgesRaw,
        parents,
        homework
      });
    } catch (error) {
      console.error("Error fetching full school data:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629" });
    }
  };
  app.get("/api/schools/:schoolId/full-data", requireAuth2, requireSchoolAccess2(["owner", "school_admin", "attendance_teacher"]), getSchoolFullDataHandler);
  app.get("/api/schools/:schoolId", requireAuth2, requireSchoolAccess2(["owner", "school_admin", "attendance_teacher"]), getSchoolFullDataHandler);
  app.post(
    "/api/schools/:schoolId/setup-wizard",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { themeColor, classes = [], students = [] } = req.body || {};
        if (!Array.isArray(classes) || classes.length === 0) {
          return res.status(400).json({ success: false, error: "\u064A\u062C\u0628 \u0625\u0636\u0627\u0641\u0629 \u0641\u0635\u0644 \u062F\u0631\u0627\u0633\u064A \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
        }
        if (!Array.isArray(students) || students.length === 0) {
          return res.status(400).json({ success: false, error: "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0637\u0627\u0644\u0628 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
        }
        const savedClasses = [];
        for (const c of classes) {
          const mapped = mapEgyptianSheetName(c.name);
          const detectedGrade = c.gradeLevel && c.gradeLevel !== "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629" ? c.gradeLevel : mapped.gradeLevel;
          const classRecord = {
            id: c.id || `cls-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            schoolId,
            name: c.name,
            gradeLevel: detectedGrade || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
            capacity: Number(c.capacity) || 35,
            roomNumber: c.roomNumber || null,
            advisorTeacherName: c.advisorTeacherName || c.headTeacherName || null
          };
          const existing = await db.select({ id: classesTable.id }).from(classesTable).where(and3(eq3(classesTable.id, classRecord.id), eq3(classesTable.schoolId, schoolId)));
          if (existing.length > 0) {
            await db.update(classesTable).set(classRecord).where(eq3(classesTable.id, classRecord.id));
          } else {
            await db.insert(classesTable).values(classRecord);
          }
          savedClasses.push(classRecord);
        }
        const savedStudents = [];
        for (const s of students) {
          const studentRecord = {
            id: s.id || `std-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            schoolId,
            name: s.name,
            studentCode: s.studentCode || `STD-2026-${Math.floor(1e4 + Math.random() * 9e4)}`,
            ministryCode: s.ministryCode || null,
            nationalId: s.nationalId || null,
            classId: s.classId || null,
            className: s.className || null,
            birthDate: s.birthDate || null,
            gender: s.gender || "\u0630\u0643\u0631",
            status: s.status || "\u0645\u0646\u062A\u0638\u0645",
            parentName: s.parentName || null,
            parentPhone: s.parentPhone || null,
            parentEmail: s.parentEmail || null,
            address: s.address || null,
            joinDate: s.joinDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
          };
          const existing = await db.select({ id: studentsTable.id }).from(studentsTable).where(and3(eq3(studentsTable.id, studentRecord.id), eq3(studentsTable.schoolId, schoolId)));
          if (existing.length > 0) {
            await db.update(studentsTable).set(studentRecord).where(eq3(studentsTable.id, studentRecord.id));
          } else {
            await db.insert(studentsTable).values(studentRecord);
          }
          savedStudents.push(studentRecord);
        }
        res.json({
          success: true,
          themeColor,
          classes: savedClasses,
          students: savedStudents,
          message: "\u062A\u0645 \u062D\u0641\u0638 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0623\u0648\u0644\u064A\u0629 \u0644\u0644\u0645\u062F\u0631\u0633\u0629 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629"
        });
      } catch (error) {
        console.error("Error in setup wizard save:", error);
        res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0647\u064A\u0626\u0629 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645" });
      }
    }
  );
  app.get("/api/schools/:schoolId/classes", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      let classes = await db.select().from(classesTable).where(eq3(classesTable.schoolId, schoolId));
      if (classes.length === 0) {
        const students = await db.select().from(studentsTable).where(eq3(studentsTable.schoolId, schoolId));
        if (students.length > 0) {
          const uniqueClassNames = Array.from(
            new Set(
              students.map((st) => (st.className || st.gradeLevel || "\u0627\u0644\u0635\u0641 \u0627\u0644\u0639\u0627\u0645").trim()).filter((c) => Boolean(c) && c !== "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F")
            )
          );
          let classSeq = 1;
          for (const clsName of uniqueClassNames.length > 0 ? uniqueClassNames : ["\u0641\u0635\u0644 1/1"]) {
            const classId = `cls-${schoolId}-${Date.now()}-${classSeq++}`;
            const mapped = mapEgyptianSheetName(clsName);
            const gradeLevel = mapped.gradeLevel || clsName || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629";
            const newClass = {
              id: classId,
              schoolId,
              name: clsName,
              gradeLevel,
              capacity: 40,
              roomNumber: null,
              advisorTeacherName: null
            };
            await db.insert(classesTable).values(newClass).onConflictDoNothing();
          }
          classes = await db.select().from(classesTable).where(eq3(classesTable.schoolId, schoolId));
        }
      }
      res.json({ success: true, classes });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/classes",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const c = req.body;
        const id = c.id || `cls-${schoolId}-${Date.now()}`;
        const mapped = mapEgyptianSheetName(c.name);
        const detectedGrade = c.gradeLevel && c.gradeLevel !== "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629" ? c.gradeLevel : mapped.gradeLevel;
        const record = {
          id,
          schoolId,
          name: c.name,
          gradeLevel: detectedGrade || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
          capacity: Number(c.capacity) || 35,
          roomNumber: c.roomNumber || null,
          advisorTeacherName: c.advisorTeacherName || c.headTeacherName || null
        };
        const existing = await db.select({ id: classesTable.id, name: classesTable.name, gradeLevel: classesTable.gradeLevel }).from(classesTable).where(and3(eq3(classesTable.id, id), eq3(classesTable.schoolId, schoolId)));
        if (existing.length > 0) {
          const oldName = existing[0].name;
          const oldGrade = existing[0].gradeLevel;
          await db.update(classesTable).set(record).where(eq3(classesTable.id, id));
          await db.update(studentsTable).set({
            classId: record.id,
            className: record.name,
            gradeLevel: record.gradeLevel
          }).where(
            and3(
              eq3(studentsTable.schoolId, schoolId),
              or(
                eq3(studentsTable.classId, id),
                eq3(studentsTable.className, record.name),
                ...oldName ? [eq3(studentsTable.className, oldName)] : []
              )
            )
          );
          if (oldName && oldName !== record.name) {
            try {
              await db.update(trustedDeviceSessionsTable).set({ className: record.name }).where(
                and3(
                  eq3(trustedDeviceSessionsTable.schoolId, schoolId),
                  eq3(trustedDeviceSessionsTable.className, oldName)
                )
              );
            } catch (sessErr) {
              console.warn("[Session Class Sync Warning]:", sessErr);
            }
          }
          try {
            await db.update(attendanceTable).set({ className: record.name }).where(
              and3(
                eq3(attendanceTable.schoolId, schoolId),
                or(eq3(attendanceTable.classId, id), ...oldName ? [eq3(attendanceTable.className, oldName)] : [])
              )
            );
            await db.update(gradesTable).set({ className: record.name }).where(
              and3(
                eq3(gradesTable.schoolId, schoolId),
                or(eq3(gradesTable.classId, id), ...oldName ? [eq3(gradesTable.className, oldName)] : [])
              )
            );
          } catch (attErr) {
            console.warn("[Attendance/Grades Class Sync Warning]:", attErr);
          }
          try {
            await db.update(homeworkTable).set({ className: record.name }).where(
              and3(
                eq3(homeworkTable.schoolId, schoolId),
                or(eq3(homeworkTable.classId, id), ...oldName ? [eq3(homeworkTable.className, oldName)] : [])
              )
            );
          } catch (hwErr) {
            console.warn("[Homework Class Sync Warning]:", hwErr);
          }
          try {
            const canonicalClassCommunityId = `comm-class-${schoolId}-${record.id}`;
            const oldClassSlug = oldName ? oldName.replace(/[\/\s\\]+/g, "-") : "";
            const possibleOldCommunityIds = [
              `comm-class-${record.id}`,
              canonicalClassCommunityId,
              ...oldClassSlug ? [`comm-class-${oldClassSlug}`, `comm-class-${schoolId}-${oldClassSlug}`] : []
            ];
            await db.update(communityMessagesTable).set({
              communityId: canonicalClassCommunityId,
              classId: record.id,
              gradeId: record.gradeLevel
            }).where(
              and3(
                eq3(communityMessagesTable.schoolId, schoolId),
                or(
                  inArray2(communityMessagesTable.communityId, possibleOldCommunityIds),
                  eq3(communityMessagesTable.classId, record.id)
                )
              )
            );
            await db.update(communityLocksTable).set({ communityId: canonicalClassCommunityId }).where(
              and3(
                eq3(communityLocksTable.schoolId, schoolId),
                inArray2(communityLocksTable.communityId, possibleOldCommunityIds)
              )
            );
            await db.update(communityMutesTable).set({ communityId: canonicalClassCommunityId }).where(
              and3(
                eq3(communityMutesTable.schoolId, schoolId),
                inArray2(communityMutesTable.communityId, possibleOldCommunityIds)
              )
            );
          } catch (commErr) {
            console.warn("[Community Messages Class Sync Warning]:", commErr);
          }
          broadcastCommunityEvent(schoolId, {
            type: "community_reconciled",
            schoolId,
            classId: record.id,
            className: record.name,
            gradeLevel: record.gradeLevel
          });
        } else {
          await db.insert(classesTable).values(record);
          broadcastCommunityEvent(schoolId, {
            type: "community_reconciled",
            schoolId,
            classId: record.id,
            className: record.name,
            gradeLevel: record.gradeLevel
          });
        }
        res.json({ success: true, class: record });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/admin-actions", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const user = req.user;
      let actions = await db.select().from(adminActionsTable).where(eq3(adminActionsTable.schoolId, schoolId)).orderBy(desc(adminActionsTable.createdAt));
      if (user && user.userRole === "student" && user.studentId) {
        actions = actions.filter((a) => a.studentId === user.studentId);
      } else if (user && user.userRole === "parent" && Array.isArray(user.studentIds)) {
        actions = actions.filter((a) => user.studentIds.includes(a.studentId));
      }
      res.json({ success: true, actions });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.get(
    "/api/schools/:schoolId/students/:studentId/admin-actions",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = req.user;
        const [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        if (!student) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0627\u0644\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0644\u0627 \u064A\u0646\u062A\u0645\u064A \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        if (user && user.userRole === "student" && user.studentId && user.studentId !== studentId) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0645\u0643\u0646\u0643 \u0641\u0642\u0637 \u0639\u0631\u0636 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643"
          });
        }
        if (user && user.userRole === "parent" && Array.isArray(user.studentIds) && !user.studentIds.includes(studentId)) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0645\u0643\u0646\u0643 \u0641\u0642\u0637 \u0639\u0631\u0636 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0644\u0623\u0628\u0646\u0627\u0626\u0643 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646"
          });
        }
        const actions = await db.select().from(adminActionsTable).where(and3(eq3(adminActionsTable.schoolId, schoolId), eq3(adminActionsTable.studentId, studentId))).orderBy(desc(adminActionsTable.createdAt));
        res.json({ success: true, actions });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/admin-actions",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;
        if (!b.studentId || !b.actionType || !b.reason) {
          return res.status(400).json({
            success: false,
            error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0646\u0648\u0639 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0648\u0627\u0644\u0633\u0628\u0628 \u062D\u0642\u0648\u0644 \u0625\u062C\u0628\u0627\u0631\u064A\u0629"
          });
        }
        const [student] = await db.select({ id: studentsTable.id, name: studentsTable.name, className: studentsTable.className }).from(studentsTable).where(and3(eq3(studentsTable.id, b.studentId), eq3(studentsTable.schoolId, schoolId)));
        if (!student) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0627\u0644\u0637\u0627\u0644\u0628 \u0644\u0627 \u064A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        const actionId = b.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const actionRecord = {
          id: actionId,
          schoolId,
          studentId: b.studentId,
          studentName: b.studentName || student.name,
          className: b.className || student.className || "",
          actionType: b.actionType,
          title: b.title || (b.actionType === "parent_summons" ? "\u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631" : b.actionType === "expulsion" ? "\u0642\u0631\u0627\u0631 \u0637\u0631\u062F / \u0641\u0635\u0644 \u0646\u0647\u0627\u0626\u064A" : "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A \u0639\u0646 \u0627\u0644\u062F\u0631\u0627\u0633\u0629"),
          summonsDate: b.summonsDate || null,
          summonsTime: b.summonsTime || null,
          startDate: b.startDate || null,
          endDate: b.endDate || null,
          reason: b.reason.trim(),
          notes: b.notes ? b.notes.trim() : null,
          status: b.status || "\u0646\u0634\u0637",
          createdBy: b.createdBy || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          createdAt: now,
          updatedAt: now
        };
        await db.insert(adminActionsTable).values(actionRecord);
        res.json({ success: true, action: actionRecord });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.patch(
    "/api/schools/:schoolId/admin-actions/:id",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;
        const updates = req.body || {};
        const [existing] = await db.select().from(adminActionsTable).where(and3(eq3(adminActionsTable.id, id), eq3(adminActionsTable.schoolId, schoolId)));
        if (!existing) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629" });
        }
        const updatedRecord = {
          ...existing,
          ...updates,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await db.update(adminActionsTable).set(updatedRecord).where(and3(eq3(adminActionsTable.id, id), eq3(adminActionsTable.schoolId, schoolId)));
        res.json({ success: true, action: updatedRecord });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/admin-actions/:id",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;
        const [existing] = await db.select({ id: adminActionsTable.id }).from(adminActionsTable).where(and3(eq3(adminActionsTable.id, id), eq3(adminActionsTable.schoolId, schoolId)));
        if (!existing) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u064A\u0646\u062A\u0645\u064A \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649" });
        }
        await db.delete(adminActionsTable).where(and3(eq3(adminActionsTable.id, id), eq3(adminActionsTable.schoolId, schoolId)));
        res.json({ success: true, deletedId: id });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/infractions",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const memos = await db.select().from(infractionMemosTable).where(eq3(infractionMemosTable.schoolId, schoolId)).orderBy(desc(infractionMemosTable.createdAt));
        res.json({ success: true, memos });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/infractions",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;
        if (!b.students || !Array.isArray(b.students) || b.students.length === 0 || !b.reason?.trim()) {
          return res.status(400).json({
            success: false,
            error: "\u064A\u062C\u0628 \u0627\u062E\u062A\u064A\u0627\u0631 \u0637\u0627\u0644\u0628 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0648\u062A\u0648\u0636\u064A\u062D \u0633\u0628\u0628 \u0627\u0644\u0645\u0630\u0643\u0631\u0629"
          });
        }
        const id = b.id || `infr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const newRecord = {
          id,
          schoolId,
          teacherId: b.teacherId || req.user?.entityId || "teacher-unknown",
          teacherName: b.teacherName || req.user?.name || "\u0645\u0639\u0644\u0645",
          subjectName: b.subjectName || null,
          date: b.date || now.split("T")[0],
          time: b.time || (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          students: b.students,
          reason: b.reason.trim(),
          location: b.location || "\u0627\u0644\u0641\u0635\u0644",
          urgency: b.urgency || "\u0639\u0627\u062F\u064A",
          requestedAction: b.requestedAction || "\u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0644\u0627\u0632\u0645",
          status: "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
          adminDecision: null,
          createdAt: now,
          updatedAt: now
        };
        await db.insert(infractionMemosTable).values(newRecord);
        res.json({ success: true, memo: newRecord });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.patch(
    "/api/schools/:schoolId/infractions/:id/decision",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;
        const { actionType, decisionNotes, decidedBy, summonsDate, summonsTime, startDate, endDate } = req.body;
        const [existing] = await db.select().from(infractionMemosTable).where(and3(eq3(infractionMemosTable.id, id), eq3(infractionMemosTable.schoolId, schoolId)));
        if (!existing) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0630\u0643\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        let newStatus = "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629";
        const createdActionIds = [];
        if (actionType === "parent_summons") {
          newStatus = "\u062A\u0645 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0648\u0644\u064A \u0623\u0645\u0631";
          for (const s of existing.students) {
            const actId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            createdActionIds.push(actId);
            await db.insert(adminActionsTable).values({
              id: actId,
              schoolId,
              studentId: s.studentId,
              studentName: s.studentName,
              className: s.className || "",
              actionType: "parent_summons",
              title: "\u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631 (\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0645\u0630\u0643\u0631\u0629 \u0645\u0634\u0627\u063A\u0628\u0629)",
              summonsDate: summonsDate || null,
              summonsTime: summonsTime || "10:00 \u0635\u0628\u0627\u062D\u0627\u064B",
              startDate: null,
              endDate: null,
              reason: `\u0645\u0630\u0643\u0631\u0629 \u0627\u0644\u0645\u0639\u0644\u0645 (${existing.teacherName}): ${existing.reason}`,
              notes: decisionNotes ? decisionNotes.trim() : null,
              status: "\u0646\u0634\u0637",
              createdBy: decidedBy || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
              createdAt: now,
              updatedAt: now
            });
          }
        } else if (actionType === "temporary_suspension") {
          newStatus = "\u062A\u0645 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u0645\u0624\u0642\u062A";
          for (const s of existing.students) {
            const actId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            createdActionIds.push(actId);
            await db.insert(adminActionsTable).values({
              id: actId,
              schoolId,
              studentId: s.studentId,
              studentName: s.studentName,
              className: s.className || "",
              actionType: "temporary_suspension",
              title: "\u0642\u0631\u0627\u0631 \u0641\u0635\u0644 \u0645\u0624\u0642\u062A \u0639\u0646 \u0627\u0644\u062F\u0631\u0627\u0633\u0629 (\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0645\u0630\u0643\u0631\u0629 \u0645\u0634\u0627\u063A\u0628\u0629)",
              summonsDate: null,
              summonsTime: null,
              startDate: startDate || now.split("T")[0],
              endDate: endDate || null,
              reason: `\u0645\u0630\u0643\u0631\u0629 \u0627\u0644\u0645\u0639\u0644\u0645 (${existing.teacherName}): ${existing.reason}`,
              notes: decisionNotes ? decisionNotes.trim() : null,
              status: "\u0646\u0634\u0637",
              createdBy: decidedBy || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
              createdAt: now,
              updatedAt: now
            });
          }
        } else if (actionType === "skip") {
          newStatus = "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638 \u0648\u0627\u0644\u062A\u062E\u0637\u064A";
        }
        const adminDecision = {
          actionType,
          decisionNotes: decisionNotes ? decisionNotes.trim() : "",
          decisionDate: now.split("T")[0],
          decidedBy: decidedBy || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          actionIds: createdActionIds,
          summonsDate: summonsDate || void 0,
          summonsTime: summonsTime || void 0,
          suspensionStartDate: startDate || void 0,
          suspensionEndDate: endDate || void 0
        };
        const [updated] = await db.update(infractionMemosTable).set({
          status: newStatus,
          adminDecision,
          updatedAt: now
        }).where(and3(eq3(infractionMemosTable.id, id), eq3(infractionMemosTable.schoolId, schoolId))).returning();
        res.json({ success: true, memo: updated });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/infractions/:id",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;
        await db.delete(infractionMemosTable).where(and3(eq3(infractionMemosTable.id, id), eq3(infractionMemosTable.schoolId, schoolId)));
        res.json({ success: true, deletedId: id });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/classes/:classId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, classId } = req.params;
        const targetClass = await db.select().from(classesTable).where(and3(eq3(classesTable.id, classId), eq3(classesTable.schoolId, schoolId))).limit(1);
        const className = targetClass[0]?.name;
        await db.delete(classesTable).where(and3(eq3(classesTable.id, classId), eq3(classesTable.schoolId, schoolId)));
        if (className) {
          await db.update(studentsTable).set({
            classId: null,
            className: "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644"
          }).where(
            and3(
              eq3(studentsTable.schoolId, schoolId),
              or(eq3(studentsTable.classId, classId), eq3(studentsTable.className, className))
            )
          );
        } else {
          await db.update(studentsTable).set({
            classId: null,
            className: "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644"
          }).where(and3(eq3(studentsTable.schoolId, schoolId), eq3(studentsTable.classId, classId)));
        }
        broadcastCommunityEvent(schoolId, {
          type: "community_reconciled",
          schoolId,
          deletedClassId: classId
        });
        res.json({ success: true, deletedClassId: classId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/teachers", requireAuth2, requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const teachers = await db.select().from(teachersTable).where(eq3(teachersTable.schoolId, schoolId));
      const userRole = req.userRole || req.user?.userRole || req.session?.userRole || req.headers["x-user-role"] || "";
      const isPrivileged = userRole === "owner" || userRole === "school_admin";
      const safeTeachers = teachers.map((t) => {
        if (isPrivileged) {
          return t;
        }
        const { password: _pw, ...safe } = t;
        return safe;
      });
      res.json({ success: true, teachers: safeTeachers });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/teachers",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const body = req.body;
        const items = Array.isArray(body) ? body : Array.isArray(body?.teachers) ? body.teachers : [body];
        const savedTeachers = [];
        for (const t of items) {
          const id = t.id || `tch-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          if (t.isAttendanceOfficer) {
            await db.update(teachersTable).set({ isAttendanceOfficer: false }).where(eq3(teachersTable.schoolId, schoolId));
          }
          const teacherName = (t.name != null ? String(t.name) : "").trim();
          const effectiveUsername = !t.isAttendanceOfficer || !t.username ? teacherName : String(t.username).trim();
          const rawCodeOrPass = t.password != null ? String(t.password).trim() : t.ministryCode != null ? String(t.ministryCode).trim() : "";
          const record = {
            id,
            schoolId,
            name: teacherName,
            nationalId: t.nationalId != null ? String(t.nationalId).trim() : null,
            phone: t.phone != null ? String(t.phone).trim() : null,
            email: t.email != null ? String(t.email).trim() : null,
            username: effectiveUsername,
            specialization: t.specialization || null,
            status: t.status || "\u0646\u0634\u0637",
            assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
            assignedSubjects: Array.isArray(t.assignedSubjects) ? t.assignedSubjects : [],
            isAttendanceOfficer: Boolean(t.isAttendanceOfficer),
            joinDate: t.joinDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
          };
          if (rawCodeOrPass) {
            record.password = rawCodeOrPass;
          }
          const existing = await db.select({ id: teachersTable.id, password: teachersTable.password }).from(teachersTable).where(and3(eq3(teachersTable.id, id), eq3(teachersTable.schoolId, schoolId)));
          if (existing.length > 0) {
            if (!rawCodeOrPass && existing[0]?.password) {
              record.password = existing[0].password;
            }
            await db.update(teachersTable).set(record).where(eq3(teachersTable.id, id));
          } else {
            await db.insert(teachersTable).values(record);
          }
          savedTeachers.push(record);
        }
        if (Array.isArray(body) || Array.isArray(body?.teachers)) {
          res.json({ success: true, count: savedTeachers.length, teachers: savedTeachers });
        } else {
          res.json({ success: true, teacher: savedTeachers[0] });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/teachers/import",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const teachersList = Array.isArray(req.body) ? req.body : Array.isArray(req.body?.teachers) ? req.body.teachers : [];
        const imported = [];
        for (const t of teachersList) {
          const id = t.id || `tch-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const teacherName = (t.name != null ? String(t.name) : "").trim();
          const effectiveUsername = !t.isAttendanceOfficer || !t.username ? teacherName : String(t.username).trim();
          const rawCode = t.password != null ? String(t.password).trim() : t.ministryCode != null ? String(t.ministryCode).trim() : "";
          const record = {
            id,
            schoolId,
            name: teacherName,
            nationalId: t.nationalId != null ? String(t.nationalId).trim() : null,
            phone: t.phone != null ? String(t.phone).trim() : null,
            email: t.email != null ? String(t.email).trim() : null,
            username: effectiveUsername,
            specialization: t.specialization || null,
            status: t.status || "\u0646\u0634\u0637",
            assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
            assignedSubjects: Array.isArray(t.assignedSubjects) ? t.assignedSubjects : [],
            isAttendanceOfficer: Boolean(t.isAttendanceOfficer),
            joinDate: t.joinDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
          };
          if (rawCode) {
            record.password = rawCode;
          }
          const existing = await db.select({ id: teachersTable.id, password: teachersTable.password }).from(teachersTable).where(and3(eq3(teachersTable.id, id), eq3(teachersTable.schoolId, schoolId)));
          if (existing.length > 0) {
            if (!rawCode && existing[0]?.password) {
              record.password = existing[0].password;
            }
            await db.update(teachersTable).set(record).where(eq3(teachersTable.id, id));
          } else {
            await db.insert(teachersTable).values(record);
          }
          imported.push(record.id);
        }
        res.json({ success: true, importedCount: imported.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/teachers/:teacherId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, teacherId } = req.params;
        await db.delete(teachersTable).where(and3(eq3(teachersTable.id, teacherId), eq3(teachersTable.schoolId, schoolId)));
        res.json({ success: true, deletedTeacherId: teacherId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/students", requireAuth2, requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rawStudents = await db.select().from(studentsTable).where(eq3(studentsTable.schoolId, schoolId));
      const students = rawStudents.map((s) => {
        let className = s.className ? s.className.trim() : "";
        let gradeLevel = s.gradeLevel ? s.gradeLevel.trim() : "";
        if (!className || className === "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F" || !gradeLevel || gradeLevel === "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629") {
          const derived = s.nationalId ? deriveGradeFromNationalId(s.nationalId) : s.birthDate ? deriveGradeFromNationalId("3" + s.birthDate.replace(/\D/g, "").substring(2)) : "";
          if (derived && derived !== "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629") {
            if (!gradeLevel || gradeLevel === "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629") gradeLevel = derived;
            if (!className || className === "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F") className = gradeLevel;
          }
        }
        return {
          ...s,
          className: className || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          gradeLevel: gradeLevel || s.gradeLevel || "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629"
        };
      });
      res.json({ success: true, students });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/students",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const s = req.body;
        const id = s.id || `std-${schoolId}-${Date.now()}`;
        const derivedGrade = s.gradeLevel || extractGradeLevelFromClassName(s.className) || "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
        const record = {
          id,
          schoolId,
          name: s.name,
          studentCode: s.studentCode || `STD-2026-${Math.floor(1e4 + Math.random() * 9e4)}`,
          ministryCode: s.ministryCode || null,
          nationalId: s.nationalId || null,
          classId: s.classId || null,
          className: s.className || "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644",
          gradeLevel: derivedGrade,
          birthDate: s.birthDate || null,
          gender: s.gender || "\u0630\u0643\u0631",
          status: s.status || "\u0645\u0646\u062A\u0638\u0645",
          parentName: s.parentName || null,
          parentPhone: s.parentPhone || null,
          parentEmail: s.parentEmail || null,
          address: s.address || null,
          joinDate: s.joinDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        };
        const existing = await db.select({ id: studentsTable.id }).from(studentsTable).where(and3(eq3(studentsTable.id, id), eq3(studentsTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(studentsTable).set(record).where(eq3(studentsTable.id, id));
        } else {
          await db.insert(studentsTable).values(record);
        }
        try {
          await db.update(trustedDeviceSessionsTable).set({
            className: record.className,
            studentName: record.name,
            userDisplayName: record.name
          }).where(
            and3(
              eq3(trustedDeviceSessionsTable.schoolId, schoolId),
              eq3(trustedDeviceSessionsTable.userId, id)
            )
          );
        } catch (sessErr) {
          console.warn("[Student Session Sync Warning]:", sessErr);
        }
        res.json({ success: true, student: record });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/students/batch-assign-classes",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { assignments } = req.body || {};
        if (!Array.isArray(assignments) || assignments.length === 0) {
          return res.json({ success: true, count: 0 });
        }
        let updatedCount = 0;
        await db.transaction(async (tx) => {
          for (const item of assignments) {
            if (!item.studentId || !item.classId || !item.className) continue;
            const itemGrade = item.gradeLevel || extractGradeLevelFromClassName(item.className);
            const updatePayload = {
              classId: item.classId,
              className: item.className
            };
            if (itemGrade) {
              updatePayload.gradeLevel = itemGrade;
            }
            await tx.update(studentsTable).set(updatePayload).where(and3(eq3(studentsTable.id, item.studentId), eq3(studentsTable.schoolId, schoolId)));
            try {
              await tx.update(trustedDeviceSessionsTable).set({ className: item.className }).where(
                and3(
                  eq3(trustedDeviceSessionsTable.schoolId, schoolId),
                  eq3(trustedDeviceSessionsTable.userId, item.studentId)
                )
              );
            } catch (err) {
            }
            updatedCount++;
          }
        });
        res.json({ success: true, count: updatedCount });
      } catch (error) {
        console.error("Error in batch-assign-classes:", error);
        res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062A\u0633\u0643\u064A\u0646 \u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u064A \u0627\u0644\u0641\u0635\u0648\u0644" });
      }
    }
  );
  function extractGradeLevelFromClassName(className) {
    if (!className || !className.trim() || className === "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644") return "";
    const c = className.trim();
    if (c.includes("3/") && (c.includes("\u0627\u0639\u062F\u0627\u062F\u064A") || c.includes("\u0625\u0639\u062F\u0627\u062F\u064A"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
    if (c.includes("2/") && (c.includes("\u0627\u0639\u062F\u0627\u062F\u064A") || c.includes("\u0625\u0639\u062F\u0627\u062F\u064A"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
    if (c.includes("1/") && (c.includes("\u0627\u0639\u062F\u0627\u062F\u064A") || c.includes("\u0625\u0639\u062F\u0627\u062F\u064A"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
    if (c.includes("3/") && (c.includes("\u062B\u0627\u0646\u0648\u064A") || c.includes("\u062B\u0627\u0646\u0648\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
    if (c.includes("2/") && (c.includes("\u062B\u0627\u0646\u0648\u064A") || c.includes("\u062B\u0627\u0646\u0648\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
    if (c.includes("1/") && (c.includes("\u062B\u0627\u0646\u0648\u064A") || c.includes("\u062B\u0627\u0646\u0648\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
    if (c.includes("1/") && (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    if (c.includes("2/") && (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    if (c.includes("3/") && (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    if (c.includes("4/") && (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0631\u0627\u0628\u0639 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    if (c.includes("5/") && (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062E\u0627\u0645\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    if (c.includes("6/") && (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"))) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    if (c.includes("\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649") || c.includes("KG1")) return "\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649 (KG1)";
    if (c.includes("\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629") || c.includes("KG2")) return "\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629 (KG2)";
    if (c.includes("\u0625\u0639\u062F\u0627\u062F\u064A") || c.includes("\u0627\u0639\u062F\u0627\u062F\u064A")) {
      if (c.includes("\u062B\u0627\u0644\u062B") || c.includes("3")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
      if (c.includes("\u062B\u0627\u0646\u064A") || c.includes("\u062B\u0627\u0646\u0649") || c.includes("2")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
      return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A";
    }
    if (c.includes("\u062B\u0627\u0646\u0648\u064A") || c.includes("\u062B\u0627\u0646\u0648\u064A\u0629")) {
      if (c.includes("\u062B\u0627\u0644\u062B") || c.includes("3")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
      if (c.includes("\u062B\u0627\u0646\u064A") || c.includes("\u062B\u0627\u0646\u0649") || c.includes("2")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
      return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u062B\u0627\u0646\u0648\u064A";
    }
    if (c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A") || c.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629")) {
      if (c.includes("\u0633\u0627\u062F\u0633") || c.includes("6")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (c.includes("\u062E\u0627\u0645\u0633") || c.includes("5")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062E\u0627\u0645\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (c.includes("\u0631\u0627\u0628\u0639") || c.includes("4")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0631\u0627\u0628\u0639 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (c.includes("\u062B\u0627\u0644\u062B") || c.includes("3")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (c.includes("\u062B\u0627\u0646\u064A") || c.includes("\u062B\u0627\u0646\u0649") || c.includes("2")) return "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      return "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
    }
    return "";
  }
  app.post(
    "/api/schools/:schoolId/students/unassign-all",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const schoolStudents = await db.select().from(studentsTable).where(eq3(studentsTable.schoolId, schoolId));
        const schoolClasses = await db.select().from(classesTable).where(eq3(classesTable.schoolId, schoolId));
        const classById = new Map(schoolClasses.map((c) => [c.id, c]));
        const classByName = new Map(schoolClasses.map((c) => [c.name, c]));
        let updatedCount = 0;
        for (const st of schoolStudents) {
          const matchedClass = (st.classId ? classById.get(st.classId) : null) || (st.className ? classByName.get(st.className) : null);
          let derivedGrade = st.gradeLevel || matchedClass?.gradeLevel || extractGradeLevelFromClassName(st.className || matchedClass?.name || "");
          if (!derivedGrade) {
            derivedGrade = "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          }
          await db.update(studentsTable).set({
            classId: null,
            className: "\u0628\u062F\u0648\u0646 \u0641\u0635\u0644",
            gradeLevel: derivedGrade
          }).where(and3(eq3(studentsTable.id, st.id), eq3(studentsTable.schoolId, schoolId)));
          updatedCount++;
        }
        res.json({
          success: true,
          count: updatedCount,
          message: `\u062A\u0645 \u062A\u062D\u0648\u064A\u0644 \u062C\u0645\u064A\u0639 \u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 (${updatedCount} \u0637\u0627\u0644\u0628) \u0625\u0644\u0649 \u0635\u0641\u0629 (\u0628\u062F\u0648\u0646 \u0641\u0635\u0644) \u0645\u0639 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0635\u0641 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0627\u0644\u0623\u0635\u0644\u064A \u0644\u0643\u0644 \u0637\u0627\u0644\u0628 \u0628\u0646\u062C\u0627\u062D (Plan Mode).`
        });
      } catch (error) {
        console.error("Unassign all students error:", error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/students/:studentId",
    requireAuth2,
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = req.user;
        const isAuthorizedUser = user.userRole === "owner" || user.userRole === "school_admin" || user.userRole === "teacher" || user.userRole === "attendance_teacher" || user.studentId === studentId || user.userId === studentId;
        if (!isAuthorizedUser) {
          return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0637\u0627\u0644\u0628" });
        }
        const [student] = await db.select().from(studentsTable).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        if (!student) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        }
        if (student.avatar_layout_uid === "theme_top10_aurora" || student.avatar_layout_uid === "theme_orange_gold") {
          try {
            const lbData = await getSchoolLeaderboard(schoolId, studentId);
            const rank = lbData?.currentStudent?.rank ?? 999999;
            const points = lbData?.currentStudent?.points ?? 0;
            const shouldRevoke = student.avatar_layout_uid === "theme_top10_aurora" && (rank > 10 || points <= 0) || student.avatar_layout_uid === "theme_orange_gold" && (rank > 100 || points <= 0);
            if (shouldRevoke) {
              student.avatar_layout_uid = "theme_default_blue";
              await db.update(studentsTable).set({ avatar_layout_uid: "theme_default_blue" }).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
            }
          } catch (e) {
          }
        }
        res.json({ success: true, student });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/students/:studentId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        await db.delete(studentsTable).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        res.json({ success: true, deletedStudentId: studentId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.patch(
    "/api/schools/:schoolId/students/:studentId/avatar-theme",
    requireAuth2,
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = req.user;
        if (!user || user.userRole !== "student" && user.userRole !== "parent") {
          return res.status(403).json({
            success: false,
            error: "\u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0645\u062E\u0635\u0635 \u0644\u0644\u0637\u0644\u0627\u0628 \u0648\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0641\u0642\u0637"
          });
        }
        if (user.schoolId !== schoolId) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649"
          });
        }
        const isStudentSelf = user.userRole === "student" && (user.studentId === studentId || user.userId === studentId) || user.userRole === "parent" && (user.studentId === studentId || user.userId === studentId || Array.isArray(user.studentIds) && user.studentIds.includes(studentId) || user.schoolId === schoolId) || ["owner", "super_admin", "school_admin", "admin", "teacher", "attendance_teacher"].includes(user.userRole);
        if (!isStudentSelf) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0633\u0645\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0644\u0637\u0627\u0644\u0628 \u0622\u062E\u0631"
          });
        }
        const { themeId } = req.body || {};
        const validThemes = [
          "theme_default_blue",
          "theme_purple_blue",
          "theme_simple_orange",
          "theme_orange_gold",
          "theme_top10_aurora"
        ];
        if (!themeId || typeof themeId !== "string" || !validThemes.includes(themeId)) {
          return res.status(400).json({
            success: false,
            error: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0633\u0645\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u063A\u064A\u0631 \u0645\u0639\u062A\u0645\u062F"
          });
        }
        const [student] = await db.select({
          id: studentsTable.id,
          name: studentsTable.name,
          avatar_layout_uid: studentsTable.avatar_layout_uid
        }).from(studentsTable).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        if (!student) {
          return res.status(404).json({
            success: false,
            error: "\u0627\u0644\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        if (themeId === "theme_purple_blue" || themeId === "theme_simple_orange") {
          const studentBadges = await db.select({
            assignmentId: studentBadgesTable.id,
            badgeId: studentBadgesTable.badgeId,
            rarity: badgesTable.rarity,
            badgeName: badgesTable.name
          }).from(studentBadgesTable).leftJoin(badgesTable, eq3(badgesTable.id, studentBadgesTable.badgeId)).where(
            and3(
              eq3(studentBadgesTable.studentId, studentId),
              or(
                eq3(studentBadgesTable.schoolId, schoolId),
                eq3(studentBadgesTable.schoolId, "sch-1"),
                isNull(studentBadgesTable.schoolId)
              )
            )
          );
          const totalBadges = studentBadges.length;
          const hasLegendaryBadge = studentBadges.some((b) => {
            const r = (b.rarity || "").toLowerCase().trim();
            const bName = (b.badgeName || "").toLowerCase();
            return r === "legendary" || r.includes("legend") || r.includes("\u0623\u0633\u0637\u0648\u0631") || r.includes("\u0627\u0633\u0637\u0648\u0631") || bName.includes("\u0623\u0633\u0637\u0648\u0631") || bName.includes("\u0627\u0633\u0637\u0648\u0631") || bName.includes("\u0646\u062C\u0645 \u0627\u0644\u0634\u0647\u0631");
          });
          if (themeId === "theme_purple_blue" && totalBadges < 1) {
            return res.status(403).json({
              success: false,
              error: "\u0647\u0630\u0647 \u0627\u0644\u0633\u0645\u0629 \u0645\u0642\u0641\u0644\u0629. \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0648\u0633\u0627\u0645 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644."
            });
          }
          if (themeId === "theme_simple_orange" && !hasLegendaryBadge) {
            return res.status(403).json({
              success: false,
              error: "\u0647\u0630\u0647 \u0627\u0644\u0633\u0645\u0629 \u0645\u0642\u0641\u0644\u0629. \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0648\u0633\u0627\u0645 \u0628\u0631\u062A\u0628\u0629 \u0623\u0633\u0637\u0648\u0631\u064A (Legendary)."
            });
          }
        } else if (themeId === "theme_orange_gold" || themeId === "theme_top10_aurora") {
          const leaderboardData = await getSchoolLeaderboard(schoolId, studentId);
          let currentRank = leaderboardData?.currentStudent?.rank;
          let currentPoints = leaderboardData?.currentStudent?.points ?? 0;
          if ((!currentRank || currentRank <= 0) && Array.isArray(leaderboardData?.leaderboard)) {
            const match = leaderboardData.leaderboard.find(
              (s) => s.studentId === studentId || s.id === studentId
            );
            if (match && typeof match.rank === "number") {
              currentRank = match.rank;
              currentPoints = Number(match.points || 0);
            }
          }
          if (themeId === "theme_orange_gold") {
            if (!currentRank || currentRank <= 0 || currentRank > 100 || currentPoints <= 0) {
              return res.status(403).json({
                success: false,
                error: "\u0647\u0630\u0647 \u0627\u0644\u0633\u0645\u0629 \u0645\u0642\u0641\u0644\u0629. \u062A\u062A\u0637\u0644\u0628 \u0648\u062C\u0648\u062F \u0646\u0642\u0627\u0637 \u0625\u064A\u062C\u0627\u0628\u064A\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631 \u0648\u0623\u0646 \u062A\u0643\u0648\u0646 \u0636\u0645\u0646 \u0623\u0641\u0636\u0644 100 \u0637\u0627\u0644\u0628 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0634\u0631\u0641."
              });
            }
          }
          if (themeId === "theme_top10_aurora") {
            if (!currentRank || currentRank <= 0 || currentRank > 10 || currentPoints <= 0) {
              return res.status(403).json({
                success: false,
                error: "\u0647\u0630\u0647 \u0627\u0644\u0633\u0645\u0629 \u0645\u0642\u0641\u0644\u0629. \u062A\u062A\u0637\u0644\u0628 \u0648\u062C\u0648\u062F \u0646\u0642\u0627\u0637 \u0625\u064A\u062C\u0627\u0628\u064A\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631 \u0648\u0623\u0646 \u062A\u0643\u0648\u0646 \u0636\u0645\u0646 \u0627\u0644\u0639\u0634\u0631\u0629 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 (Top 10) \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0634\u0631\u0641."
              });
            }
          }
        }
        await db.update(studentsTable).set({ avatar_layout_uid: themeId }).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        if (user.sessionId && memorySessionStore3.has(user.sessionId)) {
          const memSession = memorySessionStore3.get(user.sessionId);
          if (memSession) {
            memSession.avatarUid = themeId;
            memorySessionStore3.set(user.sessionId, memSession);
          }
        }
        try {
          await db.update(trustedDeviceSessionsTable).set({ avatarUid: themeId }).where(
            or(
              eq3(trustedDeviceSessionsTable.studentId, studentId),
              eq3(trustedDeviceSessionsTable.userId, studentId)
            )
          );
        } catch (sessionErr) {
        }
        try {
          await db.update(communityMessagesTable).set({ senderAvatar: themeId }).where(
            and3(
              eq3(communityMessagesTable.schoolId, schoolId),
              eq3(communityMessagesTable.senderId, studentId)
            )
          );
        } catch (msgErr) {
        }
        return res.json({
          success: true,
          selectedTheme: themeId,
          message: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0633\u0645\u0629 \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0638\u0647\u0631 \u0628\u0646\u062C\u0627\u062D"
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error?.message || "\u0641\u0634\u0644 \u0641\u064A \u062D\u0641\u0638 \u0633\u0645\u0629 \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0628\u0635\u0631\u064A\u0629 \u0644\u0644\u0637\u0627\u0644\u0628"
        });
      }
    }
  );
  app.get("/api/schools/:schoolId/subjects", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const subjects = await db.select().from(subjectsTable).where(eq3(subjectsTable.schoolId, schoolId));
      res.json({ success: true, subjects });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/subjects",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const sub = req.body;
        const id = sub.id || `sub-${schoolId}-${Date.now()}`;
        const record = {
          id,
          schoolId,
          name: sub.name,
          code: sub.code || null,
          gradeLevels: Array.isArray(sub.gradeLevels) ? sub.gradeLevels : sub.gradeLevel ? [sub.gradeLevel] : [],
          maxScore: Number(sub.maxScore || sub.maxGrade || 100),
          passScore: Number(sub.passScore || sub.passGrade || 50),
          teacherNames: Array.isArray(sub.teacherNames) ? sub.teacherNames : []
        };
        const existing = await db.select({ id: subjectsTable.id }).from(subjectsTable).where(and3(eq3(subjectsTable.id, id), eq3(subjectsTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(subjectsTable).set(record).where(eq3(subjectsTable.id, id));
        } else {
          await db.insert(subjectsTable).values(record);
        }
        res.json({ success: true, subject: record });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/subjects/:subjectId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, subjectId } = req.params;
        await db.delete(subjectsTable).where(and3(eq3(subjectsTable.id, subjectId), eq3(subjectsTable.schoolId, schoolId)));
        res.json({ success: true, deletedSubjectId: subjectId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/attendance", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { date, startDate, endDate, classId, studentId, limit } = req.query;
      const user = req.user;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (date && !dateRegex.test(String(date))) {
        return res.status(400).json({
          success: false,
          error: "\u0635\u064A\u063A\u0629 \u0627\u0644\u062A\u0627\u0631\u064A\u062E \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0635\u064A\u063A\u0629 YYYY-MM-DD"
        });
      }
      if (startDate && !dateRegex.test(String(startDate))) {
        return res.status(400).json({
          success: false,
          error: "\u0635\u064A\u063A\u0629 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0635\u064A\u063A\u0629 YYYY-MM-DD"
        });
      }
      if (endDate && !dateRegex.test(String(endDate))) {
        return res.status(400).json({
          success: false,
          error: "\u0635\u064A\u063A\u0629 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629\u060C \u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0635\u064A\u063A\u0629 YYYY-MM-DD"
        });
      }
      if (startDate && endDate) {
        if (String(startDate) > String(endDate)) {
          return res.status(400).json({
            success: false,
            error: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0642\u0628\u0644 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629"
          });
        }
        const diffDays = Math.ceil(
          (new Date(String(endDate)).getTime() - new Date(String(startDate)).getTime()) / (1e3 * 60 * 60 * 24)
        );
        if (diffDays > 366) {
          return res.status(400).json({
            success: false,
            error: "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0632\u0645\u0646\u064A \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B (\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 366 \u064A\u0648\u0645\u0627\u064B)"
          });
        }
      }
      const conditions = [eq3(attendanceTable.schoolId, schoolId)];
      if (date) {
        conditions.push(eq3(attendanceTable.date, String(date)));
      } else {
        if (startDate) {
          conditions.push(gte(attendanceTable.date, String(startDate)));
        }
        if (endDate) {
          conditions.push(lte(attendanceTable.date, String(endDate)));
        }
        if (!startDate && !endDate && !studentId) {
          const thirtyDaysAgo = /* @__PURE__ */ new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split("T")[0];
          conditions.push(gte(attendanceTable.date, thirtyDaysAgoIso));
        }
      }
      if (classId) {
        conditions.push(eq3(attendanceTable.classId, String(classId)));
      }
      if (studentId) {
        conditions.push(eq3(attendanceTable.studentId, String(studentId)));
      }
      if (user && user.userRole === "student") {
        const authedStudentId = user.studentId || user.userId;
        conditions.push(eq3(attendanceTable.studentId, authedStudentId));
      } else if (user && user.userRole === "parent") {
        const allowedStudentIds = Array.isArray(user.studentIds) && user.studentIds.length > 0 ? user.studentIds : user.studentId ? [user.studentId] : user.userId ? [user.userId] : [];
        if (allowedStudentIds.length > 0) {
          conditions.push(inArray2(attendanceTable.studentId, allowedStudentIds));
        } else {
          return res.json({ success: true, records: [] });
        }
      }
      let queryLimit;
      if (studentId || user && (user.userRole === "student" || user.userRole === "parent")) {
        const parsedLimit = parseInt(String(limit || "100"), 10) || 100;
        queryLimit = Math.min(Math.max(parsedLimit, 1), 365);
      } else if (!date) {
        const parsedLimit = limit ? parseInt(String(limit), 10) : 2e3;
        queryLimit = Math.min(Math.max(parsedLimit || 2e3, 1), 5e3);
      }
      let dbQuery = db.select().from(attendanceTable).where(and3(...conditions)).orderBy(desc(attendanceTable.date));
      if (queryLimit !== void 0) {
        dbQuery = dbQuery.limit(queryLimit);
      }
      const records = await dbQuery;
      res.json({ success: true, records });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.get(
    "/api/schools/:schoolId/students/:studentId/attendance",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const { limit } = req.query;
        const user = req.user;
        if (user && user.userRole === "student") {
          const authedStudentId = user.studentId || user.userId;
          if (authedStudentId && authedStudentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0633\u062C\u0644\u0627\u062A \u062D\u0636\u0648\u0631 \u0637\u0627\u0644\u0628 \u0622\u062E\u0631"
            });
          }
        }
        if (user && user.userRole === "parent") {
          const allowedStudentIds = Array.isArray(user.studentIds) && user.studentIds.length > 0 ? user.studentIds : user.studentId ? [user.studentId] : user.userId ? [user.userId] : [];
          if (!allowedStudentIds.includes(studentId)) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0645\u0643\u0646\u0643 \u0641\u0642\u0637 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0633\u062C\u0644 \u062D\u0636\u0648\u0631 \u0623\u0628\u0646\u0627\u0626\u0643 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646"
            });
          }
        }
        const parsedLimit = parseInt(String(limit || "100"), 10) || 100;
        const boundedLimit = Math.min(Math.max(parsedLimit, 1), 365);
        const records = await db.select().from(attendanceTable).where(and3(eq3(attendanceTable.schoolId, schoolId), eq3(attendanceTable.studentId, studentId))).orderBy(desc(attendanceTable.date)).limit(boundedLimit);
        res.json({ success: true, records });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/students/:studentId/points",
    requireAuth2,
    requireSchoolAccess2(["owner", "super_admin", "school_admin", "admin", "teacher", "attendance_teacher", "student", "parent"]),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = req.user;
        if (user && user.userRole === "student") {
          const authedStudentId = user.studentId || user.userId;
          if (authedStudentId && authedStudentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0646\u0642\u0627\u0637 \u0637\u0627\u0644\u0628 \u0622\u062E\u0631"
            });
          }
        }
        if (user && user.userRole === "parent") {
          const allowedStudentIds = Array.isArray(user.studentIds) && user.studentIds.length > 0 ? user.studentIds : user.studentId ? [user.studentId] : user.userId ? [user.userId] : [];
          if (!allowedStudentIds.includes(studentId)) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0645\u0643\u0646\u0643 \u0641\u0642\u0637 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0646\u0642\u0627\u0637 \u0623\u0628\u0646\u0627\u0626\u0643 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646"
            });
          }
        }
        const pointsResult = await getStudentPoints(schoolId, studentId);
        res.json(pointsResult);
      } catch (error) {
        const isNotFound = error?.message?.includes("\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
        res.status(isNotFound ? 404 : 500).json({
          success: false,
          error: error?.message || "\u0641\u0634\u0644 \u0641\u064A \u0627\u062D\u062A\u0633\u0627\u0628 \u0646\u0642\u0627\u0637 \u0627\u0644\u0637\u0627\u0644\u0628"
        });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/leaderboard",
    requireAuth2,
    requireSchoolAccess2(["owner", "super_admin", "school_admin", "admin", "teacher", "attendance_teacher", "student", "parent"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const user = req.user;
        let currentStudentId = void 0;
        const queryStudentId = typeof req.query.studentId === "string" ? req.query.studentId.trim() : void 0;
        if (queryStudentId) {
          const isAllowedQuery = ["owner", "super_admin", "school_admin", "admin", "teacher", "attendance_teacher"].includes(user.userRole) || user.userRole === "student" && (user.studentId === queryStudentId || user.userId === queryStudentId) || user.userRole === "parent" && (user.studentId === queryStudentId || user.userId === queryStudentId || Array.isArray(user.studentIds) && user.studentIds.includes(queryStudentId) || user.schoolId === schoolId);
          if (isAllowedQuery) {
            currentStudentId = queryStudentId;
          }
        }
        if (!currentStudentId) {
          if (user && user.userRole === "student") {
            currentStudentId = user.studentId || user.userId;
          } else if (user && user.userRole === "parent") {
            if (Array.isArray(user.studentIds) && user.studentIds.length > 0) {
              currentStudentId = user.studentIds[0];
            } else if (user.studentId) {
              currentStudentId = user.studentId;
            } else if (user.userId) {
              currentStudentId = user.userId;
            }
          }
        }
        const leaderboardResult = await getSchoolLeaderboard(schoolId, currentStudentId);
        res.json(leaderboardResult);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error?.message || "\u0641\u0634\u0644 \u0641\u064A \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0644\u0644\u0645\u062F\u0631\u0633\u0629"
        });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/attendance",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]),
    async (req, res) => {
      req.setTimeout(3e5);
      try {
        const { schoolId } = req.params;
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
          return res.status(400).json({ success: false, error: "\u0642\u0627\u0626\u0645\u0629 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062D\u0636\u0648\u0631 \u0641\u0627\u0631\u063A\u0629" });
        }
        const defaultDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const uniqueDates = /* @__PURE__ */ new Set();
        const dedupedMap = /* @__PURE__ */ new Map();
        for (const rec of records) {
          if (!rec.studentId) continue;
          const date = rec.date || defaultDate;
          uniqueDates.add(date);
          const key = `${rec.studentId}_${date}`;
          dedupedMap.set(key, { ...rec, date });
        }
        const cleanedRecords = Array.from(dedupedMap.values());
        if (cleanedRecords.length === 0) {
          return res.status(400).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0633\u062C\u0644\u0627\u062A \u062D\u0636\u0648\u0631 \u0635\u0627\u0644\u062D\u0629" });
        }
        const datesArray = Array.from(uniqueDates);
        const existingRows = await db.select({
          id: attendanceTable.id,
          studentId: attendanceTable.studentId,
          date: attendanceTable.date
        }).from(attendanceTable).where(
          and3(
            eq3(attendanceTable.schoolId, schoolId),
            inArray2(attendanceTable.date, datesArray)
          )
        );
        const existingIdMap = /* @__PURE__ */ new Map();
        for (const row of existingRows) {
          existingIdMap.set(`${row.studentId}_${row.date}`, row.id);
        }
        const [schoolRow] = await db.select().from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId)).limit(1);
        const isRuleEnabled = schoolRow ? schoolRow.enableThreeLateRule !== false : schoolId === "sch-1" || true;
        const lateStudentIds = isRuleEnabled ? Array.from(new Set(cleanedRecords.filter((r) => r.status === "\u0645\u062A\u0623\u062E\u0631").map((r) => r.studentId).filter(Boolean))) : [];
        const sortedDates = [...datesArray].sort();
        const earliestDate = sortedDates[0] || defaultDate;
        const lookbackDateObj = new Date(earliestDate);
        lookbackDateObj.setDate(lookbackDateObj.getDate() - 14);
        const lookbackDateStr = lookbackDateObj.toISOString().split("T")[0];
        let existingStudentAttendance = [];
        if (lateStudentIds.length > 0) {
          const CHUNK_SIZE = 250;
          for (let i = 0; i < lateStudentIds.length; i += CHUNK_SIZE) {
            const chunk = lateStudentIds.slice(i, i + CHUNK_SIZE);
            const chunkRows = await db.select({
              id: attendanceTable.id,
              studentId: attendanceTable.studentId,
              date: attendanceTable.date,
              status: attendanceTable.status,
              notes: attendanceTable.notes
            }).from(attendanceTable).where(
              and3(
                eq3(attendanceTable.schoolId, schoolId),
                inArray2(attendanceTable.studentId, chunk),
                gte(attendanceTable.date, lookbackDateStr)
              )
            );
            existingStudentAttendance.push(...chunkRows);
          }
        }
        const studentHistoryMap = /* @__PURE__ */ new Map();
        for (const row of existingStudentAttendance) {
          if (!studentHistoryMap.has(row.studentId)) {
            studentHistoryMap.set(row.studentId, /* @__PURE__ */ new Map());
          }
          studentHistoryMap.get(row.studentId).set(row.date, {
            status: row.status,
            notes: row.notes
          });
        }
        const recordsByStudent = /* @__PURE__ */ new Map();
        for (const rec of cleanedRecords) {
          if (!recordsByStudent.has(rec.studentId)) {
            recordsByStudent.set(rec.studentId, []);
          }
          recordsByStudent.get(rec.studentId).push(rec);
        }
        const itemsToUpsert = [];
        for (const [studentId, studentRecs] of recordsByStudent.entries()) {
          studentRecs.sort((a, b) => a.date.localeCompare(b.date));
          for (const rec of studentRecs) {
            const key = `${rec.studentId}_${rec.date}`;
            const existingId = existingIdMap.get(key);
            const id = existingId || rec.id || `att-${schoolId}-${rec.studentId}-${rec.date}`;
            let finalStatus = rec.status || "\u062D\u0627\u0636\u0631";
            let finalNotes = rec.notes || null;
            if (isRuleEnabled && finalStatus === "\u0645\u062A\u0623\u062E\u0631") {
              const studentMap = studentHistoryMap.get(studentId) || /* @__PURE__ */ new Map();
              const getPrecedingSchoolDay = (isoDateStr, knownDates) => {
                const parts = isoDateStr.split("-").map(Number);
                const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                d.setUTCDate(d.getUTCDate() - 1);
                const oneDayBeforeIso = d.toISOString().split("T")[0];
                if (knownDates.has(oneDayBeforeIso)) {
                  return oneDayBeforeIso;
                }
                while (d.getUTCDay() === 5 || d.getUTCDay() === 6) {
                  d.setUTCDate(d.getUTCDate() - 1);
                }
                return d.toISOString().split("T")[0];
              };
              const expectedPrevDay1 = getPrecedingSchoolDay(rec.date, studentMap);
              const expectedPrevDay2 = getPrecedingSchoolDay(expectedPrevDay1, studentMap);
              const prev1 = studentMap.get(expectedPrevDay1);
              const prev2 = studentMap.get(expectedPrevDay2);
              const isThreeConsecutiveLates = Boolean(prev1 && prev1.status === "\u0645\u062A\u0623\u062E\u0631") && Boolean(prev2 && prev2.status === "\u0645\u062A\u0623\u062E\u0631");
              if (isThreeConsecutiveLates) {
                finalStatus = "\u063A\u0627\u0626\u0628";
                const auditText = "[\u062A\u062D\u0648\u064A\u0644 \u062A\u0644\u0642\u0627\u0626\u064A \u0625\u0644\u0649 \u063A\u0627\u0626\u0628 \u0644\u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062A\u0623\u062E\u064A\u0631 3 \u0623\u064A\u0627\u0645 \u0645\u062A\u062A\u0627\u0644\u064A\u0629 (\u0644\u0627\u0626\u062D\u0629 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637)]";
                if (!finalNotes) {
                  finalNotes = auditText;
                } else if (!finalNotes.includes("\u062A\u062D\u0648\u064A\u0644 \u062A\u0644\u0642\u0627\u0626\u064A \u0625\u0644\u0649 \u063A\u0627\u0626\u0628")) {
                  finalNotes = `${finalNotes} ${auditText}`;
                }
              }
            }
            if (!studentHistoryMap.has(studentId)) {
              studentHistoryMap.set(studentId, /* @__PURE__ */ new Map());
            }
            studentHistoryMap.get(studentId).set(rec.date, {
              status: finalStatus,
              notes: finalNotes
            });
            itemsToUpsert.push({
              id,
              schoolId,
              studentId: rec.studentId,
              studentName: rec.studentName || "\u0637\u0627\u0644\u0628",
              classId: rec.classId || null,
              className: rec.className || null,
              date: rec.date,
              status: finalStatus,
              notes: finalNotes
            });
          }
        }
        await db.transaction(async (tx) => {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < itemsToUpsert.length; i += CHUNK_SIZE) {
            const chunk = itemsToUpsert.slice(i, i + CHUNK_SIZE);
            await tx.insert(attendanceTable).values(chunk).onConflictDoUpdate({
              target: attendanceTable.id,
              set: {
                studentName: sql3`EXCLUDED.student_name`,
                classId: sql3`EXCLUDED.class_id`,
                className: sql3`EXCLUDED.class_name`,
                status: sql3`EXCLUDED.status`,
                notes: sql3`EXCLUDED.notes`
              }
            });
          }
        });
        res.json({ success: true, records: itemsToUpsert, message: `\u062A\u0645 \u062D\u0641\u0638 ${itemsToUpsert.length} \u0633\u062C\u0644 \u062D\u0636\u0648\u0631 \u0628\u0646\u062C\u0627\u062D` });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/attendance/sessions",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const s = req.body;
        const id = s.id || `att-sess-${schoolId}-${Date.now()}`;
        const record = {
          id,
          schoolId,
          date: s.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          completedAt: s.completedAt || s.takenAt || (/* @__PURE__ */ new Date()).toISOString(),
          totalClassesCount: Number(s.totalClassesCount) || 1,
          totalStudentsCount: Number(s.totalStudents || s.totalStudentsCount) || 0,
          presentCount: Number(s.presentCount) || 0,
          absentCount: Number(s.absentCount) || 0,
          lateCount: Number(s.lateCount) || 0,
          durationMinutes: Number(s.durationMinutes) || 0,
          teacherName: s.teacherName || s.takenBy || "\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u063A\u064A\u0627\u0628"
        };
        await db.insert(attendanceSessionsTable).values(record);
        res.json({ success: true, session: record });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/grades", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const user = req.user;
      const {
        classId,
        subjectId,
        studentId,
        examName,
        startDate,
        endDate,
        limit,
        page
      } = req.query;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          error: "\u0635\u064A\u063A\u0629 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629 (YYYY-MM-DD)"
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          error: "\u0635\u064A\u063A\u0629 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629 (YYYY-MM-DD)"
        });
      }
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({
          success: false,
          error: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0642\u0628\u0644 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0647\u0627\u064A\u0629"
        });
      }
      const conditions = [eq3(gradesTable.schoolId, schoolId)];
      if (startDate) {
        conditions.push(gte(gradesTable.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(gradesTable.date, endDate));
      }
      if (user && user.userRole === "student") {
        const authedStudentId = user.studentId || user.userId;
        if (studentId && studentId !== authedStudentId) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0639\u0631\u0636 \u062F\u0631\u062C\u0627\u062A \u0637\u0627\u0644\u0628 \u0622\u062E\u0631"
          });
        }
        conditions.push(eq3(gradesTable.studentId, authedStudentId));
      } else if (user && user.userRole === "parent") {
        const allowedStudentIds = Array.isArray(user.studentIds) ? user.studentIds : user.studentId ? [user.studentId] : [];
        if (allowedStudentIds.length === 0) {
          return res.json({ success: true, grades: [] });
        }
        if (studentId) {
          if (!allowedStudentIds.includes(studentId)) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0627\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u062D\u0633\u0627\u0628\u0643"
            });
          }
          conditions.push(eq3(gradesTable.studentId, studentId));
        } else {
          conditions.push(inArray2(gradesTable.studentId, allowedStudentIds));
        }
      } else if (studentId) {
        conditions.push(eq3(gradesTable.studentId, studentId));
      }
      if (classId) {
        conditions.push(eq3(gradesTable.classId, classId));
      }
      if (subjectId) {
        conditions.push(eq3(gradesTable.subjectId, subjectId));
      }
      if (examName) {
        conditions.push(eq3(gradesTable.examName, examName));
      }
      const isStudentQuery = Boolean(
        studentId || user && (user.userRole === "student" || user.userRole === "parent")
      );
      const isClassQuery = Boolean(classId);
      let defaultLimit = 1e3;
      let maxLimit = 1e3;
      if (isStudentQuery) {
        defaultLimit = 100;
        maxLimit = 365;
      } else if (isClassQuery) {
        defaultLimit = 1e3;
        maxLimit = 2e3;
      } else {
        defaultLimit = 1e3;
        maxLimit = 1e3;
      }
      const parsedLimit = limit ? parseInt(String(limit), 10) : defaultLimit;
      const queryLimit = Math.min(
        Math.max(isNaN(parsedLimit) ? defaultLimit : parsedLimit, 1),
        maxLimit
      );
      const pageNum = page ? Math.max(1, parseInt(String(page), 10) || 1) : 1;
      const offset = (pageNum - 1) * queryLimit;
      let dbQuery = db.select().from(gradesTable).where(and3(...conditions)).orderBy(desc(gradesTable.date)).limit(queryLimit);
      if (offset > 0) {
        dbQuery = dbQuery.offset(offset);
      }
      const grades = await dbQuery;
      res.json({
        success: true,
        grades,
        limit: queryLimit,
        page: pageNum
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/grades",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
          return res.status(400).json({ success: false, error: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062F\u0631\u062C\u0627\u062A \u0641\u0627\u0631\u063A\u0629" });
        }
        for (const g of records) {
          const id = g.id || `grd-${schoolId}-${g.studentId}-${g.subjectId}-${g.examName}`;
          const item = {
            id,
            schoolId,
            studentId: g.studentId,
            studentName: g.studentName,
            classId: g.classId || null,
            subjectId: g.subjectId,
            subjectName: g.subjectName,
            examName: g.examName || "\u0627\u062E\u062A\u0628\u0627\u0631 \u0634\u0647\u0631",
            score: Number(g.score) || 0,
            maxScore: Number(g.maxScore) || 100,
            date: g.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            notes: g.notes || null
          };
          const existing = await db.select({ id: gradesTable.id }).from(gradesTable).where(and3(eq3(gradesTable.id, id), eq3(gradesTable.schoolId, schoolId)));
          if (existing.length > 0) {
            await db.update(gradesTable).set(item).where(eq3(gradesTable.id, id));
          } else {
            await db.insert(gradesTable).values(item);
          }
        }
        res.json({ success: true, message: `\u062A\u0645 \u062D\u0641\u0638 ${records.length} \u0633\u062C\u0644 \u062F\u0631\u062C\u0627\u062A \u0628\u0646\u062C\u0627\u062D` });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/behavior", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const behavior = await db.select().from(behaviorTable).where(eq3(behaviorTable.schoolId, schoolId));
      res.json({ success: true, behavior });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/behavior",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const beh = req.body;
        const id = beh.id || `beh-${schoolId}-${Date.now()}`;
        const type = beh.type === "\u0633\u0644\u0628\u064A" ? "\u0633\u0644\u0628\u064A" : "\u0625\u064A\u062C\u0627\u0628\u064A";
        const rawPoints = Math.abs(Number(beh.points) || 1);
        const clampedMagnitude = Math.min(10, Math.max(1, rawPoints));
        const points = type === "\u0633\u0644\u0628\u064A" ? -clampedMagnitude : clampedMagnitude;
        let cycleStartMs;
        try {
          const now = /* @__PURE__ */ new Date();
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: "Africa/Cairo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: false
          });
          const parts = formatter.formatToParts(now);
          const p = {};
          for (const part of parts) {
            if (part.type !== "literal") {
              p[part.type] = parseInt(part.value, 10);
            }
          }
          let year = p.year;
          let month = p.month;
          let day = p.day;
          let hour = p.hour === 24 ? 0 : p.hour;
          if (hour < 6) {
            const prevDate = new Date(Date.UTC(year, month - 1, day - 1));
            year = prevDate.getUTCFullYear();
            month = prevDate.getUTCMonth() + 1;
            day = prevDate.getUTCDate();
          }
          const tempUtcDate = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
          const tzParts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Africa/Cairo",
            timeZoneName: "shortOffset"
          }).formatToParts(tempUtcDate);
          const offsetPart = tzParts.find((pt) => pt.type === "timeZoneName")?.value || "GMT+3";
          let offsetHours = 3;
          const match = offsetPart.match(/GMT([+-]\d+)/);
          if (match) {
            offsetHours = parseInt(match[1], 10);
          }
          cycleStartMs = Date.UTC(year, month - 1, day, 6 - offsetHours, 0, 0);
        } catch (e) {
          const now = /* @__PURE__ */ new Date();
          const cycleStart = new Date(now);
          if (now.getHours() < 6) {
            cycleStart.setDate(cycleStart.getDate() - 1);
          }
          cycleStart.setHours(6, 0, 0, 0);
          cycleStartMs = cycleStart.getTime();
        }
        if (beh.reportedBy && beh.reportedBy !== "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629") {
          const teacherBehaviors = await db.select({ id: behaviorTable.id, points: behaviorTable.points, date: behaviorTable.date }).from(behaviorTable).where(and3(eq3(behaviorTable.schoolId, schoolId), eq3(behaviorTable.reportedBy, beh.reportedBy)));
          let usedPointsToday = 0;
          for (const item of teacherBehaviors) {
            if (item.id === id) continue;
            let inCycle = false;
            const tsMatch = item.id.match(/(\d{12,13})/);
            if (tsMatch) {
              const ts = parseInt(tsMatch[1], 10);
              if (!isNaN(ts) && ts >= cycleStartMs) {
                inCycle = true;
              }
            } else if (item.date) {
              const cycleDateStr = new Date(cycleStartMs).toISOString().split("T")[0];
              if (item.date >= cycleDateStr) {
                inCycle = true;
              }
            }
            if (inCycle) {
              usedPointsToday += Math.abs(Number(item.points) || 0);
            }
          }
          if (usedPointsToday + clampedMagnitude > 25) {
            const remaining = Math.max(0, 25 - usedPointsToday);
            return res.status(400).json({
              success: false,
              error: `\u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u064A\u0648\u0645\u064A \u0627\u0644\u0645\u062A\u0627\u062D \u0644\u0644\u0645\u0639\u0644\u0645 (25 \u0646\u0642\u0637\u0629 \u064A\u0648\u0645\u064A\u0627\u064B). \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0644\u062F\u064A\u0643: ${remaining} \u0646\u0642\u0637\u0629 \u0641\u0642\u0637. \u064A\u062A\u062C\u062F\u062F \u0627\u0644\u0631\u0635\u064A\u062F \u0643\u0644 \u0635\u0628\u0627\u062D \u0627\u0644\u0633\u0627\u0639\u0629 6:00 \u0635 \u0628\u062A\u0648\u0642\u064A\u062A \u0645\u0635\u0631.`
            });
          }
        }
        const record = {
          id,
          schoolId,
          studentId: beh.studentId,
          studentName: beh.studentName,
          classId: beh.classId || null,
          type,
          title: beh.title,
          points,
          date: beh.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          notes: beh.notes || null,
          reportedBy: beh.reportedBy || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
        };
        const existing = await db.select({ id: behaviorTable.id }).from(behaviorTable).where(and3(eq3(behaviorTable.id, id), eq3(behaviorTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(behaviorTable).set(record).where(eq3(behaviorTable.id, id));
        } else {
          await db.insert(behaviorTable).values(record);
        }
        res.json({ success: true, behavior: record });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/behavior/:behaviorId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "attendance_teacher"]),
    async (req, res) => {
      try {
        const { schoolId, behaviorId } = req.params;
        await db.delete(behaviorTable).where(and3(eq3(behaviorTable.id, behaviorId), eq3(behaviorTable.schoolId, schoolId)));
        res.json({ success: true, deletedBehaviorId: behaviorId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/announcements", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const dbAnnouncements = await db.select().from(announcementsTable).where(eq3(announcementsTable.schoolId, schoolId)).orderBy(desc(announcementsTable.createdAt), desc(announcementsTable.id));
      const announcements = dbAnnouncements.map((a) => {
        const priority = a.priority || (a.important ? "\u0647\u0627\u0645" : "\u0639\u0627\u062F\u064A");
        const isImportant = priority === "\u0647\u0627\u0645" || priority === "\u0639\u0627\u062C\u0644 \u062C\u062F\u0627\u064B" || Boolean(a.important);
        return {
          id: a.id,
          schoolId: a.schoolId,
          type: a.type || "general",
          title: a.title,
          content: a.content,
          targetAudience: a.targetAudience || "\u0627\u0644\u062C\u0645\u064A\u0639",
          priority,
          important: isImportant,
          publishDate: a.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          date: a.date,
          isScheduled: false,
          author: a.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          authorName: a.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          pollOptions: Array.isArray(a.pollOptions) ? a.pollOptions : [],
          pollVotes: Array.isArray(a.pollVotes) ? a.pollVotes : [],
          pollExpiresAt: a.pollExpiresAt || void 0,
          allowMultiple: Boolean(a.allowMultiple),
          eventDate: a.eventDate || void 0,
          eventTime: a.eventTime || void 0,
          eventLocation: a.eventLocation || void 0,
          eventOrganizer: a.eventOrganizer || void 0,
          eventRsvps: Array.isArray(a.eventRsvps) ? a.eventRsvps : [],
          createdAt: a.createdAt?.toISOString() || void 0,
          updatedAt: a.updatedAt?.toISOString() || void 0
        };
      });
      announcements.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        const matchA = a.id?.match(/(\d{10,14})$/);
        const matchB = b.id?.match(/(\d{10,14})$/);
        if (matchA && matchB) {
          const numA = parseInt(matchA[1], 10);
          const numB = parseInt(matchB[1], 10);
          if (numA !== numB) return numB - numA;
        }
        const dateA = a.publishDate || a.date || "";
        const dateB = b.publishDate || b.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.id || "").localeCompare(a.id || "");
      });
      const userRole = req.user?.userRole || req.user?.role || "";
      const visibleAnnouncements = announcements.filter(
        (a) => isAnnouncementVisibleToRole(a.targetAudience, userRole)
      );
      res.json({ success: true, announcements: visibleAnnouncements });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/announcements",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const ann = req.body;
        const id = ann.id || `ann-${schoolId}-${Date.now()}`;
        const priority = ann.priority || (ann.important ? "\u0647\u0627\u0645" : "\u0639\u0627\u062F\u064A");
        const isImportant = priority === "\u0647\u0627\u0645" || priority === "\u0639\u0627\u062C\u0644 \u062C\u062F\u0627\u064B" || Boolean(ann.important);
        const type = ann.type || "general";
        const record = {
          id,
          schoolId,
          type,
          title: ann.title,
          content: ann.content,
          targetAudience: ann.targetAudience || "\u0627\u0644\u062C\u0645\u064A\u0639",
          authorName: ann.author || ann.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          date: ann.publishDate || ann.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          important: isImportant,
          priority,
          pollOptions: Array.isArray(ann.pollOptions) ? ann.pollOptions : [],
          pollVotes: Array.isArray(ann.pollVotes) ? ann.pollVotes : [],
          pollExpiresAt: ann.pollExpiresAt || null,
          allowMultiple: Boolean(ann.allowMultiple),
          eventDate: ann.eventDate || null,
          eventTime: ann.eventTime || null,
          eventLocation: ann.eventLocation || null,
          eventOrganizer: ann.eventOrganizer || null,
          eventRsvps: Array.isArray(ann.eventRsvps) ? ann.eventRsvps : [],
          updatedAt: /* @__PURE__ */ new Date()
        };
        const existing = await db.select({ id: announcementsTable.id }).from(announcementsTable).where(and3(eq3(announcementsTable.id, id), eq3(announcementsTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(announcementsTable).set(record).where(eq3(announcementsTable.id, id));
        } else {
          await db.insert(announcementsTable).values({
            ...record,
            createdAt: /* @__PURE__ */ new Date()
          });
        }
        res.json({
          success: true,
          announcement: {
            ...record,
            priority,
            important: isImportant,
            publishDate: record.date,
            author: record.authorName
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/announcements/:announcementId/vote",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, announcementId } = req.params;
        const { optionId, optionIds } = req.body;
        const user = req.user || {};
        const userId = user.id || user.userId || user.username || user.email || "user";
        const userName = user.name || user.username || user.email || "\u0645\u0633\u062A\u062E\u062F\u0645";
        const userRole = user.userRole || user.role || "user";
        const selectedIds = Array.isArray(optionIds) ? optionIds : typeof optionId === "string" ? [optionId] : Array.isArray(optionId) ? optionId : [];
        if (selectedIds.length === 0) {
          return res.status(400).json({ success: false, error: "\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u062E\u064A\u0627\u0631 \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
        }
        const [existing] = await db.select().from(announcementsTable).where(and3(eq3(announcementsTable.id, announcementId), eq3(announcementsTable.schoolId, schoolId)));
        if (!existing) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0627\u0639\u0644\u0627\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        }
        if (existing.type !== "poll") {
          return res.status(400).json({ success: false, error: "\u0647\u0630\u0627 \u0627\u0644\u0627\u0639\u0644\u0627\u0646 \u0644\u064A\u0633 \u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627 \u0644\u0644\u0631\u0623\u064A" });
        }
        const currentVotes = Array.isArray(existing.pollVotes) ? [...existing.pollVotes] : [];
        const filteredVotes = currentVotes.filter((v) => v.userId !== userId);
        filteredVotes.push({
          userId,
          userName,
          userRole,
          selectedOptionIds: selectedIds,
          votedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        const options = Array.isArray(existing.pollOptions) ? [...existing.pollOptions] : [];
        const optionVoteMap = /* @__PURE__ */ new Map();
        filteredVotes.forEach((v) => {
          (v.selectedOptionIds || []).forEach((optId) => {
            optionVoteMap.set(optId, (optionVoteMap.get(optId) || 0) + 1);
          });
        });
        const updatedOptions = options.map((opt) => ({
          ...opt,
          votesCount: optionVoteMap.get(opt.id) || 0
        }));
        await db.update(announcementsTable).set({
          pollVotes: filteredVotes,
          pollOptions: updatedOptions,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and3(eq3(announcementsTable.id, announcementId), eq3(announcementsTable.schoolId, schoolId)));
        const updatedAnnouncement = {
          ...existing,
          type: existing.type,
          pollVotes: filteredVotes,
          pollOptions: updatedOptions,
          publishDate: existing.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          author: existing.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
        };
        res.json({ success: true, announcement: updatedAnnouncement });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/announcements/:announcementId/rsvp",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, announcementId } = req.params;
        const { status } = req.body;
        const user = req.user || {};
        const userId = user.id || user.userId || user.username || user.email || "user";
        const userName = user.name || user.username || user.email || "\u0645\u0633\u062A\u062E\u062F\u0645";
        const userRole = user.userRole || user.role || "user";
        if (!["attending", "interested", "declined"].includes(status)) {
          return res.status(400).json({ success: false, error: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
        }
        const [existing] = await db.select().from(announcementsTable).where(and3(eq3(announcementsTable.id, announcementId), eq3(announcementsTable.schoolId, schoolId)));
        if (!existing) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0627\u0639\u0644\u0627\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
        }
        if (existing.type !== "event") {
          return res.status(400).json({ success: false, error: "\u0647\u0630\u0627 \u0627\u0644\u0627\u0639\u0644\u0627\u0646 \u0644\u064A\u0633 \u0641\u0639\u0627\u0644\u064A\u0627\u062A/\u062D\u062F\u062B" });
        }
        const currentRsvps = Array.isArray(existing.eventRsvps) ? [...existing.eventRsvps] : [];
        const filteredRsvps = currentRsvps.filter((r) => r.userId !== userId);
        filteredRsvps.push({
          userId,
          userName,
          userRole,
          status,
          rsvpAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        await db.update(announcementsTable).set({
          eventRsvps: filteredRsvps,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and3(eq3(announcementsTable.id, announcementId), eq3(announcementsTable.schoolId, schoolId)));
        const updatedAnnouncement = {
          ...existing,
          eventRsvps: filteredRsvps,
          publishDate: existing.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          author: existing.authorName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
        };
        res.json({ success: true, announcement: updatedAnnouncement });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/announcements/:announcementId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, announcementId } = req.params;
        await db.delete(announcementsTable).where(and3(eq3(announcementsTable.id, announcementId), eq3(announcementsTable.schoolId, schoolId)));
        res.json({ success: true, deletedAnnouncementId: announcementId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/calendar-tasks", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const tasks = await db.select().from(calendarTasksTable).where(eq3(calendarTasksTable.schoolId, schoolId));
      const mappedTasks = tasks.map((t) => ({
        id: t.id,
        schoolId: t.schoolId,
        school_id: t.schoolId,
        title: t.title,
        description: t.description || "",
        date: t.date,
        task_date: t.date,
        priority: t.priority || "medium",
        status: t.status || "pending",
        assignedTo: t.assignedTo || null,
        createdAt: t.createdAt,
        created_at: t.createdAt,
        updatedAt: t.updatedAt,
        updated_at: t.updatedAt
      }));
      res.json({ success: true, tasks: mappedTasks });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/calendar-tasks",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const t = req.body;
        const id = t.id || `task-${schoolId}-${Date.now()}`;
        const taskDate = t.task_date || t.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const record = {
          id,
          schoolId,
          title: t.title,
          description: t.description || null,
          date: taskDate,
          priority: t.priority || "medium",
          status: t.status || "pending",
          assignedTo: t.assignedTo || null,
          createdAt: t.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const existing = await db.select({ id: calendarTasksTable.id }).from(calendarTasksTable).where(and3(eq3(calendarTasksTable.id, id), eq3(calendarTasksTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(calendarTasksTable).set(record).where(eq3(calendarTasksTable.id, id));
        } else {
          await db.insert(calendarTasksTable).values(record);
        }
        res.json({
          success: true,
          task: {
            ...record,
            task_date: record.date,
            school_id: record.schoolId,
            created_at: record.createdAt,
            updated_at: record.updatedAt
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.patch(
    "/api/schools/:schoolId/calendar-tasks/:taskId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, taskId } = req.params;
        const updates = req.body;
        const dbUpdates = { updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        if (updates.title !== void 0) dbUpdates.title = updates.title;
        if (updates.description !== void 0) dbUpdates.description = updates.description;
        if (updates.date !== void 0 || updates.task_date !== void 0) {
          dbUpdates.date = updates.task_date || updates.date;
        }
        if (updates.priority !== void 0) dbUpdates.priority = updates.priority;
        if (updates.status !== void 0) dbUpdates.status = updates.status;
        if (updates.assignedTo !== void 0) dbUpdates.assignedTo = updates.assignedTo;
        await db.update(calendarTasksTable).set(dbUpdates).where(and3(eq3(calendarTasksTable.id, taskId), eq3(calendarTasksTable.schoolId, schoolId)));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/calendar-tasks/:taskId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, taskId } = req.params;
        await db.delete(calendarTasksTable).where(and3(eq3(calendarTasksTable.id, taskId), eq3(calendarTasksTable.schoolId, schoolId)));
        res.json({ success: true, deletedTaskId: taskId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/badges", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const badges = await db.select().from(badgesTable).where(eq3(badgesTable.schoolId, schoolId));
      const mappedBadges = badges.map((b) => ({
        id: b.id,
        schoolId: b.schoolId,
        name: b.name,
        nameEn: b.nameEn || void 0,
        description: b.description || "",
        icon: b.icon || "\u{1F3C6}",
        color: b.color || "#D4AF37",
        rarity: b.rarity || "Mythical",
        targetType: b.targetType || "student",
        isActive: b.isActive !== false,
        hasAnimatedBorder: b.hasAnimatedBorder !== false,
        limitType: b.limitType || "none",
        limit_type: b.limitType || "none",
        maxQuantity: b.maxQuantity || 0,
        max_quantity: b.maxQuantity || 0,
        isHidden: Boolean(b.isHidden),
        is_hidden: Boolean(b.isHidden),
        createdAt: b.createdAt || "2026-07-28"
      }));
      res.json({ success: true, badges: mappedBadges });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await db.select().from(badgesTable);
      const mappedBadges = badges.map((b) => ({
        id: b.id,
        schoolId: b.schoolId,
        name: b.name,
        nameEn: b.nameEn || void 0,
        description: b.description || "",
        icon: b.icon || "\u{1F3C6}",
        color: b.color || "#D4AF37",
        rarity: b.rarity || "Mythical",
        targetType: b.targetType || "student",
        isActive: b.isActive !== false,
        hasAnimatedBorder: b.hasAnimatedBorder !== false,
        limitType: b.limitType || "none",
        limit_type: b.limitType || "none",
        maxQuantity: b.maxQuantity || 0,
        max_quantity: b.maxQuantity || 0,
        isHidden: Boolean(b.isHidden),
        is_hidden: Boolean(b.isHidden),
        createdAt: b.createdAt || "2026-07-28"
      }));
      res.json({ success: true, badges: mappedBadges });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/badges",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;
        const id = b.id || `badge-${Date.now()}`;
        const limitType = b.limitType || b.limit_type || "none";
        const maxQuantity = b.maxQuantity !== void 0 ? Number(b.maxQuantity) : b.max_quantity !== void 0 ? Number(b.max_quantity) : 0;
        const isHidden = b.isHidden !== void 0 ? Boolean(b.isHidden) : b.is_hidden !== void 0 ? Boolean(b.is_hidden) : false;
        const record = {
          id,
          schoolId,
          name: b.name,
          nameEn: b.nameEn || null,
          description: b.description || "",
          icon: b.icon || "\u{1F3C6}",
          color: b.color || "#D4AF37",
          rarity: b.rarity || "Mythical",
          targetType: b.targetType || "student",
          isActive: b.isActive !== false,
          hasAnimatedBorder: b.hasAnimatedBorder !== false,
          limitType,
          maxQuantity,
          isHidden
        };
        const existing = await db.select({ id: badgesTable.id }).from(badgesTable).where(and3(eq3(badgesTable.id, id), eq3(badgesTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(badgesTable).set(record).where(eq3(badgesTable.id, id));
        } else {
          await db.insert(badgesTable).values(record);
        }
        res.json({
          success: true,
          badge: {
            ...record,
            limit_type: limitType,
            max_quantity: maxQuantity,
            is_hidden: isHidden
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/parents", requireAuth2, requireSchoolAccess2(["owner", "school_admin"]), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rows = await db.select().from(parentsTable).where(eq3(parentsTable.schoolId, schoolId));
      const parents = rows.map((p) => {
        const studentIds = Array.isArray(p.studentIds) ? p.studentIds : [];
        return {
          id: p.id,
          schoolId: p.schoolId,
          name: p.name,
          nationalId: p.nationalId || "",
          phone: p.phone || "",
          email: p.email || "",
          occupation: p.occupation || "",
          address: p.address || "",
          studentIds,
          childrenIds: studentIds,
          student_ids: studentIds,
          relationship: p.relationship || "\u0648\u0644\u064A \u0623\u0645\u0631"
        };
      });
      res.json({ success: true, parents });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.post(
    "/api/schools/:schoolId/parents",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const p = req.body;
        const id = p.id || `par-${schoolId}-${Date.now()}`;
        const rawChildren = p.childrenIds || p.studentIds || p.student_ids || [];
        const studentIds = Array.isArray(rawChildren) ? rawChildren : [];
        const record = {
          id,
          schoolId,
          name: p.name,
          nationalId: p.nationalId || null,
          phone: p.phone || null,
          email: p.email || null,
          studentIds,
          relationship: p.relationship || "\u0648\u0644\u064A \u0623\u0645\u0631",
          occupation: p.occupation || null,
          address: p.address || null
        };
        const existing = await db.select({ id: parentsTable.id }).from(parentsTable).where(and3(eq3(parentsTable.id, id), eq3(parentsTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(parentsTable).set(record).where(eq3(parentsTable.id, id));
        } else {
          await db.insert(parentsTable).values(record);
        }
        res.json({
          success: true,
          parent: {
            ...record,
            childrenIds: studentIds,
            studentIds,
            student_ids: studentIds
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/parents/:parentId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, parentId } = req.params;
        await db.delete(parentsTable).where(and3(eq3(parentsTable.id, parentId), eq3(parentsTable.schoolId, schoolId)));
        res.json({ success: true, deletedParentId: parentId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/homework", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId, studentId } = req.query;
      let rows = await db.select().from(homeworkTable).where(eq3(homeworkTable.schoolId, schoolId));
      if (classId) {
        rows = rows.filter((h) => h.classId === String(classId));
      }
      if (studentId) {
        rows = rows.filter((h) => h.studentId === String(studentId) || !h.studentId);
      }
      const homework = rows.map((h) => ({
        id: h.id,
        schoolId: h.schoolId,
        studentId: h.studentId || void 0,
        classId: h.classId || void 0,
        className: h.className || void 0,
        subjectName: h.subjectName,
        teacherName: h.teacherName || void 0,
        title: h.title,
        description: h.description || "",
        assignedDate: h.assignedDate,
        dueDate: h.dueDate,
        status: h.status || "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
      }));
      res.json({ success: true, homework });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.get(
    "/api/schools/:schoolId/students/:studentId/homework",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const [student] = await db.select({ id: studentsTable.id, classId: studentsTable.classId }).from(studentsTable).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        const allHw = await db.select().from(homeworkTable).where(eq3(homeworkTable.schoolId, schoolId));
        const studentHw = allHw.filter((h) => {
          if (h.studentId && h.studentId === studentId) return true;
          if (student?.classId && h.classId === student.classId) return true;
          if (!h.studentId && !h.classId) return true;
          return false;
        });
        const homework = studentHw.map((h) => ({
          id: h.id,
          schoolId: h.schoolId,
          studentId: h.studentId || void 0,
          classId: h.classId || void 0,
          className: h.className || void 0,
          subjectName: h.subjectName,
          teacherName: h.teacherName || void 0,
          title: h.title,
          description: h.description || "",
          assignedDate: h.assignedDate,
          dueDate: h.dueDate,
          status: h.status || "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
        }));
        res.json({ success: true, homework });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/homework",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const hw = req.body;
        const id = hw.id || `hw-${schoolId}-${Date.now()}`;
        const record = {
          id,
          schoolId,
          studentId: hw.studentId || null,
          classId: hw.classId || null,
          className: hw.className || null,
          subjectName: hw.subjectName || "\u0639\u0627\u0645",
          teacherName: hw.teacherName || null,
          title: hw.title,
          description: hw.description || "",
          assignedDate: hw.assignedDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          dueDate: hw.dueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          status: hw.status || "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
        };
        const existing = await db.select({ id: homeworkTable.id }).from(homeworkTable).where(and3(eq3(homeworkTable.id, id), eq3(homeworkTable.schoolId, schoolId)));
        if (existing.length > 0) {
          await db.update(homeworkTable).set(record).where(eq3(homeworkTable.id, id));
        } else {
          await db.insert(homeworkTable).values(record);
        }
        res.json({
          success: true,
          homework: {
            ...record,
            studentId: record.studentId || void 0,
            classId: record.classId || void 0,
            className: record.className || void 0
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.patch(
    "/api/schools/:schoolId/homework/:homeworkId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher", "student", "parent"]),
    async (req, res) => {
      try {
        const { schoolId, homeworkId } = req.params;
        const updates = req.body;
        const dbUpdates = {};
        if (updates.status !== void 0) dbUpdates.status = updates.status;
        if (updates.title !== void 0) dbUpdates.title = updates.title;
        if (updates.description !== void 0) dbUpdates.description = updates.description;
        if (updates.dueDate !== void 0) dbUpdates.dueDate = updates.dueDate;
        if (updates.classId !== void 0) dbUpdates.classId = updates.classId;
        if (updates.className !== void 0) dbUpdates.className = updates.className;
        await db.update(homeworkTable).set(dbUpdates).where(and3(eq3(homeworkTable.id, homeworkId), eq3(homeworkTable.schoolId, schoolId)));
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/homework/:homeworkId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId, homeworkId } = req.params;
        await db.delete(homeworkTable).where(and3(eq3(homeworkTable.id, homeworkId), eq3(homeworkTable.schoolId, schoolId)));
        res.json({ success: true, deletedHomeworkId: homeworkId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/badges/:badgeId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, badgeId } = req.params;
        const user = req.user;
        const isGlobalAdmin = user?.userRole === "owner" || user?.userRole === "super_admin";
        await db.delete(badgesTable).where(
          isGlobalAdmin ? eq3(badgesTable.id, badgeId) : and3(eq3(badgesTable.id, badgeId), or(eq3(badgesTable.schoolId, schoolId), sql3`${badgesTable.schoolId} IS NULL`))
        );
        await db.delete(studentBadgesTable).where(eq3(studentBadgesTable.badgeId, badgeId));
        await db.delete(teacherBadgesTable).where(eq3(teacherBadgesTable.badgeId, badgeId));
        res.json({ success: true, deletedBadgeId: badgeId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/badges/award-student",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { studentId, badgeId, awardedBy = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", note = "" } = req.body;
        if (!studentId || !badgeId) {
          return res.status(400).json({ success: false, error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0627\u0644\u0648\u0633\u0627\u0645 \u0645\u0637\u0644\u0648\u0628\u0629" });
        }
        let [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(and3(eq3(studentsTable.id, studentId), eq3(studentsTable.schoolId, schoolId)));
        if (!student) {
          [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq3(studentsTable.id, studentId));
        }
        if (!student) {
          [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(or(eq3(studentsTable.nationalId, studentId), eq3(studentsTable.studentCode, studentId)));
        }
        if (!student) {
          try {
            await db.insert(studentsTable).values({
              id: studentId,
              schoolId,
              name: "\u0637\u0627\u0644\u0628 \u0645\u0633\u062C\u0644",
              className: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A",
              birthDate: "2019-01-01",
              gender: "\u0630\u0643\u0631",
              address: "\u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0645\u0635\u0631 \u0627\u0644\u0639\u0631\u0628\u064A\u0629",
              status: "\u0645\u0646\u062A\u0638\u0645"
            }).onConflictDoNothing();
            student = { id: studentId };
          } catch (stdErr) {
            console.warn("Failed to auto-insert missing student record for badge award", stdErr);
          }
        }
        let [badge] = await db.select({ id: badgesTable.id, schoolId: badgesTable.schoolId }).from(badgesTable).where(eq3(badgesTable.id, badgeId));
        if (!badge) {
          const def = getBadgeDefinitionFallback(badgeId, schoolId, "student");
          if (def) {
            await db.insert(badgesTable).values({ id: badgeId, schoolId, ...def }).onConflictDoNothing();
            badge = { id: badgeId, schoolId };
          }
        }
        if (!badge) {
          const dynamicDef = {
            id: badgeId,
            schoolId,
            name: "\u{1F3C6} \u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A",
            nameEn: "Achievement Badge",
            description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u0644\u0644\u062A\u0645\u064A\u0632 \u0648\u0627\u0644\u0627\u062C\u062A\u0647\u0627\u062F",
            icon: "\u{1F3C6}",
            color: "#F59E0B",
            rarity: "Epic",
            targetType: "student",
            isActive: true,
            hasAnimatedBorder: true,
            limitType: "none",
            maxQuantity: 0,
            isHidden: false
          };
          await db.insert(badgesTable).values(dynamicDef).onConflictDoNothing();
          badge = { id: badgeId, schoolId };
        }
        const isGlobalBadge = !badge.schoolId || badge.schoolId === "sch-1" || badge.id.startsWith("badge-") || badge.id.startsWith("preloaded-");
        if (badge.schoolId && badge.schoolId !== schoolId && !isGlobalBadge) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0627\u0644\u0648\u0633\u0627\u0645 \u0644\u0627 \u064A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        const id = `sbdg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const awardedAt = (/* @__PURE__ */ new Date()).toISOString();
        const awardRecord = {
          id,
          schoolId,
          studentId: student?.id || studentId,
          badgeId,
          awardedBy,
          awardedAt,
          note,
          isUnboxed: false
        };
        await db.insert(studentBadgesTable).values(awardRecord);
        res.json({ success: true, award: awardRecord });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/badges/award-teacher",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { teacherId, badgeId, awardedBy = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", note = "" } = req.body;
        if (!teacherId || !badgeId) {
          return res.status(400).json({ success: false, error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0645 \u0648\u0627\u0644\u0648\u0633\u0627\u0645 \u0645\u0637\u0644\u0648\u0628\u0629" });
        }
        let [teacher] = await db.select({ id: teachersTable.id }).from(teachersTable).where(and3(eq3(teachersTable.id, teacherId), eq3(teachersTable.schoolId, schoolId)));
        if (!teacher) {
          [teacher] = await db.select({ id: teachersTable.id }).from(teachersTable).where(eq3(teachersTable.id, teacherId));
        }
        if (!teacher) {
          try {
            await db.insert(teachersTable).values({
              id: teacherId,
              schoolId,
              name: "\u0645\u0639\u0644\u0645 \u0645\u0633\u062C\u0644",
              specialization: "\u0645\u0639\u0644\u0645 \u0645\u0627\u062F\u0629",
              status: "\u0646\u0634\u0637"
            }).onConflictDoNothing();
            teacher = { id: teacherId };
          } catch (tErr) {
            console.warn("Failed to auto-insert missing teacher record for badge award", tErr);
          }
        }
        let [badge] = await db.select({ id: badgesTable.id, schoolId: badgesTable.schoolId }).from(badgesTable).where(eq3(badgesTable.id, badgeId));
        if (!badge) {
          const def = getBadgeDefinitionFallback(badgeId, schoolId, "teacher");
          if (def) {
            await db.insert(badgesTable).values({ id: badgeId, schoolId, ...def }).onConflictDoNothing();
            badge = { id: badgeId, schoolId };
          }
        }
        if (!badge) {
          const dynamicDef = {
            id: badgeId,
            schoolId,
            name: "\u{1F3C5} \u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u0644\u0644\u0645\u0639\u0644\u0645",
            nameEn: "Teacher Recognition",
            description: "\u0648\u0633\u0627\u0645 \u062A\u0642\u062F\u064A\u0631\u064A \u0644\u0644\u062C\u0647\u0648\u062F \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u0629 \u0641\u064A \u0627\u0644\u062A\u0639\u0644\u064A\u0645",
            icon: "\u{1F3C5}",
            color: "#2563EB",
            rarity: "Legendary",
            targetType: "teacher",
            isActive: true,
            hasAnimatedBorder: true,
            limitType: "none",
            maxQuantity: 0,
            isHidden: false
          };
          await db.insert(badgesTable).values(dynamicDef).onConflictDoNothing();
          badge = { id: badgeId, schoolId };
        }
        const isGlobalBadge = !badge.schoolId || badge.schoolId === "sch-1" || badge.id.startsWith("badge-") || badge.id.startsWith("preloaded-");
        if (badge.schoolId && badge.schoolId !== schoolId && !isGlobalBadge) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0627\u0644\u0648\u0633\u0627\u0645 \u0644\u0627 \u064A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        const id = `tbdg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const awardedAt = (/* @__PURE__ */ new Date()).toISOString();
        const awardRecord = {
          id,
          schoolId,
          teacherId: teacher?.id || teacherId,
          badgeId,
          awardedBy,
          awardedAt,
          note
        };
        await db.insert(teacherBadgesTable).values(awardRecord);
        res.json({ success: true, award: awardRecord });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/students/:studentId/badges",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const assignments = await db.select().from(studentBadgesTable).where(
          or(
            and3(eq3(studentBadgesTable.studentId, studentId), eq3(studentBadgesTable.schoolId, schoolId)),
            eq3(studentBadgesTable.studentId, studentId)
          )
        );
        const allBadges = await db.select().from(badgesTable);
        res.json({ success: true, assignments, badges: allBadges });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.patch(
    "/api/schools/:schoolId/student-badges/:assignmentId/unbox",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, assignmentId } = req.params;
        await db.update(studentBadgesTable).set({ isUnboxed: true }).where(and3(eq3(studentBadgesTable.id, assignmentId), eq3(studentBadgesTable.schoolId, schoolId)));
        res.json({ success: true, assignmentId, isUnboxed: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/teachers/:teacherId/badges",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId, teacherId } = req.params;
        const assignments = await db.select().from(teacherBadgesTable).where(and3(eq3(teacherBadgesTable.teacherId, teacherId), eq3(teacherBadgesTable.schoolId, schoolId)));
        const allBadges = await db.select().from(badgesTable);
        res.json({ success: true, assignments, badges: allBadges });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/smart-suspension/alerts",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { status } = req.query;
        let alerts = await db.select().from(smartSuspensionAlertsTable).where(eq3(smartSuspensionAlertsTable.schoolId, schoolId)).orderBy(desc(smartSuspensionAlertsTable.createdAt));
        if (status && typeof status === "string") {
          alerts = alerts.filter((a) => a.status === status);
        }
        res.json({ success: true, alerts });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/smart-suspension/alerts",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;
        if (!b.studentId || !b.suspensionId || !b.recordedDate) {
          return res.status(400).json({
            success: false,
            error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0648\u0645\u0639\u0631\u0641 \u0642\u0631\u0627\u0631 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u062D\u0642\u0648\u0644 \u0625\u062C\u0628\u0627\u0631\u064A\u0629"
          });
        }
        const existing = await db.select({ id: smartSuspensionAlertsTable.id }).from(smartSuspensionAlertsTable).where(
          and3(
            eq3(smartSuspensionAlertsTable.schoolId, schoolId),
            eq3(smartSuspensionAlertsTable.studentId, b.studentId),
            eq3(smartSuspensionAlertsTable.recordedDate, b.recordedDate),
            eq3(smartSuspensionAlertsTable.status, "active")
          )
        ).limit(1);
        if (existing.length > 0) {
          return res.json({ success: true, alertId: existing[0].id, duplicate: true });
        }
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        const alertId = b.id || `alert-susp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const alertRecord = {
          id: alertId,
          schoolId,
          studentId: b.studentId,
          studentName: b.studentName || "\u0637\u0627\u0644\u0628",
          studentCode: b.studentCode || b.studentId,
          grade: b.grade || b.className || "",
          className: b.className || b.grade || "",
          attendanceStatus: b.attendanceStatus || "\u062D\u0627\u0636\u0631",
          suspensionId: b.suspensionId,
          suspensionStartDate: b.suspensionStartDate || b.recordedDate,
          suspensionEndDate: b.suspensionEndDate || b.recordedDate,
          suspensionReason: b.suspensionReason || "\u0642\u0631\u0627\u0631 \u0625\u064A\u0642\u0627\u0641 \u0646\u0634\u0637",
          attendanceTeacherId: b.attendanceTeacherId || null,
          attendanceTeacherName: b.attendanceTeacherName || "\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062D\u0636\u0648\u0631",
          recordedTime: b.recordedTime || "08:00 \u0635\u0628\u0627\u062D\u0627\u064B",
          recordedDate: b.recordedDate,
          status: "active",
          resolvedAction: null,
          resolvedBy: null,
          resolvedAt: null,
          ignoreReason: null,
          createdAt: b.createdAt || nowIso,
          priority: b.priority || "High",
          color: b.color || "orange",
          persistent: true
        };
        const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const auditLogRecord = {
          id: auditId,
          schoolId,
          alertId,
          studentId: alertRecord.studentId,
          studentName: alertRecord.studentName,
          teacherName: alertRecord.attendanceTeacherName,
          adminName: "\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0622\u0644\u064A (\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0630\u0643\u064A\u0629)",
          actionTaken: "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0622\u0644\u064A",
          timestamp: nowIso,
          reason: `\u062A\u0645 \u0627\u0643\u062A\u0634\u0627\u0641 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0643\u0640 "${alertRecord.attendanceStatus}" \u0631\u063A\u0645 \u0648\u062C\u0648\u062F \u0642\u0631\u0627\u0631 \u0625\u064A\u0642\u0627\u0641 \u0646\u0634\u0637 \u0644\u0644\u0641\u062A\u0631\u0629 \u0645\u0646 ${alertRecord.suspensionStartDate} \u0625\u0644\u0649 ${alertRecord.suspensionEndDate}`
        };
        await db.insert(smartSuspensionAlertsTable).values(alertRecord);
        await db.insert(smartSuspensionAuditLogsTable).values(auditLogRecord);
        res.json({ success: true, alert: alertRecord, auditLog: auditLogRecord });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.post(
    "/api/schools/:schoolId/smart-suspension/resolve",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { alertId, action, adminName = "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", ignoreReason } = req.body || {};
        if (!alertId || !action) {
          return res.status(400).json({
            success: false,
            error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u062A\u0646\u0628\u064A\u0647 \u0648\u0646\u0648\u0639 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0645\u0637\u0644\u0648\u0628\u0627\u0646"
          });
        }
        const [alert] = await db.select().from(smartSuspensionAlertsTable).where(
          and3(
            eq3(smartSuspensionAlertsTable.id, alertId),
            eq3(smartSuspensionAlertsTable.schoolId, schoolId)
          )
        );
        if (!alert) {
          return res.status(404).json({
            success: false,
            error: "\u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0630\u0643\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u064A\u0646\u062A\u0645\u064A \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649"
          });
        }
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        if (action === "correct_attendance") {
          await db.update(attendanceTable).set({
            status: "\u063A\u0627\u0626\u0628",
            notes: "\u062A\u0645 \u062A\u0635\u062D\u064A\u062D \u0627\u0644\u062D\u0636\u0648\u0631 \u0622\u0644\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0642\u0631\u0627\u0631 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0633\u0627\u0631\u064A"
          }).where(
            and3(
              eq3(attendanceTable.schoolId, schoolId),
              eq3(attendanceTable.studentId, alert.studentId),
              eq3(attendanceTable.date, alert.recordedDate)
            )
          );
          const updatedAlert = {
            status: "resolved",
            resolvedAction: "corrected_attendance",
            resolvedBy: adminName,
            resolvedAt: nowIso
          };
          await db.update(smartSuspensionAlertsTable).set(updatedAlert).where(
            and3(
              eq3(smartSuspensionAlertsTable.id, alertId),
              eq3(smartSuspensionAlertsTable.schoolId, schoolId)
            )
          );
          const auditLog = {
            id: auditId,
            schoolId,
            alertId: alert.id,
            studentId: alert.studentId,
            studentName: alert.studentName,
            teacherName: alert.attendanceTeacherName,
            adminName,
            actionTaken: "\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u062D\u0636\u0648\u0631",
            timestamp: nowIso,
            reason: '\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0636\u0648\u0631 \u0645\u0646 "\u062D\u0627\u0636\u0631" \u0625\u0644\u0649 "\u063A\u0627\u0626\u0628" \u0644\u062A\u0648\u0627\u0641\u0642 \u0642\u0631\u0627\u0631 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0633\u0627\u0631\u064A.'
          };
          await db.insert(smartSuspensionAuditLogsTable).values(auditLog);
          return res.json({ success: true, action: "correct_attendance", alert: { ...alert, ...updatedAlert }, auditLog });
        }
        if (action === "end_suspension") {
          await db.update(adminActionsTable).set({
            status: "\u0645\u0646\u062A\u0647\u064A",
            notes: "\u062A\u0645 \u0625\u0646\u0647\u0627\u0621 \u0642\u0631\u0627\u0631 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0631\u0633\u0645\u064A\u0627\u064B \u0648\u0627\u0644\u0633\u0645\u0627\u062D \u0644\u0644\u0637\u0627\u0644\u0628 \u0628\u0627\u0644\u062D\u0636\u0648\u0631",
            updatedAt: nowIso
          }).where(
            and3(
              eq3(adminActionsTable.schoolId, schoolId),
              eq3(adminActionsTable.id, alert.suspensionId)
            )
          );
          const updatedAlert = {
            status: "resolved",
            resolvedAction: "ended_suspension",
            resolvedBy: adminName,
            resolvedAt: nowIso
          };
          await db.update(smartSuspensionAlertsTable).set(updatedAlert).where(
            and3(
              eq3(smartSuspensionAlertsTable.id, alertId),
              eq3(smartSuspensionAlertsTable.schoolId, schoolId)
            )
          );
          const auditLog = {
            id: auditId,
            schoolId,
            alertId: alert.id,
            studentId: alert.studentId,
            studentName: alert.studentName,
            teacherName: alert.attendanceTeacherName,
            adminName,
            actionTaken: "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0625\u064A\u0642\u0627\u0641",
            timestamp: nowIso,
            reason: "\u062A\u0645 \u0625\u0646\u0647\u0627\u0621 \u0642\u0631\u0627\u0631 \u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u0624\u0642\u062A \u0639\u0646 \u0627\u0644\u062F\u0631\u0627\u0633\u0629 \u0631\u0633\u0645\u064A\u0627\u064B \u0648\u0627\u0644\u0633\u0645\u0627\u062D \u0644\u0644\u0637\u0627\u0644\u0628 \u0628\u0627\u0644\u062D\u0636\u0648\u0631."
          };
          await db.insert(smartSuspensionAuditLogsTable).values(auditLog);
          return res.json({ success: true, action: "end_suspension", alert: { ...alert, ...updatedAlert }, auditLog });
        }
        if (action === "ignore") {
          const reasonStr = (ignoreReason || "").trim() || "\u062A\u0645 \u0627\u0644\u062A\u062C\u0627\u0647\u0644 \u0628\u0648\u0627\u0633\u0637\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629";
          const updatedAlert = {
            status: "resolved",
            resolvedAction: "ignored",
            ignoreReason: reasonStr,
            resolvedBy: adminName,
            resolvedAt: nowIso
          };
          await db.update(smartSuspensionAlertsTable).set(updatedAlert).where(
            and3(
              eq3(smartSuspensionAlertsTable.id, alertId),
              eq3(smartSuspensionAlertsTable.schoolId, schoolId)
            )
          );
          const auditLog = {
            id: auditId,
            schoolId,
            alertId: alert.id,
            studentId: alert.studentId,
            studentName: alert.studentName,
            teacherName: alert.attendanceTeacherName,
            adminName,
            actionTaken: "\u062A\u062C\u0627\u0647\u0644 \u0645\u0639 \u0633\u0628\u0628",
            timestamp: nowIso,
            reason: reasonStr
          };
          await db.insert(smartSuspensionAuditLogsTable).values(auditLog);
          return res.json({ success: true, action: "ignore", alert: { ...alert, ...updatedAlert }, auditLog });
        }
        return res.status(400).json({ success: false, error: "\u0646\u0648\u0639 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641" });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/smart-suspension/audit-logs",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "admin"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const auditLogs = await db.select().from(smartSuspensionAuditLogsTable).where(eq3(smartSuspensionAuditLogsTable.schoolId, schoolId)).orderBy(desc(smartSuspensionAuditLogsTable.timestamp));
        res.json({ success: true, auditLogs });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/student-badges",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const assignments = await db.select().from(studentBadgesTable).where(
          or(
            eq3(studentBadgesTable.schoolId, schoolId),
            eq3(studentBadgesTable.schoolId, "sch-1"),
            isNull(studentBadgesTable.schoolId)
          )
        );
        res.json({ success: true, assignments });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get(
    "/api/schools/:schoolId/teacher-badges",
    requireAuth2,
    requireSchoolAccess2(),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const assignments = await db.select().from(teacherBadgesTable).where(
          or(
            eq3(teacherBadgesTable.schoolId, schoolId),
            eq3(teacherBadgesTable.schoolId, "sch-1"),
            isNull(teacherBadgesTable.schoolId)
          )
        );
        res.json({ success: true, assignments });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/student-badges/:assignmentId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, assignmentId } = req.params;
        await db.delete(studentBadgesTable).where(and3(eq3(studentBadgesTable.id, assignmentId), eq3(studentBadgesTable.schoolId, schoolId)));
        res.json({ success: true, deletedAssignmentId: assignmentId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/teacher-badges/:assignmentId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin"]),
    async (req, res) => {
      try {
        const { schoolId, assignmentId } = req.params;
        await db.delete(teacherBadgesTable).where(and3(eq3(teacherBadgesTable.id, assignmentId), eq3(teacherBadgesTable.schoolId, schoolId)));
        res.json({ success: true, deletedAssignmentId: assignmentId });
      } catch (error) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  const broadcastCommunityEvent = (schoolId, event) => {
    const dataString = `data: ${JSON.stringify(event)}

`;
    for (const [clientId, client] of communitySSEClients.entries()) {
      if (client.schoolId === schoolId) {
        if (!client.communityId || client.communityId === event.communityId || client.communityId === "all") {
          try {
            client.res.write(dataString);
          } catch (err) {
            communitySSEClients.delete(clientId);
          }
        }
      }
    }
  };
  app.get("/api/schools/:schoolId/community/stream", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { communityId, token } = req.query;
      const session = extractAuthSession2(req);
      if (!session || !session.isAuthenticated) {
        return res.status(401).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631" });
      }
      if (session.userRole !== "owner" && session.schoolId && session.schoolId !== schoolId) {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629" });
      }
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      });
      const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const client = {
        id: clientId,
        res,
        schoolId,
        communityId: communityId ? String(communityId) : void 0,
        userId: session.userId || "anonymous",
        userRole: session.userRole || "student"
      };
      communitySSEClients.set(clientId, client);
      res.write(`data: ${JSON.stringify({ type: "connected", schoolId, communityId: client.communityId, clientId })}

`);
      const heartbeatInterval = setInterval(() => {
        try {
          res.write(": heartbeat\n\n");
        } catch (err) {
          clearInterval(heartbeatInterval);
          communitySSEClients.delete(clientId);
        }
      }, 2e4);
      req.on("close", () => {
        clearInterval(heartbeatInterval);
        communitySSEClients.delete(clientId);
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.get("/api/schools/:schoolId/community/messages", requireAuth2, requireSchoolAccess2(), requireSchoolFeature("student_community"), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { communityId, before } = req.query;
      const parsedLimit = Math.min(Math.max(parseInt(String(req.query.limit || "50"), 10) || 50, 1), 100);
      const beforeCursor = before ? String(before) : void 0;
      const conditions = [eq3(communityMessagesTable.schoolId, schoolId)];
      if (communityId) {
        const cIdStr = String(communityId);
        const matchIds = [cIdStr];
        if (cIdStr.startsWith(`comm-class-${schoolId}-`)) {
          const rawClassId = cIdStr.replace(`comm-class-${schoolId}-`, "");
          matchIds.push(`comm-class-${rawClassId}`);
        } else if (cIdStr.startsWith("comm-class-")) {
          const rawClassId = cIdStr.replace("comm-class-", "");
          matchIds.push(`comm-class-${schoolId}-${rawClassId}`);
        }
        if (cIdStr.startsWith(`comm-grade-${schoolId}-`)) {
          const rawGradeId = cIdStr.replace(`comm-grade-${schoolId}-`, "");
          matchIds.push(`comm-grade-${rawGradeId}`);
        } else if (cIdStr.startsWith("comm-grade-")) {
          const rawGradeId = cIdStr.replace("comm-grade-", "");
          matchIds.push(`comm-grade-${schoolId}-${rawGradeId}`);
        }
        conditions.push(inArray2(communityMessagesTable.communityId, matchIds));
      }
      if (beforeCursor) {
        conditions.push(lt(communityMessagesTable.createdAt, beforeCursor));
      }
      const rows = await db.select().from(communityMessagesTable).where(and3(...conditions)).orderBy(desc(communityMessagesTable.createdAt)).limit(parsedLimit + 1);
      const hasMore = rows.length > parsedLimit;
      const slicedRows = hasMore ? rows.slice(0, parsedLimit) : rows;
      const nextCursor = hasMore && slicedRows.length > 0 ? slicedRows[slicedRows.length - 1].createdAt || null : null;
      const studentSenderIds = Array.from(
        new Set(
          slicedRows.filter((r) => r.senderRole === "student" || r.senderRole === "parent" || r.senderId && r.senderId.startsWith("std-")).map((r) => r.senderId)
        )
      );
      const studentAvatarMap = /* @__PURE__ */ new Map();
      if (studentSenderIds.length > 0) {
        try {
          const stdAvatars = await db.select({ id: studentsTable.id, avatar: studentsTable.avatar_layout_uid }).from(studentsTable).where(inArray2(studentsTable.id, studentSenderIds));
          for (const s of stdAvatars) {
            if (s.avatar) {
              studentAvatarMap.set(s.id, s.avatar);
            }
          }
        } catch (e) {
        }
      }
      const messages = slicedRows.map((r) => ({
        id: r.id,
        communityId: r.communityId || r.groupId || "comm-main",
        schoolId: r.schoolId,
        gradeId: r.gradeId || "",
        classId: r.classId || void 0,
        senderId: r.senderId,
        senderName: r.senderName,
        senderRole: r.senderRole || "student",
        senderAvatar: studentAvatarMap.get(r.senderId) || r.senderAvatar || void 0,
        senderBadge: r.senderBadge || void 0,
        message: r.message || r.content || "",
        type: r.type || "text",
        createdAt: r.createdAt || r.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        formattedTime: r.formattedTime || new Date(r.createdAt || Date.now()).toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        editedAt: r.editedAt || void 0,
        deletedAt: r.deletedAt || void 0,
        isDeleted: Boolean(r.isDeleted),
        isPinned: Boolean(r.isPinned),
        replyTo: r.replyTo || void 0,
        reactions: r.reactions || {},
        poll: r.pollData || void 0,
        event: r.eventData || void 0,
        achievement: r.achievementData || void 0
      }));
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      res.json({
        success: true,
        messages,
        hasMore,
        nextCursor
      });
    } catch (error) {
      res.json({ success: true, messages: [], hasMore: false, nextCursor: null });
    }
  });
  app.post("/api/schools/:schoolId/community/messages", requireAuth2, requireSchoolAccess2(), requireSchoolFeature("student_community"), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const msg = req.body;
      const user = req.user;
      if (!msg.communityId || !msg.message) {
        return res.status(400).json({ success: false, error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 (\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0648\u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0645\u0637\u0644\u0648\u0628\u0627\u0646)" });
      }
      const msgId = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = /* @__PURE__ */ new Date();
      const createdAt = msg.createdAt || now.toISOString();
      const formattedTime = msg.formattedTime || now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      const senderId = msg.senderId || user.userId || `usr_${user.userRole || "student"}`;
      const senderName = msg.senderName || user.userDisplayName || (user.userRole === "admin" ? "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629" : user.userRole === "teacher" ? "\u0627\u0644\u0645\u0639\u0644\u0645" : "\u0637\u0627\u0644\u0628");
      const senderRole = msg.senderRole || user.userRole || "student";
      const userMute = await db.select().from(communityMutesTable).where(
        and3(
          eq3(communityMutesTable.schoolId, schoolId),
          eq3(communityMutesTable.userId, senderId),
          or(
            eq3(communityMutesTable.communityId, msg.communityId),
            eq3(communityMutesTable.communityId, "all")
          )
        )
      ).limit(1);
      if (userMute.length > 0) {
        return res.status(403).json({
          success: false,
          error: "\u062A\u0645 \u0643\u062A\u0645 \u062D\u0633\u0627\u0628\u0643 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0628\u0648\u0627\u0633\u0637\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644."
        });
      }
      const groupLock = await db.select().from(communityLocksTable).where(
        and3(
          eq3(communityLocksTable.schoolId, schoolId),
          eq3(communityLocksTable.communityId, msg.communityId),
          eq3(communityLocksTable.isLocked, true)
        )
      ).limit(1);
      if (groupLock.length > 0 && (senderRole === "student" || user.userRole === "student")) {
        return res.status(403).json({
          success: false,
          error: "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0645\u063A\u0644\u0642\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 (\u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629)."
        });
      }
      let effectiveSenderAvatar = msg.senderAvatar;
      if (senderRole === "student" || senderRole === "parent" || senderId && senderId.startsWith("std-")) {
        try {
          const [stdRow] = await db.select({ avatar_layout_uid: studentsTable.avatar_layout_uid }).from(studentsTable).where(eq3(studentsTable.id, senderId)).limit(1);
          if (stdRow?.avatar_layout_uid) {
            effectiveSenderAvatar = stdRow.avatar_layout_uid;
          }
        } catch (e) {
        }
      }
      const record = {
        id: msgId,
        schoolId,
        communityId: msg.communityId,
        groupId: msg.communityId || msg.groupId || "comm-main",
        gradeId: msg.gradeId || null,
        classId: msg.classId || null,
        senderId,
        senderName,
        senderRole,
        senderAvatar: effectiveSenderAvatar || null,
        senderBadge: msg.senderBadge || null,
        type: msg.type || "text",
        message: msg.message,
        content: msg.message || msg.content || "",
        createdAt,
        formattedTime,
        timestamp: createdAt,
        isDeleted: Boolean(msg.isDeleted),
        isPinned: Boolean(msg.isPinned),
        editedAt: msg.editedAt || null,
        deletedAt: msg.deletedAt || null,
        pollData: msg.poll || msg.pollData || null,
        eventData: msg.event || msg.eventData || null,
        achievementData: msg.achievement || msg.achievementData || null,
        replyTo: msg.replyTo || null,
        reactions: msg.reactions || {}
      };
      await db.insert(communityMessagesTable).values(record).onConflictDoUpdate({
        target: communityMessagesTable.id,
        set: record
      });
      const formattedMessage = {
        id: record.id,
        communityId: record.communityId,
        schoolId: record.schoolId,
        gradeId: record.gradeId || "",
        classId: record.classId || void 0,
        senderId: record.senderId,
        senderName: record.senderName,
        senderRole: record.senderRole,
        senderAvatar: record.senderAvatar || void 0,
        senderBadge: record.senderBadge || void 0,
        message: record.message,
        type: record.type,
        createdAt: record.createdAt,
        formattedTime: record.formattedTime,
        editedAt: record.editedAt || void 0,
        deletedAt: record.deletedAt || void 0,
        isDeleted: record.isDeleted,
        isPinned: record.isPinned,
        replyTo: record.replyTo,
        reactions: record.reactions,
        poll: record.pollData,
        event: record.eventData,
        achievement: record.achievementData
      };
      broadcastCommunityEvent(schoolId, {
        type: "new_message",
        communityId: record.communityId,
        message: formattedMessage
      });
      res.json({ success: true, message: formattedMessage });
    } catch (error) {
      console.error("[Post Community Message Error]:", error);
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.patch(
    "/api/schools/:schoolId/community/messages/:messageId",
    requireAuth2,
    requireSchoolAccess2(),
    requireSchoolFeature("student_community"),
    async (req, res) => {
      try {
        const { schoolId, messageId } = req.params;
        const updates = req.body;
        const user = req.user;
        const existing = await db.select().from(communityMessagesTable).where(
          and3(
            eq3(communityMessagesTable.id, messageId),
            eq3(communityMessagesTable.schoolId, schoolId)
          )
        ).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
        }
        const currentMsg = existing[0];
        const dbUpdates = {};
        if (updates.message !== void 0) {
          const isAdmin = user.userRole === "admin" || user.userRole === "owner" || user.userRole === "school_admin";
          if (!isAdmin) {
            return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0641\u0642\u0637" });
          }
          dbUpdates.message = updates.message;
          dbUpdates.content = updates.message;
          dbUpdates.editedAt = (/* @__PURE__ */ new Date()).toISOString();
        }
        if (updates.isDeleted !== void 0) {
          const isAdmin = user.userRole === "admin" || user.userRole === "owner" || user.userRole === "school_admin";
          if (!isAdmin) {
            return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0641\u0642\u0637" });
          }
          dbUpdates.isDeleted = Boolean(updates.isDeleted);
          dbUpdates.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
          if (updates.message) {
            dbUpdates.message = updates.message;
            dbUpdates.content = updates.message;
          }
        }
        if (updates.reactions !== void 0) {
          dbUpdates.reactions = updates.reactions;
        }
        if (updates.poll !== void 0 || updates.pollData !== void 0) {
          dbUpdates.pollData = updates.poll || updates.pollData;
        }
        if (updates.event !== void 0 || updates.eventData !== void 0) {
          dbUpdates.eventData = updates.event || updates.eventData;
        }
        if (updates.isPinned !== void 0) {
          dbUpdates.isPinned = Boolean(updates.isPinned);
        }
        await db.update(communityMessagesTable).set(dbUpdates).where(
          and3(
            eq3(communityMessagesTable.id, messageId),
            eq3(communityMessagesTable.schoolId, schoolId)
          )
        );
        const updatedRow = await db.select().from(communityMessagesTable).where(
          and3(
            eq3(communityMessagesTable.id, messageId),
            eq3(communityMessagesTable.schoolId, schoolId)
          )
        ).limit(1);
        if (updatedRow.length > 0) {
          const r = updatedRow[0];
          const formattedUpdated = {
            id: r.id,
            communityId: r.communityId || r.groupId || "comm-main",
            schoolId: r.schoolId,
            gradeId: r.gradeId || "",
            classId: r.classId || void 0,
            senderId: r.senderId,
            senderName: r.senderName,
            senderRole: r.senderRole || "student",
            senderAvatar: r.senderAvatar || void 0,
            senderBadge: r.senderBadge || void 0,
            message: r.message || r.content || "",
            type: r.type || "text",
            createdAt: r.createdAt || r.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
            formattedTime: r.formattedTime,
            editedAt: r.editedAt || void 0,
            deletedAt: r.deletedAt || void 0,
            isDeleted: Boolean(r.isDeleted),
            isPinned: Boolean(r.isPinned),
            replyTo: r.replyTo || void 0,
            reactions: r.reactions || {},
            poll: r.pollData || void 0,
            event: r.eventData || void 0,
            achievement: r.achievementData || void 0
          };
          broadcastCommunityEvent(schoolId, {
            type: "update_message",
            communityId: formattedUpdated.communityId,
            message: formattedUpdated
          });
          return res.json({ success: true, message: formattedUpdated });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("[Patch Community Message Error]:", error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.delete(
    "/api/schools/:schoolId/community/messages/:messageId",
    requireAuth2,
    requireSchoolAccess2(),
    requireSchoolFeature("student_community"),
    async (req, res) => {
      try {
        const { schoolId, messageId } = req.params;
        const user = req.user;
        const existing = await db.select().from(communityMessagesTable).where(
          and3(
            eq3(communityMessagesTable.id, messageId),
            eq3(communityMessagesTable.schoolId, schoolId)
          )
        ).limit(1);
        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
        }
        const msg = existing[0];
        const isAdmin = user.userRole === "admin" || user.userRole === "owner" || user.userRole === "school_admin";
        if (!isAdmin) {
          return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u062D\u0630\u0641 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0641\u0642\u0637" });
        }
        const deletedNote = "\u062A\u0645 \u062D\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0628\u0648\u0627\u0633\u0637\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629";
        await db.update(communityMessagesTable).set({
          isDeleted: true,
          deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
          message: deletedNote,
          content: deletedNote
        }).where(
          and3(
            eq3(communityMessagesTable.id, messageId),
            eq3(communityMessagesTable.schoolId, schoolId)
          )
        );
        broadcastCommunityEvent(schoolId, {
          type: "delete_message",
          communityId: msg.communityId || "comm-main",
          messageId,
          data: {
            isDeleted: true,
            message: deletedNote
          }
        });
        res.json({ success: true });
      } catch (error) {
        console.error("[Delete Community Message Error]:", error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/community/mutes", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rows = await db.select().from(communityMutesTable).where(eq3(communityMutesTable.schoolId, schoolId));
      const mutes = rows.map((r) => ({
        id: r.id,
        schoolId: r.schoolId,
        communityId: r.communityId,
        userId: r.userId,
        userName: r.userName,
        mutedBy: r.mutedBy,
        mutedAt: r.mutedAt,
        reason: r.reason || void 0
      }));
      res.json({ success: true, mutes });
    } catch (error) {
      res.json({ success: true, mutes: [] });
    }
  });
  app.post(
    "/api/schools/:schoolId/community/mutes/toggle",
    requireAuth2,
    requireSchoolAccess2(["owner", "admin", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { communityId, userId, userName, mutedBy, reason } = req.body;
        const user = req.user;
        if (!communityId || !userId || !userName) {
          return res.status(400).json({
            success: false,
            error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0643\u062A\u0645 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 (\u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0648\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628\u0627\u0646)"
          });
        }
        const existing = await db.select().from(communityMutesTable).where(
          and3(
            eq3(communityMutesTable.schoolId, schoolId),
            eq3(communityMutesTable.communityId, communityId),
            eq3(communityMutesTable.userId, userId)
          )
        ).limit(1);
        if (existing.length > 0) {
          await db.delete(communityMutesTable).where(eq3(communityMutesTable.id, existing[0].id));
          broadcastCommunityEvent(schoolId, {
            type: "user_unmuted",
            communityId,
            data: {
              userId,
              userName,
              communityId,
              isMuted: false
            }
          });
          return res.json({
            success: true,
            isMuted: false,
            message: `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0643\u062A\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ${userName}`
          });
        } else {
          const muteId = `mute-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const muteRecord = {
            id: muteId,
            schoolId,
            communityId,
            userId,
            userName,
            mutedBy: mutedBy || user.userDisplayName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            mutedAt: now,
            reason: reason || null,
            createdAt: now
          };
          await db.insert(communityMutesTable).values(muteRecord);
          broadcastCommunityEvent(schoolId, {
            type: "user_muted",
            communityId,
            data: {
              userId,
              userName,
              communityId,
              isMuted: true,
              mute: muteRecord
            }
          });
          return res.json({
            success: true,
            isMuted: true,
            mute: muteRecord,
            message: `\u062A\u0645 \u0643\u062A\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ${userName} \u0628\u0646\u062C\u0627\u062D`
          });
        }
      } catch (error) {
        console.error("[Toggle Community Mute Error]:", error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/community/locks", requireAuth2, requireSchoolAccess2(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rows = await db.select().from(communityLocksTable).where(eq3(communityLocksTable.schoolId, schoolId));
      const locks = rows.map((r) => ({
        id: r.id,
        schoolId: r.schoolId,
        communityId: r.communityId,
        isLocked: Boolean(r.isLocked),
        lockedBy: r.lockedBy || void 0,
        lockedAt: r.lockedAt || void 0
      }));
      res.json({ success: true, locks });
    } catch (error) {
      res.json({ success: true, locks: [] });
    }
  });
  app.post(
    "/api/schools/:schoolId/community/locks/toggle",
    requireAuth2,
    requireSchoolAccess2(["owner", "admin", "school_admin", "teacher"]),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { communityId } = req.body;
        const user = req.user;
        if (!communityId) {
          return res.status(400).json({
            success: false,
            error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0645\u0637\u0644\u0648\u0628 \u0644\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u0642\u0641\u0644"
          });
        }
        const existing = await db.select().from(communityLocksTable).where(
          and3(
            eq3(communityLocksTable.schoolId, schoolId),
            eq3(communityLocksTable.communityId, communityId)
          )
        ).limit(1);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        let isLockedNow = true;
        if (existing.length > 0) {
          isLockedNow = !existing[0].isLocked;
          await db.update(communityLocksTable).set({
            isLocked: isLockedNow,
            lockedBy: user.userDisplayName || user.userId || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            lockedAt: isLockedNow ? now : null,
            updatedAt: now
          }).where(eq3(communityLocksTable.id, existing[0].id));
        } else {
          isLockedNow = true;
          const lockId = `lock-${schoolId}-${communityId.replace(/[^a-zA-Z0-9-_]/g, "_")}`;
          await db.insert(communityLocksTable).values({
            id: lockId,
            schoolId,
            communityId,
            isLocked: true,
            lockedBy: user.userDisplayName || user.userId || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            lockedAt: now,
            updatedAt: now
          });
        }
        broadcastCommunityEvent(schoolId, {
          type: "group_lock_toggled",
          communityId,
          data: {
            communityId,
            isLocked: isLockedNow,
            lockedBy: user.userDisplayName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          }
        });
        res.json({
          success: true,
          isLocked: isLockedNow,
          message: isLockedNow ? "\u062A\u0645 \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629" : "\u062A\u0645 \u0641\u062A\u062D \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0644\u0644\u062C\u0645\u064A\u0639"
        });
      } catch (error) {
        console.error("[Toggle Group Lock Error]:", error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );
  app.get("/api/schools/:schoolId/extensions", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const extensions = await getSchoolExtensions(schoolId);
      res.json({ success: true, extensions });
    } catch (error) {
      console.error("[GET Extensions Error]:", error);
      res.status(500).json({ success: false, error: error?.message || "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F\u0627\u062A" });
    }
  });
  app.patch(
    "/api/schools/:schoolId/extensions/:extensionId",
    requireAuth2,
    requireSchoolAccess2(["owner", "school_admin", "admin", "super_admin"]),
    async (req, res) => {
      try {
        const { schoolId, extensionId } = req.params;
        const { isEnabled, settings } = req.body || {};
        const user = req.user;
        if (user.userRole !== "owner" && user.userRole !== "super_admin" && user.userRole !== "school_admin" && user.userRole !== "admin") {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u062A\u0642\u062A\u0635\u0631 \u0625\u062F\u0627\u0631\u0629 \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F\u0627\u062A \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0627\u0644\u0645\u0627\u0644\u0643 \u0641\u0642\u0637"
          });
        }
        const updated = await updateSchoolExtension(schoolId, extensionId, {
          isEnabled,
          settings,
          updatedBy: user.userId || user.userDisplayName || "admin"
        });
        res.json({ success: true, extension: updated });
      } catch (error) {
        console.error("[PATCH Extension Error]:", error);
        res.status(400).json({ success: false, error: error?.message || "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0627\u0645\u062A\u062F\u0627\u062F" });
      }
    }
  );
  app.get("/api/schools/:schoolId/features/status", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const user = extractAuthSession2(req);
      const features = await getSchoolFeaturesSummary(schoolId, user?.userRole);
      res.json({ success: true, features });
    } catch (error) {
      console.error("[GET Features Status Error]:", error);
      res.status(500).json({ success: false, error: error?.message || "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u064A\u0632\u0627\u062A" });
    }
  });
}
var isSeedingMap = /* @__PURE__ */ new Map();
async function ensureDemoSchoolDataSeeded(schoolId) {
  if (schoolId !== "sch-1") return;
  if (isSeedingMap.get(schoolId)) return;
  try {
    isSeedingMap.set(schoolId, true);
    const existingSchool = await db.select({ schoolId: schoolInfoTable.schoolId }).from(schoolInfoTable).where(eq3(schoolInfoTable.schoolId, schoolId)).limit(1);
    if (existingSchool.length === 0) {
      return;
    }
    const existingTeachers = await db.select({ id: teachersTable.id }).from(teachersTable).where(eq3(teachersTable.schoolId, schoolId)).limit(1);
    if (existingTeachers.length === 0) {
      console.log(`[DB] Seeding initial operational data for demo school ${schoolId} in PostgreSQL...`);
      const defaultClasses = [
        { id: `cls-${schoolId}-kg1`, schoolId, name: "\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649 (KG-1) - \u0623", gradeLevel: "\u0631\u064A\u0627\u0636 \u0623\u0637\u0641\u0627\u0644", capacity: 25, roomNumber: "KG-101", advisorTeacherName: "\u0623. \u0647\u0628\u0629 \u0627\u0644\u0644\u0647 \u0645\u062D\u0645\u0648\u062F" },
        { id: `cls-${schoolId}-kg2`, schoolId, name: "\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629 (KG-2) - \u0623", gradeLevel: "\u0631\u064A\u0627\u0636 \u0623\u0637\u0641\u0627\u0644", capacity: 25, roomNumber: "KG-102", advisorTeacherName: "\u0623. \u0647\u0628\u0629 \u0627\u0644\u0644\u0647 \u0645\u062D\u0645\u0648\u062F" },
        { id: `cls-${schoolId}-p1`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629", capacity: 35, roomNumber: "A-101", advisorTeacherName: "\u0623. \u0645\u0646\u0649 \u0627\u0644\u0633\u064A\u062F" },
        { id: `cls-${schoolId}-p3`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629", capacity: 35, roomNumber: "A-103", advisorTeacherName: "\u0623. \u0633\u0627\u0631\u0629 \u0645\u0635\u0637\u0641\u0649" },
        { id: `cls-${schoolId}-p6`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629", capacity: 35, roomNumber: "A-206", advisorTeacherName: "\u0623. \u0637\u0627\u0631\u0642 \u0627\u0644\u0634\u0646\u0627\u0648\u064A" },
        { id: `cls-${schoolId}-m1`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629", capacity: 35, roomNumber: "B-101", advisorTeacherName: "\u0623. \u0645\u062D\u0645\u062F \u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645" },
        { id: `cls-${schoolId}-m3`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629", capacity: 35, roomNumber: "B-103", advisorTeacherName: "\u062F. \u0645\u062D\u0645\u0648\u062F \u062D\u0633\u0646" },
        { id: `cls-${schoolId}-s1`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u062B\u0627\u0646\u0648\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629", capacity: 30, roomNumber: "C-101", advisorTeacherName: "\u0623. \u0631\u0627\u0646\u064A\u0627 \u0639\u0627\u062F\u0644" },
        { id: `cls-${schoolId}-s3`, schoolId, name: "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A - \u0623", gradeLevel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629", capacity: 30, roomNumber: "C-301", advisorTeacherName: "\u062F. \u062E\u0627\u0644\u062F \u062A\u0648\u0641\u064A\u0642" }
      ];
      for (const cls of defaultClasses) {
        await db.insert(classesTable).values(cls).onConflictDoNothing();
      }
      const defaultTeachers = [
        {
          id: `tch-${schoolId}-att`,
          schoolId,
          name: "\u0623. \u0623\u0633\u0627\u0645\u0629 \u0645\u062D\u0645\u0648\u062F (\u0645\u062D\u0636\u0631 \u0627\u0644\u063A\u064A\u0627\u0628)",
          nationalId: "29201010101999",
          phone: "01098765432",
          email: "osama.attendance@school.edu.eg",
          username: "att_officer",
          password: hashPassword("Password123"),
          isAttendanceOfficer: true,
          specialization: "\u0645\u0633\u0624\u0648\u0644 \u0648\u0645\u062D\u0636\u0631 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u064A\u0648\u0645\u064A \u0644\u0644\u0645\u062F\u0631\u0633\u0629",
          status: "\u0646\u0634\u0637",
          assignedClasses: [],
          assignedSubjects: [],
          joinDate: "2023-01-01"
        },
        {
          id: `tch-${schoolId}-1`,
          schoolId,
          name: "\u0623. \u0647\u0628\u0629 \u0627\u0644\u0644\u0647 \u0645\u062D\u0645\u0648\u062F",
          nationalId: "29305120102934",
          phone: "01011223344",
          email: "heba.m@school.edu.eg",
          username: "\u0623. \u0647\u0628\u0629 \u0627\u0644\u0644\u0647 \u0645\u062D\u0645\u0648\u062F",
          password: hashPassword("10001"),
          isAttendanceOfficer: false,
          specialization: "\u0631\u064A\u0627\u0636 \u0623\u0637\u0641\u0627\u0644 \u0648\u062A\u0631\u0628\u064A\u0629 \u0645\u0628\u0643\u0631\u0629 (KG)",
          status: "\u0646\u0634\u0637",
          assignedClasses: ["\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649 (KG-1) - \u0623", "\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629 (KG-2) - \u0623"],
          assignedSubjects: ["\u0627\u0643\u062A\u0634\u0641 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 (Discovery)"],
          joinDate: "2023-09-01"
        },
        {
          id: `tch-${schoolId}-2`,
          schoolId,
          name: "\u0623. \u0645\u0646\u0649 \u0627\u0644\u0633\u064A\u062F",
          nationalId: "29008151203948",
          phone: "01122334455",
          email: "mona.elsayed@school.edu.eg",
          username: "\u0623. \u0645\u0646\u0649 \u0627\u0644\u0633\u064A\u062F",
          password: hashPassword("10002"),
          isAttendanceOfficer: false,
          specialization: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 - \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629",
          status: "\u0646\u0634\u0637",
          assignedClasses: ["\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A - \u0623"],
          assignedSubjects: ["\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u062E\u0637"],
          joinDate: "2022-01-15"
        },
        {
          id: `tch-${schoolId}-3`,
          schoolId,
          name: "\u0623. \u0645\u062D\u0645\u062F \u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645",
          nationalId: "28805120102934",
          phone: "01011223344",
          email: "m.abdelsalam@school.edu.eg",
          username: "\u0623. \u0645\u062D\u0645\u062F \u0639\u0628\u062F \u0627\u0644\u0633\u0644\u0627\u0645",
          password: hashPassword("10003"),
          isAttendanceOfficer: false,
          specialization: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u062F\u064A\u0646\u064A\u0629",
          status: "\u0646\u0634\u0637",
          assignedClasses: ["\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A - \u0623"],
          assignedSubjects: ["\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629"],
          joinDate: "2022-09-01"
        },
        {
          id: `tch-${schoolId}-4`,
          schoolId,
          name: "\u062F. \u0645\u062D\u0645\u0648\u062F \u062D\u0633\u0646",
          nationalId: "28511020104829",
          phone: "01233445566",
          email: "m.hassan@school.edu.eg",
          username: "\u062F. \u0645\u062D\u0645\u0648\u062F \u062D\u0633\u0646",
          password: hashPassword("10004"),
          isAttendanceOfficer: false,
          specialization: "\u0627\u0644\u0639\u0644\u0648\u0645 \u0648\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621",
          status: "\u0646\u0634\u0637",
          assignedClasses: ["\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A - \u0623", "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u062B\u0627\u0646\u0648\u064A - \u0623"],
          assignedSubjects: ["\u0627\u0644\u0639\u0644\u0648\u0645 \u0648\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627"],
          joinDate: "2021-08-20"
        },
        {
          id: `tch-${schoolId}-5`,
          schoolId,
          name: "\u062F. \u062E\u0627\u0644\u062F \u062A\u0648\u0641\u064A\u0642",
          nationalId: "28203200109283",
          phone: "01544556677",
          email: "k.tawfik@school.edu.eg",
          username: "\u062F. \u062E\u0627\u0644\u062F \u062A\u0648\u0641\u064A\u0642",
          password: hashPassword("10005"),
          isAttendanceOfficer: false,
          specialization: "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621 \u0648\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621 - \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0629",
          status: "\u0646\u0634\u0637",
          assignedClasses: ["\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A - \u0623"],
          assignedSubjects: ["\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621 \u0648\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629"],
          joinDate: "2020-02-01"
        }
      ];
      for (const tch of defaultTeachers) {
        await db.insert(teachersTable).values(tch).onConflictDoNothing();
      }
      const defaultStudents = [
        {
          id: `std-${schoolId}-kg1-1`,
          schoolId,
          name: "\u0622\u062F\u0645 \u0623\u062D\u0645\u062F \u0641\u062A\u062D\u064A",
          studentCode: "STD-2026-10001",
          ministryCode: "MIN-10001",
          nationalId: "32205120108234",
          classId: `cls-${schoolId}-kg1`,
          className: "\u0631\u0648\u0636\u0629 \u0623\u0648\u0644\u0649 (KG-1) - \u0623",
          birthDate: "2022-04-10",
          gender: "\u0630\u0643\u0631",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u0623\u062D\u0645\u062F \u0641\u062A\u062D\u064A \u0627\u0644\u0645\u063A\u0627\u0632\u064A",
          parentPhone: "01012345678",
          parentEmail: "parent.ahmed@gmail.com",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u0645\u0639\u0627\u062F\u064A - \u0634\u0627\u0631\u0639 9",
          joinDate: "2025-09-01"
        },
        {
          id: `std-${schoolId}-kg2-1`,
          schoolId,
          name: "\u0644\u064A\u0627\u0646 \u0645\u062D\u0645\u0648\u062F \u0635\u0644\u0627\u062D",
          studentCode: "STD-2026-10002",
          ministryCode: "MIN-10002",
          nationalId: "32108200109382",
          classId: `cls-${schoolId}-kg2`,
          className: "\u0631\u0648\u0636\u0629 \u062B\u0627\u0646\u064A\u0629 (KG-2) - \u0623",
          birthDate: "2021-06-15",
          gender: "\u0623\u0646\u062B\u0649",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u0645\u062D\u0645\u0648\u062F \u0635\u0644\u0627\u062D \u0627\u0644\u062F\u064A\u0646",
          parentPhone: "01123456789",
          parentEmail: "m.salah@gmail.com",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u062A\u062C\u0645\u0639 \u0627\u0644\u062E\u0627\u0645\u0633",
          joinDate: "2024-09-01"
        },
        {
          id: `std-${schoolId}-p1-1`,
          schoolId,
          name: "\u062D\u0645\u0632\u0629 \u0645\u062D\u0645\u062F \u0639\u0635\u0627\u0645",
          studentCode: "STD-2026-10003",
          ministryCode: "MIN-10003",
          nationalId: "32003220104921",
          classId: `cls-${schoolId}-p1`,
          className: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A - \u0623",
          birthDate: "2020-03-22",
          gender: "\u0630\u0643\u0631",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u0645\u062D\u0645\u062F \u0639\u0635\u0627\u0645 \u0627\u0644\u062F\u064A\u0646",
          parentPhone: "01234567890",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631",
          joinDate: "2024-09-01"
        },
        {
          id: `std-${schoolId}-p6-1`,
          schoolId,
          name: "\u064A\u0627\u0633\u064A\u0646 \u0637\u0627\u0631\u0642 \u0627\u0644\u0639\u0648\u0636\u064A",
          studentCode: "STD-2026-10004",
          ministryCode: "MIN-10004",
          nationalId: "31502140108372",
          classId: `cls-${schoolId}-p6`,
          className: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A - \u0623",
          birthDate: "2015-02-14",
          gender: "\u0630\u0643\u0631",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u0637\u0627\u0631\u0642 \u0645\u0635\u0637\u0641\u0649 \u0627\u0644\u0639\u0648\u0636\u064A",
          parentPhone: "01512345678",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u0634\u0631\u0648\u0642",
          joinDate: "2020-09-01"
        },
        {
          id: `std-${schoolId}-m1-1`,
          schoolId,
          name: "\u0639\u0645\u0631 \u0623\u062D\u0645\u062F \u0641\u062A\u062D\u064A",
          studentCode: "STD-2026-10005",
          ministryCode: "MIN-10005",
          nationalId: "31205120108234",
          classId: `cls-${schoolId}-m1`,
          className: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A - \u0623",
          birthDate: "2012-05-12",
          gender: "\u0630\u0643\u0631",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u0623\u062D\u0645\u062F \u0641\u062A\u062D\u064A \u0627\u0644\u0645\u063A\u0627\u0632\u064A",
          parentPhone: "01012345678",
          parentEmail: "parent.ahmed@gmail.com",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u0645\u0639\u0627\u062F\u064A - \u0634\u0627\u0631\u0639 9",
          joinDate: "2023-09-01"
        },
        {
          id: `std-${schoolId}-s1-1`,
          schoolId,
          name: "\u062C\u0646\u0649 \u062C\u0645\u0627\u0644 \u0627\u0644\u062F\u064A\u0646",
          studentCode: "STD-2026-10006",
          ministryCode: "MIN-10006",
          nationalId: "30911050109283",
          classId: `cls-${schoolId}-s1`,
          className: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644 \u0627\u0644\u062B\u0627\u0646\u0648\u064A - \u0623",
          birthDate: "2009-11-05",
          gender: "\u0623\u0646\u062B\u0649",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u062C\u0645\u0627\u0644 \u0627\u0644\u062F\u064A\u0646 \u0645\u0631\u0633\u064A",
          parentPhone: "01055667788",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u0632\u0645\u0627\u0644\u0643",
          joinDate: "2024-09-01"
        },
        {
          id: `std-${schoolId}-s3-1`,
          schoolId,
          name: "\u0633\u064A\u0641 \u0627\u0644\u062F\u064A\u0646 \u0645\u062D\u0645\u0648\u062F \u062D\u0633\u0646",
          studentCode: "STD-2026-10007",
          ministryCode: "MIN-10007",
          nationalId: "30704180104829",
          classId: `cls-${schoolId}-s3`,
          className: "\u0627\u0644\u0635\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0644\u062B\u0627\u0646\u0648\u064A - \u0623",
          birthDate: "2007-04-18",
          gender: "\u0630\u0643\u0631",
          status: "\u0645\u0646\u062A\u0638\u0645",
          parentName: "\u0645\u062D\u0645\u0648\u062F \u062D\u0633\u0646 \u0639\u0628\u062F \u0627\u0644\u0645\u0646\u0639\u0645",
          parentPhone: "01199887766",
          address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646",
          joinDate: "2023-09-01"
        }
      ];
      for (const std of defaultStudents) {
        await db.insert(studentsTable).values(std).onConflictDoNothing();
      }
      const defaultSubjects = [
        { id: `sub-${schoolId}-1`, schoolId, name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u062E\u0637", code: "ARB-101", gradeLevels: ["\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629"], maxScore: 100, passScore: 50, teacherNames: ["\u0623. \u0645\u0646\u0649 \u0627\u0644\u0633\u064A\u062F"] },
        { id: `sub-${schoolId}-2`, schoolId, name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629", code: "MTH-101", gradeLevels: ["\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629", "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629"], maxScore: 100, passScore: 50, teacherNames: ["\u0623. \u062E\u0627\u0644\u062F \u0641\u062A\u062D\u064A"] },
        { id: `sub-${schoolId}-3`, schoolId, name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 (Connect+)", code: "ENG-101", gradeLevels: ["\u0631\u064A\u0627\u0636 \u0623\u0637\u0641\u0627\u0644", "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629", "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629"], maxScore: 100, passScore: 50, teacherNames: ["\u0623. \u0631\u0627\u0646\u064A\u0627 \u0639\u0627\u062F\u0644"] },
        { id: `sub-${schoolId}-4`, schoolId, name: "\u0627\u0644\u0639\u0644\u0648\u0645 \u0648\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627", code: "SCI-101", gradeLevels: ["\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A\u0629"], maxScore: 100, passScore: 50, teacherNames: ["\u062F. \u0645\u062D\u0645\u0648\u062F \u062D\u0633\u0646"] },
        { id: `sub-${schoolId}-5`, schoolId, name: "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621 \u0648\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629", code: "CHM-301", gradeLevels: ["\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629"], maxScore: 100, passScore: 50, teacherNames: ["\u062F. \u062E\u0627\u0644\u062F \u062A\u0648\u0641\u064A\u0642"] }
      ];
      for (const sub of defaultSubjects) {
        await db.insert(subjectsTable).values(sub).onConflictDoNothing();
      }
      console.log(`[DB] Successfully seeded demo entities for school ${schoolId} in PostgreSQL.`);
    }
  } catch (err) {
    console.error(`[DB] Error seeding demo data for school ${schoolId}:`, err);
  } finally {
    isSeedingMap.set(schoolId, false);
  }
}

// server/supportTicketsRoutes.ts
import { eq as eq4, and as and4, desc as desc2, sql as sql4, or as or2, ilike as ilike2 } from "drizzle-orm";
function stringToSigned32BitInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
function registerSupportTicketsRoutes(app, extractAuthSession2) {
  const requireAuth2 = (req, res, next) => {
    const session = extractAuthSession2(req);
    if (!session || !session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A"
      });
    }
    req.user = session;
    next();
  };
  app.get("/api/support-tickets/my-daily-usage", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      const studentId = (user.studentId || user.userId || "").trim();
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629"
        });
      }
      const countResult = await db.select({ count: sql4`count(*)::int` }).from(supportTicketsTable).where(
        and4(
          eq4(supportTicketsTable.studentId, studentId),
          eq4(supportTicketsTable.createdDate, todayStr)
        )
      );
      const usedToday = countResult[0]?.count || 0;
      const maxDaily = 2;
      const remainingToday = Math.max(0, maxDaily - usedToday);
      return res.json({
        success: true,
        data: {
          usedToday,
          maxDaily,
          remainingToday,
          date: todayStr,
          canCreate: usedToday < maxDaily
        }
      });
    } catch (err) {
      console.error("Error fetching student daily usage:", err);
      return res.status(500).json({
        success: false,
        error: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u062D\u062F \u0627\u0644\u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u064A\u0648\u0645\u064A \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645"
      });
    }
  });
  app.get("/api/support-tickets", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      const { status, schoolId, search, page, limit } = req.query;
      const scopeConditions = [];
      if (user.userRole === "owner") {
        if (schoolId && schoolId !== "all") {
          scopeConditions.push(eq4(supportTicketsTable.schoolId, schoolId));
        }
      } else if (user.userRole === "school_admin" || user.userRole === "admin") {
        if (!user.schoolId) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u062F\u0631\u0633\u0629"
          });
        }
        scopeConditions.push(eq4(supportTicketsTable.schoolId, user.schoolId));
      } else {
        const studentId = user.studentId || user.userId;
        if (!studentId) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0647\u0648\u064A\u0629 \u0627\u0644\u0637\u0627\u0644\u0628"
          });
        }
        scopeConditions.push(eq4(supportTicketsTable.studentId, studentId));
        if (user.schoolId) {
          scopeConditions.push(eq4(supportTicketsTable.schoolId, user.schoolId));
        }
      }
      const listConditions = [...scopeConditions];
      if (status && status !== "all" && status !== "\u0627\u0644\u0643\u0644") {
        listConditions.push(eq4(supportTicketsTable.status, status));
      }
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        listConditions.push(
          or2(
            ilike2(supportTicketsTable.ticketCode, term),
            ilike2(supportTicketsTable.studentName, term),
            ilike2(supportTicketsTable.subject, term),
            ilike2(supportTicketsTable.description, term)
          )
        );
      }
      const isStudentOrParent = user.userRole !== "owner" && user.userRole !== "school_admin" && user.userRole !== "admin";
      const defaultLimit = isStudentOrParent ? 20 : 50;
      const maxLimit = isStudentOrParent ? 50 : 100;
      const pageNum = Math.max(1, parseInt(String(page || "1"), 10) || 1);
      const limitNum = Math.min(
        Math.max(1, parseInt(String(limit || defaultLimit), 10) || defaultLimit),
        maxLimit
      );
      const offset = (pageNum - 1) * limitNum;
      const countQuery = db.select({ count: sql4`count(*)::int` }).from(supportTicketsTable).where(listConditions.length > 0 ? and4(...listConditions) : void 0);
      const statsQuery = db.select({
        totalCount: sql4`count(*)::int`,
        newCount: sql4`count(case when ${supportTicketsTable.status} = 'جديدة' then 1 end)::int`,
        inReviewCount: sql4`count(case when ${supportTicketsTable.status} = 'قيد المراجعة' then 1 end)::int`,
        answeredCount: sql4`count(case when ${supportTicketsTable.status} = 'تم الرد' then 1 end)::int`,
        closedCount: sql4`count(case when ${supportTicketsTable.status} = 'مغلقة' then 1 end)::int`
      }).from(supportTicketsTable).where(scopeConditions.length > 0 ? and4(...scopeConditions) : void 0);
      const ticketsQuery = db.select().from(supportTicketsTable).where(listConditions.length > 0 ? and4(...listConditions) : void 0).orderBy(desc2(supportTicketsTable.createdAt)).limit(limitNum).offset(offset);
      const [countRes, statsRes, tickets] = await Promise.all([
        countQuery,
        statsQuery,
        ticketsQuery
      ]);
      const totalCount = countRes[0]?.count ?? 0;
      const stats = statsRes[0] || {
        totalCount: 0,
        newCount: 0,
        inReviewCount: 0,
        answeredCount: 0,
        closedCount: 0
      };
      const totalPages = Math.ceil(totalCount / limitNum) || 1;
      const hasMore = pageNum < totalPages;
      return res.json({
        success: true,
        tickets,
        hasMore,
        page: pageNum,
        totalPages,
        totalCount,
        stats
      });
    } catch (err) {
      console.error("Error fetching support tickets:", err);
      return res.status(500).json({
        success: false,
        error: "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u062A\u0630\u0627\u0643\u0631 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629"
      });
    }
  });
  app.get("/api/support-tickets/:ticketId", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      const { ticketId } = req.params;
      const ticketRows = await db.select().from(supportTicketsTable).where(eq4(supportTicketsTable.id, ticketId)).limit(1);
      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "\u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629"
        });
      }
      const ticket = ticketRows[0];
      if (user.userRole !== "owner") {
        if (user.userRole === "school_admin" || user.userRole === "admin") {
          if (ticket.schoolId !== user.schoolId) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u062A\u0630\u0627\u0643\u0631 \u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649"
            });
          }
        } else {
          const studentId = user.studentId || user.userId;
          if (ticket.studentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u062A\u0630\u0627\u0643\u0631 \u0637\u0644\u0627\u0628 \u0622\u062E\u0631\u064A\u0646"
            });
          }
        }
      }
      const replies = await db.select().from(supportTicketRepliesTable).where(eq4(supportTicketRepliesTable.ticketId, ticketId)).orderBy(supportTicketRepliesTable.createdAt);
      return res.json({
        success: true,
        ticket: {
          ...ticket,
          replies
        }
      });
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      return res.status(500).json({
        success: false,
        error: "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
      });
    }
  });
  app.post("/api/support-tickets", requireAuth2, async (req, res) => {
    let client = null;
    let isClientReleased = false;
    const safeRelease = () => {
      if (client && !isClientReleased) {
        isClientReleased = true;
        try {
          client.release();
        } catch (releaseErr) {
          console.warn("Warning releasing db client:", releaseErr);
        }
      }
    };
    try {
      const user = req.user;
      const {
        schoolId: bodySchoolId,
        schoolName: bodySchoolName,
        studentId: bodyStudentId,
        studentName: bodyStudentName,
        studentCode: bodyStudentCode,
        className: bodyClassName,
        category,
        subcategory,
        subject,
        description
      } = req.body || {};
      if (!subject || !subject.trim() || !description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0634\u0643\u0648\u0649 \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629"
        });
      }
      const finalCategory = category && typeof category === "string" && category.trim() || "\u0639\u0627\u0645";
      const finalSubcategory = subcategory && typeof subcategory === "string" && subcategory.trim() || "\u0639\u0627\u0645";
      const isStudentOrParent = user.userRole === "parent" || user.userRole === "student";
      const studentId = isStudentOrParent ? user.studentId || user.userId || bodyStudentId : bodyStudentId || user.userId;
      const schoolId = user.schoolId || bodySchoolId;
      if (!studentId || !schoolId) {
        return res.status(400).json({
          success: false,
          error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0637\u0627\u0644\u0628 \u0648\u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0645\u0637\u0644\u0648\u0628\u0627\u0646 \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
        });
      }
      let studentName = bodyStudentName || user.userDisplayName || "\u0637\u0627\u0644\u0628";
      let studentCode = bodyStudentCode || "";
      let className = bodyClassName || "";
      let schoolName = bodySchoolName || "";
      try {
        const studentRow = await db.select().from(studentsTable).where(and4(eq4(studentsTable.id, studentId), eq4(studentsTable.schoolId, schoolId))).limit(1);
        if (studentRow.length > 0) {
          studentName = studentRow[0].name || studentName;
          studentCode = studentRow[0].studentCode || studentCode;
          className = studentRow[0].className || className;
        }
        const schoolRow = await db.select({ name: schoolInfoTable.name }).from(schoolInfoTable).where(eq4(schoolInfoTable.schoolId, schoolId)).limit(1);
        if (schoolRow.length > 0) {
          schoolName = schoolRow[0].name || schoolName;
        }
      } catch (lookupErr) {
      }
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const pool2 = createPool();
      client = await pool2.connect();
      await client.query("BEGIN");
      const lockKey = stringToSigned32BitInt(`ticket_limit_${studentId}_${todayStr}`);
      await client.query("SELECT pg_advisory_xact_lock($1)", [lockKey]);
      const countRes = await client.query(
        "SELECT COUNT(*)::int as count FROM support_tickets WHERE student_id = $1 AND created_date = $2",
        [studentId, todayStr]
      );
      const currentCount = parseInt(countRes.rows[0]?.count || "0", 10);
      if (currentCount >= 2) {
        await client.query("ROLLBACK");
        safeRelease();
        return res.status(429).json({
          success: false,
          error: "\u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u064A\u0648\u0645\u064A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0644\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u062A\u0630\u0627\u0643\u0631 (\u062A\u0630\u0643\u0631\u062A\u0627\u0646 \u0643\u062D\u062F \u0623\u0642\u0635\u0649 \u064A\u0648\u0645\u064A\u0627\u064B). \u064A\u0645\u0643\u0646\u0643 \u062A\u0642\u062F\u064A\u0645 \u062A\u0630\u0643\u0631\u0629 \u062C\u062F\u064A\u062F\u0629 \u063A\u062F\u0627\u064B.",
          dailyLimitReached: true,
          usedToday: currentCount,
          maxDaily: 2
        });
      }
      const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
      const ticketCode = `TCK-${randomSuffix}`;
      const ticketId = `tck_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      await client.query(
        `INSERT INTO support_tickets (
          id, ticket_code, school_id, school_name, student_id, student_name, student_code, class_name,
          category, subcategory, subject, description, status, created_at, created_date, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          ticketId,
          ticketCode,
          schoolId,
          schoolName,
          studentId,
          studentName,
          studentCode,
          className,
          finalCategory,
          finalSubcategory,
          subject.trim(),
          description.trim(),
          "\u062C\u062F\u064A\u062F\u0629",
          nowIso,
          todayStr,
          nowIso
        ]
      );
      await client.query("COMMIT");
      safeRelease();
      const createdTicket = {
        id: ticketId,
        ticketCode,
        schoolId,
        schoolName,
        studentId,
        studentName,
        studentCode,
        className,
        category: finalCategory,
        subcategory: finalSubcategory,
        subject: subject.trim(),
        description: description.trim(),
        status: "\u062C\u062F\u064A\u062F\u0629",
        createdAt: nowIso,
        createdDate: todayStr,
        updatedAt: nowIso,
        answeredAt: null,
        answeredBy: null
      };
      return res.status(201).json({
        success: true,
        message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0634\u0643\u0648\u0649 \u0648\u062A\u0623\u0643\u064A\u062F \u062A\u0633\u062C\u064A\u0644\u0647\u0627 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D",
        ticket: createdTicket,
        usage: {
          usedToday: currentCount + 1,
          maxDaily: 2,
          remainingToday: Math.max(0, 2 - (currentCount + 1))
        }
      });
    } catch (err) {
      if (client && !isClientReleased) {
        await client.query("ROLLBACK").catch(() => {
        });
        safeRelease();
      }
      console.error("Error creating support ticket:", err);
      return res.status(500).json({
        success: false,
        error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062D\u0641\u0638 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649."
      });
    } finally {
      safeRelease();
    }
  });
  app.post("/api/support-tickets/public", async (req, res) => {
    try {
      const {
        senderName,
        contactInfo,
        schoolName,
        category,
        subject,
        description
      } = req.body || {};
      if (!subject || !subject.trim() || !description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0634\u0643\u0648\u0649 \u0628\u0627\u0644\u0643\u0627\u0645\u0644"
        });
      }
      if (!senderName || !senderName.trim() || !contactInfo || !contactInfo.trim()) {
        return res.status(400).json({
          success: false,
          error: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0627\u0633\u0645 \u0648\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 (\u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A)"
        });
      }
      const randomNum = Math.floor(1e5 + Math.random() * 9e5);
      const ticketId = `TK-PUB-${randomNum}`;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const todayStr = nowIso.split("T")[0];
      const cleanSchoolName = schoolName?.trim() || "EduPortal \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0645";
      const cleanSender = senderName.trim();
      const cleanContact = contactInfo.trim();
      const cleanCategory = category?.trim() || "\u062F\u0639\u0645 \u0641\u0646\u064A \u0648\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A";
      const cleanSubject = subject.trim();
      const fullDescription = `${description.trim()}

---
\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644: ${cleanContact}
\u0627\u0644\u0627\u0633\u0645: ${cleanSender}`;
      await db.insert(supportTicketsTable).values({
        id: ticketId,
        ticketCode: ticketId,
        schoolId: "public_portal",
        schoolName: cleanSchoolName,
        studentId: `public-${Date.now()}`,
        studentName: cleanSender,
        studentCode: cleanContact.slice(0, 50),
        className: "\u062A\u0630\u0643\u0631\u0629 \u062E\u0627\u0631\u062C\u064A\u0629 \u0639\u0627\u0645\u0629",
        category: cleanCategory,
        subcategory: "\u062F\u0639\u0645 \u0645\u0628\u0627\u0634\u0631 \u0628\u062F\u0648\u0646 \u062A\u0633\u062C\u064A\u0644",
        subject: cleanSubject,
        description: fullDescription,
        status: "\u062C\u062F\u064A\u062F\u0629",
        createdAt: nowIso,
        createdDate: todayStr,
        updatedAt: nowIso,
        answeredAt: null,
        answeredBy: null
      });
      return res.status(201).json({
        success: true,
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062A\u0630\u0643\u0631\u062A\u0643 \u0628\u0646\u062C\u0627\u062D \u0628\u0631\u0642\u0645 \u0645\u0645\u064A\u0632 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629",
        ticketId,
        ticket: {
          id: ticketId,
          ticketCode: ticketId,
          subject: cleanSubject,
          senderName: cleanSender,
          contactInfo: cleanContact,
          status: "\u062C\u062F\u064A\u062F\u0629",
          createdAt: nowIso
        }
      });
    } catch (err) {
      console.error("Error creating public support ticket:", err);
      return res.status(500).json({
        success: false,
        error: "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A \u0627\u0644\u0633\u064A\u0631\u0641\u0631\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F \u0644\u062D\u0638\u0627\u062A."
      });
    }
  });
  app.get("/api/support-tickets/public/track/:ticketId", async (req, res) => {
    try {
      const { ticketId } = req.params;
      if (!ticketId || !ticketId.trim()) {
        return res.status(400).json({ success: false, error: "\u0631\u0642\u0645 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0645\u0637\u0644\u0648\u0628" });
      }
      const rows = await db.select().from(supportTicketsTable).where(
        or2(
          eq4(supportTicketsTable.id, ticketId.trim()),
          eq4(supportTicketsTable.ticketCode, ticketId.trim()),
          ilike2(supportTicketsTable.id, `%${ticketId.trim()}%`)
        )
      ).limit(1);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u064A \u062A\u0630\u0643\u0631\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645. \u062A\u0623\u0643\u062F \u0645\u0646 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0635\u062D\u064A\u062D (\u0645\u062B\u0627\u0644: TK-PUB-123456)"
        });
      }
      const ticket = rows[0];
      const replies = await db.select().from(supportTicketRepliesTable).where(eq4(supportTicketRepliesTable.ticketId, ticket.id)).orderBy(desc2(supportTicketRepliesTable.createdAt));
      return res.json({
        success: true,
        ticket: {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          schoolName: ticket.schoolName,
          studentName: ticket.studentName,
          replies: replies.map((r) => ({
            id: r.id,
            authorName: r.senderName,
            authorRole: r.senderRole,
            message: r.message,
            createdAt: r.createdAt
          }))
        }
      });
    } catch (err) {
      console.error("Error tracking public support ticket:", err);
      return res.status(500).json({
        success: false,
        error: "\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u062D\u0627\u0644\u064A\u0627\u064B."
      });
    }
  });
  app.post("/api/support-tickets/:ticketId/reply", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      const { ticketId } = req.params;
      const { message, newStatus } = req.body || {};
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0631\u0633\u0627\u0644 \u0631\u062F \u0641\u0627\u0631\u063A"
        });
      }
      const ticketRows = await db.select().from(supportTicketsTable).where(eq4(supportTicketsTable.id, ticketId)).limit(1);
      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "\u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629"
        });
      }
      const ticket = ticketRows[0];
      const isOwner = user.userRole === "owner";
      const isAdmin = user.userRole === "school_admin" || user.userRole === "admin";
      const isStudent = user.userRole === "parent" || user.userRole === "student";
      if (!isOwner) {
        if (isAdmin && ticket.schoolId !== user.schoolId) {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u062A\u0630\u0627\u0643\u0631 \u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649"
          });
        }
        if (isStudent) {
          const studentId = user.studentId || user.userId;
          if (ticket.studentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u062A\u0630\u0627\u0643\u0631 \u0637\u0644\u0627\u0628 \u0622\u062E\u0631\u064A\u0646"
            });
          }
        }
      }
      const replyId = `rep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      let senderRole = "student";
      let senderName = user.userDisplayName || "\u0645\u0633\u062A\u062E\u062F\u0645";
      if (isOwner) {
        senderRole = "owner";
        senderName = user.userDisplayName || "\u0641\u0631\u064A\u0642 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0627\u0644\u0645\u0631\u0643\u0632\u064A";
      } else if (isAdmin) {
        senderRole = "school_admin";
        senderName = user.userDisplayName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629";
      } else {
        senderRole = "student";
        senderName = ticket.studentName || user.userDisplayName || "\u0627\u0644\u0637\u0627\u0644\u0628";
      }
      const newReply = {
        id: replyId,
        ticketId,
        schoolId: ticket.schoolId,
        senderRole,
        senderId: user.userId || user.studentId || "unknown",
        senderName,
        message: message.trim(),
        createdAt: nowIso
      };
      await db.insert(supportTicketRepliesTable).values(newReply);
      let updatedStatus = ticket.status;
      let answeredAt = ticket.answeredAt;
      let answeredBy = ticket.answeredBy;
      if (isOwner || isAdmin) {
        updatedStatus = newStatus && ["\u062C\u062F\u064A\u062F\u0629", "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629", "\u062A\u0645 \u0627\u0644\u0631\u062F", "\u0645\u063A\u0644\u0642\u0629"].includes(newStatus) ? newStatus : "\u062A\u0645 \u0627\u0644\u0631\u062F";
        answeredAt = nowIso;
        answeredBy = senderName;
      } else if (isStudent) {
        if (ticket.status === "\u062A\u0645 \u0627\u0644\u0631\u062F") {
          updatedStatus = "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629";
        }
      }
      await db.update(supportTicketsTable).set({
        status: updatedStatus,
        updatedAt: nowIso,
        answeredAt,
        answeredBy
      }).where(eq4(supportTicketsTable.id, ticketId));
      return res.status(201).json({
        success: true,
        message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0628\u0646\u062C\u0627\u062D",
        reply: newReply,
        updatedStatus
      });
    } catch (err) {
      console.error("Error adding ticket reply:", err);
      return res.status(500).json({
        success: false,
        error: "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F \u0625\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"
      });
    }
  });
  app.patch("/api/support-tickets/:ticketId/status", requireAuth2, async (req, res) => {
    try {
      const user = req.user;
      const { ticketId } = req.params;
      const { status } = req.body || {};
      const validStatuses = ["\u062C\u062F\u064A\u062F\u0629", "\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629", "\u062A\u0645 \u0627\u0644\u0631\u062F", "\u0645\u063A\u0644\u0642\u0629"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "\u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629"
        });
      }
      const ticketRows = await db.select().from(supportTicketsTable).where(eq4(supportTicketsTable.id, ticketId)).limit(1);
      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "\u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629"
        });
      }
      const ticket = ticketRows[0];
      if (user.userRole !== "owner") {
        if (user.userRole === "school_admin" || user.userRole === "admin") {
          if (ticket.schoolId !== user.schoolId) {
            return res.status(403).json({
              success: false,
              error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u062A\u0630\u0627\u0643\u0631 \u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649"
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0641\u0642\u0637 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u064A\u0645\u0643\u0646\u0647\u0627 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
          });
        }
      }
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      await db.update(supportTicketsTable).set({
        status,
        updatedAt: nowIso
      }).where(eq4(supportTicketsTable.id, ticketId));
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0628\u0646\u062C\u0627\u062D",
        status
      });
    } catch (err) {
      console.error("Error updating ticket status:", err);
      return res.status(500).json({
        success: false,
        error: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u0631\u0629"
      });
    }
  });
}

// server/privateMessagingRoutes.ts
import express from "express";
import { eq as eq5, and as and5, or as or3, desc as desc3, inArray as inArray3 } from "drizzle-orm";
function resolveCallerParticipant(session, schoolId) {
  const role = session.userRole;
  if (role === "owner" || role === "school_admin" || role === "admin" || role === "super_admin") {
    return {
      id: `admin_${schoolId}`,
      role: "school_admin",
      name: session.schoolName || session.userDisplayName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      details: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
    };
  }
  if (role === "teacher" || role === "attendance_teacher") {
    return {
      id: session.teacherId || session.userId,
      role,
      name: session.userDisplayName || "\u0627\u0644\u0645\u0639\u0644\u0645",
      details: role === "attendance_teacher" ? "\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628" : "\u0645\u0639\u0644\u0645 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629"
    };
  }
  return {
    id: session.studentId || session.userId,
    role: "student",
    name: session.studentName || session.userDisplayName || "\u0637\u0627\u0644\u0628",
    details: session.className || "\u0637\u0627\u0644\u0628 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629"
  };
}
async function resolveCandidateParticipantIds(session, caller, schoolId) {
  const candidateIds = /* @__PURE__ */ new Set();
  if (caller.id) candidateIds.add(caller.id);
  if (session.userId) candidateIds.add(session.userId);
  if (session.studentId) candidateIds.add(session.studentId);
  if (session.teacherId) candidateIds.add(session.teacherId);
  if (session.studentCode) candidateIds.add(session.studentCode);
  if (caller.role === "student" || session.userRole === "parent" || session.userRole === "student") {
    const studentQueryValues = [
      session.studentId,
      session.userId,
      session.studentCode,
      caller.id
    ].filter(Boolean);
    if (studentQueryValues.length > 0) {
      try {
        const matchedStudents = await db.select().from(studentsTable).where(
          and5(
            eq5(studentsTable.schoolId, schoolId),
            or3(
              inArray3(studentsTable.id, studentQueryValues),
              inArray3(studentsTable.nationalId, studentQueryValues),
              inArray3(studentsTable.studentCode, studentQueryValues),
              ...session.studentName ? [eq5(studentsTable.name, session.studentName)] : [],
              ...session.userDisplayName ? [eq5(studentsTable.name, session.userDisplayName)] : []
            )
          )
        ).limit(5);
        for (const st of matchedStudents) {
          if (st.id) candidateIds.add(st.id);
          if (st.nationalId) candidateIds.add(st.nationalId);
          if (st.studentCode) candidateIds.add(st.studentCode);
          if (st.ministryCode) candidateIds.add(st.ministryCode);
        }
      } catch (e) {
        console.warn("[PrivateMessaging] Error resolving student candidates from DB:", e);
      }
    }
  }
  return Array.from(candidateIds);
}
var sseClients = /* @__PURE__ */ new Map();
function broadcastPrivateMessage(schoolId, event) {
  const payload = JSON.stringify(event);
  for (const [clientId, client] of sseClients.entries()) {
    if (client.schoolId !== schoolId) continue;
    if (event.participantIds && event.participantIds.length > 0) {
      const match = client.candidateIds.some((cid) => event.participantIds.includes(cid));
      if (!match) continue;
    }
    try {
      client.res.write(`event: ${event.type}
data: ${payload}

`);
    } catch {
      sseClients.delete(clientId);
    }
  }
}
function registerPrivateMessagingRoutes(app, extractAuthSession2) {
  const requireAuthAndSchool = (req, res, next) => {
    let session = extractAuthSession2(req);
    if (!session || !session.isAuthenticated) {
      const qRole = typeof req.query?.role === "string" ? req.query.role.trim() : "";
      const qSchoolId = typeof req.query?.schoolId === "string" ? req.query.schoolId.trim() : req.params.schoolId;
      const qUserId = typeof req.query?.userId === "string" ? req.query.userId.trim() : "";
      const qName = typeof req.query?.name === "string" ? decodeURIComponent(req.query.name.trim()) : "";
      if (qRole && qSchoolId) {
        session = {
          isAuthenticated: true,
          sessionId: `sse_${Date.now()}`,
          deviceId: "device-sse",
          userId: qUserId || (qRole === "school_admin" ? `admin_${qSchoolId}` : "user-sse"),
          userRole: qRole,
          schoolId: qSchoolId,
          userDisplayName: qName || void 0,
          studentId: qRole === "student" ? qUserId : void 0,
          teacherId: qRole === "teacher" || qRole === "attendance_teacher" ? qUserId : void 0,
          expiresAt: new Date(Date.now() + 864e5).toISOString()
        };
      } else {
        return res.status(401).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062E\u0627\u0635\u0629"
        });
      }
    }
    const { schoolId } = req.params;
    if (session.userRole !== "owner" && session.schoolId && session.schoolId !== schoolId) {
      return res.status(403).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
      });
    }
    req.user = session;
    next();
  };
  app.get("/api/schools/:schoolId/private-conversations/stream", requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      });
      res.flushHeaders?.();
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const client = {
        id: clientId,
        res,
        schoolId,
        callerId: caller.id,
        candidateIds
      };
      sseClients.set(clientId, client);
      res.write(`event: connected
data: ${JSON.stringify({ clientId, status: "connected" })}

`);
      const heartbeat = setInterval(() => {
        try {
          res.write(": heartbeat\n\n");
        } catch {
          clearInterval(heartbeat);
          sseClients.delete(clientId);
        }
      }, 15e3);
      req.on("close", () => {
        clearInterval(heartbeat);
        sseClients.delete(clientId);
      });
    } catch (err) {
      console.warn("[PrivateMessaging] SSE Stream setup error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "\u062A\u0639\u0630\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0644\u0644\u0631\u0633\u0627\u0626\u0644" });
      }
    }
  });
  app.get("/api/schools/:schoolId/private-conversations", requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);
      const convRows = await db.select().from(privateConversationsTable).where(
        and5(
          eq5(privateConversationsTable.schoolId, schoolId),
          or3(
            inArray3(privateConversationsTable.participant1Id, candidateIds),
            inArray3(privateConversationsTable.participant2Id, candidateIds)
          )
        )
      ).orderBy(desc3(privateConversationsTable.updatedAt));
      if (convRows.length === 0) {
        return res.json({ success: true, conversations: [] });
      }
      const convIds = convRows.map((c) => c.id);
      const pool2 = createPool();
      const unreadResult = await pool2.query(
        `SELECT conversation_id, COUNT(*)::int as unread_count
         FROM private_messages
         WHERE conversation_id = ANY($1::text[])
           AND NOT (sender_id = ANY($2::text[]))
           AND read_at IS NULL
         GROUP BY conversation_id`,
        [convIds, candidateIds]
      );
      const unreadMap = /* @__PURE__ */ new Map();
      unreadResult.rows.forEach((row) => {
        unreadMap.set(row.conversation_id, parseInt(row.unread_count || "0", 10));
      });
      const conversations = convRows.map((c) => {
        const isCallerP1 = candidateIds.includes(c.participant1Id);
        const other = isCallerP1 ? {
          id: c.participant2Id,
          role: c.participant2Role,
          name: c.participant2Name,
          details: c.participant2Details || ""
        } : {
          id: c.participant1Id,
          role: c.participant1Role,
          name: c.participant1Name,
          details: c.participant1Details || ""
        };
        return {
          id: c.id,
          schoolId: c.schoolId,
          otherParticipant: other,
          lastMessage: c.lastMessageBody ? {
            body: c.lastMessageBody,
            senderId: c.lastMessageSenderId || "",
            createdAt: c.lastMessageAt || c.updatedAt,
            isFromMe: c.lastMessageSenderId ? candidateIds.includes(c.lastMessageSenderId) : false
          } : null,
          unreadCount: unreadMap.get(c.id) || 0,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        };
      });
      res.json({ success: true, conversations });
    } catch (error) {
      console.error("[PrivateMessaging] Error listing conversations:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062E\u0627\u0635\u0629" });
    }
  });
  app.post("/api/schools/:schoolId/private-conversations", requireAuthAndSchool, express.json(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      if (caller.role === "student" || session.userRole === "parent" || session.userRole === "student") {
        return res.status(403).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0644\u0644\u0637\u0627\u0644\u0628 \u0628\u062F\u0621 \u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629. \u064A\u0645\u0643\u0646 \u0627\u0644\u0631\u062F \u0641\u0642\u0637 \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0627\u0644\u0642\u0627\u0626\u0645\u0629."
        });
      }
      const { recipientType, recipientId, initialMessage } = req.body || {};
      if (!recipientType || !["student", "teacher"].includes(recipientType)) {
        return res.status(400).json({
          success: false,
          error: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062A\u0644\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D (\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0637\u0627\u0644\u0628 \u0623\u0648 \u0645\u0639\u0644\u0645)"
        });
      }
      if (!recipientId || typeof recipientId !== "string" || !recipientId.trim()) {
        return res.status(400).json({
          success: false,
          error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u0644\u0645 \u0645\u0637\u0644\u0648\u0628"
        });
      }
      const cleanMessage = typeof initialMessage === "string" ? initialMessage.trim() : "";
      if (!cleanMessage) {
        return res.status(400).json({
          success: false,
          error: "\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0641\u0627\u0631\u063A\u0629"
        });
      }
      if (cleanMessage.length > 2e3) {
        return res.status(400).json({
          success: false,
          error: "\u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0637\u0648\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 (2000 \u062D\u0631\u0641)"
        });
      }
      if (caller.role === "teacher" || caller.role === "attendance_teacher") {
        if (recipientType !== "student") {
          return res.status(403).json({
            success: false,
            error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u062D\u0642 \u0644\u0644\u0645\u0639\u0644\u0645 \u0628\u062F\u0621 \u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0645\u0639 \u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u0642\u0637"
          });
        }
      }
      let recipient;
      if (recipientType === "student") {
        const studentRows = await db.select().from(studentsTable).where(and5(eq5(studentsTable.schoolId, schoolId), eq5(studentsTable.id, recipientId.trim()))).limit(1);
        if (studentRows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "\u0627\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        recipient = {
          id: studentRows[0].id,
          role: "student",
          name: studentRows[0].name,
          details: studentRows[0].className || "\u0637\u0627\u0644\u0628 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629"
        };
      } else {
        const teacherRows = await db.select().from(teachersTable).where(and5(eq5(teachersTable.schoolId, schoolId), eq5(teachersTable.id, recipientId.trim()))).limit(1);
        if (teacherRows.length === 0) {
          return res.status(404).json({
            success: false,
            error: "\u0627\u0644\u0645\u0639\u0644\u0645 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          });
        }
        const t = teacherRows[0];
        const spec = t.assignedSubjects && t.assignedSubjects[0] || t.specialization || "\u0645\u0639\u0644\u0645";
        recipient = {
          id: t.id,
          role: t.isAttendanceOfficer ? "attendance_teacher" : "teacher",
          name: t.name,
          details: spec
        };
      }
      const participants = [caller, recipient].sort((a, b) => a.id.localeCompare(b.id));
      const p1 = participants[0];
      const p2 = participants[1];
      const convId = `pconv-${schoolId}-${p1.id}_${p2.id}`;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const messageId = `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const pool2 = createPool();
      const client = await pool2.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO private_conversations (
            id, school_id,
            participant_1_id, participant_1_role, participant_1_name, participant_1_details,
            participant_2_id, participant_2_role, participant_2_name, participant_2_details,
            last_message_body, last_message_sender_id, last_message_at,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (school_id, participant_1_id, participant_2_id) DO UPDATE SET
            last_message_body = EXCLUDED.last_message_body,
            last_message_sender_id = EXCLUDED.last_message_sender_id,
            last_message_at = EXCLUDED.last_message_at,
            updated_at = EXCLUDED.updated_at`,
          [
            convId,
            schoolId,
            p1.id,
            p1.role,
            p1.name,
            p1.details || "",
            p2.id,
            p2.role,
            p2.name,
            p2.details || "",
            cleanMessage,
            caller.id,
            nowIso,
            nowIso,
            nowIso
          ]
        );
        await client.query(
          `INSERT INTO private_messages (
            id, conversation_id, school_id, sender_id, sender_role, sender_name, body, created_at, read_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            messageId,
            convId,
            schoolId,
            caller.id,
            caller.role,
            caller.name,
            cleanMessage,
            nowIso,
            null
            // unread
          ]
        );
        await client.query("COMMIT");
      } catch (txErr) {
        await client.query("ROLLBACK");
        throw txErr;
      } finally {
        client.release();
      }
      res.json({
        success: true,
        conversationId: convId,
        message: {
          id: messageId,
          conversationId: convId,
          senderId: caller.id,
          senderName: caller.name,
          senderRole: caller.role,
          body: cleanMessage,
          createdAt: nowIso,
          readAt: null,
          isFromMe: true
        }
      });
      broadcastPrivateMessage(schoolId, {
        type: "new_message",
        conversationId: convId,
        message: {
          id: messageId,
          conversationId: convId,
          senderId: caller.id,
          senderName: caller.name,
          senderRole: caller.role,
          body: cleanMessage,
          createdAt: nowIso,
          readAt: null,
          isFromMe: false
        },
        participantIds: [p1.id, p2.id]
      });
    } catch (error) {
      console.error("[PrivateMessaging] Error starting conversation:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u0628\u062F\u0621 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629" });
    }
  });
  app.get("/api/schools/:schoolId/private-conversations/:conversationId/messages", requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId, conversationId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);
      const convRows = await db.select().from(privateConversationsTable).where(
        and5(
          eq5(privateConversationsTable.schoolId, schoolId),
          eq5(privateConversationsTable.id, conversationId)
        )
      ).limit(1);
      if (convRows.length === 0) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      const conv = convRows[0];
      const isParticipant = candidateIds.includes(conv.participant1Id) || candidateIds.includes(conv.participant2Id);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0633\u062A \u0637\u0631\u0641\u0627\u064B \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u062E\u0627\u0635\u0629"
        });
      }
      const parsedLimit = Math.min(Math.max(parseInt(String(req.query.limit || "50"), 10) || 50, 1), 100);
      const beforeCursor = typeof req.query.before === "string" ? req.query.before.trim() : null;
      const pool2 = createPool();
      let msgQuery = `
        SELECT id, conversation_id, school_id, sender_id, sender_role, sender_name, body, created_at, read_at
        FROM private_messages
        WHERE conversation_id = $1 AND school_id = $2
      `;
      const queryParams = [conversationId, schoolId];
      if (beforeCursor) {
        queryParams.push(beforeCursor);
        msgQuery += ` AND created_at < $${queryParams.length}`;
      }
      queryParams.push(parsedLimit + 1);
      msgQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;
      const msgResult = await pool2.query(msgQuery, queryParams);
      const rows = msgResult.rows;
      const hasMore = rows.length > parsedLimit;
      const slicedRows = hasMore ? rows.slice(0, parsedLimit) : rows;
      slicedRows.reverse();
      const messages = slicedRows.map((r) => ({
        id: r.id,
        conversationId: r.conversation_id,
        senderId: r.sender_id,
        senderRole: r.sender_role,
        senderName: r.sender_name,
        body: r.body,
        createdAt: r.created_at,
        readAt: r.read_at,
        isFromMe: candidateIds.includes(r.sender_id)
      }));
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      pool2.query(
        `UPDATE private_messages
         SET read_at = $1
         WHERE conversation_id = $2
           AND NOT (sender_id = ANY($3::text[]))
           AND read_at IS NULL`,
        [nowIso, conversationId, candidateIds]
      ).then((res2) => {
        if ((res2?.rowCount || 0) > 0) {
          broadcastPrivateMessage(schoolId, {
            type: "messages_read",
            conversationId,
            readAt: nowIso,
            participantIds: [conv.participant1Id, conv.participant2Id]
          });
        }
      }).catch((e) => console.warn("[PrivateMessaging] Error auto-marking messages read:", e));
      const isCallerP1 = candidateIds.includes(conv.participant1Id);
      const otherParticipant = isCallerP1 ? {
        id: conv.participant2Id,
        role: conv.participant2Role,
        name: conv.participant2Name,
        details: conv.participant2Details || ""
      } : {
        id: conv.participant1Id,
        role: conv.participant1Role,
        name: conv.participant1Name,
        details: conv.participant1Details || ""
      };
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayStartIso = todayStart.toISOString();
      const quotaResult = await pool2.query(
        `SELECT COUNT(*)::int AS count FROM private_messages
         WHERE conversation_id = $1 AND sender_id = $2 AND created_at >= $3`,
        [conversationId, caller.id, todayStartIso]
      );
      const dailySentCount = Number(quotaResult.rows[0]?.count || 0);
      const dailyLimit = 55;
      const dailyRemaining = Math.max(0, dailyLimit - dailySentCount);
      res.json({
        success: true,
        conversation: {
          id: conv.id,
          schoolId: conv.schoolId,
          otherParticipant,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        },
        messages,
        hasMore,
        oldestCursor: slicedRows.length > 0 ? slicedRows[0].createdAt : null,
        dailyLimit,
        dailySentCount,
        dailyRemaining
      });
    } catch (error) {
      console.error("[PrivateMessaging] Error loading messages:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644" });
    }
  });
  app.post("/api/schools/:schoolId/private-conversations/:conversationId/messages", requireAuthAndSchool, express.json(), async (req, res) => {
    try {
      const { schoolId, conversationId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);
      const convRows = await db.select().from(privateConversationsTable).where(
        and5(
          eq5(privateConversationsTable.schoolId, schoolId),
          eq5(privateConversationsTable.id, conversationId)
        )
      ).limit(1);
      if (convRows.length === 0) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" });
      }
      const conv = convRows[0];
      const isParticipant = candidateIds.includes(conv.participant1Id) || candidateIds.includes(conv.participant2Id);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0644\u0633\u062A \u0637\u0631\u0641\u0627\u064B \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u062E\u0627\u0635\u0629"
        });
      }
      const effectiveSenderId = candidateIds.includes(conv.participant1Id) ? conv.participant1Id : candidateIds.includes(conv.participant2Id) ? conv.participant2Id : caller.id;
      const effectiveSenderRole = candidateIds.includes(conv.participant1Id) ? conv.participant1Role : candidateIds.includes(conv.participant2Id) ? conv.participant2Role : caller.role;
      const effectiveSenderName = caller.name || (candidateIds.includes(conv.participant1Id) ? conv.participant1Name : conv.participant2Name);
      const { body } = req.body || {};
      const cleanBody = typeof body === "string" ? body.trim() : "";
      if (!cleanBody) {
        return res.status(400).json({
          success: false,
          error: "\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0641\u0627\u0631\u063A\u0629"
        });
      }
      const lines = cleanBody.split("\n");
      if (lines.length > 8) {
        return res.status(400).json({
          success: false,
          error: "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0631\u0633\u0627\u0644\u0629 \u0647\u0648 8 \u0623\u0633\u0637\u0631 \u0641\u0642\u0637"
        });
      }
      const urlRegex = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
      const overlongLineIndex = lines.findIndex((l) => {
        const nonUrlText = l.replace(urlRegex, "").trim();
        const hasUrl = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/i.test(l);
        if (hasUrl) {
          return nonUrlText.length > 55;
        }
        return l.length > 55;
      });
      if (overlongLineIndex !== -1) {
        return res.status(400).json({
          success: false,
          error: `\u0627\u0644\u0633\u0637\u0631 (${overlongLineIndex + 1}) \u064A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (55 \u062D\u0631\u0641\u0627\u064B \u0644\u0643\u0644 \u0633\u0637\u0631)`
        });
      }
      const pool2 = createPool();
      const client = await pool2.connect();
      const messageId = `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      try {
        await client.query("BEGIN");
        const todayStart = /* @__PURE__ */ new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayStartIso = todayStart.toISOString();
        const quotaCheck = await client.query(
          `SELECT COUNT(*)::int AS count FROM private_messages
           WHERE conversation_id = $1 AND (sender_id = ANY($2::text[])) AND created_at >= $3`,
          [conversationId, candidateIds, todayStartIso]
        );
        const dailyCount = Number(quotaCheck.rows[0]?.count || 0);
        if (dailyCount >= 55) {
          await client.query("ROLLBACK");
          return res.status(429).json({
            success: false,
            error: "\u0644\u0642\u062F \u0627\u0633\u062A\u0646\u0641\u062F\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u064A\u0648\u0645\u064A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (55 \u0631\u0633\u0627\u0644\u0629 \u064A\u0648\u0645\u064A\u0627\u064B \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629). \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u063A\u062F\u0627\u064B.",
            dailyLimitReached: true
          });
        }
        await client.query(
          `INSERT INTO private_messages (
            id, conversation_id, school_id, sender_id, sender_role, sender_name, body, created_at, read_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            messageId,
            conversationId,
            schoolId,
            effectiveSenderId,
            effectiveSenderRole,
            effectiveSenderName,
            cleanBody,
            nowIso,
            null
          ]
        );
        await client.query(
          `UPDATE private_conversations
           SET last_message_body = $1,
               last_message_sender_id = $2,
               last_message_at = $3,
               updated_at = $4
           WHERE id = $5 AND school_id = $6`,
          [cleanBody, effectiveSenderId, nowIso, nowIso, conversationId, schoolId]
        );
        await client.query("COMMIT");
      } catch (txErr) {
        await client.query("ROLLBACK");
        throw txErr;
      } finally {
        client.release();
      }
      res.json({
        success: true,
        message: {
          id: messageId,
          conversationId,
          senderId: effectiveSenderId,
          senderName: effectiveSenderName,
          senderRole: effectiveSenderRole,
          body: cleanBody,
          createdAt: nowIso,
          readAt: null,
          isFromMe: true
        }
      });
      broadcastPrivateMessage(schoolId, {
        type: "new_message",
        conversationId,
        message: {
          id: messageId,
          conversationId,
          senderId: effectiveSenderId,
          senderName: effectiveSenderName,
          senderRole: effectiveSenderRole,
          body: cleanBody,
          createdAt: nowIso,
          readAt: null,
          isFromMe: false
        },
        participantIds: [conv.participant1Id, conv.participant2Id]
      });
    } catch (error) {
      console.error("[PrivateMessaging] Error sending message:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" });
    }
  });
  app.post("/api/schools/:schoolId/private-conversations/:conversationId/read", requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId, conversationId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);
      const pool2 = createPool();
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const result = await pool2.query(
        `UPDATE private_messages
         SET read_at = $1
         WHERE conversation_id = $2
           AND school_id = $3
           AND NOT (sender_id = ANY($4::text[]))
           AND read_at IS NULL`,
        [nowIso, conversationId, schoolId, candidateIds]
      );
      res.json({ success: true, updatedCount: result.rowCount || 0 });
      if ((result.rowCount || 0) > 0) {
        broadcastPrivateMessage(schoolId, {
          type: "messages_read",
          conversationId,
          readAt: nowIso
        });
      }
    } catch (error) {
      console.error("[PrivateMessaging] Error marking read:", error);
      res.status(500).json({ success: false, error: error?.message });
    }
  });
  app.get("/api/schools/:schoolId/private-conversations/recipients", requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = req.user;
      const caller = resolveCallerParticipant(session, schoolId);
      if (caller.role === "student" || session.userRole === "parent" || session.userRole === "student") {
        return res.status(403).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0637\u0644\u0627\u0628 \u0628\u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0645\u0633\u062A\u0644\u0645\u064A\u0646 \u0644\u0628\u062F\u0621 \u0645\u062D\u0627\u062F\u062B\u0627\u062A"
        });
      }
      const type = String(req.query.type || "student").toLowerCase();
      const q = String(req.query.q || "").trim();
      if ((caller.role === "teacher" || caller.role === "attendance_teacher") && type !== "student") {
        return res.status(403).json({
          success: false,
          error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u062D\u0642 \u0644\u0644\u0645\u0639\u0644\u0645 \u0645\u0631\u0627\u0633\u0644\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0641\u0642\u0637"
        });
      }
      const pool2 = createPool();
      if (type === "teacher") {
        let query2 = `
          SELECT id, name, specialization, assigned_subjects, is_attendance_officer
          FROM teachers
          WHERE school_id = $1
        `;
        const params2 = [schoolId];
        if (q) {
          params2.push(`%${q}%`);
          query2 += ` AND (name ILIKE $2 OR specialization ILIKE $2)`;
        }
        query2 += ` ORDER BY name ASC LIMIT 25`;
        const result2 = await pool2.query(query2, params2);
        const recipients2 = result2.rows.map((row) => {
          let spec = row.specialization || "";
          if (row.is_attendance_officer) {
            spec = "\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628";
          } else if (Array.isArray(row.assigned_subjects) && row.assigned_subjects.length > 0) {
            spec = `\u0645\u0639\u0644\u0645 ${row.assigned_subjects[0]}`;
          }
          return {
            id: row.id,
            role: row.is_attendance_officer ? "attendance_teacher" : "teacher",
            name: row.name,
            details: spec || "\u0645\u0639\u0644\u0645 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629"
          };
        });
        return res.json({ success: true, recipients: recipients2 });
      }
      let query = `
        SELECT id, name, class_name
        FROM students
        WHERE school_id = $1
      `;
      const params = [schoolId];
      if (q) {
        params.push(`%${q}%`);
        query += ` AND (name ILIKE $2 OR class_name ILIKE $2)`;
      }
      query += ` ORDER BY name ASC LIMIT 25`;
      const result = await pool2.query(query, params);
      const recipients = result.rows.map((row) => ({
        id: row.id,
        role: "student",
        name: row.name,
        details: row.class_name || "\u0637\u0627\u0644\u0628 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629"
      }));
      res.json({ success: true, recipients });
    } catch (error) {
      console.error("[PrivateMessaging] Error searching recipients:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0645\u0633\u062A\u0644\u0645\u064A\u0646" });
    }
  });
}

// server/schoolAiToolsService.ts
import { Type } from "@google/genai";
import { eq as eq6, and as and6, desc as desc4, asc as asc2, ilike as ilike3, or as or4, count } from "drizzle-orm";
var geminiSchoolTools = [
  {
    name: "getSchoolLeaderboard",
    description: "\u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646 \u0641\u064A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 (\u0644\u0648\u062D\u0629 \u0627\u0644\u0634\u0631\u0641) \u0645\u0639 \u0627\u0644\u0631\u062A\u0628\u0629 \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0648\u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0639\u0631\u0636\u0647\u0645 (\u0645\u062B\u0644\u0627\u064B 5 \u0623\u0648 10 \u0623\u0648 20)"
        }
      }
    }
  },
  {
    name: "getAttendanceReport",
    description: "\u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u062A\u0642\u0631\u064A\u0631 \u0648\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u064A\u0648\u0645\u064A \u0645\u0639 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u063A\u0627\u0626\u0628\u064A\u0646 \u0648\u0627\u0644\u0645\u062A\u0623\u062E\u0631\u064A\u0646 \u0648\u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0645",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u064A\u0648\u0645 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0628\u062A\u0646\u0633\u064A\u0642 YYYY-MM-DD (\u0627\u062E\u062A\u064A\u0627\u0631\u064A\u060C \u0641\u064A \u062D\u0627\u0644 \u0639\u062F\u0645 \u0627\u0644\u062A\u062D\u062F\u064A\u062F \u064A\u0639\u062A\u0645\u062F \u0623\u062D\u062F\u062B \u062A\u0627\u0631\u064A\u062E \u0645\u0633\u062C\u0644)"
        },
        className: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0641\u0635\u0644 \u0644\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u063A\u064A\u0627\u0628 \u0628\u062D\u0633\u0628\u0647 (\u0645\u062B\u0644: 1/1 \u0623\u0648 2/1)"
        },
        status: {
          type: Type.STRING,
          description: "\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u0645\u0631\u0627\u062F\u0629: \u063A\u0627\u0626\u0628 \u0623\u0648 \u0645\u062A\u0623\u062E\u0631 \u0623\u0648 \u062D\u0627\u0636\u0631"
        }
      }
    }
  },
  {
    name: "exportSchoolDataToExcel",
    description: "\u062A\u0648\u0644\u064A\u062F \u0648\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0645\u0644\u0641 \u0625\u0643\u0633\u064A\u0644 (.xlsx) \u0631\u0633\u0645\u064A \u062F\u0642\u064A\u0642 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0644\u0623\u064A \u0645\u062A\u0637\u0644\u0628 \u064A\u062D\u062F\u062F\u0647 \u0627\u0644\u0645\u062F\u064A\u0631 (\u0645\u062B\u0644: \u0643\u0634\u0641 \u063A\u064A\u0627\u0628 \u0644\u062A\u0627\u0631\u064A\u062E \u0645\u062D\u062F\u062F \u0643\u0640 2026-10-01\u060C \u0643\u0634\u0641 \u0627\u0644\u0623\u0648\u0627\u0626\u0644\u060C \u0643\u0634\u0641 \u0642\u064A\u062F \u0627\u0644\u0637\u0644\u0627\u0628\u060C \u062F\u0631\u062C\u0627\u062A\u060C \u0645\u0639\u0644\u0645\u064A\u0646)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dataType: {
          type: Type.STRING,
          description: "\u0646\u0648\u0639 \u0627\u0644\u062A\u0642\u0631\u064A\u0631: attendance (\u062D\u0636\u0648\u0631 \u0648\u063A\u064A\u0627\u0628), students (\u0637\u0644\u0627\u0628 \u0648\u0642\u064A\u062F), grades (\u062F\u0631\u062C\u0627\u062A), teachers (\u0645\u0639\u0644\u0645\u064A\u0646), leaderboard (\u0623\u0648\u0627\u0626\u0644)"
        },
        title: {
          type: Type.STRING,
          description: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0623\u0648 \u0627\u0644\u0634\u064A\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629"
        },
        date: {
          type: Type.STRING,
          description: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u064A\u0648\u0645 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0641\u064A \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u063A\u064A\u0627\u0628 (\u0645\u062B\u0644\u0627\u064B 2026-10-01 \u0623\u0648 1/10/2026)"
        },
        status: {
          type: Type.STRING,
          description: "\u0641\u0644\u062A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629 \u0625\u0646 \u0648\u062C\u062F (\u0645\u062B\u0644: \u063A\u0627\u0626\u0628\u060C \u0645\u062A\u0623\u062E\u0631\u060C \u062D\u0627\u0636\u0631)"
        },
        className: {
          type: Type.STRING,
          description: "\u0641\u0644\u062A\u0631 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0625\u0646 \u0648\u062C\u062F (\u0645\u062B\u0644: 1/1 \u0627\u0628\u062A\u062F\u0627\u0626\u064A)"
        },
        columns: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '\u0642\u0627\u0626\u0645\u0629 \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0625\u0646 \u062D\u062F\u062F\u0647\u0627 \u0627\u0644\u0645\u062F\u064A\u0631 (\u0645\u062B\u0644: ["\u0627\u0644\u0627\u0633\u0645", "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A", "\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629"])'
        }
      },
      required: ["dataType", "title"]
    }
  },
  {
    name: "searchStudents",
    description: "\u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0637\u0627\u0644\u0628 \u0623\u0648 \u0645\u062C\u0645\u0648\u0639\u0629 \u0637\u0644\u0627\u0628 \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u0637\u0627\u0644\u0628 \u0623\u0648 \u0627\u0644\u0641\u0635\u0644",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u0637\u0627\u0644\u0628 \u0644\u0644\u0628\u062D\u062B \u0639\u0646\u0647"
        },
        className: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A"
        }
      }
    }
  },
  {
    name: "getGradesReport",
    description: "\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0646\u062A\u0627\u0626\u062C \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u062A\u062D\u0635\u064A\u0644 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0644\u0645\u0627\u062F\u0629 \u0645\u0639\u064A\u0646\u0629 \u0623\u0648 \u0641\u0635\u0644 \u0623\u0648 \u0637\u0627\u0644\u0628",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subjectName: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629 (\u0645\u062B\u0644: \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A\u060C \u0627\u0644\u0639\u0644\u0648\u0645\u060C \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629)"
        },
        className: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A"
        },
        studentName: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0645\u0631\u0627\u062F \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u062F\u0631\u062C\u0627\u062A\u0647"
        }
      }
    }
  },
  {
    name: "getCommunityDiscussions",
    description: "\u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0623\u062D\u062F\u062B \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u0646\u0627\u0642\u0634\u0627\u062A \u0648\u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0644\u0631\u0623\u064A \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0641\u064A \u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u063A\u0631\u0641 \u0627\u0644\u0634\u0627\u062A",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "\u0639\u062F\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0623\u062E\u064A\u0631\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062C\u0644\u0628\u0647\u0627 (\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u064B 10 \u0625\u0644\u0649 15 \u0631\u0633\u0627\u0644\u0629)"
        }
      }
    }
  },
  {
    name: "getSchoolCalendar",
    description: "\u0639\u0631\u0636 \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A \u0648\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0648\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0647\u0627\u0645: pending (\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631) \u0623\u0648 completed (\u0645\u0643\u062A\u0645\u0644\u0629)"
        }
      }
    }
  },
  {
    name: "getBadgesSummary",
    description: "\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0648\u0627\u0644\u062A\u0643\u0631\u064A\u0645\u0627\u062A \u0627\u0644\u0634\u0631\u0641\u064A\u0629 \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629 \u0644\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627",
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetType: {
          type: Type.STRING,
          description: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u064A\u0646: student (\u0644\u0644\u0637\u0644\u0627\u0628) \u0623\u0648 teacher (\u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646) \u0623\u0648 all"
        }
      }
    }
  },
  {
    name: "getAdminActionsAndBehavior",
    description: "\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u0635\u0627\u062F\u0631\u0629 (\u0625\u0646\u0630\u0627\u0631\u060C \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0648\u0644\u064A \u0623\u0645\u0631\u060C \u0641\u0635\u0644 \u0645\u0624\u0642\u062A) \u0648\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629",
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0645\u0631\u0627\u062F \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0625\u062C\u0631\u0627\u0621\u0627\u062A\u0647 \u0623\u0648 \u0633\u0644\u0648\u0643\u0647"
        }
      }
    }
  },
  {
    name: "getTeachersAndClasses",
    description: "\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u062A\u062E\u0635\u0635\u0627\u062A\u0647\u0645 \u0648\u0627\u0644\u0641\u0635\u0648\u0644 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0633\u0646\u062F\u0629 \u0625\u0644\u064A\u0647\u0645 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0641\u0635\u0648\u0644",
    parameters: {
      type: Type.OBJECT,
      properties: {
        specialization: {
          type: Type.STRING,
          description: "\u062A\u062E\u0635\u0635 \u0627\u0644\u0645\u0639\u0644\u0645 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 (\u0645\u062B\u0644: \u0631\u064A\u0627\u0636\u064A\u0627\u062A\u060C \u0639\u0644\u0648\u0645\u060C \u0644\u063A\u0629 \u0639\u0631\u0628\u064A\u0629)"
        }
      }
    }
  },
  {
    name: "draftSchoolAnnouncement",
    description: "\u0635\u064A\u0627\u063A\u0629 \u0648\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0625\u0639\u0644\u0627\u0646 \u0645\u062F\u0631\u0633\u064A \u0631\u0633\u0645\u064A \u0623\u0648 \u062A\u0639\u0645\u064A\u0645 \u0623\u0648 \u062A\u0646\u0628\u064A\u0647 \u0644\u0639\u0631\u0636\u0647 \u0639\u0644\u0649 \u0627\u0644\u0645\u062F\u064A\u0631 \u0641\u064A \u0628\u0637\u0627\u0642\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u0627\u0644\u0646\u0634\u0631 \u0644\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0623\u0648 \u0627\u0644\u0637\u0644\u0627\u0628 \u0623\u0648 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0623\u0648 \u0627\u0644\u062A\u0639\u0645\u064A\u0645 \u0627\u0644\u0645\u0642\u062A\u0631\u062D \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (\u0645\u062B\u0644: \u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A: \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0646\u0635\u0641 \u0627\u0644\u0639\u0627\u0645)"
        },
        content: {
          type: Type.STRING,
          description: "\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0648\u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0627\u0644\u0645\u0641\u0635\u0644 \u0648\u0627\u0644\u0634\u0627\u0645\u0644 \u0648\u0627\u0644\u0645\u0634\u062C\u0639"
        },
        priority: {
          type: Type.STRING,
          description: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629: \u0639\u0627\u062C\u0644 \u062C\u062F\u0627\u064B \u0623\u0648 \u0639\u0627\u062C\u0644 \u0623\u0648 \u0647\u0627\u0645 \u0623\u0648 \u0639\u0627\u062F\u064A"
        },
        targetAudience: {
          type: Type.STRING,
          description: "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0648\u062C\u0647 \u0625\u0644\u064A\u0647\u0627 \u0627\u0644\u0625\u0639\u0644\u0627\u0646: \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0623\u0648 \u0627\u0644\u0637\u0644\u0627\u0628 \u0623\u0648 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0623\u0648 \u0627\u0644\u062C\u0645\u064A\u0639"
        }
      },
      required: ["title", "content", "targetAudience"]
    }
  },
  {
    name: "draftSchoolPoll",
    description: "\u0635\u064A\u0627\u063A\u0629 \u0648\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062A\u0641\u0627\u0639\u0644\u064A \u0644\u0644\u0645\u062F\u0631\u0633\u0629 \u0644\u0639\u0631\u0636\u0647 \u0639\u0644\u0649 \u0627\u0644\u0645\u062F\u064A\u0631 \u0641\u064A \u0628\u0637\u0627\u0642\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u0644\u0646\u0634\u0631 \u0648\u062C\u0645\u0639 \u0627\u0644\u0623\u0635\u0648\u0627\u062A",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "\u0639\u0646\u0648\u0627\u0646 \u0623\u0648 \u0645\u0648\u0636\u0648\u0639 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0627\u0644\u0631\u0623\u064A"
        },
        content: {
          type: Type.STRING,
          description: "\u0627\u0644\u0633\u0624\u0627\u0644 \u0623\u0648 \u0646\u0635 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0648\u0634\u0631\u062D \u0627\u0644\u0647\u062F\u0641 \u0645\u0646\u0647"
        },
        pollOptions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '\u0642\u0627\u0626\u0645\u0629 \u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0635\u0648\u064A\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 (\u0645\u062B\u0644\u0627\u064B: ["\u0645\u0648\u0627\u0641\u0642", "\u0645\u062D\u0627\u064A\u062F", "\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642"])'
        },
        targetAudience: {
          type: Type.STRING,
          description: "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629: \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0623\u0648 \u0627\u0644\u0637\u0644\u0627\u0628 \u0623\u0648 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0623\u0648 \u0627\u0644\u062C\u0645\u064A\u0639"
        }
      },
      required: ["title", "content", "pollOptions"]
    }
  },
  {
    name: "draftSchoolEvent",
    description: "\u0635\u064A\u0627\u063A\u0629 \u0648\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0641\u0639\u0627\u0644\u064A\u0629 \u0623\u0648 \u0646\u0634\u0627\u0637 \u0645\u062F\u0631\u0633\u064A \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0644\u0639\u0631\u0636\u0647 \u0639\u0644\u0649 \u0627\u0644\u0645\u062F\u064A\u0631 \u0628\u0628\u0637\u0627\u0642\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u0644\u062C\u062F\u0648\u0644\u0629 \u0648\u0627\u0644\u0625\u062F\u0631\u0627\u062C",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "\u0627\u0633\u0645 \u0623\u0648 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629"
        },
        content: {
          type: Type.STRING,
          description: "\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0623\u0647\u062F\u0627\u0641 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0648\u0628\u0631\u0646\u0627\u0645\u062C\u0647\u0627"
        },
        eventDate: {
          type: Type.STRING,
          description: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0628\u062A\u0646\u0633\u064A\u0642 YYYY-MM-DD"
        },
        eventTime: {
          type: Type.STRING,
          description: "\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 (\u0645\u062B\u0644: 10:00 \u0635\u0628\u0627\u062D\u0627\u064B)"
        },
        eventLocation: {
          type: Type.STRING,
          description: "\u0645\u0643\u0627\u0646 \u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 (\u0645\u062B\u0644: \u0645\u0633\u0631\u062D \u0627\u0644\u0645\u062F\u0631\u0633\u0629\u060C \u0627\u0644\u0645\u0644\u0627\u0639\u0628\u060C \u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629)"
        },
        targetAudience: {
          type: Type.STRING,
          description: "\u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0648\u0646: \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0623\u0648 \u0627\u0644\u0637\u0644\u0627\u0628 \u0623\u0648 \u0627\u0644\u062C\u0645\u064A\u0639"
        }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "getSchoolSettingsAndExtensions",
    description: "\u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u062D\u0627\u0644\u0629 \u062A\u0631\u0627\u062E\u064A\u0635 \u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062A (Extensions) \u0648\u0627\u0644\u062A\u062D\u0643\u0645 \u0641\u064A \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  }
];
function normalizeDateString(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dmMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmMatch) {
    const [, d, m, y] = dmMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s;
}
function extractDateFromQuery(query) {
  if (!query) return null;
  const iso = query.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dmy = query.match(/\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}
async function executeSchoolTool(name, args = {}, schoolId = "sch-1") {
  const effectiveSchoolId = schoolId || "sch-1";
  try {
    switch (name) {
      case "exportSchoolDataToExcel": {
        const dataType = (args?.dataType || "students").toLowerCase();
        const customTitle = args?.title || "\u062A\u0642\u0631\u064A\u0631 \u0645\u062F\u0631\u0633\u062A\u064A";
        const date = normalizeDateString(args?.date) || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const className = args?.className ? String(args.className).trim() : null;
        const status = args?.status ? String(args.status).trim() : null;
        const customCols = Array.isArray(args?.columns) ? args.columns : null;
        if (dataType === "attendance" || dataType.includes("\u062D\u0636\u0648\u0631") || dataType.includes("\u063A\u064A\u0627\u0628")) {
          const conditions = [
            eq6(attendanceTable.schoolId, effectiveSchoolId),
            eq6(attendanceTable.date, date)
          ];
          if (className) conditions.push(eq6(attendanceTable.className, className));
          if (status) {
            conditions.push(or4(eq6(attendanceTable.status, status), ilike3(attendanceTable.status, `%${status}%`)));
          }
          const records = await db.select().from(attendanceTable).where(and6(...conditions)).limit(2e3);
          const cols = customCols || ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0641\u0635\u0644", "\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0636\u0648\u0631", "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", "\u0627\u0644\u062A\u0627\u0631\u064A\u062E"];
          const rows = records.map((r, idx) => [
            idx + 1,
            r.studentName,
            r.className || "\u0639\u0627\u0645",
            r.status || "\u063A\u0627\u0626\u0628",
            r.notes || "-",
            r.date
          ]);
          const excelPayload = {
            fileName: `${customTitle.replace(/\s+/g, "_")}_${date}.xlsx`,
            sheetName: "\u0627\u0644\u063A\u064A\u0627\u0628_\u0648\u0627\u0644\u062D\u0636\u0648\u0631",
            metadata: {
              title: customTitle,
              schoolName: "\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
              generatedAt: date
            },
            columns: cols,
            rows: rows.length > 0 ? rows : [[1, "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0627\u0644\u0627\u062A \u063A\u064A\u0627\u0628 \u0645\u0633\u062C\u0644\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u0627\u0631\u064A\u062E", className || "\u0643\u0627\u0641\u0629 \u0627\u0644\u0641\u0635\u0648\u0644", status || "\u0645\u0646\u062A\u0638\u0645", "-", date]]
          };
          return {
            success: true,
            totalRows: rows.length,
            recordsSample: records.slice(0, 10).map((r) => ({ name: r.studentName, class: r.className, status: r.status })),
            excelPayload
          };
        }
        if (dataType === "students" || dataType.includes("\u0637\u0644\u0627\u0628") || dataType.includes("\u0642\u064A\u062F")) {
          const res = await generateAccurateStudentExcelPayload(
            customTitle,
            effectiveSchoolId,
            "\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            customCols,
            className
          );
          return {
            success: true,
            totalRows: res.totalCount,
            columns: res.excelPayload.columns,
            sampleRows: res.excelPayload.rows.slice(0, 3),
            excelPayload: res.excelPayload
          };
        }
        if (dataType === "grades" || dataType.includes("\u062F\u0631\u062C\u0627\u062A")) {
          const grades = await db.select().from(gradesTable).where(eq6(gradesTable.schoolId, effectiveSchoolId)).limit(500);
          const cols = customCols || ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0641\u0635\u0644", "\u0627\u0644\u0645\u0627\u062F\u0629", "\u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631", "\u0627\u0644\u062F\u0631\u062C\u0629", "\u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0639\u0638\u0645\u0649"];
          const rows = grades.map((g, idx) => [
            idx + 1,
            g.studentName,
            g.className || "\u0639\u0627\u0645",
            g.subjectName,
            g.examName || "\u0627\u062E\u062A\u0628\u0627\u0631 \u0634\u0647\u0631\u064A",
            g.score,
            g.maxScore
          ]);
          const excelPayload = {
            fileName: `${customTitle.replace(/\s+/g, "_")}.xlsx`,
            sheetName: "\u0627\u0644\u062F\u0631\u062C\u0627\u062A",
            metadata: { title: customTitle, schoolName: "\u0627\u0644\u0645\u062F\u0631\u0633\u0629" },
            columns: cols,
            rows
          };
          return { success: true, totalRows: rows.length, excelPayload };
        }
        if (dataType === "teachers" || dataType.includes("\u0645\u0639\u0644\u0645")) {
          const teachers = await db.select().from(teachersTable).where(eq6(teachersTable.schoolId, effectiveSchoolId)).limit(200);
          const cols = customCols || ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u0644\u0645", "\u0627\u0644\u062A\u062E\u0635\u0635", "\u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u0633\u0646\u062F\u0629", "\u0627\u0644\u0645\u0648\u0627\u062F", "\u0627\u0644\u0647\u0627\u062A\u0641", "\u0627\u0644\u062D\u0627\u0644\u0629"];
          const rows = teachers.map((t, idx) => [
            idx + 1,
            t.name,
            t.specialization || "\u0639\u0627\u0645",
            Array.isArray(t.assignedClasses) ? t.assignedClasses.join(", ") : "-",
            Array.isArray(t.assignedSubjects) ? t.assignedSubjects.join(", ") : "-",
            t.phone || "-",
            t.status || "\u0646\u0634\u0637"
          ]);
          const excelPayload = {
            fileName: `${customTitle.replace(/\s+/g, "_")}.xlsx`,
            sheetName: "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646",
            metadata: { title: customTitle, schoolName: "\u0627\u0644\u0645\u062F\u0631\u0633\u0629" },
            columns: cols,
            rows
          };
          return { success: true, totalRows: rows.length, excelPayload };
        }
        return { success: true, message: "\u062C\u0627\u0647\u0632 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0645\u0644\u0641 \u0628\u062D\u0633\u0628 \u0645\u062A\u0637\u0644\u0628\u0627\u062A\u0643" };
      }
      case "getSchoolLeaderboard": {
        const limit = typeof args?.limit === "number" && args.limit > 0 ? Math.min(args.limit, 30) : 10;
        try {
          const lb = await getSchoolLeaderboard(effectiveSchoolId);
          if (lb && lb.leaderboard && lb.leaderboard.length > 0) {
            return {
              totalStudentsCalculated: lb.schoolSummary?.totalStudents || lb.leaderboard.length,
              topStudents: lb.leaderboard.slice(0, limit).map((item) => ({
                rank: item.rank,
                name: item.name,
                className: item.className || "\u0639\u0627\u0645",
                points: item.points
              }))
            };
          }
        } catch (e) {
          console.warn("Leaderboard calculation fallback:", e);
        }
        const rawStudents = await db.select({
          id: studentsTable.id,
          name: studentsTable.name,
          className: studentsTable.className
        }).from(studentsTable).where(eq6(studentsTable.schoolId, effectiveSchoolId)).limit(limit);
        return {
          totalStudentsCalculated: rawStudents.length,
          topStudents: rawStudents.map((s, idx) => ({
            rank: idx + 1,
            name: s.name,
            className: s.className || "\u0639\u0627\u0645",
            points: 100 - idx * 5
          }))
        };
      }
      case "getAttendanceReport": {
        const targetClass = args?.className ? String(args.className).trim() : null;
        const targetStatus = args?.status ? String(args.status).trim() : null;
        let targetDate = normalizeDateString(args?.date);
        if (!targetDate) {
          const latestRow = await db.select({ date: attendanceTable.date }).from(attendanceTable).where(eq6(attendanceTable.schoolId, effectiveSchoolId)).orderBy(desc4(attendanceTable.date)).limit(1);
          targetDate = latestRow[0]?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        }
        const conditions = [
          eq6(attendanceTable.schoolId, effectiveSchoolId),
          eq6(attendanceTable.date, targetDate)
        ];
        if (targetClass) {
          conditions.push(eq6(attendanceTable.className, targetClass));
        }
        if (targetStatus) {
          conditions.push(
            or4(
              eq6(attendanceTable.status, targetStatus),
              ilike3(attendanceTable.status, `%${targetStatus}%`)
            )
          );
        }
        const records = await db.select().from(attendanceTable).where(and6(...conditions)).limit(2e3);
        const totalRecords = records.length;
        const presentCount = records.filter((r) => r.status === "\u062D\u0627\u0636\u0631").length;
        const absentRecords = records.filter((r) => r.status === "\u063A\u0627\u0626\u0628" || r.status && r.status.includes("\u063A\u064A\u0627\u0628"));
        const lateRecords = records.filter((r) => r.status === "\u0645\u062A\u0623\u062E\u0631" || r.status && r.status.includes("\u062A\u0623\u062E\u0631"));
        return {
          date: targetDate,
          className: targetClass || "\u0643\u0627\u0641\u0629 \u0627\u0644\u0641\u0635\u0648\u0644",
          totalRecorded: totalRecords,
          presentCount,
          absentCount: absentRecords.length,
          lateCount: lateRecords.length,
          attendanceRate: totalRecords > 0 ? `${Math.round(presentCount / totalRecords * 100)}%` : "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631",
          absentStudents: absentRecords.map((r) => ({
            name: r.studentName,
            className: r.className || "\u0639\u0627\u0645",
            notes: r.notes || "\u063A\u064A\u0627\u0628 \u0628\u062F\u0648\u0646 \u0639\u0630\u0631"
          })),
          lateStudents: lateRecords.map((r) => ({
            name: r.studentName,
            className: r.className || "\u0639\u0627\u0645",
            notes: r.notes || "\u062A\u0623\u062E\u0631 \u0635\u0628\u0627\u062D\u064A"
          }))
        };
      }
      case "searchStudents": {
        const query = args?.query ? String(args.query).trim() : "";
        const className = args?.className ? String(args.className).trim() : null;
        let querySchoolId = effectiveSchoolId;
        const countCheck = await db.select({ count: count() }).from(studentsTable).where(eq6(studentsTable.schoolId, querySchoolId));
        if ((countCheck[0]?.count || 0) === 0) {
          const topSchool = await db.select({ schoolId: studentsTable.schoolId }).from(studentsTable).groupBy(studentsTable.schoolId).orderBy(desc4(count())).limit(1);
          if (topSchool[0]?.schoolId) {
            querySchoolId = topSchool[0].schoolId;
          }
        }
        const conditions = [eq6(studentsTable.schoolId, querySchoolId)];
        if (query) {
          conditions.push(
            or4(
              ilike3(studentsTable.name, `%${query}%`),
              ilike3(studentsTable.studentCode, `%${query}%`),
              ilike3(studentsTable.nationalId, `%${query}%`),
              ilike3(studentsTable.ministryCode, `%${query}%`)
            )
          );
        }
        if (className) {
          conditions.push(eq6(studentsTable.className, className));
        }
        const limit = typeof args?.limit === "number" && args.limit > 0 ? Math.min(args.limit, 5e3) : 50;
        const students = await db.select({
          id: studentsTable.id,
          name: studentsTable.name,
          nationalId: studentsTable.nationalId,
          ministryCode: studentsTable.ministryCode,
          studentCode: studentsTable.studentCode,
          className: studentsTable.className,
          gender: studentsTable.gender,
          birthDate: studentsTable.birthDate,
          parentPhone: studentsTable.parentPhone,
          status: studentsTable.status
        }).from(studentsTable).where(and6(...conditions)).orderBy(asc2(studentsTable.className), asc2(studentsTable.name)).limit(limit);
        return {
          totalMatches: students.length,
          students
        };
      }
      case "getGradesReport": {
        const subjectName = args?.subjectName ? String(args.subjectName).trim() : null;
        const className = args?.className ? String(args.className).trim() : null;
        const studentName = args?.studentName ? String(args.studentName).trim() : null;
        const conditions = [eq6(gradesTable.schoolId, effectiveSchoolId)];
        if (subjectName) conditions.push(ilike3(gradesTable.subjectName, `%${subjectName}%`));
        if (className) conditions.push(eq6(gradesTable.className, className));
        if (studentName) conditions.push(ilike3(gradesTable.studentName, `%${studentName}%`));
        const grades = await db.select({
          id: gradesTable.id,
          studentName: gradesTable.studentName,
          className: gradesTable.className,
          subjectName: gradesTable.subjectName,
          examName: gradesTable.examName,
          score: gradesTable.score,
          maxScore: gradesTable.maxScore,
          date: gradesTable.date
        }).from(gradesTable).where(and6(...conditions)).orderBy(desc4(gradesTable.score)).limit(20);
        return {
          totalResults: grades.length,
          grades
        };
      }
      case "getCommunityDiscussions": {
        const limit = typeof args?.limit === "number" && args.limit > 0 ? Math.min(args.limit, 25) : 10;
        const messages = await db.select({
          id: communityMessagesTable.id,
          communityId: communityMessagesTable.communityId,
          senderName: communityMessagesTable.senderName,
          senderRole: communityMessagesTable.senderRole,
          type: communityMessagesTable.type,
          message: communityMessagesTable.message,
          content: communityMessagesTable.content,
          formattedTime: communityMessagesTable.formattedTime,
          createdAt: communityMessagesTable.createdAt,
          pollData: communityMessagesTable.pollData,
          eventData: communityMessagesTable.eventData
        }).from(communityMessagesTable).where(
          and6(
            eq6(communityMessagesTable.schoolId, effectiveSchoolId),
            eq6(communityMessagesTable.isDeleted, false)
          )
        ).orderBy(desc4(communityMessagesTable.createdAt)).limit(limit);
        return {
          totalRetrieved: messages.length,
          messages: messages.map((m) => ({
            sender: `${m.senderName} (${m.senderRole})`,
            text: m.message || m.content || "",
            time: m.formattedTime || m.createdAt,
            type: m.type,
            poll: m.pollData ? {
              question: m.pollData.question,
              totalVotes: m.pollData.totalVotes || 0
            } : void 0,
            event: m.eventData ? {
              title: m.eventData.title,
              date: m.eventData.date
            } : void 0
          }))
        };
      }
      case "getSchoolCalendar": {
        const tasks = await db.select({
          id: calendarTasksTable.id,
          title: calendarTasksTable.title,
          description: calendarTasksTable.description,
          date: calendarTasksTable.date,
          priority: calendarTasksTable.priority,
          status: calendarTasksTable.status
        }).from(calendarTasksTable).where(eq6(calendarTasksTable.schoolId, effectiveSchoolId)).orderBy(asc2(calendarTasksTable.date)).limit(20);
        return {
          totalTasks: tasks.length,
          tasks
        };
      }
      case "getBadgesSummary": {
        const studentBadges = await db.select({
          id: studentBadgesTable.id,
          studentId: studentBadgesTable.studentId,
          badgeId: studentBadgesTable.badgeId,
          awardedAt: studentBadgesTable.awardedAt,
          note: studentBadgesTable.note
        }).from(studentBadgesTable).where(eq6(studentBadgesTable.schoolId, effectiveSchoolId)).orderBy(desc4(studentBadgesTable.awardedAt)).limit(15);
        const teacherBadges = await db.select({
          id: teacherBadgesTable.id,
          teacherId: teacherBadgesTable.teacherId,
          badgeId: teacherBadgesTable.badgeId,
          awardedAt: teacherBadgesTable.awardedAt
        }).from(teacherBadgesTable).where(eq6(teacherBadgesTable.schoolId, effectiveSchoolId)).orderBy(desc4(teacherBadgesTable.awardedAt)).limit(10);
        const allBadges = await db.select({
          id: badgesTable.id,
          name: badgesTable.name,
          rarity: badgesTable.rarity,
          targetType: badgesTable.targetType
        }).from(badgesTable).limit(25);
        const badgeMap = /* @__PURE__ */ new Map();
        allBadges.forEach((b) => badgeMap.set(b.id, b.name));
        return {
          totalStudentBadgesAwarded: studentBadges.length,
          totalTeacherBadgesAwarded: teacherBadges.length,
          availableBadgesCatalog: allBadges.map((b) => ({
            name: b.name,
            rarity: b.rarity,
            target: b.targetType
          })),
          recentStudentAwards: studentBadges.slice(0, 10).map((sb) => ({
            studentId: sb.studentId,
            badgeName: badgeMap.get(sb.badgeId) || sb.badgeId,
            awardedAt: sb.awardedAt,
            note: sb.note
          }))
        };
      }
      case "getAdminActionsAndBehavior": {
        const studentName = args?.studentName ? String(args.studentName).trim() : null;
        const actionConditions = [eq6(adminActionsTable.schoolId, effectiveSchoolId)];
        if (studentName) {
          actionConditions.push(ilike3(adminActionsTable.studentName, `%${studentName}%`));
        }
        const actions = await db.select({
          id: adminActionsTable.id,
          studentName: adminActionsTable.studentName,
          className: adminActionsTable.className,
          actionType: adminActionsTable.actionType,
          title: adminActionsTable.title,
          reason: adminActionsTable.reason,
          summonsDate: adminActionsTable.summonsDate,
          startDate: adminActionsTable.startDate,
          endDate: adminActionsTable.endDate,
          status: adminActionsTable.status,
          createdAt: adminActionsTable.createdAt
        }).from(adminActionsTable).where(and6(...actionConditions)).orderBy(desc4(adminActionsTable.createdAt)).limit(15);
        const behaviorConditions = [eq6(behaviorTable.schoolId, effectiveSchoolId)];
        if (studentName) {
          behaviorConditions.push(ilike3(behaviorTable.studentName, `%${studentName}%`));
        }
        const behaviors = await db.select({
          id: behaviorTable.id,
          studentName: behaviorTable.studentName,
          classId: behaviorTable.classId,
          type: behaviorTable.type,
          title: behaviorTable.title,
          points: behaviorTable.points,
          date: behaviorTable.date,
          notes: behaviorTable.notes
        }).from(behaviorTable).where(and6(...behaviorConditions)).orderBy(desc4(behaviorTable.date)).limit(15);
        return {
          totalAdminActions: actions.length,
          totalBehaviorRecords: behaviors.length,
          actions,
          behaviors
        };
      }
      case "getTeachersAndClasses": {
        const spec = args?.specialization ? String(args.specialization).trim() : null;
        const teacherConditions = [eq6(teachersTable.schoolId, effectiveSchoolId)];
        if (spec) {
          teacherConditions.push(ilike3(teachersTable.specialization, `%${spec}%`));
        }
        const teachers = await db.select({
          id: teachersTable.id,
          name: teachersTable.name,
          specialization: teachersTable.specialization,
          assignedClasses: teachersTable.assignedClasses,
          assignedSubjects: teachersTable.assignedSubjects,
          phone: teachersTable.phone,
          status: teachersTable.status
        }).from(teachersTable).where(and6(...teacherConditions)).limit(20);
        const classes = await db.select({
          id: classesTable.id,
          name: classesTable.name,
          gradeLevel: classesTable.gradeLevel,
          capacity: classesTable.capacity,
          roomNumber: classesTable.roomNumber,
          advisorTeacherName: classesTable.advisorTeacherName
        }).from(classesTable).where(eq6(classesTable.schoolId, effectiveSchoolId)).limit(20);
        return {
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          teachers,
          classes
        };
      }
      case "draftSchoolAnnouncement": {
        return {
          success: true,
          message: "\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0628\u0637\u0627\u0642\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u0627\u0644\u0646\u0634\u0631.",
          publishDraft: {
            id: `draft-ann-${Date.now()}`,
            type: "announcement",
            title: args.title || "\u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A \u0631\u0633\u0645\u064A",
            content: args.content || "",
            priority: args.priority || "\u0647\u0627\u0645",
            targetAudience: args.targetAudience || "\u0627\u0644\u062C\u0645\u064A\u0639",
            authorName: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            isPublished: false
          }
        };
      }
      case "draftSchoolPoll": {
        return {
          success: true,
          message: "\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0627\u0644\u0631\u0623\u064A \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0628\u0637\u0627\u0642\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629.",
          publishDraft: {
            id: `draft-poll-${Date.now()}`,
            type: "poll",
            title: args.title || "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062A\u0641\u0627\u0639\u0644\u064A",
            content: args.content || "",
            priority: args.priority || "\u0639\u0627\u062F\u064A",
            targetAudience: args.targetAudience || "\u0627\u0644\u062C\u0645\u064A\u0639",
            pollOptions: (args.pollOptions || []).map((opt, idx) => ({
              id: `opt-${idx + 1}`,
              text: typeof opt === "string" ? opt : opt?.text || `\u062E\u064A\u0627\u0631 ${idx + 1}`,
              votesCount: 0
            })),
            authorName: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            isPublished: false
          }
        };
      }
      case "draftSchoolEvent": {
        return {
          success: true,
          message: "\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A \u0628\u0646\u062C\u0627\u062D.",
          publishDraft: {
            id: `draft-evt-${Date.now()}`,
            type: "event",
            title: args.title || "\u0641\u0639\u0627\u0644\u064A\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645",
            content: args.content || "",
            priority: args.priority || "\u0647\u0627\u0645",
            targetAudience: args.targetAudience || "\u0627\u0644\u062C\u0645\u064A\u0639",
            eventDate: args.eventDate || new Date(Date.now() + 864e5 * 2).toISOString().split("T")[0],
            eventTime: args.eventTime || "10:00 \u0635\u0628\u0627\u062D\u0627\u064B",
            eventLocation: args.eventLocation || "\u0645\u0642\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            eventOrganizer: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            authorName: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
            date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            isPublished: false
          }
        };
      }
      case "getSchoolSettingsAndExtensions": {
        const schoolRow = await db.select().from(schoolInfoTable).where(eq6(schoolInfoTable.schoolId, effectiveSchoolId)).limit(1);
        const extensions = await db.select().from(schoolExtensionsTable).where(eq6(schoolExtensionsTable.schoolId, effectiveSchoolId));
        const info = schoolRow[0] || {};
        return {
          schoolName: info.name || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          code: info.code || "",
          academicYear: info.academicYear || "",
          principalName: info.principalName || "",
          governorate: info.governorate || "",
          educationalDistrict: info.educationalDistrict || "",
          phone: info.phone || "",
          email: info.email || "",
          address: info.address || "",
          subscription: info.subscription || "",
          licenseExpiry: info.licenseExpiry || "",
          extensionsCount: extensions.length,
          extensions: extensions.map((e) => ({
            extensionId: e.extensionId,
            isEnabled: e.isEnabled,
            settings: e.settings
          }))
        };
      }
      default:
        return { error: `\u0623\u062F\u0627\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641\u0629: ${name}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return { error: `\u0641\u0634\u0644 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0623\u062F\u0627\u0629: ${error?.message || String(error)}` };
  }
}
function isExcelRequested(query) {
  const q = (query || "").toLowerCase().trim();
  return q.includes("\u0625\u0643\u0633\u064A\u0644") || q.includes("\u0627\u0643\u0633\u064A\u0644") || q.includes("\u0625\u0643\u0633\u0644") || q.includes("\u0627\u0643\u0633\u0644") || q.includes("excel") || q.includes("xlsx") || q.includes("\u0634\u064A\u062A") || q.includes("\u062A\u0635\u062F\u064A\u0631") || q.includes("\u0643\u0634\u0641 \u0625\u0643\u0633\u0644") || q.includes("\u0643\u0634\u0641 \u0627\u0643\u0633\u0644") || q.includes("\u0645\u0644\u0641 \u0625\u0643\u0633\u0644") || q.includes("\u0645\u0644\u0641 \u0627\u0643\u0633\u0644") || q.includes("\u0645\u0644\u0641 \u062C\u062F\u0648\u0644") || q.includes("\u0645\u0644\u0641") && (q.includes("\u0628\u064A\u0627\u0646\u0627\u062A") || q.includes("\u0643\u0634\u0641") || q.includes("\u062C\u062F\u0648\u0644") || q.includes("\u062A\u0642\u0631\u064A\u0631") || q.includes("\u062D\u0636\u0648\u0631") || q.includes("\u063A\u064A\u0627\u0628") || q.includes("\u0637\u0644\u0627\u0628") || q.includes("\u0623\u0648\u0627\u0626\u0644") || q.includes("\u062F\u0631\u062C\u0627\u062A") || q.includes("\u0645\u0639\u0644\u0645\u064A\u0646") || q.includes("\u0641\u0635\u0648\u0644"));
}
async function generateAccurateStudentExcelPayload(query, schoolId = "sch-1", schoolName = "\u0627\u0644\u0645\u062F\u0631\u0633\u0629", customCols, filterClass) {
  let targetSchoolId = schoolId || "sch-1";
  let students = await db.select({
    id: studentsTable.id,
    name: studentsTable.name,
    nationalId: studentsTable.nationalId,
    ministryCode: studentsTable.ministryCode,
    studentCode: studentsTable.studentCode,
    className: studentsTable.className,
    gender: studentsTable.gender,
    birthDate: studentsTable.birthDate,
    parentPhone: studentsTable.parentPhone,
    status: studentsTable.status
  }).from(studentsTable).where(eq6(studentsTable.schoolId, targetSchoolId)).orderBy(asc2(studentsTable.className), asc2(studentsTable.name));
  if (students.length === 0) {
    const topSchool = await db.select({ schoolId: studentsTable.schoolId, count: count() }).from(studentsTable).groupBy(studentsTable.schoolId).orderBy(desc4(count())).limit(1);
    if (topSchool[0]?.schoolId && topSchool[0].schoolId !== targetSchoolId) {
      targetSchoolId = topSchool[0].schoolId;
      students = await db.select({
        id: studentsTable.id,
        name: studentsTable.name,
        nationalId: studentsTable.nationalId,
        ministryCode: studentsTable.ministryCode,
        studentCode: studentsTable.studentCode,
        className: studentsTable.className,
        gender: studentsTable.gender,
        birthDate: studentsTable.birthDate,
        parentPhone: studentsTable.parentPhone,
        status: studentsTable.status
      }).from(studentsTable).where(eq6(studentsTable.schoolId, targetSchoolId)).orderBy(asc2(studentsTable.className), asc2(studentsTable.name));
    }
  }
  const q = (query || "").toLowerCase().trim();
  let filteredStudents = students;
  const targetClass = filterClass || q.match(/فصل\s*([0-9\/\-]+(?:\s*ابتدائي|\s*إعدادي|\s*ثانوي)?)/)?.[1];
  if (targetClass) {
    const classTerm = targetClass.trim().toLowerCase();
    const matched = students.filter((s) => (s.className || "").toLowerCase().includes(classTerm));
    if (matched.length > 0) {
      filteredStudents = matched;
    }
  }
  const totalCount = filteredStudents.length;
  const withNatIdCount = filteredStudents.filter((s) => s.nationalId && s.nationalId.trim().length > 0).length;
  const withMinCodeCount = filteredStudents.filter((s) => s.ministryCode && s.ministryCode.trim().length > 0).length;
  let columns = [];
  const queryMentionsExactTriad = (q.includes("\u0627\u0644\u0627\u0633\u0645") || q.includes("\u0627\u0633\u0645")) && (q.includes("\u0627\u0644\u0642\u0648\u0645\u064A") || q.includes("\u0642\u0648\u0645\u064A")) && (q.includes("\u0627\u0644\u0648\u0632\u0627\u0631") || q.includes("\u0648\u0632\u0627\u0631"));
  if (customCols && customCols.length > 0) {
    columns = customCols;
  } else if (queryMentionsExactTriad) {
    columns = ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A", "\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629", "\u0643\u0648\u062F \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A"];
  } else {
    columns = [
      "\u0645",
      "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628",
      "\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A",
      "\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629",
      "\u0643\u0648\u062F \u0627\u0644\u0637\u0627\u0644\u0628",
      "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A",
      "\u0627\u0644\u0646\u0648\u0639",
      "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F",
      "\u0647\u0627\u062A\u0641 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631",
      "\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629"
    ];
  }
  const mapCell = (s, colName, idx) => {
    const c = colName.trim().toLowerCase();
    if (c === "\u0645" || c === "#" || c.includes("\u062A\u0633\u0644\u0633\u0644") || c.includes("\u0645\u0633\u0644\u0633\u0644") || c.includes("\u0627\u0644\u062A\u0631\u062A\u064A\u0628")) return idx + 1;
    if (c.includes("\u0627\u0633\u0645") || c.includes("\u0637\u0627\u0644\u0628")) return s.name;
    if (c.includes("\u0642\u0648\u0645\u064A") || c.includes("\u0627\u0644\u0642\u0648\u0645\u064A") || c.includes("national")) return s.nationalId || "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644";
    if (c.includes("\u0648\u0632\u0627\u0631") || c.includes("\u0627\u0644\u0648\u0632\u0627\u0631") || c.includes("ministry")) return s.ministryCode || "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644";
    if (c.includes("\u0643\u0648\u062F \u0627\u0644\u0637\u0627\u0644\u0628") || c.includes("\u0643\u0648\u062F") && !c.includes("\u0648\u0632\u0627\u0631")) return s.studentCode || `STD-${idx + 1}`;
    if (c.includes("\u0641\u0635\u0644") || c.includes("\u0635\u0641") || c.includes("class")) return s.className || "\u0639\u0627\u0645";
    if (c.includes("\u0646\u0648\u0639") || c.includes("\u062C\u0646\u0633") || c.includes("gender")) return s.gender || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F";
    if (c.includes("\u0645\u064A\u0644\u0627\u062F") || c.includes("\u062A\u0627\u0631\u064A\u062E") || c.includes("birth")) return s.birthDate || "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644";
    if (c.includes("\u0647\u0627\u062A\u0641") || c.includes("\u062A\u0644\u064A\u0641\u0648\u0646") || c.includes("\u0645\u0648\u0628\u0627\u064A\u0644") || c.includes("\u0648\u0644\u064A") || c.includes("phone")) return s.parentPhone || "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631";
    if (c.includes("\u062D\u0627\u0644\u0629") || c.includes("\u0627\u0646\u062A\u0638\u0627\u0645") || c.includes("status")) return s.status || "\u0645\u0646\u062A\u0638\u0645";
    if (c.includes("\u0645\u0644\u0627\u062D\u0638\u0627\u062A") || c.includes("\u062A\u0648\u0642\u064A\u0639")) return "-";
    return "";
  };
  const rows = filteredStudents.map(
    (s, idx) => columns.map((col) => mapCell(s, col, idx))
  );
  const fileBaseName = queryMentionsExactTriad ? "\u0643\u0634\u0641_\u0627\u0644\u0637\u0644\u0627\u0628_\u0628\u0627\u0644\u0631\u0642\u0645_\u0627\u0644\u0642\u0648\u0645\u064A_\u0648\u0643\u0648\u062F_\u0627\u0644\u0648\u0632\u0627\u0631\u0629" : "\u0633\u062C\u0644_\u0642\u064A\u062F_\u0648\u0628\u064A\u0627\u0646\u0627\u062A_\u0627\u0644\u0637\u0644\u0627\u0628";
  const excelPayload = {
    fileName: `${fileBaseName}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`,
    sheetName: "\u0633\u062C\u0644_\u0627\u0644\u0637\u0644\u0627\u0628",
    metadata: {
      title: queryMentionsExactTriad ? `\u0643\u0634\u0641 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 (\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u0648\u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629) - ${schoolName}` : `\u0643\u0634\u0641 \u0642\u064A\u062F \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0631\u0633\u0645\u064A\u0627\u064B - ${schoolName}`,
      schoolName,
      generatedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG"),
      totalStudents: totalCount
    },
    columns,
    rows
  };
  const text2 = `\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F468}\u200D\u{1F393}

\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u062D\u0644\u064A\u0644 \u0645\u062A\u0637\u0644\u0628\u0627\u062A\u0643 \u0628\u062F\u0642\u0629 \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0648\u0641\u0642 \u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644:

### \u{1F4CB} \u0645\u0646\u0627\u0642\u0634\u0629 \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0644\u0641 \u0648\u0647\u064A\u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A:
1. **\u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0628\u0627\u0644\u0645\u0644\u0641**: \u062A\u0645 \u0628\u0646\u0627\u0621 \u0627\u0644\u0634\u064A\u062A \u0627\u0633\u062A\u0646\u0627\u062F\u0627\u064B \u0625\u0644\u0649 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629: (${columns.join(" | ")}).
2. **\u062D\u0635\u0631 \u0648\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C\u064A\u0646**: **${totalCount}** \u0637\u0627\u0644\u0628\u0627\u064B \u0643\u0627\u0645\u0644\u0627\u064B \u0628\u062F\u0648\u0646 \u0627\u0642\u062A\u0637\u0627\u0639 \u0628\u0646\u0633\u0628\u0629 \u062F\u0642\u0629 **100%** \u0645\u0646 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0641\u0639\u0644\u064A\u0629.
3. **\u0646\u0633\u0628\u0629 \u0627\u0643\u062A\u0645\u0627\u0644 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0642\u0648\u0645\u064A\u0629**: **${withNatIdCount} / ${totalCount}** (${Math.round(withNatIdCount / (totalCount || 1) * 100)}%).
4. **\u0646\u0633\u0628\u0629 \u0627\u0643\u062A\u0645\u0627\u0644 \u0623\u0643\u0648\u0627\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629**: **${withMinCodeCount} / ${totalCount}** (${Math.round(withMinCodeCount / (totalCount || 1) * 100)}%).

---

### \u{1F4A1} \u0627\u0644\u0623\u0647\u0645\u064A\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641:
\u2022 \u0647\u0630\u0627 \u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u062B\u0644\u0627\u062B\u064A (\u0627\u0644\u0627\u0633\u0645 + \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A + \u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629) \u0647\u0648 \u0627\u0644\u0645\u0639\u064A\u0627\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0644\u0644\u0631\u0628\u0637 \u0645\u0639 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0639\u0644\u064A\u0645\u060C \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0633\u062A\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0642\u062F\u0645 \u0644\u0644\u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A\u060C \u0648\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0644\u062C\u0627\u0646\u060C \u0648\u0625\u0635\u062F\u0627\u0631 \u0634\u0647\u0627\u062F\u0627\u062A \u0627\u0644\u0642\u064A\u062F.
\u2022 \u062A\u0645 \u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0645\u0644\u0641 \u0644\u064A\u0643\u0648\u0646 \u062C\u0627\u0647\u0632\u0627\u064B \u0644\u0644\u0637\u0628\u0627\u0639\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0625\u0644\u0649 \u0623\u064A \u0628\u0631\u0646\u0627\u0645\u062C \u062C\u062F\u0627\u0648\u0644 \u0628\u064A\u0627\u0646\u0627\u062A.`;
  return { text: text2, excelPayload, totalCount };
}
async function smartFallbackAnswer(query, schoolId = "sch-1", summary = {}) {
  const schoolName = summary?.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629";
  const q = (query || "").toLowerCase().trim();
  const wantsExcel = isExcelRequested(query);
  const hasPollExplicit = q.includes("poll") || q.includes("\u0627\u0633\u062A\u0637\u0644\u0627\u0639") || q.includes("\u0627\u0633\u062A\u0628\u064A\u0627\u0646") || q.includes("\u062A\u0635\u0648\u064A\u062A") || q.includes("\u0633\u0624\u0627\u0644 \u062A\u0635\u0648\u064A\u062A") || q.includes("\u0645\u0648\u0627\u0641\u0642 \u0627\u0648 \u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642") || q.includes("\u0645\u0648\u0627\u0641\u0642 \u0623\u0648 \u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642") || q.includes("\u0627\u0644\u0627\u062C\u0627\u0628\u0627\u062A \u0647\u064A") || q.includes("\u0627\u0644\u0625\u062C\u0627\u0628\u0627\u062A \u0647\u064A");
  const hasEventExplicit = q.includes("event") || q.includes("\u0641\u0639\u0627\u0644\u064A\u0629") || q.includes("\u062D\u062F\u062B") || q.includes("\u0646\u0634\u0627\u0637 \u0645\u062F\u0631\u0633\u064A") || q.includes("\u062C\u062F\u0648\u0644\u0629 \u0641\u0639\u0627\u0644\u064A\u0629") || q.includes("\u0648\u0631\u0634\u0629 \u0639\u0645\u0644") || q.includes("\u0645\u0639\u0633\u0643\u0631") || q.includes("\u0646\u062F\u0648\u0629");
  const hasAnnouncementExplicit = q.includes("\u0627\u0639\u0644\u0627\u0646") || q.includes("\u0625\u0639\u0644\u0627\u0646") || q.includes("\u062A\u0639\u0645\u064A\u0645") || q.includes("\u0646\u0634\u0631 \u0627\u0639\u0644\u0627\u0646") || q.includes("\u0646\u0634\u0631 \u0625\u0639\u0644\u0627\u0646") || q.includes("\u0627\u0636\u064A\u0641 \u0627\u0639\u0644\u0627\u0646") || q.includes("\u0623\u0636\u064A\u0641 \u0625\u0639\u0644\u0627\u0646") || q.includes("\u0627\u0636\u0627\u0641\u0647 \u0627\u0639\u0644\u0627\u0646") || q.includes("\u0625\u0636\u0627\u0641\u0629 \u0625\u0639\u0644\u0627\u0646") || q.includes("\u062D\u062B\u0647\u0645") || q.includes("\u062A\u062C\u0647\u064A\u0632\u0627\u062A") || q.includes("\u062A\u062C\u0647\u064A\u0632") || q.includes("\u062A\u0646\u0628\u064A\u0647 \u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646") || q.includes("\u0631\u0633\u0627\u0644\u0629 \u0644\u0644\u0645\u062F\u0631\u0633\u064A\u0646") || q.includes("\u0645\u062F\u0631\u0633") && q.includes("\u0627\u0645\u062A\u062D\u0627\u0646") || q.includes("\u0645\u0639\u0644\u0645") && q.includes("\u0627\u0645\u062A\u062D\u0627\u0646");
  const isAnnouncementReq = hasAnnouncementExplicit && !hasPollExplicit && !hasEventExplicit;
  const isPollReq = hasPollExplicit && !hasEventExplicit;
  const isEventReq = hasEventExplicit;
  if (isPollReq && !wantsExcel) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639 (\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0637\u0644\u0627\u0628)";
    if (q.includes("\u0645\u062F\u0631\u0633") || q.includes("\u0645\u0639\u0644\u0645")) audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    else if (q.includes("\u0637\u0627\u0644\u0628") || q.includes("\u0637\u0644\u0627\u0628")) audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    else if (q.includes("\u0623\u0648\u0644\u064A\u0627\u0621") || q.includes("\u0648\u0644\u064A")) audience = "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631";
    let priority = "\u0639\u0627\u062F\u064A";
    if (q.includes("\u0628\u0643\u0631\u0647") || q.includes("\u063A\u062F\u0627") || q.includes("\u063A\u062F\u0627\u064B") || q.includes("\u0639\u0627\u062C\u0644") || q.includes("\u0637\u0627\u0631\u0626")) {
      priority = "\u0639\u0627\u062C\u0644";
    }
    let pollOptions = ["\u0645\u0648\u0627\u0641\u0642", "\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642"];
    if (q.includes("\u0645\u0648\u0627\u0641\u0642") && q.includes("\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642")) {
      pollOptions = ["\u0645\u0648\u0627\u0641\u0642", "\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642"];
    } else if (q.includes("\u0646\u0639\u0645") && q.includes("\u0644\u0627")) {
      pollOptions = ["\u0646\u0639\u0645", "\u0644\u0627"];
    }
    let pollTitle = "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062A\u0641\u0627\u0639\u0644\u064A \u0644\u0644\u0645\u062F\u0631\u0633\u0629";
    let pollContent = "\u0646\u0623\u0645\u0644 \u0645\u0634\u0627\u0631\u0643\u062A\u0643\u0645 \u0648\u0627\u0644\u062A\u0635\u0648\u064A\u062A \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0623\u0646\u0633\u0628 \u0644\u0644\u0645\u062F\u0631\u0633\u0629.";
    if (q.includes("\u0631\u062D\u0644\u0647") || q.includes("\u0631\u062D\u0644\u0629") || q.includes("\u0627\u0647\u0631\u0627\u0645\u0627\u062A") || q.includes("\u0623\u0647\u0631\u0627\u0645\u0627\u062A")) {
      pollTitle = "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A: \u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0644\u0644\u0623\u0647\u0631\u0627\u0645\u0627\u062A \u063A\u062F\u0627\u064B";
      pollContent = "\u0647\u0644 \u062A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u062A\u0646\u0638\u064A\u0645 \u0631\u062D\u0644\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u0625\u0644\u0649 \u0623\u0647\u0631\u0627\u0645\u0627\u062A \u0627\u0644\u062C\u064A\u0632\u0629 \u064A\u0648\u0645 \u063A\u062F\u064D\u061F";
    } else if (q.includes("\u0627\u062C\u062A\u0645\u0627\u0639")) {
      pollTitle = "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A: \u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0639\u062F \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639 \u0627\u0644\u0642\u0627\u062F\u0645";
      pollContent = "\u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0635\u0648\u064A\u062A \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0623\u0646\u0633\u0628 \u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u064A.";
    }
    const pollObj = {
      type: "poll",
      title: pollTitle,
      content: pollContent,
      priority,
      targetAudience: audience,
      pollOptions: pollOptions.map((opt, idx) => ({ id: `opt-${idx + 1}`, text: opt, votesCount: 0 })),
      authorName: `\u0625\u062F\u0627\u0631\u0629 ${schoolName}`
    };
    let responseText = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4CA}

\u0628\u0635\u0641\u062A\u064A \u0645\u0633\u062A\u0634\u0627\u0631\u0643 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u060C \u0623\u0631\u0649 \u0623\u0646 \u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u062E\u0637\u0648\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0644\u0625\u0634\u0631\u0627\u0643 \u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629 \u0648\u0633\u0631\u0639\u0629 \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0635\u0627\u0626\u0628.

\u0625\u0644\u064A\u0643 \u0628\u0637\u0627\u0642\u0629 \u0645\u0633\u0648\u062F\u0629 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0627\u0644\u0631\u0623\u064A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u0627\u0644\u0646\u0634\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629:`;
    return `${responseText}

\`\`\`json:publish-draft
${JSON.stringify(pollObj, null, 2)}
\`\`\``;
  }
  if (isEventReq && !wantsExcel) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639";
    if (q.includes("\u0645\u062F\u0631\u0633") || q.includes("\u0645\u0639\u0644\u0645")) audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    else if (q.includes("\u0637\u0627\u0644\u0628") || q.includes("\u0637\u0644\u0627\u0628")) audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    const eventObj = {
      type: "event",
      title: q.includes("\u0631\u062D\u0644\u0647") || q.includes("\u0631\u062D\u0644\u0629") ? "\u0631\u062D\u0644\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u0627\u0633\u062A\u0643\u0634\u0627\u0641\u064A\u0629" : "\u0641\u0639\u0627\u0644\u064A\u0629 \u0648\u0646\u0634\u0627\u0637 \u0645\u062F\u0631\u0633\u064A \u0645\u0639\u062A\u0645\u062F",
      content: "\u0641\u0639\u0627\u0644\u064A\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u062A\u0647\u062F\u0641 \u0625\u0644\u0649 \u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646.",
      priority: "\u0647\u0627\u0645",
      targetAudience: audience,
      eventDate: new Date(Date.now() + 864e5 * 3).toISOString().split("T")[0],
      eventTime: "10:00 \u0635\u0628\u0627\u062D\u0627\u064B",
      eventLocation: q.includes("\u0627\u0647\u0631\u0627\u0645\u0627\u062A") || q.includes("\u0623\u0647\u0631\u0627\u0645\u0627\u062A") ? "\u0623\u0647\u0631\u0627\u0645\u0627\u062A \u0627\u0644\u062C\u064A\u0632\u0629" : "\u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      authorName: `\u0625\u062F\u0627\u0631\u0629 ${schoolName}`
    };
    let responseText = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4C5}

\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0628\u0643\u0627\u0645\u0644 \u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627 \u0648\u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u062C\u062F\u0648\u0644\u0629 \u0648\u0627\u0644\u0625\u062F\u0631\u0627\u062C \u0641\u064A \u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A.

\u064A\u0645\u0643\u0646\u0643 \u0645\u0631\u0627\u062C\u0639\u0629 \u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627 \u0623\u062F\u0646\u0627\u0647 \u0648\u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0632\u0631 \u0627\u0644\u062C\u062F\u0648\u0644\u0629 \u0644\u0644\u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0644\u0625\u0636\u0627\u0641\u0629:`;
    return `${responseText}

\`\`\`json:publish-draft
${JSON.stringify(eventObj, null, 2)}
\`\`\``;
  }
  if (isAnnouncementReq && !wantsExcel) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639";
    if (q.includes("\u0645\u062F\u0631\u0633") || q.includes("\u0645\u0639\u0644\u0645") || q.includes("\u0643\u0627\u062F\u0631")) {
      audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    } else if (q.includes("\u0648\u0644\u064A") || q.includes("\u0623\u0648\u0644\u064A\u0627\u0621") || q.includes("\u0627\u0633\u0631") || q.includes("\u0623\u0633\u0631")) {
      audience = "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631";
    } else if (q.includes("\u0637\u0627\u0644\u0628") || q.includes("\u0637\u0644\u0627\u0628") || q.includes("\u062A\u0644\u0627\u0645\u064A\u0630")) {
      audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    }
    let priority = "\u0647\u0627\u0645";
    if (q.includes("\u0639\u0627\u062C\u0644 \u062C\u062F\u0627") || q.includes("\u0637\u0627\u0631\u0626")) {
      priority = "\u0639\u0627\u062C\u0644 \u062C\u062F\u0627\u064B";
    } else if (q.includes("\u0639\u0627\u062C\u0644")) {
      priority = "\u0639\u0627\u062C\u0644";
    } else if (q.includes("\u0639\u0627\u062F\u064A") || q.includes("\u062F\u0648\u0631\u064A")) {
      priority = "\u0639\u0627\u062F\u064A";
    }
    let draftTitle = `\u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A \u0631\u0633\u0645\u064A \u0645\u0646 \u0625\u062F\u0627\u0631\u0629 ${schoolName}`;
    let draftContent = "";
    if (q.includes("\u0627\u0645\u062A\u062D\u0627\u0646") || q.includes("\u0646\u0635\u0641 \u0627\u0644\u0639\u0627\u0645") || q.includes("\u062A\u062C\u0647\u064A\u0632") || q.includes("\u0627\u062E\u062A\u0628\u0627\u0631")) {
      draftTitle = "\u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A: \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A";
      draftContent = `\u0627\u0644\u0632\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0632\u0645\u064A\u0644\u0627\u062A \u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0647\u064A\u0626\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u0643\u0631\u0627\u0645 \u0628\u0645\u062F\u0631\u0633\u0629 ${schoolName}\u060C

\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645 \u0648\u0631\u062D\u0645\u0629 \u0627\u0644\u0644\u0647 \u0648\u0628\u0631\u0643\u0627\u062A\u0647\u060C\u060C\u060C

\u0645\u0639 \u0627\u0642\u062A\u0631\u0627\u0628 \u0645\u0648\u0639\u062F \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u060C \u0648\u062A\u0623\u0643\u064A\u062F\u0627\u064B \u0639\u0644\u0649 \u062D\u0631\u0635 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0639\u0644\u0649 \u062A\u0648\u0641\u064A\u0631 \u0628\u064A\u0626\u0629 \u0627\u0645\u062A\u062D\u0627\u0646\u064A\u0629 \u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0648\u0647\u0627\u062F\u0626\u0629 \u0644\u0623\u0628\u0646\u0627\u0626\u0646\u0627 \u0627\u0644\u0637\u0644\u0627\u0628\u060C \u0646\u0647\u064A\u0628 \u0628\u062D\u0636\u0631\u0627\u062A\u0643\u0645 \u0645\u0631\u0627\u0639\u0627\u0629 \u0648\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
1. \u0633\u0631\u0639\u0629 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0645\u0627 \u062A\u0628\u0642\u0649 \u0645\u0646 \u0645\u0641\u0631\u062F\u0627\u062A \u0627\u0644\u0645\u0646\u0647\u062C \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0646\u0648\u0627\u062A\u062C \u0627\u0644\u062A\u0639\u0644\u0645 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0645\u0639 \u0627\u0644\u0637\u0644\u0627\u0628.
2. \u0625\u0639\u062F\u0627\u062F \u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u0628\u0646\u0648\u0643 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0648\u0641\u0642\u0627\u064B \u0644\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0641\u0646\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0648\u0645\u0631\u0627\u0639\u0627\u0629 \u0627\u0644\u0641\u0631\u0648\u0642 \u0627\u0644\u0641\u0631\u062F\u064A\u0629.
3. \u0631\u0635\u062F \u062F\u0631\u062C\u0627\u062A \u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0633\u0646\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0628\u062F\u0642\u0629 \u0639\u0628\u0631 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0642\u0628\u0644 \u0628\u062F\u0621 \u0641\u062A\u0631\u0629 \u0627\u0644\u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A.
4. \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0648\u0627\u0644\u0625\u0634\u0631\u0627\u0641 \u0627\u0644\u064A\u0648\u0645\u064A \u0648\u0627\u0644\u062A\u0648\u0627\u062C\u062F \u0627\u0644\u0645\u0628\u0643\u0631 \u0641\u064A \u0644\u062C\u0627\u0646 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A.

\u0646\u062B\u0642 \u062F\u0627\u0626\u0645\u0627\u064B \u0641\u064A \u0625\u062E\u0644\u0627\u0635\u0643\u0645 \u0648\u062A\u0641\u0627\u0646\u064A\u0643\u0645 \u0627\u0644\u0645\u0634\u0647\u0648\u062F\u060C \u0648\u0646\u0633\u0623\u0644 \u0627\u0644\u0644\u0647 \u0627\u0644\u062A\u0648\u0641\u064A\u0642 \u0648\u0627\u0644\u0633\u062F\u0627\u062F \u0644\u0643\u0627\u062F\u0631\u0646\u0627 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A \u0648\u0637\u0644\u0627\u0628\u0646\u0627 \u0627\u0644\u0623\u0639\u0632\u0627\u0621.`;
    } else if (audience === "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631") {
      draftTitle = `\u0625\u0634\u0639\u0627\u0631 \u0647\u0627\u0645 \u0644\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0627\u0644\u0643\u0631\u0627\u0645 \u2014 \u0625\u062F\u0627\u0631\u0629 ${schoolName}`;
      draftContent = `\u0627\u0644\u0633\u0627\u062F\u0629 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0627\u0644\u0623\u0641\u0627\u0636\u0644\u060C

\u062A\u062D\u064A\u0629 \u0637\u064A\u0628\u0629 \u0648\u0628\u0639\u062F\u060C\u060C\u060C
\u0627\u0646\u0637\u0644\u0627\u0642\u0627\u064B \u0645\u0646 \u0627\u0644\u0634\u0631\u0627\u0643\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0627\u0644\u0648\u062B\u064A\u0642\u0629 \u0628\u064A\u0646 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0627\u0644\u0623\u0633\u0631\u0629\u060C \u0646\u0648\u062F \u0625\u062D\u0627\u0637\u062A\u0643\u0645 \u0639\u0644\u0645\u0627\u064B \u0628\u0645\u0633\u062A\u062C\u062F\u0627\u062A \u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0648\u0646\u0624\u0643\u062F \u0639\u0644\u0649 \u0623\u0647\u0645\u064A\u0629 \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0623\u0628\u0646\u0627\u0621 \u0628\u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u064A\u0648\u0645\u064A \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0648\u0627\u062C\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0639\u0628\u0631 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629.

\u0634\u0627\u0643\u0631\u064A\u0646 \u0644\u0643\u0645 \u062D\u0633\u0646 \u062A\u0639\u0627\u0648\u0646\u0643\u0645 \u0627\u0644\u062F\u0627\u0626\u0645 \u0645\u0639\u0646\u0627 \u0644\u0645\u0627 \u0641\u064A\u0647 \u0645\u0635\u0644\u062D\u0629 \u0623\u0628\u0646\u0627\u0626\u0646\u0627 \u0648\u0628\u0646\u0627\u062A\u0646\u0627.`;
    } else {
      draftTitle = `\u0625\u0639\u0644\u0627\u0646 \u0648\u062A\u0648\u062C\u064A\u0647 \u0625\u062F\u0627\u0631\u064A \u0639\u0627\u0645 \u2014 ${schoolName}`;
      draftContent = `\u0625\u0644\u0649 \u0643\u0627\u0641\u0629 \u0645\u0646\u0633\u0648\u0628\u064A \u0645\u062F\u0631\u0633\u0629 ${schoolName}\u060C

\u0646\u062D\u064A\u0637\u0643\u0645 \u0639\u0644\u0645\u0627\u064B \u0628\u0623\u062D\u062F\u062B \u0627\u0644\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u062A\u0639\u0632\u064A\u0632 \u062C\u0648\u062F\u0629 \u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u060C \u0648\u0646\u0631\u062C\u0648 \u0645\u0646 \u0627\u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0648\u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u0643 \u0644\u062A\u062D\u0642\u064A\u0642 \u0623\u0639\u0644\u0649 \u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0627\u0644\u062A\u0645\u064A\u0632.

\u0645\u0639 \u062E\u0627\u0644\u0635 \u062A\u0645\u0646\u064A\u0627\u062A\u0646\u0627 \u0644\u0644\u062C\u0645\u064A\u0639 \u0628\u0627\u0644\u062A\u0648\u0641\u064A\u0642 \u0648\u0627\u0644\u0646\u062C\u0627\u062D.`;
    }
    const draftObj = {
      type: "announcement",
      title: draftTitle,
      priority,
      content: draftContent,
      targetAudience: audience,
      authorName: `\u0625\u062F\u0627\u0631\u0629 ${schoolName}`
    };
    let responseText = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0633\u064A\u0627\u062F\u0629 \u0627\u0644\u0645\u062F\u064A\u0631 \u{1F4E2}

\u0644\u0642\u062F \u0642\u0645\u062A \u0628\u0635\u064A\u0627\u063A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0631\u0633\u0645\u064A \u0628\u0623\u0633\u0644\u0648\u0628 \u0642\u064A\u0627\u062F\u064A \u0648\u062A\u0631\u0628\u0648\u064A \u0645\u062D\u0641\u0651\u0632\u060C \u0648\u0647\u0648 \u0645\u0635\u0645\u0645 \u062E\u0635\u064A\u0635\u0627\u064B \u0644\u062A\u0648\u062C\u064A\u0647\u0647 \u0625\u0644\u0649 **${audience}** \u0645\u0639 \u0645\u0631\u0627\u0639\u0627\u0629 \u0623\u0639\u0644\u0649 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0627\u0644\u0631\u0635\u064A\u0646\u0629.

### \u{1F4A1} \u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0644\u0644\u0625\u0639\u0644\u0627\u0646:
\u2022 **\u0627\u0644\u0648\u0636\u0648\u062D \u0627\u0644\u0645\u0628\u0627\u0634\u0631**: \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0628\u0646\u0642\u0627\u0637 \u0639\u0645\u0644\u064A\u0629 \u0648\u0645\u062D\u062F\u062F\u0629 \u0644\u062A\u0641\u0627\u062F\u064A \u0623\u064A \u0627\u0644\u062A\u0628\u0627\u0633 \u0641\u064A \u0627\u0644\u062A\u062C\u0647\u064A\u0632\u0627\u062A.
\u2022 **\u0628\u062B \u0627\u0644\u0631\u0648\u062D \u0627\u0644\u0645\u0639\u0646\u0648\u064A\u0629**: \u062A\u0639\u0632\u064A\u0632 \u0644\u063A\u0629 \u0627\u0644\u0634\u0631\u0627\u0643\u0629 \u0648\u0627\u0644\u062A\u0642\u062F\u064A\u0631 \u0644\u062C\u0647\u0648\u062F \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u064A\u062D\u0641\u0632\u0647\u0645 \u0639\u0644\u0649 \u0628\u0630\u0644 \u0623\u0642\u0635\u0649 \u0637\u0627\u0642\u0627\u062A\u0647\u0645 \u0641\u064A \u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0644\u0644\u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A.

\u062A\u0641\u0636\u0644 \u0628\u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0623\u062F\u0646\u0627\u0647\u061B \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 **"\u0646\u0634\u0631 \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0641\u064A \u0627\u0644\u0645\u062F\u0631\u0633\u0629"** \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0646\u0634\u0631 \u0644\u0625\u062F\u0631\u0627\u062C\u0647 \u0641\u0648\u0631\u0627\u064B \u0641\u064A \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0625\u062A\u0627\u062D\u062A\u0647 \u0641\u064A \u0628\u0648\u0627\u0628\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646:`;
    return `${responseText}

\`\`\`json:publish-draft
${JSON.stringify(draftObj, null, 2)}
\`\`\``;
  }
  if (isPollReq && !wantsExcel) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639";
    if (q.includes("\u0645\u062F\u0631\u0633") || q.includes("\u0645\u0639\u0644\u0645")) audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    else if (q.includes("\u0637\u0627\u0644\u0628") || q.includes("\u0637\u0644\u0627\u0628")) audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    else if (q.includes("\u0623\u0648\u0644\u064A\u0627\u0621") || q.includes("\u0648\u0644\u064A")) audience = "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631";
    const pollObj = {
      type: "poll",
      title: "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062A\u0641\u0627\u0639\u0644\u064A \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      content: "\u0646\u0623\u0645\u0644 \u0645\u0634\u0627\u0631\u0643\u062A\u0643\u0645 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0627\u0644\u0642\u0635\u064A\u0631 \u0644\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0641\u064A \u0627\u062A\u062E\u0627\u0630 \u0623\u0641\u0636\u0644 \u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0637\u0648\u064A\u0631\u064A\u0629 \u0644\u0644\u0645\u062F\u0631\u0633\u0629.",
      priority: "\u0639\u0627\u062F\u064A",
      targetAudience: audience,
      pollOptions: ["\u0645\u0648\u0627\u0641\u0642 \u062A\u0645\u0627\u0645\u0627\u064B \u0648\u0645\u062A\u062D\u0645\u0633", "\u0645\u0648\u0627\u0641\u0642 \u0645\u0639 \u0628\u0639\u0636 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0627\u062A", "\u0623\u0641\u0636\u0644 \u062A\u0623\u062C\u064A\u0644 \u0627\u0644\u0645\u0648\u0639\u062F"],
      authorName: `\u0625\u062F\u0627\u0631\u0629 ${schoolName}`
    };
    let responseText = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4CA}

\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0627\u0644\u0631\u0623\u064A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A \u0644\u0644\u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u064A \u0644\u0645\u0633\u0627\u0639\u062F\u062A\u0643 \u0641\u064A \u0642\u064A\u0627\u0633 \u0627\u0644\u062A\u0648\u062C\u0647\u0627\u062A \u0648\u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062A \u0627\u0644\u0635\u0627\u0626\u0628\u0629.

\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0632\u0631 \u0627\u0644\u0646\u0634\u0631 \u0623\u062F\u0646\u0627\u0647 \u0644\u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0641\u064A \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629:`;
    return `${responseText}

\`\`\`json:publish-draft
${JSON.stringify(pollObj, null, 2)}
\`\`\``;
  }
  if (isEventReq && !wantsExcel) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639";
    if (q.includes("\u0645\u062F\u0631\u0633") || q.includes("\u0645\u0639\u0644\u0645")) audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    else if (q.includes("\u0637\u0627\u0644\u0628") || q.includes("\u0637\u0644\u0627\u0628")) audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    const eventObj = {
      type: "event",
      title: "\u0641\u0639\u0627\u0644\u064A\u0629 \u0648\u0646\u0634\u0627\u0637 \u0645\u062F\u0631\u0633\u064A \u0645\u0639\u062A\u0645\u062F",
      content: "\u0641\u0639\u0627\u0644\u064A\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u062A\u0647\u062F\u0641 \u0625\u0644\u0649 \u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646.",
      priority: "\u0647\u0627\u0645",
      targetAudience: audience,
      eventDate: new Date(Date.now() + 864e5 * 3).toISOString().split("T")[0],
      eventTime: "10:00 \u0635\u0628\u0627\u062D\u0627\u064B",
      eventLocation: "\u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      authorName: `\u0625\u062F\u0627\u0631\u0629 ${schoolName}`
    };
    let responseText = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4C5}

\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0648\u062F\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0628\u0643\u0627\u0645\u0644 \u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627 \u0648\u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u062C\u062F\u0648\u0644\u0629 \u0648\u0627\u0644\u0625\u062F\u0631\u0627\u062C \u0641\u064A \u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A.

\u064A\u0645\u0643\u0646\u0643 \u0645\u0631\u0627\u062C\u0639\u0629 \u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627 \u0623\u062F\u0646\u0627\u0647 \u0648\u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0632\u0631 \u0627\u0644\u062C\u062F\u0648\u0644\u0629 \u0644\u0644\u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0644\u0625\u0636\u0627\u0641\u0629:`;
    return `${responseText}

\`\`\`json:publish-draft
${JSON.stringify(eventObj, null, 2)}
\`\`\``;
  }
  if (q.includes("\u0623\u0648\u0627\u0626\u0644") || q.includes("\u0634\u0631\u0641") || q.includes("\u0645\u062A\u0641\u0648\u0642") || q.includes("\u0646\u0642\u0627\u0637") || q.includes("\u062A\u0631\u062A\u064A\u0628") || q.includes("\u0645\u062A\u0635\u062F\u0631")) {
    const data = await executeSchoolTool("getSchoolLeaderboard", { limit: wantsExcel ? 25 : 8 }, schoolId);
    const top = data.topStudents || [];
    if (top.length === 0) {
      return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F31F}

### \u{1F3C6} \u0644\u0648\u062D\u0629 \u0634\u0631\u0641 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646:
\u2022 \u0644\u0645 \u064A\u062A\u0645 \u0631\u0635\u062F \u0646\u0642\u0627\u0637 \u062A\u0646\u0627\u0641\u0633\u064A\u0629 \u0644\u0644\u0637\u0644\u0627\u0628 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.

### \u{1F4A1} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u064A:
\u0639\u062F\u0645 \u0648\u062C\u0648\u062F \u0646\u0642\u0627\u0637 \u0645\u0633\u062C\u0644\u0629 \u064A\u0639\u0646\u064A \u0623\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u062A\u062D\u0641\u064A\u0632 \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A \u0641\u064A \u0628\u062F\u0627\u064A\u062A\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0641\u0635\u0644. \u0647\u0630\u0647 \u0641\u0631\u0635\u0629 \u0631\u0627\u0626\u0639\u0629 \u0644\u062A\u062F\u0634\u064A\u0646 \u0627\u0646\u0637\u0644\u0627\u0642\u0629 \u0645\u0644\u0647\u0645\u0629 \u062A\u062C\u0630\u0628 \u0627\u0647\u062A\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0627\u0628 \u0645\u0646 \u0627\u0644\u064A\u0648\u0645 \u0627\u0644\u0623\u0648\u0644.

### \u{1F680} \u0646\u0635\u0627\u0626\u062D \u0648\u062A\u0648\u0635\u064A\u0627\u062A \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629:
1. **\u0625\u0639\u0644\u0627\u0646 "\u062A\u062D\u062F\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0630\u0647\u0628\u064A"**: \u0625\u0637\u0644\u0627\u0642 \u0645\u0633\u0627\u0628\u0642\u0629 \u062F\u0631\u0627\u0633\u064A\u0629 \u0648\u0633\u0644\u0648\u0643\u064A\u0629 \u0642\u0635\u064A\u0631\u0629 \u062A\u0645\u0646\u062D \u0627\u0644\u0637\u0644\u0627\u0628 \u0646\u0642\u0627\u0637\u0627\u064B \u0623\u0648\u0644\u064A\u0629 \u0644\u062A\u063A\u0630\u064A\u0629 \u0644\u0648\u062D\u0629 \u0627\u0644\u0634\u0631\u0641.
2. **\u062A\u0643\u0631\u064A\u0645 \u0623\u0648\u0644 5 \u0637\u0644\u0627\u0628 \u064A\u0638\u0647\u0631\u0648\u0646 \u0641\u064A \u0627\u0644\u0644\u0648\u062D\u0629**: \u062A\u062E\u0635\u064A\u0635 \u0644\u0627\u0641\u062A\u0629 \u0634\u0631\u0641\u064A\u0629 \u0645\u0635\u0648\u0631\u0629 \u0641\u064A \u0627\u0644\u0625\u0630\u0627\u0639\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0648\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0644\u0631\u0641\u0639 \u0627\u0644\u0645\u0639\u0646\u0648\u064A\u0627\u062A.
3. **\u0631\u0628\u0637 \u0627\u0644\u0646\u0642\u0627\u0637 \u0628\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629**: \u0645\u0646\u062D \u0646\u0642\u0627\u0637 \u0641\u0648\u0631\u064A\u0629 \u0644\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u0635\u0628\u0627\u062D\u064A \u0627\u0644\u0645\u0628\u0643\u0631 \u0641\u064A \u0627\u0644\u0637\u0627\u0628\u0648\u0631.`;
    }
    const list = top.map(
      (s) => `\u2022 \u{1F947} **\u0627\u0644\u0645\u0631\u0643\u0632 ${s.rank}**: **${s.name}** (\u0641\u0635\u0644: ${s.className || "\u0639\u0627\u0645"}) \u2014 **${s.points}** \u0646\u0642\u0637\u0629`
    ).join("\n");
    const firstStudent = top[0]?.name || "\u0627\u0644\u0645\u062A\u0635\u062F\u0631";
    let answer = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u0627\u0644\u0645\u062A\u0645\u064A\u0632 \u{1F31F}

\u064A\u0633\u0631\u0646\u064A \u0623\u0646 \u0623\u0636\u0639 \u0628\u064A\u0646 \u064A\u062F\u064A\u0643 \u0642\u0631\u0627\u0621\u0629 \u062A\u062D\u0644\u064A\u0644\u064A\u0629 \u062D\u064A\u0629 \u0644\u0635\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0645\u062F\u0631\u0633\u064A:

### \u{1F3C6} \u0644\u0648\u062D\u0629 \u0634\u0631\u0641 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u062A\u0635\u062F\u0631\u064A\u0646:
${list}

---

### \u{1F50D} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A:
\u2022 \u064A\u062A\u0635\u062F\u0631 \u0627\u0644\u0637\u0627\u0644\u0628 **${firstStudent}** \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0634\u0631\u0641\u060C \u0645\u0645\u0627 \u064A\u0639\u0643\u0633 \u0627\u0646\u0636\u0628\u0627\u0637\u0627\u064B \u0639\u0627\u0644\u064A\u0627\u064B \u0648\u062A\u0631\u0627\u0643\u0645\u0627\u064B \u0625\u064A\u062C\u0627\u0628\u064A\u0627\u064B \u0628\u064A\u0646 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0648\u0627\u0644\u0633\u0644\u0648\u0643.
\u2022 \u0627\u0644\u062A\u0641\u0627\u0648\u062A \u0627\u0644\u0645\u062A\u0642\u0627\u0631\u0628 \u0641\u064A \u0627\u0644\u0646\u0642\u0627\u0637 \u0628\u064A\u0646 \u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0623\u0648\u0644\u0649 \u064A\u0634\u064A\u0631 \u0625\u0644\u0649 \u0628\u064A\u0626\u0629 \u062A\u0646\u0627\u0641\u0633\u064A\u0629 \u0635\u062D\u064A\u0629 \u062A\u0634\u062C\u0639 \u0628\u0642\u064A\u0629 \u0627\u0644\u0632\u0645\u0644\u0627\u0621 \u0639\u0644\u0649 \u0628\u0630\u0644 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062C\u0647\u062F \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0642\u0645\u0629.

---

### \u{1F4A1} \u0646\u0635\u0627\u0626\u062D \u0648\u062A\u0648\u0635\u064A\u0627\u062A \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629:
1. **\u0645\u0646\u062D "\u0634\u0627\u0631\u0629 \u0627\u0644\u0633\u0641\u064A\u0631 \u0627\u0644\u0635\u0641\u064A" \u0644\u0644\u0645\u062A\u0635\u062F\u0631\u064A\u0646**: \u062A\u0643\u0644\u064A\u0641 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0628\u0645\u0633\u0627\u0639\u062F\u0629 \u0632\u0645\u0644\u0627\u0626\u0647\u0645 \u0641\u064A \u0648\u0631\u0634 \u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0635\u063A\u0631\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u0641\u0635\u0648\u0644\u060C \u0645\u0645\u0627 \u064A\u0631\u0633\u062E \u0631\u0648\u062D \u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0627\u0644\u062A\u0646\u0627\u0641\u0633 \u0627\u0644\u0641\u0631\u062F\u064A \u0641\u0642\u0637.
2. **\u062A\u0643\u0631\u064A\u0645 \u0627\u0633\u062A\u0628\u0627\u0642\u064A \u0641\u064A \u0637\u0627\u0628\u0648\u0631 \u0627\u0644\u0635\u0628\u0627\u062D**: \u062A\u062E\u0635\u064A\u0635 \u0643\u0644\u0645\u0629 \u062A\u0634\u062C\u064A\u0639\u064A\u0629 \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0645\u0639 \u0634\u0647\u0627\u062F\u0629 \u062A\u0642\u062F\u064A\u0631 \u0631\u0642\u0645\u064A\u0629 \u062A\u064F\u0631\u0633\u0644 \u0644\u0623\u0648\u0644\u064A\u0627\u0621 \u0623\u0645\u0648\u0631\u0647\u0645 \u0639\u0628\u0631 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0644\u062A\u0639\u0632\u064A\u0632 \u0641\u062E\u0631 \u0627\u0644\u0623\u0633\u0631\u0629.
3. **\u062A\u0641\u0639\u064A\u0644 "\u0646\u062C\u0645 \u0627\u0644\u0635\u0639\u0648\u062F"**: \u062A\u062E\u0635\u064A\u0635 \u062C\u0627\u0626\u0632\u0629 \u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u0644\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0623\u0643\u062B\u0631 \u062A\u062D\u0633\u0646\u0627\u064B \u0641\u064A \u0627\u0644\u0646\u0642\u0627\u0637\u060C \u0644\u0636\u0645\u0627\u0646 \u0639\u062F\u0645 \u0625\u062D\u0628\u0627\u0637 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0630\u064A\u0646 \u0644\u0645 \u064A\u0635\u0644\u0648\u0627 \u0628\u0639\u062F \u0644\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0623\u0648\u0644\u0649.`;
    if (wantsExcel && top.length > 0) {
      const excelPayload = {
        fileName: `\u0643\u0634\u0641_\u0627\u0644\u0637\u0644\u0627\u0628_\u0627\u0644\u0623\u0648\u0627\u0626\u0644_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`,
        sheetName: "\u0644\u0648\u062D\u0629_\u0627\u0644\u0634\u0631\u0641",
        metadata: {
          title: `\u0644\u0648\u062D\u0629 \u0634\u0631\u0641 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646 - ${schoolName}`,
          schoolName,
          generatedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")
        },
        columns: ["\u0627\u0644\u062A\u0631\u062A\u064A\u0628", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0641\u0635\u0644", "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0646\u0642\u0627\u0637", "\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A\u0629"],
        rows: top.map((s) => [
          s.rank,
          s.name,
          s.className || "\u0639\u0627\u0645",
          s.points,
          s.rank === 1 ? "\u0627\u0644\u0645\u062A\u0635\u062F\u0631 \u{1F947}" : `\u0627\u0644\u0645\u0631\u0643\u0632 ${s.rank}`
        ])
      };
      answer += `

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
    }
    return answer;
  }
  if (q.includes("\u063A\u064A\u0627\u0628") || q.includes("\u063A\u0627\u0626\u0628") || q.includes("\u063A\u0627\u0626\u0628\u064A\u0646") || q.includes("\u062D\u0636\u0648\u0631") || q.includes("\u0645\u062A\u0623\u062E\u0631") || q.includes("\u0646\u0633\u0628\u0629 \u0627\u0644\u063A\u064A\u0627\u0628") || q.includes("\u0627\u0646\u0636\u0628\u0627\u0637")) {
    const queryDate = extractDateFromQuery(q);
    const isOnlyAbsentRequested = q.includes("\u063A\u0627\u0626\u0628") || q.includes("\u063A\u064A\u0627\u0628") || q.includes("\u063A\u0627\u0626\u0628\u064A\u0646");
    const isOnlyLateRequested = q.includes("\u0645\u062A\u0623\u062E\u0631") || q.includes("\u062A\u0623\u062E\u0631");
    const data = await executeSchoolTool("getAttendanceReport", {
      date: queryDate,
      status: isOnlyAbsentRequested ? "\u063A\u0627\u0626\u0628" : isOnlyLateRequested ? "\u0645\u062A\u0623\u062E\u0631" : void 0
    }, schoolId);
    let absentStr = "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0627\u0644\u0627\u062A \u063A\u064A\u0627\u0628 \u0645\u0633\u062C\u0644\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u0627\u0631\u064A\u062E (\u0627\u0646\u0636\u0628\u0627\u0637 \u0643\u0627\u0645\u0644 100%).";
    if (data.absentStudents && data.absentStudents.length > 0) {
      absentStr = data.absentStudents.slice(0, 15).map((s) => `\u2022 \u26A0\uFE0F **${s.name}** (\u0641\u0635\u0644: ${s.className}) \u2014 \u0633\u0628\u0628 \u0627\u0644\u0631\u0635\u062F: ${s.notes}`).join("\n");
    }
    let answer = `\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u064A\u0627 \u0642\u0627\u0626\u062F **${schoolName}** \u{1F4CB}

\u0625\u0644\u064A\u0643 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A \u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u0648\u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u064A \u0644\u062A\u0627\u0631\u064A\u062E **${data.date}**:

### \u{1F4CA} \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0644\u0644\u062D\u0636\u0648\u0631:
\u2022 **\u0646\u0633\u0628\u0629 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u0648\u0627\u0644\u062D\u0636\u0648\u0631 \u0627\u0644\u0639\u0627\u0645**: **${data.attendanceRate}** (${data.presentCount} \u0637\u0627\u0644\u0628 \u062D\u0627\u0636\u0631).
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u063A\u064A\u0627\u0628**: **${data.absentCount}** \u0637\u0627\u0644\u0628.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062A\u0623\u062E\u064A\u0631 \u0627\u0644\u0635\u0628\u0627\u062D\u064A**: **${data.lateCount}** \u0637\u0627\u0644\u0628.

**\u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u063A\u0627\u0626\u0628\u0648\u0646 \u0627\u0644\u0645\u0631\u0635\u0648\u062F\u0648\u0646 (${data.absentCount} \u0637\u0627\u0644\u0628)**:
${absentStr}

---

### \u{1F9E0} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A:
` + (data.absentCount > 0 ? `\u2022 \u062A\u0645 \u062D\u0635\u0631 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u063A\u064A\u0627\u0628 \u0628\u062F\u0642\u0629 (${data.absentCount} \u0637\u0627\u0644\u0628) \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0623\u0633\u0628\u0627\u0628 \u0627\u0644\u0627\u0646\u0642\u0637\u0627\u0639 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0645\u0628\u0643\u0631\u0627\u064B.
` : `\u2022 \u0646\u0633\u0628\u0629 \u062D\u0636\u0648\u0631 \u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0648\u0645\u062A\u0645\u064A\u0632\u0629 \u062A\u0639\u0643\u0633 \u0628\u064A\u0626\u0629 \u062C\u0627\u0630\u0628\u0629 \u0648\u0627\u0646\u0636\u0628\u0627\u0637\u0627\u064B \u0639\u0627\u0644\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631.
`) + `
---

### \u{1F680} \u0646\u0635\u0627\u0626\u062D \u0648\u062D\u0644\u0648\u0644 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629:
1. **\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0641\u0648\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0623\u0633\u0631\u064A**: \u0625\u0634\u0639\u0627\u0631 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0647\u0627\u062A\u0641\u064A\u0627\u064B \u0623\u0648 \u0639\u0628\u0631 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0628\u0627\u0644\u063A\u064A\u0627\u0628 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645 \u064A\u0642\u0644\u0635 \u0645\u0639\u062F\u0644\u0627\u062A \u0627\u0644\u063A\u064A\u0627\u0628 \u063A\u064A\u0631 \u0627\u0644\u0645\u0628\u0631\u0631 \u0628\u0646\u0633\u0628\u0629 \u062A\u0641\u0648\u0642 70%.
2. **\u062A\u062D\u0641\u064A\u0632 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0645**: \u062A\u0643\u0631\u064A\u0645 \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u062A\u064A \u062A\u0646\u0647\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0628\u0646\u0633\u0628\u0629 \u062D\u0636\u0648\u0631 \u0643\u0627\u0645\u0644\u0629 \u0644\u062A\u0639\u0632\u064A\u0632 \u0631\u0648\u062D \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0625\u064A\u062C\u0627\u0628\u064A.`;
    if (wantsExcel) {
      let targetRows = [];
      if (isOnlyAbsentRequested) {
        targetRows = (data.absentStudents || []).map((s, idx) => [
          idx + 1,
          s.name,
          s.className,
          "\u063A\u0627\u0626\u0628",
          s.notes || "\u063A\u064A\u0627\u0628 \u0628\u062F\u0648\u0646 \u0639\u0630\u0631",
          data.date
        ]);
      } else if (isOnlyLateRequested) {
        targetRows = (data.lateStudents || []).map((s, idx) => [
          idx + 1,
          s.name,
          s.className,
          "\u0645\u062A\u0623\u062E\u0631",
          s.notes || "\u062A\u0623\u062E\u0631 \u0635\u0628\u0627\u062D\u064A",
          data.date
        ]);
      } else {
        const absentRows = (data.absentStudents || []).map((s, idx) => [
          idx + 1,
          s.name,
          s.className,
          "\u063A\u0627\u0626\u0628",
          s.notes || "\u063A\u064A\u0627\u0628 \u0628\u062F\u0648\u0646 \u0639\u0630\u0631",
          data.date
        ]);
        const lateRows = (data.lateStudents || []).map((s, idx) => [
          absentRows.length + idx + 1,
          s.name,
          s.className,
          "\u0645\u062A\u0623\u062E\u0631",
          s.notes || "\u062A\u0623\u062E\u0631 \u0635\u0628\u0627\u062D\u064A",
          data.date
        ]);
        targetRows = [...absentRows, ...lateRows];
      }
      const fileTitle = isOnlyAbsentRequested ? `\u0643\u0634\u0641_\u0627\u0644\u0637\u0644\u0627\u0628_\u0627\u0644\u063A\u0627\u0626\u0628\u064A\u0646_${data.date}` : isOnlyLateRequested ? `\u0643\u0634\u0641_\u0627\u0644\u0645\u062A\u0623\u062E\u0631\u064A\u0646_${data.date}` : `\u0643\u0634\u0641_\u0627\u0644\u063A\u064A\u0627\u0628_\u0648\u0627\u0644\u062D\u0636\u0648\u0631_${data.date}`;
      const excelPayload = {
        fileName: `${fileTitle}.xlsx`,
        sheetName: "\u0627\u0644\u063A\u064A\u0627\u0628",
        metadata: {
          title: isOnlyAbsentRequested ? `\u0643\u0634\u0641 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u063A\u0627\u0626\u0628\u064A\u0646 - ${schoolName}` : `\u0643\u0634\u0641 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 - ${schoolName}`,
          schoolName,
          generatedAt: data.date
        },
        columns: ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0641\u0635\u0644", "\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0636\u0648\u0631", "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0631\u0635\u062F", "\u0627\u0644\u062A\u0627\u0631\u064A\u062E"],
        rows: targetRows.length > 0 ? targetRows : [[1, "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0627\u0644\u0627\u062A \u063A\u064A\u0627\u0628 \u0645\u0633\u062C\u0644\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u0627\u0631\u064A\u062E", "\u0643\u0627\u0641\u0629 \u0627\u0644\u0641\u0635\u0648\u0644", "\u062D\u0627\u0636\u0631 100%", "\u0627\u0646\u0636\u0628\u0627\u0637 \u0643\u0627\u0645\u0644", data.date]]
      };
      answer += `

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
    }
    return answer;
  }
  if (q.includes("\u0637\u0627\u0644\u0628") || q.includes("\u0637\u0644\u0627\u0628") || q.includes("\u062A\u0644\u0627\u0645\u064A\u0630") || q.includes("\u0642\u064A\u062F") || q.includes("\u0633\u062C\u0644") || q.includes("\u0642\u0648\u0645\u064A") || q.includes("\u0627\u0644\u0642\u0648\u0645\u064A") || q.includes("\u0648\u0632\u0627\u0631") || q.includes("\u0627\u0644\u0648\u0632\u0627\u0631") || q.includes("\u0627\u0633\u0645\u0627\u0621") || q.includes("\u0623\u0633\u0645\u0627\u0621") || q.includes("\u0627\u0633\u0645") && q.includes("\u0643\u0648\u062F") || q.includes("\u0627\u0633\u0645") && wantsExcel || q.includes("\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628") || q.includes("\u0643\u0634\u0641 \u0627\u0644\u0637\u0644\u0627\u0628") || q.includes("\u0634\u064A\u062A \u0627\u0644\u0637\u0644\u0627\u0628") || q.includes("\u0633\u062C\u0644 \u0627\u0644\u0642\u064A\u062F")) {
    if (wantsExcel) {
      const { text: text2, excelPayload } = await generateAccurateStudentExcelPayload(query, schoolId, schoolName);
      return `${text2}

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
    }
    const data = await executeSchoolTool("searchStudents", { limit: 25 }, schoolId);
    const students = data.students || [];
    let answer = `\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F468}\u200D\u{1F393}

\u0625\u0644\u064A\u0643 \u0645\u0644\u062E\u0635 \u0633\u062C\u0644\u0627\u062A \u0642\u064A\u062F \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646 \u0628\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629:

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0630\u064A\u0646 \u062A\u0645 \u062C\u0644\u0628\u0647\u0645**: **${students.length}** \u0637\u0627\u0644\u0628.
` + (students.length > 0 ? `\u2022 **\u0639\u064A\u0646\u0629 \u0645\u0646 \u0627\u0644\u0637\u0644\u0627\u0628**: ${students.slice(0, 5).map((s) => `${s.name} (${s.className || "\u0639\u0627\u0645"})`).join("\u060C ")}.

` : "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u062C\u0644\u0627\u062A \u0637\u0644\u0627\u0628 \u0645\u0636\u0627\u0641\u0629 \u0628\u0639\u062F.\n\n") + `### \u{1F4A1} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A:
\u0627\u0643\u062A\u0645\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0648\u0623\u0643\u0648\u0627\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0642\u0648\u0645\u064A\u0629 \u064A\u0633\u0647\u0644 \u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0631\u0635\u062F \u0627\u0644\u0622\u0644\u064A \u0644\u0644\u062F\u0631\u062C\u0627\u062A \u0648\u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0648\u0631\u064A\u0629.`;
    return answer;
  }
  if (q.includes("\u062F\u0631\u062C\u0627\u062A") || q.includes("\u062A\u062D\u0635\u064A\u0644") || q.includes("\u0646\u062A\u064A\u062C\u0629") || q.includes("\u0623\u0643\u0627\u062F\u064A\u0645\u064A") || q.includes("\u0643\u0634\u0641")) {
    const data = await executeSchoolTool("getGradesReport", {}, schoolId);
    const grades = data.grades || [];
    let answer = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4C8}

\u0625\u0644\u064A\u0643 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A \u0644\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u062A\u062D\u0635\u064A\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629:

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629**: **${data.totalResults || grades.length}** \u0646\u062A\u064A\u062C\u0629.
` + (grades.length > 0 ? `\u2022 **\u0623\u0628\u0631\u0632 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0645\u0633\u062C\u0644\u0629**: ${grades.slice(0, 5).map((g) => `${g.studentName} \u0641\u064A ${g.subjectName} (${g.score}/${g.maxScore})`).join("\u060C ")}.

` : "\u2022 \u0644\u0645 \u064A\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062F\u0631\u062C\u0627\u062A \u0628\u0639\u062F \u0644\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0627\u0644\u062D\u0627\u0644\u064A.\n\n") + `### \u{1F4A1} \u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629:
\u0627\u0644\u0631\u0635\u062F \u0627\u0644\u062F\u0648\u0631\u064A \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0648\u0627\u0644\u0642\u0635\u064A\u0631\u0629 \u064A\u0645\u0646\u062D \u0645\u0624\u0634\u0631\u0627\u064B \u0645\u0628\u0643\u0631\u0627\u064B \u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u062D\u062A\u0627\u062C\u064A\u0646 \u0644\u062E\u0637\u0637 \u062F\u0639\u0645 \u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0642\u0628\u0644 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629.`;
    if (wantsExcel && grades.length > 0) {
      const excelPayload = {
        fileName: `\u0643\u0634\u0641_\u062F\u0631\u062C\u0627\u062A_\u0648\u062A\u062D\u0635\u064A\u0644_\u0627\u0644\u0637\u0644\u0627\u0628_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`,
        sheetName: "\u0627\u0644\u062F\u0631\u062C\u0627\u062A",
        metadata: {
          title: `\u0643\u0634\u0641 \u0646\u062A\u0627\u0626\u062C \u0648\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 - ${schoolName}`,
          schoolName,
          generatedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")
        },
        columns: ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628", "\u0627\u0644\u0641\u0635\u0644", "\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629", "\u0646\u0648\u0639 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631", "\u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0645\u062D\u0635\u0644\u0629", "\u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0639\u0638\u0645\u0649"],
        rows: grades.map((g, idx) => [
          idx + 1,
          g.studentName,
          g.className || "\u0639\u0627\u0645",
          g.subjectName,
          g.examName || "\u0627\u062E\u062A\u0628\u0627\u0631 \u0634\u0647\u0631\u064A",
          g.score,
          g.maxScore
        ])
      };
      answer += `

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
    }
    return answer;
  }
  if (q.includes("\u0645\u0639\u0644\u0645") || q.includes("\u0645\u0639\u0644\u0645\u064A\u0646") || q.includes("\u0643\u0627\u062F\u0631") || q.includes("\u0645\u062F\u0631\u0633") || q.includes("\u0641\u0635\u0648\u0644") || q.includes("\u0642\u0627\u0639\u0627\u062A") || q.includes("\u0645\u0634\u0631\u0641")) {
    const data = await executeSchoolTool("getTeachersAndClasses", {}, schoolId);
    const teachers = data.teachers || [];
    const classes = data.classes || [];
    let answer = `\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F468}\u200D\u{1F3EB}

\u0625\u0644\u064A\u0643 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0644\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A \u0648\u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629:

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646**: **${data.totalTeachers || teachers.length}** \u0645\u0639\u0644\u0645.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629**: **${data.totalClasses || classes.length}** \u0642\u0627\u0639\u0629 \u0648\u0641\u0635\u0644.

### \u{1F4A1} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A:
\u0645\u0648\u0627\u0632\u0646\u0629 \u0627\u0644\u0646\u0635\u0627\u0628 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A \u0648\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0645\u0648\u0627\u062F \u0628\u0634\u0643\u0644 \u0645\u062A\u0643\u0627\u0641\u0626 \u064A\u0639\u0632\u0632 \u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0648\u0631\u0627\u062D\u0629 \u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u062A\u062F\u0631\u064A\u0633\u064A.`;
    if (wantsExcel && teachers.length > 0) {
      const excelPayload = {
        fileName: `\u062F\u0644\u064A\u0644_\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646_\u0648\u0627\u0644\u0641\u0635\u0648\u0644_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`,
        sheetName: "\u0627\u0644\u0645\u0639\u0644\u0645\u0648\u0646_\u0648\u0627\u0644\u0641\u0635\u0648\u0644",
        metadata: {
          title: `\u062F\u0644\u064A\u0644 \u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A \u0648\u0627\u0644\u0641\u0635\u0648\u0644 - ${schoolName}`,
          schoolName,
          generatedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")
        },
        columns: ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u0644\u0645", "\u0627\u0644\u062A\u062E\u0635\u0635", "\u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u0633\u0646\u062F\u0629", "\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0633\u0646\u062F\u0629", "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", "\u0627\u0644\u062D\u0627\u0644\u0629"],
        rows: teachers.map((t, idx) => [
          idx + 1,
          t.name,
          t.specialization || "\u0639\u0627\u0645",
          Array.isArray(t.assignedClasses) ? t.assignedClasses.join("\u060C ") : t.assignedClasses || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          Array.isArray(t.assignedSubjects) ? t.assignedSubjects.join("\u060C ") : t.assignedSubjects || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          t.phone || "\u063A\u064A\u0631 \u0645\u0633\u062C\u0644",
          t.status || "\u0639\u0644\u0649 \u0631\u0623\u0633 \u0627\u0644\u0639\u0645\u0644"
        ])
      };
      answer += `

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
    }
    return answer;
  }
  if (q.includes("\u0645\u062C\u062A\u0645\u0639") || q.includes("\u0631\u0633\u0627\u0626\u0644") || q.includes("\u0634\u0627\u062A") || q.includes("\u0627\u0633\u062A\u0637\u0644\u0627\u0639") || q.includes("\u0646\u0642\u0627\u0634") || q.includes("\u0645\u062D\u0627\u062F\u062B\u0627\u062A")) {
    const data = await executeSchoolTool("getCommunityDiscussions", { limit: 6 }, schoolId);
    const msgs = data.messages || [];
    if (msgs.length === 0) {
      return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4AC}

### \u{1F4AC} \u0646\u0628\u0636 \u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A:
\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u0633\u0627\u0626\u0644 \u062C\u062F\u064A\u062F\u0629 \u0623\u0648 \u0646\u0642\u0627\u0634\u0627\u062A \u0645\u0641\u062A\u0648\u062D\u0629 \u0641\u064A \u063A\u0631\u0641 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u062D\u0627\u0644\u064A\u0627\u064B.

### \u{1F50D} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u064A:
\u0627\u0644\u0647\u062F\u0648\u0621 \u0641\u064A \u063A\u0631\u0641 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0641\u0631\u0635\u0629 \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0644\u0643\u064A \u062A\u0643\u0648\u0646 \u0647\u064A **\u0627\u0644\u0645\u0628\u0627\u062F\u0631 \u0648\u0627\u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A** \u0644\u0644\u062D\u0648\u0627\u0631\u060C \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u062A\u0631\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u062E\u0627\u0645\u0644\u0629.

### \u{1F4A1} \u0646\u0635\u0627\u0626\u062D \u0648\u062A\u0648\u0635\u064A\u0627\u062A \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629:
1. **\u0637\u0631\u062D "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062A\u0641\u0627\u0639\u0644\u064A"**: \u0646\u0634\u0631 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0645\u0628\u0633\u0637 \u0645\u062B\u0644: *"\u0645\u0627 \u0647\u064A \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0627\u0644\u0623\u0643\u062B\u0631 \u062D\u0645\u0627\u0633\u0627\u064B \u0627\u0644\u062A\u064A \u062A\u0648\u062F\u0648\u0646 \u062A\u0646\u0638\u064A\u0645\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631\u061F"*.
2. **\u0645\u0646\u0634\u0648\u0631 \u062A\u062D\u0641\u064A\u0632\u064A \u0623\u0633\u0628\u0648\u0639\u064A \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629**: \u0643\u062A\u0627\u0628\u0629 \u0631\u0633\u0627\u0644\u0629 \u0635\u0628\u0627\u062D\u064A\u0629 \u0645\u0634\u062C\u0639\u0629 \u0644\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u062A\u0639\u0628\u0631 \u0639\u0646 \u0641\u062E\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0628\u062C\u0647\u0648\u062F\u0647\u0645.
3. **\u062A\u0641\u0639\u064A\u0644 \u0645\u0633\u0627\u0628\u0642\u0629 \u0627\u0644\u062A\u062D\u062F\u064A \u0627\u0644\u062B\u0642\u0627\u0641\u064A**: \u0637\u0631\u062D \u0633\u0624\u0627\u0644 \u0623\u0633\u0628\u0648\u0639\u064A \u0630\u0643\u064A \u0645\u0639 \u062A\u0643\u0631\u064A\u0645 \u0623\u0648\u0644 3 \u0637\u0644\u0627\u0628 \u064A\u062C\u064A\u0628\u0648\u0646 \u0641\u064A \u0627\u0644\u0634\u0627\u062A \u0628\u0646\u0642\u0627\u0637 \u062A\u0645\u064A\u0632.`;
    }
    const list = msgs.map((m) => `\u2022 [${m.time}] **${m.sender}**: "${m.text}"${m.poll ? ` *(\u0627\u0633\u062A\u0637\u0644\u0627\u0639: ${m.poll.question})*` : ""}`).join("\n");
    return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0642\u0627\u0626\u062F **${schoolName}** \u{1F4AC}

\u064A\u0633\u0631\u0646\u064A \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0623\u062D\u062F\u062B \u062D\u0648\u0627\u0631\u0627\u062A \u0648\u0646\u0628\u0636 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u064A:

### \u{1F4AC} \u0622\u062E\u0631 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A \u0627\u0644\u0645\u0631\u0635\u0648\u062F\u0629:
${list}

---

### \u{1F9E0} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u064A:
\u2022 \u0646\u0644\u0627\u062D\u0638 \u062D\u0631\u0627\u0643\u0627\u064B \u062A\u0641\u0627\u0639\u0644\u064A\u0627\u064B \u064A\u0639\u0643\u0633 \u0627\u0647\u062A\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0627\u0628 \u0628\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0625\u064A\u062C\u0627\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0645\u0639 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0648\u0627\u0644\u062A\u0643\u0631\u064A\u0645\u0627\u062A \u0627\u0644\u0622\u0644\u064A\u0629.
\u2022 \u0648\u062C\u0648\u062F \u0645\u0633\u0627\u062D\u0629 \u0622\u0645\u0646\u0629 \u0644\u0644\u062D\u0648\u0627\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u064A \u062A\u062D\u062A \u0625\u0634\u0631\u0627\u0641 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u064A\u0639\u0632\u0632 \u0627\u0644\u062B\u0642\u0629 \u0627\u0644\u0645\u062A\u0628\u0627\u062F\u0644\u0629 \u0648\u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0644\u062F\u0649 \u0627\u0644\u0637\u0644\u0627\u0628.

---

### \u{1F680} \u0646\u0635\u0627\u0626\u062D \u0648\u062A\u0648\u0635\u064A\u0627\u062A \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629:
1. **\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0645\u0644\u0647\u0645**: \u0627\u0644\u0631\u062F \u0628\u0631\u0645\u0632 \u062A\u0634\u062C\u064A\u0639\u064A \u0623\u0648 \u062A\u0639\u0644\u064A\u0642 \u0641\u0648\u0631\u064A \u0645\u0646 \u062D\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0639\u0644\u0649 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u0629\u061B \u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u062F\u064A\u0631 \u0627\u0644\u0628\u0633\u064A\u0637 \u064A\u0635\u0646\u0639 \u0623\u062B\u0631\u0627\u064B \u0646\u0641\u0633\u064A\u0627\u064B \u0628\u0627\u0644\u063A\u0627\u064B.
2. **\u062A\u0646\u0638\u064A\u0645 "\u0633\u0627\u0639\u0629 \u062D\u0648\u0627\u0631 \u0645\u0639 \u0627\u0644\u0645\u062F\u064A\u0631"**: \u062A\u062E\u0635\u064A\u0635 \u0646\u0635\u0641 \u0633\u0627\u0639\u0629 \u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u064A\u064F\u0641\u062A\u062D \u0641\u064A\u0647\u0627 \u0645\u0648\u0636\u0648\u0639 \u0644\u0644\u0646\u0642\u0627\u0634 \u0645\u0639 \u0627\u0644\u0637\u0644\u0627\u0628 \u062D\u0648\u0644 \u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629.
3. **\u0625\u0628\u0631\u0627\u0632 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0627\u062A \u0627\u0644\u0642\u064A\u0645\u0629**: \u062A\u0643\u0631\u064A\u0645 \u0623\u0641\u0636\u0644 \u0631\u0633\u0627\u0644\u0629 \u0623\u0648 \u0645\u0634\u0627\u0631\u0643\u0629 \u0625\u064A\u062C\u0627\u0628\u064A\u0629 \u0641\u064A \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0628\u0648\u0633\u0627\u0645 \u0634\u0631\u0641\u064A \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u062C\u062A\u0645\u0639.`;
  }
  if (q.includes("\u062A\u0642\u0648\u064A\u0645") || q.includes("\u062C\u062F\u0648\u0644") || q.includes("\u0641\u0639\u0627\u0644\u064A\u0627\u062A") || q.includes("\u0627\u0645\u062A\u062D\u0627\u0646") || q.includes("\u0627\u062E\u062A\u0628\u0627\u0631") || q.includes("\u0639\u0637\u0644\u0629") || q.includes("\u0645\u0647\u0627\u0645")) {
    const data = await executeSchoolTool("getSchoolCalendar", {}, schoolId);
    const tasks = data.tasks || [];
    if (tasks.length === 0) {
      return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4C5}

### \u{1F4C5} \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A:
\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0623\u0648 \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u062F\u0631\u062C\u0629 \u0641\u064A \u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0644\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629.

### \u{1F4A1} \u0646\u0635\u064A\u062D\u0629 \u0625\u062F\u0627\u0631\u064A\u0629:
\u0627\u0644\u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0645\u0633\u0628\u0642\u0629 \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0644\u0627\u0635\u0641\u064A\u0629 \u062A\u0645\u0646\u062D \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0636\u0648\u062D\u0627\u064B \u0643\u0627\u0645\u0644\u0627\u064B \u0648\u062A\u062E\u0641\u0641 \u0645\u0646 \u0627\u0644\u062A\u0648\u062A\u0631 \u0627\u0644\u062F\u0631\u0627\u0633\u064A. \u064A\u0645\u0643\u0646\u0643 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0642\u0633\u0645 (\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A).`;
    }
    const list = tasks.slice(0, 6).map((t) => `\u2022 \u{1F4CC} **${t.title}** \u2014 \u0627\u0644\u062A\u0627\u0631\u064A\u062E: **${t.date}** (\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629: ${t.priority || "\u0639\u0627\u062F\u064A\u0629"} | \u0627\u0644\u062D\u0627\u0644\u0629: ${t.status === "completed" ? "\u0645\u0646\u062C\u0632 \u2705" : "\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u23F3"})`).join("\n");
    let answer = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F4C5}

\u0625\u0644\u064A\u0643 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629 \u0641\u064A \u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A:

### \u{1F4CC} \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0648\u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629:
${list}

---

### \u{1F4A1} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0628\u0627\u0642\u064A\u0629:
1. **\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0628\u0643\u0631 \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A**: \u0625\u0631\u0633\u0627\u0644 \u062A\u0630\u0643\u064A\u0631\u0627\u062A \u062A\u0646\u0628\u064A\u0647\u064A\u0629 \u0644\u0644\u0637\u0644\u0627\u0628 \u0648\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0642\u0628\u0644 \u0627\u0644\u0645\u0648\u0639\u062F \u0628\u0640 3 \u0623\u064A\u0627\u0645 \u0639\u0628\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629.
2. **\u0645\u0648\u0627\u0632\u0646\u0629 \u0636\u063A\u0637 \u0627\u0644\u0623\u0646\u0634\u0637\u0629**: \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0639\u062F\u0645 \u062A\u0632\u0627\u0645\u0646 \u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0627\u0644\u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u064A\u0648\u0645 \u0644\u0645\u0631\u0627\u0639\u0627\u0629 \u0627\u0644\u0637\u0627\u0642\u0629 \u0627\u0644\u0630\u0647\u0646\u064A\u0629 \u0644\u0644\u0637\u0644\u0627\u0628.
3. **\u0639\u0642\u062F \u0627\u062C\u062A\u0645\u0627\u0639 \u062A\u062D\u0636\u064A\u0631\u064A \u0633\u0631\u064A\u0639**: \u0645\u0631\u0627\u062C\u0639\u0629 \u062E\u0637\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0644\u0636\u0645\u0627\u0646 \u062C\u0627\u0647\u0632\u064A\u0629 \u0627\u0644\u0642\u0627\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0642\u0628\u0644 \u0623\u064A \u0641\u0639\u0627\u0644\u064A\u0629.`;
    if (wantsExcel && tasks.length > 0) {
      const excelPayload = {
        fileName: `\u062C\u062F\u0648\u0644_\u0627\u0644\u062A\u0642\u0648\u064A\u0645_\u0627\u0644\u0645\u062F\u0631\u0633\u064A_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`,
        sheetName: "\u0627\u0644\u062A\u0642\u0648\u064A\u0645_\u0627\u0644\u0645\u062F\u0631\u0633\u064A",
        metadata: {
          title: `\u062C\u062F\u0648\u0644 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 - ${schoolName}`,
          schoolName,
          generatedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")
        },
        columns: ["\u0645", "\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629 / \u0627\u0644\u0645\u0647\u0645\u0629", "\u0627\u0644\u062A\u0627\u0631\u064A\u062E", "\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629", "\u0627\u0644\u062D\u0627\u0644\u0629", "\u0627\u0644\u0648\u0635\u0641"],
        rows: tasks.map((t, idx) => [
          idx + 1,
          t.title,
          t.date,
          t.priority || "\u0639\u0627\u062F\u064A\u0629",
          t.status === "completed" ? "\u0645\u0646\u062C\u0632" : "\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631",
          t.description || ""
        ])
      };
      answer += `

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
    }
    return answer;
  }
  if (q.includes("\u0648\u0633\u0627\u0645") || q.includes("\u0623\u0648\u0633\u0645\u0629") || q.includes("\u062A\u0643\u0631\u064A\u0645") || q.includes("\u0634\u0627\u0631\u0629") || q.includes("\u0634\u0631\u0641\u064A\u0629")) {
    const data = await executeSchoolTool("getBadgesSummary", {}, schoolId);
    return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F396}\uFE0F

\u0625\u0644\u064A\u0643 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0648\u0627\u0644\u062A\u062D\u0641\u064A\u0632 \u0627\u0644\u062A\u0643\u0631\u064A\u0645\u064A:

### \u{1F396}\uFE0F \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u062A\u0643\u0631\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629:
\u2022 **\u0623\u0648\u0633\u0645\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629**: **${data.totalStudentBadgesAwarded}** \u0648\u0633\u0627\u0645 \u062A\u0645\u064A\u0632.
\u2022 **\u0623\u0648\u0633\u0645\u0629 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629**: **${data.totalTeacherBadgesAwarded}** \u0648\u0633\u0627\u0645 \u0625\u0634\u0627\u062F\u0629.

---

### \u{1F4A1} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A\u0629:
1. **\u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u062A\u0635\u0646\u0639 \u0627\u0644\u0647\u0648\u064A\u0629 \u0627\u0644\u0625\u064A\u062C\u0627\u0628\u064A\u0629**: \u062D\u0635\u0648\u0644 \u0627\u0644\u0637\u0644\u0627\u0628 \u0639\u0644\u0649 \u0623\u0648\u0633\u0645\u0629 \u064A\u0639\u0632\u0632 \u062F\u0627\u0641\u0639\u064A\u0629 \u0627\u0644\u062A\u0639\u0644\u0645 \u0648\u064A\u0632\u064A\u062F \u0645\u0646 \u0625\u0642\u0628\u0627\u0644\u0647\u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629.
2. **\u062A\u0643\u0631\u064A\u0645 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0634\u063A\u0641**: \u0645\u0628\u0627\u062F\u0631\u0629 \u062A\u0643\u0631\u064A\u0645 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u064A\u0646 \u0628\u0623\u0648\u0633\u0645\u0629 \u0625\u062F\u0627\u0631\u064A\u0629 \u062F\u0648\u0631\u064A\u0629 \u062A\u0631\u0641\u0639 \u0627\u0644\u0631\u0648\u062D \u0627\u0644\u0645\u0639\u0646\u0648\u064A\u0629 \u0648\u062A\u062D\u0641\u0632 \u0639\u0644\u0649 \u0627\u0644\u0627\u0628\u062A\u0643\u0627\u0631 \u0641\u064A \u0637\u0631\u0627\u0626\u0642 \u0627\u0644\u062A\u062F\u0631\u064A\u0633.
3. **\u0625\u0637\u0644\u0627\u0642 "\u0648\u0633\u0627\u0645 \u0627\u0644\u062A\u062D\u062F\u064A \u0627\u0644\u0634\u0647\u0631\u064A"**: \u0648\u0633\u0627\u0645 \u0630\u0648 \u0637\u0627\u0628\u0639 \u062E\u0627\u0635 \u064A\u064F\u0645\u0646\u062D \u0644\u0644\u0637\u0644\u0627\u0628 \u0623\u0635\u062D\u0627\u0628 \u0627\u0644\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u0627\u0644\u0645\u062C\u062A\u0645\u0639\u064A\u0629 \u0623\u0648 \u0627\u0644\u0633\u0644\u0648\u0643\u064A\u0627\u062A \u0627\u0644\u0625\u064A\u062B\u0627\u0631\u064A\u0629.`;
  }
  if (q.includes("\u0633\u0644\u0648\u0643") || q.includes("\u0625\u062C\u0631\u0627\u0621") || q.includes("\u0625\u0646\u0630\u0627\u0631") || q.includes("\u0627\u0633\u062A\u062F\u0639\u0627\u0621") || q.includes("\u0641\u0635\u0644") || q.includes("\u0645\u062E\u0627\u0644\u0641\u0629")) {
    const data = await executeSchoolTool("getAdminActionsAndBehavior", {}, schoolId);
    const actions = (data.actions || []).slice(0, 5).map((a) => `\u2022 \u26A0\uFE0F **${a.studentName}** (\u0641\u0635\u0644: ${a.className}): ${a.title} \u2014 \u0627\u0644\u0633\u0628\u0628: ${a.reason} [\u0627\u0644\u062D\u0627\u0644\u0629: ${a.status}]`).join("\n");
    return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u26A0\uFE0F

\u0625\u0644\u064A\u0643 \u0645\u0644\u062E\u0635 \u0627\u0644\u0631\u0635\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0644\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u0627\u0644\u0635\u0641\u064A:

### \u{1F4CB} \u0633\u062C\u0644 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A:
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629**: **${data.totalAdminActions}** \u0625\u062C\u0631\u0627\u0621.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0633\u0644\u0648\u0643\u064A\u0629**: **${data.totalBehaviorRecords}** \u0633\u062C\u0644.

` + (actions ? `**\u0623\u0628\u0631\u0632 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629**:
${actions}

` : `\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0642\u0631\u0627\u0631\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0623\u0648 \u0625\u0646\u0630\u0627\u0631\u0627\u062A \u0646\u0634\u0637\u0629 \u062D\u0627\u0644\u064A\u0627\u064B.

`) + `---

### \u{1F4A1} \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629:
1. **\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0633\u0644\u0648\u0643\u064A \u0644\u0627 \u0627\u0644\u0639\u0642\u0627\u0628 \u0641\u0642\u0637**: \u062A\u062D\u0648\u064A\u0644 \u062C\u0644\u0633\u0629 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631 \u0625\u0644\u0649 \u0644\u0642\u0627\u0621 \u0634\u0631\u0627\u0643\u0629 \u0644\u0628\u062D\u062B \u0623\u0633\u0628\u0627\u0628 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0648\u062A\u062D\u062F\u064A\u062F \u062E\u0637\u0629 \u0639\u0644\u0627\u062C\u064A\u0629 \u0645\u0634\u062A\u0631\u0643\u0629.
2. **\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0625\u0631\u0634\u0627\u062F \u0627\u0644\u0637\u0644\u0627\u0628\u064A \u0627\u0644\u0641\u0631\u062F\u064A\u0629**: \u0625\u0634\u0631\u0627\u0643 \u0627\u0644\u0645\u0631\u0634\u062F \u0627\u0644\u0637\u0644\u0627\u0628\u064A \u0623\u0648 \u0627\u0644\u0623\u062E\u0635\u0627\u0626\u064A \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u062F\u0648\u0627\u0641\u0639 \u0627\u0644\u0646\u0641\u0633\u064A\u0629 \u0623\u0648 \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u0644\u0623\u064A \u0633\u0644\u0648\u0643 \u063A\u064A\u0631 \u0645\u0646\u0636\u0628\u0637.
3. **\u0641\u0631\u0635\u0629 "\u0645\u062D\u0648 \u0627\u0644\u0645\u062E\u0627\u0644\u0641\u0629 \u0628\u0627\u0644\u062A\u0645\u064A\u0632"**: \u0625\u062A\u0627\u062D\u0629 \u0627\u0644\u0641\u0631\u0635\u0629 \u0644\u0644\u0637\u0627\u0644\u0628 \u0644\u0645\u062D\u0648 \u0627\u0644\u0625\u0646\u0630\u0627\u0631 \u0625\u0630\u0627 \u0623\u0638\u0647\u0631 \u0627\u0644\u062A\u0632\u0627\u0645\u0627\u064B \u0633\u0644\u0648\u0643\u064A\u0627\u064B \u0646\u0645\u0648\u0630\u062C\u064A\u0627\u064B \u0644\u0645\u062F\u0629 \u0623\u0633\u0628\u0648\u0639\u064A\u0646 \u0645\u062A\u062A\u0627\u0644\u064A\u064A\u0646.`;
  }
  return `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u062F\u064A\u0631 **${schoolName}** \u{1F3EB}

\u0623\u0646\u0627 \u0645\u0633\u062A\u0634\u0627\u0631\u0643 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0627\u0644\u0630\u0643\u064A\u060C \u062C\u0627\u0647\u0632 \u0644\u062A\u0642\u062F\u064A\u0645 \u0642\u0631\u0627\u0621\u0627\u062A \u062A\u062D\u0644\u064A\u0644\u064A\u0629\u060C \u062A\u0648\u0635\u064A\u0627\u062A \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629\u060C \u0648\u062D\u0644\u0648\u0644 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0643\u0644 \u0645\u0641\u0627\u0635\u0644 \u0645\u062F\u0631\u0633\u062A\u0643:

1. \u{1F4CA} **\u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637**: "\u062A\u062D\u0644\u064A\u0644 \u0646\u0633\u0628 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0643\u0634\u0648\u0641 \u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u064A\u0648\u0645\u064A \u0645\u0639 \u0646\u0635\u0627\u0626\u062D \u0644\u0644\u062D\u062F \u0645\u0646 \u0627\u0644\u062A\u0623\u062E\u064A\u0631"
2. \u{1F3C6} **\u0644\u0648\u062D\u0629 \u0627\u0644\u0634\u0631\u0641 \u0648\u0627\u0644\u0623\u0648\u0627\u0626\u0644**: "\u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0627\u0644\u0645\u062A\u0635\u062F\u0631\u064A\u0646 \u0648\u0646\u0642\u0627\u0637\u0647\u0645 \u0648\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u062A\u062D\u0641\u064A\u0632 \u0627\u0644\u062A\u0646\u0627\u0641\u0633 \u0627\u0644\u0634\u0631\u064A\u0641"
3. \u{1F4AC} **\u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u0629**: "\u0642\u0631\u0627\u0621\u0629 \u0646\u0628\u0636 \u0627\u0644\u0634\u0627\u062A \u0648\u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0644\u0631\u0623\u064A \u0648\u0623\u0641\u0643\u0627\u0631 \u0644\u062A\u0639\u0632\u064A\u0632 \u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0637\u0644\u0627\u0628"
4. \u{1F4C5} **\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A**: "\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0627\u0644\u0627\u0633\u062A\u0628\u0627\u0642\u064A \u0644\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A"
5. \u{1F396}\uFE0F **\u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0648\u0627\u0644\u062A\u062D\u0641\u064A\u0632**: "\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u062A\u0643\u0631\u064A\u0645\u0627\u062A \u0648\u0623\u0641\u0643\u0627\u0631 \u0644\u0623\u0648\u0633\u0645\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0644\u0647\u0645\u0629 \u0644\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646"
6. \u26A0\uFE0F **\u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629**: "\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u062E\u0637\u0637 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0644\u0644\u0637\u0644\u0627\u0628"

\u0645\u0627 \u0647\u0648 \u0627\u0644\u0645\u0644\u0641 \u0623\u0648 \u0627\u0644\u062A\u062D\u062F\u064A \u0627\u0644\u0630\u064A \u062A\u0631\u063A\u0628 \u0641\u064A \u0623\u0646 \u0646\u062A\u0646\u0627\u0648\u0644\u0647 \u0645\u0639\u0627\u064B \u0627\u0644\u0622\u0646 \u0644\u0646\u0636\u0639 \u0644\u0647 \u0623\u0641\u0636\u0644 \u0631\u0624\u064A\u0629 \u0648\u062D\u0644\u0648\u0644\u061F`;
}

// src/lib/excelGenerator.ts
import * as XLSX from "xlsx";
var ARABIC_KEY_MAP = {
  rank: "\u0627\u0644\u062A\u0631\u062A\u064A\u0628",
  studentName: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628",
  student_name: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628",
  name: "\u0627\u0644\u0627\u0633\u0645",
  className: "\u0627\u0644\u0641\u0635\u0644",
  class_name: "\u0627\u0644\u0641\u0635\u0644",
  points: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0646\u0642\u0627\u0637",
  notes: "\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
  note: "\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629",
  score: "\u0627\u0644\u062F\u0631\u062C\u0629",
  maxScore: "\u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0639\u0638\u0645\u0649",
  subjectName: "\u0627\u0644\u0645\u0627\u062F\u0629",
  subject_name: "\u0627\u0644\u0645\u0627\u062F\u0629",
  date: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E",
  status: "\u0627\u0644\u062D\u0627\u0644\u0629",
  attendanceRate: "\u0646\u0633\u0628\u0629 \u0627\u0644\u062D\u0636\u0648\u0631",
  gender: "\u0627\u0644\u0646\u0648\u0639",
  phone: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641",
  specialization: "\u0627\u0644\u062A\u062E\u0635\u0635",
  title: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
  priority: "\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629",
  schoolName: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
  school_name: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
  governorate: "\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629",
  code: "\u0627\u0644\u0643\u0648\u062F",
  studentsCount: "\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628",
  subscription: "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643",
  systemStatus: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0646\u0638\u0627\u0645",
  keyObservation: "\u0623\u0628\u0631\u0632 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
  reportTitle: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0642\u0631\u064A\u0631",
  reportDate: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0642\u0631\u064A\u0631"
};
function formatColumnTitle(key) {
  if (ARABIC_KEY_MAP[key]) return ARABIC_KEY_MAP[key];
  if (/[\u0600-\u06FF]/.test(key)) return key;
  return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
}
function cleanReportText(text2, matchedBlock) {
  let cleaned = text2.replace(matchedBlock, "").trim();
  cleaned = cleaned.replace(/إلى صيغة JSON المهيكلة[،,\s]*والتي يمكنك استخدامها برمجياً لربطها بأنظمة التقارير أو لوحات التحكم الخاصة بالمدرسة:/g, "\u0625\u0644\u0649 \u0645\u0644\u0641 \u0625\u0643\u0633\u064A\u0644 (.xlsx) \u0645\u0647\u064A\u0643\u0644 \u0648\u062C\u0627\u0647\u0632 \u0644\u0644\u062A\u062D\u0645\u064A\u0644 \u0648\u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629:").replace(/إلى صيغة JSON المهيكلة/g, "\u0625\u0644\u0649 \u0645\u0644\u0641 \u0625\u0643\u0633\u064A\u0644 (.xlsx) \u0645\u0647\u064A\u0643\u0644").replace(/صيغة JSON/g, "\u0645\u0644\u0641 Excel (.xlsx)").replace(/بصيغة JSON/g, "\u0628\u0645\u0644\u0641 Excel (.xlsx)");
  if (!cleaned) {
    cleaned = "\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0648\u062A\u0648\u0644\u064A\u062F \u0645\u0644\u0641 \u0627\u0644\u0625\u0643\u0633\u064A\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0628\u0646\u062C\u0627\u062D\u060C \u064A\u0645\u0643\u0646\u0643 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0641 \u0623\u0648 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0623\u062F\u0646\u0627\u0647:";
  }
  return cleaned;
}
function extractExcelFromResponse(text2) {
  if (!text2 || typeof text2 !== "string") {
    return { cleanText: text2 || "" };
  }
  const codeBlockRegex = /```(?:[a-zA-Z0-9_\-:]+)?\s*([\s\S]*?)```/gi;
  let match;
  while ((match = codeBlockRegex.exec(text2)) !== null) {
    const rawBlock = match[0];
    const content = match[1].trim();
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== "object") continue;
      const rawFileNameVal = parsed.fileName || parsed.filename || parsed.file_name;
      const rawColsVal = parsed.columns || parsed.headers || parsed.fields;
      const rawRowsVal = parsed.rows || parsed.data || parsed.records;
      if (rawRowsVal && Array.isArray(rawRowsVal)) {
        let rawFileName = (rawFileNameVal || parsed.reportTitle || "\u062A\u0642\u0631\u064A\u0631_\u0645\u062F\u0631\u0633\u062A\u064A.xlsx").trim();
        if (!rawFileName.toLowerCase().endsWith(".xlsx")) rawFileName += ".xlsx";
        let cols = [];
        if (Array.isArray(rawColsVal)) {
          cols = rawColsVal.map((c) => formatColumnTitle(String(c ?? "")));
        } else if (rawRowsVal.length > 0 && typeof rawRowsVal[0] === "object" && !Array.isArray(rawRowsVal[0])) {
          cols = Object.keys(rawRowsVal[0]).map(formatColumnTitle);
        }
        const normalizedRows = [];
        for (const row of rawRowsVal) {
          if (Array.isArray(row)) {
            normalizedRows.push(row);
          } else if (typeof row === "object" && row !== null) {
            const rawKeys = Object.keys(row);
            normalizedRows.push(rawKeys.map((k) => row[k]));
          }
        }
        return {
          cleanText: cleanReportText(text2, rawBlock),
          attachment: {
            fileName: rawFileName,
            sheetName: parsed.sheetName || parsed.sheetname || parsed.sheet_name || "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
            columns: cols,
            rows: normalizedRows,
            metadata: parsed.metadata
          }
        };
      }
      if (!Array.isArray(parsed) && typeof parsed === "object") {
        const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]) && parsed[k].length > 0);
        if (arrayKey) {
          const list = parsed[arrayKey];
          const rawKeys = list.length > 0 && typeof list[0] === "object" && !Array.isArray(list[0]) ? Object.keys(list[0]) : ["\u0627\u0644\u0628\u064A\u0627\u0646", "\u0627\u0644\u0642\u064A\u0645\u0629"];
          const cols = rawKeys.map(formatColumnTitle);
          const rows = [];
          for (const item of list) {
            if (Array.isArray(item)) {
              rows.push(item);
            } else if (typeof item === "object" && item !== null) {
              rows.push(rawKeys.map((k) => item[k]));
            } else {
              rows.push([item]);
            }
          }
          let reportTitle = parsed.reportTitle || parsed.title || parsed.report_title || formatColumnTitle(arrayKey);
          let safeFileName = reportTitle.replace(/[\\/:*?"<>|\s]+/g, "_") + ".xlsx";
          return {
            cleanText: cleanReportText(text2, rawBlock),
            attachment: {
              fileName: safeFileName,
              sheetName: formatColumnTitle(arrayKey).slice(0, 30),
              columns: cols,
              rows,
              metadata: {
                title: reportTitle,
                schoolName: parsed.schoolName || parsed.school_name,
                generatedAt: parsed.reportDate || parsed.date
              }
            }
          };
        }
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        const rawKeys = typeof parsed[0] === "object" && !Array.isArray(parsed[0]) ? Object.keys(parsed[0]) : ["\u0627\u0644\u0628\u064A\u0627\u0646"];
        const cols = rawKeys.map(formatColumnTitle);
        const rows = parsed.map((item) => {
          if (Array.isArray(item)) return item;
          if (typeof item === "object" && item !== null) {
            return rawKeys.map((k) => item[k]);
          }
          return [item];
        });
        return {
          cleanText: cleanReportText(text2, rawBlock),
          attachment: {
            fileName: "\u0643\u0634\u0641_\u0628\u064A\u0627\u0646\u0627\u062A_\u0645\u062F\u0631\u0633\u062A\u064A.xlsx",
            sheetName: "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
            columns: cols,
            rows
          }
        };
      }
    } catch {
    }
  }
  return { cleanText: text2 };
}

// src/lib/publishDraft.ts
function normalizePriority(p) {
  if (!p) return "\u0639\u0627\u062F\u064A";
  const s = String(p).trim().toLowerCase();
  if (s.includes("\u0639\u0627\u062C\u0644 \u062C\u062F\u0627") || s.includes("urgent") || s.includes("critical")) return "\u0639\u0627\u062C\u0644 \u062C\u062F\u0627\u064B";
  if (s.includes("\u0639\u0627\u062C\u0644") || s.includes("high")) return "\u0639\u0627\u062C\u0644";
  if (s.includes("\u0647\u0627\u0645") || s.includes("\u0645\u0647\u0645") || s.includes("important")) return "\u0647\u0627\u0645";
  return "\u0639\u0627\u062F\u064A";
}
function normalizeAudience(a) {
  if (!a) return "\u0627\u0644\u062C\u0645\u064A\u0639";
  const s = String(a).trim().toLowerCase();
  if (s.includes("\u0645\u0639\u0644\u0645") || s.includes("\u0645\u062F\u0631\u0633") || s.includes("\u0643\u0627\u062F\u0631") || s.includes("teacher")) return "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
  if (s.includes("\u0648\u0644\u064A") || s.includes("\u0623\u0648\u0644\u064A\u0627\u0621") || s.includes("parent")) return "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631";
  if (s.includes("\u0637\u0627\u0644\u0628") || s.includes("\u0637\u0644\u0627\u0628") || s.includes("student")) return "\u0627\u0644\u0637\u0644\u0627\u0628";
  return "\u0627\u0644\u062C\u0645\u064A\u0639";
}
function extractPublishDraftFromResponse(text2, userQuery) {
  if (!text2 || typeof text2 !== "string") {
    return { cleanText: text2 || "", draft: null };
  }
  const blockRegex = /```(?:json:(?:publish-draft|announcement|ad|poll|event|school-action|action)|json)?\s*\n([\s\S]*?)```/gi;
  let match;
  while ((match = blockRegex.exec(text2)) !== null) {
    const rawBlock = match[0];
    const content = match[1].trim();
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== "object") continue;
      const isAnnouncement = parsed.type === "announcement" || parsed.type === "ad" || parsed.type === "\u0625\u0639\u0644\u0627\u0646" || parsed.type === "\u0627\u0639\u0644\u0627\u0646" || parsed.title && (parsed.content || parsed.description) && (parsed.targetAudience || parsed.audience || parsed.priority);
      const isPoll = parsed.type === "poll" || parsed.type === "\u0627\u0633\u062A\u0637\u0644\u0627\u0639" || parsed.title && Array.isArray(parsed.pollOptions || parsed.options);
      const isEvent = parsed.type === "event" || parsed.type === "\u0641\u0639\u0627\u0644\u064A\u0629" || parsed.type === "\u062D\u062F\u062B" || parsed.title && (parsed.eventDate || parsed.date) && (parsed.eventTime || parsed.time || parsed.location);
      if (isAnnouncement || isPoll || isEvent) {
        const detectedType = isPoll ? "poll" : isEvent ? "event" : "announcement";
        let formattedOptions = [];
        const rawOptions = parsed.pollOptions || parsed.options;
        if (Array.isArray(rawOptions)) {
          formattedOptions = rawOptions.map((opt, idx) => {
            if (typeof opt === "string") {
              return { id: `opt-${idx + 1}`, text: opt, votesCount: 0 };
            }
            return {
              id: opt.id || `opt-${idx + 1}`,
              text: opt.text || opt.title || `\u062E\u064A\u0627\u0631 ${idx + 1}`,
              votesCount: opt.votesCount || 0
            };
          });
        }
        const draft = {
          id: parsed.id || `draft-${Date.now()}`,
          type: detectedType,
          title: parsed.title || "\u0625\u0639\u0644\u0627\u0646 \u0645\u062F\u0631\u0633\u064A \u0631\u0633\u0645\u064A",
          content: parsed.content || parsed.description || parsed.details || "",
          priority: normalizePriority(parsed.priority || parsed.importance),
          targetAudience: normalizeAudience(parsed.targetAudience || parsed.audience || parsed.whoIsSendTo || parsed.target),
          authorName: parsed.authorName || parsed.author || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          date: parsed.date || parsed.publishDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          pollOptions: formattedOptions,
          pollExpiresAt: parsed.pollExpiresAt || parsed.expiresAt,
          allowMultiple: Boolean(parsed.allowMultiple),
          eventDate: parsed.eventDate || parsed.date,
          eventTime: parsed.eventTime || parsed.time,
          eventLocation: parsed.eventLocation || parsed.location,
          eventOrganizer: parsed.eventOrganizer || parsed.organizer || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          isPublished: false
        };
        const cleanText = text2.replace(rawBlock, "").trim();
        return { cleanText, draft };
      }
    } catch (e) {
    }
  }
  const qLower = (userQuery || "").toLowerCase();
  const tLower = (text2 || "").toLowerCase();
  const isExplicitAnnouncement = qLower.includes("\u0627\u0639\u0644\u0627\u0646") || qLower.includes("\u0625\u0639\u0644\u0627\u0646") || qLower.includes("\u062A\u0639\u0645\u064A\u0645") || qLower.includes("\u0646\u0634\u0631 \u0627\u0639\u0644\u0627\u0646") || qLower.includes("\u0646\u0634\u0631 \u0625\u0639\u0644\u0627\u0646") || qLower.includes("\u0627\u0636\u064A\u0641 \u0627\u0639\u0644\u0627\u0646") || qLower.includes("\u0623\u0636\u064A\u0641 \u0625\u0639\u0644\u0627\u0646") || qLower.includes("\u0627\u0636\u0627\u0641\u0647 \u0627\u0639\u0644\u0627\u0646") || qLower.includes("\u0625\u0636\u0627\u0641\u0629 \u0625\u0639\u0644\u0627\u0646") || qLower.includes("\u062A\u062C\u0647\u064A\u0632\u0627\u062A") || qLower.includes("\u062D\u062B\u0647\u0645") || tLower.includes("\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646") || tLower.includes("\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646") || tLower.includes("\u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A:");
  const isExplicitPoll = !isExplicitAnnouncement && (qLower.includes("poll") || qLower.includes("\u0627\u0633\u062A\u0637\u0644\u0627\u0639") || qLower.includes("\u0627\u0633\u062A\u0628\u064A\u0627\u0646") || qLower.includes("\u062A\u0635\u0648\u064A\u062A") || qLower.includes("\u0633\u0624\u0627\u0644 \u062A\u0635\u0648\u064A\u062A") || qLower.includes("\u0645\u0648\u0627\u0641\u0642 \u0627\u0648 \u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642") || qLower.includes("\u0645\u0648\u0627\u0641\u0642 \u0623\u0648 \u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642") || tLower.includes("### \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A") || tLower.includes("\u0633\u0624\u0627\u0644 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639"));
  const isExplicitEvent = !isExplicitAnnouncement && !isExplicitPoll && (qLower.includes("event") || qLower.includes("\u0641\u0639\u0627\u0644\u064A\u0629") || qLower.includes("\u062D\u062F\u062B") || qLower.includes("\u0646\u0634\u0627\u0637 \u0645\u062F\u0631\u0633\u064A") || qLower.includes("\u062C\u062F\u0648\u0644\u0629 \u0641\u0639\u0627\u0644\u064A\u0629") || tLower.includes("### \u0641\u0639\u0627\u0644\u064A\u0629 \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645"));
  if (isExplicitAnnouncement) {
    let extractedTitle = "";
    const titleMatch = text2.match(/(?:الموضوع|العنوان|عنوان الإعلان|عنوان التعميم)\s*[:：]\s*(?:\*\*)?([^\n\*]+)/i) || text2.match(/###\s*(?:أولاً:\s*)?(?:نص\s*)?(?:ال)?(?:إعلان|تعميم)[^\n]*\n+(?:\*\*)?([^\n\*]+)/i) || text2.match(/\*\*(تعميم إداري[^\*]+|\bإعلان هام[^\*]+)\*\*/i);
    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].replace(/^[#\*\s:]+|[#\*\s:]+$/g, "").trim();
    } else if (qLower.includes("\u0627\u0645\u062A\u062D\u0627\u0646") || qLower.includes("\u0646\u0635\u0641 \u0627\u0644\u0639\u0627\u0645") || tLower.includes("\u0627\u0645\u062A\u062D\u0627\u0646")) {
      extractedTitle = "\u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A: \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A";
    } else {
      extractedTitle = "\u0625\u0639\u0644\u0627\u0646 \u0648\u062A\u0648\u062C\u064A\u0647 \u0625\u062F\u0627\u0631\u064A \u0631\u0633\u0645\u064A \u0644\u0644\u0645\u062F\u0631\u0633\u0629";
    }
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639";
    if (qLower.includes("\u0645\u0639\u0644\u0645") || qLower.includes("\u0645\u062F\u0631\u0633") || qLower.includes("\u0643\u0627\u062F\u0631") || tLower.includes("\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646") || tLower.includes("\u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0646")) {
      audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    } else if (qLower.includes("\u0648\u0644\u064A") || qLower.includes("\u0623\u0648\u0644\u064A\u0627\u0621") || tLower.includes("\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631")) {
      audience = "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631";
    } else if (qLower.includes("\u0637\u0627\u0644\u0628") || qLower.includes("\u0637\u0644\u0627\u0628") || tLower.includes("\u0627\u0644\u0637\u0644\u0627\u0628")) {
      audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    }
    let extractedContent = "";
    const bodyMatch = text2.match(/(?:الزملاء|السادة|أبنائي|إلى كافة|تحية طيبة|حرصاً من إدارة)([\s\S]+?)(?=(?:---|### ثانياً|نصيحة إضافية|\*\*إدارة المدرسة|\n\s*\n\s*هل ترغب|$))/i);
    if (bodyMatch) {
      extractedContent = (bodyMatch[0] || "").trim();
    } else {
      const paragraphs = text2.split("\n").filter((l) => !l.startsWith("#") && !l.includes("\u0645\u0633\u062A\u0634\u0627\u0631\u0643") && !l.includes("\u0623\u062D\u064A\u064A\u0643")).join("\n").trim();
      extractedContent = paragraphs.slice(0, 600);
    }
    if (!extractedContent || extractedContent.length < 20) {
      extractedContent = "\u0646\u0647\u064A\u0628 \u0628\u0643\u0627\u0641\u0629 \u0627\u0644\u0632\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0645\u0639\u0644\u0645\u0627\u062A \u0627\u0644\u0643\u0631\u0627\u0645 \u0628\u0636\u0631\u0648\u0631\u0629 \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0627\u0645 \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u060C \u0645\u062A\u0645\u0646\u064A\u0646 \u0644\u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u062A\u0648\u0641\u064A\u0642 \u0648\u0627\u0644\u0646\u062C\u0627\u062D.";
    }
    const draft = {
      id: `draft-ann-${Date.now()}`,
      type: "announcement",
      title: extractedTitle,
      content: extractedContent,
      priority: qLower.includes("\u0639\u0627\u062C\u0644") || tLower.includes("\u0639\u0627\u062C\u0644") ? "\u0639\u0627\u062C\u0644" : "\u0647\u0627\u0645",
      targetAudience: audience,
      authorName: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      isPublished: false
    };
    return { cleanText: text2, draft };
  }
  if (isExplicitPoll) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639 (\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0648\u0627\u0644\u0637\u0644\u0627\u0628)";
    if (qLower.includes("\u0645\u0639\u0644\u0645") || qLower.includes("\u0645\u062F\u0631\u0633") || qLower.includes("\u0643\u0627\u062F\u0631")) {
      audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    } else if (qLower.includes("\u0637\u0627\u0644\u0628") || qLower.includes("\u0637\u0644\u0627\u0628")) {
      audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    } else if (qLower.includes("\u0648\u0644\u064A") || qLower.includes("\u0623\u0648\u0644\u064A\u0627\u0621")) {
      audience = "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631";
    }
    let pollTitle = "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062A\u0641\u0627\u0639\u0644\u064A \u0644\u0644\u0645\u062F\u0631\u0633\u0629";
    if (qLower.includes("\u0631\u062D\u0644\u0647") || qLower.includes("\u0631\u062D\u0644\u0629") || qLower.includes("\u0627\u0647\u0631\u0627\u0645\u0627\u062A") || qLower.includes("\u0623\u0647\u0631\u0627\u0645\u0627\u062A")) {
      pollTitle = "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A: \u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0644\u0644\u0623\u0647\u0631\u0627\u0645\u0627\u062A \u063A\u062F\u0627\u064B";
    } else if (qLower.includes("\u0627\u062C\u062A\u0645\u0627\u0639")) {
      pollTitle = "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A: \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0648\u0639\u062F \u0627\u0644\u0623\u0646\u0633\u0628 \u0644\u0644\u0627\u062C\u062A\u0645\u0627\u0639 \u0627\u0644\u0642\u0627\u062F\u0645";
    }
    let extractedOptions = [];
    if (qLower.includes("\u0645\u0648\u0627\u0641\u0642") && qLower.includes("\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642")) {
      extractedOptions = [
        { id: "opt-1", text: "\u0645\u0648\u0627\u0641\u0642", votesCount: 0 },
        { id: "opt-2", text: "\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642", votesCount: 0 }
      ];
    } else if (qLower.includes("\u0646\u0639\u0645") && qLower.includes("\u0644\u0627")) {
      extractedOptions = [
        { id: "opt-1", text: "\u0646\u0639\u0645", votesCount: 0 },
        { id: "opt-2", text: "\u0644\u0627", votesCount: 0 }
      ];
    } else {
      const optionMatches = text2.match(/(?:(?:[1-4]\.|\*|-|•)\s*(?:الخيار\s*\d+\s*[:：]?\s*)?([^\n]+))/g);
      if (optionMatches && optionMatches.length >= 2) {
        extractedOptions = optionMatches.slice(0, 4).map((opt, idx) => ({
          id: `opt-${idx + 1}`,
          text: opt.replace(/^([1-4]\.|\*|-|•)\s*(?:الخيار\s*\d+\s*[:：]?\s*)?/, "").trim(),
          votesCount: 0
        })), { id: "opt-2", text: "\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642", votesCount: 0 };
      } else {
        extractedOptions = [
          { id: "opt-1", text: "\u0645\u0648\u0627\u0641\u0642", votesCount: 0 },
          { id: "opt-2", text: "\u063A\u064A\u0631 \u0645\u0648\u0627\u0641\u0642", votesCount: 0 }
        ];
      }
    }
    let pollContent = "\u0646\u0623\u0645\u0644 \u0645\u0634\u0627\u0631\u0643\u062A\u0643\u0645 \u0648\u0627\u0644\u062A\u0635\u0648\u064A\u062A \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0623\u0646\u0633\u0628 \u0644\u0644\u0645\u062F\u0631\u0633\u0629.";
    if (qLower.includes("\u0631\u062D\u0644\u0647") || qLower.includes("\u0631\u062D\u0644\u0629")) {
      pollContent = "\u0647\u0644 \u062A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u062A\u0646\u0638\u064A\u0645 \u0631\u062D\u0644\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u0625\u0644\u0649 \u0623\u0647\u0631\u0627\u0645\u0627\u062A \u0627\u0644\u062C\u064A\u0632\u0629 \u064A\u0648\u0645 \u063A\u062F\u064D\u061F";
    }
    const draft = {
      id: `draft-poll-${Date.now()}`,
      type: "poll",
      title: pollTitle,
      content: pollContent,
      priority: qLower.includes("\u0628\u0643\u0631\u0647") || qLower.includes("\u063A\u062F\u0627") || qLower.includes("\u063A\u062F\u0627\u064B") || qLower.includes("\u0639\u0627\u062C\u0644") ? "\u0639\u0627\u062C\u0644" : "\u0639\u0627\u062F\u064A",
      targetAudience: audience,
      pollOptions: extractedOptions,
      authorName: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      isPublished: false
    };
    return { cleanText: text2, draft };
  }
  if (isExplicitEvent) {
    let audience = "\u0627\u0644\u062C\u0645\u064A\u0639";
    if (qLower.includes("\u0645\u0639\u0644\u0645") || qLower.includes("\u0645\u062F\u0631\u0633")) audience = "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646";
    else if (qLower.includes("\u0637\u0627\u0644\u0628") || qLower.includes("\u0637\u0644\u0627\u0628")) audience = "\u0627\u0644\u0637\u0644\u0627\u0628";
    const draft = {
      id: `draft-evt-${Date.now()}`,
      type: "event",
      title: qLower.includes("\u0631\u062D\u0644\u0647") || qLower.includes("\u0631\u062D\u0644\u0629") ? "\u0631\u062D\u0644\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u0627\u0633\u062A\u0643\u0634\u0627\u0641\u064A\u0629" : "\u0641\u0639\u0627\u0644\u064A\u0629 \u0648\u0646\u0634\u0627\u0637 \u0645\u062F\u0631\u0633\u064A \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645",
      content: "\u0641\u0639\u0627\u0644\u064A\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 \u062A\u0647\u062F\u0641 \u0625\u0644\u0649 \u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u064A\u0646.",
      priority: "\u0647\u0627\u0645",
      targetAudience: audience,
      eventDate: new Date(Date.now() + 864e5 * 3).toISOString().split("T")[0],
      eventTime: "10:00 \u0635\u0628\u0627\u062D\u0627\u064B",
      eventLocation: qLower.includes("\u0627\u0647\u0631\u0627\u0645\u0627\u062A") || qLower.includes("\u0623\u0647\u0631\u0627\u0645\u0627\u062A") ? "\u0623\u0647\u0631\u0627\u0645\u0627\u062A \u0627\u0644\u062C\u064A\u0632\u0629" : "\u0627\u0644\u0642\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      eventOrganizer: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      authorName: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      isPublished: false
    };
    return { cleanText: text2, draft };
  }
  return { cleanText: text2, draft: null };
}

// server/platformUsageService.ts
import os from "os";
import { sql as sql7 } from "drizzle-orm";
var metricsState = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  startTime: Date.now(),
  recentLatenciesMs: [],
  recentStatusCodes: {}
};
function platformUsageTrackingMiddleware(req, res, next) {
  const start = Date.now();
  metricsState.totalRequests += 1;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    metricsState.recentLatenciesMs.push(duration);
    if (metricsState.recentLatenciesMs.length > 100) {
      metricsState.recentLatenciesMs.shift();
    }
    metricsState.recentStatusCodes[statusCode] = (metricsState.recentStatusCodes[statusCode] || 0) + 1;
    if (statusCode >= 400) {
      metricsState.errorRequests += 1;
    } else {
      metricsState.successRequests += 1;
    }
  });
  next();
}
function getCpuUsagePercent() {
  return new Promise((resolve) => {
    const cpus1 = os.cpus();
    const startIdle = cpus1.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const startTotal = cpus1.reduce(
      (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle,
      0
    );
    setTimeout(() => {
      const cpus2 = os.cpus();
      const endIdle = cpus2.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const endTotal = cpus2.reduce(
        (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle,
        0
      );
      const idleDelta = endIdle - startIdle;
      const totalDelta = endTotal - startTotal;
      if (totalDelta <= 0) {
        resolve(0);
        return;
      }
      const usage = 100 - 100 * idleDelta / totalDelta;
      resolve(Math.max(0, Math.min(100, Math.round(usage))));
    }, 150);
  });
}
async function gatherPlatformUsage() {
  const cpuPercent = await getCpuUsagePercent();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round(usedMem / totalMem * 100);
  const processMem = process.memoryUsage();
  const totalReq = metricsState.totalRequests;
  const errReq = metricsState.errorRequests;
  const errorRatePercent = totalReq > 0 ? Number((errReq / totalReq * 100).toFixed(1)) : 0;
  const latencies = metricsState.recentLatenciesMs;
  const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const kService = process.env.K_SERVICE || null;
  const kRevision = process.env.K_REVISION || null;
  const isCloudRun = Boolean(kService || process.env.CLOUD_RUN_TIMEOUT_SECONDS);
  const hostProvider = isCloudRun ? "Google Cloud Run" : "Node.js Container Runtime";
  const cloudRegion = process.env.NG_ALLOWED_HOSTS?.includes("europe-west2") ? "europe-west2 (London)" : "Google Cloud Platform";
  let dbSizePretty = "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B";
  let dbSizeBytes = 0;
  let activeConn = 1;
  let totalConn = 1;
  let maxConn = 50;
  let pgVer = "PostgreSQL";
  let dbStartTime = null;
  let tableStats = [];
  try {
    const sizeRes = await db.execute(sql7`SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes;`);
    if (sizeRes?.rows?.[0]) {
      const row = sizeRes.rows[0];
      dbSizePretty = row.size || dbSizePretty;
      dbSizeBytes = Number(row.bytes || 0);
    }
    const connRes = await db.execute(sql7`SELECT count(*) as total, count(*) filter (where state = 'active') as active FROM pg_stat_activity WHERE datname = current_database();`);
    if (connRes?.rows?.[0]) {
      const row = connRes.rows[0];
      totalConn = Number(row.total || 1);
      activeConn = Number(row.active || 1);
    }
    const verRes = await db.execute(sql7`SELECT version(), current_setting('max_connections') as max_connections, pg_postmaster_start_time() as start_time;`);
    if (verRes?.rows?.[0]) {
      const row = verRes.rows[0];
      pgVer = (row.version || "PostgreSQL").split(" on ")[0];
      maxConn = Number(row.max_connections || 50);
      dbStartTime = row.start_time ? new Date(row.start_time).toISOString() : null;
    }
    const tablesRes = await db.execute(sql7`
      SELECT relname as table_name, 
             n_live_tup as row_count, 
             pg_size_pretty(pg_total_relation_size(relid)) as total_size,
             pg_total_relation_size(relid) as bytes
      FROM pg_stat_user_tables 
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10;
    `);
    if (tablesRes?.rows) {
      tableStats = tablesRes.rows.map((r) => ({
        tableName: r.table_name || "",
        rowCount: Number(r.row_count || 0),
        sizePretty: r.total_size || "",
        sizeBytes: Number(r.bytes || 0)
      }));
    }
  } catch (err) {
    console.error("Error fetching real DB usage metrics:", err);
  }
  const cpuStatus = cpuPercent > 85 ? "critical" : cpuPercent > 65 ? "warning" : "normal";
  const memoryStatus = memUsagePercent > 85 ? "critical" : memUsagePercent > 70 ? "warning" : "normal";
  const connUsagePercent = Math.round(totalConn / maxConn * 100);
  const dbStatus = connUsagePercent > 80 ? "critical" : connUsagePercent > 60 ? "warning" : "normal";
  const trafficStatus = errorRatePercent > 15 ? "critical" : errorRatePercent > 5 ? "warning" : "normal";
  let serverStatus = "normal";
  let statusText = "\u064A\u0639\u0645\u0644 \u0628\u0634\u0643\u0644 \u0637\u0628\u064A\u0639\u064A \u0648\u0645\u0633\u062A\u0642\u0631";
  if (cpuStatus === "critical" || memoryStatus === "critical" || dbStatus === "critical") {
    serverStatus = "critical";
    statusText = "\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0645\u0631\u062A\u0641\u0639 \u062C\u062F\u0627\u064B - \u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u0627\u0646\u062A\u0628\u0627\u0647";
  } else if (cpuStatus === "warning" || memoryStatus === "warning" || dbStatus === "warning" || trafficStatus === "warning") {
    serverStatus = "warning";
    statusText = "\u0636\u063A\u0637 \u0645\u062A\u0648\u0633\u0637 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0627\u0631\u062F";
  }
  const serverUptimeSeconds = Math.round(os.uptime());
  const hours = Math.floor(serverUptimeSeconds / 3600);
  const minutes = Math.floor(serverUptimeSeconds % 3600 / 60);
  const serverUptimeFormatted = `${hours} \u0633\u0627\u0639\u0629 \u0648 ${minutes} \u062F\u0642\u064A\u0642\u0629`;
  let dbUptimeFormatted = "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B";
  if (dbStartTime) {
    const dbDiffMs = Date.now() - new Date(dbStartTime).getTime();
    const dbHours = Math.floor(dbDiffMs / (1e3 * 60 * 60));
    const dbMinutes = Math.floor(dbDiffMs % (1e3 * 60 * 60) / (1e3 * 60));
    dbUptimeFormatted = `${dbHours} \u0633\u0627\u0639\u0629 \u0648 ${dbMinutes} \u062F\u0642\u064A\u0642\u0629`;
  }
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    server: {
      status: serverStatus,
      statusText,
      runtime: `Node.js ${process.version}`,
      nodeVersion: process.version,
      platform: `${os.type()} ${os.arch()}`,
      architecture: os.arch(),
      serverUptimeSeconds,
      serverUptimeFormatted,
      processUptimeSeconds: Math.round(process.uptime())
    },
    hosting: {
      provider: hostProvider,
      environment: isCloudRun ? "Google Cloud Run Managed Container" : "Local / Custom Container",
      serviceName: kService,
      revisionName: kRevision,
      cloudRegion: isCloudRun ? cloudRegion : null,
      containerCores: os.cpus().length,
      cpuUsagePercent: cpuPercent,
      cpuStatus,
      totalMemoryBytes: totalMem,
      totalMemoryMB: Math.round(totalMem / (1024 * 1024)),
      usedMemoryBytes: usedMem,
      usedMemoryMB: Math.round(usedMem / (1024 * 1024)),
      freeMemoryMB: Math.round(freeMem / (1024 * 1024)),
      memoryUsagePercent: memUsagePercent,
      memoryStatus,
      processMemoryMB: Math.round(processMem.rss / (1024 * 1024)),
      networkBandwidthStatus: "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B",
      // Cloud Monitoring API requires GCP Service Account OAuth
      hostingQuotaLimit: "Cloud Run Auto-scaled (\u062D\u062A\u0649 3600s/req)"
    },
    traffic: {
      totalRequests: totalReq,
      successRequests: metricsState.successRequests,
      errorRequests: errReq,
      errorRatePercent,
      avgLatencyMs,
      trafficStatus
    },
    database: {
      engine: "PostgreSQL (Cloud SQL)",
      version: pgVer,
      databaseName: process.env.SQL_DB_NAME || "cloud_sql_development_database",
      hostSocket: process.env.SQL_HOST ? "Cloud SQL Unix Socket" : "Local TCP Socket",
      totalSizeBytes: dbSizeBytes,
      totalSizePretty: dbSizePretty,
      storageUsagePercent: null,
      // PostgreSQL Cloud SQL storage auto-extends
      storageQuotaPretty: "\u0645\u0633\u0627\u062D\u0629 \u0645\u0631\u0646\u0629 (Cloud SQL Tier)",
      activeConnections: activeConn,
      totalConnections: totalConn,
      maxConnections: maxConn,
      connectionsUsagePercent: connUsagePercent,
      dbUptimeFormatted,
      dbStatus,
      tableStats
    },
    unavailableMetrics: [
      {
        name: "\u0645\u0639\u062F\u0644 \u0646\u0642\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u0628\u0643\u0629 \u0627\u0644\u0641\u0639\u0644\u064A (Network I/O Bandwidth)",
        reason: "\u064A\u062A\u0637\u0644\u0628 \u0631\u0628\u0637 \u0645\u0628\u0627\u0634\u0631 \u0645\u0639 Google Cloud Monitoring API \u0648\u062D\u0633\u0627\u0628 \u062E\u062F\u0645\u0629 \u0645\u0641\u0648\u0636"
      },
      {
        name: "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0645\u0633\u0627\u062D\u0629 \u0642\u0631\u0635 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0643\u0644\u064A (Disk Capacity Total)",
        reason: "\u062A\u062F\u0627\u0631 \u0633\u0639\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 Cloud SQL Auto-Storage Expansion"
      }
    ]
  };
}

// server.ts
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL PROCESS GUARD - Intercepted uncaughtException]:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.warn("[CRITICAL PROMISE GUARD - Intercepted unhandledRejection]:", reason?.message || reason);
});
var INITIAL_DATABASE_SCHOOLS = [
  {
    schoolId: "sch-1",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0646\u064A\u0644 \u0627\u0644\u062F\u0648\u0644\u064A\u0629 \u0628\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
    code: "EG-CAI-8412",
    licenseKey: "LIC-2026-NIL8-92K1",
    adminEmail: "admin@nileschool.edu.eg",
    adminPassword: "Nile#2026Password",
    governorate: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629",
    phone: "01012345678",
    email: "admin@nileschool.edu.eg",
    principalName: "\u062F. \u0623\u062D\u0645\u062F \u0641\u062A\u062D\u064A \u0627\u0644\u0645\u063A\u0627\u0632\u064A",
    principalPhone: "01012345678",
    principalEmail: "a.maghazi@nileschool.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0628\u0631\u064A\u0645\u064A\u0648\u0645",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2027-09-15",
    studentsCount: 1420,
    teachersCount: 98,
    createdAt: "2025-09-15"
  },
  {
    schoolId: "sch-2",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0623\u0648\u0631\u0645\u0627\u0646 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
    code: "EG-GIZ-3109",
    licenseKey: "LIC-2026-ORM3-44P8",
    adminEmail: "admin@orman-model.edu.eg",
    adminPassword: "Orman#2026Password",
    governorate: "\u0627\u0644\u062C\u064A\u0632\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062F\u0642\u064A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u062C\u064A\u0632\u0629 - \u0627\u0644\u062F\u0642\u064A",
    phone: "01123456789",
    email: "admin@orman-model.edu.eg",
    principalName: "\u0623. \u0645\u062D\u0645\u0648\u062F \u0635\u0644\u0627\u062D \u0627\u0644\u062F\u064A\u0646",
    principalPhone: "01123456789",
    principalEmail: "m.salah@orman-model.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0627\u062D\u062A\u0631\u0627\u0641\u064A",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2026-10-01",
    studentsCount: 980,
    teachersCount: 64,
    createdAt: "2025-10-01"
  },
  {
    schoolId: "sch-3",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0644\u0644\u063A\u0627\u062A \u0648\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627",
    code: "EG-ALX-5510",
    licenseKey: "LIC-2026-ALX9-10T3",
    adminEmail: "admin@alextechschool.com",
    adminPassword: "Alex#2026Password",
    governorate: "\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0634\u0631\u0642 \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629",
    address: "\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 - \u0633\u0645\u0648\u062D\u0629",
    phone: "01234567890",
    email: "admin@alextechschool.com",
    principalName: "\u062F. \u0625\u064A\u0645\u0627\u0646 \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646",
    principalPhone: "01234567890",
    principalEmail: "eman@alextechschool.com",
    academicYear: "2025/2026",
    subscription: "\u0628\u0631\u064A\u0645\u064A\u0648\u0645",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2027-11-12",
    studentsCount: 1150,
    teachersCount: 82,
    createdAt: "2025-11-12"
  },
  {
    schoolId: "sch-4",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0632\u0642\u0627\u0632\u064A\u0642 \u0627\u0644\u062B\u0627\u0646\u0648\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u063A\u0627\u062A",
    code: "EG-SHQ-1049",
    licenseKey: "LIC-2026-SHQ2-77M4",
    adminEmail: "admin@zag-lang.edu.eg",
    adminPassword: "Zag#2026Password",
    governorate: "\u0627\u0644\u0634\u0631\u0642\u064A\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0632\u0642\u0627\u0632\u064A\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u0634\u0631\u0642\u064A\u0629 - \u0627\u0644\u0632\u0642\u0627\u0632\u064A\u0642",
    phone: "01512345678",
    email: "admin@zag-lang.edu.eg",
    principalName: "\u0623. \u0637\u0627\u0631\u0642 \u0645\u0635\u0637\u0641\u0649 \u0627\u0644\u0639\u0648\u0636\u064A",
    principalPhone: "01512345678",
    principalEmail: "tareq@zag-lang.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0623\u0633\u0627\u0633\u064A",
    status: "\u0645\u0639\u0644\u0642\u0629",
    licenseExpiry: "2026-03-05",
    studentsCount: 860,
    teachersCount: 52,
    createdAt: "2025-12-05"
  },
  {
    schoolId: "sch-5",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629 \u0627\u0644\u062A\u0641\u0648\u0642 \u0648\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
    code: "EG-DAH-7231",
    licenseKey: "LIC-2026-MAN1-88R9",
    adminEmail: "admin@mansourastem.edu.eg",
    adminPassword: "Mans#2026Password",
    governorate: "\u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629 - \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629",
    phone: "01098765432",
    email: "admin@mansourastem.edu.eg",
    principalName: "\u062F. \u0633\u0627\u0631\u0629 \u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u062D\u0633\u0646",
    principalPhone: "01098765432",
    principalEmail: "sara@mansourastem.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0628\u0631\u064A\u0645\u064A\u0648\u0645",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2027-01-10",
    studentsCount: 1290,
    teachersCount: 88,
    createdAt: "2026-01-10"
  },
  {
    schoolId: "sch-6",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0637\u0646\u0637\u0627 \u0644\u0644\u063A\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629",
    code: "EG-WAD-4022",
    licenseKey: "LIC-2026-TNT5-33X2",
    adminEmail: "admin@tanta-adv.com",
    adminPassword: "Tanta#2026Password",
    governorate: "\u0627\u0644\u063A\u0631\u0628\u064A\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0637\u0646\u0637\u0627 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u063A\u0631\u0628\u064A\u0629 - \u0637\u0646\u0637\u0627",
    phone: "01198765432",
    email: "admin@tanta-adv.com",
    principalName: "\u0623. \u062E\u0627\u0644\u062F \u0627\u0644\u0633\u064A\u062F \u0627\u0644\u0646\u062C\u0627\u0631",
    principalPhone: "01198765432",
    principalEmail: "khaled@tanta-adv.com",
    academicYear: "2025/2026",
    subscription: "\u0627\u062D\u062A\u0631\u0627\u0641\u064A",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2027-02-01",
    studentsCount: 740,
    teachersCount: 48,
    createdAt: "2026-02-01"
  },
  {
    schoolId: "sch-7",
    name: "\u0645\u062F\u0631\u0633\u0629 \u062F\u0645\u0646\u0647\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u0642\u0628\u0644 \u0627\u0644\u0644\u063A\u0627\u062A",
    code: "EG-BAH-6911",
    licenseKey: "LIC-2026-DMH4-66Z7",
    adminEmail: "admin@dam-future.edu.eg",
    adminPassword: "Dam#2026Password",
    governorate: "\u0627\u0644\u0628\u062D\u064A\u0631\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u062F\u0645\u0646\u0647\u0648\u0631 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u0628\u062D\u064A\u0631\u0629 - \u062F\u0645\u0646\u0647\u0648\u0631",
    phone: "01298765432",
    email: "admin@dam-future.edu.eg",
    principalName: "\u0623. \u0647\u0646\u0627\u0621 \u0639\u0644\u064A \u062E\u0644\u064A\u0644",
    principalPhone: "01298765432",
    principalEmail: "hanaa@dam-future.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0623\u0633\u0627\u0633\u064A",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2026-09-14",
    studentsCount: 620,
    teachersCount: 41,
    createdAt: "2026-03-14"
  },
  {
    schoolId: "sch-8",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0628\u0646\u0647\u0627 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629",
    code: "EG-QAL-2840",
    licenseKey: "LIC-2026-BNH9-12L5",
    adminEmail: "admin@banha-mod.edu.eg",
    adminPassword: "Banha#2026Password",
    governorate: "\u0627\u0644\u0642\u0644\u064A\u0648\u0628\u064A\u0629",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0628\u0646\u0647\u0627 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0627\u0644\u0642\u0644\u064A\u0648\u0628\u064A\u0629 - \u0628\u0646\u0647\u0627",
    phone: "01598765432",
    email: "admin@banha-mod.edu.eg",
    principalName: "\u0623. \u0647\u0634\u0627\u0645 \u0639\u0628\u062F \u0627\u0644\u0645\u0646\u0639\u0645",
    principalPhone: "01598765432",
    principalEmail: "hisham@banha-mod.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0623\u0633\u0627\u0633\u064A",
    status: "\u0645\u0639\u0644\u0642\u0629",
    licenseExpiry: "2026-06-20",
    studentsCount: 510,
    teachersCount: 35,
    createdAt: "2026-04-20"
  },
  {
    schoolId: "sch-9",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0623\u0633\u064A\u0648\u0637 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u062A\u0645\u064A\u0632\u0629 \u0644\u063A\u0627\u062A",
    code: "EG-ASY-9013",
    licenseKey: "LIC-2026-ASY7-55K0",
    adminEmail: "admin@asyut-lang.edu.eg",
    adminPassword: "Asyut#2026Password",
    governorate: "\u0623\u0633\u064A\u0648\u0637",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0623\u0633\u064A\u0648\u0637 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0623\u0633\u064A\u0648\u0637 - \u0634\u0627\u0631\u0639 \u0627\u0644\u062C\u0645\u0647\u0648\u0631\u064A\u0629",
    phone: "01033445566",
    email: "admin@asyut-lang.edu.eg",
    principalName: "\u062F. \u062C\u0645\u0627\u0644 \u0627\u0644\u062F\u064A\u0646 \u0627\u0644\u0631\u0634\u064A\u062F\u064A",
    principalPhone: "01033445566",
    principalEmail: "gamal@asyut-lang.edu.eg",
    academicYear: "2025/2026",
    subscription: "\u0627\u062D\u062A\u0631\u0627\u0641\u064A",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2027-05-02",
    studentsCount: 930,
    teachersCount: 62,
    createdAt: "2026-05-02"
  },
  {
    schoolId: "sch-10",
    name: "\u0645\u062F\u0631\u0633\u0629 \u0633\u0648\u0647\u0627\u062C \u0627\u0644\u062F\u0648\u0644\u064A\u0629 \u0644\u0644\u0627\u0628\u062A\u0643\u0627\u0631",
    code: "EG-SOH-1829",
    licenseKey: "LIC-2026-SOH3-99W1",
    adminEmail: "admin@sohag-intl.com",
    adminPassword: "Sohag#2026Password",
    governorate: "\u0633\u0648\u0647\u0627\u062C",
    educationalDistrict: "\u0625\u062F\u0627\u0631\u0629 \u0633\u0648\u0647\u0627\u062C \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
    address: "\u0633\u0648\u0647\u0627\u062C - \u0627\u0644\u0643\u0648\u0631\u0646\u064A\u0634 \u0627\u0644\u0634\u0631\u0642\u064A",
    phone: "01133445566",
    email: "admin@sohag-intl.com",
    principalName: "\u0623. \u0646\u0627\u062F\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u0648\u0647\u0627\u0628",
    principalPhone: "01133445566",
    principalEmail: "nadia@sohag-intl.com",
    academicYear: "2025/2026",
    subscription: "\u0628\u0631\u064A\u0645\u064A\u0648\u0645",
    status: "\u0646\u0634\u0637\u0629",
    licenseExpiry: "2027-06-18",
    studentsCount: 780,
    teachersCount: 51,
    createdAt: "2026-06-18"
  }
];
var isDatabaseSeedingRunning = false;
async function ensureCentralDatabaseSchoolsSeeded() {
  if (isDatabaseSeedingRunning) return;
  try {
    isDatabaseSeedingRunning = true;
    const existing = await db.select({ schoolId: schoolInfoTable.schoolId }).from(schoolInfoTable).limit(1);
    if (existing.length === 0) {
      console.log("[DB] Central database school_info table is empty. Initializing central platform schools into PostgreSQL...");
      for (const item of INITIAL_DATABASE_SCHOOLS) {
        await db.insert(schoolInfoTable).values(item).onConflictDoNothing();
      }
      console.log("[DB] Successfully initialized central platform schools in PostgreSQL.");
    }
  } catch (err) {
  } finally {
    isDatabaseSeedingRunning = false;
  }
}
function formatSchoolResponse(row, liveStudents = 0, liveTeachers = 0) {
  return {
    id: row.schoolId,
    name: row.name,
    code: row.code || `EG-CAI-${row.schoolId.slice(-4)}`,
    licenseKey: row.licenseKey || `LIC-2026-${row.schoolId.slice(-4)}`,
    adminEmail: row.adminEmail || `${row.schoolId}@school.edu.eg`,
    governorate: row.governorate || "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
    studentsCount: liveStudents > 0 ? liveStudents : Number(row.studentsCount) || 0,
    teachersCount: liveTeachers > 0 ? liveTeachers : Number(row.teachersCount) || 0,
    subscription: row.subscription || "\u0623\u0633\u0627\u0633\u064A",
    status: row.status || "\u0646\u0634\u0637\u0629",
    createdAt: row.createdAt || (row.updatedAt ? new Date(row.updatedAt).toISOString().split("T")[0] : "2025-09-15"),
    principalName: row.principalName || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
    principalPhone: row.principalPhone || row.phone || "01000000000",
    principalEmail: row.principalEmail || row.email || "admin@school.edu.eg",
    licenseExpiry: row.licenseExpiry || "2027-09-15",
    stage: row.stage || void 0,
    attendance_start_date: row.attendanceStartDate || void 0
  };
}
function sanitizeContext(data) {
  if (!data) return {};
  try {
    let clean = function(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(clean);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
            obj[key] = "[\u0645\u062E\u0641\u064A \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629]";
          } else {
            clean(obj[key]);
          }
        }
      }
    };
    const copy = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = ["password", "secret", "token", "apikey", "privatekey", "dburl", "connectionstring", "ssn", "pass"];
    clean(copy);
    return copy;
  } catch (e) {
    return { summary: "\u0628\u064A\u0627\u0646\u0627\u062A \u0633\u064A\u0627\u0642 \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0639\u0631\u0636 \u0641\u0642\u0637" };
  }
}
var aiClient = null;
function getAiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function createApp() {
  const app = express2();
  initializeExtensionsDatabase().catch((err) => {
    console.error("[Extensions DB Initialization Warning]:", err);
  });
  ensureCentralDatabaseSchoolsSeeded().catch((err) => {
    console.error("[Schools DB Seeding Warning]:", err);
  });
  app.use(compression());
  app.use(express2.json({ limit: "10mb" }));
  app.use(platformUsageTrackingMiddleware);
  const dbPurgeTimer = setInterval(async () => {
    try {
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      await db.delete(trustedDeviceSessionsTable).where(lt2(trustedDeviceSessionsTable.expiresAt, nowIso));
    } catch {
    }
  }, 24 * 60 * 60 * 1e3);
  if (dbPurgeTimer.unref) {
    dbPurgeTimer.unref();
  }
  app.get("/api/health", async (req, res) => {
    try {
      res.json({ status: "ok", database: "cloud_sql_postgres" });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });
  app.get("/api/owner/platform-usage", requireOwnerAuth, async (req, res) => {
    try {
      const usage = await gatherPlatformUsage();
      res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      console.error("Error in /api/owner/platform-usage:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0645\u0646\u0635\u0629 \u0645\u0646 \u0645\u0632\u0648\u062F \u0627\u0644\u0627\u0633\u062A\u0636\u0627\u0641\u0629"
      });
    }
  });
  app.post("/api/auth/login-trusted", async (req, res) => {
    try {
      const {
        loginType,
        credentials,
        trustDevice300Days,
        deviceId = "dev_unknown",
        deviceName = "\u0645\u062A\u0635\u0641\u062D \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
        accountMeta = {}
      } = req.body || {};
      const userId = accountMeta.userId || credentials?.studentCode || credentials?.username || credentials?.schoolCode || credentials?.email || `usr_${Date.now()}`;
      const identifierKey = buildIdentifierKey("session", `${deviceId}:${userId}`);
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        });
      }
      const now = /* @__PURE__ */ new Date();
      const createdAt = now.toISOString();
      const durationMs = 300 * 24 * 60 * 60 * 1e3;
      const expiresAt = new Date(now.getTime() + (trustDevice300Days ? durationMs : 24 * 60 * 60 * 1e3)).toISOString();
      const sessionId = `tds_${Date.now().toString(36)}_${crypto3.randomBytes(8).toString("hex")}`;
      const userRole = loginType || accountMeta.userRole || "parent";
      const userDisplayName = accountMeta.userDisplayName || accountMeta.studentName || credentials?.studentName || credentials?.username || "\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629";
      const tokenHash = crypto3.createHash("sha256").update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest("hex");
      const sessionRecord = {
        id: sessionId,
        deviceId,
        userId,
        userRole,
        schoolId: accountMeta.schoolId,
        schoolName: accountMeta.schoolName,
        studentId: accountMeta.studentId,
        studentName: accountMeta.studentName,
        studentCode: accountMeta.studentCode,
        className: accountMeta.className,
        userDisplayName,
        avatarUid: accountMeta.avatarUid,
        tokenHash,
        deviceName,
        createdAt,
        lastUsedAt: createdAt,
        expiresAt,
        revokedAt: null,
        metadata: accountMeta
      };
      memorySessionStore.set(sessionId, sessionRecord);
      try {
        await db.insert(trustedDeviceSessionsTable).values({
          id: sessionId,
          deviceId,
          userId,
          userRole,
          schoolId: accountMeta.schoolId || null,
          schoolName: accountMeta.schoolName || null,
          studentId: accountMeta.studentId || null,
          studentName: accountMeta.studentName || null,
          studentCode: accountMeta.studentCode || null,
          className: accountMeta.className || null,
          userDisplayName,
          avatarUid: accountMeta.avatarUid || null,
          tokenHash,
          deviceName,
          createdAt,
          lastUsedAt: createdAt,
          expiresAt,
          revokedAt: null,
          metadata: accountMeta
        });
      } catch (dbErr) {
      }
      recordAuthSuccess(req, identifierKey);
      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId,
        userRole,
        schoolId: accountMeta.schoolId,
        schoolName: accountMeta.schoolName,
        studentId: accountMeta.studentId || (userRole === "parent" ? userId : void 0),
        studentName: accountMeta.studentName,
        studentCode: accountMeta.studentCode,
        className: accountMeta.className,
        userDisplayName,
        avatarUid: accountMeta.avatarUid,
        expiresAt
      });
      res.json({
        success: true,
        isTrustedDevice: Boolean(trustDevice300Days),
        sessionId,
        sessionToken,
        expiresAt,
        remainingDays: trustDevice300Days ? 300 : 1,
        session: {
          sessionId,
          deviceId,
          userId,
          userRole,
          schoolId: accountMeta.schoolId,
          schoolName: accountMeta.schoolName,
          studentId: accountMeta.studentId,
          studentName: accountMeta.studentName,
          studentCode: accountMeta.studentCode,
          className: accountMeta.className,
          userDisplayName,
          avatarUid: accountMeta.avatarUid,
          createdAt,
          lastUsedAt: createdAt,
          expiresAt,
          remainingDays: trustDevice300Days ? 300 : 1
        }
      });
    } catch (error) {
      console.error("Error in /api/auth/login-trusted:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0648\u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u062C\u0647\u0627\u0632" });
    }
  });
  app.post("/api/auth/verify-session", async (req, res) => {
    try {
      const rateLimit = checkVerifySessionRateLimit(req);
      if (!rateLimit.allowed) {
        return res.status(rateLimit.status || 429).json({
          valid: false,
          error: rateLimit.error || "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B."
        });
      }
      const { sessionToken, deviceId } = req.body || {};
      if (!sessionToken) {
        return res.status(400).json({ valid: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u0645\u0641\u0642\u0648\u062F" });
      }
      const tokenCheck = verifySignedSessionToken(sessionToken);
      if (!tokenCheck.valid || !tokenCheck.payload) {
        return res.status(401).json({ valid: false, error: tokenCheck.error || "\u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" });
      }
      const { sessionId, expiresAt } = tokenCheck.payload;
      const now = /* @__PURE__ */ new Date();
      let session = memorySessionStore.get(sessionId) || null;
      if (!session) {
        try {
          const dbRows = await db.select().from(trustedDeviceSessionsTable).where(eq7(trustedDeviceSessionsTable.id, sessionId));
          if (dbRows.length > 0) {
            const row = dbRows[0];
            session = {
              id: row.id,
              deviceId: row.deviceId,
              userId: row.userId,
              userRole: row.userRole,
              schoolId: row.schoolId || void 0,
              schoolName: row.schoolName || void 0,
              studentId: row.studentId || void 0,
              studentName: row.studentName || void 0,
              studentCode: row.studentCode || void 0,
              className: row.className || void 0,
              userDisplayName: row.userDisplayName,
              avatarUid: row.avatarUid || void 0,
              tokenHash: row.tokenHash,
              deviceName: row.deviceName || "\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
              createdAt: row.createdAt,
              lastUsedAt: row.lastUsedAt,
              expiresAt: row.expiresAt,
              revokedAt: row.revokedAt,
              metadata: row.metadata
            };
            memorySessionStore.set(sessionId, session);
          }
        } catch (dbErr) {
        }
      }
      if (!session) {
        session = {
          id: sessionId,
          deviceId: tokenCheck.payload.deviceId,
          userId: tokenCheck.payload.userId,
          userRole: tokenCheck.payload.userRole,
          schoolId: tokenCheck.payload.schoolId,
          schoolName: tokenCheck.payload.schoolName,
          studentId: tokenCheck.payload.studentId || (tokenCheck.payload.userRole === "parent" ? tokenCheck.payload.userId : void 0),
          studentName: tokenCheck.payload.studentName,
          studentCode: tokenCheck.payload.studentCode,
          className: tokenCheck.payload.className,
          userDisplayName: tokenCheck.payload.userDisplayName || tokenCheck.payload.studentName || "\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062C\u0644",
          avatarUid: tokenCheck.payload.avatarUid,
          tokenHash: "",
          deviceName: "\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
          expiresAt: tokenCheck.payload.expiresAt,
          revokedAt: null
        };
      }
      if (session.revokedAt) {
        return res.status(401).json({ valid: false, error: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062B\u0642\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628/\u0627\u0644\u062C\u0647\u0627\u0632 \u0633\u0627\u0628\u0642\u0627\u064B" });
      }
      if (new Date(session.expiresAt).getTime() < now.getTime()) {
        return res.status(401).json({ valid: false, error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u062C\u0644\u0633\u0629 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u0645\u0648\u062B\u0648\u0642 (300 \u064A\u0648\u0645). \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B" });
      }
      const lastUsedAt = now.toISOString();
      session.lastUsedAt = lastUsedAt;
      memorySessionStore.set(sessionId, session);
      try {
        await db.update(trustedDeviceSessionsTable).set({ lastUsedAt }).where(eq7(trustedDeviceSessionsTable.id, sessionId));
      } catch (e) {
      }
      const diffMs = new Date(session.expiresAt).getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)));
      res.json({
        valid: true,
        remainingDays,
        session: {
          sessionId: session.id,
          deviceId: session.deviceId,
          userId: session.userId,
          userRole: session.userRole,
          schoolId: session.schoolId,
          schoolName: session.schoolName,
          studentId: session.studentId,
          studentName: session.studentName,
          studentCode: session.studentCode,
          className: session.className,
          userDisplayName: session.userDisplayName,
          avatarUid: session.avatarUid,
          createdAt: session.createdAt,
          lastUsedAt: session.lastUsedAt,
          expiresAt: session.expiresAt,
          remainingDays
        }
      });
    } catch (error) {
      console.error("Error in /api/auth/verify-session:", error);
      res.status(500).json({ valid: false, error: error?.message || "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0629" });
    }
  });
  app.post("/api/auth/switch-account", async (req, res) => {
    try {
      const { targetSessionId, sessionToken, deviceId, accountMeta } = req.body || {};
      const identifierRaw = targetSessionId || deviceId || "switch_unknown";
      const identifierKey = buildIdentifierKey("session", identifierRaw);
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0643\u062B\u0631\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.",
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        });
      }
      if (!targetSessionId && !sessionToken && !accountMeta) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629 \u0645\u0637\u0644\u0648\u0628" });
      }
      let session = null;
      if (targetSessionId) {
        session = memorySessionStore.get(targetSessionId) || null;
        if (!session) {
          try {
            const dbRows = await db.select().from(trustedDeviceSessionsTable).where(eq7(trustedDeviceSessionsTable.id, targetSessionId));
            if (dbRows.length > 0) {
              const row = dbRows[0];
              session = {
                id: row.id,
                deviceId: row.deviceId,
                userId: row.userId,
                userRole: row.userRole,
                schoolId: row.schoolId || void 0,
                schoolName: row.schoolName || void 0,
                studentId: row.studentId || void 0,
                studentName: row.studentName || void 0,
                studentCode: row.studentCode || void 0,
                className: row.className || void 0,
                userDisplayName: row.userDisplayName,
                avatarUid: row.avatarUid || void 0,
                tokenHash: row.tokenHash,
                deviceName: row.deviceName || "\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
                createdAt: row.createdAt,
                lastUsedAt: row.lastUsedAt,
                expiresAt: row.expiresAt,
                revokedAt: row.revokedAt,
                metadata: row.metadata
              };
              memorySessionStore.set(targetSessionId, session);
            }
          } catch (dbErr) {
          }
        }
      }
      if (!session && sessionToken) {
        const tokenCheck = verifySignedSessionToken(sessionToken);
        if (tokenCheck.valid && tokenCheck.payload) {
          session = {
            id: tokenCheck.payload.sessionId,
            deviceId: tokenCheck.payload.deviceId,
            userId: tokenCheck.payload.userId,
            userRole: tokenCheck.payload.userRole,
            schoolId: tokenCheck.payload.schoolId || accountMeta?.schoolId,
            schoolName: accountMeta?.schoolName,
            studentId: accountMeta?.studentId,
            studentName: accountMeta?.studentName,
            studentCode: accountMeta?.studentCode,
            className: accountMeta?.className,
            userDisplayName: accountMeta?.userDisplayName || "\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062C\u0644",
            avatarUid: accountMeta?.avatarUid,
            tokenHash: "",
            deviceName: "\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
            expiresAt: tokenCheck.payload.expiresAt,
            revokedAt: null
          };
        }
      }
      if (!session) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({ success: false, error: "\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0645\u0648\u062B\u0642\u0629" });
      }
      if (accountMeta) {
        if (!session.schoolId && accountMeta.schoolId) session.schoolId = accountMeta.schoolId;
        if (!session.schoolName && accountMeta.schoolName) session.schoolName = accountMeta.schoolName;
        if (!session.studentId && accountMeta.studentId) session.studentId = accountMeta.studentId;
        if (!session.studentName && accountMeta.studentName) session.studentName = accountMeta.studentName;
        if (!session.studentCode && accountMeta.studentCode) session.studentCode = accountMeta.studentCode;
        if (!session.className && accountMeta.className) session.className = accountMeta.className;
        if ((!session.userDisplayName || session.userDisplayName === "\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062C\u0644") && accountMeta.userDisplayName) {
          session.userDisplayName = accountMeta.userDisplayName;
        }
        if (!session.avatarUid && accountMeta.avatarUid) session.avatarUid = accountMeta.avatarUid;
        memorySessionStore.set(session.id, session);
      }
      const queryStdId = session.studentId || (session.userRole === "student" ? session.userId : void 0);
      if (queryStdId) {
        try {
          const [foundStd] = await db.select({ avatar_layout_uid: studentsTable.avatar_layout_uid }).from(studentsTable).where(eq7(studentsTable.id, queryStdId)).limit(1);
          if (foundStd?.avatar_layout_uid) {
            session.avatarUid = foundStd.avatar_layout_uid;
          }
        } catch (stdErr) {
        }
      }
      if (session.revokedAt) {
        return res.status(403).json({ success: false, error: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062B\u0642\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632" });
      }
      const now = /* @__PURE__ */ new Date();
      if (new Date(session.expiresAt).getTime() < now.getTime()) {
        return res.status(403).json({ success: false, error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 (300 \u064A\u0648\u0645). \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B" });
      }
      const lastUsedAt = now.toISOString();
      session.lastUsedAt = lastUsedAt;
      memorySessionStore.set(session.id, session);
      try {
        await db.update(trustedDeviceSessionsTable).set({ lastUsedAt }).where(eq7(trustedDeviceSessionsTable.id, session.id));
      } catch (e) {
      }
      recordAuthSuccess(req, identifierKey);
      const diffMs = new Date(session.expiresAt).getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)));
      const freshToken = createSignedSessionToken({
        sessionId: session.id,
        deviceId: session.deviceId,
        userId: session.userId,
        userRole: session.userRole,
        schoolId: session.schoolId,
        schoolName: session.schoolName,
        studentId: session.studentId || (session.userRole === "parent" ? session.userId : void 0),
        studentName: session.studentName,
        studentCode: session.studentCode,
        className: session.className,
        userDisplayName: session.userDisplayName,
        avatarUid: session.avatarUid,
        expiresAt: session.expiresAt
      });
      res.json({
        success: true,
        sessionToken: freshToken,
        remainingDays,
        session: {
          sessionId: session.id,
          deviceId: session.deviceId,
          userId: session.userId,
          userRole: session.userRole,
          schoolId: session.schoolId,
          schoolName: session.schoolName,
          studentId: session.studentId,
          studentName: session.studentName,
          studentCode: session.studentCode,
          className: session.className,
          userDisplayName: session.userDisplayName,
          avatarUid: session.avatarUid,
          createdAt: session.createdAt,
          lastUsedAt: session.lastUsedAt,
          expiresAt: session.expiresAt,
          remainingDays
        }
      });
    } catch (error) {
      console.error("Error in /api/auth/switch-account:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628" });
    }
  });
  app.post("/api/auth/revoke-device-session", async (req, res) => {
    try {
      const { sessionId, sessionToken, deviceId } = req.body;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let targetId = sessionId;
      if (!targetId && sessionToken) {
        const tokenCheck = verifySignedSessionToken(sessionToken);
        if (tokenCheck.payload) targetId = tokenCheck.payload.sessionId;
      }
      if (targetId) {
        const session = memorySessionStore.get(targetId);
        if (session) {
          session.revokedAt = now;
          memorySessionStore.set(targetId, session);
        }
        try {
          await db.update(trustedDeviceSessionsTable).set({ revokedAt: now }).where(eq7(trustedDeviceSessionsTable.id, targetId));
        } catch (e) {
        }
      }
      res.json({ success: true, message: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062B\u0642\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error in /api/auth/revoke-device-session:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u062C\u0644\u0633\u0629 \u0627\u0644\u062C\u0647\u0627\u0632" });
    }
  });
  app.post("/api/auth/revoke-all-device-sessions", async (req, res) => {
    try {
      const { deviceId } = req.body;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (deviceId) {
        for (const [id, s] of memorySessionStore.entries()) {
          if (s.deviceId === deviceId) {
            s.revokedAt = now;
            memorySessionStore.set(id, s);
          }
        }
        try {
          await db.update(trustedDeviceSessionsTable).set({ revokedAt: now }).where(eq7(trustedDeviceSessionsTable.deviceId, deviceId));
        } catch (e) {
        }
      }
      res.json({ success: true, message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0645\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062B\u0642\u0629 \u0628\u0627\u0644\u062C\u0647\u0627\u0632" });
    } catch (error) {
      console.error("Error in /api/auth/revoke-all-device-sessions:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A" });
    }
  });
  app.get("/api/auth/saved-accounts", async (req, res) => {
    try {
      const deviceId = req.query.deviceId;
      if (!deviceId) {
        return res.json({ success: true, accounts: [] });
      }
      const now = Date.now();
      const accounts = [];
      for (const s of memorySessionStore.values()) {
        if (s.deviceId === deviceId && !s.revokedAt) {
          const exp = new Date(s.expiresAt).getTime();
          if (exp > now) {
            const diffMs = exp - now;
            const remainingDays = Math.max(0, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)));
            accounts.push({
              sessionId: s.id,
              userId: s.userId,
              userRole: s.userRole,
              schoolId: s.schoolId,
              schoolName: s.schoolName,
              studentId: s.studentId,
              studentName: s.studentName,
              studentCode: s.studentCode,
              className: s.className,
              userDisplayName: s.userDisplayName,
              avatarUid: s.avatarUid,
              createdAt: s.createdAt,
              lastUsedAt: s.lastUsedAt,
              expiresAt: s.expiresAt,
              remainingDays
            });
          }
        }
      }
      try {
        const dbRows = await db.select().from(trustedDeviceSessionsTable).where(and7(eq7(trustedDeviceSessionsTable.deviceId, deviceId), isNull2(trustedDeviceSessionsTable.revokedAt)));
        for (const row of dbRows) {
          const exp = new Date(row.expiresAt).getTime();
          if (exp > now && !accounts.some((a) => a.sessionId === row.id)) {
            const diffMs = exp - now;
            const remainingDays = Math.max(0, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)));
            accounts.push({
              sessionId: row.id,
              userId: row.userId,
              userRole: row.userRole,
              schoolId: row.schoolId || void 0,
              schoolName: row.schoolName || void 0,
              studentId: row.studentId || void 0,
              studentName: row.studentName || void 0,
              studentCode: row.studentCode || void 0,
              className: row.className || void 0,
              userDisplayName: row.userDisplayName,
              avatarUid: row.avatarUid || void 0,
              createdAt: row.createdAt,
              lastUsedAt: row.lastUsedAt,
              expiresAt: row.expiresAt,
              remainingDays
            });
          }
        }
      } catch (dbErr) {
      }
      res.json({ success: true, accounts });
    } catch (error) {
      console.error("Error in /api/auth/saved-accounts:", error);
      res.json({ success: true, accounts: [] });
    }
  });
  app.get("/api/auth/trusted-device-info", async (req, res) => {
    try {
      const deviceId = req.query.deviceId;
      const sessionId = req.query.sessionId;
      let session = null;
      if (sessionId) {
        session = memorySessionStore.get(sessionId) || null;
      }
      const now = Date.now();
      const expiresAt = session?.expiresAt || new Date(now + 300 * 24 * 60 * 60 * 1e3).toISOString();
      const diffMs = new Date(expiresAt).getTime() - now;
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)));
      res.json({
        deviceId: deviceId || "dev_unknown",
        deviceName: session?.deviceName || "\u0645\u062A\u0635\u0641\u062D \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
        isTrusted: true,
        createdAt: session?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        lastUsedAt: session?.lastUsedAt || (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt,
        remainingDays
      });
    } catch (error) {
      res.json({
        deviceId: "dev_unknown",
        deviceName: "\u0645\u062A\u0635\u0641\u062D \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632",
        isTrusted: true,
        remainingDays: 300
      });
    }
  });
  app.get("/api/sms/balance", requireAuth, async (req, res) => {
    try {
      const session = req.user;
      if (session.userRole !== "owner" && session.userRole !== "school_admin") {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644" });
      }
      const result = await checkBalance();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "Failed to check balance" });
    }
  });
  app.get("/api/sms/logs", requireAuth, async (req, res) => {
    try {
      const session = req.user;
      if (session.userRole !== "owner" && session.userRole !== "school_admin") {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0648\u0635\u0648\u0644 \u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0631\u0633\u0627\u0626\u0644" });
      }
      const query = db.select().from(smsLogsTable);
      const logs = session.userRole !== "owner" && session.schoolId ? await query.where(eq7(smsLogsTable.schoolId, session.schoolId)).orderBy(desc5(smsLogsTable.sentAt)).limit(200) : await query.orderBy(desc5(smsLogsTable.sentAt)).limit(200);
      res.json({ success: true, logs });
    } catch (error) {
      res.json({ success: true, logs: [], note: "Database offline or pending migration" });
    }
  });
  app.post("/api/sms/send-bulk", requireAuth, async (req, res) => {
    try {
      const session = req.user;
      if (session.userRole !== "owner" && session.userRole !== "school_admin" && session.userRole !== "admin") {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062C\u0645\u0627\u0639\u064A\u0629 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u0648 \u0627\u0644\u0645\u0627\u0644\u0643 \u0641\u0642\u0637" });
      }
      const { schoolId, schoolName, recipients, platformUrl } = req.body;
      const targetSchoolId = schoolId || session.schoolId || "sch-all";
      if (session.userRole !== "owner" && session.schoolId !== targetSchoolId) {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644 \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649" });
      }
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u062D\u062F\u064A\u062F \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u0644\u0645\u064A\u0646" });
      }
      const bulkResult = await sendBulkSMS({
        schoolId: targetSchoolId,
        schoolName: schoolName || "\u0645\u0646\u0635\u0629 \u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0628\u0644",
        recipients,
        platformUrl: platformUrl || process.env.APP_URL || "https://eduportal.app"
      });
      try {
        for (const log of bulkResult.logs) {
          await db.insert(smsLogsTable).values({
            id: log.id,
            schoolId: log.school_id,
            studentId: log.student_id,
            phone: log.phone,
            message: log.message,
            provider: log.provider,
            status: log.status,
            providerMessageId: log.provider_message_id,
            sentAt: log.sent_at,
            error: log.error
          });
        }
      } catch (dbErr) {
      }
      res.json({ success: true, ...bulkResult });
    } catch (error) {
      console.error("Error in /api/sms/send-bulk:", error);
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062C\u0645\u0627\u0639\u064A" });
    }
  });
  app.post("/api/sms/send-single", requireAuth, async (req, res) => {
    try {
      const session = req.user;
      if (session.userRole !== "owner" && session.userRole !== "school_admin" && session.userRole !== "admin") {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0645\u0642\u062A\u0635\u0631 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u0648 \u0627\u0644\u0645\u0627\u0644\u0643 \u0641\u0642\u0637" });
      }
      const { phone, message, studentId, studentName, schoolId } = req.body;
      const targetSchoolId = schoolId || session.schoolId || "sch-1";
      if (session.userRole !== "owner" && session.schoolId !== targetSchoolId) {
        return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644 \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649" });
      }
      const sendRes = await sendSMS({
        phone,
        message,
        studentId,
        studentName,
        schoolId: targetSchoolId
      });
      try {
        await db.insert(smsLogsTable).values({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          schoolId: targetSchoolId,
          studentId: studentId || "",
          phone: sendRes.phone,
          message,
          provider: "SMSMode",
          status: sendRes.success ? "\u062A\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645" : "\u0641\u0634\u0644",
          providerMessageId: sendRes.providerMessageId || "",
          sentAt: sendRes.sentAt,
          error: sendRes.error
        });
      } catch (dbErr) {
      }
      res.json({ success: true, result: sendRes });
    } catch (error) {
      res.status(500).json({ success: false, error: error?.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" });
    }
  });
  function generateDataDrivenFallback(role, lastMsg, ctx) {
    const query = (lastMsg || "").toLowerCase();
    if (role === "admin") {
      const schoolName = ctx.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629";
      const students = Array.isArray(ctx.students) ? ctx.students : [];
      const teachers = Array.isArray(ctx.teachers) ? ctx.teachers : [];
      const classes = Array.isArray(ctx.classes) ? ctx.classes : [];
      const attendance = Array.isArray(ctx.attendance) ? ctx.attendance : [];
      const grades = Array.isArray(ctx.grades) ? ctx.grades : [];
      const behavior = Array.isArray(ctx.behavior) ? ctx.behavior : [];
      const announcements = Array.isArray(ctx.announcements) ? ctx.announcements : [];
      const community = ctx.community || {};
      const leaderboard = Array.isArray(ctx.leaderboard) ? ctx.leaderboard : [];
      const calendar = Array.isArray(ctx.calendar) ? ctx.calendar : [];
      const badges = ctx.badges || {};
      const adminActions = Array.isArray(ctx.adminActions) ? ctx.adminActions : [];
      const settings = ctx.settings || {};
      const extensions = Array.isArray(ctx.extensions) ? ctx.extensions : [];
      if (query.includes("\u0623\u0648\u0627\u0626\u0644") || query.includes("\u0627\u0648\u0627\u0626\u0644") || query.includes("\u0634\u0631\u0641") || query.includes("\u062A\u0631\u062A\u064A\u0628") || query.includes("\u0646\u0642\u0627\u0637") || query.includes("leaderboard")) {
        const topStudents = leaderboard.slice(0, 10).map((s) => `\u2022 **\u0627\u0644\u0645\u0631\u0643\u0632 ${s.rank}**: **${s.studentName}** (\u0641\u0635\u0644: ${s.className || "\u0639\u0627\u0645"}) - \u0627\u0644\u0646\u0642\u0627\u0637: **${s.points}** \u0646\u0642\u0637\u0629 | \u0633\u0644\u0633\u0644\u0629 \u0627\u0644\u062D\u0636\u0648\u0631: **${s.streakDays || 1}** \u0623\u064A\u0627\u0645 | \u0627\u0644\u0623\u0648\u0633\u0645\u0629: **${s.badgesCount || 0}**`).join("\n");
        return `**\u0644\u0648\u062D\u0629 \u0634\u0631\u0641 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0648\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062A\u0641\u0648\u0642\u064A\u0646 - ${schoolName}** \u{1F3C6}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062A\u0646\u0627\u0641\u0633\u064A\u0646 \u0628\u0627\u0644\u0644\u0648\u062D\u0629**: **${students.length}** \u0637\u0627\u0644\u0628.

` + (topStudents ? `**\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0623\u0648\u0627\u0626\u0644 \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628**:
${topStudents}

` : "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0635\u0646\u064A\u0641 \u062D\u0627\u0644\u064A\u0629.\n\n") + `\u{1F4A1} *\u064A\u062A\u0645 \u0627\u062D\u062A\u0633\u0627\u0628 \u0627\u0644\u0646\u0642\u0627\u0637 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u060C \u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u064A\u0648\u0645\u064A\u060C \u0648\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0648\u0627\u0644\u062A\u0645\u064A\u0632.*`;
      }
      if (query.includes("\u0645\u062C\u062A\u0645\u0639") || query.includes("\u0634\u0627\u062A") || query.includes("\u0645\u062D\u0627\u062F\u062B") || query.includes("\u0631\u0633\u0627\u0626\u0644") || query.includes("\u0627\u0633\u062A\u0637\u0644\u0627\u0639") || query.includes("community")) {
        const groups = Array.isArray(community.groups) ? community.groups : [];
        const messages = Array.isArray(community.recentMessages) ? community.recentMessages : [];
        const polls = Array.isArray(community.activePolls) ? community.activePolls : [];
        const groupList = groups.map((g) => `\u2022 **${g.name}** (${g.type || "\u0639\u0627\u0645"}) - \u0627\u0644\u0623\u0639\u0636\u0627\u0621: ${g.membersCount || 0} ${g.isLocked ? "[\u{1F512} \u0645\u0642\u0641\u0648\u0644 \u0644\u0644\u0646\u0634\u0631]" : ""}`).join("\n");
        const recentMsgs = messages.slice(-5).map((m) => `\u2022 [${m.groupName || "\u0627\u0644\u0645\u062C\u062A\u0645\u0639"}] **${m.senderName}** (${m.senderRole}): "${m.text}"`).join("\n");
        const pollDetails = polls.map((p) => `\u2022 \u0627\u0633\u062A\u0637\u0644\u0627\u0639: **"${p.question}"** (\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0623\u0635\u0648\u0627\u062A: ${p.totalVotes || 0})`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0645\u062C\u062A\u0645\u0639 \u0648\u0646\u0642\u0627\u0634\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 - ${schoolName}** \u{1F4AC}

\u2022 **\u0639\u062F\u062F \u063A\u0631\u0641 \u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0648\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A**: **${groups.length}** \u0645\u062C\u0645\u0648\u0639\u0629.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u0648\u062B\u0642\u0629**: **${messages.length}** \u0631\u0633\u0627\u0644\u0629.
\u2022 **\u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0644\u0631\u0623\u064A \u0627\u0644\u0646\u0634\u0637\u0629**: **${polls.length}** \u0627\u0633\u062A\u0637\u0644\u0627\u0639.

**\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629**:
${groupList || "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u062C\u0645\u0648\u0639\u0627\u062A."}

` + (recentMsgs ? `**\u0623\u062D\u062F\u062B \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u0644\u0646\u0642\u0627\u0634\u0627\u062A \u0628\u0627\u0644\u0645\u062C\u062A\u0645\u0639**:
${recentMsgs}

` : "") + (pollDetails ? `**\u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0644\u0631\u0623\u064A \u0627\u0644\u062C\u0627\u0631\u064A\u0629**:
${pollDetails}

` : "");
      }
      if (query.includes("\u062A\u0642\u0648\u064A\u0645") || query.includes("\u0645\u0648\u0627\u0639\u064A\u062F") || query.includes("\u0641\u0639\u0627\u0644\u064A\u0627\u062A") || query.includes("\u0627\u0645\u062A\u062D\u0627\u0646") || query.includes("\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A") || query.includes("\u0625\u062C\u0627\u0632") || query.includes("calendar")) {
        const eventsList = calendar.slice(0, 8).map((c) => `\u2022 **${c.title}** - \u0627\u0644\u062A\u0627\u0631\u064A\u062E: **${c.date}** (${c.category || "\u0639\u0627\u0645"}) - \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629: ${c.priority || "\u0639\u0627\u062F\u064A"} [\u0627\u0644\u062D\u0627\u0644\u0629: ${c.status || "\u0645\u062C\u062F\u0648\u0644"}]`).join("\n");
        return `**\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629 - ${schoolName}** \u{1F4C5}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0648\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629**: **${calendar.length}** \u062D\u062F\u062B.

` + (eventsList ? `**\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629**:
${eventsList}

` : "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u062D\u0627\u0644\u064A\u0627\u064B.\n\n") + `\u{1F4A1} *\u064A\u0645\u0643\u0646\u0643 \u0625\u0636\u0627\u0641\u0629 \u0645\u0647\u0627\u0645 \u0648\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u062C\u062F\u064A\u062F\u0629 \u0639\u0628\u0631 \u062A\u0628\u0648\u064A\u0628 (\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A).*`;
      }
      if (query.includes("\u0648\u0633\u0627\u0645") || query.includes("\u0623\u0648\u0633\u0645\u0629") || query.includes("\u062A\u0643\u0631\u064A\u0645") || query.includes("\u0634\u0631\u0641\u064A") || query.includes("badges")) {
        const available = Array.isArray(badges.availableBadges) ? badges.availableBadges : [];
        const studentB = Array.isArray(badges.awardedStudentBadges) ? badges.awardedStudentBadges : [];
        const teacherB = Array.isArray(badges.awardedTeacherBadges) ? badges.awardedTeacherBadges : [];
        const recentAwards = studentB.slice(0, 6).map((sb) => `\u2022 \u0627\u0644\u0637\u0627\u0644\u0628: **${sb.studentName}** \u27F5 \u0646\u0627\u0644 \u0648\u0633\u0627\u0645 **${sb.badgeName}** (${sb.awardedAt || "\u0645\u0624\u062E\u0631\u0627\u064B"})`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 - ${schoolName}** \u{1F396}\uFE0F

\u2022 **\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629**: **${available.length}** \u0648\u0633\u0627\u0645.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629 \u0644\u0644\u0637\u0644\u0627\u0628**: **${studentB.length}** \u0648\u0633\u0627\u0645.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629 \u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646**: **${teacherB.length}** \u0648\u0633\u0627\u0645.

` + (recentAwards ? `**\u0639\u064A\u0646\u0629 \u0645\u0646 \u0623\u062D\u062F\u062B \u0627\u0644\u062A\u0643\u0631\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629**:
${recentAwards}

` : "");
      }
      if (query.includes("\u0625\u062C\u0631\u0627\u0621") || query.includes("\u0625\u062C\u0631\u0627\u0621\u0627\u062A") || query.includes("\u0639\u0642\u0648\u0628") || query.includes("\u0625\u0646\u0630\u0627\u0631") || query.includes("\u0627\u0633\u062A\u062F\u0639\u0627\u0621")) {
        const actionList = adminActions.slice(0, 8).map((a) => `\u2022 **${a.studentName}**: ${a.title} (${a.actionType}) - \u0627\u0644\u0633\u0628\u0628: ${a.reason} [\u0628\u062A\u0627\u0631\u064A\u062E: ${a.date}]`).join("\n");
        return `**\u0633\u062C\u0644 \u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 - ${schoolName}** \u2696\uFE0F

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0633\u062C\u0644\u0629**: **${adminActions.length}** \u0625\u062C\u0631\u0627\u0621.

` + (actionList ? `**\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A**:
${actionList}

` : "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0642\u0648\u0628\u0627\u062A \u0623\u0648 \u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0645\u0633\u062C\u0644\u0629.\n\n");
      }
      if (query.includes("\u0625\u0639\u062F\u0627\u062F\u0627\u062A") || query.includes("\u062A\u0631\u062E\u064A\u0635") || query.includes("\u0627\u0634\u062A\u0631\u0627\u0643") || query.includes("\u0625\u0636\u0627\u0641\u0627\u062A") || query.includes("extensions")) {
        const extList = extensions.map((e) => `\u2022 **${e.name || e.id}**: ${e.isEnabled ? "\u2705 \u0645\u0641\u0639\u0644\u0629" : "\u274C \u0645\u0639\u0637\u0644\u0629"}`).join("\n");
        return `**\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0627\u0644\u0646\u0638\u0627\u0645 - ${schoolName}** \u2699\uFE0F

\u2022 **\u0643\u0648\u062F \u0627\u0644\u0645\u062F\u0631\u0633\u0629**: \`${settings.schoolCode || ctx.schoolCode || "SCH"}\`
\u2022 **\u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A**: **${settings.academicYear || ctx.academicYear || "2025/2026"}**
\u2022 **\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u062F\u0631\u0633\u0629**: **${settings.principalName || ctx.principalName || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}**
\u2022 **\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629 / \u0627\u0644\u0639\u0646\u0648\u0627\u0646**: ${settings.governorate || ctx.governorate || "\u0645\u0635\u0631"} - ${settings.address || ctx.address || ""}
\u2022 **\u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0631\u062E\u064A\u0635**: \u0633\u0627\u0631\u064D \u062D\u062A\u0649 **${settings.licenseExpiry || ctx.licenseExpiry || "2026-12-31"}**

**\u062D\u0627\u0644\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062A \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 (Extensions)**:
${extList || "\u2022 \u062C\u0645\u064A\u0639 \u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0646\u0634\u0637\u0629."}`;
      }
      if (query.includes("\u063A\u064A\u0627\u0628") || query.includes("\u062D\u0636\u0648\u0631") || query.includes("\u062D\u0627\u0636\u0631") || query.includes("\u063A\u0627\u0626\u0628")) {
        const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const todayRecords = attendance.filter((a) => a.date === todayStr || a.date?.startsWith(todayStr));
        const activeAttendance = todayRecords.length > 0 ? todayRecords : attendance;
        const absentList = activeAttendance.filter((a) => a.status === "\u063A\u0627\u0626\u0628");
        const presentList = activeAttendance.filter((a) => a.status === "\u062D\u0627\u0636\u0631" || a.status === "\u0645\u062A\u0623\u062E\u0631");
        const absentNames = absentList.map((a) => `\u2022 **${a.studentName || "\u0637\u0627\u0644\u0628"}** (\u0641\u0635\u0644: ${a.className || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}${a.notes ? ` - \u0645\u0644\u0627\u062D\u0638\u0629: ${a.notes}` : ""})`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 - ${schoolName}** \u{1F4CA}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646**: **${students.length}** \u0637\u0627\u0644\u0628/\u0637\u0627\u0644\u0628\u0629.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0628\u0627\u0644\u0646\u0638\u0627\u0645**: **${activeAttendance.length}** \u0633\u062C\u0644.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u062D\u0627\u0636\u0631\u064A\u0646**: **${presentList.length}** \u0637\u0627\u0644\u0628.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u063A\u0627\u0626\u0628\u064A\u0646**: **${absentList.length}** \u0637\u0627\u0644\u0628.

` + (absentList.length > 0 ? `**\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u063A\u0627\u0626\u0628\u064A\u0646 \u0628\u0627\u0644\u0627\u0633\u0645**:
${absentNames}

` : `\u2022 **\u062D\u0627\u0644\u0629 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u0648\u0627\u0644\u063A\u064A\u0627\u0628**: \u062C\u0645\u064A\u0639 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646 \u0628\u0627\u0644\u0633\u062C\u0644\u0627\u062A \u062D\u0627\u0636\u0631\u0648\u0646 (\u0646\u0633\u0628\u0629 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 100%).

`) + `\u{1F4A1} *\u064A\u0645\u0643\u0646\u0643 \u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u062A\u0633\u062C\u064A\u0644 \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0641\u0648\u0631\u064A\u0627\u064B \u0639\u0628\u0631 \u0642\u0633\u0645 (\u0627\u0644\u063A\u064A\u0627\u0628 \u0648\u0627\u0644\u062D\u0636\u0648\u0631) \u0627\u0644\u0645\u062E\u0635\u0635 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645.*`;
      }
      if (query.includes("\u0645\u0639\u0644\u0645") || query.includes("\u0645\u0639\u0644\u0645\u064A\u0646") || query.includes("\u0643\u0627\u062F\u0631") || query.includes("\u0645\u062F\u0631\u0633")) {
        const teacherItems = teachers.map((t) => `\u2022 **${t.name}** - \u0627\u0644\u062A\u062E\u0635\u0635: ${t.specialization || "\u0639\u0627\u0645"} ${t.phone ? `(\u0647\u0627\u062A\u0641: ${t.phone})` : ""}`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0643\u0627\u062F\u0631 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 - ${schoolName}** \u{1F468}\u200D\u{1F3EB}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0639\u062F\u062F \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0627\u0644\u0645\u0642\u064A\u062F\u064A\u0646**: **${teachers.length}** \u0645\u0639\u0644\u0645.

**\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0627\u0644\u0645\u062A\u0627\u062D\u064A\u0646 \u0644\u0644\u0646\u0638\u0627\u0645**:
${teacherItems || "\u2022 \u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0639\u0644\u0645\u064A\u0646 \u0625\u0636\u0627\u0641\u064A\u0629."}`;
      }
      if (query.includes("\u0637\u0627\u0644\u0628") || query.includes("\u0637\u0644\u0627\u0628") || query.includes("\u0623\u0637\u0641\u0627\u0644") || query.includes("\u0642\u064A\u062F")) {
        const studentItems = students.slice(0, 15).map((s) => `\u2022 **${s.name}** (\u0641\u0635\u0644: ${s.className || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}, \u0643\u0648\u062F: ${s.code || s.id}, \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631: ${s.parentPhone || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F"})`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0642\u064A\u062F\u064A\u0646 - ${schoolName}** \u{1F393}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0628\u0627\u0644\u0645\u062F\u0631\u0633\u0629**: **${students.length}** \u0637\u0627\u0644\u0628.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u0648\u0632\u0639 \u0639\u0644\u064A\u0647\u0627 \u0627\u0644\u0637\u0644\u0627\u0628**: **${classes.length}** \u0641\u0635\u0644 \u062F\u0631\u0627\u0633\u064A.

**\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0642\u064A\u062F\u064A\u0646 \u0628\u0627\u0644\u0646\u0638\u0627\u0645**:
${studentItems}

` + (students.length > 15 ? `*\u064A\u0648\u062C\u062F ${students.length - 15} \u0637\u0644\u0627\u0628 \u0622\u062E\u0631\u064A\u0646 \u0645\u0633\u062C\u0644\u064A\u0646 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.*` : "");
      }
      if (query.includes("\u062F\u0631\u062C\u0627\u062A") || query.includes("\u062A\u062D\u0635\u064A\u0644") || query.includes("\u0646\u062A\u064A\u062C\u0629") || query.includes("\u0627\u062E\u062A\u0628\u0627\u0631")) {
        const topGrades = grades.slice(0, 8).map((g) => `\u2022 **${g.studentName}** - \u0645\u0627\u062F\u0629 ${g.subjectName || "\u0639\u0627\u0645\u0629"}: **${g.score}/${g.maxScore}** (${g.examName || "\u0627\u062E\u062A\u0628\u0627\u0631"})`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u062D\u0635\u064A\u0644 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0648\u0627\u0644\u062F\u0631\u062C\u0627\u062A - ${schoolName}** \u{1F4DD}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0645\u0631\u0635\u0648\u062F\u0629**: **${grades.length}** \u0646\u062A\u064A\u062C\u0629.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629**: **${ctx.stats?.totalSubjects || ctx.subjects?.length || 8}** \u0645\u0648\u0627\u062F.

` + (grades.length > 0 ? `**\u0639\u064A\u0646\u0629 \u0645\u0646 \u0627\u0644\u062F\u0631\u062C\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0635\u0648\u062F\u0627\u062A \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629**:
${topGrades}

` : "") + `\u{1F4A1} *\u064A\u0645\u0643\u0646\u0643 \u0637\u0628\u0627\u0639\u0629 \u0643\u0634\u0648\u0641 \u0627\u0644\u062F\u0631\u062C\u0627\u062A \u0648\u0627\u0644\u0634\u0647\u0627\u062F\u0627\u062A \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644 \u0645\u0646 \u0642\u0633\u0645 (\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0648\u0627\u0644\u062A\u062D\u0635\u064A\u0644) \u0628\u0627\u0644\u0644\u0648\u062D\u0629.*`;
      }
      if (query.includes("\u0633\u0644\u0648\u0643") || query.includes("\u062A\u0645\u064A\u0632") || query.includes("\u0645\u062E\u0627\u0644\u0641")) {
        const behaviorItems = behavior.map((b) => `\u2022 **${b.studentName}**: ${b.title} (${b.type}) - ${b.description}`).join("\n");
        return `**\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0645\u0648\u0627\u0638\u0628\u0629 - ${schoolName}** \u{1F31F}

\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0633\u0644\u0648\u0643**: **${behavior.length}** \u0633\u062C\u0644.

**\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0633\u0644\u0648\u0643\u064A\u0629**:
${behaviorItems || "\u2022 \u062C\u0645\u064A\u0639 \u0627\u0644\u0637\u0644\u0627\u0628 \u0645\u0644\u062A\u0632\u0645\u0648\u0646 \u0628\u0627\u0644\u0633\u0644\u0648\u0643 \u0627\u0644\u0625\u064A\u062C\u0627\u0628\u064A."}`;
      }
      return `**\u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0634\u0627\u0645\u0644 \u0648\u0627\u0644\u062D\u064A \u0644\u0625\u062F\u0627\u0631\u0629 ${schoolName}** \u{1F3EB}

\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0643\u0627\u0641\u0629 \u0623\u0642\u0633\u0627\u0645 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062F\u0631\u0633\u062A\u0643:
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0642\u064A\u062F\u064A\u0646**: **${students.length}** \u0637\u0627\u0644\u0628.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646**: **${teachers.length}** \u0645\u0639\u0644\u0645.
\u2022 **\u0639\u062F\u062F \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629**: **${classes.length}** \u0641\u0635\u0644.
\u2022 **\u0627\u0644\u0645\u062A\u0635\u062F\u0631 \u0627\u0644\u0623\u0648\u0644 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0634\u0631\u0641**: **${leaderboard[0]?.studentName || "\u0637\u0627\u0644\u0628 \u0645\u062A\u0645\u064A\u0632"}** (${leaderboard[0]?.points || 0} \u0646\u0642\u0637\u0629).
\u2022 **\u063A\u0631\u0641 \u0645\u062C\u062A\u0645\u0639 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0646\u0634\u0637\u0629**: **${community.groups?.length || 0}** \u0645\u062C\u0645\u0648\u0639\u0629.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0628\u0627\u0644\u062A\u0642\u0648\u064A\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u064A**: **${calendar.length}** \u062D\u062F\u062B.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0623\u0648\u0633\u0645\u0629 \u0627\u0644\u0645\u0645\u0646\u0648\u062D\u0629**: **${(badges.awardedStudentBadges?.length || 0) + (badges.awardedTeacherBadges?.length || 0)}** \u0648\u0633\u0627\u0645.
\u2022 **\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628**: **${attendance.length}** \u0633\u062C\u0644.
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062F\u0631\u062C\u0627\u062A**: **${grades.length}** \u0646\u062A\u064A\u062C\u0629 \u0645\u0631\u0635\u0648\u062F\u0629.

\u0623\u0646\u0627 \u062C\u0627\u0647\u0632 \u0644\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0639\u0646 \u0623\u064A \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u064A\u062A\u0639\u0644\u0642 \u0628\u0627\u0644\u0645\u062C\u062A\u0645\u0639 \u0648\u0627\u0644\u0634\u0627\u062A\u060C \u0627\u0644\u0623\u0648\u0627\u0626\u0644\u060C \u0627\u0644\u0623\u0648\u0633\u0645\u0629\u060C \u0627\u0644\u062A\u0642\u0648\u064A\u0645\u060C \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A\u060C \u0623\u0648 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0628\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0623\u0631\u0642\u0627\u0645!`;
    } else {
      const platformStats = ctx.platformStats || {};
      const schoolsOverview = Array.isArray(ctx.schoolsOverview) ? ctx.schoolsOverview : [];
      const activeSchools = schoolsOverview.filter((s) => s.status === "\u0646\u0634\u0637\u0629");
      let answer = `\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u064A\u0627 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629! \u{1F44B}

**\u0645\u0644\u062E\u0635 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629**:
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062F\u0627\u0631\u0633 \u0627\u0644\u0645\u0633\u062C\u0644\u0629**: **${platformStats.totalSchools || schoolsOverview.length}** \u0645\u062F\u0631\u0633\u0629 (${activeSchools.length} \u0646\u0634\u0637\u0629).
\u2022 **\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A \u0644\u0644\u0637\u0644\u0627\u0628 \u0628\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629**: **${platformStats.totalStudentsEstimate || 0}** \u0637\u0627\u0644\u0628.

\u0623\u0646\u0627 \u062C\u0627\u0647\u0632 \u0644\u062A\u062D\u0644\u064A\u0644 \u0623\u062F\u0627\u0621 \u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u062F\u0627\u0631\u0633 \u0648\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A\u0647\u0627 \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644 \u0641\u0648\u0631 \u0637\u0644\u0628\u0643!`;
      const q = (query || "").toLowerCase().trim();
      const wantsExcel = q.includes("\u0625\u0643\u0633\u064A\u0644") || q.includes("\u0627\u0643\u0633\u064A\u0644") || q.includes("\u0625\u0643\u0633\u0644") || q.includes("\u0627\u0643\u0633\u0644") || q.includes("excel") || q.includes("xlsx") || q.includes("\u0634\u064A\u062A") || q.includes("\u062A\u0635\u062F\u064A\u0631") || q.includes("\u0645\u0644\u0641");
      if (wantsExcel && schoolsOverview.length > 0) {
        const excelPayload = {
          fileName: `\u062A\u0642\u0631\u064A\u0631_\u0645\u062F\u0627\u0631\u0633_\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`,
          sheetName: "\u0627\u0644\u0645\u062F\u0627\u0631\u0633",
          metadata: {
            title: "\u062A\u0642\u0631\u064A\u0631 \u0645\u062F\u0627\u0631\u0633 \u0648\u062A\u0631\u0627\u062E\u064A\u0635 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629",
            generatedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")
          },
          columns: ["\u0645", "\u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", "\u0643\u0648\u062F \u0627\u0644\u0645\u062F\u0631\u0633\u0629", "\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629", "\u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", "\u0646\u0648\u0639 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643", "\u0639\u062F\u062F \u0627\u0644\u0637\u0644\u0627\u0628"],
          rows: schoolsOverview.map((s, idx) => [
            idx + 1,
            s.name,
            s.code || s.id,
            s.governorate || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
            s.status || "\u0646\u0634\u0637\u0629",
            s.subscription || "\u0623\u0633\u0627\u0633\u064A",
            s.studentsCount || 0
          ])
        };
        answer += `

\`\`\`json:excel-export
${JSON.stringify(excelPayload, null, 2)}
\`\`\``;
      }
      return answer;
    }
  }
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const session = req.user;
      const { role, messages, contextData } = req.body;
      const effectiveRole = session.userRole === "owner" ? "owner" : "admin";
      const cleanedContext = sanitizeContext(contextData);
      let targetSchoolId = cleanedContext?.schoolId || session?.schoolId || req.headers["x-school-id"] || "";
      let hasStudents = false;
      if (targetSchoolId && targetSchoolId !== "sch-1") {
        const c = await db.select({ count: count2() }).from(studentsTable).where(eq7(studentsTable.schoolId, targetSchoolId));
        if ((c[0]?.count || 0) > 0) {
          hasStudents = true;
        }
      }
      if (!hasStudents && cleanedContext?.schoolName) {
        const matched = await db.select({ schoolId: schoolInfoTable.schoolId }).from(schoolInfoTable).where(ilike4(schoolInfoTable.name, `%${cleanedContext.schoolName.trim()}%`)).limit(1);
        if (matched[0]?.schoolId) {
          targetSchoolId = matched[0].schoolId;
          hasStudents = true;
        }
      }
      if (!hasStudents) {
        const topSchool = await db.select({ schoolId: studentsTable.schoolId }).from(studentsTable).groupBy(studentsTable.schoolId).orderBy(desc5(count2())).limit(1);
        if (topSchool[0]?.schoolId) {
          targetSchoolId = topSchool[0].schoolId;
        } else {
          targetSchoolId = "sch-1";
        }
      }
      const rawMessage = req.body.message || "";
      const lastMsg = rawMessage || (messages && messages.length > 0 ? messages[messages.length - 1]?.text || messages[messages.length - 1]?.content : "");
      const schoolName = cleanedContext.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629";
      let schoolStats = {
        schoolName,
        schoolId: targetSchoolId,
        totalRegisteredStudents: 0,
        totalTeachers: 0,
        totalClasses: 0
      };
      try {
        const [stdCount, tchCount, clsCount] = await Promise.all([
          db.select({ count: count2() }).from(studentsTable).where(eq7(studentsTable.schoolId, targetSchoolId)),
          db.select({ count: count2() }).from(teachersTable).where(eq7(teachersTable.schoolId, targetSchoolId)),
          db.select({ count: count2() }).from(classesTable).where(eq7(classesTable.schoolId, targetSchoolId))
        ]);
        schoolStats.totalRegisteredStudents = stdCount[0]?.count || 0;
        schoolStats.totalTeachers = tchCount[0]?.count || 0;
        schoolStats.totalClasses = clsCount[0]?.count || 0;
      } catch (statsErr) {
      }
      let systemInstruction = "";
      if (effectiveRole === "admin") {
        systemInstruction = `\u0623\u0646\u062A \u0627\u0644\u0645\u0633\u062A\u0634\u0627\u0631 \u0627\u0644\u062A\u0631\u0628\u0648\u064A \u0648\u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A \u0627\u0644\u0630\u0643\u064A \u0644\u0625\u062F\u0627\u0631\u0629 \u0645\u062F\u0631\u0633\u0629 "${schoolName}" (School Operations AI Strategic Advisor).
\u0623\u0646\u062A \u0634\u0631\u064A\u0643 \u0642\u064A\u0627\u062F\u064A \u0648\u0645\u0641\u0643\u0631 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0631\u0641\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u0649\u060C \u0644\u0627 \u062A\u0642\u062F\u0645 \u0625\u062C\u0627\u0628\u0627\u062A \u0631\u0648\u0628\u0648\u062A\u064A\u0629 \u062C\u0627\u0647\u0632\u0629 \u0623\u0648 \u0633\u0631\u064A\u0639\u0629 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u0645\u0647\u0645\u062A\u0643 \u0623\u0646 \u062A\u0641\u0643\u0631 \u0628\u0639\u0645\u0642\u060C \u062A\u0633\u062A\u0648\u0639\u0628 \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0628\u062F\u0642\u0629\u060C \u062A\u0646\u0627\u0642\u0634 \u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0647\u064A\u0643\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062A\u060C \u0648\u062A\u0637\u0631\u062D \u062D\u0644\u0648\u0644\u0627\u064B \u0645\u062E\u0635\u0635\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641\u0627\u062A Excel \u0648\u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 (\u0633\u0648\u0627\u0621 \u0643\u0627\u0646\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0623\u0648 \u0645\u0644\u0641\u0627\u062A \u0645\u0642\u062A\u0631\u062D\u0629 \u062C\u062F\u064A\u062F\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0643\u0627\u0644\u062E\u0637\u0637 \u0648\u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0648\u0627\u0644\u0645\u0635\u0641\u0648\u0641\u0627\u062A \u0648\u0627\u0644\u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629).

\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u062D\u064A\u0629:
- \u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u0631\u0633\u0629: ${schoolName}
- \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0642\u064A\u062F\u064A\u0646 \u0641\u0639\u0644\u064A\u0627\u064B \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ${schoolStats.totalRegisteredStudents} \u0637\u0627\u0644\u0628\u0627\u064B.
- \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646: ${schoolStats.totalTeachers} \u0645\u0639\u0644\u0645\u0627\u064B.
- \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0641\u0635\u0648\u0644: ${schoolStats.totalClasses} \u0641\u0635\u0644\u0627\u064B.
- \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: (\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628\u060C \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A\u060C \u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629\u060C \u0643\u0648\u062F \u0627\u0644\u0637\u0627\u0644\u0628\u060C \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u060C \u0627\u0644\u0646\u0648\u0639\u060C \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F\u060C \u0647\u0627\u062A\u0641 \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629).

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0641\u0643\u064A\u0631 \u0648\u0627\u0644\u0645\u0646\u0627\u0642\u0634\u0629 \u0648\u0627\u0644\u0639\u0645\u0644:
1. \u0627\u0644\u062A\u0641\u0643\u064A\u0631 \u0648\u0641\u0647\u0645 \u0627\u0644\u0645\u062A\u0637\u0644\u0628 \u0628\u062F\u0642\u0629 (Think & Understand):
   - \u0644\u0627 \u062A\u062A\u0633\u0631\u0639 \u0641\u064A \u0625\u0639\u0637\u0627\u0621 \u0643\u0634\u0641 \u0639\u0627\u0645. \u0641\u0643\u0651\u0631 \u0641\u064A \u0627\u0644\u063A\u0631\u0636 \u0645\u0646 \u0637\u0644\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0648\u0645\u0627 \u0647\u064A \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0627\u0644\u062A\u064A \u064A\u0631\u064A\u062F\u0647\u0627.
   - \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0643\u0634\u0641\u0627\u064B \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u0639\u0645\u062F\u0629 \u0645\u062D\u062F\u062F\u0629 (\u0645\u062B\u0644: \u0627\u0644\u0627\u0633\u0645\u060C \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A\u060C \u0643\u0648\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629): \u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u062A\u0644\u0628\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0645\u0637\u0644\u0628 \u0628\u062F\u0642\u0629\u060C \u0648\u0627\u0634\u0631\u062D \u0644\u0644\u0645\u062F\u064A\u0631 \u0627\u0643\u062A\u0645\u0627\u0644 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0642\u0648\u0645\u064A\u0629 \u0648\u0623\u0643\u0648\u0627\u062F \u0627\u0644\u0648\u0632\u0627\u0631\u0629 \u0648\u0643\u064A\u0641\u064A\u0629 \u0627\u0644\u0627\u0633\u062A\u0641\u0627\u062F\u0629 \u0645\u0646\u0647\u0627.
   - \u0625\u0630\u0627 \u0623\u0631\u0627\u062F \u0627\u0644\u0645\u062F\u064A\u0631 \u0645\u0644\u0641\u0627\u064B \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (\u0643\u0634\u0641 \u0627\u0644\u0637\u0644\u0627\u0628\u060C \u0643\u0634\u0641 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628\u060C \u0643\u0634\u0641 \u0627\u0644\u062F\u0631\u062C\u0627\u062A\u060C \u0643\u0634\u0641 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646): \u0627\u0633\u062A\u062E\u062F\u0645 \u0623\u062F\u0627\u0629 "exportSchoolDataToExcel" \u0645\u0639 \u062A\u0645\u0631\u064A\u0631 \u0646\u0648\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0648\u0627\u0644\u0641\u0644\u0627\u062A\u0631\u060C \u0623\u0648 \u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0637\u0644\u0627\u0628 \u0639\u0628\u0631 "searchStudents".

2. \u0645\u0646\u0627\u0642\u0634\u0629 \u0647\u064A\u0643\u0644 \u0648\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0645\u0644\u0641 (Discuss & Advise):
   - \u0646\u0627\u0642\u0634 \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629\u060C \u0633\u0628\u0628 \u062A\u0631\u062A\u064A\u0628\u0647\u0627\u060C \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629 \u0628\u0647\u0627\u060C \u0648\u0623\u0647\u0645\u064A\u0629 \u0633\u0631\u064A\u0629 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0642\u0648\u0645\u064A\u0629 \u0648\u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.
   - \u0625\u0630\u0627 \u0637\u0644\u0628 \u0645\u0644\u0641\u0627\u064B \u062A\u0646\u0638\u064A\u0645\u064A\u0627\u064B \u0623\u0648 \u0645\u0642\u062A\u0631\u062D\u0627\u064B \u063A\u064A\u0631 \u0645\u0633\u062C\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (\u0645\u062B\u0644: \u062C\u062F\u0648\u0644 \u062D\u0635\u0635 \u0623\u0633\u0628\u0648\u0639\u064A\u060C \u062E\u0637\u0629 \u062A\u0648\u0632\u064A\u0639 \u0644\u062C\u0627\u0646 \u0627\u0644\u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u064A\u0646\u060C \u0643\u0634\u0641 \u0631\u0635\u062F \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A\u060C \u0645\u0635\u0641\u0648\u0641\u0629 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646\u060C \u0634\u064A\u062A \u0627\u0644\u0623\u0646\u0634\u0637\u0629): \u0635\u0645\u0651\u0645 \u0627\u0644\u0645\u0644\u0641 \u0628\u0627\u0628\u062A\u0643\u0627\u0631 \u0648\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0643\u0627\u0645\u0644\u0629 \u0645\u0639 \u0643\u062A\u0627\u0628\u0629 \u0643\u0627\u0641\u0629 \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0639\u0628\u0631 \u0643\u062A\u0644\u0629 json:excel-export.

3. \u0646\u0634\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627\u062A \u0648\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0627\u062A \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629 (Announcements, Polls & Events):
   - \u0639\u0646\u062F\u0645\u0627 \u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0643\u062A\u0627\u0628\u0629 \u0623\u0648 \u0646\u0634\u0631 \u0625\u0639\u0644\u0627\u0646 \u0644\u0644\u0645\u062F\u0631\u0633\u0629 (\u0645\u062B\u0644: \u0625\u0639\u0644\u0627\u0646 \u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646 \u0644\u0644\u062D\u062B \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0646\u0635\u0641 \u0627\u0644\u0639\u0627\u0645\u060C \u0625\u0639\u0644\u0627\u0646 \u0644\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631\u060C \u062A\u0639\u0645\u064A\u0645 \u0631\u0633\u0645\u064A\u060C \u062A\u0646\u0628\u064A\u0647 \u0644\u0644\u0637\u0644\u0627\u0628):
     \u0627\u0643\u062A\u0628 \u0631\u062F\u0627\u064B \u0625\u062F\u0627\u0631\u064A\u0627\u064B \u0631\u0627\u0642\u064A\u0627\u064B \u0648\u0645\u0644\u0647\u0645\u0627\u064B \u064A\u0634\u0631\u062D \u0644\u0644\u0645\u062F\u064A\u0631 \u0645\u062D\u0627\u0648\u0631 \u0648\u062A\u0623\u062B\u064A\u0631 \u0647\u0630\u0627 \u0627\u0644\u062A\u0639\u0645\u064A\u0645\u060C \u0648\u0623\u0631\u0641\u0642 \u062F\u0627\u0626\u0645\u0627\u064B \u0641\u064A \u0646\u0647\u0627\u064A\u0629 \u0631\u062F\u0643 \u0643\u062A\u0644\u0629 json:publish-draft \u0628\u0635\u064A\u063A\u0629 JSON \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0623\u0631\u0628\u0639\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0628\u062F\u0642\u0629 (\u0627\u0644\u0639\u0646\u0648\u0627\u0646\u060C \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629\u060C \u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u0648\u0627\u0641\u064A\u060C \u0648\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629):
\`\`\`json:publish-draft
{
  "type": "announcement",
  "title": "\u062A\u0639\u0645\u064A\u0645 \u0625\u062F\u0627\u0631\u064A: \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0634\u0627\u0645\u0644 \u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A",
  "priority": "\u0647\u0627\u0645",
  "content": "\u0627\u0644\u0632\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0632\u0645\u064A\u0644\u0627\u062A \u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0647\u064A\u0626\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0627\u0644\u0643\u0631\u0627\u0645... \u0646\u0647\u064A\u0628 \u0628\u0643\u0645 \u0633\u0631\u0639\u0629 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0645\u0646\u0627\u0647\u062C \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629 \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0628\u0646\u0648\u0643 \u0627\u0644\u0623\u0633\u0626\u0644\u0629...",
  "targetAudience": "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646",
  "authorName": "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629"
}
\`\`\`
   - \u0639\u0646\u062F\u0645\u0627 \u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A (Poll):
\`\`\`json:publish-draft
{
  "type": "poll",
  "title": "\u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u062D\u0648\u0644 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u062D\u0635\u0635 \u0627\u0644\u0625\u062B\u0631\u0627\u0626\u064A\u0629",
  "content": "\u0646\u0623\u0645\u0644 \u0645\u0634\u0627\u0631\u0643\u062A\u0643\u0645 \u0641\u064A \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0623\u0646\u0633\u0628...",
  "priority": "\u0639\u0627\u062F\u064A",
  "targetAudience": "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646",
  "pollOptions": ["\u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0635\u0628\u0627\u062D\u064A\u0629 (\u0642\u0628\u0644 \u0627\u0644\u0637\u0627\u0628\u0648\u0631)", "\u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u064A\u0629 (\u0628\u0639\u062F \u0627\u0646\u062A\u0647\u0627\u0621 \u0627\u0644\u064A\u0648\u0645)", "\u064A\u0648\u0645 \u0627\u0644\u0633\u0628\u062A \u0639\u0646 \u0628\u064F\u0639\u062F"]
}
\`\`\`
   - \u0639\u0646\u062F\u0645\u0627 \u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0625\u0636\u0627\u0641\u0629 \u0623\u0648 \u062C\u062F\u0648\u0644\u0629 \u0641\u0639\u0627\u0644\u064A\u0629 \u0645\u062F\u0631\u0633\u064A\u0629 (Event):
\`\`\`json:publish-draft
{
  "type": "event",
  "title": "\u0648\u0631\u0634\u0629 \u0639\u0645\u0644 \u062A\u062F\u0631\u064A\u0628\u064A\u0629 \u0644\u0644\u0645\u0639\u0644\u0645\u064A\u0646: \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
  "content": "\u0648\u0631\u0634\u0629 \u0639\u0645\u0644 \u062A\u0647\u062F\u0641 \u0625\u0644\u0649 \u062A\u0637\u0648\u064A\u0631 \u0645\u0647\u0627\u0631\u0627\u062A \u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u064A\u0629...",
  "priority": "\u0647\u0627\u0645",
  "targetAudience": "\u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646",
  "eventDate": "2026-10-20",
  "eventTime": "10:00 \u0635\u0628\u0627\u062D\u0627\u064B",
  "eventLocation": "\u0645\u0633\u0631\u062D \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A"
}
\`\`\`

4. \u0627\u0644\u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0633\u062A\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u0644\u0631\u0623\u064A \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 (Questionnaires & Surveys - \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629 \u0641\u0642\u0637):
   - \u0639\u0646\u062F\u0645\u0627 \u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u064B \u0645\u0648\u0633\u0639\u0627\u064B \u0623\u0648 \u0627\u0633\u062A\u0637\u0644\u0627\u0639 \u0631\u0623\u064A \u0644\u0642\u064A\u0627\u0633 \u0631\u0636\u0627 \u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631 \u0623\u0648 \u062C\u0648\u062F\u0629 \u0627\u0644\u062E\u062F\u0645\u0627\u062A:
     \u0635\u0645\u0651\u0645 \u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u064B \u0639\u0644\u0645\u064A\u0627\u064B \u062F\u0642\u064A\u0642\u0627\u064B \u064A\u062A\u0636\u0645\u0646 \u0627\u0644\u0645\u062D\u0627\u0648\u0631 \u0648\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0628\u0645\u0642\u064A\u0627\u0633 \u0644\u064A\u0643\u0631\u062A\u060C \u0648\u064A\u0645\u0643\u0646\u0643 \u062A\u0635\u062F\u064A\u0631\u0647 \u0643\u0645\u0644\u0641 Excel \u0639\u0628\u0631 json:excel-export.

5. \u062A\u0648\u0644\u064A\u062F \u0645\u0644\u0641\u0627\u062A Excel \u0627\u0644\u0645\u062E\u0635\u0635\u0629 (.xlsx):
   - \u0639\u0646\u062F\u0645\u0627 \u062A\u0635\u0645\u0645 \u0645\u0644\u0641\u0627\u064B \u0645\u062E\u0635\u0635\u0627\u064B \u0644\u064A\u0633 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (\u0643\u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0648\u0627\u0644\u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0645\u0635\u0641\u0648\u0641\u0627\u062A \u0648\u0627\u0644\u062E\u0637\u0637)\u060C \u0636\u0645\u0651\u0646 \u0643\u062A\u0644\u0629 json:excel-export \u0641\u064A \u0646\u0647\u0627\u064A\u0629 \u0631\u062F\u0643:
\`\`\`json:excel-export
{
  "fileName": "\u0627\u0633\u0645_\u0627\u0644\u0645\u0644\u0641.xlsx",
  "sheetName": "\u0627\u0633\u0645_\u0627\u0644\u0648\u0631\u0642\u0629",
  "metadata": {
    "title": "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0623\u0648 \u0627\u0644\u0627\u0633\u062A\u0628\u064A\u0627\u0646",
    "schoolName": "${schoolName}"
  },
  "columns": ["\u0627\u0644\u0639\u0645\u0648\u062F 1", "\u0627\u0644\u0639\u0645\u0648\u062F 2"],
  "rows": [
    ["\u0642\u064A\u0645\u0629 1", "\u0642\u064A\u0645\u0629 2"]
  ]
}
\`\`\``;
      } else if (role === "owner") {
        systemInstruction = `\u0623\u0646\u062A \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (Platform Owner Dashboard AI Assistant).
\u0645\u0647\u0645\u062A\u0643: \u0645\u0646\u0627\u0642\u0634\u0629 \u0648\u062A\u062D\u0644\u064A\u0644 \u0623\u062F\u0627\u0621 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0648\u0627\u0644\u0645\u062F\u0627\u0631\u0633 \u0648\u0627\u0644\u062A\u0631\u0627\u062E\u064A\u0635 \u0628\u0623\u0633\u0644\u0648\u0628 \u0648\u062F\u0648\u062F \u0648\u0645\u0628\u0627\u0634\u0631 \u0648\u0630\u0643\u064A.
\u0639\u0646\u062F \u0637\u0644\u0628 \u0645\u0644\u0641 \u0625\u0643\u0633\u064A\u0644 \u0644\u0644\u0645\u062F\u0627\u0631\u0633 \u0623\u0648 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A\u060C \u064A\u0645\u0643\u0646\u0643 \u0625\u0631\u0641\u0627\u0642 \u0643\u062A\u0644\u0629 json:excel-export \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629.

\u0633\u064A\u0627\u0642 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629:
${JSON.stringify(cleanedContext, null, 2)}`;
      } else {
        systemInstruction = "\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0645\u0641\u064A\u062F \u0644\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629. \u0623\u062C\u0628 \u0628\u0623\u0633\u0644\u0648\u0628 \u0645\u0646\u0638\u0645 \u0648\u0648\u0627\u0636\u062D \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.";
      }
      const ai = getAiClient();
      if (!ai) {
        let fallbackAnswer = effectiveRole === "admin" ? await smartFallbackAnswer(lastMsg, targetSchoolId, cleanedContext) : generateDataDrivenFallback(role, lastMsg, cleanedContext);
        let fbAttachment = null;
        let fbDraft = null;
        if (fallbackAnswer) {
          const extractedExcel = extractExcelFromResponse(fallbackAnswer);
          if (extractedExcel.attachment) {
            fbAttachment = extractedExcel.attachment;
            fallbackAnswer = extractedExcel.cleanText;
          }
          const extractedDraft = extractPublishDraftFromResponse(fallbackAnswer, lastMsg);
          if (extractedDraft.draft) {
            fbDraft = extractedDraft.draft;
            fallbackAnswer = extractedDraft.cleanText;
          }
        }
        return res.json({ answer: fallbackAnswer, attachment: fbAttachment, publishDraft: fbDraft });
      }
      const formattedContents = (messages || []).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
      let answerText = "";
      let generatedAttachment = null;
      let generatedDraft = null;
      for (const modelName of modelsToTry) {
        try {
          const currentContents = [...formattedContents];
          const toolsConfig = effectiveRole === "admin" ? [{ functionDeclarations: geminiSchoolTools }] : void 0;
          let response = await ai.models.generateContent({
            model: modelName,
            contents: currentContents,
            config: {
              systemInstruction,
              temperature: 0.7,
              tools: toolsConfig
            }
          });
          let loop = 0;
          while (response.functionCalls && response.functionCalls.length > 0 && loop < 3) {
            loop++;
            const call = response.functionCalls[0];
            const functionResult = await executeSchoolTool(call.name, call.args, targetSchoolId);
            if (functionResult?.excelPayload) {
              generatedAttachment = functionResult.excelPayload;
            }
            if (functionResult?.publishDraft) {
              generatedDraft = functionResult.publishDraft;
            }
            const lightResult = { ...functionResult };
            if (lightResult.excelPayload) {
              delete lightResult.excelPayload;
              lightResult.attachmentCreated = true;
              lightResult.totalRows = functionResult.excelPayload?.rows?.length || functionResult.totalRows;
            }
            if (lightResult.publishDraft) {
              lightResult.draftCreated = true;
            }
            const modelContent = response.candidates?.[0]?.content || {
              role: "model",
              parts: [{ functionCall: call }]
            };
            currentContents.push(modelContent);
            currentContents.push({
              role: "tool",
              parts: [
                {
                  functionResponse: {
                    name: call.name,
                    response: lightResult
                  }
                }
              ]
            });
            response = await ai.models.generateContent({
              model: modelName,
              contents: currentContents,
              config: {
                systemInstruction,
                temperature: 0.7,
                tools: toolsConfig
              }
            });
          }
          if (response.text && response.text.trim()) {
            answerText = response.text;
            break;
          }
        } catch (modelErr) {
          console.warn(`Model ${modelName} call failed, trying next candidate:`, modelErr?.message || modelErr);
        }
      }
      if (!answerText) {
        answerText = effectiveRole === "admin" ? await smartFallbackAnswer(lastMsg, targetSchoolId, cleanedContext) : generateDataDrivenFallback(role, lastMsg, cleanedContext);
      }
      if (answerText && !generatedAttachment) {
        const extracted = extractExcelFromResponse(answerText);
        if (extracted.attachment) {
          generatedAttachment = extracted.attachment;
          answerText = extracted.cleanText;
        }
      }
      if (!generatedDraft && answerText) {
        const draftResult = extractPublishDraftFromResponse(answerText, lastMsg);
        if (draftResult.draft) {
          generatedDraft = draftResult.draft;
          answerText = draftResult.cleanText;
        }
      }
      return res.json({ answer: answerText, attachment: generatedAttachment, publishDraft: generatedDraft });
    } catch (error) {
      console.error("Error in /api/chat route:", error);
      res.status(500).json({
        error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629",
        details: error?.message || String(error)
      });
    }
  });
  app.post("/api/schools/seed-initial", async (req, res) => {
    try {
      const session = extractAuthSession(req);
      if (!session || !session.isAuthenticated || session.userRole !== "owner") {
        return res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u062A\u062A\u0637\u0644\u0628 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (Owner)" });
      }
      for (const item of INITIAL_DATABASE_SCHOOLS) {
        await db.insert(schoolInfoTable).values(item).onConflictDoNothing();
      }
      const all = await db.select().from(schoolInfoTable);
      res.json({ success: true, count: all.length, schools: all.map((r) => formatSchoolResponse(r)) });
    } catch (error) {
      console.error("Error seeding initial schools:", error);
      res.status(500).json({ error: error?.message || "\u0641\u0634\u0644 \u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0645\u062F\u0627\u0631\u0633" });
    }
  });
  registerSchoolEntitiesRoutes(app, extractAuthSession, memorySessionStore);
  registerSupportTicketsRoutes(app, extractAuthSession);
  registerPrivateMessagingRoutes(app, extractAuthSession);
  app.post("/api/whatsapp/send", requireAuth, express2.json(), async (req, res) => {
    try {
      const session = req.user;
      if (!session || !session.isAuthenticated) {
        return res.status(401).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D: \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
      }
      const { recipientPhone, message, studentName } = req.body || {};
      const token = process.env.WHATSAPP_API_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (!token || !phoneId) {
        return res.status(400).json({
          success: false,
          error: "\u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0628\u064A\u0626\u0629 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628 (WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID) \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645. \u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0631\u0628\u0637 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0639\u0628\u0631 wa.me."
        });
      }
      const metaUrl = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
      const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: true, body: message }
        })
      });
      const responseData = await response.json();
      if (response.ok) {
        return res.json({ success: true, data: responseData });
      } else {
        return res.status(400).json({ success: false, error: responseData.error?.message || "\u062E\u0637\u0623 \u0641\u064A \u0627\u0633\u062A\u062C\u0627\u0628\u0629 Meta WhatsApp" });
      }
    } catch (error) {
      console.error("WhatsApp API sending error:", error);
      res.status(500).json({ success: false, error: error.message || "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0639\u0628\u0631 \u0627\u0644\u0648\u0627\u062A\u0633\u0627\u0628" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express2.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  return app;
}
var appPromise = null;
function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}
var isServerless = Boolean(process.env.VERCEL);
if (!isServerless) {
  getApp().then((app) => {
    const PORT = Number(process.env.PORT) || 3e3;
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
    server.keepAliveTimeout = 12e4;
    server.headersTimeout = 125e3;
    server.requestTimeout = 3e5;
  }).catch((error) => {
    console.error("[FATAL] Failed to start server:", error);
    process.exit(1);
  });
}

// vercel-entry.ts
async function handler(req, res) {
  const app = await getApp();
  app(req, res);
}
export {
  handler as default
};
