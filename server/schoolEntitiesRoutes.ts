import express from 'express';
import crypto from 'crypto';
import { db } from '../src/db/index.ts';
import {
  checkAuthRateLimit,
  recordAuthFailure,
  recordAuthSuccess,
  buildIdentifierKey,
} from './authRateLimiter.ts';
import {
  schoolInfoTable,
  classesTable,
  studentsTable,
  teachersTable,
  subjectsTable,
  attendanceTable,
  gradesTable,
  behaviorTable,
  parentsTable,
  announcementsTable,
  homeworkTable,
  badgesTable,
  studentBadgesTable,
  teacherBadgesTable,
  adminActionsTable,
  smartSuspensionAlertsTable,
  smartSuspensionAuditLogsTable,
  calendarTasksTable,
  communityMessagesTable,
  communityMutesTable,
  communityLocksTable,
  attendanceSessionsTable,
  trustedDeviceSessionsTable,
  usersTable,
  smsLogsTable,
  supportTicketsTable,
  supportTicketRepliesTable,
  privateConversationsTable,
  privateMessagesTable,
  schoolExtensionsTable,
  infractionMemosTable,
} from '../src/db/schema.ts';
import { eq, ne, and, sql, desc, ilike, or, inArray, lt, gte, lte, isNull } from 'drizzle-orm';

import {
  AUTH_SECRET,
  createSignedSessionToken,
  verifySignedSessionToken,
  verifyPassword,
  hashPassword,
  memorySessionStore,
} from './serverAuth.ts';
import type { InMemorySession } from './serverAuth.ts';
import { getStudentPoints, getSchoolLeaderboard } from './studentPointsService.ts';
import {
  getSchoolExtensions,
  updateSchoolExtension,
  getSchoolFeaturesSummary,
  invalidateSchoolExtensionsCache,
} from './schoolExtensionsService.ts';
import { requireSchoolFeature } from './extensionGuards.ts';
import { mapEgyptianSheetName, deriveGradeFromNationalId } from '../src/lib/egyptianSchoolUtils.ts';
import { PRELOADED_BADGES } from '../src/data/preloadedBadges.ts';

function getBadgeDefinitionFallback(badgeId: string, schoolId: string, targetType: 'student' | 'teacher' = 'student') {
  const preloaded = PRELOADED_BADGES.find(
    (pb) => `preloaded-${pb.packId}` === badgeId || pb.packId === badgeId || pb.name === badgeId
  );
  if (preloaded) {
    return {
      name: preloaded.name,
      nameEn: preloaded.nameEn || '',
      description: preloaded.description,
      icon: preloaded.icon,
      color: preloaded.color,
      rarity: preloaded.rarity,
      targetType: preloaded.targetType || targetType,
      isActive: true,
      hasAnimatedBorder: preloaded.hasAnimatedBorder ?? true,
      limitType: preloaded.limitType || 'none',
      maxQuantity: preloaded.maxQuantity || 0,
      isHidden: false,
    };
  }

  const defaultBadgesMap: Record<string, any> = {
    'badge-owner-excellence': { name: '👑 وسام الإدارة العليا والمالك', nameEn: 'Owner & Executive Leadership', description: 'وسام شرفي مخصص لمسؤولي وإدارة المنظومة', icon: '👑', color: '#D4AF37', rarity: 'Mythical', targetType: 'admin', isActive: true, hasAnimatedBorder: true, limitType: 'forever', maxQuantity: 3, isHidden: false },
    'badge-owner-mythical': { name: '👑 وسام الإدارة العليا والمالك', nameEn: 'Owner & Executive Leadership', description: 'وسام شرفي مخصص لمسؤولي وإدارة المنظومة', icon: '👑', color: '#D4AF37', rarity: 'Mythical', targetType: 'admin', isActive: true, hasAnimatedBorder: true, limitType: 'forever', maxQuantity: 3, isHidden: false },
    'badge-student-excellence': { name: '🏆 وسام التفوق والاجتهاد', nameEn: 'Excellence & Diligence', description: 'وسام تقديري يُمنح للطالب تقديراً لتفوقه واجتهاده الدراسي وانضباطه', icon: '🏆', color: '#F59E0B', rarity: 'Epic', targetType: 'student', isActive: true, hasAnimatedBorder: true, limitType: 'none', maxQuantity: 0, isHidden: false },
    'badge-monthly-star': { name: '🌟 نجم الشهر المتميز', nameEn: 'Monthly Star', description: 'وسام تقديري يتجدد شهرياً لأفضل الطلاب متفوقين', icon: '🌟', color: '#8B5CF6', rarity: 'Legendary', targetType: 'student', isActive: true, hasAnimatedBorder: true, limitType: 'monthly', maxQuantity: 5, isHidden: false },
    'badge-star-monthly': { name: '🌟 نجم الشهر المتميز', nameEn: 'Monthly Star', description: 'وسام تقديري يتجدد شهرياً لأفضل الطلاب متفوقين', icon: '🌟', color: '#8B5CF6', rarity: 'Legendary', targetType: 'student', isActive: true, hasAnimatedBorder: true, limitType: 'monthly', maxQuantity: 5, isHidden: false },
    'badge-teacher-creative': { name: '🏅 المعلم المبدع والقدوة', nameEn: 'Exemplary Teacher', description: 'وسام التميز والتفاني في إلهام الطلاب والابتكار في التدريس', icon: '🏅', color: '#2563EB', rarity: 'Legendary', targetType: 'teacher', isActive: true, hasAnimatedBorder: true, limitType: 'none', maxQuantity: 0, isHidden: false },
    'badge-attendance-guardian': { name: '🎯 حارس الانضباط الميداني', nameEn: 'Field Guardian', description: 'وسام الدقة العالية والأمانة في توثيق الحضور والغياب اليومي', icon: '🎯', color: '#059669', rarity: 'Mythical', targetType: 'teacher', isActive: true, hasAnimatedBorder: true, limitType: 'none', maxQuantity: 0, isHidden: false },
  };
  defaultBadgesMap[`badge-owner-${schoolId}`] = defaultBadgesMap['badge-owner-excellence'];
  defaultBadgesMap[`badge-star-${schoolId}`] = defaultBadgesMap['badge-monthly-star'];
  defaultBadgesMap[`badge-student-excellence-${schoolId}`] = defaultBadgesMap['badge-student-excellence'];
  defaultBadgesMap[`badge-teacher-creative-${schoolId}`] = defaultBadgesMap['badge-teacher-creative'];
  defaultBadgesMap[`badge-attendance-guardian-${schoolId}`] = defaultBadgesMap['badge-attendance-guardian'];

  return defaultBadgesMap[badgeId] || {
    name: targetType === 'teacher' ? '🏅 وسام تقديري للمعلم' : '🏆 وسام تقديري',
    nameEn: targetType === 'teacher' ? 'Teacher Recognition' : 'Achievement Badge',
    description: 'وسام تقديري للتميز والاجتهاد',
    icon: targetType === 'teacher' ? '🏅' : '🏆',
    color: targetType === 'teacher' ? '#2563EB' : '#F59E0B',
    rarity: 'Epic',
    targetType,
    isActive: true,
    hasAnimatedBorder: true,
    limitType: 'none',
    maxQuantity: 0,
    isHidden: false,
  };
}

function normalizeArabicText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

function isAnnouncementVisibleToRole(
  targetAudience: string | undefined | null,
  role: string | undefined | null
): boolean {
  if (!targetAudience) return true;
  const target = targetAudience.trim();
  const r = (role || '').trim().toLowerCase();

  // Admin and Owner see all announcements
  if (r === 'school_admin' || r === 'owner' || r === 'admin') {
    return true;
  }

  // Everyone / General announcements are visible to all roles
  if (
    target === 'الجميع' ||
    target === 'الجميع (المعلمين والطلاب)' ||
    target === 'جميع المدارس' ||
    target === 'كافة المستخدمين' ||
    target === 'all' ||
    target === 'everyone'
  ) {
    return true;
  }

  // For Student / Parent
  if (r === 'student' || r === 'parent') {
    // If targeted strictly to teachers or staff, student/parent must NOT see it
    if (
      target === 'المعلمين فقط' ||
      target === 'المعلمين' ||
      target === 'المعلمات' ||
      target === 'كادر المدرسة' ||
      target === 'الكادر التعليمي' ||
      target === 'teachers' ||
      target === 'staff'
    ) {
      return false;
    }
    // If targeted to students / parents
    if (
      target === 'الطلاب فقط' ||
      target === 'الطلاب' ||
      target === 'أولياء الأمور' ||
      target === 'اولياء الامور' ||
      target.includes('طلاب') ||
      target.includes('طالب') ||
      target.includes('أولياء') ||
      target.includes('اولياء')
    ) {
      return true;
    }
    return false;
  }

  // For Teacher / Attendance Teacher
  if (r === 'teacher' || r === 'attendance_teacher') {
    // If targeted strictly to students or parents, teachers must NOT see it
    if (
      target === 'الطلاب فقط' ||
      target === 'الطلاب' ||
      target === 'أولياء الأمور' ||
      target === 'اولياء الامور' ||
      target === 'students' ||
      target === 'parents'
    ) {
      return false;
    }
    // If targeted to teachers / staff
    if (
      target === 'المعلمين فقط' ||
      target === 'المعلمين' ||
      target === 'المعلمات' ||
      target === 'كادر المدرسة' ||
      target === 'الكادر التعليمي' ||
      target.includes('معلم') ||
      target.includes('معلمات') ||
      target.includes('كادر') ||
      target.includes('موظف')
    ) {
      return true;
    }
    return false;
  }

  return true;
}

