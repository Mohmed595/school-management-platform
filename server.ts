import express from 'express';
import path from 'path';
import crypto from 'crypto';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './src/db/index.ts';
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
  smsLogsTable,
  trustedDeviceSessionsTable,
} from './src/db/schema.ts';
import { eq, desc, and, isNull, lt, count, ilike } from 'drizzle-orm';

// ----------------------------------------------------
// GLOBAL PROCESS CRASH GUARDS & 24/7/365 STABILITY RESILIENCE
// ----------------------------------------------------
process.on('uncaughtException', (err: Error) => {
  console.error('[CRITICAL PROCESS GUARD - Intercepted uncaughtException]:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[CRITICAL PROMISE GUARD - Intercepted unhandledRejection]:', reason?.message || reason);
});
import { sendBulkSMS, sendSMS, checkBalance } from './src/lib/sms/smsmode.ts';
import { registerSchoolEntitiesRoutes } from './server/schoolEntitiesRoutes.ts';
import { registerSupportTicketsRoutes } from './server/supportTicketsRoutes.ts';
import { registerPrivateMessagingRoutes } from './server/privateMessagingRoutes.ts';
import {
  geminiSchoolTools,
  executeSchoolTool,
  detectRequestedDomain,
  smartFallbackAnswer,
  isExcelRequested,
  generateAccurateStudentExcelPayload,
} from './server/schoolAiToolsService.ts';
import { extractExcelFromResponse } from './src/lib/excelGenerator.ts';
import { extractPublishDraftFromResponse } from './src/lib/publishDraft.ts';
import { initializeExtensionsDatabase } from './server/schoolExtensionsService.ts';
import {
  checkAuthRateLimit,
  recordAuthFailure,
  recordAuthSuccess,
  buildIdentifierKey,
  checkVerifySessionRateLimit,
} from './server/authRateLimiter.ts';
import {
  platformUsageTrackingMiddleware,
  gatherPlatformUsage,
} from './server/platformUsageService.ts';
import {
  AUTH_SECRET,
  createSignedSessionToken,
  verifySignedSessionToken,
  extractAuthSession,
  requireAuth,
  requireOwnerAuth,
  requireSchoolAccess,
  memorySessionStore,
  hashPassword,
  verifyPassword,
} from './server/serverAuth.ts';
import type {
  InMemorySession,
  AuthenticatedUserSession,
  SessionTokenPayload,
} from './server/serverAuth.ts';

const INITIAL_DATABASE_SCHOOLS = [
  {
    schoolId: 'sch-1',
    name: 'مدرسة النيل الدولية بالقاهرة',
    code: 'EG-CAI-8412',
    licenseKey: 'LIC-2026-NIL8-92K1',
    adminEmail: 'admin@nileschool.edu.eg',
    adminPassword: 'Nile#2026Password',
    governorate: 'القاهرة',
    educationalDistrict: 'إدارة مصر الجديدة التعليمية',
    address: 'القاهرة - مصر الجديدة',
    phone: '01012345678',
    email: 'admin@nileschool.edu.eg',
    principalName: 'د. أحمد فتحي المغازي',
    principalPhone: '01012345678',
    principalEmail: 'a.maghazi@nileschool.edu.eg',
    academicYear: '2025/2026',
    subscription: 'بريميوم',
    status: 'نشطة',
    licenseExpiry: '2027-09-15',
    studentsCount: 1420,
    teachersCount: 98,
    createdAt: '2025-09-15',
  },
  {
    schoolId: 'sch-2',
    name: 'مدرسة الأورمان النموذجية الحديثة',
    code: 'EG-GIZ-3109',
    licenseKey: 'LIC-2026-ORM3-44P8',
    adminEmail: 'admin@orman-model.edu.eg',
    adminPassword: 'Orman#2026Password',
    governorate: 'الجيزة',
    educationalDistrict: 'إدارة الدقي التعليمية',
    address: 'الجيزة - الدقي',
    phone: '01123456789',
    email: 'admin@orman-model.edu.eg',
    principalName: 'أ. محمود صلاح الدين',
    principalPhone: '01123456789',
    principalEmail: 'm.salah@orman-model.edu.eg',
    academicYear: '2025/2026',
    subscription: 'احترافي',
    status: 'نشطة',
    licenseExpiry: '2026-10-01',
    studentsCount: 980,
    teachersCount: 64,
    createdAt: '2025-10-01',
  },
  {
    schoolId: 'sch-3',
    name: 'مدرسة الإسكندرية للغات والتكنولوجيا',
    code: 'EG-ALX-5510',
    licenseKey: 'LIC-2026-ALX9-10T3',
    adminEmail: 'admin@alextechschool.com',
    adminPassword: 'Alex#2026Password',
    governorate: 'الإسكندرية',
    educationalDistrict: 'إدارة شرق الإسكندرية',
    address: 'الإسكندرية - سموحة',
    phone: '01234567890',
    email: 'admin@alextechschool.com',
    principalName: 'د. إيمان عبد الرحمن',
    principalPhone: '01234567890',
    principalEmail: 'eman@alextechschool.com',
    academicYear: '2025/2026',
    subscription: 'بريميوم',
    status: 'نشطة',
    licenseExpiry: '2027-11-12',
    studentsCount: 1150,
    teachersCount: 82,
    createdAt: '2025-11-12',
  },
  {
    schoolId: 'sch-4',
    name: 'مدرسة الزقازيق الثانوية الرسمية لغات',
    code: 'EG-SHQ-1049',
    licenseKey: 'LIC-2026-SHQ2-77M4',
    adminEmail: 'admin@zag-lang.edu.eg',
    adminPassword: 'Zag#2026Password',
    governorate: 'الشرقية',
    educationalDistrict: 'إدارة الزقازيق التعليمية',
    address: 'الشرقية - الزقازيق',
    phone: '01512345678',
    email: 'admin@zag-lang.edu.eg',
    principalName: 'أ. طارق مصطفى العوضي',
    principalPhone: '01512345678',
    principalEmail: 'tareq@zag-lang.edu.eg',
    academicYear: '2025/2026',
    subscription: 'أساسي',
    status: 'معلقة',
    licenseExpiry: '2026-03-05',
    studentsCount: 860,
    teachersCount: 52,
    createdAt: '2025-12-05',
  },
  {
    schoolId: 'sch-5',
    name: 'مدرسة المنصورة التفوق والذكاء الاصطناعي',
    code: 'EG-DAH-7231',
    licenseKey: 'LIC-2026-MAN1-88R9',
    adminEmail: 'admin@mansourastem.edu.eg',
    adminPassword: 'Mans#2026Password',
    governorate: 'الدقهلية',
    educationalDistrict: 'إدارة المنصورة التعليمية',
    address: 'الدقهلية - المنصورة',
    phone: '01098765432',
    email: 'admin@mansourastem.edu.eg',
    principalName: 'د. سارة إبراهيم حسن',
    principalPhone: '01098765432',
    principalEmail: 'sara@mansourastem.edu.eg',
    academicYear: '2025/2026',
    subscription: 'بريميوم',
    status: 'نشطة',
    licenseExpiry: '2027-01-10',
    studentsCount: 1290,
    teachersCount: 88,
    createdAt: '2026-01-10',
  },
  {
    schoolId: 'sch-6',
    name: 'مدرسة طنطا للغات المتقدمة',
    code: 'EG-WAD-4022',
    licenseKey: 'LIC-2026-TNT5-33X2',
    adminEmail: 'admin@tanta-adv.com',
    adminPassword: 'Tanta#2026Password',
    governorate: 'الغربية',
    educationalDistrict: 'إدارة طنطا التعليمية',
    address: 'الغربية - طنطا',
    phone: '01198765432',
    email: 'admin@tanta-adv.com',
    principalName: 'أ. خالد السيد النجار',
    principalPhone: '01198765432',
    principalEmail: 'khaled@tanta-adv.com',
    academicYear: '2025/2026',
    subscription: 'احترافي',
    status: 'نشطة',
    licenseExpiry: '2027-02-01',
    studentsCount: 740,
    teachersCount: 48,
    createdAt: '2026-02-01',
  },
  {
    schoolId: 'sch-7',
    name: 'مدرسة دمنهور المستقبل اللغات',
    code: 'EG-BAH-6911',
    licenseKey: 'LIC-2026-DMH4-66Z7',
    adminEmail: 'admin@dam-future.edu.eg',
    adminPassword: 'Dam#2026Password',
    governorate: 'البحيرة',
    educationalDistrict: 'إدارة دمنهور التعليمية',
    address: 'البحيرة - دمنهور',
    phone: '01298765432',
    email: 'admin@dam-future.edu.eg',
    principalName: 'أ. هناء علي خليل',
    principalPhone: '01298765432',
    principalEmail: 'hanaa@dam-future.edu.eg',
    academicYear: '2025/2026',
    subscription: 'أساسي',
    status: 'نشطة',
    licenseExpiry: '2026-09-14',
    studentsCount: 620,
    teachersCount: 41,
    createdAt: '2026-03-14',
  },
  {
    schoolId: 'sch-8',
    name: 'مدرسة بنها النموذجية الخاصة',
    code: 'EG-QAL-2840',
    licenseKey: 'LIC-2026-BNH9-12L5',
    adminEmail: 'admin@banha-mod.edu.eg',
    adminPassword: 'Banha#2026Password',
    governorate: 'القليوبية',
    educationalDistrict: 'إدارة بنها التعليمية',
    address: 'القليوبية - بنها',
    phone: '01598765432',
    email: 'admin@banha-mod.edu.eg',
    principalName: 'أ. هشام عبد المنعم',
    principalPhone: '01598765432',
    principalEmail: 'hisham@banha-mod.edu.eg',
    academicYear: '2025/2026',
    subscription: 'أساسي',
    status: 'معلقة',
    licenseExpiry: '2026-06-20',
    studentsCount: 510,
    teachersCount: 35,
    createdAt: '2026-04-20',
  },
  {
    schoolId: 'sch-9',
    name: 'مدرسة أسيوط الرسمية المتميزة لغات',
    code: 'EG-ASY-9013',
    licenseKey: 'LIC-2026-ASY7-55K0',
    adminEmail: 'admin@asyut-lang.edu.eg',
    adminPassword: 'Asyut#2026Password',
    governorate: 'أسيوط',
    educationalDistrict: 'إدارة أسيوط التعليمية',
    address: 'أسيوط - شارع الجمهورية',
    phone: '01033445566',
    email: 'admin@asyut-lang.edu.eg',
    principalName: 'د. جمال الدين الرشيدي',
    principalPhone: '01033445566',
    principalEmail: 'gamal@asyut-lang.edu.eg',
    academicYear: '2025/2026',
    subscription: 'احترافي',
    status: 'نشطة',
    licenseExpiry: '2027-05-02',
    studentsCount: 930,
    teachersCount: 62,
    createdAt: '2026-05-02',
  },
  {
    schoolId: 'sch-10',
    name: 'مدرسة سوهاج الدولية للابتكار',
    code: 'EG-SOH-1829',
    licenseKey: 'LIC-2026-SOH3-99W1',
    adminEmail: 'admin@sohag-intl.com',
    adminPassword: 'Sohag#2026Password',
    governorate: 'سوهاج',
    educationalDistrict: 'إدارة سوهاج التعليمية',
    address: 'سوهاج - الكورنيش الشرقي',
    phone: '01133445566',
    email: 'admin@sohag-intl.com',
    principalName: 'أ. نادية عبد الوهاب',
    principalPhone: '01133445566',
    principalEmail: 'nadia@sohag-intl.com',
    academicYear: '2025/2026',
    subscription: 'بريميوم',
    status: 'نشطة',
    licenseExpiry: '2027-06-18',
    studentsCount: 780,
    teachersCount: 51,
    createdAt: '2026-06-18',
  },
];