export function registerSchoolEntitiesRoutes(
  app: express.Express,
  extractAuthSession: (req: express.Request) => any,
  memorySessionStore: Map<string, any>
) {
  interface CommunitySSEClient {
    id: string;
    res: express.Response;
    schoolId: string;
    communityId?: string;
    userId: string;
    userRole: string;
  }

  const communitySSEClients = new Map<string, CommunitySSEClient>();

  // Background asynchronous cleaner for any orphaned records from previously deleted schools
  (async () => {
    try {
      const tables = [
        'support_ticket_replies',
        'support_tickets',
        'private_messages',
        'private_conversations',
        'smart_suspension_audit_logs',
        'smart_suspension_alerts',
        'admin_actions',
        'sms_logs',
        'trusted_device_sessions',
        'teacher_badges',
        'student_badges',
        'badges',
        'homework',
        'announcements',
        'calendar_tasks',
        'community_locks',
        'community_mutes',
        'community_messages',
        'attendance',
        'attendance_sessions',
        'grades',
        'behavior',
        'parents',
        'students',
        'subjects',
        'teachers',
        'classes',
        'school_extensions',
        'users',
      ];
      for (const t of tables) {
        await db.execute(sql.raw(`
          DELETE FROM ${t} 
          WHERE school_id IS NOT NULL 
            AND school_id NOT IN (SELECT school_id FROM school_info)
        `));
      }
    } catch (e: any) {
      console.warn('[ORPHAN CLEANUP] Non-blocking notice:', e?.message || e);
    }
  })();

  // ----------------------------------------------------
  // AUTHENTICATION & TENANT ACCESS MIDDLEWARES
  // ----------------------------------------------------
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = extractAuthSession(req);
    if (!session || !session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح: يرجى تسجيل الدخول أولاً للوصول للبيانات',
      });
    }
    (req as any).user = session;
    next();
  };

  const requireSchoolAccess = (allowedRoles?: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as any).user || extractAuthSession(req);
      if (!user || !user.isAuthenticated) {
        return res.status(401).json({
          success: false,
          error: 'غير مصرح: يرجى تسجيل الدخول أولاً',
        });
      }

      const targetSchoolId = req.params.schoolId;
      const role = user.userRole;
      const isGlobalAdmin = role === 'owner' || role === 'super_admin';

      // Check role permissions if specified
      if (allowedRoles && allowedRoles.length > 0) {
        let hasRole = allowedRoles.includes(role);
        if (!hasRole && (role === 'admin' || role === 'school_admin')) {
          hasRole = allowedRoles.includes('admin') || allowedRoles.includes('school_admin');
        }

        if (!hasRole && !isGlobalAdmin) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: لا تملك الصلاحية اللازمة لتنفيذ هذه العملية',
          });
        }
      }

      // Owner and Super Admin have full multi-tenant access across all schools
      if (isGlobalAdmin) {
        return next();
      }

      // Admin / School Admin access
      if (role === 'school_admin' || role === 'admin') {
        if (!user.schoolId || user.schoolId === targetSchoolId || targetSchoolId === 'default-school' || user.schoolId === 'default-school') {
          return next();
        }
      }

      // Strict multi-tenant isolation check for specific non-matching school IDs
      if (targetSchoolId && user.schoolId && user.schoolId !== targetSchoolId && user.schoolId !== 'default-school' && targetSchoolId !== 'default-school') {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح: لا تملك صلاحية الوصول لبيانات هذه المدرسة (انتهاك العزل بين المدارس)',
        });
      }

      next();
    };
  };

  // Helper: Verify platform owner credentials
  const isOwnerCredentials = (identifier: string, password: string): boolean => {
    if (!identifier || !password) return false;
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Primary Owner Account: mohmedrafeh21@gmail.com / M2012@Rafeh
    if (cleanId === 'mohmedrafeh21@gmail.com' && cleanPass === 'M2012@Rafeh') {
      return true;
    }

    // 2. Env variable credentials (if specified)
    const envEmail = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
    const envPass = (process.env.OWNER_PASSWORD || '').trim();
    if (envEmail && envPass && cleanId === envEmail && cleanPass === envPass) {
      return true;
    }

    // 3. Platform default owner account (owner@schoolplatform.eg)
    if (cleanId === 'owner@schoolplatform.eg' && (cleanPass === 'password123' || cleanPass === 'M2012@Rafeh' || (envPass && cleanPass === envPass))) {
      return true;
    }

    return false;
  };

  // Helper: Issue authenticated session for Platform Owner
  const createOwnerAuthResponse = async (
    req: express.Request,
    res: express.Response,
    trustDevice300Days: boolean,
    deviceId: string
  ) => {
    const sessionId = `tds_own_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    const durationDays = trustDevice300Days ? 300 : 1;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const sessionToken = createSignedSessionToken({
      sessionId,
      deviceId,
      userId: 'owner_master',
      userRole: 'owner',
      userDisplayName: 'مالك المنظومة (م. محمد رافح)',
      expiresAt,
    });

    // Cache in memory
    memorySessionStore.set(sessionToken, {
      sessionId,
      deviceId,
      userId: 'owner_master',
      userRole: 'owner',
      userDisplayName: 'مالك المنظومة',
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    memorySessionStore.set(sessionId, {
      id: sessionId,
      deviceId,
      userId: 'owner_master',
      userRole: 'owner',
      userDisplayName: 'مالك المنظومة',
      tokenHash: crypto.createHash('sha256').update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest('hex'),
      deviceName: 'متصفح مالك المنظومة',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      expiresAt,
    });

    // Persist to Cloud SQL trustedDeviceSessionsTable
    try {
      await db.insert(trustedDeviceSessionsTable).values({
        id: sessionId,
        deviceId,
        userId: 'owner_master',
        userRole: 'owner',
        schoolId: null,
        schoolName: 'المنظومة المركزية',
        userDisplayName: 'مالك المنظومة',
        tokenHash: crypto.createHash('sha256').update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest('hex'),
        deviceName: 'متصفح مالك المنظومة',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt,
      });
    } catch (dbErr) {
      // Safe fallback
    }

    return res.json({
      success: true,
      userRole: 'owner',
      userDisplayName: 'مالك المنظومة',
      schoolId: 'sch-1',
      sessionToken,
      sessionId,
      expiresAt,
      message: 'تم تسجيل الدخول بنجاح كمالك للمنظومة',
    });
  };

  // ----------------------------------------------------
  // -1. PLATFORM OWNER AUTH ENDPOINT
  // ----------------------------------------------------
  app.post('/api/auth/owner-login', async (req, res) => {
    try {
      const {
        email,
        password,
        trustDevice300Days = true,
        deviceId = 'dev_unknown',
      } = req.body || {};

      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      const identifierKey = buildIdentifierKey('owner', cleanEmail || 'unknown');

      // Check Rate Limit & Temporary Cooldown
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات غير الصحيحة.',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        });
      }

      if (!cleanEmail || !cleanPass) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور لمالك المنظومة',
        });
      }

      if (!isOwnerCredentials(cleanEmail, cleanPass)) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: 'بيانات الدخول غير صحيحة',
        });
      }

      recordAuthSuccess(req, identifierKey);
      return await createOwnerAuthResponse(req, res, trustDevice300Days, deviceId);
    } catch (error: any) {
      console.error('Error in /api/auth/owner-login:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'خطأ في الخادم أثناء تسجيل دخول مالك المنظومة',
      });
    }
  });

  // ----------------------------------------------------
  // 0. SCHOOL ADMIN AUTH ENDPOINT
  // Authoritative PostgreSQL Only - Authenticates against schoolInfoTable
  // ----------------------------------------------------
  app.post('/api/auth/school-admin-login', async (req, res) => {
    try {
      const {
        schoolCode,
        licenseKey,
        adminEmail,
        adminPassword,
        trustDevice300Days = true,
        deviceId = 'dev_unknown',
      } = req.body || {};

      const cleanCode = (schoolCode || '').trim();
      const cleanLicense = (licenseKey || '').trim();
      const cleanEmail = (adminEmail || '').trim().toLowerCase();
      const cleanPass = (adminPassword || '').trim();

      const identifierRaw = cleanCode || cleanEmail || 'unknown';
      const identifierKey = buildIdentifierKey('admin', identifierRaw);

      // Check Rate Limit & Temporary Cooldown
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات غير الصحيحة.',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        });
      }

      if ((!cleanCode || !cleanLicense) && (!cleanEmail || !cleanPass)) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال بيانات الدخول كاملة للمتابعة',
        });
      }

      // Check if this is the Platform Owner attempting login via Admin form
      if (
        (cleanEmail && cleanPass && isOwnerCredentials(cleanEmail, cleanPass)) ||
        (cleanCode && cleanLicense && isOwnerCredentials(cleanCode, cleanLicense)) ||
        (cleanCode && cleanPass && isOwnerCredentials(cleanCode, cleanPass))
      ) {
        recordAuthSuccess(req, identifierKey);
        return await createOwnerAuthResponse(req, res, trustDevice300Days, deviceId);
      }

      // Targeted query to central PostgreSQL database for fast indexed lookup
      let candidateSchools = [];
      if (cleanCode) {
        candidateSchools = await db
          .select()
          .from(schoolInfoTable)
          .where(
            or(
              ilike(schoolInfoTable.code, cleanCode),
              ilike(schoolInfoTable.schoolId, cleanCode),
              ilike(schoolInfoTable.adminEmail, cleanCode)
            )
          )
          .limit(5);
      } else if (cleanEmail) {
        candidateSchools = await db
          .select()
          .from(schoolInfoTable)
          .where(
            or(
              ilike(schoolInfoTable.adminEmail, cleanEmail),
              ilike(schoolInfoTable.email, cleanEmail)
            )
          )
          .limit(5);
      }

      if (candidateSchools.length === 0) {
        candidateSchools = await db.select().from(schoolInfoTable).limit(25);
      }

      const found = candidateSchools.find((s) => {
        const sCode = (s.code || '').trim();
        const sLicense = (s.licenseKey || '').trim();
        const sEmail = (s.adminEmail || s.email || '').trim().toLowerCase();
        const sPass = (s.adminPassword || '').trim();

        // 1. Match by school code / email + license key
        if (cleanCode && cleanLicense) {
          const codeMatch =
            sCode.toUpperCase() === cleanCode.toUpperCase() ||
            sEmail.toUpperCase() === cleanCode.toUpperCase() ||
            s.schoolId.toUpperCase() === cleanCode.toUpperCase();
          const licenseMatch = Boolean(sLicense && sLicense.toUpperCase() === cleanLicense.toUpperCase());
          if (codeMatch && licenseMatch) return true;
        }

        // 2. Match by admin email + password
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
          error: 'بيانات الدخول غير صحيحة',
        });
      }

      if (found.status === 'معلقة') {
        return res.status(403).json({
          success: false,
          error: 'عفواً، هذا الحساب معلق حالياً. يرجى التواصل مع إدارة النظام.',
        });
      }

      // Clear failed attempt tracking on successful login
      recordAuthSuccess(req, identifierKey);

      const sessionId = `tds_adm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const durationDays = trustDevice300Days ? 300 : 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId: `admin_${found.schoolId}`,
        userRole: 'school_admin',
        schoolId: found.schoolId,
        expiresAt,
      });

      // Cache session in memory
      memorySessionStore.set(sessionToken, {
        sessionId,
        deviceId,
        userId: `admin_${found.schoolId}`,
        userRole: 'school_admin',
        userDisplayName: found.name,
        schoolId: found.schoolId,
        createdAt: new Date().toISOString(),
        expiresAt,
      });

      // Also register by sessionId
      memorySessionStore.set(sessionId, {
        id: sessionId,
        deviceId,
        userId: `admin_${found.schoolId}`,
        userRole: 'school_admin',
        userDisplayName: found.name,
        schoolId: found.schoolId,
        schoolName: found.name,
        createdAt: new Date().toISOString(),
        expiresAt,
      });

      // Persist to Cloud SQL trustedDeviceSessionsTable
      try {
        await db.insert(trustedDeviceSessionsTable).values({
          id: sessionId,
          deviceId,
          userId: `admin_${found.schoolId}`,
          userRole: 'school_admin',
          schoolId: found.schoolId,
          schoolName: found.name,
          userDisplayName: found.name,
          tokenHash: crypto.createHash('sha256').update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest('hex'),
          deviceName: 'متصفح إدارة المدرسة',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt,
        });
      } catch (dbErr) {
        // Safe fallback if session table has conflict or error
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
        userRole: 'school_admin',
        userDisplayName: found.name,
        sessionToken,
        sessionId,
        expiresAt,
        message: 'تم التحقق من ترخيص المدرسة وتوثيق صلاحيات الإدارة بنجاح',
      });
    } catch (error: any) {
      console.error('Error in /api/auth/school-admin-login:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'خطأ في الخادم أثناء التحقق من ترخيص المدرسة',
      });
    }
  });

  // ----------------------------------------------------
  // 1. UNIFIED STAFF AUTH ENDPOINT (Teacher & Attendance Officer)
  // Authoritative PostgreSQL Only - No Local State Ingestion
  // ----------------------------------------------------
  app.post('/api/auth/staff-login', async (req, res) => {
    try {
      const {
        schoolId,
        username,
        password,
        role = 'teacher',
        trustDevice300Days = true,
        deviceId = 'dev_unknown',
      } = req.body || {};

      // Submitted values for teacher: username = teacher name, password = ministry code
      const rawUser = username != null ? String(username) : '';
      const rawPass = password != null ? String(password) : '';
      const cleanUser = rawUser.trim();
      const cleanUserLower = cleanUser.toLowerCase();
      // Keep ministry code strictly as a string, preserving leading zeros, trimmed of outer whitespace
      const cleanPass = rawPass.trim();

      const identifierRaw = `${schoolId || 'all'}:${cleanUserLower || 'unknown'}`;
      const identifierKey = buildIdentifierKey('staff', identifierRaw);

      // Check Rate Limit & Temporary Cooldown
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات غير الصحيحة.',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        });
      }

      if (!cleanUser || !cleanPass) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({
          success: false,
          error: role === 'teacher' ? 'يرجى إدخال الاسم وكلمة المرور للمتابعة' : 'يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة',
        });
      }

      // Arabic normalization helper for resilient name comparison
      const normalizeArabicName = (str: string) =>
        (str || '')
          .trim()
          .toLowerCase()
          .replace(/^[أإآا]\.\s*/, '') // remove title prefix like "أ. "
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/[\u064B-\u065F]/g, '') // remove diacritics/tashkeel
          .replace(/\s+/g, ' ');

      const normCleanUser = normalizeArabicName(cleanUser);

      // Query teachers table directly from PostgreSQL with targeted indexed conditions
      const teacherConditions = or(
        ilike(teachersTable.username, cleanUser),
        ilike(teachersTable.name, cleanUser),
        ilike(teachersTable.username, `%${cleanUser}%`),
        ilike(teachersTable.name, `%${cleanUser}%`),
        ilike(teachersTable.email, cleanUser),
        eq(teachersTable.nationalId, cleanUser)
      );

      const candidateTeachers = schoolId
        ? await db
            .select()
            .from(teachersTable)
            .where(and(eq(teachersTable.schoolId, schoolId), teacherConditions))
            .limit(25)
        : await db
            .select()
            .from(teachersTable)
            .where(teacherConditions)
            .limit(25);

      const found = candidateTeachers.find((t) => {
        // Enforce cross-school isolation: if schoolId is specified, reject any teacher from a different school
        if (schoolId && t.schoolId !== schoolId) {
          return false;
        }

        const u = (t.username || '').trim().toLowerCase();
        const nm = (t.name || '').trim().toLowerCase();
        const e = (t.email || '').trim().toLowerCase();
        const n = (t.nationalId || '').trim();

        const normU = normalizeArabicName(t.username || '');
        const normNm = normalizeArabicName(t.name || '');

        const userMatch =
          u === cleanUserLower ||
          nm === cleanUserLower ||
          normU === normCleanUser ||
          normNm === normCleanUser ||
          e === cleanUserLower ||
          n === cleanUser;

        const passMatch = Boolean(t.password && verifyPassword(cleanPass, t.password));

        if (role === 'attendance') {
          return userMatch && passMatch && Boolean(t.isAttendanceOfficer);
        } else {
          return userMatch && passMatch && !t.isAttendanceOfficer;
        }
      });

      if (!found) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: 'بيانات الدخول غير صحيحة',
        });
      }

      const assignedSchoolId = found.schoolId;
      const userRole = found.isAttendanceOfficer ? 'attendance_teacher' : 'teacher';

      // Check if school is active
      const schoolRows = await db
        .select()
        .from(schoolInfoTable)
        .where(eq(schoolInfoTable.schoolId, assignedSchoolId))
        .limit(1);

      const schoolInfo = schoolRows[0] || null;
      if (schoolInfo && (schoolInfo as any).status === 'معلقة') {
        return res.status(403).json({
          success: false,
          error: 'عفواً، هذا الحساب معلق حالياً وموقوف عن العمل. يرجى التواصل مع إدارة النظام.',
        });
      }

      // Clear failed attempt tracking on successful login
      recordAuthSuccess(req, identifierKey);

      const sessionId = `tds_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const durationDays = trustDevice300Days ? 300 : 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId: found.id,
        userRole,
        schoolId: assignedSchoolId,
        expiresAt,
      });

      // Cache session in memory
      memorySessionStore.set(sessionToken, {
        sessionId,
        deviceId,
        userId: found.id,
        userRole,
        userDisplayName: found.name,
        schoolId: assignedSchoolId,
        createdAt: new Date().toISOString(),
        expiresAt,
      });

      const { password: _pw, ...safeTeacher } = found;

      res.json({
        success: true,
        teacher: safeTeacher,
        schoolId: assignedSchoolId,
        schoolName: schoolInfo?.name || 'المدرسة',
        userRole,
        sessionToken,
        sessionId,
        expiresAt,
        message: 'تم تسجيل الدخول بنجاح',
      });
    } catch (error: any) {
      console.error('Error in /api/auth/staff-login:', error);
      res.status(500).json({ success: false, error: error?.message || 'خطأ في الخادم أثناء تسجيل الدخول' });
    }
  });

  // ----------------------------------------------------
  // 2. STUDENT / PARENT AUTH ENDPOINT
  // Authoritative PostgreSQL Only - Strictly validates credentials
  // Supports 'ministry_code' (Student Name + Ministry Code + National ID) & 'legacy' mode
  // ----------------------------------------------------
  app.post('/api/auth/student-login', async (req, res) => {
    try {
      const {
        studentName,
        ministryCode,
        nationalId,
        parentPhone,
        studentCode,
        schoolId,
        deviceId = 'dev_unknown',
        trustDevice300Days = true,
      } = req.body || {};

      const cleanName = normalizeArabicText(studentName || '');
      const cleanMinistryCode = (ministryCode || '').trim();
      const cleanNationalId = (nationalId || '').trim();
      const cleanParentPhone = normalizePhone(parentPhone || '');
      const cleanStudentCode = (studentCode || '').trim();

      const identifierRaw = cleanMinistryCode || cleanNationalId
        ? `${schoolId || 'all'}:${cleanMinistryCode}:${cleanNationalId}`
        : `${schoolId || 'all'}:${cleanStudentCode || cleanParentPhone || cleanName || 'unknown'}`;
      const identifierKey = buildIdentifierKey('student', identifierRaw);

      // Check Rate Limit & Temporary Cooldown
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات غير الصحيحة.',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        });
      }

      if (!cleanName) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: 'بيانات الدخول غير صحيحة',
        });
      }

      let matchedStudent: any = null;
      let targetSchoolInfo: any = null;

      // 1. PRIMARY GGS AUTHENTICATION MODE: Name + Ministry Code + National ID
      if (cleanMinistryCode && cleanNationalId) {
        let candidates: any[] = [];
        if (schoolId) {
          const schoolRows = await db
            .select()
            .from(schoolInfoTable)
            .where(eq(schoolInfoTable.schoolId, schoolId))
            .limit(1);

          targetSchoolInfo = schoolRows[0] || null;
          if (!targetSchoolInfo || targetSchoolInfo.studentAuthMode === 'legacy') {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: 'بيانات الدخول غير صحيحة',
            });
          }

          candidates = await db
            .select()
            .from(studentsTable)
            .where(
              and(
                eq(studentsTable.schoolId, schoolId),
                eq(studentsTable.ministryCode, cleanMinistryCode),
                eq(studentsTable.nationalId, cleanNationalId)
              )
            );
        } else {
          candidates = await db
            .select()
            .from(studentsTable)
            .where(
              and(
                eq(studentsTable.ministryCode, cleanMinistryCode),
                eq(studentsTable.nationalId, cleanNationalId)
              )
            );
        }

        // Exact normalized name match
        matchedStudent = candidates.find(
          (s) => normalizeArabicText(s.name || '') === cleanName
        );

        if (!matchedStudent) {
          recordAuthFailure(req, identifierKey);
          return res.status(401).json({
            success: false,
            error: 'بيانات الدخول غير صحيحة',
          });
        }

        if (!targetSchoolInfo) {
          const schoolRows = await db
            .select()
            .from(schoolInfoTable)
            .where(eq(schoolInfoTable.schoolId, matchedStudent.schoolId))
            .limit(1);

          targetSchoolInfo = schoolRows[0] || null;
          if (targetSchoolInfo && targetSchoolInfo.studentAuthMode === 'legacy') {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: 'بيانات الدخول غير صحيحة',
            });
          }
        }
      }
      // 2. BACKWARD COMPATIBILITY LEGACY MODE: Only for schools explicitly set to 'legacy'
      else if (cleanParentPhone || cleanStudentCode) {
        let candidates: any[] = [];
        if (schoolId) {
          const schoolRows = await db
            .select()
            .from(schoolInfoTable)
            .where(eq(schoolInfoTable.schoolId, schoolId))
            .limit(1);

          targetSchoolInfo = schoolRows[0] || null;
          if (!targetSchoolInfo || targetSchoolInfo.studentAuthMode !== 'legacy') {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: 'بيانات الدخول غير صحيحة',
            });
          }

          if (cleanStudentCode && cleanParentPhone) {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(
                and(
                  eq(studentsTable.schoolId, schoolId),
                  or(
                    eq(studentsTable.studentCode, cleanStudentCode),
                    eq(studentsTable.nationalId, cleanStudentCode),
                    eq(studentsTable.parentPhone, cleanParentPhone)
                  )
                )
              )
              .limit(25);
          } else if (cleanStudentCode) {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(
                and(
                  eq(studentsTable.schoolId, schoolId),
                  or(
                    eq(studentsTable.studentCode, cleanStudentCode),
                    eq(studentsTable.nationalId, cleanStudentCode)
                  )
                )
              )
              .limit(25);
          } else if (cleanParentPhone) {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(
                and(
                  eq(studentsTable.schoolId, schoolId),
                  eq(studentsTable.parentPhone, cleanParentPhone)
                )
              )
              .limit(25);
          } else {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(eq(studentsTable.schoolId, schoolId))
              .limit(50);
          }
        } else {
          if (cleanStudentCode && cleanParentPhone) {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(
                or(
                  eq(studentsTable.studentCode, cleanStudentCode),
                  eq(studentsTable.nationalId, cleanStudentCode),
                  eq(studentsTable.parentPhone, cleanParentPhone)
                )
              )
              .limit(25);
          } else if (cleanStudentCode) {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(
                or(
                  eq(studentsTable.studentCode, cleanStudentCode),
                  eq(studentsTable.nationalId, cleanStudentCode)
                )
              )
              .limit(25);
          } else if (cleanParentPhone) {
            candidates = await db
              .select()
              .from(studentsTable)
              .where(eq(studentsTable.parentPhone, cleanParentPhone))
              .limit(25);
          } else {
            candidates = [];
          }
        }

        matchedStudent = candidates.find((s) => {
          if (normalizeArabicText(s.name || '') !== cleanName) return false;
          const sPhone = normalizePhone(s.parentPhone || '');
          const sCode = (s.studentCode || '').trim().toLowerCase();
          const sNat = (s.nationalId || '').trim();

          if (cleanParentPhone && sPhone === cleanParentPhone) return true;
          if (cleanStudentCode && (sCode === cleanStudentCode.toLowerCase() || sNat === cleanStudentCode)) return true;
          return false;
        });

        if (!matchedStudent) {
          recordAuthFailure(req, identifierKey);
          return res.status(401).json({
            success: false,
            error: 'بيانات الدخول غير صحيحة',
          });
        }

        if (!targetSchoolInfo) {
          const schoolRows = await db
            .select()
            .from(schoolInfoTable)
            .where(eq(schoolInfoTable.schoolId, matchedStudent.schoolId))
            .limit(1);

          targetSchoolInfo = schoolRows[0] || null;
          if (targetSchoolInfo && targetSchoolInfo.studentAuthMode !== 'legacy') {
            recordAuthFailure(req, identifierKey);
            return res.status(401).json({
              success: false,
              error: 'بيانات الدخول غير صحيحة',
            });
          }
        }
      } else {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({
          success: false,
          error: 'بيانات الدخول غير صحيحة',
        });
      }

      // Check if student's school is suspended
      const studentSchoolId = matchedStudent.schoolId;
      if (targetSchoolInfo && targetSchoolInfo.status === 'معلقة') {
        return res.status(403).json({
          success: false,
          error: 'عفواً، هذا الحساب معلق حالياً وموقوف عن العمل. يرجى التواصل مع إدارة المدرسة أو مالك المنظومة.',
        });
      }

      // Clear failed attempt tracking on successful login
      recordAuthSuccess(req, identifierKey);

      // 3. Fetch related student data from PostgreSQL
      const studentAttendance = await db
        .select()
        .from(attendanceTable)
        .where(and(eq(attendanceTable.schoolId, studentSchoolId), eq(attendanceTable.studentId, matchedStudent.id)));

      const studentGrades = await db
        .select()
        .from(gradesTable)
        .where(and(eq(gradesTable.schoolId, studentSchoolId), eq(gradesTable.studentId, matchedStudent.id)));

      const studentBehavior = await db
        .select()
        .from(behaviorTable)
        .where(and(eq(behaviorTable.schoolId, studentSchoolId), eq(behaviorTable.studentId, matchedStudent.id)));

      const rawSchoolAnnouncements = await db
        .select()
        .from(announcementsTable)
        .where(eq(announcementsTable.schoolId, studentSchoolId))
        .orderBy(desc(announcementsTable.createdAt), desc(announcementsTable.id));

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
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.id || '').localeCompare(a.id || '');
      });

      const schoolAnnouncements = rawSchoolAnnouncements.filter((a) =>
        isAnnouncementVisibleToRole(a.targetAudience, 'student')
      );

      const studentHomework = await db
        .select()
        .from(homeworkTable)
        .where(eq(homeworkTable.schoolId, studentSchoolId));

      const studentBadges = await db
        .select()
        .from(studentBadgesTable)
        .where(eq(studentBadgesTable.studentId, matchedStudent.id));

      const studentAdminActions = await db
        .select()
        .from(adminActionsTable)
        .where(and(eq(adminActionsTable.schoolId, studentSchoolId), eq(adminActionsTable.studentId, matchedStudent.id)))
        .orderBy(desc(adminActionsTable.createdAt));

      const studentPoints = await getStudentPoints(studentSchoolId, matchedStudent.id).catch(() => null);

      const parentData = {
        student: matchedStudent,
        schoolInfo: targetSchoolInfo || {
          schoolId: studentSchoolId,
          name: 'المدرسة المصرية الحديثة',
          code: 'EG-SCH-01',
          governorate: 'القاهرة',
          academicYear: '2025/2026',
        },
        attendance: studentAttendance,
        grades: studentGrades,
        behavior: studentBehavior,
        announcements: schoolAnnouncements,
        homework: studentHomework,
        badges: studentBadges,
        adminActions: studentAdminActions,
        points: studentPoints,
      };

      const sessionId = `tds_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const durationDays = trustDevice300Days ? 300 : 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const createdAt = new Date().toISOString();
      const schoolName = targetSchoolInfo?.name || 'المدرسة المصرية الحديثة';

      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId: matchedStudent.id,
        userRole: 'parent',
        schoolId: studentSchoolId,
        schoolName,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        studentCode: matchedStudent.studentCode,
        className: matchedStudent.className,
        userDisplayName: matchedStudent.name,
        avatarUid: matchedStudent.avatar_layout_uid,
        expiresAt,
      });

      const tokenHash = crypto.createHash('sha256').update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest('hex');

      const memSession: InMemorySession = {
        id: sessionId,
        deviceId,
        userId: matchedStudent.id,
        userRole: 'parent',
        schoolId: studentSchoolId,
        schoolName,
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        studentCode: matchedStudent.studentCode,
        className: matchedStudent.className,
        userDisplayName: matchedStudent.name,
        avatarUid: matchedStudent.avatar_layout_uid,
        tokenHash,
        deviceName: 'جهاز الطالب',
        createdAt,
        lastUsedAt: createdAt,
        expiresAt,
        revokedAt: null,
      };

      // Cache session in memory with sessionId as key
      memorySessionStore.set(sessionId, memSession);

      // Persist session to database for cross-device support
      try {
        await db.insert(trustedDeviceSessionsTable).values({
          id: sessionId,
          deviceId,
          userId: matchedStudent.id,
          userRole: 'parent',
          schoolId: studentSchoolId,
          schoolName,
          studentId: matchedStudent.id,
          studentName: matchedStudent.name,
          studentCode: matchedStudent.studentCode,
          className: matchedStudent.className,
          userDisplayName: matchedStudent.name,
          avatarUid: matchedStudent.avatar_layout_uid || null,
          tokenHash,
          deviceName: 'جهاز الطالب',
          createdAt,
          lastUsedAt: createdAt,
          expiresAt,
          revokedAt: null,
        });
      } catch (dbErr) {
        console.error('Error persisting student session to trustedDeviceSessionsTable:', dbErr);
      }

      res.json({
        success: true,
        student: matchedStudent,
        parentData,
        sessionId,
        sessionToken,
        expiresAt,
      });
    } catch (error: any) {
      console.error('Error in /api/auth/student-login:', error);
      res.status(500).json({ success: false, error: error?.message || 'خطأ في الخادم أثناء تسجيل الدخول' });
    }
  });

  // ----------------------------------------------------
  // 2.2 ACCOUNT SWITCHER SIGNING ENDPOINT
  // ----------------------------------------------------
  app.post('/api/auth/switch-account', async (req, res) => {
    try {
      const { targetSessionId, deviceId, accountMeta } = req.body || {};
      if (!accountMeta || !accountMeta.userRole) {
        return res.status(400).json({ success: false, error: 'بيانات الحساب غير مكتملة' });
      }

      const sessionId = targetSessionId || `sw_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let authoritativeAvatarUid = accountMeta.avatarUid;
      if (accountMeta.userRole === 'parent' || accountMeta.userRole === 'student') {
        const queryId = accountMeta.studentId || accountMeta.userId;
        if (queryId) {
          try {
            const [foundStudent] = await db
              .select({ avatar_layout_uid: studentsTable.avatar_layout_uid })
              .from(studentsTable)
              .where(eq(studentsTable.id, queryId))
              .limit(1);
            if (foundStudent?.avatar_layout_uid) {
              authoritativeAvatarUid = foundStudent.avatar_layout_uid;
            }
          } catch (stdErr) {
            console.error('Error fetching student avatar in switch-account:', stdErr);
          }
        }
      }

      const signedPayload = {
        sessionId,
        deviceId: deviceId || 'device-default',
        userId: accountMeta.userId || sessionId,
        userRole: accountMeta.userRole,
        schoolId: accountMeta.schoolId,
        schoolName: accountMeta.schoolName,
        studentId: accountMeta.studentId,
        studentName: accountMeta.studentName,
        studentCode: accountMeta.studentCode,
        className: accountMeta.className,
        teacherId: (accountMeta.userRole === 'teacher' || accountMeta.userRole === 'attendance_teacher') ? accountMeta.userId : undefined,
        userDisplayName: accountMeta.userDisplayName || accountMeta.studentName,
        avatarUid: authoritativeAvatarUid,
        expiresAt,
      };

      const sessionToken = createSignedSessionToken(signedPayload);

      // Store in memory session store
      memorySessionStore.set(sessionId, {
        sessionId,
        deviceId: deviceId || 'device-default',
        userId: signedPayload.userId,
        userRole: signedPayload.userRole,
        userDisplayName: signedPayload.userDisplayName,
        schoolId: signedPayload.schoolId,
        createdAt: new Date().toISOString(),
        expiresAt,
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
          avatarUid: signedPayload.avatarUid,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/auth/switch-account:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل تبديل الحساب' });
    }
  });

  // ----------------------------------------------------
  // CENTRAL SCHOOL MANAGEMENT & EXCEL IMPORT ENDPOINTS
  // ----------------------------------------------------
  function formatSchoolResponse(r: any, studentsCount?: number, teachersCount?: number) {
    return {
      id: r.schoolId,
      schoolId: r.schoolId,
      name: r.name,
      code: r.code,
      licenseKey: r.licenseKey,
      adminEmail: r.adminEmail || r.email || '',
      adminPassword: r.adminPassword || '',
      governorate: r.governorate,
      educationalDistrict: r.educationalDistrict || `إدارة ${r.governorate} التعليمية`,
      address: r.address || `${r.governorate}`,
      phone: r.phone || '',
      email: r.email || r.adminEmail || '',
      principalName: r.principalName || '',
      principalPhone: r.principalPhone || '',
      principalEmail: r.principalEmail || '',
      academicYear: r.academicYear || '2025/2026',
      subscription: r.subscription || 'احترافي',
      status: r.status || 'نشطة',
      licenseExpiry: r.licenseExpiry || '2026-12-31',
      studentsCount: typeof studentsCount === 'number' ? studentsCount : (r.studentsCount || 0),
      teachersCount: typeof teachersCount === 'number' ? teachersCount : (r.teachersCount || 0),
      createdAt: r.createdAt || new Date().toISOString().split('T')[0],
    };
  }

  // 1. GET ALL SCHOOLS
  app.get('/api/schools', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.userRole !== 'owner') {
        if (!user.schoolId) {
          return res.status(403).json({ success: false, error: 'غير مصرح للوصول للمدارس' });
        }
        const [school] = await db.select().from(schoolInfoTable).where(eq(schoolInfoTable.schoolId, user.schoolId));
        if (!school) return res.json({ success: true, schools: [] });

        const [[{ count: stCount }], [{ count: tcCount }]] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(studentsTable).where(eq(studentsTable.schoolId, school.schoolId)),
          db.select({ count: sql<number>`count(*)` }).from(teachersTable).where(eq(teachersTable.schoolId, school.schoolId)),
        ]);
        return res.json({ success: true, schools: [formatSchoolResponse(school, Number(stCount), Number(tcCount))] });
      }

      const rows = await db.select().from(schoolInfoTable);

      const [stCounts, tcCounts] = await Promise.all([
        db.select({ schoolId: studentsTable.schoolId, count: sql<number>`count(*)` }).from(studentsTable).groupBy(studentsTable.schoolId),
        db.select({ schoolId: teachersTable.schoolId, count: sql<number>`count(*)` }).from(teachersTable).groupBy(teachersTable.schoolId),
      ]);

      const stMap = new Map(stCounts.map((c) => [c.schoolId, Number(c.count)]));
      const tcMap = new Map(tcCounts.map((c) => [c.schoolId, Number(c.count)]));

      const formatted = rows.map((r) =>
        formatSchoolResponse(r, stMap.get(r.schoolId) || 0, tcMap.get(r.schoolId) || 0)
      );

      res.json({ success: true, schools: formatted });
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل جلب قائمة المدارس' });
    }
  });

  // 2. VALIDATE STUDENT EXCEL IMPORT AGAINST DB
  app.post('/api/schools/validate-student-import', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.userRole !== 'owner') {
        return res.status(403).json({ success: false, error: 'غير مصرح للوصول لهذه الخدمة' });
      }

      const body = req.body || {};
      let students: any[] = [];
      if (Array.isArray(body.students)) {
        students = body.students;
      } else if (Array.isArray(body.batches)) {
        students = body.batches.flatMap((b: any) => (Array.isArray(b?.students) ? b.students : []));
      }

      if (students.length > 5000) {
        return res.status(400).json({ success: false, error: 'عدد الطلاب يتجاوز الحد الأقصى المسموح به (5,000 طالب)' });
      }

      const ministryCodes = students
        .map((s: any) => String(s.ministryCode || '').trim())
        .filter((c: string) => c.length > 0);

      const nationalIds = students
        .map((s: any) => String(s.nationalId || '').trim())
        .filter((id: string) => id.length > 0);

      // Check intra-import duplicate codes
      const seenMinistry = new Set<string>();
      const intraDuplicateMinistryCodes: string[] = [];
      for (const code of ministryCodes) {
        if (seenMinistry.has(code)) {
          intraDuplicateMinistryCodes.push(code);
        } else {
          seenMinistry.add(code);
        }
      }

      const seenNational = new Set<string>();
      const intraDuplicateNationalIds: string[] = [];
      for (const id of nationalIds) {
        if (seenNational.has(id)) {
          intraDuplicateNationalIds.push(id);
        } else {
          seenNational.add(id);
        }
      }

      let existingMinistryCodes: string[] = [];
      let existingNationalIds: string[] = [];

      if (ministryCodes.length > 0 || nationalIds.length > 0) {
        const existingStudents = await db
          .select({
            ministryCode: studentsTable.ministryCode,
            nationalId: studentsTable.nationalId,
          })
          .from(studentsTable)
          .innerJoin(schoolInfoTable, eq(studentsTable.schoolId, schoolInfoTable.schoolId))
          .where(
            or(
              ministryCodes.length > 0 ? inArray(studentsTable.ministryCode, ministryCodes) : sql`false`,
              nationalIds.length > 0 ? inArray(studentsTable.nationalId, nationalIds) : sql`false`
            )
          );

        existingMinistryCodes = Array.from(new Set(existingStudents.map((s) => s.ministryCode).filter((v): v is string => Boolean(v))));
        existingNationalIds = Array.from(new Set(existingStudents.map((s) => s.nationalId).filter((v): v is string => Boolean(v))));
      }

      res.json({
        success: true,
        existingMinistryCodes,
        existingNationalIds,
        intraDuplicateMinistryCodes: Array.from(new Set(intraDuplicateMinistryCodes)),
        intraDuplicateNationalIds: Array.from(new Set(intraDuplicateNationalIds)),
      });
    } catch (error: any) {
      console.error('Error validating student import:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل التحقق من كشف الطلاب' });
    }
  });

  // 3. CREATE SCHOOL + ATOMIC EXCEL STUDENT IMPORT
  app.post('/api/schools', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.userRole !== 'owner') {
        return res.status(403).json({ success: false, error: 'عملية إضافة مدرسة مقتصرة على مالك المنظومة فقط' });
      }

      const {
        name,
        governorate = 'القاهرة',
        principalName,
        principalPhone,
        principalEmail,
        adminEmail,
        adminPassword,
        subscription = 'احترافي',
        status = 'نشطة',
        code,
        licenseKey,
        students = [],
      } = req.body || {};

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'اسم المدرسة مطلوب' });
      }

      if (Array.isArray(students) && students.length > 5000) {
        return res.status(400).json({ success: false, error: 'تجاوز كشف الطلاب الحد الأقصى المسموح به (5,000 طالب)' });
      }

      const schoolId = req.body.id || `sch-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const cleanGov = (governorate || 'القاهرة').trim();
      const targetEmail = (principalEmail || adminEmail || req.body.email || `${schoolId}@school.edu.eg`).trim();
      const finalCode = code || `EG-${cleanGov.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalLicense = licenseKey || `LIC-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const today = new Date().toISOString().split('T')[0];

      // Pre-validate student rows
      const importErrors: Array<{
        rowNumber: number;
        name?: string;
        ministryCode?: string;
        nationalId?: string;
        className?: string;
        sheetName?: string;
        fileName?: string;
        reason: string;
      }> = [];

      const validStudents: Array<{
        name: string;
        ministryCode: string;
        nationalId: string;
        className?: string;
        gradeLevel?: string;
        birthDate?: string | null;
        sheetName?: string;
        fileName?: string;
      }> = [];

      const seenMinistryInFile = new Set<string>();
      const seenNationalInFile = new Set<string>();

      let dbMinistrySet = new Set<string>();
      let dbNationalSet = new Set<string>();

      if (Array.isArray(students) && students.length > 0) {
        const ministryCodes = students.map((s: any) => String(s.ministryCode || '').trim()).filter(Boolean);
        const nationalIds = students.map((s: any) => String(s.nationalId || '').trim()).filter(Boolean);

        if (ministryCodes.length > 0 || nationalIds.length > 0) {
          const existingDB = await db
            .select({
              ministryCode: studentsTable.ministryCode,
              nationalId: studentsTable.nationalId,
            })
            .from(studentsTable)
            .innerJoin(schoolInfoTable, eq(studentsTable.schoolId, schoolInfoTable.schoolId))
            .where(
              or(
                ministryCodes.length > 0 ? inArray(studentsTable.ministryCode, ministryCodes) : sql`false`,
                nationalIds.length > 0 ? inArray(studentsTable.nationalId, nationalIds) : sql`false`
              )
            );

          dbMinistrySet = new Set(existingDB.map((s) => s.ministryCode).filter((v): v is string => Boolean(v)));
          dbNationalSet = new Set(existingDB.map((s) => s.nationalId).filter((v): v is string => Boolean(v)));
        }

        students.forEach((st: any, idx: number) => {
          const rowNumber = Number(st.rowNumber) || (idx + 2);
          const stName = String(st.name || '').trim();
          const ministryCode = String(st.ministryCode || '').trim();
          const nationalId = String(st.nationalId || '').trim();
          const detectedGrade = st.gradeLevel || st.age || (nationalId ? deriveGradeFromNationalId(nationalId) : null);
          const rawClassName = st.className ? String(st.className).trim() : (detectedGrade ? String(detectedGrade).trim() : (st.sheetName ? String(st.sheetName).trim() : 'الصف الأول الابتدائي'));
          const mappedCls = mapEgyptianSheetName(rawClassName !== 'غير محدد' ? rawClassName : (detectedGrade || 'الصف الأول الابتدائي'));
          const className = mappedCls.className || rawClassName;
          const gradeLevel = mappedCls.gradeLevel || detectedGrade || 'المرحلة الدراسية';
          const sheetName = st.sheetName ? String(st.sheetName).trim() : undefined;
          const fileName = st.fileName ? String(st.fileName).trim() : undefined;
          const birthDate = st.birthDate || null;

          if (!stName) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: 'اسم الطالب مفقود أو فارغ' });
            return;
          }
          if (!ministryCode) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: 'كود الوزارة/التلميذ مفقود أو فارغ' });
            return;
          }
          if (!nationalId) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: 'الرقم القومي مفقود أو فارغ' });
            return;
          }

          if (!/^\d{14}$/.test(nationalId)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `الرقم القومي غير صحيح (${nationalId}) - يتطلب 14 رقماً بالضبط` });
            return;
          }

          if (seenMinistryInFile.has(ministryCode)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `كود الوزارة/التلميذ مكرر داخل نفس الملفات (${ministryCode})` });
            return;
          }
          if (seenNationalInFile.has(nationalId)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `الرقم القومي مكرر داخل نفس الملفات (${nationalId})` });
            return;
          }

          if (dbMinistrySet.has(ministryCode)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `كود الوزارة مسجل سابقاً بالنظام لدى طالب آخر (${ministryCode})` });
            return;
          }
          if (dbNationalSet.has(nationalId)) {
            importErrors.push({ rowNumber, name: stName, ministryCode, nationalId, className, sheetName, fileName, reason: `الرقم القومي مسجل سابقاً بالنظام لدى طالب آخر (${nationalId})` });
            return;
          }

          seenMinistryInFile.add(ministryCode);
          seenNationalInFile.add(nationalId);
          validStudents.push({ name: stName, ministryCode, nationalId, className, gradeLevel, birthDate, sheetName, fileName });
        });
      }

      // If there are validation errors in the student list, abort and create nothing (Atomic Rollback)
      if (importErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: `فشلت استيراد ملف الطلاب بسبب وجود ${importErrors.length} خطأ في البيانات. تم إلغاء إنشاء المدرسة بالكامل.`,
          importResult: {
            total: Array.isArray(students) ? students.length : 0,
            imported: 0,
            rejected: importErrors.length,
            duplicates: importErrors.filter((e) => e.reason.includes('مكرر') || e.reason.includes('مسجل سابقاً')).length,
            invalidRows: importErrors.filter((e) => !e.reason.includes('مكرر') && !e.reason.includes('مسجل سابقاً')).length,
            errors: importErrors,
          },
        });
      }

      // ATOMIC TRANSACTION FOR SCHOOL + CLASSES + STUDENTS
      let createdSchoolRow: any = null;
      let createdStudentsCount = 0;
      let createdClassesNames: string[] = [];

      await db.transaction(async (tx) => {
        // 1. Insert School Info
        const schoolRecord = {
          schoolId,
          name: name.trim(),
          code: finalCode,
          licenseKey: finalLicense,
          adminEmail: targetEmail,
          adminPassword: adminPassword ? (adminPassword.startsWith('$2') ? adminPassword : hashPassword(adminPassword)) : hashPassword('School#2026Password'),
          governorate: cleanGov as any,
          educationalDistrict: req.body.educationalDistrict || `إدارة ${cleanGov} التعليمية`,
          address: req.body.address || `محافظة ${cleanGov}`,
          phone: principalPhone ? principalPhone.trim() : (req.body.phone || '01000000000'),
          email: targetEmail,
          principalName: principalName ? principalName.trim() : 'مدير المدرسة',
          principalPhone: principalPhone ? principalPhone.trim() : (req.body.phone || '01000000000'),
          principalEmail: targetEmail,
          academicYear: req.body.academicYear || '2025/2026',
          subscription: subscription as any,
          status: status as any,
          licenseExpiry: req.body.licenseExpiry || `${new Date().getFullYear() + 1}-12-31`,
          studentsCount: validStudents.length,
          teachersCount: Number(req.body.teachersCount) || 0,
          createdAt: req.body.createdAt || today,
        };

        await tx.insert(schoolInfoTable).values(schoolRecord);
        createdSchoolRow = schoolRecord;

        // 2. Create Classes and Insert Valid Students
        if (validStudents.length > 0) {
          // Extract unique class names (sheet names or detected grades mapped to standard format)
          const uniqueClassNames = Array.from(
            new Set(
              validStudents
                .map((st) => {
                  const mapped = mapEgyptianSheetName(st.className || (st as any).gradeLevel);
                  return (mapped.className || st.className || '1/1 ابتدائي').trim();
                })
                .filter((c): c is string => Boolean(c))
            )
          );
          createdClassesNames = uniqueClassNames;

          // Fetch existing classes for this school if any
          const existingClasses = await tx
            .select({ id: classesTable.id, name: classesTable.name })
            .from(classesTable)
            .where(eq(classesTable.schoolId, schoolId));

          const classMap = new Map<string, string>();
          existingClasses.forEach((cls) => {
            classMap.set(cls.name.trim(), cls.id);
          });

          // Insert new classes for each unique sheet name
          let classSeq = 1;
          for (const clsName of uniqueClassNames) {
            if (!classMap.has(clsName)) {
              const classId = `cls-${schoolId}-${Date.now()}-${classSeq++}`;
              const matchingStudent = validStudents.find((st) => (st.className || '').trim() === clsName);
              const mapped = mapEgyptianSheetName(clsName);
              const detectedGradeLevel = (matchingStudent as any)?.gradeLevel || mapped.gradeLevel || 'المرحلة الدراسية';

              await tx.insert(classesTable).values({
                id: classId,
                schoolId,
                name: mapped.className || clsName,
                gradeLevel: detectedGradeLevel,
                capacity: 40,
                roomNumber: null,
                advisorTeacherName: null,
              });
              classMap.set(clsName, classId);
            }
          }

          // Map student records to their assigned classes
          const studentRecords = validStudents.map((st, idx) => {
            const mappedCls = mapEgyptianSheetName(st.className || (st as any).gradeLevel);
            const assignedClassName = (mappedCls.className || st.className || '1/1 ابتدائي').trim();
            const assignedClassId = classMap.get(assignedClassName) || null;
            const assignedGradeLevel = mappedCls.gradeLevel || (st as any).gradeLevel || 'المرحلة الدراسية';

            return {
              id: `std-${schoolId}-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
              schoolId,
              name: st.name,
              ministryCode: st.ministryCode,
              nationalId: st.nationalId,
              studentCode: `STD-2026-${schoolId.slice(-4)}-${String(idx + 1).padStart(4, '0')}`,
              classId: assignedClassId,
              className: assignedClassName,
              gradeLevel: assignedGradeLevel,
              birthDate: (st as any).birthDate || null,
              status: 'منتظم',
              joinDate: today,
            };
          });

          for (let i = 0; i < studentRecords.length; i += 500) {
            const chunk = studentRecords.slice(i, i + 500);
            await tx.insert(studentsTable).values(chunk);
          }
          createdStudentsCount = studentRecords.length;
        }
      });

      const formattedSchool = formatSchoolResponse(createdSchoolRow, createdStudentsCount, 0);

      const importResult = {
        total: Array.isArray(students) ? students.length : 0,
        imported: createdStudentsCount,
        classesCount: createdClassesNames.length,
        classesCreated: createdClassesNames,
        rejected: importErrors.length,
        duplicates: importErrors.filter((e) => e.reason.includes('مكرر') || e.reason.includes('مسجل سابقاً')).length,
        invalidRows: importErrors.filter((e) => !e.reason.includes('مكرر') && !e.reason.includes('مسجل سابقاً')).length,
        errors: importErrors,
      };

      res.json({
        success: true,
        school: formattedSchool,
        importResult,
      });
    } catch (error: any) {
      console.error('Error creating school with student import:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'فشلت عملية إنشاء المدرسة وتراجع الخادم عن جميع التغييرات (Rollback)',
      });
    }
  });

  // 4. UPDATE SCHOOL
  app.patch('/api/schools/:schoolId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.userRole !== 'owner') {
        return res.status(403).json({ success: false, error: 'تحديث بيانات المدرسة مقتصر على المالك' });
      }
      const { schoolId } = req.params;
      const updates = req.body || {};

      const patch: any = {};
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
        await db.update(schoolInfoTable).set(patch).where(eq(schoolInfoTable.schoolId, schoolId));
      }

      const [updated] = await db.select().from(schoolInfoTable).where(eq(schoolInfoTable.schoolId, schoolId));
      if (!updated) return res.status(404).json({ success: false, error: 'المدرسة غير موجودة' });

      res.json({ success: true, school: formatSchoolResponse(updated) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 5. DELETE SCHOOL AND ALL ASSOCIATED DATA (STRICTLY SCOPED TO THIS SCHOOL ONLY)
  app.delete('/api/schools/:schoolId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.userRole !== 'owner') {
        return res.status(403).json({ success: false, error: 'حذف المدرسة مقتصر على مالك المنظومة' });
      }
      const { schoolId } = req.params;
      if (!schoolId || typeof schoolId !== 'string') {
        return res.status(400).json({ success: false, error: 'معرّف المدرسة غير صالح' });
      }

      console.log(`[DELETE SCHOOL] Initiating complete atomic deletion for school: ${schoolId}`);

      // 1. Terminate and disconnect any active Server-Sent Events (SSE) connections for this school
      for (const [clientId, client] of communitySSEClients.entries()) {
        if (client.schoolId === schoolId) {
          try {
            client.res.write(`data: ${JSON.stringify({ type: 'school_deleted', schoolId })}\n\n`);
            client.res.end();
          } catch (e) {
            // Ignore stream termination error
          }
          communitySSEClients.delete(clientId);
        }
      }

      // 2. Invalidate and revoke all in-memory user sessions tied to this school
      for (const [key, session] of memorySessionStore.entries()) {
        if (session.schoolId === schoolId) {
          memorySessionStore.delete(key);
        }
      }

      // 3. Clear in-memory extension cache for this school
      invalidateSchoolExtensionsCache(schoolId);

      // 4. Atomic Cascading Database Deletion
      // Every query explicitly filters by `where(eq(..., schoolId))` to ensure ONLY this school's records are wiped
      await db.transaction(async (tx) => {
        // A. Support tickets, ticket replies & private messaging
        await tx.delete(supportTicketRepliesTable).where(eq(supportTicketRepliesTable.schoolId, schoolId));
        await tx.delete(supportTicketsTable).where(eq(supportTicketsTable.schoolId, schoolId));
        await tx.delete(privateMessagesTable).where(eq(privateMessagesTable.schoolId, schoolId));
        await tx.delete(privateConversationsTable).where(eq(privateConversationsTable.schoolId, schoolId));

        // B. Smart suspension audit logs & alerts
        await tx.delete(smartSuspensionAuditLogsTable).where(eq(smartSuspensionAuditLogsTable.schoolId, schoolId));
        await tx.delete(smartSuspensionAlertsTable).where(eq(smartSuspensionAlertsTable.schoolId, schoolId));

        // C. Audit logs, admin actions, SMS logs, trusted device sessions
        await tx.delete(adminActionsTable).where(eq(adminActionsTable.schoolId, schoolId));
        await tx.delete(smsLogsTable).where(eq(smsLogsTable.schoolId, schoolId));
        await tx.delete(trustedDeviceSessionsTable).where(eq(trustedDeviceSessionsTable.schoolId, schoolId));

        // D. Badges & Badge assignments
        await tx.delete(teacherBadgesTable).where(eq(teacherBadgesTable.schoolId, schoolId));
        await tx.delete(studentBadgesTable).where(eq(studentBadgesTable.schoolId, schoolId));
        // Delete only school-specific badges, preserving global system badges (where schoolId is null)
        await tx.delete(badgesTable).where(eq(badgesTable.schoolId, schoolId));

        // E. Academic records: homework, announcements, calendar tasks
        await tx.delete(homeworkTable).where(eq(homeworkTable.schoolId, schoolId));
        await tx.delete(announcementsTable).where(eq(announcementsTable.schoolId, schoolId));
        await tx.delete(calendarTasksTable).where(eq(calendarTasksTable.schoolId, schoolId));

        // F. Community messages, locks, and mutes
        await tx.delete(communityLocksTable).where(eq(communityLocksTable.schoolId, schoolId));
        await tx.delete(communityMutesTable).where(eq(communityMutesTable.schoolId, schoolId));
        await tx.delete(communityMessagesTable).where(eq(communityMessagesTable.schoolId, schoolId));

        // G. Attendance sessions & records, grades, and behavior
        await tx.delete(attendanceTable).where(eq(attendanceTable.schoolId, schoolId));
        await tx.delete(attendanceSessionsTable).where(eq(attendanceSessionsTable.schoolId, schoolId));
        await tx.delete(gradesTable).where(eq(gradesTable.schoolId, schoolId));
        await tx.delete(behaviorTable).where(eq(behaviorTable.schoolId, schoolId));

        // H. Core school roster: parents, students, subjects, teachers, classes
        await tx.delete(parentsTable).where(eq(parentsTable.schoolId, schoolId));
        await tx.delete(studentsTable).where(eq(studentsTable.schoolId, schoolId));
        await tx.delete(subjectsTable).where(eq(subjectsTable.schoolId, schoolId));
        await tx.delete(teachersTable).where(eq(teachersTable.schoolId, schoolId));
        await tx.delete(classesTable).where(eq(classesTable.schoolId, schoolId));

        // I. School-specific extension toggles
        await tx.delete(schoolExtensionsTable).where(eq(schoolExtensionsTable.schoolId, schoolId));

        // J. School-specific user accounts (strictly never delete system owner)
        await tx.delete(usersTable).where(and(eq(usersTable.schoolId, schoolId), ne(usersTable.role, 'owner')));

        // K. Primary school identity record
        await tx.delete(schoolInfoTable).where(eq(schoolInfoTable.schoolId, schoolId));
      });

      console.log(`[DELETE SCHOOL] Successfully deleted school ${schoolId} and all associated data.`);
      res.json({
        success: true,
        deletedSchoolId: schoolId,
        message: 'تم حذف المدرسة وكافة بياناتها التابعة بنجاح نهائياً',
      });
    } catch (error: any) {
      console.error(`[DELETE SCHOOL ERROR] Failed to delete school ${req.params.schoolId}:`, error);
      res.status(500).json({ success: false, error: error?.message || 'فشل حذف المدرسة وبياناتها' });
    }
  });
  const getSchoolFullDataHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { schoolId } = req.params;

      // Seed only sch-1 demo if requested and sch-1 is empty
      if (schoolId === 'sch-1') {
        await ensureDemoSchoolDataSeeded(schoolId);
      }

      // Controlled sequential micro-batches (max 2-3 concurrent DB queries per step)
      // Batch 1: School Identity, Classes, Teachers (Max 3 connections)
      const [schoolInfo, classesRaw, teachers] = await Promise.all([
        db.select().from(schoolInfoTable).where(eq(schoolInfoTable.schoolId, schoolId)).limit(1),
        db.select().from(classesTable).where(eq(classesTable.schoolId, schoolId)),
        db.select().from(teachersTable).where(eq(teachersTable.schoolId, schoolId)),
      ]);

      // Batch 2: Students & Subjects (Max 2 connections)
      const [studentsRaw, subjects] = await Promise.all([
        db.select().from(studentsTable).where(eq(studentsTable.schoolId, schoolId)),
        db.select().from(subjectsTable).where(eq(subjectsTable.schoolId, schoolId)),
      ]);

      // Classes and Student linking
      const classes = [...classesRaw];
      const classMap = new Map<string, string>();
      classes.forEach((c) => {
        if (c.name) classMap.set(c.name.trim(), c.id);
        if (c.gradeLevel) classMap.set(c.gradeLevel.trim(), c.id);
      });

      const classesToInsert: Array<{ id: string; schoolId: string; name: string; gradeLevel: string; capacity: number }> = [];
      const studentsToUpdate: Array<{ id: string; className: string; gradeLevel: string; classId?: string | null }> = [];

      // ONLY synthesize classes if classesTable has 0 classes for this school but students exist
      if (classes.length === 0 && studentsRaw.length > 0) {
        const uniqueClassNames = Array.from(
          new Set(
            studentsRaw
              .map((st) => {
                const mapped = mapEgyptianSheetName(st.className || st.gradeLevel);
                return (mapped.className || st.className || '1/1 ابتدائي').trim();
              })
              .filter((c): c is string => Boolean(c) && c !== 'غير محدد' && c !== 'بدون فصل')
          )
        );

        let classSeq = 1;
        for (const rawName of (uniqueClassNames.length > 0 ? uniqueClassNames : ['1/1 ابتدائي'])) {
          const mapped = mapEgyptianSheetName(rawName);
          const stdName = mapped.className || rawName;
          const stdGrade = mapped.gradeLevel || 'المرحلة الدراسية';

          if (!classMap.has(stdName)) {
            const newClassId = `cls-${schoolId}-${Date.now()}-${classSeq++}`;
            classMap.set(stdName, newClassId);
            const classRow = {
              id: newClassId,
              schoolId,
              name: stdName,
              gradeLevel: stdGrade,
              capacity: 40,
            };
            classesToInsert.push(classRow);
            classes.push({
              ...classRow,
              roomNumber: null,
              advisorTeacherName: null,
            } as any);
          }
        }
      }

      const students = studentsRaw.map((s) => {
        let className = s.className ? s.className.trim() : '';
        let gradeLevel = s.gradeLevel ? s.gradeLevel.trim() : '';

        // Derive gradeLevel from national ID or birthdate if missing
        if (!gradeLevel || gradeLevel === 'المرحلة الدراسية') {
          const derived = s.nationalId
            ? deriveGradeFromNationalId(s.nationalId)
            : (s.birthDate ? deriveGradeFromNationalId('3' + s.birthDate.replace(/\D/g, '').substring(2)) : '');
          if (derived && derived !== 'المرحلة الدراسية') {
            gradeLevel = derived;
          }
        }

        // Match student to existing classes in the school
        let matchingClass = classes.find((c) => c.id === s.classId);
        if (!matchingClass && className && className !== 'بدون فصل' && className !== 'غير محدد') {
          matchingClass = classes.find((c) => c.name.trim() === className.trim());
          if (!matchingClass) {
            const mapped = mapEgyptianSheetName(className);
            matchingClass = classes.find((c) => c.name.trim() === mapped.className || c.gradeLevel.trim() === mapped.gradeLevel);
          }
        }

        let resolvedClassId = matchingClass ? matchingClass.id : null;
        let resolvedClassName = matchingClass ? matchingClass.name : (s.classId ? className : 'بدون فصل');

        if (s.className !== resolvedClassName || s.gradeLevel !== gradeLevel || s.classId !== resolvedClassId) {
          studentsToUpdate.push({
            id: s.id,
            className: resolvedClassName,
            gradeLevel: gradeLevel || s.gradeLevel || 'المرحلة الدراسية',
            classId: resolvedClassId,
          });
        }

        return {
          ...s,
          className: resolvedClassName,
          gradeLevel: gradeLevel || s.gradeLevel || 'المرحلة الدراسية',
          classId: resolvedClassId,
        };
      });

      // Asynchronously heal database records for this school in background
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
                ...(su.classId ? { classId: su.classId } : {}),
              }).where(and(eq(studentsTable.id, su.id), eq(studentsTable.schoolId, schoolId)));
            }
          } catch (healErr) {
            console.warn('[AutoHealStudents] Background DB update error:', healErr);
          }
        })();
      }

      // Batch 3: Announcements, Tasks, Badges & Badge Assignments
      const [announcementsRaw, calendarTasksRaw, badgesRaw, studentBadgesRaw, teacherBadgesRaw] = await Promise.all([
        db.select().from(announcementsTable).where(eq(announcementsTable.schoolId, schoolId)).orderBy(desc(announcementsTable.date)).limit(100),
        db.select().from(calendarTasksTable).where(eq(calendarTasksTable.schoolId, schoolId)).orderBy(desc(calendarTasksTable.date)).limit(100),
        db.select().from(badgesTable).where(eq(badgesTable.schoolId, schoolId)),
        db.select().from(studentBadgesTable).where(eq(studentBadgesTable.schoolId, schoolId)),
        db.select().from(teacherBadgesTable).where(eq(teacherBadgesTable.schoolId, schoolId)),
      ]);

      // Batch 4: Parents & Recent Homework (Max 2 connections)
      const [parentsRaw, homeworkRaw] = await Promise.all([
        db.select().from(parentsTable).where(eq(parentsTable.schoolId, schoolId)),
        db.select().from(homeworkTable).where(eq(homeworkTable.schoolId, schoolId)).orderBy(desc(homeworkTable.dueDate)).limit(200),
      ]);

      // Batch 5: Bounded Recent Operational History (Max 3 connections - full history available on dedicated APIs)
      const [attendance, grades, behavior] = await Promise.all([
        db.select().from(attendanceTable).where(eq(attendanceTable.schoolId, schoolId)).orderBy(desc(attendanceTable.date)).limit(1000),
        db.select().from(gradesTable).where(eq(gradesTable.schoolId, schoolId)).orderBy(desc(gradesTable.date)).limit(1000),
        db.select().from(behaviorTable).where(eq(behaviorTable.schoolId, schoolId)).orderBy(desc(behaviorTable.date)).limit(500),
      ]);

      const announcements = announcementsRaw.map((a) => {
        const priority = a.priority || (a.important ? 'هام' : 'عادي');
        const isImportant = priority === 'هام' || priority === 'عاجل جداً' || Boolean(a.important);
        return {
          id: a.id,
          schoolId: a.schoolId,
          title: a.title,
          content: a.content,
          targetAudience: a.targetAudience || 'الجميع',
          priority,
          important: isImportant,
          publishDate: a.date || new Date().toISOString().split('T')[0],
          date: a.date,
          isScheduled: false,
          author: a.authorName || 'إدارة المدرسة',
          authorName: a.authorName || 'إدارة المدرسة',
        };
      });

      const calendarTasks = calendarTasksRaw.map((t) => ({
        id: t.id,
        schoolId: t.schoolId,
        school_id: t.schoolId,
        title: t.title,
        description: t.description || '',
        date: t.date,
        task_date: t.date,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        assignedTo: t.assignedTo,
        createdAt: t.createdAt,
        created_at: t.createdAt,
        updatedAt: t.updatedAt,
        updated_at: t.updatedAt,
      }));

      const badges = badgesRaw.map((b) => ({
        id: b.id,
        schoolId: b.schoolId,
        name: b.name,
        nameEn: b.nameEn || undefined,
        description: b.description || '',
        icon: b.icon || '🏆',
        color: b.color || '#D4AF37',
        rarity: b.rarity || 'Mythical',
        targetType: b.targetType || 'student',
        isActive: b.isActive !== false,
        hasAnimatedBorder: b.hasAnimatedBorder !== false,
        limitType: (b.limitType as any) || 'none',
        limit_type: (b.limitType as any) || 'none',
        maxQuantity: b.maxQuantity || 0,
        max_quantity: b.maxQuantity || 0,
        isHidden: Boolean(b.isHidden),
        is_hidden: Boolean(b.isHidden),
        createdAt: b.createdAt || '2026-07-28',
      }));

      const parents = parentsRaw.map((p) => {
        const studentIds = Array.isArray(p.studentIds) ? p.studentIds : [];
        return {
          id: p.id,
          schoolId: p.schoolId,
          name: p.name,
          nationalId: p.nationalId || '',
          phone: p.phone || '',
          email: p.email || '',
          occupation: p.occupation || '',
          address: p.address || '',
          studentIds,
          childrenIds: studentIds,
          student_ids: studentIds,
          relationship: p.relationship || 'ولي أمر',
        };
      });

      const homework = homeworkRaw.map((h) => ({
        id: h.id,
        schoolId: h.schoolId,
        studentId: h.studentId || undefined,
        classId: h.classId || undefined,
        className: h.className || undefined,
        subjectName: h.subjectName,
        teacherName: h.teacherName || undefined,
        title: h.title,
        description: h.description || '',
        assignedDate: h.assignedDate,
        dueDate: h.dueDate,
        status: (h.status as any) || 'قيد التنفيذ',
      }));

      const safeSchoolInfo = schoolInfo[0]
        ? {
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
            studentAuthMode: schoolInfo[0].studentAuthMode || 'ministry_code',
            attendanceStartDate: schoolInfo[0].attendanceStartDate,
            enableThreeLateRule: schoolInfo[0].enableThreeLateRule ?? (schoolInfo[0].schoolId === 'sch-1' || true),
            studentsCount: students.length,
            teachersCount: teachers.length,
            createdAt: schoolInfo[0].createdAt,
          }
        : null;

      const userRole = (req as any).userRole || (req as any).user?.userRole || (req as any).session?.userRole || '';
      const isPrivileged =
        userRole === 'owner' ||
        userRole === 'school_admin' ||
        (req as any).user?.userRole === 'owner' ||
        (req as any).user?.userRole === 'school_admin';

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
        homework,
      });
    } catch (error: any) {
      console.error('Error fetching full school data:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل جلب بيانات المدرسة' });
    }
  };

  app.get('/api/schools/:schoolId/full-data', requireAuth, requireSchoolAccess(['owner', 'school_admin', 'attendance_teacher']), getSchoolFullDataHandler);
  app.get('/api/schools/:schoolId', requireAuth, requireSchoolAccess(['owner', 'school_admin', 'attendance_teacher']), getSchoolFullDataHandler);

  // ----------------------------------------------------
  // 4. SETUP WIZARD DEDICATED ENDPOINT (Atomic Server-Side Save)
  // ----------------------------------------------------
  app.post(
    '/api/schools/:schoolId/setup-wizard',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { themeColor, classes = [], students = [] } = req.body || {};

        if (!Array.isArray(classes) || classes.length === 0) {
          return res.status(400).json({ success: false, error: 'يجب إضافة فصل دراسي واحد على الأقل' });
        }
        if (!Array.isArray(students) || students.length === 0) {
          return res.status(400).json({ success: false, error: 'يجب تسجيل طالب واحد على الأقل' });
        }

        // Upsert classes with strict schoolId binding
        const savedClasses = [];
        for (const c of classes) {
          const mapped = mapEgyptianSheetName(c.name);
          const detectedGrade = c.gradeLevel && c.gradeLevel !== 'المرحلة الدراسية' ? c.gradeLevel : mapped.gradeLevel;
          const classRecord = {
            id: c.id || `cls-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            schoolId,
            name: c.name,
            gradeLevel: detectedGrade || 'المرحلة الدراسية',
            capacity: Number(c.capacity) || 35,
            roomNumber: c.roomNumber || null,
            advisorTeacherName: c.advisorTeacherName || c.headTeacherName || null,
          };

          const existing = await db
            .select({ id: classesTable.id })
            .from(classesTable)
            .where(and(eq(classesTable.id, classRecord.id), eq(classesTable.schoolId, schoolId)));

          if (existing.length > 0) {
            await db.update(classesTable).set(classRecord).where(eq(classesTable.id, classRecord.id));
          } else {
            await db.insert(classesTable).values(classRecord);
          }
          savedClasses.push(classRecord);
        }

        // Upsert students with strict schoolId binding
        const savedStudents = [];
        for (const s of students) {
          const studentRecord = {
            id: s.id || `std-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            schoolId,
            name: s.name,
            studentCode: s.studentCode || `STD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            ministryCode: s.ministryCode || null,
            nationalId: s.nationalId || null,
            classId: s.classId || null,
            className: s.className || null,
            birthDate: s.birthDate || null,
            gender: s.gender || 'ذكر',
            status: s.status || 'منتظم',
            parentName: s.parentName || null,
            parentPhone: s.parentPhone || null,
            parentEmail: s.parentEmail || null,
            address: s.address || null,
            joinDate: s.joinDate || new Date().toISOString().split('T')[0],
          };

          const existing = await db
            .select({ id: studentsTable.id })
            .from(studentsTable)
            .where(and(eq(studentsTable.id, studentRecord.id), eq(studentsTable.schoolId, schoolId)));

          if (existing.length > 0) {
            await db.update(studentsTable).set(studentRecord).where(eq(studentsTable.id, studentRecord.id));
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
          message: 'تم حفظ بيانات التهيئة الأولية للمدرسة بنجاح في قاعدة البيانات المركزية',
        });
      } catch (error: any) {
        console.error('Error in setup wizard save:', error);
        res.status(500).json({ success: false, error: error?.message || 'فشل حفظ بيانات التهيئة في الخادم' });
      }
    }
  );

  // ----------------------------------------------------
  // 5. CLASSES CRUD (PostgreSQL with Tenant Isolation)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/classes', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      let classes = await db.select().from(classesTable).where(eq(classesTable.schoolId, schoolId));
      if (classes.length === 0) {
        const students = await db.select().from(studentsTable).where(eq(studentsTable.schoolId, schoolId));
        if (students.length > 0) {
          const uniqueClassNames = Array.from(
            new Set(
              students
                .map((st) => (st.className || st.gradeLevel || 'الصف العام').trim())
                .filter((c): c is string => Boolean(c) && c !== 'غير محدد')
            )
          );
          let classSeq = 1;
          for (const clsName of (uniqueClassNames.length > 0 ? uniqueClassNames : ['فصل 1/1'])) {
            const classId = `cls-${schoolId}-${Date.now()}-${classSeq++}`;
            const mapped = mapEgyptianSheetName(clsName);
            const gradeLevel = mapped.gradeLevel || clsName || 'المرحلة الدراسية';
            const newClass = {
              id: classId,
              schoolId,
              name: clsName,
              gradeLevel,
              capacity: 40,
              roomNumber: null,
              advisorTeacherName: null,
            };
            await db.insert(classesTable).values(newClass).onConflictDoNothing();
          }
          classes = await db.select().from(classesTable).where(eq(classesTable.schoolId, schoolId));
        }
      }
      res.json({ success: true, classes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/classes',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const c = req.body;
        const id = c.id || `cls-${schoolId}-${Date.now()}`;
        const mapped = mapEgyptianSheetName(c.name);
        const detectedGrade = c.gradeLevel && c.gradeLevel !== 'المرحلة الدراسية' ? c.gradeLevel : mapped.gradeLevel;

        const record = {
          id,
          schoolId,
          name: c.name,
          gradeLevel: detectedGrade || 'المرحلة الدراسية',
          capacity: Number(c.capacity) || 35,
          roomNumber: c.roomNumber || null,
          advisorTeacherName: c.advisorTeacherName || c.headTeacherName || null,
        };

        const existing = await db
          .select({ id: classesTable.id, name: classesTable.name, gradeLevel: classesTable.gradeLevel })
          .from(classesTable)
          .where(and(eq(classesTable.id, id), eq(classesTable.schoolId, schoolId)));

        if (existing.length > 0) {
          const oldName = existing[0].name;
          const oldGrade = existing[0].gradeLevel;
          await db.update(classesTable).set(record).where(eq(classesTable.id, id));

          // 1. Synchronize all students assigned to this class (by id or old name)
          await db
            .update(studentsTable)
            .set({
              classId: record.id,
              className: record.name,
              gradeLevel: record.gradeLevel,
            })
            .where(
              and(
                eq(studentsTable.schoolId, schoolId),
                or(
                  eq(studentsTable.classId, id),
                  eq(studentsTable.className, record.name),
                  ...(oldName ? [eq(studentsTable.className, oldName)] : [])
                )
              )
            );

          // 2. Synchronize active student sessions in trustedDeviceSessionsTable
          if (oldName && oldName !== record.name) {
            try {
              await db
                .update(trustedDeviceSessionsTable)
                .set({ className: record.name })
                .where(
                  and(
                    eq(trustedDeviceSessionsTable.schoolId, schoolId),
                    eq(trustedDeviceSessionsTable.className, oldName)
                  )
                );
            } catch (sessErr) {
              console.warn('[Session Class Sync Warning]:', sessErr);
            }
          }

          // 3. Synchronize attendance & grades records with updated class name
          try {
            await db
              .update(attendanceTable)
              .set({ className: record.name })
              .where(
                and(
                  eq(attendanceTable.schoolId, schoolId),
                  or(eq(attendanceTable.classId, id), ...(oldName ? [eq(attendanceTable.className, oldName)] : []))
                )
              );
            await db
              .update(gradesTable)
              .set({ className: record.name })
              .where(
                and(
                  eq(gradesTable.schoolId, schoolId),
                  or(eq(gradesTable.classId, id), ...(oldName ? [eq(gradesTable.className, oldName)] : []))
                )
              );
          } catch (attErr) {
            console.warn('[Attendance/Grades Class Sync Warning]:', attErr);
          }

          // 4. Synchronize homework with updated class name
          try {
            await db
              .update(homeworkTable)
              .set({ className: record.name })
              .where(
                and(
                  eq(homeworkTable.schoolId, schoolId),
                  or(eq(homeworkTable.classId, id), ...(oldName ? [eq(homeworkTable.className, oldName)] : []))
                )
              );
          } catch (hwErr) {
            console.warn('[Homework Class Sync Warning]:', hwErr);
          }

          // 5. Synchronize community messages, locks, and mutes to canonical class community
          try {
            const canonicalClassCommunityId = `comm-class-${schoolId}-${record.id}`;
            const oldClassSlug = oldName ? oldName.replace(/[\/\s\\]+/g, '-') : '';
            const possibleOldCommunityIds = [
              `comm-class-${record.id}`,
              canonicalClassCommunityId,
              ...(oldClassSlug ? [`comm-class-${oldClassSlug}`, `comm-class-${schoolId}-${oldClassSlug}`] : []),
            ];

            await db
              .update(communityMessagesTable)
              .set({
                communityId: canonicalClassCommunityId,
                classId: record.id,
                gradeId: record.gradeLevel,
              })
              .where(
                and(
                  eq(communityMessagesTable.schoolId, schoolId),
                  or(
                    inArray(communityMessagesTable.communityId, possibleOldCommunityIds),
                    eq(communityMessagesTable.classId, record.id)
                  )
                )
              );

            await db
              .update(communityLocksTable)
              .set({ communityId: canonicalClassCommunityId })
              .where(
                and(
                  eq(communityLocksTable.schoolId, schoolId),
                  inArray(communityLocksTable.communityId, possibleOldCommunityIds)
                )
              );

            await db
              .update(communityMutesTable)
              .set({ communityId: canonicalClassCommunityId })
              .where(
                and(
                  eq(communityMutesTable.schoolId, schoolId),
                  inArray(communityMutesTable.communityId, possibleOldCommunityIds)
                )
              );
          } catch (commErr) {
            console.warn('[Community Messages Class Sync Warning]:', commErr);
          }

          // 6. Realtime Broadcast to update all connected clients
          broadcastCommunityEvent(schoolId, {
            type: 'community_reconciled',
            schoolId,
            classId: record.id,
            className: record.name,
            gradeLevel: record.gradeLevel,
          });
        } else {
          await db.insert(classesTable).values(record);
          broadcastCommunityEvent(schoolId, {
            type: 'community_reconciled',
            schoolId,
            classId: record.id,
            className: record.name,
            gradeLevel: record.gradeLevel,
          });
        }

        res.json({ success: true, class: record });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 14. ADMINISTRATIVE ACTIONS CRUD & STUDENT READ (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/admin-actions', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const user = (req as any).user;

      let actions = await db
        .select()
        .from(adminActionsTable)
        .where(eq(adminActionsTable.schoolId, schoolId))
        .orderBy(desc(adminActionsTable.createdAt));

      // Security check: If student user, only return actions for themselves
      if (user && user.userRole === 'student' && user.studentId) {
        actions = actions.filter((a) => a.studentId === user.studentId);
      } else if (user && user.userRole === 'parent' && Array.isArray(user.studentIds)) {
        actions = actions.filter((a) => user.studentIds.includes(a.studentId));
      }

      res.json({ success: true, actions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.get(
    '/api/schools/:schoolId/students/:studentId/admin-actions',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = (req as any).user;

        // Security check: Verify student exists and belongs to schoolId
        const [student] = await db
          .select({ id: studentsTable.id })
          .from(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

        if (!student) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: الطالب غير موجود أو لا ينتمي لبيانات هذه المدرسة',
          });
        }

        // Security check: If student, must match studentId; if parent, must match authorized children
        if (user && user.userRole === 'student' && user.studentId && user.studentId !== studentId) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: يمكنك فقط عرض الإجراءات الإدارية الخاصة بك',
          });
        }
        if (user && user.userRole === 'parent' && Array.isArray(user.studentIds) && !user.studentIds.includes(studentId)) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: يمكنك فقط عرض الإجراءات الإدارية لأبنائك المعتمدين',
          });
        }

        const actions = await db
          .select()
          .from(adminActionsTable)
          .where(and(eq(adminActionsTable.schoolId, schoolId), eq(adminActionsTable.studentId, studentId)))
          .orderBy(desc(adminActionsTable.createdAt));

        res.json({ success: true, actions });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/admin-actions',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;

        if (!b.studentId || !b.actionType || !b.reason) {
          return res.status(400).json({
            success: false,
            error: 'بيانات الطالب ونوع الإجراء والسبب حقول إجبارية',
          });
        }

        // Verification: Confirm student belongs to this school
        const [student] = await db
          .select({ id: studentsTable.id, name: studentsTable.name, className: studentsTable.className })
          .from(studentsTable)
          .where(and(eq(studentsTable.id, b.studentId), eq(studentsTable.schoolId, schoolId)));

        if (!student) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: الطالب لا ينتمي إلى هذه المدرسة',
          });
        }

        const actionId = b.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();

        const actionRecord = {
          id: actionId,
          schoolId,
          studentId: b.studentId,
          studentName: b.studentName || student.name,
          className: b.className || student.className || '',
          actionType: b.actionType,
          title: b.title || (b.actionType === 'parent_summons' ? 'استدعاء ولي الأمر' : b.actionType === 'expulsion' ? 'قرار طرد / فصل نهائي' : 'إيقاف مؤقت عن الدراسة'),
          summonsDate: b.summonsDate || null,
          summonsTime: b.summonsTime || null,
          startDate: b.startDate || null,
          endDate: b.endDate || null,
          reason: b.reason.trim(),
          notes: b.notes ? b.notes.trim() : null,
          status: b.status || 'نشط',
          createdBy: b.createdBy || 'إدارة المدرسة',
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(adminActionsTable).values(actionRecord);

        res.json({ success: true, action: actionRecord });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.patch(
    '/api/schools/:schoolId/admin-actions/:id',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;
        const updates = req.body || {};

        const [existing] = await db
          .select()
          .from(adminActionsTable)
          .where(and(eq(adminActionsTable.id, id), eq(adminActionsTable.schoolId, schoolId)));

        if (!existing) {
          return res.status(404).json({ success: false, error: 'الإجراء الإداري غير موجود في هذه المدرسة' });
        }

        const updatedRecord = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        await db
          .update(adminActionsTable)
          .set(updatedRecord)
          .where(and(eq(adminActionsTable.id, id), eq(adminActionsTable.schoolId, schoolId)));

        res.json({ success: true, action: updatedRecord });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/admin-actions/:id',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;

        const [existing] = await db
          .select({ id: adminActionsTable.id })
          .from(adminActionsTable)
          .where(and(eq(adminActionsTable.id, id), eq(adminActionsTable.schoolId, schoolId)));

        if (!existing) {
          return res.status(404).json({ success: false, error: 'الإجراء الإداري غير موجود أو ينتمي لمدرسة أخرى' });
        }

        await db
          .delete(adminActionsTable)
          .where(and(eq(adminActionsTable.id, id), eq(adminActionsTable.schoolId, schoolId)));

        res.json({ success: true, deletedId: id });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 14.B INFRACTION MEMOS (مذكرات المشاغبات المدرسية)
  // ----------------------------------------------------
  app.get(
    '/api/schools/:schoolId/infractions',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;

        const memos = await db
          .select()
          .from(infractionMemosTable)
          .where(eq(infractionMemosTable.schoolId, schoolId))
          .orderBy(desc(infractionMemosTable.createdAt));

        res.json({ success: true, memos });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/infractions',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;

        if (!b.students || !Array.isArray(b.students) || b.students.length === 0 || !b.reason?.trim()) {
          return res.status(400).json({
            success: false,
            error: 'يجب اختيار طالب واحد على الأقل وتوضيح سبب المذكرة',
          });
        }

        const id = b.id || `infr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();

        const newRecord = {
          id,
          schoolId,
          teacherId: b.teacherId || (req as any).user?.entityId || 'teacher-unknown',
          teacherName: b.teacherName || (req as any).user?.name || 'معلم',
          subjectName: b.subjectName || null,
          date: b.date || now.split('T')[0],
          time: b.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          students: b.students,
          reason: b.reason.trim(),
          location: b.location || 'الفصل',
          urgency: b.urgency || 'عادي',
          requestedAction: b.requestedAction || 'اتخاذ اللازم',
          status: 'قيد المراجعة',
          adminDecision: null,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(infractionMemosTable).values(newRecord);

        res.json({ success: true, memo: newRecord });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.patch(
    '/api/schools/:schoolId/infractions/:id/decision',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;
        const { actionType, decisionNotes, decidedBy, summonsDate, summonsTime, startDate, endDate } = req.body;

        const [existing] = await db
          .select()
          .from(infractionMemosTable)
          .where(and(eq(infractionMemosTable.id, id), eq(infractionMemosTable.schoolId, schoolId)));

        if (!existing) {
          return res.status(404).json({ success: false, error: 'المذكرة غير موجودة' });
        }

        const now = new Date().toISOString();
        let newStatus = 'قيد المراجعة';
        const createdActionIds: string[] = [];

        // If parent summons or temporary suspension, create official adminActions for all students in memo!
        if (actionType === 'parent_summons') {
          newStatus = 'تم استدعاء ولي أمر';
          for (const s of (existing.students as any[])) {
            const actId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            createdActionIds.push(actId);
            await db.insert(adminActionsTable).values({
              id: actId,
              schoolId,
              studentId: s.studentId,
              studentName: s.studentName,
              className: s.className || '',
              actionType: 'parent_summons',
              title: 'استدعاء ولي الأمر (بناءً على مذكرة مشاغبة)',
              summonsDate: summonsDate || null,
              summonsTime: summonsTime || '10:00 صباحاً',
              startDate: null,
              endDate: null,
              reason: `مذكرة المعلم (${existing.teacherName}): ${existing.reason}`,
              notes: decisionNotes ? decisionNotes.trim() : null,
              status: 'نشط',
              createdBy: decidedBy || 'إدارة المدرسة',
              createdAt: now,
              updatedAt: now,
            });
          }
        } else if (actionType === 'temporary_suspension') {
          newStatus = 'تم الفصل المؤقت';
          for (const s of (existing.students as any[])) {
            const actId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            createdActionIds.push(actId);
            await db.insert(adminActionsTable).values({
              id: actId,
              schoolId,
              studentId: s.studentId,
              studentName: s.studentName,
              className: s.className || '',
              actionType: 'temporary_suspension',
              title: 'قرار فصل مؤقت عن الدراسة (بناءً على مذكرة مشاغبة)',
              summonsDate: null,
              summonsTime: null,
              startDate: startDate || now.split('T')[0],
              endDate: endDate || null,
              reason: `مذكرة المعلم (${existing.teacherName}): ${existing.reason}`,
              notes: decisionNotes ? decisionNotes.trim() : null,
              status: 'نشط',
              createdBy: decidedBy || 'إدارة المدرسة',
              createdAt: now,
              updatedAt: now,
            });
          }
        } else if (actionType === 'skip') {
          newStatus = 'تم الحفظ والتخطي';
        }

        const adminDecision = {
          actionType,
          decisionNotes: decisionNotes ? decisionNotes.trim() : '',
          decisionDate: now.split('T')[0],
          decidedBy: decidedBy || 'إدارة المدرسة',
          actionIds: createdActionIds,
          summonsDate: summonsDate || undefined,
          summonsTime: summonsTime || undefined,
          suspensionStartDate: startDate || undefined,
          suspensionEndDate: endDate || undefined,
        };

        const [updated] = await db
          .update(infractionMemosTable)
          .set({
            status: newStatus,
            adminDecision,
            updatedAt: now,
          })
          .where(and(eq(infractionMemosTable.id, id), eq(infractionMemosTable.schoolId, schoolId)))
          .returning();

        res.json({ success: true, memo: updated });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/infractions/:id',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId, id } = req.params;

        await db
          .delete(infractionMemosTable)
          .where(and(eq(infractionMemosTable.id, id), eq(infractionMemosTable.schoolId, schoolId)));

        res.json({ success: true, deletedId: id });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/classes/:classId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, classId } = req.params;
        const targetClass = await db
          .select()
          .from(classesTable)
          .where(and(eq(classesTable.id, classId), eq(classesTable.schoolId, schoolId)))
          .limit(1);

        const className = targetClass[0]?.name;

        await db
          .delete(classesTable)
          .where(and(eq(classesTable.id, classId), eq(classesTable.schoolId, schoolId)));

        // Unassign any students belonging to this deleted class
        if (className) {
          await db
            .update(studentsTable)
            .set({
              classId: null,
              className: 'بدون فصل',
            })
            .where(
              and(
                eq(studentsTable.schoolId, schoolId),
                or(eq(studentsTable.classId, classId), eq(studentsTable.className, className))
              )
            );
        } else {
          await db
            .update(studentsTable)
            .set({
              classId: null,
              className: 'بدون فصل',
            })
            .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.classId, classId)));
        }

        broadcastCommunityEvent(schoolId, {
          type: 'community_reconciled',
          schoolId,
          deletedClassId: classId,
        });

        res.json({ success: true, deletedClassId: classId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 6. TEACHERS CRUD (PostgreSQL with Tenant Isolation)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/teachers', requireAuth, requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const teachers = await db.select().from(teachersTable).where(eq(teachersTable.schoolId, schoolId));
      const userRole =
        (req as any).userRole ||
        (req as any).user?.userRole ||
        (req as any).session?.userRole ||
        (req.headers['x-user-role'] as string) ||
        '';
      const isPrivileged = userRole === 'owner' || userRole === 'school_admin';
      const safeTeachers = teachers.map((t) => {
        if (isPrivileged) {
          return t;
        }
        const { password: _pw, ...safe } = t;
        return safe;
      });
      res.json({ success: true, teachers: safeTeachers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/teachers',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const body = req.body;
        const items = Array.isArray(body)
          ? body
          : Array.isArray(body?.teachers)
          ? body.teachers
          : [body];

        const savedTeachers: any[] = [];

        for (const t of items) {
          const id = t.id || `tch-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          // If setting as attendance officer, unset existing officer for this school
          if (t.isAttendanceOfficer) {
            await db
              .update(teachersTable)
              .set({ isAttendanceOfficer: false })
              .where(eq(teachersTable.schoolId, schoolId));
          }

          const teacherName = (t.name != null ? String(t.name) : '').trim();
          // Store teacher's name in existing username field
          const effectiveUsername = (!t.isAttendanceOfficer || !t.username)
            ? teacherName
            : String(t.username).trim();

          // Ministry code / password must be string, leading zeros preserved
          const rawCodeOrPass = t.password != null
            ? String(t.password).trim()
            : (t.ministryCode != null ? String(t.ministryCode).trim() : '');

          const record: any = {
            id,
            schoolId,
            name: teacherName,
            nationalId: t.nationalId != null ? String(t.nationalId).trim() : null,
            phone: t.phone != null ? String(t.phone).trim() : null,
            email: t.email != null ? String(t.email).trim() : null,
            username: effectiveUsername,
            specialization: t.specialization || null,
            status: t.status || 'نشط',
            assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
            assignedSubjects: Array.isArray(t.assignedSubjects) ? t.assignedSubjects : [],
            isAttendanceOfficer: Boolean(t.isAttendanceOfficer),
            joinDate: t.joinDate || new Date().toISOString().split('T')[0],
          };

          if (rawCodeOrPass) {
            record.password = rawCodeOrPass;
          }

          const existing = await db
            .select({ id: teachersTable.id, password: teachersTable.password })
            .from(teachersTable)
            .where(and(eq(teachersTable.id, id), eq(teachersTable.schoolId, schoolId)));

          if (existing.length > 0) {
            if (!rawCodeOrPass && existing[0]?.password) {
              record.password = existing[0].password;
            }
            await db.update(teachersTable).set(record).where(eq(teachersTable.id, id));
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
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/teachers/import',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const teachersList = Array.isArray(req.body)
          ? req.body
          : Array.isArray(req.body?.teachers)
          ? req.body.teachers
          : [];

        const imported: any[] = [];
        for (const t of teachersList) {
          const id = t.id || `tch-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const teacherName = (t.name != null ? String(t.name) : '').trim();
          const effectiveUsername = (!t.isAttendanceOfficer || !t.username)
            ? teacherName
            : String(t.username).trim();

          const rawCode = t.password != null
            ? String(t.password).trim()
            : (t.ministryCode != null ? String(t.ministryCode).trim() : '');

          const record: any = {
            id,
            schoolId,
            name: teacherName,
            nationalId: t.nationalId != null ? String(t.nationalId).trim() : null,
            phone: t.phone != null ? String(t.phone).trim() : null,
            email: t.email != null ? String(t.email).trim() : null,
            username: effectiveUsername,
            specialization: t.specialization || null,
            status: t.status || 'نشط',
            assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
            assignedSubjects: Array.isArray(t.assignedSubjects) ? t.assignedSubjects : [],
            isAttendanceOfficer: Boolean(t.isAttendanceOfficer),
            joinDate: t.joinDate || new Date().toISOString().split('T')[0],
          };

          if (rawCode) {
            record.password = rawCode;
          }

          const existing = await db
            .select({ id: teachersTable.id, password: teachersTable.password })
            .from(teachersTable)
            .where(and(eq(teachersTable.id, id), eq(teachersTable.schoolId, schoolId)));

          if (existing.length > 0) {
            if (!rawCode && existing[0]?.password) {
              record.password = existing[0].password;
            }
            await db.update(teachersTable).set(record).where(eq(teachersTable.id, id));
          } else {
            await db.insert(teachersTable).values(record);
          }
          imported.push(record.id);
        }

        res.json({ success: true, importedCount: imported.length });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/teachers/:teacherId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, teacherId } = req.params;
        await db
          .delete(teachersTable)
          .where(and(eq(teachersTable.id, teacherId), eq(teachersTable.schoolId, schoolId)));
        res.json({ success: true, deletedTeacherId: teacherId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 7. STUDENTS CRUD (PostgreSQL with Tenant Isolation)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/students', requireAuth, requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rawStudents = await db.select().from(studentsTable).where(eq(studentsTable.schoolId, schoolId));
      const students = rawStudents.map((s) => {
        let className = s.className ? s.className.trim() : '';
        let gradeLevel = s.gradeLevel ? s.gradeLevel.trim() : '';

        if (!className || className === 'غير محدد' || !gradeLevel || gradeLevel === 'المرحلة الدراسية') {
          const derived = s.nationalId
            ? deriveGradeFromNationalId(s.nationalId)
            : (s.birthDate ? deriveGradeFromNationalId('3' + s.birthDate.replace(/\D/g, '').substring(2)) : '');
          if (derived && derived !== 'المرحلة الدراسية') {
            if (!gradeLevel || gradeLevel === 'المرحلة الدراسية') gradeLevel = derived;
            if (!className || className === 'غير محدد') className = gradeLevel;
          }
        }
        return {
          ...s,
          className: className || 'غير محدد',
          gradeLevel: gradeLevel || s.gradeLevel || 'المرحلة الدراسية',
        };
      });
      res.json({ success: true, students });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/students',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const s = req.body;
        const id = s.id || `std-${schoolId}-${Date.now()}`;

        const derivedGrade =
          s.gradeLevel ||
          extractGradeLevelFromClassName(s.className) ||
          'الصف الأول الابتدائي';

        const record = {
          id,
          schoolId,
          name: s.name,
          studentCode: s.studentCode || `STD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          ministryCode: s.ministryCode || null,
          nationalId: s.nationalId || null,
          classId: s.classId || null,
          className: s.className || 'بدون فصل',
          gradeLevel: derivedGrade,
          birthDate: s.birthDate || null,
          gender: s.gender || 'ذكر',
          status: s.status || 'منتظم',
          parentName: s.parentName || null,
          parentPhone: s.parentPhone || null,
          parentEmail: s.parentEmail || null,
          address: s.address || null,
          joinDate: s.joinDate || new Date().toISOString().split('T')[0],
        };

        const existing = await db
          .select({ id: studentsTable.id })
          .from(studentsTable)
          .where(and(eq(studentsTable.id, id), eq(studentsTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(studentsTable).set(record).where(eq(studentsTable.id, id));
        } else {
          await db.insert(studentsTable).values(record);
        }

        // Keep active trusted device sessions in sync with student's current name and class
        try {
          await db
            .update(trustedDeviceSessionsTable)
            .set({
              className: record.className,
              studentName: record.name,
              userDisplayName: record.name,
            })
            .where(
              and(
                eq(trustedDeviceSessionsTable.schoolId, schoolId),
                eq(trustedDeviceSessionsTable.userId, id)
              )
            );
        } catch (sessErr) {
          console.warn('[Student Session Sync Warning]:', sessErr);
        }

        res.json({ success: true, student: record });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Batch assign students to specific classes (e.g. Day 1 first attendance or admin bulk assignment)
  app.post(
    '/api/schools/:schoolId/students/batch-assign-classes',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { assignments } = req.body || {}; // Array of { studentId, classId, className }

        if (!Array.isArray(assignments) || assignments.length === 0) {
          return res.json({ success: true, count: 0 });
        }

        let updatedCount = 0;
        await db.transaction(async (tx) => {
          for (const item of assignments) {
            if (!item.studentId || !item.classId || !item.className) continue;
            const itemGrade = item.gradeLevel || extractGradeLevelFromClassName(item.className);
            const updatePayload: any = {
              classId: item.classId,
              className: item.className,
            };
            if (itemGrade) {
              updatePayload.gradeLevel = itemGrade;
            }
            await tx
              .update(studentsTable)
              .set(updatePayload)
              .where(and(eq(studentsTable.id, item.studentId), eq(studentsTable.schoolId, schoolId)));

            try {
              await tx
                .update(trustedDeviceSessionsTable)
                .set({ className: item.className })
                .where(
                  and(
                    eq(trustedDeviceSessionsTable.schoolId, schoolId),
                    eq(trustedDeviceSessionsTable.userId, item.studentId)
                  )
                );
            } catch (err) {}

            updatedCount++;
          }
        });

        res.json({ success: true, count: updatedCount });
      } catch (error: any) {
        console.error('Error in batch-assign-classes:', error);
        res.status(500).json({ success: false, error: error?.message || 'فشل تسكين الطلاب في الفصول' });
      }
    }
  );

// Helper to derive Egyptian Grade Level from class name e.g. "3/1 اعدادي" -> "الصف الثالث الإعدادي"
function extractGradeLevelFromClassName(className?: string): string {
  if (!className || !className.trim() || className === 'بدون فصل') return '';
  const c = className.trim();

  if (c.includes('3/') && (c.includes('اعدادي') || c.includes('إعدادي'))) return 'الصف الثالث الإعدادي';
  if (c.includes('2/') && (c.includes('اعدادي') || c.includes('إعدادي'))) return 'الصف الثاني الإعدادي';
  if (c.includes('1/') && (c.includes('اعدادي') || c.includes('إعدادي'))) return 'الصف الأول الإعدادي';

  if (c.includes('3/') && (c.includes('ثانوي') || c.includes('ثانوية'))) return 'الصف الثالث الثانوي';
  if (c.includes('2/') && (c.includes('ثانوي') || c.includes('ثانوية'))) return 'الصف الثاني الثانوي';
  if (c.includes('1/') && (c.includes('ثانوي') || c.includes('ثانوية'))) return 'الصف الأول الثانوي';

  if (c.includes('1/') && (c.includes('ابتدائي') || c.includes('ابتدائية'))) return 'الصف الأول الابتدائي';
  if (c.includes('2/') && (c.includes('ابتدائي') || c.includes('ابتدائية'))) return 'الصف الثاني الابتدائي';
  if (c.includes('3/') && (c.includes('ابتدائي') || c.includes('ابتدائية'))) return 'الصف الثالث الابتدائي';
  if (c.includes('4/') && (c.includes('ابتدائي') || c.includes('ابتدائية'))) return 'الصف الرابع الابتدائي';
  if (c.includes('5/') && (c.includes('ابتدائي') || c.includes('ابتدائية'))) return 'الصف الخامس الابتدائي';
  if (c.includes('6/') && (c.includes('ابتدائي') || c.includes('ابتدائية'))) return 'الصف السادس الابتدائي';

  if (c.includes('روضة أولى') || c.includes('KG1')) return 'روضة أولى (KG1)';
  if (c.includes('روضة ثانية') || c.includes('KG2')) return 'روضة ثانية (KG2)';

  if (c.includes('إعدادي') || c.includes('اعدادي')) {
    if (c.includes('ثالث') || c.includes('3')) return 'الصف الثالث الإعدادي';
    if (c.includes('ثاني') || c.includes('ثانى') || c.includes('2')) return 'الصف الثاني الإعدادي';
    return 'الصف الأول الإعدادي';
  }

  if (c.includes('ثانوي') || c.includes('ثانوية')) {
    if (c.includes('ثالث') || c.includes('3')) return 'الصف الثالث الثانوي';
    if (c.includes('ثاني') || c.includes('ثانى') || c.includes('2')) return 'الصف الثاني الثانوي';
    return 'الصف الأول الثانوي';
  }

  if (c.includes('ابتدائي') || c.includes('ابتدائية')) {
    if (c.includes('سادس') || c.includes('6')) return 'الصف السادس الابتدائي';
    if (c.includes('خامس') || c.includes('5')) return 'الصف الخامس الابتدائي';
    if (c.includes('رابع') || c.includes('4')) return 'الصف الرابع الابتدائي';
    if (c.includes('ثالث') || c.includes('3')) return 'الصف الثالث الابتدائي';
    if (c.includes('ثاني') || c.includes('ثانى') || c.includes('2')) return 'الصف الثاني الابتدائي';
    return 'الصف الأول الابتدائي';
  }

  return '';
}

  // Unassign all students in a selected school from their classes (Plan Mode / "بدون فصل")
  app.post(
    '/api/schools/:schoolId/students/unassign-all',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;

        const schoolStudents = await db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.schoolId, schoolId));

        const schoolClasses = await db
          .select()
          .from(classesTable)
          .where(eq(classesTable.schoolId, schoolId));

        const classById = new Map(schoolClasses.map((c) => [c.id, c]));
        const classByName = new Map(schoolClasses.map((c) => [c.name, c]));

        let updatedCount = 0;

        for (const st of schoolStudents) {
          const matchedClass =
            (st.classId ? classById.get(st.classId) : null) ||
            (st.className ? classByName.get(st.className) : null);

          let derivedGrade =
            st.gradeLevel ||
            matchedClass?.gradeLevel ||
            extractGradeLevelFromClassName(st.className || matchedClass?.name || '');

          if (!derivedGrade) {
            derivedGrade = 'الصف الأول الابتدائي';
          }

          await db
            .update(studentsTable)
            .set({
              classId: null,
              className: 'بدون فصل',
              gradeLevel: derivedGrade,
            })
            .where(and(eq(studentsTable.id, st.id), eq(studentsTable.schoolId, schoolId)));

          updatedCount++;
        }

        res.json({
          success: true,
          count: updatedCount,
          message: `تم تحويل جميع طلاب المدرسة (${updatedCount} طالب) إلى صفة (بدون فصل) مع الحفاظ على الصف الدراسي الأصلي لكل طالب بنجاح (Plan Mode).`,
        });
      } catch (error: any) {
        console.error('Unassign all students error:', error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.get(
    '/api/schools/:schoolId/students/:studentId',
    requireAuth,
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = (req as any).user;

        // Security check: Staff OR student himself/parent
        const isAuthorizedUser =
          user.userRole === 'owner' ||
          user.userRole === 'school_admin' ||
          user.userRole === 'teacher' ||
          user.userRole === 'attendance_teacher' ||
          user.studentId === studentId ||
          user.userId === studentId;

        if (!isAuthorizedUser) {
          return res.status(403).json({ success: false, error: 'غير مصرح بالوصول لبيانات هذا الطالب' });
        }

        const [student] = await db
          .select()
          .from(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

        if (!student) {
          return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
        }

        // Auto-revocation check: If student has a rank-based theme but is no longer eligible (or points <= 0), revoke it
        if (student.avatar_layout_uid === 'theme_top10_aurora' || student.avatar_layout_uid === 'theme_orange_gold') {
          try {
            const lbData = await getSchoolLeaderboard(schoolId, studentId);
            const rank = lbData?.currentStudent?.rank ?? 999999;
            const points = lbData?.currentStudent?.points ?? 0;
            const shouldRevoke =
              (student.avatar_layout_uid === 'theme_top10_aurora' && (rank > 10 || points <= 0)) ||
              (student.avatar_layout_uid === 'theme_orange_gold' && (rank > 100 || points <= 0));

            if (shouldRevoke) {
              student.avatar_layout_uid = 'theme_default_blue';
              await db
                .update(studentsTable)
                .set({ avatar_layout_uid: 'theme_default_blue' })
                .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));
            }
          } catch (e) {
            // Non-critical check failure
          }
        }

        res.json({ success: true, student });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/students/:studentId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        await db
          .delete(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));
        res.json({ success: true, deletedStudentId: studentId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ---------------------------------------------------------------------------
  // 7.1 STUDENT AVATAR THEME UPDATE (Strict Tenant Isolation & Server Eligibility)
  // ---------------------------------------------------------------------------
  app.patch(
    '/api/schools/:schoolId/students/:studentId/avatar-theme',
    requireAuth,
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = (req as any).user;

        // 1. Authenticate user exists and is a student or parent
        if (!user || (user.userRole !== 'student' && user.userRole !== 'parent')) {
          return res.status(403).json({
            success: false,
            error: 'هذا الإجراء مخصص للطلاب وأولياء الأمور فقط',
          });
        }

        // 2. Strict tenant isolation check
        if (user.schoolId !== schoolId) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: لا يمكن تعديل بيانات مدرسة أخرى',
          });
        }

        // 3. Confirm the requester is the student themselves, their authorized parent, or school staff
        const isStudentSelf =
          (user.userRole === 'student' && (user.studentId === studentId || user.userId === studentId)) ||
          (user.userRole === 'parent' &&
            (user.studentId === studentId ||
              user.userId === studentId ||
              (Array.isArray(user.studentIds) && user.studentIds.includes(studentId)) ||
              user.schoolId === schoolId)) ||
          (['owner', 'super_admin', 'school_admin', 'admin', 'teacher', 'attendance_teacher'].includes(user.userRole));

        if (!isStudentSelf) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: لا يمكن تعديل السمة الشخصية لطالب آخر',
          });
        }

        // 4. Validate requested theme ID
        const { themeId } = req.body || {};
        const validThemes = [
          'theme_default_blue',
          'theme_purple_blue',
          'theme_simple_orange',
          'theme_orange_gold',
          'theme_top10_aurora',
        ];

        if (!themeId || typeof themeId !== 'string' || !validThemes.includes(themeId)) {
          return res.status(400).json({
            success: false,
            error: 'معرّف السمة غير صالح أو غير معتمد',
          });
        }

        // 5. Verify student exists in this school
        const [student] = await db
          .select({
            id: studentsTable.id,
            name: studentsTable.name,
            avatar_layout_uid: studentsTable.avatar_layout_uid,
          })
          .from(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

        if (!student) {
          return res.status(404).json({
            success: false,
            error: 'الطالب غير موجود في هذه المدرسة',
          });
        }

        // 6. Server-side authoritative unlock checks (NEVER trust client claims)
        if (themeId === 'theme_purple_blue' || themeId === 'theme_simple_orange') {
          // Check badges from database
          const studentBadges = await db
            .select({
              assignmentId: studentBadgesTable.id,
              badgeId: studentBadgesTable.badgeId,
              rarity: badgesTable.rarity,
              badgeName: badgesTable.name,
            })
            .from(studentBadgesTable)
            .leftJoin(badgesTable, eq(badgesTable.id, studentBadgesTable.badgeId))
            .where(
              and(
                eq(studentBadgesTable.studentId, studentId),
                or(
                  eq(studentBadgesTable.schoolId, schoolId),
                  eq(studentBadgesTable.schoolId, 'sch-1'),
                  isNull(studentBadgesTable.schoolId)
                )
              )
            );

          const totalBadges = studentBadges.length;
          const hasLegendaryBadge = studentBadges.some((b) => {
            const r = (b.rarity || '').toLowerCase().trim();
            const bName = (b.badgeName || '').toLowerCase();
            return (
              r === 'legendary' ||
              r.includes('legend') ||
              r.includes('أسطور') ||
              r.includes('اسطور') ||
              bName.includes('أسطور') ||
              bName.includes('اسطور') ||
              bName.includes('نجم الشهر')
            );
          });

          if (themeId === 'theme_purple_blue' && totalBadges < 1) {
            return res.status(403).json({
              success: false,
              error: 'هذه السمة مقفلة. تتطلب الحصول على وسام واحد على الأقل.',
            });
          }

          if (themeId === 'theme_simple_orange' && !hasLegendaryBadge) {
            return res.status(403).json({
              success: false,
              error: 'هذه السمة مقفلة. تتطلب الحصول على وسام برتبة أسطوري (Legendary).',
            });
          }
        } else if (themeId === 'theme_orange_gold' || themeId === 'theme_top10_aurora') {
          // Check leaderboard ranking from authoritative getSchoolLeaderboard
          const leaderboardData = await getSchoolLeaderboard(schoolId, studentId);
          let currentRank = leaderboardData?.currentStudent?.rank;
          let currentPoints = leaderboardData?.currentStudent?.points ?? 0;
          if ((!currentRank || currentRank <= 0) && Array.isArray(leaderboardData?.leaderboard)) {
            const match = leaderboardData.leaderboard.find(
              (s: any) => s.studentId === studentId || s.id === studentId
            );
            if (match && typeof match.rank === 'number') {
              currentRank = match.rank;
              currentPoints = Number(match.points || 0);
            }
          }

          if (themeId === 'theme_orange_gold') {
            if (!currentRank || currentRank <= 0 || currentRank > 100 || currentPoints <= 0) {
              return res.status(403).json({
                success: false,
                error: 'هذه السمة مقفلة. تتطلب وجود نقاط إيجابية أكبر من صفر وأن تكون ضمن أفضل 100 طالب في لوحة الشرف.',
              });
            }
          }

          if (themeId === 'theme_top10_aurora') {
            if (!currentRank || currentRank <= 0 || currentRank > 10 || currentPoints <= 0) {
              return res.status(403).json({
                success: false,
                error: 'هذه السمة مقفلة. تتطلب وجود نقاط إيجابية أكبر من صفر وأن تكون ضمن العشرة الأوائل (Top 10) في لوحة الشرف.',
              });
            }
          }
        }
        // Note: theme_default_blue is always unlocked for everyone

        // 7. Authoritative persistence in PostgreSQL
        await db
          .update(studentsTable)
          .set({ avatar_layout_uid: themeId })
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

        // 8. Mirror to active in-memory session and trustedDeviceSessions for seamless instant updates
        if (user.sessionId && memorySessionStore.has(user.sessionId)) {
          const memSession = memorySessionStore.get(user.sessionId);
          if (memSession) {
            memSession.avatarUid = themeId;
            memorySessionStore.set(user.sessionId, memSession);
          }
        }

        try {
          await db
            .update(trustedDeviceSessionsTable)
            .set({ avatarUid: themeId })
            .where(
              or(
                eq(trustedDeviceSessionsTable.studentId, studentId),
                eq(trustedDeviceSessionsTable.userId, studentId)
              )
            );
        } catch (sessionErr) {
          // Non-critical session sync error
        }

        try {
          await db
            .update(communityMessagesTable)
            .set({ senderAvatar: themeId })
            .where(
              and(
                eq(communityMessagesTable.schoolId, schoolId),
                eq(communityMessagesTable.senderId, studentId)
              )
            );
        } catch (msgErr) {
          // Non-critical community message avatar sync error
        }

        // 9. Return clean response with updated theme (NO extra student data leaked)
        return res.json({
          success: true,
          selectedTheme: themeId,
          message: 'تم حفظ السمة وتحديث المظهر بنجاح',
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: error?.message || 'فشل في حفظ سمة الهوية البصرية للطالب',
        });
      }
    }
  );

  // ----------------------------------------------------
  // 8. SUBJECTS CRUD (PostgreSQL with Tenant Isolation)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/subjects', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.schoolId, schoolId));
      res.json({ success: true, subjects });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/subjects',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
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
          gradeLevels: Array.isArray(sub.gradeLevels)
            ? sub.gradeLevels
            : sub.gradeLevel
            ? [sub.gradeLevel]
            : [],
          maxScore: Number(sub.maxScore || sub.maxGrade || 100),
          passScore: Number(sub.passScore || sub.passGrade || 50),
          teacherNames: Array.isArray(sub.teacherNames) ? sub.teacherNames : [],
        };

        const existing = await db
          .select({ id: subjectsTable.id })
          .from(subjectsTable)
          .where(and(eq(subjectsTable.id, id), eq(subjectsTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(subjectsTable).set(record).where(eq(subjectsTable.id, id));
        } else {
          await db.insert(subjectsTable).values(record);
        }

        res.json({ success: true, subject: record });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/subjects/:subjectId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, subjectId } = req.params;
        await db
          .delete(subjectsTable)
          .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.schoolId, schoolId)));
        res.json({ success: true, deletedSubjectId: subjectId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 9. ATTENDANCE & ATTENDANCE SESSIONS CRUD (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/attendance', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { date, startDate, endDate, classId, studentId, limit } = req.query;
      const user = (req as any).user;

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      // Validate single date if provided
      if (date && !dateRegex.test(String(date))) {
        return res.status(400).json({
          success: false,
          error: 'صيغة التاريخ غير صالحة، يرجى استخدام صيغة YYYY-MM-DD',
        });
      }

      // Validate startDate if provided
      if (startDate && !dateRegex.test(String(startDate))) {
        return res.status(400).json({
          success: false,
          error: 'صيغة تاريخ البداية غير صالحة، يرجى استخدام صيغة YYYY-MM-DD',
        });
      }

      // Validate endDate if provided
      if (endDate && !dateRegex.test(String(endDate))) {
        return res.status(400).json({
          success: false,
          error: 'صيغة تاريخ النهاية غير صالحة، يرجى استخدام صيغة YYYY-MM-DD',
        });
      }

      // If both startDate and endDate provided, validate chronology and window span (max 366 days)
      if (startDate && endDate) {
        if (String(startDate) > String(endDate)) {
          return res.status(400).json({
            success: false,
            error: 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية',
          });
        }
        const diffDays = Math.ceil(
          (new Date(String(endDate)).getTime() - new Date(String(startDate)).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 366) {
          return res.status(400).json({
            success: false,
            error: 'النطاق الزمني المطلوب كبير جداً (الحد الأقصى 366 يوماً)',
          });
        }
      }

      const conditions = [eq(attendanceTable.schoolId, schoolId)];

      // 1. Single Date
      if (date) {
        conditions.push(eq(attendanceTable.date, String(date)));
      } else {
        // 2. Date Range
        if (startDate) {
          conditions.push(gte(attendanceTable.date, String(startDate)));
        }
        if (endDate) {
          conditions.push(lte(attendanceTable.date, String(endDate)));
        }

        // 4. Default Bounded Window when no date, no startDate/endDate, and no studentId is supplied
        if (!startDate && !endDate && !studentId) {
          // Bounded window: defaults to latest 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split('T')[0];
          conditions.push(gte(attendanceTable.date, thirtyDaysAgoIso));
        }
      }

      // 5. Class Filter
      if (classId) {
        conditions.push(eq(attendanceTable.classId, String(classId)));
      }

      // 3. Student Filter
      if (studentId) {
        conditions.push(eq(attendanceTable.studentId, String(studentId)));
      }

      // Security Enforcement: Student/Parent role isolation at SQL query level
      if (user && user.userRole === 'student') {
        const authedStudentId = user.studentId || user.userId;
        conditions.push(eq(attendanceTable.studentId, authedStudentId));
      } else if (user && user.userRole === 'parent') {
        const allowedStudentIds = (Array.isArray(user.studentIds) && user.studentIds.length > 0)
          ? user.studentIds
          : user.studentId
          ? [user.studentId]
          : user.userId
          ? [user.userId]
          : [];
        if (allowedStudentIds.length > 0) {
          conditions.push(inArray(attendanceTable.studentId, allowedStudentIds));
        } else {
          return res.json({ success: true, records: [] });
        }
      }

      // Keyset/row limits calculation
      let queryLimit: number | undefined;
      if (studentId || (user && (user.userRole === 'student' || user.userRole === 'parent'))) {
        // Student history: default limit 100, max 365
        const parsedLimit = parseInt(String(limit || '100'), 10) || 100;
        queryLimit = Math.min(Math.max(parsedLimit, 1), 365);
      } else if (!date) {
        // School-wide without exact single date: default limit 2000, max 5000
        const parsedLimit = limit ? parseInt(String(limit), 10) : 2000;
        queryLimit = Math.min(Math.max(parsedLimit || 2000, 1), 5000);
      }

      let dbQuery = db
        .select()
        .from(attendanceTable)
        .where(and(...conditions))
        .orderBy(desc(attendanceTable.date));

      if (queryLimit !== undefined) {
        dbQuery = dbQuery.limit(queryLimit) as any;
      }

      const records = await dbQuery;
      res.json({ success: true, records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.get(
    '/api/schools/:schoolId/students/:studentId/attendance',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const { limit } = req.query;
        const user = (req as any).user;

        // Security check: Student role isolation
        if (user && user.userRole === 'student') {
          const authedStudentId = user.studentId || user.userId;
          if (authedStudentId && authedStudentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: لا يمكنك استعراض سجلات حضور طالب آخر',
            });
          }
        }

        // Security check: Parent role isolation
        if (user && user.userRole === 'parent') {
          const allowedStudentIds = (Array.isArray(user.studentIds) && user.studentIds.length > 0)
            ? user.studentIds
            : user.studentId
            ? [user.studentId]
            : user.userId
            ? [user.userId]
            : [];
          if (!allowedStudentIds.includes(studentId)) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: يمكنك فقط استعراض سجل حضور أبنائك المعتمدين',
            });
          }
        }

        const parsedLimit = parseInt(String(limit || '100'), 10) || 100;
        const boundedLimit = Math.min(Math.max(parsedLimit, 1), 365);

        const records = await db
          .select()
          .from(attendanceTable)
          .where(and(eq(attendanceTable.schoolId, schoolId), eq(attendanceTable.studentId, studentId)))
          .orderBy(desc(attendanceTable.date))
          .limit(boundedLimit);

        res.json({ success: true, records });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Authoritative Dynamic Student Points Endpoint (PostgreSQL Source of Truth)
  app.get(
    '/api/schools/:schoolId/students/:studentId/points',
    requireAuth,
    requireSchoolAccess(['owner', 'super_admin', 'school_admin', 'admin', 'teacher', 'attendance_teacher', 'student', 'parent']),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const user = (req as any).user;

        // Security check: Student role isolation (student can only inspect their own points)
        if (user && user.userRole === 'student') {
          const authedStudentId = user.studentId || user.userId;
          if (authedStudentId && authedStudentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: لا يمكنك استعراض نقاط طالب آخر',
            });
          }
        }

        // Security check: Parent role isolation (parent can only inspect linked children)
        if (user && user.userRole === 'parent') {
          const allowedStudentIds = (Array.isArray(user.studentIds) && user.studentIds.length > 0)
            ? user.studentIds
            : user.studentId
            ? [user.studentId]
            : user.userId
            ? [user.userId]
            : [];
          if (!allowedStudentIds.includes(studentId)) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: يمكنك فقط استعراض نقاط أبنائك المعتمدين',
            });
          }
        }

        const pointsResult = await getStudentPoints(schoolId, studentId);
        res.json(pointsResult);
      } catch (error: any) {
        const isNotFound = error?.message?.includes('غير موجود');
        res.status(isNotFound ? 404 : 500).json({
          success: false,
          error: error?.message || 'فشل في احتساب نقاط الطالب',
        });
      }
    }
  );

  // Authoritative Dynamic School Top 100 Leaderboard Endpoint (PostgreSQL Source of Truth)
  app.get(
    '/api/schools/:schoolId/leaderboard',
    requireAuth,
    requireSchoolAccess(['owner', 'super_admin', 'school_admin', 'admin', 'teacher', 'attendance_teacher', 'student', 'parent']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const user = (req as any).user;

        // Security check: If student or parent, determine the student identity server-side
        let currentStudentId: string | undefined = undefined;
        const queryStudentId = typeof req.query.studentId === 'string' ? req.query.studentId.trim() : undefined;

        if (queryStudentId) {
          const isAllowedQuery =
            ['owner', 'super_admin', 'school_admin', 'admin', 'teacher', 'attendance_teacher'].includes(user.userRole) ||
            (user.userRole === 'student' && (user.studentId === queryStudentId || user.userId === queryStudentId)) ||
            (user.userRole === 'parent' && (
              user.studentId === queryStudentId ||
              user.userId === queryStudentId ||
              (Array.isArray(user.studentIds) && user.studentIds.includes(queryStudentId)) ||
              user.schoolId === schoolId
            ));

          if (isAllowedQuery) {
            currentStudentId = queryStudentId;
          }
        }

        if (!currentStudentId) {
          if (user && user.userRole === 'student') {
            currentStudentId = user.studentId || user.userId;
          } else if (user && user.userRole === 'parent') {
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
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error?.message || 'فشل في جلب قائمة الأوائل للمدرسة',
        });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/attendance',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']),
    async (req, res) => {
      // Prevent HTTP request timeout for large school attendance batches (up to 5 minutes)
      req.setTimeout(300000);
      try {
        const { schoolId } = req.params;
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
          return res.status(400).json({ success: false, error: 'قائمة سجلات الحضور فارغة' });
        }

        const defaultDate = new Date().toISOString().split('T')[0];
        const uniqueDates = new Set<string>();

        // Deduplicate incoming records by (studentId, date) within payload, preserving latest
        const dedupedMap = new Map<string, any>();
        for (const rec of records) {
          if (!rec.studentId) continue;
          const date = rec.date || defaultDate;
          uniqueDates.add(date);
          const key = `${rec.studentId}_${date}`;
          dedupedMap.set(key, { ...rec, date });
        }

        const cleanedRecords = Array.from(dedupedMap.values());
        if (cleanedRecords.length === 0) {
          return res.status(400).json({ success: false, error: 'لم يتم العثور على سجلات حضور صالحة' });
        }

        const datesArray = Array.from(uniqueDates);

        // Fetch existing record IDs for these specific dates in ONE query to map any legacy IDs
        const existingRows = await db
          .select({
            id: attendanceTable.id,
            studentId: attendanceTable.studentId,
            date: attendanceTable.date,
          })
          .from(attendanceTable)
          .where(
            and(
              eq(attendanceTable.schoolId, schoolId),
              inArray(attendanceTable.date, datesArray)
            )
          );

        const existingIdMap = new Map<string, string>();
        for (const row of existingRows) {
          existingIdMap.set(`${row.studentId}_${row.date}`, row.id);
        }

        // Fetch school settings to check if 3-consecutive-late rule is enabled
        const [schoolRow] = await db
          .select()
          .from(schoolInfoTable)
          .where(eq(schoolInfoTable.schoolId, schoolId))
          .limit(1);

        const isRuleEnabled = schoolRow
          ? (schoolRow.enableThreeLateRule !== false)
          : (schoolId === 'sch-1' || true);

        // HIGH PERFORMANCE SCALABILITY OPTIMIZATION:
        // Only fetch previous attendance history for students who have at least one record marked 'متأخر' in this batch.
        // Students marked 'حاضر' or 'غائب' can never trigger the "3 consecutive lates" rule!
        // Also limit the lookback window to 14 days prior to earliest date (ample to cover 2 prior school days).
        const lateStudentIds = isRuleEnabled
          ? Array.from(new Set(cleanedRecords.filter((r) => r.status === 'متأخر').map((r) => r.studentId).filter(Boolean)))
          : [];

        const sortedDates = [...datesArray].sort();
        const earliestDate = sortedDates[0] || defaultDate;
        const lookbackDateObj = new Date(earliestDate);
        lookbackDateObj.setDate(lookbackDateObj.getDate() - 14);
        const lookbackDateStr = lookbackDateObj.toISOString().split('T')[0];

        let existingStudentAttendance: Array<{
          id: string;
          studentId: string;
          date: string;
          status: string;
          notes: string | null;
        }> = [];

        if (lateStudentIds.length > 0) {
          const CHUNK_SIZE = 250;
          for (let i = 0; i < lateStudentIds.length; i += CHUNK_SIZE) {
            const chunk = lateStudentIds.slice(i, i + CHUNK_SIZE);
            const chunkRows = await db
              .select({
                id: attendanceTable.id,
                studentId: attendanceTable.studentId,
                date: attendanceTable.date,
                status: attendanceTable.status,
                notes: attendanceTable.notes,
              })
              .from(attendanceTable)
              .where(
                and(
                  eq(attendanceTable.schoolId, schoolId),
                  inArray(attendanceTable.studentId, chunk),
                  gte(attendanceTable.date, lookbackDateStr)
                )
              );
            existingStudentAttendance.push(...chunkRows);
          }
        }

        // Build working student history state map: studentId -> Map<date, { status, notes }>
        const studentHistoryMap = new Map<string, Map<string, { status: string; notes?: string | null }>>();
        for (const row of existingStudentAttendance) {
          if (!studentHistoryMap.has(row.studentId)) {
            studentHistoryMap.set(row.studentId, new Map());
          }
          studentHistoryMap.get(row.studentId)!.set(row.date, {
            status: row.status,
            notes: row.notes,
          });
        }

        // Group cleaned records by studentId to evaluate chronologically per student
        const recordsByStudent = new Map<string, any[]>();
        for (const rec of cleanedRecords) {
          if (!recordsByStudent.has(rec.studentId)) {
            recordsByStudent.set(rec.studentId, []);
          }
          recordsByStudent.get(rec.studentId)!.push(rec);
        }

        const itemsToUpsert: any[] = [];

        for (const [studentId, studentRecs] of recordsByStudent.entries()) {
          // Sort student's incoming records chronologically
          studentRecs.sort((a, b) => a.date.localeCompare(b.date));

          for (const rec of studentRecs) {
            const key = `${rec.studentId}_${rec.date}`;
            const existingId = existingIdMap.get(key);
            const id = existingId || rec.id || `att-${schoolId}-${rec.studentId}-${rec.date}`;

            let finalStatus = rec.status || 'حاضر';
            let finalNotes = rec.notes || null;

            if (isRuleEnabled && finalStatus === 'متأخر') {
              const studentMap = studentHistoryMap.get(studentId) || new Map();

              // Helper to calculate the immediately preceding school day (skipping Egyptian weekend: Friday=5, Saturday=6)
              // If student has an explicit record for 1 calendar day before (e.g. Saturday school session), it respects it.
              const getPrecedingSchoolDay = (isoDateStr: string, knownDates: Map<string, any>): string => {
                const parts = isoDateStr.split('-').map(Number);
                const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                
                // Check 1 calendar day before first
                d.setUTCDate(d.getUTCDate() - 1);
                const oneDayBeforeIso = d.toISOString().split('T')[0];
                if (knownDates.has(oneDayBeforeIso)) {
                  return oneDayBeforeIso;
                }
                
                // Otherwise skip Friday (5) and Saturday (6) standard weekend
                while (d.getUTCDay() === 5 || d.getUTCDay() === 6) {
                  d.setUTCDate(d.getUTCDate() - 1);
                }
                return d.toISOString().split('T')[0];
              };

              // Identify immediately preceding 2 consecutive school days
              const expectedPrevDay1 = getPrecedingSchoolDay(rec.date, studentMap);
              const expectedPrevDay2 = getPrecedingSchoolDay(expectedPrevDay1, studentMap);

              const prev1 = studentMap.get(expectedPrevDay1);
              const prev2 = studentMap.get(expectedPrevDay2);

              // Rule applies ONLY if 3 consecutive school days in a row are late
              const isThreeConsecutiveLates =
                Boolean(prev1 && prev1.status === 'متأخر') &&
                Boolean(prev2 && prev2.status === 'متأخر');

              if (isThreeConsecutiveLates) {
                // Rule triggered: 3rd consecutive late day -> convert to "غائب"
                finalStatus = 'غائب';
                const auditText = '[تحويل تلقائي إلى غائب لتكرار التأخير 3 أيام متتالية (لائحة الانضباط)]';
                if (!finalNotes) {
                  finalNotes = auditText;
                } else if (!finalNotes.includes('تحويل تلقائي إلى غائب')) {
                  finalNotes = `${finalNotes} ${auditText}`;
                }
              }
            }

            // Update studentHistoryMap so subsequent dates in the batch see the updated status
            if (!studentHistoryMap.has(studentId)) {
              studentHistoryMap.set(studentId, new Map());
            }
            studentHistoryMap.get(studentId)!.set(rec.date, {
              status: finalStatus,
              notes: finalNotes,
            });

            itemsToUpsert.push({
              id,
              schoolId,
              studentId: rec.studentId,
              studentName: rec.studentName || 'طالب',
              classId: rec.classId || null,
              className: rec.className || null,
              date: rec.date,
              status: finalStatus,
              notes: finalNotes,
            });
          }
        }

        // Execute batch upserts in a single transaction
        await db.transaction(async (tx) => {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < itemsToUpsert.length; i += CHUNK_SIZE) {
            const chunk = itemsToUpsert.slice(i, i + CHUNK_SIZE);
            await tx
              .insert(attendanceTable)
              .values(chunk)
              .onConflictDoUpdate({
                target: attendanceTable.id,
                set: {
                  studentName: sql`EXCLUDED.student_name`,
                  classId: sql`EXCLUDED.class_id`,
                  className: sql`EXCLUDED.class_name`,
                  status: sql`EXCLUDED.status`,
                  notes: sql`EXCLUDED.notes`,
                },
              });
          }
        });

        res.json({ success: true, records: itemsToUpsert, message: `تم حفظ ${itemsToUpsert.length} سجل حضور بنجاح` });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/attendance/sessions',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const s = req.body;
        const id = s.id || `att-sess-${schoolId}-${Date.now()}`;

        const record = {
          id,
          schoolId,
          date: s.date || new Date().toISOString().split('T')[0],
          completedAt: s.completedAt || s.takenAt || new Date().toISOString(),
          totalClassesCount: Number(s.totalClassesCount) || 1,
          totalStudentsCount: Number(s.totalStudents || s.totalStudentsCount) || 0,
          presentCount: Number(s.presentCount) || 0,
          absentCount: Number(s.absentCount) || 0,
          lateCount: Number(s.lateCount) || 0,
          durationMinutes: Number(s.durationMinutes) || 0,
          teacherName: s.teacherName || s.takenBy || 'مسؤول الغياب',
        };

        await db.insert(attendanceSessionsTable).values(record);
        res.json({ success: true, session: record });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 10. GRADES & BEHAVIOR CRUD (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/grades', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const user = (req as any).user;
      const {
        classId,
        subjectId,
        studentId,
        examName,
        startDate,
        endDate,
        limit,
        page,
      } = req.query as {
        classId?: string;
        subjectId?: string;
        studentId?: string;
        examName?: string;
        startDate?: string;
        endDate?: string;
        limit?: string;
        page?: string;
      };

      // 1. Date range validation
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          error: 'صيغة تاريخ البداية غير صحيحة (YYYY-MM-DD)',
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          error: 'صيغة تاريخ النهاية غير صحيحة (YYYY-MM-DD)',
        });
      }
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({
          success: false,
          error: 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية',
        });
      }

      const conditions: any[] = [eq(gradesTable.schoolId, schoolId)];

      if (startDate) {
        conditions.push(gte(gradesTable.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(gradesTable.date, endDate));
      }

      // 2. Student / Parent security role isolation at SQL level
      if (user && user.userRole === 'student') {
        const authedStudentId = user.studentId || user.userId;
        if (studentId && studentId !== authedStudentId) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: لا يمكنك عرض درجات طالب آخر',
          });
        }
        conditions.push(eq(gradesTable.studentId, authedStudentId));
      } else if (user && user.userRole === 'parent') {
        const allowedStudentIds = Array.isArray(user.studentIds)
          ? user.studentIds
          : user.studentId
          ? [user.studentId]
          : [];

        if (allowedStudentIds.length === 0) {
          return res.json({ success: true, grades: [] });
        }

        if (studentId) {
          if (!allowedStudentIds.includes(studentId)) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: الطالب المطلوب غير مرتبط بحسابك',
            });
          }
          conditions.push(eq(gradesTable.studentId, studentId));
        } else {
          conditions.push(inArray(gradesTable.studentId, allowedStudentIds));
        }
      } else if (studentId) {
        // Owner / Admin / Teacher filtering by specific student
        conditions.push(eq(gradesTable.studentId, studentId));
      }

      // 3. Additional entity scope filters
      if (classId) {
        conditions.push(eq(gradesTable.classId, classId));
      }
      if (subjectId) {
        conditions.push(eq(gradesTable.subjectId, subjectId));
      }
      if (examName) {
        conditions.push(eq(gradesTable.examName, examName));
      }

      // 4. Calculate query limits & pagination
      const isStudentQuery = Boolean(
        studentId || (user && (user.userRole === 'student' || user.userRole === 'parent'))
      );
      const isClassQuery = Boolean(classId);

      let defaultLimit = 1000;
      let maxLimit = 1000;

      if (isStudentQuery) {
        defaultLimit = 100;
        maxLimit = 365;
      } else if (isClassQuery) {
        defaultLimit = 1000;
        maxLimit = 2000;
      } else {
        // Unbounded / Broad request
        defaultLimit = 1000;
        maxLimit = 1000;
      }

      const parsedLimit = limit ? parseInt(String(limit), 10) : defaultLimit;
      const queryLimit = Math.min(
        Math.max(isNaN(parsedLimit) ? defaultLimit : parsedLimit, 1),
        maxLimit
      );

      const pageNum = page ? Math.max(1, parseInt(String(page), 10) || 1) : 1;
      const offset = (pageNum - 1) * queryLimit;

      let dbQuery = db
        .select()
        .from(gradesTable)
        .where(and(...conditions))
        .orderBy(desc(gradesTable.date))
        .limit(queryLimit);

      if (offset > 0) {
        dbQuery = dbQuery.offset(offset) as any;
      }

      const grades = await dbQuery;

      res.json({
        success: true,
        grades,
        limit: queryLimit,
        page: pageNum,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/grades',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
          return res.status(400).json({ success: false, error: 'قائمة الدرجات فارغة' });
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
            examName: g.examName || 'اختبار شهر',
            score: Number(g.score) || 0,
            maxScore: Number(g.maxScore) || 100,
            date: g.date || new Date().toISOString().split('T')[0],
            notes: g.notes || null,
          };

          const existing = await db
            .select({ id: gradesTable.id })
            .from(gradesTable)
            .where(and(eq(gradesTable.id, id), eq(gradesTable.schoolId, schoolId)));

          if (existing.length > 0) {
            await db.update(gradesTable).set(item).where(eq(gradesTable.id, id));
          } else {
            await db.insert(gradesTable).values(item);
          }
        }

        res.json({ success: true, message: `تم حفظ ${records.length} سجل درجات بنجاح` });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.get('/api/schools/:schoolId/behavior', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const behavior = await db.select().from(behaviorTable).where(eq(behaviorTable.schoolId, schoolId));
      res.json({ success: true, behavior });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/behavior',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const beh = req.body;
        const id = beh.id || `beh-${schoolId}-${Date.now()}`;

        const type = beh.type === 'سلبي' ? 'سلبي' : 'إيجابي';
        const rawPoints = Math.abs(Number(beh.points) || 1);
        const clampedMagnitude = Math.min(10, Math.max(1, rawPoints));
        const points = type === 'سلبي' ? -clampedMagnitude : clampedMagnitude;

        // Calculate 6 AM daily cycle start timestamp in Egypt timezone (Africa/Cairo)
        let cycleStartMs: number;
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
          });

          const parts = formatter.formatToParts(now);
          const p: Record<string, number> = {};
          for (const part of parts) {
            if (part.type !== 'literal') {
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
          const tzParts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Africa/Cairo',
            timeZoneName: 'shortOffset',
          }).formatToParts(tempUtcDate);

          const offsetPart = tzParts.find((pt) => pt.type === 'timeZoneName')?.value || 'GMT+3';
          let offsetHours = 3;
          const match = offsetPart.match(/GMT([+-]\d+)/);
          if (match) {
            offsetHours = parseInt(match[1], 10);
          }

          cycleStartMs = Date.UTC(year, month - 1, day, 6 - offsetHours, 0, 0);
        } catch (e) {
          const now = new Date();
          const cycleStart = new Date(now);
          if (now.getHours() < 6) {
            cycleStart.setDate(cycleStart.getDate() - 1);
          }
          cycleStart.setHours(6, 0, 0, 0);
          cycleStartMs = cycleStart.getTime();
        }

        // Enforce 25 daily points limit for teachers
        if (beh.reportedBy && beh.reportedBy !== 'إدارة المدرسة') {
          const teacherBehaviors = await db
            .select({ id: behaviorTable.id, points: behaviorTable.points, date: behaviorTable.date })
            .from(behaviorTable)
            .where(and(eq(behaviorTable.schoolId, schoolId), eq(behaviorTable.reportedBy, beh.reportedBy)));

          let usedPointsToday = 0;
          for (const item of teacherBehaviors) {
            if (item.id === id) continue; // skip current if updating
            let inCycle = false;
            const tsMatch = item.id.match(/(\d{12,13})/);
            if (tsMatch) {
              const ts = parseInt(tsMatch[1], 10);
              if (!isNaN(ts) && ts >= cycleStartMs) {
                inCycle = true;
              }
            } else if (item.date) {
              const cycleDateStr = new Date(cycleStartMs).toISOString().split('T')[0];
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
              error: `تجاوزت الحد اليومي المتاح للمعلم (25 نقطة يومياً). المتبقي لديك: ${remaining} نقطة فقط. يتجدد الرصيد كل صباح الساعة 6:00 ص بتوقيت مصر.`,
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
          date: beh.date || new Date().toISOString().split('T')[0],
          notes: beh.notes || null,
          reportedBy: beh.reportedBy || 'إدارة المدرسة',
        };

        const existing = await db
          .select({ id: behaviorTable.id })
          .from(behaviorTable)
          .where(and(eq(behaviorTable.id, id), eq(behaviorTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(behaviorTable).set(record).where(eq(behaviorTable.id, id));
        } else {
          await db.insert(behaviorTable).values(record);
        }

        res.json({ success: true, behavior: record });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/behavior/:behaviorId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'attendance_teacher']),
    async (req, res) => {
      try {
        const { schoolId, behaviorId } = req.params;
        await db
          .delete(behaviorTable)
          .where(and(eq(behaviorTable.id, behaviorId), eq(behaviorTable.schoolId, schoolId)));
        res.json({ success: true, deletedBehaviorId: behaviorId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 11. ANNOUNCEMENTS CRUD (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/announcements', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const dbAnnouncements = await db
        .select()
        .from(announcementsTable)
        .where(eq(announcementsTable.schoolId, schoolId))
        .orderBy(desc(announcementsTable.createdAt), desc(announcementsTable.id));

      const announcements = dbAnnouncements.map((a) => {
        const priority = a.priority || (a.important ? 'هام' : 'عادي');
        const isImportant = priority === 'هام' || priority === 'عاجل جداً' || Boolean(a.important);

        return {
          id: a.id,
          schoolId: a.schoolId,
          type: a.type || 'general',
          title: a.title,
          content: a.content,
          targetAudience: a.targetAudience || 'الجميع',
          priority,
          important: isImportant,
          publishDate: a.date || new Date().toISOString().split('T')[0],
          date: a.date,
          isScheduled: false,
          author: a.authorName || 'إدارة المدرسة',
          authorName: a.authorName || 'إدارة المدرسة',

          pollOptions: Array.isArray(a.pollOptions) ? a.pollOptions : [],
          pollVotes: Array.isArray(a.pollVotes) ? a.pollVotes : [],
          pollExpiresAt: a.pollExpiresAt || undefined,
          allowMultiple: Boolean(a.allowMultiple),

          eventDate: a.eventDate || undefined,
          eventTime: a.eventTime || undefined,
          eventLocation: a.eventLocation || undefined,
          eventOrganizer: a.eventOrganizer || undefined,
          eventRsvps: Array.isArray(a.eventRsvps) ? a.eventRsvps : [],

          createdAt: a.createdAt?.toISOString() || undefined,
          updatedAt: a.updatedAt?.toISOString() || undefined,
        };
      });

      // Sort newest created announcements first
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

        const dateA = a.publishDate || a.date || '';
        const dateB = b.publishDate || b.date || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);

        return (b.id || '').localeCompare(a.id || '');
      });

      const userRole = (req as any).user?.userRole || (req as any).user?.role || '';
      const visibleAnnouncements = announcements.filter((a) =>
        isAnnouncementVisibleToRole(a.targetAudience, userRole)
      );

      res.json({ success: true, announcements: visibleAnnouncements });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/announcements',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const ann = req.body;
        const id = ann.id || `ann-${schoolId}-${Date.now()}`;

        const priority = ann.priority || (ann.important ? 'هام' : 'عادي');
        const isImportant =
          priority === 'هام' || priority === 'عاجل جداً' || Boolean(ann.important);
        const type = ann.type || 'general';

        const record = {
          id,
          schoolId,
          type,
          title: ann.title,
          content: ann.content,
          targetAudience: ann.targetAudience || 'الجميع',
          authorName: ann.author || ann.authorName || 'إدارة المدرسة',
          date: ann.publishDate || ann.date || new Date().toISOString().split('T')[0],
          important: isImportant,
          priority: priority,

          pollOptions: Array.isArray(ann.pollOptions) ? ann.pollOptions : [],
          pollVotes: Array.isArray(ann.pollVotes) ? ann.pollVotes : [],
          pollExpiresAt: ann.pollExpiresAt || null,
          allowMultiple: Boolean(ann.allowMultiple),

          eventDate: ann.eventDate || null,
          eventTime: ann.eventTime || null,
          eventLocation: ann.eventLocation || null,
          eventOrganizer: ann.eventOrganizer || null,
          eventRsvps: Array.isArray(ann.eventRsvps) ? ann.eventRsvps : [],
          updatedAt: new Date(),
        };

        const existing = await db
          .select({ id: announcementsTable.id })
          .from(announcementsTable)
          .where(and(eq(announcementsTable.id, id), eq(announcementsTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(announcementsTable).set(record).where(eq(announcementsTable.id, id));
        } else {
          await db.insert(announcementsTable).values({
            ...record,
            createdAt: new Date(),
          });
        }

        res.json({
          success: true,
          announcement: {
            ...record,
            priority,
            important: isImportant,
            publishDate: record.date,
            author: record.authorName,
          },
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/announcements/:announcementId/vote',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, announcementId } = req.params;
        const { optionId, optionIds } = req.body;
        const user = (req as any).user || {};
        const userId = user.id || user.userId || user.username || user.email || 'user';
        const userName = user.name || user.username || user.email || 'مستخدم';
        const userRole = user.userRole || user.role || 'user';

        const selectedIds: string[] = Array.isArray(optionIds)
          ? optionIds
          : typeof optionId === 'string'
          ? [optionId]
          : Array.isArray(optionId)
          ? optionId
          : [];

        if (selectedIds.length === 0) {
          return res.status(400).json({ success: false, error: 'يرجى اختيار خيار واحد على الأقل' });
        }

        const [existing] = await db
          .select()
          .from(announcementsTable)
          .where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.schoolId, schoolId)));

        if (!existing) {
          return res.status(404).json({ success: false, error: 'الاعلان غير موجود' });
        }

        if (existing.type !== 'poll') {
          return res.status(400).json({ success: false, error: 'هذا الاعلان ليس استطلاعا للرأي' });
        }

        const currentVotes: any[] = Array.isArray(existing.pollVotes) ? [...existing.pollVotes] : [];
        const filteredVotes = currentVotes.filter((v: any) => v.userId !== userId);

        filteredVotes.push({
          userId,
          userName,
          userRole,
          selectedOptionIds: selectedIds,
          votedAt: new Date().toISOString(),
        });

        // Recalculate options vote counts
        const options: any[] = Array.isArray(existing.pollOptions) ? [...existing.pollOptions] : [];
        const optionVoteMap = new Map<string, number>();
        filteredVotes.forEach((v: any) => {
          (v.selectedOptionIds || []).forEach((optId: string) => {
            optionVoteMap.set(optId, (optionVoteMap.get(optId) || 0) + 1);
          });
        });

        const updatedOptions = options.map((opt: any) => ({
          ...opt,
          votesCount: optionVoteMap.get(opt.id) || 0,
        }));

        await db
          .update(announcementsTable)
          .set({
            pollVotes: filteredVotes,
            pollOptions: updatedOptions,
            updatedAt: new Date(),
          })
          .where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.schoolId, schoolId)));

        const updatedAnnouncement = {
          ...existing,
          type: existing.type,
          pollVotes: filteredVotes,
          pollOptions: updatedOptions,
          publishDate: existing.date || new Date().toISOString().split('T')[0],
          author: existing.authorName || 'إدارة المدرسة',
        };

        res.json({ success: true, announcement: updatedAnnouncement });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/announcements/:announcementId/rsvp',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, announcementId } = req.params;
        const { status } = req.body;
        const user = (req as any).user || {};
        const userId = user.id || user.userId || user.username || user.email || 'user';
        const userName = user.name || user.username || user.email || 'مستخدم';
        const userRole = user.userRole || user.role || 'user';

        if (!['attending', 'interested', 'declined'].includes(status)) {
          return res.status(400).json({ success: false, error: 'حالة المشاركة غير صالحة' });
        }

        const [existing] = await db
          .select()
          .from(announcementsTable)
          .where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.schoolId, schoolId)));

        if (!existing) {
          return res.status(404).json({ success: false, error: 'الاعلان غير موجود' });
        }

        if (existing.type !== 'event') {
          return res.status(400).json({ success: false, error: 'هذا الاعلان ليس فعاليات/حدث' });
        }

        const currentRsvps: any[] = Array.isArray(existing.eventRsvps) ? [...existing.eventRsvps] : [];
        const filteredRsvps = currentRsvps.filter((r: any) => r.userId !== userId);

        filteredRsvps.push({
          userId,
          userName,
          userRole,
          status,
          rsvpAt: new Date().toISOString(),
        });

        await db
          .update(announcementsTable)
          .set({
            eventRsvps: filteredRsvps,
            updatedAt: new Date(),
          })
          .where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.schoolId, schoolId)));

        const updatedAnnouncement = {
          ...existing,
          eventRsvps: filteredRsvps,
          publishDate: existing.date || new Date().toISOString().split('T')[0],
          author: existing.authorName || 'إدارة المدرسة',
        };

        res.json({ success: true, announcement: updatedAnnouncement });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/announcements/:announcementId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, announcementId } = req.params;
        await db
          .delete(announcementsTable)
          .where(and(eq(announcementsTable.id, announcementId), eq(announcementsTable.schoolId, schoolId)));
        res.json({ success: true, deletedAnnouncementId: announcementId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 12. CALENDAR TASKS CRUD (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/calendar-tasks', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const tasks = await db.select().from(calendarTasksTable).where(eq(calendarTasksTable.schoolId, schoolId));
      const mappedTasks = tasks.map((t) => ({
        id: t.id,
        schoolId: t.schoolId,
        school_id: t.schoolId,
        title: t.title,
        description: t.description || '',
        date: t.date,
        task_date: t.date,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        assignedTo: t.assignedTo || null,
        createdAt: t.createdAt,
        created_at: t.createdAt,
        updatedAt: t.updatedAt,
        updated_at: t.updatedAt,
      }));
      res.json({ success: true, tasks: mappedTasks });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/calendar-tasks',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const t = req.body;
        const id = t.id || `task-${schoolId}-${Date.now()}`;
        const taskDate = t.task_date || t.date || new Date().toISOString().split('T')[0];

        const record = {
          id,
          schoolId,
          title: t.title,
          description: t.description || null,
          date: taskDate,
          priority: t.priority || 'medium',
          status: t.status || 'pending',
          assignedTo: t.assignedTo || null,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const existing = await db
          .select({ id: calendarTasksTable.id })
          .from(calendarTasksTable)
          .where(and(eq(calendarTasksTable.id, id), eq(calendarTasksTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(calendarTasksTable).set(record).where(eq(calendarTasksTable.id, id));
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
            updated_at: record.updatedAt,
          },
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.patch(
    '/api/schools/:schoolId/calendar-tasks/:taskId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, taskId } = req.params;
        const updates = req.body;
        const dbUpdates: any = { updatedAt: new Date().toISOString() };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.date !== undefined || updates.task_date !== undefined) {
          dbUpdates.date = updates.task_date || updates.date;
        }
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.assignedTo !== undefined) dbUpdates.assignedTo = updates.assignedTo;

        await db
          .update(calendarTasksTable)
          .set(dbUpdates)
          .where(and(eq(calendarTasksTable.id, taskId), eq(calendarTasksTable.schoolId, schoolId)));
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/calendar-tasks/:taskId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, taskId } = req.params;
        await db
          .delete(calendarTasksTable)
          .where(and(eq(calendarTasksTable.id, taskId), eq(calendarTasksTable.schoolId, schoolId)));
        res.json({ success: true, deletedTaskId: taskId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 13. BADGES CRUD & ASSIGNMENTS (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/badges', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const badges = await db
        .select()
        .from(badgesTable)
        .where(eq(badgesTable.schoolId, schoolId));

      const mappedBadges = badges.map((b) => ({
        id: b.id,
        schoolId: b.schoolId,
        name: b.name,
        nameEn: b.nameEn || undefined,
        description: b.description || '',
        icon: b.icon || '🏆',
        color: b.color || '#D4AF37',
        rarity: b.rarity || 'Mythical',
        targetType: b.targetType || 'student',
        isActive: b.isActive !== false,
        hasAnimatedBorder: b.hasAnimatedBorder !== false,
        limitType: (b.limitType as any) || 'none',
        limit_type: (b.limitType as any) || 'none',
        maxQuantity: b.maxQuantity || 0,
        max_quantity: b.maxQuantity || 0,
        isHidden: Boolean(b.isHidden),
        is_hidden: Boolean(b.isHidden),
        createdAt: b.createdAt || '2026-07-28',
      }));

      res.json({ success: true, badges: mappedBadges });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await db.select().from(badgesTable);
      const mappedBadges = badges.map((b) => ({
        id: b.id,
        schoolId: b.schoolId,
        name: b.name,
        nameEn: b.nameEn || undefined,
        description: b.description || '',
        icon: b.icon || '🏆',
        color: b.color || '#D4AF37',
        rarity: b.rarity || 'Mythical',
        targetType: b.targetType || 'student',
        isActive: b.isActive !== false,
        hasAnimatedBorder: b.hasAnimatedBorder !== false,
        limitType: (b.limitType as any) || 'none',
        limit_type: (b.limitType as any) || 'none',
        maxQuantity: b.maxQuantity || 0,
        max_quantity: b.maxQuantity || 0,
        isHidden: Boolean(b.isHidden),
        is_hidden: Boolean(b.isHidden),
        createdAt: b.createdAt || '2026-07-28',
      }));
      res.json({ success: true, badges: mappedBadges });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/badges',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;
        const id = b.id || `badge-${Date.now()}`;

        const limitType = b.limitType || b.limit_type || 'none';
        const maxQuantity =
          b.maxQuantity !== undefined
            ? Number(b.maxQuantity)
            : b.max_quantity !== undefined
            ? Number(b.max_quantity)
            : 0;
        const isHidden =
          b.isHidden !== undefined
            ? Boolean(b.isHidden)
            : b.is_hidden !== undefined
            ? Boolean(b.is_hidden)
            : false;

        const record = {
          id,
          schoolId,
          name: b.name,
          nameEn: b.nameEn || null,
          description: b.description || '',
          icon: b.icon || '🏆',
          color: b.color || '#D4AF37',
          rarity: b.rarity || 'Mythical',
          targetType: b.targetType || 'student',
          isActive: b.isActive !== false,
          hasAnimatedBorder: b.hasAnimatedBorder !== false,
          limitType,
          maxQuantity,
          isHidden,
        };

        const existing = await db
          .select({ id: badgesTable.id })
          .from(badgesTable)
          .where(and(eq(badgesTable.id, id), eq(badgesTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(badgesTable).set(record).where(eq(badgesTable.id, id));
        } else {
          await db.insert(badgesTable).values(record);
        }

        res.json({
          success: true,
          badge: {
            ...record,
            limit_type: limitType,
            max_quantity: maxQuantity,
            is_hidden: isHidden,
          },
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // PARENTS CRUD (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/parents', requireAuth, requireSchoolAccess(['owner', 'school_admin']), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rows = await db
        .select()
        .from(parentsTable)
        .where(eq(parentsTable.schoolId, schoolId));

      const parents = rows.map((p) => {
        const studentIds = Array.isArray(p.studentIds) ? p.studentIds : [];
        return {
          id: p.id,
          schoolId: p.schoolId,
          name: p.name,
          nationalId: p.nationalId || '',
          phone: p.phone || '',
          email: p.email || '',
          occupation: p.occupation || '',
          address: p.address || '',
          studentIds,
          childrenIds: studentIds,
          student_ids: studentIds,
          relationship: p.relationship || 'ولي أمر',
        };
      });

      res.json({ success: true, parents });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post(
    '/api/schools/:schoolId/parents',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
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
          studentIds: studentIds,
          relationship: p.relationship || 'ولي أمر',
          occupation: p.occupation || null,
          address: p.address || null,
        };

        const existing = await db
          .select({ id: parentsTable.id })
          .from(parentsTable)
          .where(and(eq(parentsTable.id, id), eq(parentsTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(parentsTable).set(record).where(eq(parentsTable.id, id));
        } else {
          await db.insert(parentsTable).values(record);
        }

        res.json({
          success: true,
          parent: {
            ...record,
            childrenIds: studentIds,
            studentIds: studentIds,
            student_ids: studentIds,
          },
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/parents/:parentId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, parentId } = req.params;
        await db
          .delete(parentsTable)
          .where(and(eq(parentsTable.id, parentId), eq(parentsTable.schoolId, schoolId)));
        res.json({ success: true, deletedParentId: parentId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // HOMEWORK CRUD (PostgreSQL)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/homework', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId, studentId } = req.query;

      let rows = await db
        .select()
        .from(homeworkTable)
        .where(eq(homeworkTable.schoolId, schoolId));

      if (classId) {
        rows = rows.filter((h) => h.classId === String(classId));
      }
      if (studentId) {
        rows = rows.filter((h) => h.studentId === String(studentId) || !h.studentId);
      }

      const homework = rows.map((h) => ({
        id: h.id,
        schoolId: h.schoolId,
        studentId: h.studentId || undefined,
        classId: h.classId || undefined,
        className: h.className || undefined,
        subjectName: h.subjectName,
        teacherName: h.teacherName || undefined,
        title: h.title,
        description: h.description || '',
        assignedDate: h.assignedDate,
        dueDate: h.dueDate,
        status: (h.status as any) || 'قيد التنفيذ',
      }));

      res.json({ success: true, homework });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.get(
    '/api/schools/:schoolId/students/:studentId/homework',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;

        const [student] = await db
          .select({ id: studentsTable.id, classId: studentsTable.classId })
          .from(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

        const allHw = await db
          .select()
          .from(homeworkTable)
          .where(eq(homeworkTable.schoolId, schoolId));

        const studentHw = allHw.filter((h) => {
          if (h.studentId && h.studentId === studentId) return true;
          if (student?.classId && h.classId === student.classId) return true;
          if (!h.studentId && !h.classId) return true;
          return false;
        });

        const homework = studentHw.map((h) => ({
          id: h.id,
          schoolId: h.schoolId,
          studentId: h.studentId || undefined,
          classId: h.classId || undefined,
          className: h.className || undefined,
          subjectName: h.subjectName,
          teacherName: h.teacherName || undefined,
          title: h.title,
          description: h.description || '',
          assignedDate: h.assignedDate,
          dueDate: h.dueDate,
          status: (h.status as any) || 'قيد التنفيذ',
        }));

        res.json({ success: true, homework });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/homework',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
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
          subjectName: hw.subjectName || 'عام',
          teacherName: hw.teacherName || null,
          title: hw.title,
          description: hw.description || '',
          assignedDate: hw.assignedDate || new Date().toISOString().split('T')[0],
          dueDate: hw.dueDate || new Date().toISOString().split('T')[0],
          status: hw.status || 'قيد التنفيذ',
        };

        const existing = await db
          .select({ id: homeworkTable.id })
          .from(homeworkTable)
          .where(and(eq(homeworkTable.id, id), eq(homeworkTable.schoolId, schoolId)));

        if (existing.length > 0) {
          await db.update(homeworkTable).set(record).where(eq(homeworkTable.id, id));
        } else {
          await db.insert(homeworkTable).values(record);
        }

        res.json({
          success: true,
          homework: {
            ...record,
            studentId: record.studentId || undefined,
            classId: record.classId || undefined,
            className: record.className || undefined,
          },
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.patch(
    '/api/schools/:schoolId/homework/:homeworkId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher', 'student', 'parent']),
    async (req, res) => {
      try {
        const { schoolId, homeworkId } = req.params;
        const updates = req.body;

        const dbUpdates: any = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.dueDate !== undefined) dbUpdates.dueDate = updates.dueDate;
        if (updates.classId !== undefined) dbUpdates.classId = updates.classId;
        if (updates.className !== undefined) dbUpdates.className = updates.className;

        await db
          .update(homeworkTable)
          .set(dbUpdates)
          .where(and(eq(homeworkTable.id, homeworkId), eq(homeworkTable.schoolId, schoolId)));

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/homework/:homeworkId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId, homeworkId } = req.params;
        await db
          .delete(homeworkTable)
          .where(and(eq(homeworkTable.id, homeworkId), eq(homeworkTable.schoolId, schoolId)));
        res.json({ success: true, deletedHomeworkId: homeworkId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.delete(
    '/api/schools/:schoolId/badges/:badgeId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, badgeId } = req.params;
        const user = (req as any).user;
        const isGlobalAdmin = user?.userRole === 'owner' || user?.userRole === 'super_admin';

        await db
          .delete(badgesTable)
          .where(
            isGlobalAdmin
              ? eq(badgesTable.id, badgeId)
              : and(eq(badgesTable.id, badgeId), or(eq(badgesTable.schoolId, schoolId), sql`${badgesTable.schoolId} IS NULL`))
          );
        await db.delete(studentBadgesTable).where(eq(studentBadgesTable.badgeId, badgeId));
        await db.delete(teacherBadgesTable).where(eq(teacherBadgesTable.badgeId, badgeId));
        res.json({ success: true, deletedBadgeId: badgeId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Student Badge Awarding Endpoint (with strict School Isolation)
  app.post(
    '/api/schools/:schoolId/badges/award-student',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { studentId, badgeId, awardedBy = 'إدارة المدرسة', note = '' } = req.body;

        if (!studentId || !badgeId) {
          return res.status(400).json({ success: false, error: 'بيانات الطالب والوسام مطلوبة' });
        }

        // Verification 1: Confirm student belongs to this school or resolve by alias
        let [student] = await db
          .select({ id: studentsTable.id })
          .from(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

        if (!student) {
          [student] = await db
            .select({ id: studentsTable.id })
            .from(studentsTable)
            .where(eq(studentsTable.id, studentId));
        }

        if (!student) {
          [student] = await db
            .select({ id: studentsTable.id })
            .from(studentsTable)
            .where(or(eq(studentsTable.nationalId, studentId), eq(studentsTable.studentCode, studentId)));
        }

        if (!student) {
          // Auto-insert student record to prevent orphan FK / blocking issues
          try {
            await db.insert(studentsTable).values({
              id: studentId,
              schoolId,
              name: 'طالب مسجل',
              className: 'الصف الأول الابتدائي',
              birthDate: '2019-01-01',
              gender: 'ذكر',
              address: 'جمهورية مصر العربية',
              status: 'منتظم',
            }).onConflictDoNothing();
            student = { id: studentId };
          } catch (stdErr) {
            console.warn('Failed to auto-insert missing student record for badge award', stdErr);
          }
        }

        // Verification 2: Confirm badge belongs to this school or is global (auto-seed default badge if missing)
        let [badge] = await db
          .select({ id: badgesTable.id, schoolId: badgesTable.schoolId })
          .from(badgesTable)
          .where(eq(badgesTable.id, badgeId));

        if (!badge) {
          const def = getBadgeDefinitionFallback(badgeId, schoolId, 'student');
          if (def) {
            await db.insert(badgesTable).values({ id: badgeId, schoolId, ...def }).onConflictDoNothing();
            badge = { id: badgeId, schoolId };
          }
        }

        if (!badge) {
          // If still not found, create on-the-fly badge definition
          const dynamicDef = {
            id: badgeId,
            schoolId,
            name: '🏆 وسام تقديري',
            nameEn: 'Achievement Badge',
            description: 'وسام تقديري للتميز والاجتهاد',
            icon: '🏆',
            color: '#F59E0B',
            rarity: 'Epic',
            targetType: 'student',
            isActive: true,
            hasAnimatedBorder: true,
            limitType: 'none',
            maxQuantity: 0,
            isHidden: false,
          };
          await db.insert(badgesTable).values(dynamicDef).onConflictDoNothing();
          badge = { id: badgeId, schoolId };
        }

        // Allow global badges (sch-1, null, preloaded, badge-*) for all schools
        const isGlobalBadge = !badge.schoolId || badge.schoolId === 'sch-1' || badge.id.startsWith('badge-') || badge.id.startsWith('preloaded-');
        if (badge.schoolId && badge.schoolId !== schoolId && !isGlobalBadge) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: الوسام لا ينتمي إلى هذه المدرسة',
          });
        }

        const id = `sbdg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const awardedAt = new Date().toISOString();

        const awardRecord = {
          id,
          schoolId,
          studentId: student?.id || studentId,
          badgeId,
          awardedBy,
          awardedAt,
          note,
          isUnboxed: false,
        };

        await db.insert(studentBadgesTable).values(awardRecord);

        res.json({ success: true, award: awardRecord });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Teacher Badge Awarding Endpoint (with strict School Isolation)
  app.post(
    '/api/schools/:schoolId/badges/award-teacher',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { teacherId, badgeId, awardedBy = 'إدارة المدرسة', note = '' } = req.body;

        if (!teacherId || !badgeId) {
          return res.status(400).json({ success: false, error: 'بيانات المعلم والوسام مطلوبة' });
        }

        // Verification 1: Confirm teacher belongs to this school
        let [teacher] = await db
          .select({ id: teachersTable.id })
          .from(teachersTable)
          .where(and(eq(teachersTable.id, teacherId), eq(teachersTable.schoolId, schoolId)));

        if (!teacher) {
          [teacher] = await db
            .select({ id: teachersTable.id })
            .from(teachersTable)
            .where(eq(teachersTable.id, teacherId));
        }

        if (!teacher) {
          try {
            await db.insert(teachersTable).values({
              id: teacherId,
              schoolId,
              name: 'معلم مسجل',
              specialization: 'معلم مادة',
              status: 'نشط',
            }).onConflictDoNothing();
            teacher = { id: teacherId };
          } catch (tErr) {
            console.warn('Failed to auto-insert missing teacher record for badge award', tErr);
          }
        }

        // Verification 2: Confirm badge belongs to this school or is global (auto-seed default badge if missing)
        let [badge] = await db
          .select({ id: badgesTable.id, schoolId: badgesTable.schoolId })
          .from(badgesTable)
          .where(eq(badgesTable.id, badgeId));

        if (!badge) {
          const def = getBadgeDefinitionFallback(badgeId, schoolId, 'teacher');
          if (def) {
            await db.insert(badgesTable).values({ id: badgeId, schoolId, ...def }).onConflictDoNothing();
            badge = { id: badgeId, schoolId };
          }
        }

        if (!badge) {
          const dynamicDef = {
            id: badgeId,
            schoolId,
            name: '🏅 وسام تقديري للمعلم',
            nameEn: 'Teacher Recognition',
            description: 'وسام تقديري للجهود المتميزة في التعليم',
            icon: '🏅',
            color: '#2563EB',
            rarity: 'Legendary',
            targetType: 'teacher',
            isActive: true,
            hasAnimatedBorder: true,
            limitType: 'none',
            maxQuantity: 0,
            isHidden: false,
          };
          await db.insert(badgesTable).values(dynamicDef).onConflictDoNothing();
          badge = { id: badgeId, schoolId };
        }

        const isGlobalBadge = !badge.schoolId || badge.schoolId === 'sch-1' || badge.id.startsWith('badge-') || badge.id.startsWith('preloaded-');
        if (badge.schoolId && badge.schoolId !== schoolId && !isGlobalBadge) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: الوسام لا ينتمي إلى هذه المدرسة',
          });
        }

        const id = `tbdg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const awardedAt = new Date().toISOString();

        const awardRecord = {
          id,
          schoolId,
          teacherId: teacher?.id || teacherId,
          badgeId,
          awardedBy,
          awardedAt,
          note,
        };

        await db.insert(teacherBadgesTable).values(awardRecord);

        res.json({ success: true, award: awardRecord });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Get Student Badges Read Path
  app.get(
    '/api/schools/:schoolId/students/:studentId/badges',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, studentId } = req.params;
        const assignments = await db
          .select()
          .from(studentBadgesTable)
          .where(
            or(
              and(eq(studentBadgesTable.studentId, studentId), eq(studentBadgesTable.schoolId, schoolId)),
              eq(studentBadgesTable.studentId, studentId)
            )
          );

        const allBadges = await db.select().from(badgesTable);

        res.json({ success: true, assignments, badges: allBadges });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Mark student badge as unboxed (opened mystery box)
  app.patch(
    '/api/schools/:schoolId/student-badges/:assignmentId/unbox',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, assignmentId } = req.params;
        await db
          .update(studentBadgesTable)
          .set({ isUnboxed: true })
          .where(and(eq(studentBadgesTable.id, assignmentId), eq(studentBadgesTable.schoolId, schoolId)));

        res.json({ success: true, assignmentId, isUnboxed: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Get Teacher Badges Read Path
  app.get(
    '/api/schools/:schoolId/teachers/:teacherId/badges',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId, teacherId } = req.params;
        const assignments = await db
          .select()
          .from(teacherBadgesTable)
          .where(and(eq(teacherBadgesTable.teacherId, teacherId), eq(teacherBadgesTable.schoolId, schoolId)));

        const allBadges = await db.select().from(badgesTable);

        res.json({ success: true, assignments, badges: allBadges });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 14. SMART SUSPENSION RULE & AUDIT LOGS (PostgreSQL)
  // ----------------------------------------------------
  app.get(
    '/api/schools/:schoolId/smart-suspension/alerts',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { status } = req.query;

        let alerts = await db
          .select()
          .from(smartSuspensionAlertsTable)
          .where(eq(smartSuspensionAlertsTable.schoolId, schoolId))
          .orderBy(desc(smartSuspensionAlertsTable.createdAt));

        if (status && typeof status === 'string') {
          alerts = alerts.filter((a) => a.status === status);
        }

        res.json({ success: true, alerts });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/smart-suspension/alerts',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const b = req.body;

        if (!b.studentId || !b.suspensionId || !b.recordedDate) {
          return res.status(400).json({
            success: false,
            error: 'بيانات الطالب وتاريخ التسجيل ومعرف قرار الإيقاف حقول إجبارية',
          });
        }

        // Verify active alert doesn't already exist for this student and date
        const existing = await db
          .select({ id: smartSuspensionAlertsTable.id })
          .from(smartSuspensionAlertsTable)
          .where(
            and(
              eq(smartSuspensionAlertsTable.schoolId, schoolId),
              eq(smartSuspensionAlertsTable.studentId, b.studentId),
              eq(smartSuspensionAlertsTable.recordedDate, b.recordedDate),
              eq(smartSuspensionAlertsTable.status, 'active')
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return res.json({ success: true, alertId: existing[0].id, duplicate: true });
        }

        const nowIso = new Date().toISOString();
        const alertId = b.id || `alert-susp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const alertRecord = {
          id: alertId,
          schoolId,
          studentId: b.studentId,
          studentName: b.studentName || 'طالب',
          studentCode: b.studentCode || b.studentId,
          grade: b.grade || b.className || '',
          className: b.className || b.grade || '',
          attendanceStatus: b.attendanceStatus || 'حاضر',
          suspensionId: b.suspensionId,
          suspensionStartDate: b.suspensionStartDate || b.recordedDate,
          suspensionEndDate: b.suspensionEndDate || b.recordedDate,
          suspensionReason: b.suspensionReason || 'قرار إيقاف نشط',
          attendanceTeacherId: b.attendanceTeacherId || null,
          attendanceTeacherName: b.attendanceTeacherName || 'مسؤول الحضور',
          recordedTime: b.recordedTime || '08:00 صباحاً',
          recordedDate: b.recordedDate,
          status: 'active',
          resolvedAction: null,
          resolvedBy: null,
          resolvedAt: null,
          ignoreReason: null,
          createdAt: b.createdAt || nowIso,
          priority: b.priority || 'High',
          color: b.color || 'orange',
          persistent: true,
        };

        const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const auditLogRecord = {
          id: auditId,
          schoolId,
          alertId,
          studentId: alertRecord.studentId,
          studentName: alertRecord.studentName,
          teacherName: alertRecord.attendanceTeacherName,
          adminName: 'النظام الآلي (مراقبة الإيقاف الذكية)',
          actionTaken: 'إنشاء التنبيه الآلي',
          timestamp: nowIso,
          reason: `تم اكتشاف تسجيل الطالب كـ "${alertRecord.attendanceStatus}" رغم وجود قرار إيقاف نشط للفترة من ${alertRecord.suspensionStartDate} إلى ${alertRecord.suspensionEndDate}`,
        };

        await db.insert(smartSuspensionAlertsTable).values(alertRecord);
        await db.insert(smartSuspensionAuditLogsTable).values(auditLogRecord);

        res.json({ success: true, alert: alertRecord, auditLog: auditLogRecord });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.post(
    '/api/schools/:schoolId/smart-suspension/resolve',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { alertId, action, adminName = 'إدارة المدرسة', ignoreReason } = req.body || {};

        if (!alertId || !action) {
          return res.status(400).json({
            success: false,
            error: 'معرف التنبيه ونوع الإجراء مطلوبان',
          });
        }

        const [alert] = await db
          .select()
          .from(smartSuspensionAlertsTable)
          .where(
            and(
              eq(smartSuspensionAlertsTable.id, alertId),
              eq(smartSuspensionAlertsTable.schoolId, schoolId)
            )
          );

        if (!alert) {
          return res.status(404).json({
            success: false,
            error: 'تنبيه الإيقاف الذكي غير موجود أو ينتمي لمدرسة أخرى',
          });
        }

        const nowIso = new Date().toISOString();
        const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        if (action === 'correct_attendance') {
          // 1. Update PostgreSQL attendance table: set status to 'غائب'
          await db
            .update(attendanceTable)
            .set({
              status: 'غائب',
              notes: 'تم تصحيح الحضور آلياً بواسطة إدارة المدرسة لمطابقة قرار الإيقاف الساري',
            })
            .where(
              and(
                eq(attendanceTable.schoolId, schoolId),
                eq(attendanceTable.studentId, alert.studentId),
                eq(attendanceTable.date, alert.recordedDate)
              )
            );

          // 2. Update smart suspension alert record
          const updatedAlert = {
            status: 'resolved',
            resolvedAction: 'corrected_attendance',
            resolvedBy: adminName,
            resolvedAt: nowIso,
          };
          await db
            .update(smartSuspensionAlertsTable)
            .set(updatedAlert)
            .where(
              and(
                eq(smartSuspensionAlertsTable.id, alertId),
                eq(smartSuspensionAlertsTable.schoolId, schoolId)
              )
            );

          // 3. Create Audit Log
          const auditLog = {
            id: auditId,
            schoolId,
            alertId: alert.id,
            studentId: alert.studentId,
            studentName: alert.studentName,
            teacherName: alert.attendanceTeacherName,
            adminName,
            actionTaken: 'تصحيح الحضور',
            timestamp: nowIso,
            reason: 'تم تغيير حالة الحضور من "حاضر" إلى "غائب" لتوافق قرار الإيقاف الساري.',
          };
          await db.insert(smartSuspensionAuditLogsTable).values(auditLog);

          return res.json({ success: true, action: 'correct_attendance', alert: { ...alert, ...updatedAlert }, auditLog });
        }

        if (action === 'end_suspension') {
          // 1. Update PostgreSQL admin_actions table: set status to 'منتهي'
          await db
            .update(adminActionsTable)
            .set({
              status: 'منتهي',
              notes: 'تم إنهاء قرار الإيقاف رسمياً والسماح للطالب بالحضور',
              updatedAt: nowIso,
            })
            .where(
              and(
                eq(adminActionsTable.schoolId, schoolId),
                eq(adminActionsTable.id, alert.suspensionId)
              )
            );

          // 2. Update smart suspension alert record
          const updatedAlert = {
            status: 'resolved',
            resolvedAction: 'ended_suspension',
            resolvedBy: adminName,
            resolvedAt: nowIso,
          };
          await db
            .update(smartSuspensionAlertsTable)
            .set(updatedAlert)
            .where(
              and(
                eq(smartSuspensionAlertsTable.id, alertId),
                eq(smartSuspensionAlertsTable.schoolId, schoolId)
              )
            );

          // 3. Create Audit Log
          const auditLog = {
            id: auditId,
            schoolId,
            alertId: alert.id,
            studentId: alert.studentId,
            studentName: alert.studentName,
            teacherName: alert.attendanceTeacherName,
            adminName,
            actionTaken: 'إنهاء الإيقاف',
            timestamp: nowIso,
            reason: 'تم إنهاء قرار الإيقاف المؤقت عن الدراسة رسمياً والسماح للطالب بالحضور.',
          };
          await db.insert(smartSuspensionAuditLogsTable).values(auditLog);

          return res.json({ success: true, action: 'end_suspension', alert: { ...alert, ...updatedAlert }, auditLog });
        }

        if (action === 'ignore') {
          const reasonStr = (ignoreReason || '').trim() || 'تم التجاهل بواسطة إدارة المدرسة';

          // 1. Update smart suspension alert record
          const updatedAlert = {
            status: 'resolved',
            resolvedAction: 'ignored',
            ignoreReason: reasonStr,
            resolvedBy: adminName,
            resolvedAt: nowIso,
          };
          await db
            .update(smartSuspensionAlertsTable)
            .set(updatedAlert)
            .where(
              and(
                eq(smartSuspensionAlertsTable.id, alertId),
                eq(smartSuspensionAlertsTable.schoolId, schoolId)
              )
            );

          // 2. Create Audit Log
          const auditLog = {
            id: auditId,
            schoolId,
            alertId: alert.id,
            studentId: alert.studentId,
            studentName: alert.studentName,
            teacherName: alert.attendanceTeacherName,
            adminName,
            actionTaken: 'تجاهل مع سبب',
            timestamp: nowIso,
            reason: reasonStr,
          };
          await db.insert(smartSuspensionAuditLogsTable).values(auditLog);

          return res.json({ success: true, action: 'ignore', alert: { ...alert, ...updatedAlert }, auditLog });
        }

        return res.status(400).json({ success: false, error: 'نوع الإجراء غير معروف' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  app.get(
    '/api/schools/:schoolId/smart-suspension/audit-logs',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'admin']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;

        const auditLogs = await db
          .select()
          .from(smartSuspensionAuditLogsTable)
          .where(eq(smartSuspensionAuditLogsTable.schoolId, schoolId))
          .orderBy(desc(smartSuspensionAuditLogsTable.timestamp));

        res.json({ success: true, auditLogs });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Get All Student Badges in School
  app.get(
    '/api/schools/:schoolId/student-badges',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const assignments = await db
          .select()
          .from(studentBadgesTable)
          .where(
            or(
              eq(studentBadgesTable.schoolId, schoolId),
              eq(studentBadgesTable.schoolId, 'sch-1'),
              isNull(studentBadgesTable.schoolId)
            )
          );
        res.json({ success: true, assignments });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Get All Teacher Badges in School
  app.get(
    '/api/schools/:schoolId/teacher-badges',
    requireAuth,
    requireSchoolAccess(),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const assignments = await db
          .select()
          .from(teacherBadgesTable)
          .where(
            or(
              eq(teacherBadgesTable.schoolId, schoolId),
              eq(teacherBadgesTable.schoolId, 'sch-1'),
              isNull(teacherBadgesTable.schoolId)
            )
          );
        res.json({ success: true, assignments });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Delete/Revoke Student Badge Assignment
  app.delete(
    '/api/schools/:schoolId/student-badges/:assignmentId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, assignmentId } = req.params;
        await db
          .delete(studentBadgesTable)
          .where(and(eq(studentBadgesTable.id, assignmentId), eq(studentBadgesTable.schoolId, schoolId)));
        res.json({ success: true, deletedAssignmentId: assignmentId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Delete/Revoke Teacher Badge Assignment
  app.delete(
    '/api/schools/:schoolId/teacher-badges/:assignmentId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin']),
    async (req, res) => {
      try {
        const { schoolId, assignmentId } = req.params;
        await db
          .delete(teacherBadgesTable)
          .where(and(eq(teacherBadgesTable.id, assignmentId), eq(teacherBadgesTable.schoolId, schoolId)));
        res.json({ success: true, deletedAssignmentId: assignmentId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 14. COMMUNITY REALTIME PUB-SUB & MESSAGES CRUD (PostgreSQL)
  // ----------------------------------------------------
  const broadcastCommunityEvent = (
    schoolId: string,
    event: {
      type:
        | 'new_message'
        | 'update_message'
        | 'delete_message'
        | 'reaction'
        | 'poll_vote'
        | 'pinned'
        | 'user_muted'
        | 'user_unmuted'
        | 'group_lock_toggled'
        | 'community_reconciled';
      communityId?: string;
      message?: any;
      messageId?: string;
      data?: any;
      [key: string]: any;
    }
  ) => {
    const dataString = `data: ${JSON.stringify(event)}\n\n`;
    for (const [clientId, client] of communitySSEClients.entries()) {
      if (client.schoolId === schoolId) {
        if (!client.communityId || client.communityId === event.communityId || client.communityId === 'all') {
          try {
            client.res.write(dataString);
          } catch (err) {
            communitySSEClients.delete(clientId);
          }
        }
      }
    }
  };

  // Realtime Server-Sent Events (SSE) Stream for Community
  app.get('/api/schools/:schoolId/community/stream', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { communityId, token } = req.query;

      const session = extractAuthSession(req);
      if (!session || !session.isAuthenticated) {
        return res.status(401).json({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول للاتصال بالبث المباشر' });
      }

      // Security: School isolation check
      if (session.userRole !== 'owner' && session.schoolId && session.schoolId !== schoolId) {
        return res.status(403).json({ success: false, error: 'غير مصرح: لا تملك صلاحية الوصول لبيانات هذه المدرسة' });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const clientId = `sse-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const client: CommunitySSEClient = {
        id: clientId,
        res,
        schoolId,
        communityId: communityId ? String(communityId) : undefined,
        userId: session.userId || 'anonymous',
        userRole: session.userRole || 'student',
      };

      communitySSEClients.set(clientId, client);

      // Send initial connected handshake
      res.write(`data: ${JSON.stringify({ type: 'connected', schoolId, communityId: client.communityId, clientId })}\n\n`);

      // Heartbeat ping every 20 seconds to keep connection alive across proxies
      const heartbeatInterval = setInterval(() => {
        try {
          res.write(': heartbeat\n\n');
        } catch (err) {
          clearInterval(heartbeatInterval);
          communitySSEClients.delete(clientId);
        }
      }, 20000);

      req.on('close', () => {
        clearInterval(heartbeatInterval);
        communitySSEClients.delete(clientId);
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Fetch messages from PostgreSQL for a school/community with keyset pagination
  app.get('/api/schools/:schoolId/community/messages', requireAuth, requireSchoolAccess(), requireSchoolFeature('student_community'), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { communityId, before } = req.query;

      const parsedLimit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 100);
      const beforeCursor = before ? String(before) : undefined;

      const conditions = [eq(communityMessagesTable.schoolId, schoolId)];
      if (communityId) {
        const cIdStr = String(communityId);
        const matchIds = [cIdStr];
        if (cIdStr.startsWith(`comm-class-${schoolId}-`)) {
          const rawClassId = cIdStr.replace(`comm-class-${schoolId}-`, '');
          matchIds.push(`comm-class-${rawClassId}`);
        } else if (cIdStr.startsWith('comm-class-')) {
          const rawClassId = cIdStr.replace('comm-class-', '');
          matchIds.push(`comm-class-${schoolId}-${rawClassId}`);
        }
        if (cIdStr.startsWith(`comm-grade-${schoolId}-`)) {
          const rawGradeId = cIdStr.replace(`comm-grade-${schoolId}-`, '');
          matchIds.push(`comm-grade-${rawGradeId}`);
        } else if (cIdStr.startsWith('comm-grade-')) {
          const rawGradeId = cIdStr.replace('comm-grade-', '');
          matchIds.push(`comm-grade-${schoolId}-${rawGradeId}`);
        }
        conditions.push(inArray(communityMessagesTable.communityId, matchIds));
      }
      if (beforeCursor) {
        conditions.push(lt(communityMessagesTable.createdAt, beforeCursor));
      }

      const rows = await db
        .select()
        .from(communityMessagesTable)
        .where(and(...conditions))
        .orderBy(desc(communityMessagesTable.createdAt))
        .limit(parsedLimit + 1);

      const hasMore = rows.length > parsedLimit;
      const slicedRows = hasMore ? rows.slice(0, parsedLimit) : rows;
      const nextCursor = hasMore && slicedRows.length > 0 ? (slicedRows[slicedRows.length - 1].createdAt || null) : null;

      // Fetch authoritative student avatar layout UIDs from studentsTable in PostgreSQL
      const studentSenderIds = Array.from(
        new Set(
          slicedRows
            .filter((r) => r.senderRole === 'student' || r.senderRole === 'parent' || (r.senderId && r.senderId.startsWith('std-')))
            .map((r) => r.senderId)
        )
      );

      const studentAvatarMap = new Map<string, string>();
      if (studentSenderIds.length > 0) {
        try {
          const stdAvatars = await db
            .select({ id: studentsTable.id, avatar: studentsTable.avatar_layout_uid })
            .from(studentsTable)
            .where(inArray(studentsTable.id, studentSenderIds));
          for (const s of stdAvatars) {
            if (s.avatar) {
              studentAvatarMap.set(s.id, s.avatar);
            }
          }
        } catch (e) {
          // ignore lookup error
        }
      }

      // Format records into standard CommunityMessage structure
      const messages = slicedRows.map((r) => ({
        id: r.id,
        communityId: r.communityId || r.groupId || 'comm-main',
        schoolId: r.schoolId,
        gradeId: r.gradeId || '',
        classId: r.classId || undefined,
        senderId: r.senderId,
        senderName: r.senderName,
        senderRole: (r.senderRole as any) || 'student',
        senderAvatar: studentAvatarMap.get(r.senderId) || r.senderAvatar || undefined,
        senderBadge: r.senderBadge || undefined,
        message: r.message || r.content || '',
        type: (r.type as any) || 'text',
        createdAt: r.createdAt || r.timestamp || new Date().toISOString(),
        formattedTime:
          r.formattedTime ||
          new Date(r.createdAt || Date.now()).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        editedAt: r.editedAt || undefined,
        deletedAt: r.deletedAt || undefined,
        isDeleted: Boolean(r.isDeleted),
        isPinned: Boolean(r.isPinned),
        replyTo: (r.replyTo as any) || undefined,
        reactions: (r.reactions as any) || {},
        poll: (r.pollData as any) || undefined,
        event: (r.eventData as any) || undefined,
        achievement: (r.achievementData as any) || undefined,
      }));

      // Sort chronologically (oldest first) for chat timeline display
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      res.json({
        success: true,
        messages,
        hasMore,
        nextCursor,
      });
    } catch (error: any) {
      res.json({ success: true, messages: [], hasMore: false, nextCursor: null });
    }
  });

  // Post a new message into PostgreSQL and broadcast realtime event
  app.post('/api/schools/:schoolId/community/messages', requireAuth, requireSchoolAccess(), requireSchoolFeature('student_community'), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const msg = req.body;
      const user = (req as any).user;

      if (!msg.communityId || !msg.message) {
        return res.status(400).json({ success: false, error: 'بيانات الرسالة غير مكتملة (نص الرسالة والمجتمع مطلوبان)' });
      }

      const msgId = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const createdAt = msg.createdAt || now.toISOString();
      const formattedTime =
        msg.formattedTime ||
        now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      const senderId = msg.senderId || user.userId || `usr_${user.userRole || 'student'}`;
      const senderName = msg.senderName || user.userDisplayName || (user.userRole === 'admin' ? 'إدارة المدرسة' : user.userRole === 'teacher' ? 'المعلم' : 'طالب');
      const senderRole = msg.senderRole || user.userRole || 'student';

      // 1. Authoritative Backend Mute Enforcement
      const userMute = await db
        .select()
        .from(communityMutesTable)
        .where(
          and(
            eq(communityMutesTable.schoolId, schoolId),
            eq(communityMutesTable.userId, senderId),
            or(
              eq(communityMutesTable.communityId, msg.communityId),
              eq(communityMutesTable.communityId, 'all')
            )
          )
        )
        .limit(1);

      if (userMute.length > 0) {
        return res.status(403).json({
          success: false,
          error: 'تم كتم حسابك في هذا المجتمع بواسطة إدارة المدرسة ولا يمكنك إرسال رسائل.',
        });
      }

      // 2. Authoritative Backend Group Lock Enforcement (Students rejected if group locked)
      const groupLock = await db
        .select()
        .from(communityLocksTable)
        .where(
          and(
            eq(communityLocksTable.schoolId, schoolId),
            eq(communityLocksTable.communityId, msg.communityId),
            eq(communityLocksTable.isLocked, true)
          )
        )
        .limit(1);

      if (groupLock.length > 0 && (senderRole === 'student' || user.userRole === 'student')) {
        return res.status(403).json({
          success: false,
          error: 'المحادثة في هذا المجتمع مغلقة حالياً بواسطة إدارة المدرسة (مقتصرة على المعلمين والإدارة).',
        });
      }

      // Authoritatively resolve student senderAvatar from PostgreSQL studentsTable
      let effectiveSenderAvatar = msg.senderAvatar;
      if (senderRole === 'student' || senderRole === 'parent' || (senderId && senderId.startsWith('std-'))) {
        try {
          const [stdRow] = await db
            .select({ avatar_layout_uid: studentsTable.avatar_layout_uid })
            .from(studentsTable)
            .where(eq(studentsTable.id, senderId))
            .limit(1);
          if (stdRow?.avatar_layout_uid) {
            effectiveSenderAvatar = stdRow.avatar_layout_uid;
          }
        } catch (e) {}
      }

      const record = {
        id: msgId,
        schoolId,
        communityId: msg.communityId,
        groupId: msg.communityId || msg.groupId || 'comm-main',
        gradeId: msg.gradeId || null,
        classId: msg.classId || null,
        senderId,
        senderName,
        senderRole,
        senderAvatar: effectiveSenderAvatar || null,
        senderBadge: msg.senderBadge || null,
        type: msg.type || 'text',
        message: msg.message,
        content: msg.message || msg.content || '',
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
        reactions: msg.reactions || {},
      };

      await db.insert(communityMessagesTable).values(record).onConflictDoUpdate({
        target: communityMessagesTable.id,
        set: record,
      });

      const formattedMessage = {
        id: record.id,
        communityId: record.communityId,
        schoolId: record.schoolId,
        gradeId: record.gradeId || '',
        classId: record.classId || undefined,
        senderId: record.senderId,
        senderName: record.senderName,
        senderRole: record.senderRole as any,
        senderAvatar: record.senderAvatar || undefined,
        senderBadge: record.senderBadge || undefined,
        message: record.message,
        type: record.type as any,
        createdAt: record.createdAt,
        formattedTime: record.formattedTime,
        editedAt: record.editedAt || undefined,
        deletedAt: record.deletedAt || undefined,
        isDeleted: record.isDeleted,
        isPinned: record.isPinned,
        replyTo: record.replyTo,
        reactions: record.reactions,
        poll: record.pollData,
        event: record.eventData,
        achievement: record.achievementData,
      };

      // Broadcast to other connected devices in this school/group in realtime!
      broadcastCommunityEvent(schoolId, {
        type: 'new_message',
        communityId: record.communityId,
        message: formattedMessage,
      });

      res.json({ success: true, message: formattedMessage });
    } catch (error: any) {
      console.error('[Post Community Message Error]:', error);
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Update a message (Edit, Reaction, Poll Vote, Event Attendee, Pin, Soft Delete)
  app.patch(
    '/api/schools/:schoolId/community/messages/:messageId',
    requireAuth,
    requireSchoolAccess(),
    requireSchoolFeature('student_community'),
    async (req, res) => {
      try {
        const { schoolId, messageId } = req.params;
        const updates = req.body;
        const user = (req as any).user;

        // Fetch existing message to check permissions
        const existing = await db
          .select()
          .from(communityMessagesTable)
          .where(
            and(
              eq(communityMessagesTable.id, messageId),
              eq(communityMessagesTable.schoolId, schoolId)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }

        const currentMsg = existing[0];

        // Prepare db update payload
        const dbUpdates: any = {};

        if (updates.message !== undefined) {
          // Edit message content - strictly restricted to school administration
          const isAdmin = user.userRole === 'admin' || user.userRole === 'owner' || user.userRole === 'school_admin';
          if (!isAdmin) {
            return res.status(403).json({ success: false, error: 'غير مصرح: تعديل الرسائل مقتصر على إدارة المدرسة فقط' });
          }
          dbUpdates.message = updates.message;
          dbUpdates.content = updates.message;
          dbUpdates.editedAt = new Date().toISOString();
        }

        if (updates.isDeleted !== undefined) {
          // Delete message - strictly restricted to school administration
          const isAdmin = user.userRole === 'admin' || user.userRole === 'owner' || user.userRole === 'school_admin';
          if (!isAdmin) {
            return res.status(403).json({ success: false, error: 'غير مصرح: حذف الرسائل مقتصر على إدارة المدرسة فقط' });
          }
          dbUpdates.isDeleted = Boolean(updates.isDeleted);
          dbUpdates.deletedAt = new Date().toISOString();
          if (updates.message) {
            dbUpdates.message = updates.message;
            dbUpdates.content = updates.message;
          }
        }

        if (updates.reactions !== undefined) {
          dbUpdates.reactions = updates.reactions;
        }

        if (updates.poll !== undefined || updates.pollData !== undefined) {
          dbUpdates.pollData = updates.poll || updates.pollData;
        }

        if (updates.event !== undefined || updates.eventData !== undefined) {
          dbUpdates.eventData = updates.event || updates.eventData;
        }

        if (updates.isPinned !== undefined) {
          dbUpdates.isPinned = Boolean(updates.isPinned);
        }

        await db
          .update(communityMessagesTable)
          .set(dbUpdates)
          .where(
            and(
              eq(communityMessagesTable.id, messageId),
              eq(communityMessagesTable.schoolId, schoolId)
            )
          );

        // Fetch updated record to broadcast
        const updatedRow = await db
          .select()
          .from(communityMessagesTable)
          .where(
            and(
              eq(communityMessagesTable.id, messageId),
              eq(communityMessagesTable.schoolId, schoolId)
            )
          )
          .limit(1);

        if (updatedRow.length > 0) {
          const r = updatedRow[0];
          const formattedUpdated = {
            id: r.id,
            communityId: r.communityId || r.groupId || 'comm-main',
            schoolId: r.schoolId,
            gradeId: r.gradeId || '',
            classId: r.classId || undefined,
            senderId: r.senderId,
            senderName: r.senderName,
            senderRole: (r.senderRole as any) || 'student',
            senderAvatar: r.senderAvatar || undefined,
            senderBadge: r.senderBadge || undefined,
            message: r.message || r.content || '',
            type: (r.type as any) || 'text',
            createdAt: r.createdAt || r.timestamp || new Date().toISOString(),
            formattedTime: r.formattedTime,
            editedAt: r.editedAt || undefined,
            deletedAt: r.deletedAt || undefined,
            isDeleted: Boolean(r.isDeleted),
            isPinned: Boolean(r.isPinned),
            replyTo: (r.replyTo as any) || undefined,
            reactions: (r.reactions as any) || {},
            poll: (r.pollData as any) || undefined,
            event: (r.eventData as any) || undefined,
            achievement: (r.achievementData as any) || undefined,
          };

          broadcastCommunityEvent(schoolId, {
            type: 'update_message',
            communityId: formattedUpdated.communityId,
            message: formattedUpdated,
          });

          return res.json({ success: true, message: formattedUpdated });
        }

        res.json({ success: true });
      } catch (error: any) {
        console.error('[Patch Community Message Error]:', error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // Delete message endpoint (hard delete or soft delete)
  app.delete(
    '/api/schools/:schoolId/community/messages/:messageId',
    requireAuth,
    requireSchoolAccess(),
    requireSchoolFeature('student_community'),
    async (req, res) => {
      try {
        const { schoolId, messageId } = req.params;
        const user = (req as any).user;

        const existing = await db
          .select()
          .from(communityMessagesTable)
          .where(
            and(
              eq(communityMessagesTable.id, messageId),
              eq(communityMessagesTable.schoolId, schoolId)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }

        const msg = existing[0];
        const isAdmin = user.userRole === 'admin' || user.userRole === 'owner' || user.userRole === 'school_admin';
        if (!isAdmin) {
          return res.status(403).json({ success: false, error: 'غير مصرح: حذف الرسائل مقتصر على إدارة المدرسة فقط' });
        }

        const deletedNote = 'تم حذف هذه الرسالة بواسطة إدارة المدرسة';

        await db
          .update(communityMessagesTable)
          .set({
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            message: deletedNote,
            content: deletedNote,
          })
          .where(
            and(
              eq(communityMessagesTable.id, messageId),
              eq(communityMessagesTable.schoolId, schoolId)
            )
          );

        broadcastCommunityEvent(schoolId, {
          type: 'delete_message',
          communityId: msg.communityId || 'comm-main',
          messageId,
          data: {
            isDeleted: true,
            message: deletedNote,
          },
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error('[Delete Community Message Error]:', error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // COMMUNITY MODERATION: MUTES API (PostgreSQL Authoritative)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/community/mutes', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rows = await db
        .select()
        .from(communityMutesTable)
        .where(eq(communityMutesTable.schoolId, schoolId));

      const mutes = rows.map((r) => ({
        id: r.id,
        schoolId: r.schoolId,
        communityId: r.communityId,
        userId: r.userId,
        userName: r.userName,
        mutedBy: r.mutedBy,
        mutedAt: r.mutedAt,
        reason: r.reason || undefined,
      }));

      res.json({ success: true, mutes });
    } catch (error: any) {
      res.json({ success: true, mutes: [] });
    }
  });

  app.post(
    '/api/schools/:schoolId/community/mutes/toggle',
    requireAuth,
    requireSchoolAccess(['owner', 'admin', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { communityId, userId, userName, mutedBy, reason } = req.body;
        const user = (req as any).user;

        if (!communityId || !userId || !userName) {
          return res.status(400).json({
            success: false,
            error: 'بيانات الكتم غير مكتملة (المجتمع ومعرف المستخدم والاسم مطلوبان)',
          });
        }

        // Check if user is already muted in this community
        const existing = await db
          .select()
          .from(communityMutesTable)
          .where(
            and(
              eq(communityMutesTable.schoolId, schoolId),
              eq(communityMutesTable.communityId, communityId),
              eq(communityMutesTable.userId, userId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Unmute user
          await db
            .delete(communityMutesTable)
            .where(eq(communityMutesTable.id, existing[0].id));

          broadcastCommunityEvent(schoolId, {
            type: 'user_unmuted',
            communityId,
            data: {
              userId,
              userName,
              communityId,
              isMuted: false,
            },
          });

          return res.json({
            success: true,
            isMuted: false,
            message: `تم إلغاء كتم المستخدم ${userName}`,
          });
        } else {
          // Mute user
          const muteId = `mute-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const now = new Date().toISOString();
          const muteRecord = {
            id: muteId,
            schoolId,
            communityId,
            userId,
            userName,
            mutedBy: mutedBy || user.userDisplayName || 'إدارة المدرسة',
            mutedAt: now,
            reason: reason || null,
            createdAt: now,
          };

          await db.insert(communityMutesTable).values(muteRecord);

          broadcastCommunityEvent(schoolId, {
            type: 'user_muted',
            communityId,
            data: {
              userId,
              userName,
              communityId,
              isMuted: true,
              mute: muteRecord,
            },
          });

          return res.json({
            success: true,
            isMuted: true,
            mute: muteRecord,
            message: `تم كتم المستخدم ${userName} بنجاح`,
          });
        }
      } catch (error: any) {
        console.error('[Toggle Community Mute Error]:', error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // COMMUNITY MODERATION: GROUP LOCKS API (PostgreSQL Authoritative)
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/community/locks', requireAuth, requireSchoolAccess(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const rows = await db
        .select()
        .from(communityLocksTable)
        .where(eq(communityLocksTable.schoolId, schoolId));

      const locks = rows.map((r) => ({
        id: r.id,
        schoolId: r.schoolId,
        communityId: r.communityId,
        isLocked: Boolean(r.isLocked),
        lockedBy: r.lockedBy || undefined,
        lockedAt: r.lockedAt || undefined,
      }));

      res.json({ success: true, locks });
    } catch (error: any) {
      res.json({ success: true, locks: [] });
    }
  });

  app.post(
    '/api/schools/:schoolId/community/locks/toggle',
    requireAuth,
    requireSchoolAccess(['owner', 'admin', 'school_admin', 'teacher']),
    async (req, res) => {
      try {
        const { schoolId } = req.params;
        const { communityId } = req.body;
        const user = (req as any).user;

        if (!communityId) {
          return res.status(400).json({
            success: false,
            error: 'معرف المجتمع مطلوب لتغيير حالة القفل',
          });
        }

        const existing = await db
          .select()
          .from(communityLocksTable)
          .where(
            and(
              eq(communityLocksTable.schoolId, schoolId),
              eq(communityLocksTable.communityId, communityId)
            )
          )
          .limit(1);

        const now = new Date().toISOString();
        let isLockedNow = true;

        if (existing.length > 0) {
          isLockedNow = !existing[0].isLocked;
          await db
            .update(communityLocksTable)
            .set({
              isLocked: isLockedNow,
              lockedBy: user.userDisplayName || user.userId || 'إدارة المدرسة',
              lockedAt: isLockedNow ? now : null,
              updatedAt: now,
            })
            .where(eq(communityLocksTable.id, existing[0].id));
        } else {
          isLockedNow = true;
          const lockId = `lock-${schoolId}-${communityId.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
          await db.insert(communityLocksTable).values({
            id: lockId,
            schoolId,
            communityId,
            isLocked: true,
            lockedBy: user.userDisplayName || user.userId || 'إدارة المدرسة',
            lockedAt: now,
            updatedAt: now,
          });
        }

        broadcastCommunityEvent(schoolId, {
          type: 'group_lock_toggled',
          communityId,
          data: {
            communityId,
            isLocked: isLockedNow,
            lockedBy: user.userDisplayName || 'إدارة المدرسة',
          },
        });

        res.json({
          success: true,
          isLocked: isLockedNow,
          message: isLockedNow ? 'تم إغلاق المحادثة' : 'تم فتح المحادثة للجميع',
        });
      } catch (error: any) {
        console.error('[Toggle Group Lock Error]:', error);
        res.status(500).json({ success: false, error: error?.message });
      }
    }
  );

  // ----------------------------------------------------
  // 🧩 SCHOOL EXTENSIONS & FEATURE TOGGLES MANAGEMENT
  // ----------------------------------------------------

  // 1. GET /api/schools/:schoolId/extensions
  // Returns all registered extensions and their school-specific activation/settings state
  app.get('/api/schools/:schoolId/extensions', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const extensions = await getSchoolExtensions(schoolId);
      res.json({ success: true, extensions });
    } catch (error: any) {
      console.error('[GET Extensions Error]:', error);
      res.status(500).json({ success: false, error: error?.message || 'تعذر جلب بيانات الامتدادات' });
    }
  });

  // 2. PATCH /api/schools/:schoolId/extensions/:extensionId
  // Allows School Admins & Platform Owners to enable/disable extensions and update feature settings
  app.patch(
    '/api/schools/:schoolId/extensions/:extensionId',
    requireAuth,
    requireSchoolAccess(['owner', 'school_admin', 'admin', 'super_admin']),
    async (req, res) => {
      try {
        const { schoolId, extensionId } = req.params;
        const { isEnabled, settings } = req.body || {};
        const user = (req as any).user;

        // Verify that students/parents/teachers cannot perform extension modifications
        if (
          user.userRole !== 'owner' &&
          user.userRole !== 'super_admin' &&
          user.userRole !== 'school_admin' &&
          user.userRole !== 'admin'
        ) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: تقتصر إدارة وتعديل الامتدادات على إدارة المدرسة والمالك فقط',
          });
        }

        const updated = await updateSchoolExtension(schoolId, extensionId, {
          isEnabled,
          settings,
          updatedBy: user.userId || user.userDisplayName || 'admin',
        });

        res.json({ success: true, extension: updated });
      } catch (error: any) {
        console.error('[PATCH Extension Error]:', error);
        res.status(400).json({ success: false, error: error?.message || 'تعذر تحديث الامتداد' });
      }
    }
  );

  // 3. GET /api/schools/:schoolId/features/status
  // Returns live feature lock states for client UI rendering
  app.get('/api/schools/:schoolId/features/status', async (req, res) => {
    try {
      const { schoolId } = req.params;
      const user = extractAuthSession(req);
      const features = await getSchoolFeaturesSummary(schoolId, user?.userRole);
      res.json({ success: true, features });
    } catch (error: any) {
      console.error('[GET Features Status Error]:', error);
      res.status(500).json({ success: false, error: error?.message || 'تعذر جلب حالة الميزات' });
    }
  });
}

// ----------------------------------------------------
// Demo Initial School Data Seeder (PostgreSQL)
// ONLY Seeds Default Demo School 'sch-1'. Never new schools.
// ----------------------------------------------------
const isSeedingMap = new Map<string, boolean>();

export async function ensureDemoSchoolDataSeeded(schoolId: string) {
  // STRICT CONSTRAINT: Only seed the initial Nile demo school (sch-1)
  if (schoolId !== 'sch-1') return;
  if (isSeedingMap.get(schoolId)) return;

  try {
    isSeedingMap.set(schoolId, true);

    // Verify school still exists in schoolInfoTable before seeding to avoid creating orphaned data
    const existingSchool = await db
      .select({ schoolId: schoolInfoTable.schoolId })
      .from(schoolInfoTable)
      .where(eq(schoolInfoTable.schoolId, schoolId))
      .limit(1);

    if (existingSchool.length === 0) {
      return;
    }

    // Check if teachers exist for this school
    const existingTeachers = await db
      .select({ id: teachersTable.id })
      .from(teachersTable)
      .where(eq(teachersTable.schoolId, schoolId))
      .limit(1);

    if (existingTeachers.length === 0) {
      console.log(`[DB] Seeding initial operational data for demo school ${schoolId} in PostgreSQL...`);

      // 1. Classes
      const defaultClasses = [
        { id: `cls-${schoolId}-kg1`, schoolId, name: 'روضة أولى (KG-1) - أ', gradeLevel: 'رياض أطفال', capacity: 25, roomNumber: 'KG-101', advisorTeacherName: 'أ. هبة الله محمود' },
        { id: `cls-${schoolId}-kg2`, schoolId, name: 'روضة ثانية (KG-2) - أ', gradeLevel: 'رياض أطفال', capacity: 25, roomNumber: 'KG-102', advisorTeacherName: 'أ. هبة الله محمود' },
        { id: `cls-${schoolId}-p1`, schoolId, name: 'الصف الأول الابتدائي - أ', gradeLevel: 'المرحلة الابتدائية', capacity: 35, roomNumber: 'A-101', advisorTeacherName: 'أ. منى السيد' },
        { id: `cls-${schoolId}-p3`, schoolId, name: 'الصف الثالث الابتدائي - أ', gradeLevel: 'المرحلة الابتدائية', capacity: 35, roomNumber: 'A-103', advisorTeacherName: 'أ. سارة مصطفى' },
        { id: `cls-${schoolId}-p6`, schoolId, name: 'الصف السادس الابتدائي - أ', gradeLevel: 'المرحلة الابتدائية', capacity: 35, roomNumber: 'A-206', advisorTeacherName: 'أ. طارق الشناوي' },
        { id: `cls-${schoolId}-m1`, schoolId, name: 'الصف الأول الإعدادي - أ', gradeLevel: 'المرحلة الإعدادية', capacity: 35, roomNumber: 'B-101', advisorTeacherName: 'أ. محمد عبد السلام' },
        { id: `cls-${schoolId}-m3`, schoolId, name: 'الصف الثالث الإعدادي - أ', gradeLevel: 'المرحلة الإعدادية', capacity: 35, roomNumber: 'B-103', advisorTeacherName: 'د. محمود حسن' },
        { id: `cls-${schoolId}-s1`, schoolId, name: 'الصف الأول الثانوي - أ', gradeLevel: 'المرحلة الثانوية', capacity: 30, roomNumber: 'C-101', advisorTeacherName: 'أ. رانيا عادل' },
        { id: `cls-${schoolId}-s3`, schoolId, name: 'الصف الثالث الثانوي - أ', gradeLevel: 'المرحلة الثانوية', capacity: 30, roomNumber: 'C-301', advisorTeacherName: 'د. خالد توفيق' },
      ];

      for (const cls of defaultClasses) {
        await db.insert(classesTable).values(cls).onConflictDoNothing();
      }

      // 2. Teachers (Including Attendance Officer)
      const defaultTeachers = [
        {
          id: `tch-${schoolId}-att`,
          schoolId,
          name: 'أ. أسامة محمود (محضر الغياب)',
          nationalId: '29201010101999',
          phone: '01098765432',
          email: 'osama.attendance@school.edu.eg',
          username: 'att_officer',
          password: hashPassword('Password123'),
          isAttendanceOfficer: true,
          specialization: 'مسؤول ومحضر الحضور والغياب اليومي للمدرسة',
          status: 'نشط',
          assignedClasses: [],
          assignedSubjects: [],
          joinDate: '2023-01-01',
        },
        {
          id: `tch-${schoolId}-1`,
          schoolId,
          name: 'أ. هبة الله محمود',
          nationalId: '29305120102934',
          phone: '01011223344',
          email: 'heba.m@school.edu.eg',
          username: 'أ. هبة الله محمود',
          password: hashPassword('10001'),
          isAttendanceOfficer: false,
          specialization: 'رياض أطفال وتربية مبكرة (KG)',
          status: 'نشط',
          assignedClasses: ['روضة أولى (KG-1) - أ', 'روضة ثانية (KG-2) - أ'],
          assignedSubjects: ['اكتشف والأنشطة (Discovery)'],
          joinDate: '2023-09-01',
        },
        {
          id: `tch-${schoolId}-2`,
          schoolId,
          name: 'أ. منى السيد',
          nationalId: '29008151203948',
          phone: '01122334455',
          email: 'mona.elsayed@school.edu.eg',
          username: 'أ. منى السيد',
          password: hashPassword('10002'),
          isAttendanceOfficer: false,
          specialization: 'اللغة العربية - المرحلة الابتدائية',
          status: 'نشط',
          assignedClasses: ['الصف الأول الابتدائي - أ'],
          assignedSubjects: ['اللغة العربية والخط'],
          joinDate: '2022-01-15',
        },
        {
          id: `tch-${schoolId}-3`,
          schoolId,
          name: 'أ. محمد عبد السلام',
          nationalId: '28805120102934',
          phone: '01011223344',
          email: 'm.abdelsalam@school.edu.eg',
          username: 'أ. محمد عبد السلام',
          password: hashPassword('10003'),
          isAttendanceOfficer: false,
          specialization: 'اللغة العربية والتربية الدينية',
          status: 'نشط',
          assignedClasses: ['الصف الأول الإعدادي - أ'],
          assignedSubjects: ['اللغة العربية'],
          joinDate: '2022-09-01',
        },
        {
          id: `tch-${schoolId}-4`,
          schoolId,
          name: 'د. محمود حسن',
          nationalId: '28511020104829',
          phone: '01233445566',
          email: 'm.hassan@school.edu.eg',
          username: 'د. محمود حسن',
          password: hashPassword('10004'),
          isAttendanceOfficer: false,
          specialization: 'العلوم والفيزياء',
          status: 'نشط',
          assignedClasses: ['الصف الثالث الإعدادي - أ', 'الصف الأول الثانوي - أ'],
          assignedSubjects: ['العلوم والتكنولوجيا'],
          joinDate: '2021-08-20',
        },
        {
          id: `tch-${schoolId}-5`,
          schoolId,
          name: 'د. خالد توفيق',
          nationalId: '28203200109283',
          phone: '01544556677',
          email: 'k.tawfik@school.edu.eg',
          username: 'د. خالد توفيق',
          password: hashPassword('10005'),
          isAttendanceOfficer: false,
          specialization: 'الكيمياء والفيزياء - الثانوية العامة',
          status: 'نشط',
          assignedClasses: ['الصف الثالث الثانوي - أ'],
          assignedSubjects: ['الكيمياء والفيزياء المتقدمة'],
          joinDate: '2020-02-01',
        },
      ];

      for (const tch of defaultTeachers) {
        await db.insert(teachersTable).values(tch).onConflictDoNothing();
      }

      // 3. Students
      const defaultStudents = [
        {
          id: `std-${schoolId}-kg1-1`,
          schoolId,
          name: 'آدم أحمد فتحي',
          studentCode: 'STD-2026-10001',
          ministryCode: 'MIN-10001',
          nationalId: '32205120108234',
          classId: `cls-${schoolId}-kg1`,
          className: 'روضة أولى (KG-1) - أ',
          birthDate: '2022-04-10',
          gender: 'ذكر',
          status: 'منتظم',
          parentName: 'أحمد فتحي المغازي',
          parentPhone: '01012345678',
          parentEmail: 'parent.ahmed@gmail.com',
          address: 'القاهرة - المعادي - شارع 9',
          joinDate: '2025-09-01',
        },
        {
          id: `std-${schoolId}-kg2-1`,
          schoolId,
          name: 'ليان محمود صلاح',
          studentCode: 'STD-2026-10002',
          ministryCode: 'MIN-10002',
          nationalId: '32108200109382',
          classId: `cls-${schoolId}-kg2`,
          className: 'روضة ثانية (KG-2) - أ',
          birthDate: '2021-06-15',
          gender: 'أنثى',
          status: 'منتظم',
          parentName: 'محمود صلاح الدين',
          parentPhone: '01123456789',
          parentEmail: 'm.salah@gmail.com',
          address: 'القاهرة - التجمع الخامس',
          joinDate: '2024-09-01',
        },
        {
          id: `std-${schoolId}-p1-1`,
          schoolId,
          name: 'حمزة محمد عصام',
          studentCode: 'STD-2026-10003',
          ministryCode: 'MIN-10003',
          nationalId: '32003220104921',
          classId: `cls-${schoolId}-p1`,
          className: 'الصف الأول الابتدائي - أ',
          birthDate: '2020-03-22',
          gender: 'ذكر',
          status: 'منتظم',
          parentName: 'محمد عصام الدين',
          parentPhone: '01234567890',
          address: 'القاهرة - مدينة نصر',
          joinDate: '2024-09-01',
        },
        {
          id: `std-${schoolId}-p6-1`,
          schoolId,
          name: 'ياسين طارق العوضي',
          studentCode: 'STD-2026-10004',
          ministryCode: 'MIN-10004',
          nationalId: '31502140108372',
          classId: `cls-${schoolId}-p6`,
          className: 'الصف السادس الابتدائي - أ',
          birthDate: '2015-02-14',
          gender: 'ذكر',
          status: 'منتظم',
          parentName: 'طارق مصطفى العوضي',
          parentPhone: '01512345678',
          address: 'القاهرة - الشروق',
          joinDate: '2020-09-01',
        },
        {
          id: `std-${schoolId}-m1-1`,
          schoolId,
          name: 'عمر أحمد فتحي',
          studentCode: 'STD-2026-10005',
          ministryCode: 'MIN-10005',
          nationalId: '31205120108234',
          classId: `cls-${schoolId}-m1`,
          className: 'الصف الأول الإعدادي - أ',
          birthDate: '2012-05-12',
          gender: 'ذكر',
          status: 'منتظم',
          parentName: 'أحمد فتحي المغازي',
          parentPhone: '01012345678',
          parentEmail: 'parent.ahmed@gmail.com',
          address: 'القاهرة - المعادي - شارع 9',
          joinDate: '2023-09-01',
        },
        {
          id: `std-${schoolId}-s1-1`,
          schoolId,
          name: 'جنى جمال الدين',
          studentCode: 'STD-2026-10006',
          ministryCode: 'MIN-10006',
          nationalId: '30911050109283',
          classId: `cls-${schoolId}-s1`,
          className: 'الصف الأول الثانوي - أ',
          birthDate: '2009-11-05',
          gender: 'أنثى',
          status: 'منتظم',
          parentName: 'جمال الدين مرسي',
          parentPhone: '01055667788',
          address: 'القاهرة - الزمالك',
          joinDate: '2024-09-01',
        },
        {
          id: `std-${schoolId}-s3-1`,
          schoolId,
          name: 'سيف الدين محمود حسن',
          studentCode: 'STD-2026-10007',
          ministryCode: 'MIN-10007',
          nationalId: '30704180104829',
          classId: `cls-${schoolId}-s3`,
          className: 'الصف الثالث الثانوي - أ',
          birthDate: '2007-04-18',
          gender: 'ذكر',
          status: 'منتظم',
          parentName: 'محمود حسن عبد المنعم',
          parentPhone: '01199887766',
          address: 'القاهرة - المهندسين',
          joinDate: '2023-09-01',
        },
      ];

      for (const std of defaultStudents) {
        await db.insert(studentsTable).values(std).onConflictDoNothing();
      }

      // 4. Subjects
      const defaultSubjects = [
        { id: `sub-${schoolId}-1`, schoolId, name: 'اللغة العربية والخط', code: 'ARB-101', gradeLevels: ['المرحلة الابتدائية'], maxScore: 100, passScore: 50, teacherNames: ['أ. منى السيد'] },
        { id: `sub-${schoolId}-2`, schoolId, name: 'الرياضيات المتقدمة', code: 'MTH-101', gradeLevels: ['المرحلة الابتدائية', 'المرحلة الإعدادية'], maxScore: 100, passScore: 50, teacherNames: ['أ. خالد فتحي'] },
        { id: `sub-${schoolId}-3`, schoolId, name: 'اللغة الإنجليزية (Connect+)', code: 'ENG-101', gradeLevels: ['رياض أطفال', 'المرحلة الابتدائية', 'المرحلة الإعدادية'], maxScore: 100, passScore: 50, teacherNames: ['أ. رانيا عادل'] },
        { id: `sub-${schoolId}-4`, schoolId, name: 'العلوم والتكنولوجيا', code: 'SCI-101', gradeLevels: ['المرحلة الإعدادية'], maxScore: 100, passScore: 50, teacherNames: ['د. محمود حسن'] },
        { id: `sub-${schoolId}-5`, schoolId, name: 'الكيمياء والفيزياء المتقدمة', code: 'CHM-301', gradeLevels: ['المرحلة الثانوية'], maxScore: 100, passScore: 50, teacherNames: ['د. خالد توفيق'] },
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