let isDatabaseSeedingRunning = false;
async function ensureCentralDatabaseSchoolsSeeded() {
  if (isDatabaseSeedingRunning) return;
  try {
    isDatabaseSeedingRunning = true;
    const existing = await db.select({ schoolId: schoolInfoTable.schoolId }).from(schoolInfoTable).limit(1);
    if (existing.length === 0) {
      console.log('[DB] Central database school_info table is empty. Initializing central platform schools into PostgreSQL...');
      for (const item of INITIAL_DATABASE_SCHOOLS) {
        await db.insert(schoolInfoTable).values(item).onConflictDoNothing();
      }
      console.log('[DB] Successfully initialized central platform schools in PostgreSQL.');
    }
  } catch (err) {
    // Seeding check guard
  } finally {
    isDatabaseSeedingRunning = false;
  }
}

function formatSchoolResponse(row: any, liveStudents = 0, liveTeachers = 0) {
  return {
    id: row.schoolId,
    name: row.name,
    code: row.code || `EG-CAI-${row.schoolId.slice(-4)}`,
    licenseKey: row.licenseKey || `LIC-2026-${row.schoolId.slice(-4)}`,
    adminEmail: row.adminEmail || `${row.schoolId}@school.edu.eg`,
    governorate: row.governorate || 'القاهرة',
    studentsCount: liveStudents > 0 ? liveStudents : Number(row.studentsCount) || 0,
    teachersCount: liveTeachers > 0 ? liveTeachers : Number(row.teachersCount) || 0,
    subscription: row.subscription || 'أساسي',
    status: row.status || 'نشطة',
    createdAt: row.createdAt || (row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : '2025-09-15'),
    principalName: row.principalName || 'مدير المدرسة',
    principalPhone: row.principalPhone || row.phone || '01000000000',
    principalEmail: row.principalEmail || row.email || 'admin@school.edu.eg',
    licenseExpiry: row.licenseExpiry || '2027-09-15',
    stage: row.stage || undefined,
    attendance_start_date: row.attendanceStartDate || undefined,
  };
}


function sanitizeContext(data: any): any {
  if (!data) return {};
  try {
    const copy = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = ['password', 'secret', 'token', 'apikey', 'privatekey', 'dburl', 'connectionstring', 'ssn', 'pass'];
    
    function clean(obj: any) {
      if (Array.isArray(obj)) {
        obj.forEach(clean);
      } else if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
            obj[key] = '[مخفي لحماية الخصوصية]';
          } else {
            clean(obj[key]);
          }
        }
      }
    }

    clean(copy);
    return copy;
  } catch (e) {
    return { summary: 'بيانات سياق مخصصة للعرض فقط' };
  }
}

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and ensure Central Extensions tables and initial catalog are seeded
  initializeExtensionsDatabase().catch((err) => {
    console.error('[Extensions DB Initialization Warning]:', err);
  });

  // High-performance gzip/deflate compression for massive JSON & payload efficiency
  app.use(compression());

  app.use(express.json({ limit: '10mb' }));
  app.use(platformUsageTrackingMiddleware);

  // Background Database Session Purge (Runs daily to prevent database bloat over years of operation)
  const dbPurgeTimer = setInterval(async () => {
    try {
      const nowIso = new Date().toISOString();
      await db
        .delete(trustedDeviceSessionsTable)
        .where(lt(trustedDeviceSessionsTable.expiresAt, nowIso));
    } catch {
      // Safe guard
    }
  }, 24 * 60 * 60 * 1000);

  if (dbPurgeTimer.unref) {
    dbPurgeTimer.unref();
  }

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      res.json({ status: 'ok', database: 'cloud_sql_postgres' });
    } catch (error) {
      res.status(500).json({ status: 'error', error: String(error) });
    }
  });

  // ==========================================
  // 📊 OWNER PLATFORM & HOSTING USAGE MONITOR
  // ==========================================
  app.get('/api/owner/platform-usage', requireOwnerAuth, async (req, res) => {
    try {
      const usage = await gatherPlatformUsage();
      res.json({
        success: true,
        data: usage,
      });
    } catch (error: any) {
      console.error('Error in /api/owner/platform-usage:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'تعذر جلب بيانات استهلاك المنصة من مزود الاستضافة',
      });
    }
  });

  // ==========================================
  // 🔐 TRUSTED DEVICE + SAVED ACCOUNTS AUTH API
  // ==========================================

  // 1. Login with optional 300-day Trusted Device registration
  app.post('/api/auth/login-trusted', async (req, res) => {
    try {
      const {
        loginType,
        credentials,
        trustDevice300Days,
        deviceId = 'dev_unknown',
        deviceName = 'متصفح هذا الجهاز',
        accountMeta = {},
      } = req.body || {};

      const userId = accountMeta.userId || credentials?.studentCode || credentials?.username || credentials?.schoolCode || credentials?.email || `usr_${Date.now()}`;
      const identifierKey = buildIdentifierKey('session', `${deviceId}:${userId}`);

      // Rate limit check
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات غير الصحيحة.',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        });
      }

      const now = new Date();
      const createdAt = now.toISOString();
      // Exactly 300 days duration: 300 * 24 * 60 * 60 * 1000 ms
      const durationMs = 300 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(now.getTime() + (trustDevice300Days ? durationMs : 24 * 60 * 60 * 1000)).toISOString();

      const sessionId = `tds_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
      
      const userRole = loginType || accountMeta.userRole || 'parent';
      const userDisplayName = accountMeta.userDisplayName || accountMeta.studentName || credentials?.studentName || credentials?.username || 'مستخدم المنظومة';
      
      const tokenHash = crypto.createHash('sha256').update(`${sessionId}:${deviceId}:${AUTH_SECRET}`).digest('hex');

      const sessionRecord: InMemorySession = {
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
        metadata: accountMeta,
      };

      // Store in Memory Store
      memorySessionStore.set(sessionId, sessionRecord);

      // Persist to Cloud SQL if available
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
          metadata: accountMeta,
        });
      } catch (dbErr) {
        // Fallback silently to memory store
      }

      recordAuthSuccess(req, identifierKey);

      const sessionToken = createSignedSessionToken({
        sessionId,
        deviceId,
        userId,
        userRole,
        schoolId: accountMeta.schoolId,
        schoolName: accountMeta.schoolName,
        studentId: accountMeta.studentId || (userRole === 'parent' ? userId : undefined),
        studentName: accountMeta.studentName,
        studentCode: accountMeta.studentCode,
        className: accountMeta.className,
        userDisplayName,
        avatarUid: accountMeta.avatarUid,
        expiresAt,
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
          remainingDays: trustDevice300Days ? 300 : 1,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/auth/login-trusted:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشلت عملية تسجيل الدخول وتوثيق الجهاز' });
    }
  });

  // 2. Verify Session & Enforce 300-Day Expiration + Revocation
  app.post('/api/auth/verify-session', async (req, res) => {
    try {
      // Session verification flood rate check
      const rateLimit = checkVerifySessionRateLimit(req);
      if (!rateLimit.allowed) {
        return res.status(rateLimit.status || 429).json({
          valid: false,
          error: rateLimit.error || 'تم تجاوز معدل التحقق من الجلسات المسموح به. يرجى الانتظار قليلاً.',
        });
      }

      const { sessionToken, deviceId } = req.body || {};
      if (!sessionToken) {
        return res.status(400).json({ valid: false, error: 'رمز الجلسة مفقود' });
      }

      const tokenCheck = verifySignedSessionToken(sessionToken);
      if (!tokenCheck.valid || !tokenCheck.payload) {
        return res.status(401).json({ valid: false, error: tokenCheck.error || 'رمز الجلسة غير صالح أو منتهي الصلاحية' });
      }

      const { sessionId, expiresAt } = tokenCheck.payload;
      const now = new Date();

      // Check DB or memory
      let session: InMemorySession | null = memorySessionStore.get(sessionId) || null;

      if (!session) {
        try {
          const dbRows = await db
            .select()
            .from(trustedDeviceSessionsTable)
            .where(eq(trustedDeviceSessionsTable.id, sessionId));
          if (dbRows.length > 0) {
            const row = dbRows[0];
            session = {
              id: row.id,
              deviceId: row.deviceId,
              userId: row.userId,
              userRole: row.userRole,
              schoolId: row.schoolId || undefined,
              schoolName: row.schoolName || undefined,
              studentId: row.studentId || undefined,
              studentName: row.studentName || undefined,
              studentCode: row.studentCode || undefined,
              className: row.className || undefined,
              userDisplayName: row.userDisplayName,
              avatarUid: row.avatarUid || undefined,
              tokenHash: row.tokenHash,
              deviceName: row.deviceName || 'هذا الجهاز',
              createdAt: row.createdAt,
              lastUsedAt: row.lastUsedAt,
              expiresAt: row.expiresAt,
              revokedAt: row.revokedAt,
              metadata: row.metadata,
            };
            memorySessionStore.set(sessionId, session);
          }
        } catch (dbErr) {
          // Silent fallback
        }
      }

      // If session record not found, verify payload directly
      if (!session) {
        session = {
          id: sessionId,
          deviceId: tokenCheck.payload.deviceId,
          userId: tokenCheck.payload.userId,
          userRole: tokenCheck.payload.userRole,
          schoolId: tokenCheck.payload.schoolId,
          schoolName: tokenCheck.payload.schoolName,
          studentId: tokenCheck.payload.studentId || (tokenCheck.payload.userRole === 'parent' ? tokenCheck.payload.userId : undefined),
          studentName: tokenCheck.payload.studentName,
          studentCode: tokenCheck.payload.studentCode,
          className: tokenCheck.payload.className,
          userDisplayName: tokenCheck.payload.userDisplayName || tokenCheck.payload.studentName || 'مستخدم مسجل',
          avatarUid: tokenCheck.payload.avatarUid,
          tokenHash: '',
          deviceName: 'هذا الجهاز',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: tokenCheck.payload.expiresAt,
          revokedAt: null,
        };
      }

      if (session.revokedAt) {
        return res.status(401).json({ valid: false, error: 'تم إلغاء الثقة بهذا الحساب/الجهاز سابقاً' });
      }

      if (new Date(session.expiresAt).getTime() < now.getTime()) {
        return res.status(401).json({ valid: false, error: 'انتهت صلاحية جلسة الجهاز الموثوق (300 يوم). يرجى تسجيل الدخول مجدداً' });
      }

      // Update lastUsedAt
      const lastUsedAt = now.toISOString();
      session.lastUsedAt = lastUsedAt;
      memorySessionStore.set(sessionId, session);

      try {
        await db
          .update(trustedDeviceSessionsTable)
          .set({ lastUsedAt })
          .where(eq(trustedDeviceSessionsTable.id, sessionId));
      } catch (e) {
        // Ignore
      }

      const diffMs = new Date(session.expiresAt).getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

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
          remainingDays,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/auth/verify-session:', error);
      res.status(500).json({ valid: false, error: error?.message || 'فشل التحقق من الجلسة' });
    }
  });

  // 3. Switch Account using saved trusted session
  app.post('/api/auth/switch-account', async (req, res) => {
    try {
      const { targetSessionId, sessionToken, deviceId, accountMeta } = req.body || {};

      const identifierRaw = targetSessionId || deviceId || 'switch_unknown';
      const identifierKey = buildIdentifierKey('session', identifierRaw);

      // Check Rate Limit & Temporary Cooldown
      const rateLimitCheck = checkAuthRateLimit(req, identifierKey);
      if (!rateLimitCheck.allowed) {
        return res.status(rateLimitCheck.status || 429).json({
          success: false,
          error: rateLimitCheck.error || 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات غير الصحيحة.',
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        });
      }

      if (!targetSessionId && !sessionToken && !accountMeta) {
        recordAuthFailure(req, identifierKey);
        return res.status(400).json({ success: false, error: 'معرف الجلسة المستهدفة مطلوب' });
      }

      let session: InMemorySession | null = null;

      if (targetSessionId) {
        session = memorySessionStore.get(targetSessionId) || null;
        if (!session) {
          try {
            const dbRows = await db
              .select()
              .from(trustedDeviceSessionsTable)
              .where(eq(trustedDeviceSessionsTable.id, targetSessionId));
            if (dbRows.length > 0) {
              const row = dbRows[0];
              session = {
                id: row.id,
                deviceId: row.deviceId,
                userId: row.userId,
                userRole: row.userRole,
                schoolId: row.schoolId || undefined,
                schoolName: row.schoolName || undefined,
                studentId: row.studentId || undefined,
                studentName: row.studentName || undefined,
                studentCode: row.studentCode || undefined,
                className: row.className || undefined,
                userDisplayName: row.userDisplayName,
                avatarUid: row.avatarUid || undefined,
                tokenHash: row.tokenHash,
                deviceName: row.deviceName || 'هذا الجهاز',
                createdAt: row.createdAt,
                lastUsedAt: row.lastUsedAt,
                expiresAt: row.expiresAt,
                revokedAt: row.revokedAt,
                metadata: row.metadata,
              };
              memorySessionStore.set(targetSessionId, session);
            }
          } catch (dbErr) {
            // Silent fallback
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
            userDisplayName: accountMeta?.userDisplayName || 'مستخدم مسجل',
            avatarUid: accountMeta?.avatarUid,
            tokenHash: '',
            deviceName: 'هذا الجهاز',
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            expiresAt: tokenCheck.payload.expiresAt,
            revokedAt: null,
          };
        }
      }

      if (!session) {
        recordAuthFailure(req, identifierKey);
        return res.status(401).json({ success: false, error: 'جلسة غير صالحة أو غير موثقة' });
      }

      // Merge accountMeta if fields were missing
      if (accountMeta) {
        if (!session.schoolId && accountMeta.schoolId) session.schoolId = accountMeta.schoolId;
        if (!session.schoolName && accountMeta.schoolName) session.schoolName = accountMeta.schoolName;
        if (!session.studentId && accountMeta.studentId) session.studentId = accountMeta.studentId;
        if (!session.studentName && accountMeta.studentName) session.studentName = accountMeta.studentName;
        if (!session.studentCode && accountMeta.studentCode) session.studentCode = accountMeta.studentCode;
        if (!session.className && accountMeta.className) session.className = accountMeta.className;
        if ((!session.userDisplayName || session.userDisplayName === 'مستخدم مسجل') && accountMeta.userDisplayName) {
          session.userDisplayName = accountMeta.userDisplayName;
        }
        if (!session.avatarUid && accountMeta.avatarUid) session.avatarUid = accountMeta.avatarUid;
        memorySessionStore.set(session.id, session);
      }

      // Authoritative avatar theme fetch from studentsTable
      const queryStdId = session.studentId || (session.userRole === 'student' ? session.userId : undefined);
      if (queryStdId) {
        try {
          const [foundStd] = await db
            .select({ avatar_layout_uid: studentsTable.avatar_layout_uid })
            .from(studentsTable)
            .where(eq(studentsTable.id, queryStdId))
            .limit(1);
          if (foundStd?.avatar_layout_uid) {
            session.avatarUid = foundStd.avatar_layout_uid;
          }
        } catch (stdErr) {
          // Ignore
        }
      }

      if (session.revokedAt) {
        return res.status(403).json({ success: false, error: 'تم إلغاء الثقة بهذا الحساب على هذا الجهاز' });
      }

      const now = new Date();
      if (new Date(session.expiresAt).getTime() < now.getTime()) {
        return res.status(403).json({ success: false, error: 'انتهت صلاحية جلسة الحساب (300 يوم). يرجى تسجيل الدخول مجدداً' });
      }

      // Update lastUsedAt
      const lastUsedAt = now.toISOString();
      session.lastUsedAt = lastUsedAt;
      memorySessionStore.set(session.id, session);

      try {
        await db
          .update(trustedDeviceSessionsTable)
          .set({ lastUsedAt })
          .where(eq(trustedDeviceSessionsTable.id, session.id));
      } catch (e) {
        // Ignore
      }

      recordAuthSuccess(req, identifierKey);

      const diffMs = new Date(session.expiresAt).getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const freshToken = createSignedSessionToken({
        sessionId: session.id,
        deviceId: session.deviceId,
        userId: session.userId,
        userRole: session.userRole,
        schoolId: session.schoolId,
        schoolName: session.schoolName,
        studentId: session.studentId || (session.userRole === 'parent' ? session.userId : undefined),
        studentName: session.studentName,
        studentCode: session.studentCode,
        className: session.className,
        userDisplayName: session.userDisplayName,
        avatarUid: session.avatarUid,
        expiresAt: session.expiresAt,
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
          remainingDays,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/auth/switch-account:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل تبديل الحساب' });
    }
  });

  // 4. Revoke a single trusted device session
  app.post('/api/auth/revoke-device-session', async (req, res) => {
    try {
      const { sessionId, sessionToken, deviceId } = req.body;
      const now = new Date().toISOString();

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
          await db
            .update(trustedDeviceSessionsTable)
            .set({ revokedAt: now })
            .where(eq(trustedDeviceSessionsTable.id, targetId));
        } catch (e) {
          // Silent fallback
        }
      }

      res.json({ success: true, message: 'تم إلغاء الثقة بهذا الحساب على الجهاز بنجاح' });
    } catch (error: any) {
      console.error('Error in /api/auth/revoke-device-session:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل إلغاء جلسة الجهاز' });
    }
  });

  // 5. Revoke ALL trusted device sessions for this device
  app.post('/api/auth/revoke-all-device-sessions', async (req, res) => {
    try {
      const { deviceId } = req.body;
      const now = new Date().toISOString();

      if (deviceId) {
        for (const [id, s] of memorySessionStore.entries()) {
          if (s.deviceId === deviceId) {
            s.revokedAt = now;
            memorySessionStore.set(id, s);
          }
        }

        try {
          await db
            .update(trustedDeviceSessionsTable)
            .set({ revokedAt: now })
            .where(eq(trustedDeviceSessionsTable.deviceId, deviceId));
        } catch (e) {
          // Silent fallback
        }
      }

      res.json({ success: true, message: 'تم تسجيل الخروج من جميع الحسابات وإلغاء الثقة بالجهاز' });
    } catch (error: any) {
      console.error('Error in /api/auth/revoke-all-device-sessions:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل إلغاء جميع الجلسات' });
    }
  });

  // 6. Get Saved Active Accounts for Device
  app.get('/api/auth/saved-accounts', async (req, res) => {
    try {
      const deviceId = req.query.deviceId as string;
      if (!deviceId) {
        return res.json({ success: true, accounts: [] });
      }

      const now = Date.now();
      const accounts: any[] = [];

      // Memory items
      for (const s of memorySessionStore.values()) {
        if (s.deviceId === deviceId && !s.revokedAt) {
          const exp = new Date(s.expiresAt).getTime();
          if (exp > now) {
            const diffMs = exp - now;
            const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
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
              remainingDays,
            });
          }
        }
      }

      // Check DB for any others
      try {
        const dbRows = await db
          .select()
          .from(trustedDeviceSessionsTable)
          .where(and(eq(trustedDeviceSessionsTable.deviceId, deviceId), isNull(trustedDeviceSessionsTable.revokedAt)));

        for (const row of dbRows) {
          const exp = new Date(row.expiresAt).getTime();
          if (exp > now && !accounts.some((a) => a.sessionId === row.id)) {
            const diffMs = exp - now;
            const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            accounts.push({
              sessionId: row.id,
              userId: row.userId,
              userRole: row.userRole,
              schoolId: row.schoolId || undefined,
              schoolName: row.schoolName || undefined,
              studentId: row.studentId || undefined,
              studentName: row.studentName || undefined,
              studentCode: row.studentCode || undefined,
              className: row.className || undefined,
              userDisplayName: row.userDisplayName,
              avatarUid: row.avatarUid || undefined,
              createdAt: row.createdAt,
              lastUsedAt: row.lastUsedAt,
              expiresAt: row.expiresAt,
              remainingDays,
            });
          }
        }
      } catch (dbErr) {
        // Ignore
      }

      res.json({ success: true, accounts });
    } catch (error: any) {
      console.error('Error in /api/auth/saved-accounts:', error);
      res.json({ success: true, accounts: [] });
    }
  });

  // 7. Get TrustedDeviceInfo
  app.get('/api/auth/trusted-device-info', async (req, res) => {
    try {
      const deviceId = req.query.deviceId as string;
      const sessionId = req.query.sessionId as string;

      let session: InMemorySession | null = null;
      if (sessionId) {
        session = memorySessionStore.get(sessionId) || null;
      }

      const now = Date.now();
      const expiresAt = session?.expiresAt || new Date(now + 300 * 24 * 60 * 60 * 1000).toISOString();
      const diffMs = new Date(expiresAt).getTime() - now;
      const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      res.json({
        deviceId: deviceId || 'dev_unknown',
        deviceName: session?.deviceName || 'متصفح هذا الجهاز',
        isTrusted: true,
        createdAt: session?.createdAt || new Date().toISOString(),
        lastUsedAt: session?.lastUsedAt || new Date().toISOString(),
        expiresAt,
        remainingDays,
      });
    } catch (error: any) {
      res.json({
        deviceId: 'dev_unknown',
        deviceName: 'متصفح هذا الجهاز',
        isTrusted: true,
        remainingDays: 300,
      });
    }
  });


  // SMSMode: Check balance
  app.get('/api/sms/balance', requireAuth, async (req, res) => {
    try {
      const session = (req as any).user;
      if (session.userRole !== 'owner' && session.userRole !== 'school_admin') {
        return res.status(403).json({ success: false, error: 'غير مصرح للوصول لرصيد الرسائل' });
      }
      const result = await checkBalance();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to check balance' });
    }
  });

  // SMSMode: Get SMS logs
  app.get('/api/sms/logs', requireAuth, async (req, res) => {
    try {
      const session = (req as any).user;
      if (session.userRole !== 'owner' && session.userRole !== 'school_admin') {
        return res.status(403).json({ success: false, error: 'غير مصرح للوصول لسجلات الرسائل' });
      }
      const query = db.select().from(smsLogsTable);
      const logs = session.userRole !== 'owner' && session.schoolId
        ? await query.where(eq(smsLogsTable.schoolId, session.schoolId)).orderBy(desc(smsLogsTable.sentAt)).limit(200)
        : await query.orderBy(desc(smsLogsTable.sentAt)).limit(200);
      res.json({ success: true, logs });
    } catch (error: any) {
      res.json({ success: true, logs: [], note: 'Database offline or pending migration' });
    }
  });

  // SMSMode: Send Bulk SMS for School Parents
  app.post('/api/sms/send-bulk', requireAuth, async (req, res) => {
    try {
      const session = (req as any).user;
      if (session.userRole !== 'owner' && session.userRole !== 'school_admin' && session.userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'غير مصرح: إرسال الرسائل الجماعية مقتصر على إدارة المدرسة أو المالك فقط' });
      }

      const { schoolId, schoolName, recipients, platformUrl } = req.body;
      
      const targetSchoolId = schoolId || session.schoolId || 'sch-all';
      if (session.userRole !== 'owner' && session.schoolId !== targetSchoolId) {
        return res.status(403).json({ success: false, error: 'غير مصرح بإرسال رسائل لمدرسة أخرى' });
      }

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'لم يتم تحديد قائمة المستلمين' });
      }

      const bulkResult = await sendBulkSMS({
        schoolId: targetSchoolId,
        schoolName: schoolName || 'منصة مدرسة المستقبل',
        recipients,
        platformUrl: platformUrl || process.env.APP_URL || 'https://eduportal.app',
      });

      // Persist logs in Cloud SQL database
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
            error: log.error,
          });
        }
      } catch (dbErr) {
        // Silent log fallback
      }

      res.json({ success: true, ...bulkResult });
    } catch (error: any) {
      console.error('Error in /api/sms/send-bulk:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشلت عملية الإرسال الجماعي' });
    }
  });

  // SMSMode: Send Single SMS
  app.post('/api/sms/send-single', requireAuth, async (req, res) => {
    try {
      const session = (req as any).user;
      if (session.userRole !== 'owner' && session.userRole !== 'school_admin' && session.userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'غير مصرح: إرسال الرسائل مقتصر على إدارة المدرسة أو المالك فقط' });
      }

      const { phone, message, studentId, studentName, schoolId } = req.body;
      const targetSchoolId = schoolId || session.schoolId || 'sch-1';

      if (session.userRole !== 'owner' && session.schoolId !== targetSchoolId) {
        return res.status(403).json({ success: false, error: 'غير مصرح بإرسال رسائل لمدرسة أخرى' });
      }

      const sendRes = await sendSMS({
        phone,
        message,
        studentId,
        studentName,
        schoolId: targetSchoolId,
      });

      try {
        await db.insert(smsLogsTable).values({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          schoolId: targetSchoolId,
          studentId: studentId || '',
          phone: sendRes.phone,
          message,
          provider: 'SMSMode',
          status: sendRes.success ? 'تم التسليم' : 'فشل',
          providerMessageId: sendRes.providerMessageId || '',
          sentAt: sendRes.sentAt,
          error: sendRes.error,
        });
      } catch (dbErr) {
        // Silent log fallback
      }

      res.json({ success: true, result: sendRes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'فشلت عملية الإرسال' });
    }
  });

  // Helper function to generate rich data-driven fallback responses when AI SDK is offline or fallback is needed
  function generateDataDrivenFallback(role: string, lastMsg: string, ctx: any): string {
    const query = (lastMsg || '').toLowerCase();

    if (role === 'admin') {
      const schoolName = ctx.schoolName || 'المدرسة';
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

      // Query: Leaderboard / الأوائل / لوحة الشرف
      if (query.includes('أوائل') || query.includes('اوائل') || query.includes('شرف') || query.includes('ترتيب') || query.includes('نقاط') || query.includes('leaderboard')) {
        const topStudents = leaderboard
          .slice(0, 10)
          .map((s: any) => `• **المركز ${s.rank}**: **${s.studentName}** (فصل: ${s.className || 'عام'}) - النقاط: **${s.points}** نقطة | سلسلة الحضور: **${s.streakDays || 1}** أيام | الأوسمة: **${s.badgesCount || 0}**`)
          .join('\n');
        return `**لوحة شرف الأوائل وقائمة المتفوقين - ${schoolName}** 🏆\n\n` +
          `• **إجمالي المتنافسين باللوحة**: **${students.length}** طالب.\n\n` +
          (topStudents ? `**قائمة الطلاب الأوائل بالترتيب**:\n${topStudents}\n\n` : '• لا توجد بيانات تصنيف حالية.\n\n') +
          `💡 *يتم احتساب النقاط بناءً على الانتظام الدراسي، التفاعل اليومي، وسجلات الأوسمة والتميز.*`;
      }

      // Query: Community / Chats / مجتمع المدرسة
      if (query.includes('مجتمع') || query.includes('شات') || query.includes('محادث') || query.includes('رسائل') || query.includes('استطلاع') || query.includes('community')) {
        const groups = Array.isArray(community.groups) ? community.groups : [];
        const messages = Array.isArray(community.recentMessages) ? community.recentMessages : [];
        const polls = Array.isArray(community.activePolls) ? community.activePolls : [];

        const groupList = groups.map((g: any) => `• **${g.name}** (${g.type || 'عام'}) - الأعضاء: ${g.membersCount || 0} ${g.isLocked ? '[🔒 مقفول للنشر]' : ''}`).join('\n');
        const recentMsgs = messages.slice(-5).map((m: any) => `• [${m.groupName || 'المجتمع'}] **${m.senderName}** (${m.senderRole}): "${m.text}"`).join('\n');
        const pollDetails = polls.map((p: any) => `• استطلاع: **"${p.question}"** (إجمالي الأصوات: ${p.totalVotes || 0})`).join('\n');

        return `**تقرير مجتمع ونقاشات المدرسة - ${schoolName}** 💬\n\n` +
          `• **عدد غرف المجتمع والمجموعات**: **${groups.length}** مجموعة.\n` +
          `• **عدد الرسائل النشطة الموثقة**: **${messages.length}** رسالة.\n` +
          `• **استطلاعات الرأي النشطة**: **${polls.length}** استطلاع.\n\n` +
          `**المجموعات المدرسية المتاحة**:\n${groupList || '• لا توجد مجموعات.'}\n\n` +
          (recentMsgs ? `**أحدث الرسائل والنقاشات بالمجتمع**:\n${recentMsgs}\n\n` : '') +
          (pollDetails ? `**استطلاعات الرأي الجارية**:\n${pollDetails}\n\n` : '');
      }

      // Query: School Calendar / التقويم المدرسي / المواعيد
      if (query.includes('تقويم') || query.includes('مواعيد') || query.includes('فعاليات') || query.includes('امتحان') || query.includes('اختبارات') || query.includes('إجاز') || query.includes('calendar')) {
        const eventsList = calendar
          .slice(0, 8)
          .map((c: any) => `• **${c.title}** - التاريخ: **${c.date}** (${c.category || 'عام'}) - الأولوية: ${c.priority || 'عادي'} [الحالة: ${c.status || 'مجدول'}]`)
          .join('\n');
        return `**التقويم المدرسي والفعاليات المجدولة - ${schoolName}** 📅\n\n` +
          `• **إجمالي الأحداث والمهام المجدولة**: **${calendar.length}** حدث.\n\n` +
          (eventsList ? `**قائمة الفعاليات والمهام القادمة**:\n${eventsList}\n\n` : '• لا توجد فعاليات مسجلة بالتقويم حالياً.\n\n') +
          `💡 *يمكنك إضافة مهام واختبارات جديدة عبر تبويب (التقويم المدرسي).*`;
      }

      // Query: Badges / الأوسمة
      if (query.includes('وسام') || query.includes('أوسمة') || query.includes('تكريم') || query.includes('شرفي') || query.includes('badges')) {
        const available = Array.isArray(badges.availableBadges) ? badges.availableBadges : [];
        const studentB = Array.isArray(badges.awardedStudentBadges) ? badges.awardedStudentBadges : [];
        const teacherB = Array.isArray(badges.awardedTeacherBadges) ? badges.awardedTeacherBadges : [];

        const recentAwards = studentB.slice(0, 6).map((sb: any) => `• الطالب: **${sb.studentName}** ⟵ نال وسام **${sb.badgeName}** (${sb.awardedAt || 'مؤخراً'})`).join('\n');
        return `**تقرير منظومة الأوسمة والتميز - ${schoolName}** 🎖️\n\n` +
          `• **أنواع الأوسمة المعتمدة بالمدرسة**: **${available.length}** وسام.\n` +
          `• **إجمالي الأوسمة الممنوحة للطلاب**: **${studentB.length}** وسام.\n` +
          `• **إجمالي الأوسمة الممنوحة للمعلمين**: **${teacherB.length}** وسام.\n\n` +
          (recentAwards ? `**عينة من أحدث التكريمات الممنوحة**:\n${recentAwards}\n\n` : '');
      }

      // Query: Admin Actions / Disciplinary
      if (query.includes('إجراء') || query.includes('إجراءات') || query.includes('عقوب') || query.includes('إنذار') || query.includes('استدعاء')) {
        const actionList = adminActions.slice(0, 8).map((a: any) => `• **${a.studentName}**: ${a.title} (${a.actionType}) - السبب: ${a.reason} [بتاريخ: ${a.date}]`).join('\n');
        return `**سجل القرارات والإجراءات الإدارية - ${schoolName}** ⚖️\n\n` +
          `• **إجمالي الإجراءات الإدارية المسجلة**: **${adminActions.length}** إجراء.\n\n` +
          (actionList ? `**تفاصيل الإجراءات**:\n${actionList}\n\n` : '• لا توجد عقوبات أو إجراءات إدارية مسجلة.\n\n');
      }

      // Query: Settings / Extensions
      if (query.includes('إعدادات') || query.includes('ترخيص') || query.includes('اشتراك') || query.includes('إضافات') || query.includes('extensions')) {
        const extList = extensions.map((e: any) => `• **${e.name || e.id}**: ${e.isEnabled ? '✅ مفعلة' : '❌ معطلة'}`).join('\n');
        return `**إعدادات وبيانات المدرسة والنظام - ${schoolName}** ⚙️\n\n` +
          `• **كود المدرسة**: \`${settings.schoolCode || ctx.schoolCode || 'SCH'}\`\n` +
          `• **العام الدراسي**: **${settings.academicYear || ctx.academicYear || '2025/2026'}**\n` +
          `• **مدير المدرسة**: **${settings.principalName || ctx.principalName || 'غير محدد'}**\n` +
          `• **المحافظة / العنوان**: ${settings.governorate || ctx.governorate || 'مصر'} - ${settings.address || ctx.address || ''}\n` +
          `• **حالة الترخيص**: سارٍ حتى **${settings.licenseExpiry || ctx.licenseExpiry || '2026-12-31'}**\n\n` +
          `**حالة الإضافات البرمجية المعتمدة (Extensions)**:\n${extList || '• جميع الإضافات الأساسية نشطة.'}`;
      }

      // Query: Attendance / Absence
      if (query.includes('غياب') || query.includes('حضور') || query.includes('حاضر') || query.includes('غائب')) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecords = attendance.filter((a: any) => a.date === todayStr || a.date?.startsWith(todayStr));
        const activeAttendance = todayRecords.length > 0 ? todayRecords : attendance;

        const absentList = activeAttendance.filter((a: any) => a.status === 'غائب');
        const presentList = activeAttendance.filter((a: any) => a.status === 'حاضر' || a.status === 'متأخر');

        const absentNames = absentList
          .map((a: any) => `• **${a.studentName || 'طالب'}** (فصل: ${a.className || 'غير محدد'}${a.notes ? ` - ملاحظة: ${a.notes}` : ''})`)
          .join('\n');

        return `**تقرير إحصائيات الحضور والغياب - ${schoolName}** 📊\n\n` +
          `• **إجمالي الطلاب المسجلين**: **${students.length}** طالب/طالبة.\n` +
          `• **إجمالي سجلات الحضور والغياب المسجلة بالنظام**: **${activeAttendance.length}** سجل.\n` +
          `• **عدد الطلاب الحاضرين**: **${presentList.length}** طالب.\n` +
          `• **عدد الطلاب الغائبين**: **${absentList.length}** طالب.\n\n` +
          (absentList.length > 0
            ? `**قائمة الطلاب الغائبين بالاسم**:\n${absentNames}\n\n`
            : `• **حالة الانضباط والغياب**: جميع الطلاب المسجلين بالسجلات حاضرون (نسبة الانضباط 100%).\n\n`) +
          `💡 *يمكنك متابعة وتسجيل حالة الحضور والغياب اليومية فورياً عبر قسم (الغياب والحضور) المخصص في لوحة التحكم.*`;
      }

      // Query: Teachers / Staff
      if (query.includes('معلم') || query.includes('معلمين') || query.includes('كادر') || query.includes('مدرس')) {
        const teacherItems = teachers
          .map((t: any) => `• **${t.name}** - التخصص: ${t.specialization || 'عام'} ${t.phone ? `(هاتف: ${t.phone})` : ''}`)
          .join('\n');
        return `**تقرير كادر المعلمين - ${schoolName}** 👨‍🏫\n\n` +
          `• **إجمالي عدد المعلمين المقيدين**: **${teachers.length}** معلم.\n\n` +
          `**قائمة المعلمين المتاحين للنظام**:\n${teacherItems || '• لا توجد بيانات معلمين إضافية.'}`;
      }

      // Query: Students / Enrollment
      if (query.includes('طالب') || query.includes('طلاب') || query.includes('أطفال') || query.includes('قيد')) {
        const studentItems = students
          .slice(0, 15)
          .map((s: any) => `• **${s.name}** (فصل: ${s.className || 'غير محدد'}, كود: ${s.code || s.id}, ولي الأمر: ${s.parentPhone || 'غير محدد'})`)
          .join('\n');
        return `**تقرير الطلاب المقيدين - ${schoolName}** 🎓\n\n` +
          `• **إجمالي عدد الطلاب بالمدرسة**: **${students.length}** طالب.\n` +
          `• **عدد الفصول الموزع عليها الطلاب**: **${classes.length}** فصل دراسي.\n\n` +
          `**قائمة الطلاب المقيدين بالنظام**:\n${studentItems}\n\n` +
          (students.length > 15 ? `*يوجد ${students.length - 15} طلاب آخرين مسجلين بقاعدة البيانات.*` : '');
      }

      // Query: Grades / Exams
      if (query.includes('درجات') || query.includes('تحصيل') || query.includes('نتيجة') || query.includes('اختبار')) {
        const topGrades = grades
          .slice(0, 8)
          .map((g: any) => `• **${g.studentName}** - مادة ${g.subjectName || 'عامة'}: **${g.score}/${g.maxScore}** (${g.examName || 'اختبار'})`)
          .join('\n');
        return `**تقرير التحصيل الأكاديمي والدرجات - ${schoolName}** 📝\n\n` +
          `• **إجمالي نتائج الدرجات المرصودة**: **${grades.length}** نتيجة.\n` +
          `• **عدد المواد الدراسية**: **${ctx.stats?.totalSubjects || ctx.subjects?.length || 8}** مواد.\n\n` +
          (grades.length > 0 ? `**عينة من الدرجات والمرصودات الأكاديمية**:\n${topGrades}\n\n` : '') +
          `💡 *يمكنك طباعة كشوف الدرجات والشهادات بالتفصيل من قسم (النتائج والتحصيل) باللوحة.*`;
      }

      // Query: Behavioral records
      if (query.includes('سلوك') || query.includes('تميز') || query.includes('مخالف')) {
        const behaviorItems = behavior
          .map((b: any) => `• **${b.studentName}**: ${b.title} (${b.type}) - ${b.description}`)
          .join('\n');
        return `**تقرير السلوك والمواظبة - ${schoolName}** 🌟\n\n` +
          `• **إجمالي سجلات السلوك**: **${behavior.length}** سجل.\n\n` +
          `**تفاصيل السجلات السلوكية**:\n${behaviorItems || '• جميع الطلاب ملتزمون بالسلوك الإيجابي.'}`;
      }

      // Default general response
      return `**التقرير الشامل والحي لإدارة ${schoolName}** 🏫\n\n` +
        `بناءً على الرؤية الشاملة لكافة أقسام وبيانات مدرستك:\n` +
        `• **عدد الطلاب المقيدين**: **${students.length}** طالب.\n` +
        `• **عدد المعلمين**: **${teachers.length}** معلم.\n` +
        `• **عدد الفصول الدراسية**: **${classes.length}** فصل.\n` +
        `• **المتصدر الأول في لوحة الشرف**: **${leaderboard[0]?.studentName || 'طالب متميز'}** (${leaderboard[0]?.points || 0} نقطة).\n` +
        `• **غرف مجتمع المدرسة النشطة**: **${community.groups?.length || 0}** مجموعة.\n` +
        `• **إجمالي الفعاليات بالتقويم المدرسي**: **${calendar.length}** حدث.\n` +
        `• **إجمالي الأوسمة الممنوحة**: **${(badges.awardedStudentBadges?.length || 0) + (badges.awardedTeacherBadges?.length || 0)}** وسام.\n` +
        `• **سجلات الحضور والغياب**: **${attendance.length}** سجل.\n` +
        `• **إجمالي نتائج الدرجات**: **${grades.length}** نتيجة مرصودة.\n\n` +
        `أنا جاهز للإجابة الدقيقة عن أي استفسار يتعلق بالمجتمع والشات، الأوائل، الأوسمة، التقويم، الإعدادات، أو السجلات الأكاديمية بالاسم والأرقام!`;
    } else {
      // Owner fallback
      const platformStats = ctx.platformStats || {};
      const schoolsOverview = Array.isArray(ctx.schoolsOverview) ? ctx.schoolsOverview : [];
      const activeSchools = schoolsOverview.filter((s: any) => s.status === 'نشطة');
      let answer = `أهلاً بك يا مالك المنظومة! 👋\n\n` +
        `**ملخص البيانات المباشرة للمنظومة**:\n` +
        `• **إجمالي المدارس المسجلة**: **${platformStats.totalSchools || schoolsOverview.length}** مدرسة (${activeSchools.length} نشطة).\n` +
        `• **إجمالي التقديري للطلاب بالمنظومة**: **${platformStats.totalStudentsEstimate || 0}** طالب.\n\n` +
        `أنا جاهز لتحليل أداء كافة المدارس واشتراكاتها بالتفصيل فور طلبك!`;

      const q = (query || '').toLowerCase().trim();
      const wantsExcel =
        q.includes('إكسيل') ||
        q.includes('اكسيل') ||
        q.includes('إكسل') ||
        q.includes('اكسل') ||
        q.includes('excel') ||
        q.includes('xlsx') ||
        q.includes('شيت') ||
        q.includes('تصدير') ||
        q.includes('ملف');

      if (wantsExcel && schoolsOverview.length > 0) {
        const excelPayload = {
          fileName: `تقرير_مدارس_المنظومة_${new Date().toISOString().split('T')[0]}.xlsx`,
          sheetName: 'المدارس',
          metadata: {
            title: 'تقرير مدارس وتراخيص المنظومة',
            generatedAt: new Date().toLocaleDateString('ar-EG'),
          },
          columns: ['م', 'اسم المدرسة', 'كود المدرسة', 'المحافظة', 'حالة المدرسة', 'نوع الاشتراك', 'عدد الطلاب'],
          rows: schoolsOverview.map((s: any, idx: number) => [
            idx + 1,
            s.name,
            s.code || s.id,
            s.governorate || 'غير محدد',
            s.status || 'نشطة',
            s.subscription || 'أساسي',
            s.studentsCount || 0,
          ]),
        };
        answer += `\n\n\`\`\`json:excel-export\n${JSON.stringify(excelPayload, null, 2)}\n\`\`\``;
      }

      return answer;
    }
  }

  // AI Chatbot endpoint for School Admin and Owner
  app.post('/api/chat', requireAuth, async (req, res) => {
    try {
      const session = (req as any).user;
      const { role, messages, contextData } = req.body;

      const effectiveRole = session.userRole === 'owner' ? 'owner' : 'admin';

      const cleanedContext = sanitizeContext(contextData);
      let targetSchoolId =
        cleanedContext?.schoolId ||
        session?.schoolId ||
        (req.headers['x-school-id'] as string) ||
        '';

      // Verify that targetSchoolId has students in DB
      let hasStudents = false;
      if (targetSchoolId && targetSchoolId !== 'sch-1') {
        const c = await db
          .select({ count: count() })
          .from(studentsTable)
          .where(eq(studentsTable.schoolId, targetSchoolId));
        if ((c[0]?.count || 0) > 0) {
          hasStudents = true;
        }
      }

      // If no schoolId or targetSchoolId has 0 students in DB, try matching by school name
      if (!hasStudents && cleanedContext?.schoolName) {
        const matched = await db
          .select({ schoolId: schoolInfoTable.schoolId })
          .from(schoolInfoTable)
          .where(ilike(schoolInfoTable.name, `%${cleanedContext.schoolName.trim()}%`))
          .limit(1);
        if (matched[0]?.schoolId) {
          targetSchoolId = matched[0].schoolId;
          hasStudents = true;
        }
      }

      // If still not resolved or has 0 students, grab top school with students (e.g. sch-1788694475220)
      if (!hasStudents) {
        const topSchool = await db
          .select({ schoolId: studentsTable.schoolId })
          .from(studentsTable)
          .groupBy(studentsTable.schoolId)
          .orderBy(desc(count()))
          .limit(1);
        if (topSchool[0]?.schoolId) {
          targetSchoolId = topSchool[0].schoolId;
        } else {
          targetSchoolId = 'sch-1';
        }
      }

      const rawMessage = req.body.message || '';
      const lastMsg =
        rawMessage ||
        (messages && messages.length > 0 ? messages[messages.length - 1]?.text || messages[messages.length - 1]?.content : '');

      const schoolName = cleanedContext.schoolName || 'المدرسة';

      // Fetch high-level school operational metrics to ground Gemini without token bloat
      let schoolStats = {
        schoolName,
        schoolId: targetSchoolId,
        totalRegisteredStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
      };
      try {
        const [stdCount, tchCount, clsCount] = await Promise.all([
          db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.schoolId, targetSchoolId)),
          db.select({ count: count() }).from(teachersTable).where(eq(teachersTable.schoolId, targetSchoolId)),
          db.select({ count: count() }).from(classesTable).where(eq(classesTable.schoolId, targetSchoolId)),
        ]);
        schoolStats.totalRegisteredStudents = stdCount[0]?.count || 0;
        schoolStats.totalTeachers = tchCount[0]?.count || 0;
        schoolStats.totalClasses = clsCount[0]?.count || 0;
      } catch (statsErr) {
        // Safe fallback
      }

      let systemInstruction = '';
      if (effectiveRole === 'admin') {
        systemInstruction = `أنت المستشار التربوي والتنفيذي الذكي لإدارة مدرسة "${schoolName}" (School Operations AI Strategic Advisor).
أنت شريك قيادي ومفكر استراتيجي رفيع المستوى، لا تقدم إجابات روبوتية جاهزة أو سريعة من قاعدة البيانات. مهمتك أن تفكر بعمق، تستوعب متطلبات المدير المحددة بدقة، تناقش تفاصيل وهيكل الملفات، وتطرح حلولاً مخصصة لإنشاء ملفات Excel واستبيانات احترافية (سواء كانت من قاعدة البيانات أو ملفات مقترحة جديدة تماماً كالخطط والجداول والمصفوفات والاستبيانات التربوية).

بيانات المدرسة الحية:
- اسم المدرسة: ${schoolName}
- إجمالي الطلاب المقيدين فعلياً بقاعدة البيانات: ${schoolStats.totalRegisteredStudents} طالباً.
- إجمالي المعلمين: ${schoolStats.totalTeachers} معلماً.
- إجمالي الفصول: ${schoolStats.totalClasses} فصلاً.
- الحقول الرسمية المتاحة لبيانات الطلاب بقاعدة البيانات: (اسم الطالب، الرقم القومي، كود الوزارة، كود الطالب، الفصل الدراسي، النوع، تاريخ الميلاد، هاتف ولي الأمر، الحالة الدراسية).

قواعد التفكير والمناقشة والعمل:
1. التفكير وفهم المتطلب بدقة (Think & Understand):
   - لا تتسرع في إعطاء كشف عام. فكّر في الغرض من طلب المدير وما هي الأعمدة المحددة التي يريدها.
   - إذا طلب المدير كشفاً يحتوي على أعمدة محددة (مثل: الاسم، الرقم القومي، كود الوزارة): احرص على تلبية هذا المطلب بدقة، واشرح للمدير اكتمال الأرقام القومية وأكواد الوزارة وكيفية الاستفادة منها.
   - إذا أراد المدير ملفاً من قاعدة البيانات (كشف الطلاب، كشف الحضور والغياب، كشف الدرجات، كشف المعلمين): استخدم أداة "exportSchoolDataToExcel" مع تمرير نوع البيانات والأعمدة المحددة والفلاتر، أو ابحث في الطلاب عبر "searchStudents".

2. مناقشة هيكل وتصميم الملف (Discuss & Advise):
   - ناقش الأعمدة المختارة، سبب ترتيبها، المعايير الوزارية والتربوية المرتبطة بها، وأهمية سرية الأرقام القومية وحفظ البيانات.
   - إذا طلب ملفاً تنظيمياً أو مقترحاً غير مسجل بقاعدة البيانات (مثل: جدول حصص أسبوعي، خطة توزيع لجان الامتحانات والملاحظين، كشف رصد المصروفات، مصفوفة تقييم المعلمين، شيت الأنشطة): صمّم الملف بابتكار واحترافية كاملة مع كتابة كافة الأعمدة والبيانات النموذجية عبر كتلة json:excel-export.

3. نشر الإعلانات والاستطلاعات والفعاليات المدرسية (Announcements, Polls & Events):
   - عندما يطلب المدير كتابة أو نشر إعلان للمدرسة (مثل: إعلان للمعلمين للحث على الاستعداد لاختبارات نصف العام، إعلان لأولياء الأمور، تعميم رسمي، تنبيه للطلاب):
     اكتب رداً إدارياً راقياً وملهماً يشرح للمدير محاور وتأثير هذا التعميم، وأرفق دائماً في نهاية ردك كتلة json:publish-draft بصيغة JSON تحتوي على الحقول الأربعة الأساسية بدقة (العنوان، الأولوية، نص الإعلان الوافي، والفئة المستهدفة):
\`\`\`json:publish-draft
{
  "type": "announcement",
  "title": "تعميم إداري: الاستعداد والتجهيز الشامل لاختبارات منتصف العام الدراسي",
  "priority": "هام",
  "content": "الزملاء والزميلات أعضاء الهيئة التعليمية الكرام... نهيب بكم سرعة إنهاء المناهج الدراسية ومراجعة بنوك الأسئلة...",
  "targetAudience": "المعلمين",
  "authorName": "إدارة المدرسة"
}
\`\`\`
   - عندما يطلب المدير استطلاع رأي (Poll):
\`\`\`json:publish-draft
{
  "type": "poll",
  "title": "استطلاع رأي حول مواعيد الحصص الإثرائية",
  "content": "نأمل مشاركتكم في اختيار التوقيت الأنسب...",
  "priority": "عادي",
  "targetAudience": "المعلمين",
  "pollOptions": ["الفترة الصباحية (قبل الطابور)", "الفترة المسائية (بعد انتهاء اليوم)", "يوم السبت عن بُعد"]
}
\`\`\`
   - عندما يطلب المدير إضافة أو جدولة فعالية مدرسية (Event):
\`\`\`json:publish-draft
{
  "type": "event",
  "title": "ورشة عمل تدريبية للمعلمين: استراتيجيات التقييم الحديثة",
  "content": "ورشة عمل تهدف إلى تطوير مهارات صياغة المفردات الاختبارية...",
  "priority": "هام",
  "targetAudience": "المعلمين",
  "eventDate": "2026-10-20",
  "eventTime": "10:00 صباحاً",
  "eventLocation": "مسرح المدرسة الرئيسي"
}
\`\`\`

4. الاستبيانات واستطلاعات الرأي التربوية (Questionnaires & Surveys - عند الحاجة فقط):
   - عندما يطلب المدير استبياناً موسعاً أو استطلاع رأي لقياس رضا أولياء الأمور أو جودة الخدمات:
     صمّم استبياناً علمياً دقيقاً يتضمن المحاور والأسئلة بمقياس ليكرت، ويمكنك تصديره كملف Excel عبر json:excel-export.

5. توليد ملفات Excel المخصصة (.xlsx):
   - عندما تصمم ملفاً مخصصاً ليس من قاعدة البيانات (كالجداول والاستبيانات والمصفوفات والخطط)، ضمّن كتلة json:excel-export في نهاية ردك:
\`\`\`json:excel-export
{
  "fileName": "اسم_الملف.xlsx",
  "sheetName": "اسم_الورقة",
  "metadata": {
    "title": "عنوان التقرير أو الاستبيان",
    "schoolName": "${schoolName}"
  },
  "columns": ["العمود 1", "العمود 2"],
  "rows": [
    ["قيمة 1", "قيمة 2"]
  ]
}
\`\`\``;
      } else if (role === 'owner') {
        systemInstruction = `أنت المساعد الذكي المباشر لمالك المنظومة (Platform Owner Dashboard AI Assistant).
مهمتك: مناقشة وتحليل أداء المنظومة والمدارس والتراخيص بأسلوب ودود ومباشر وذكي.
عند طلب ملف إكسيل للمدارس أو الاشتراكات، يمكنك إرفاق كتلة json:excel-export المناسبة.

سياق بيانات المنظومة الحالية:
${JSON.stringify(cleanedContext, null, 2)}`;
      } else {
        systemInstruction = 'أنت مساعد ذكي مفيد للمدرسة والمنظومة. أجب بأسلوب منظم وواضح باللغة العربية.';
      }

      const ai = getAiClient();
      if (!ai) {
        // High-speed on-demand fallback when GEMINI_API_KEY is not configured
        let fallbackAnswer =
          effectiveRole === 'admin'
            ? await smartFallbackAnswer(lastMsg, targetSchoolId, cleanedContext)
            : generateDataDrivenFallback(role, lastMsg, cleanedContext);

        let fbAttachment: any = null;
        let fbDraft: any = null;

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

      // Convert messages for Gemini
      const formattedContents = (messages || []).map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      // Try generation with fallback across models and function calling support
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let answerText = '';
      let generatedAttachment: any = null;
      let generatedDraft: any = null;

      for (const modelName of modelsToTry) {
        try {
          const currentContents: any[] = [...formattedContents];
          const toolsConfig = effectiveRole === 'admin' ? [{ functionDeclarations: geminiSchoolTools }] : undefined;

          let response = await ai.models.generateContent({
            model: modelName,
            contents: currentContents,
            config: {
              systemInstruction,
              temperature: 0.7,
              tools: toolsConfig,
            },
          });

          // Multi-turn tool execution loop if model requested a tool
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

            // Create lightweight summary for Gemini so it is never flooded with raw row arrays
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
              role: 'model',
              parts: [{ functionCall: call }],
            };
            currentContents.push(modelContent);

            currentContents.push({
              role: 'tool',
              parts: [
                {
                  functionResponse: {
                    name: call.name,
                    response: lightResult,
                  },
                },
              ],
            });

            response = await ai.models.generateContent({
              model: modelName,
              contents: currentContents,
              config: {
                systemInstruction,
                temperature: 0.7,
                tools: toolsConfig,
              },
            });
          }

          if (response.text && response.text.trim()) {
            answerText = response.text;
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Model ${modelName} call failed, trying next candidate:`, modelErr?.message || modelErr);
        }
      }

      if (!answerText) {
        answerText =
          effectiveRole === 'admin'
            ? await smartFallbackAnswer(lastMsg, targetSchoolId, cleanedContext)
            : generateDataDrivenFallback(role, lastMsg, cleanedContext);
      }

      // If answer text includes a json:excel-export block, extract or clean it
      if (answerText && !generatedAttachment) {
        const extracted = extractExcelFromResponse(answerText);
        if (extracted.attachment) {
          generatedAttachment = extracted.attachment;
          answerText = extracted.cleanText;
        }
      }

      // Extract publishDraft if present in text and not already set by tool
      if (!generatedDraft && answerText) {
        const draftResult = extractPublishDraftFromResponse(answerText, lastMsg);
        if (draftResult.draft) {
          generatedDraft = draftResult.draft;
          answerText = draftResult.cleanText;
        }
      }

      return res.json({ answer: answerText, attachment: generatedAttachment, publishDraft: generatedDraft });
    } catch (error: any) {
      console.error('Error in /api/chat route:', error);
      res.status(500).json({
        error: 'حدث خطأ أثناء معالجة طلب المحادثة',
        details: error?.message || String(error),
      });
    }
  });

  // ==========================================
  // 🏫 CENTRAL SCHOOL MANAGEMENT API (PostgreSQL - Delegated to schoolEntitiesRoutes)
  // ==========================================

  // RESTORE INITIAL SCHOOLS ENDPOINT (Owner only)
  app.post('/api/schools/seed-initial', async (req, res) => {
    try {
      const session = extractAuthSession(req);
      if (!session || !session.isAuthenticated || session.userRole !== 'owner') {
        return res.status(403).json({ error: 'غير مصرح: هذه العملية تتطلب صلاحيات مالك المنظومة (Owner)' });
      }

      for (const item of INITIAL_DATABASE_SCHOOLS) {
        await db.insert(schoolInfoTable).values(item).onConflictDoNothing();
      }

      const all = await db.select().from(schoolInfoTable);
      res.json({ success: true, count: all.length, schools: all.map((r) => formatSchoolResponse(r)) });
    } catch (error: any) {
      console.error('Error seeding initial schools:', error);
      res.status(500).json({ error: error?.message || 'فشل تهيئة المدارس' });
    }
  });

  // Register Central PostgreSQL CRUD & Auth Endpoints for School Entities (Teachers, Students, Classes, Attendance, Badges, etc.)
  registerSchoolEntitiesRoutes(app, extractAuthSession, memorySessionStore);

  // Register Central PostgreSQL Support & Complaints Tickets System Routes
  registerSupportTicketsRoutes(app, extractAuthSession);

  // Register Central PostgreSQL Private Messaging "رسائلي" System Routes
  registerPrivateMessagingRoutes(app, extractAuthSession);

  // Meta WhatsApp Cloud API Endpoint
  app.post('/api/whatsapp/send', requireAuth, express.json(), async (req, res) => {
    try {
      const session = (req as any).user;
      if (!session || !session.isAuthenticated) {
        return res.status(401).json({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول' });
      }
      const { recipientPhone, message, studentName } = req.body || {};
      const token = process.env.WHATSAPP_API_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        return res.status(400).json({
          success: false,
          error: 'متغيرات بيئة الواتساب (WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID) غير مهيأة على الخادم. يرجى استخدام الربط المباشر عبر wa.me.',
        });
      }

      const metaUrl = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: { preview_url: true, body: message },
        }),
      });

      const responseData = await response.json();
      if (response.ok) {
        return res.json({ success: true, data: responseData });
      } else {
        return res.status(400).json({ success: false, error: responseData.error?.message || 'خطأ في استجابة Meta WhatsApp' });
      }
    } catch (error: any) {
      console.error('WhatsApp API sending error:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل إرسال الرسالة عبر الواتساب' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} with Cloud SQL PostgreSQL`);
  });

  // Generous timeouts for heavy multi-thousand student operations
  server.keepAliveTimeout = 120000; // 2 minutes
  server.headersTimeout = 125000;
  server.requestTimeout = 300000; // 5 minutes
}

startServer();
