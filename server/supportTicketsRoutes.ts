import express from 'express';
import { db, createPool } from '../src/db/index.ts';
import {
  supportTicketsTable,
  supportTicketRepliesTable,
  schoolInfoTable,
  studentsTable,
} from '../src/db/schema.ts';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';
import { TicketStatus } from '../src/types/ticket.ts';

function stringToSigned32BitInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function registerSupportTicketsRoutes(
  app: express.Express,
  extractAuthSession: (req: express.Request) => any
) {
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

  // ----------------------------------------------------
  // 1. GET /api/support-tickets/my-daily-usage
  // Returns today's quota usage for the authenticated student
  // ----------------------------------------------------
  app.get('/api/support-tickets/my-daily-usage', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const studentId = (user.studentId || user.userId || '').trim();
      const todayStr = new Date().toISOString().split('T')[0];

      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'معرف الطالب غير متوفر في الجلسة الحالية',
        });
      }

      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTicketsTable)
        .where(
          and(
            eq(supportTicketsTable.studentId, studentId),
            eq(supportTicketsTable.createdDate, todayStr)
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
          canCreate: usedToday < maxDaily,
        },
      });
    } catch (err: any) {
      console.error('Error fetching student daily usage:', err);
      return res.status(500).json({
        success: false,
        error: 'فشل استرجاع حد التذاكر اليومي من الخادم',
      });
    }
  });

  // ----------------------------------------------------
  // 2. GET /api/support-tickets
  // Multi-tenant ticket listing with server-side pagination & SQL aggregation:
  // - Owner: across all schools with filters (default limit: 50, max: 100)
  // - School Admin: for their school only
  // - Student/Parent: strictly their own tickets (default limit: 20, max: 50)
  // ----------------------------------------------------
  app.get('/api/support-tickets', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { status, schoolId, search, page, limit } = req.query as {
        status?: string;
        schoolId?: string;
        search?: string;
        page?: string;
        limit?: string;
      };

      const scopeConditions: any[] = [];

      if (user.userRole === 'owner') {
        // Owner can filter by school or see all
        if (schoolId && schoolId !== 'all') {
          scopeConditions.push(eq(supportTicketsTable.schoolId, schoolId));
        }
      } else if (user.userRole === 'school_admin' || user.userRole === 'admin') {
        // School admin is strictly scoped to their own school
        if (!user.schoolId) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: غير مرتبط بأي مدرسة',
          });
        }
        scopeConditions.push(eq(supportTicketsTable.schoolId, user.schoolId));
      } else {
        // Student / Parent: strictly their own tickets
        const studentId = user.studentId || user.userId;
        if (!studentId) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: تعذر التحقق من هوية الطالب',
          });
        }
        scopeConditions.push(eq(supportTicketsTable.studentId, studentId));
        if (user.schoolId) {
          scopeConditions.push(eq(supportTicketsTable.schoolId, user.schoolId));
        }
      }

      // Filter conditions (for the specific paginated list)
      const listConditions = [...scopeConditions];

      // Filter by status if provided
      if (status && status !== 'all' && status !== 'الكل') {
        listConditions.push(eq(supportTicketsTable.status, status));
      }

      // Search filter if provided
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        listConditions.push(
          or(
            ilike(supportTicketsTable.ticketCode, term),
            ilike(supportTicketsTable.studentName, term),
            ilike(supportTicketsTable.subject, term),
            ilike(supportTicketsTable.description, term)
          )
        );
      }

      // Role-specific limits:
      // Owner/Admin: default 50, max 100
      // Student/Parent: default 20, max 50
      const isStudentOrParent =
        user.userRole !== 'owner' &&
        user.userRole !== 'school_admin' &&
        user.userRole !== 'admin';
      const defaultLimit = isStudentOrParent ? 20 : 50;
      const maxLimit = isStudentOrParent ? 50 : 100;

      const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
      const limitNum = Math.min(
        Math.max(1, parseInt(String(limit || defaultLimit), 10) || defaultLimit),
        maxLimit
      );
      const offset = (pageNum - 1) * limitNum;

      // 1. Total count for current filtered query
      const countQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTicketsTable)
        .where(listConditions.length > 0 ? and(...listConditions) : undefined);

      // 2. Status summary counts via SQL aggregation (scoped to user's authorized schools/students)
      const statsQuery = db
        .select({
          totalCount: sql<number>`count(*)::int`,
          newCount: sql<number>`count(case when ${supportTicketsTable.status} = 'جديدة' then 1 end)::int`,
          inReviewCount: sql<number>`count(case when ${supportTicketsTable.status} = 'قيد المراجعة' then 1 end)::int`,
          answeredCount: sql<number>`count(case when ${supportTicketsTable.status} = 'تم الرد' then 1 end)::int`,
          closedCount: sql<number>`count(case when ${supportTicketsTable.status} = 'مغلقة' then 1 end)::int`,
        })
        .from(supportTicketsTable)
        .where(scopeConditions.length > 0 ? and(...scopeConditions) : undefined);

      // 3. Paginated list of tickets
      const ticketsQuery = db
        .select()
        .from(supportTicketsTable)
        .where(listConditions.length > 0 ? and(...listConditions) : undefined)
        .orderBy(desc(supportTicketsTable.createdAt))
        .limit(limitNum)
        .offset(offset);

      const [countRes, statsRes, tickets] = await Promise.all([
        countQuery,
        statsQuery,
        ticketsQuery,
      ]);

      const totalCount = countRes[0]?.count ?? 0;
      const stats = statsRes[0] || {
        totalCount: 0,
        newCount: 0,
        inReviewCount: 0,
        answeredCount: 0,
        closedCount: 0,
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
        stats,
      });
    } catch (err: any) {
      console.error('Error fetching support tickets:', err);
      return res.status(500).json({
        success: false,
        error: 'فشل جلب التذاكر من قاعدة البيانات المركزية',
      });
    }
  });

  // ----------------------------------------------------
  // 3. GET /api/support-tickets/:ticketId
  // Retrieves a single ticket with all its replies
  // ----------------------------------------------------
  app.get('/api/support-tickets/:ticketId', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { ticketId } = req.params;

      const ticketRows = await db
        .select()
        .from(supportTicketsTable)
        .where(eq(supportTicketsTable.id, ticketId))
        .limit(1);

      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'التذكرة المطلوبة غير موجودة',
        });
      }

      const ticket = ticketRows[0];

      // Multi-tenant authorization check
      if (user.userRole !== 'owner') {
        if (user.userRole === 'school_admin' || user.userRole === 'admin') {
          if (ticket.schoolId !== user.schoolId) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: لا يمكنك الاطلاع على تذاكر مدرسة أخرى',
            });
          }
        } else {
          // Student / Parent
          const studentId = user.studentId || user.userId;
          if (ticket.studentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: لا يمكنك الاطلاع على تذاكر طلاب آخرين',
            });
          }
        }
      }

      // Fetch replies
      const replies = await db
        .select()
        .from(supportTicketRepliesTable)
        .where(eq(supportTicketRepliesTable.ticketId, ticketId))
        .orderBy(supportTicketRepliesTable.createdAt);

      return res.json({
        success: true,
        ticket: {
          ...ticket,
          replies,
        },
      });
    } catch (err: any) {
      console.error('Error fetching ticket details:', err);
      return res.status(500).json({
        success: false,
        error: 'فشل جلب تفاصيل التذكرة',
      });
    }
  });

  // ----------------------------------------------------
  // 4. POST /api/support-tickets
  // Creates a new ticket with strict server-side 2 tickets/day limit
  // Atomic transactional advisory lock protection against race conditions
  // ----------------------------------------------------
  app.post('/api/support-tickets', requireAuth, async (req, res) => {
    let client: any = null;
    let isClientReleased = false;

    const safeRelease = () => {
      if (client && !isClientReleased) {
        isClientReleased = true;
        try {
          client.release();
        } catch (releaseErr) {
          console.warn('Warning releasing db client:', releaseErr);
        }
      }
    };

    try {
      const user = (req as any).user;
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
        description,
      } = req.body || {};

      // Validate required fields
      if (!subject || !subject.trim() || !description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'يرجى كتابة عنوان الشكوى وتفاصيل المشكلة',
        });
      }

      const finalCategory = (category && typeof category === 'string' && category.trim()) || 'عام';
      const finalSubcategory = (subcategory && typeof subcategory === 'string' && subcategory.trim()) || 'عام';

      // Enforce authenticated student identity
      const isStudentOrParent = user.userRole === 'parent' || user.userRole === 'student';
      const studentId = isStudentOrParent
        ? (user.studentId || user.userId || bodyStudentId)
        : (bodyStudentId || user.userId);
      const schoolId = user.schoolId || bodySchoolId;

      if (!studentId || !schoolId) {
        return res.status(400).json({
          success: false,
          error: 'معرف الطالب والمدرسة مطلوبان لإنشاء التذكرة',
        });
      }

      // Look up student details from studentsTable if not fully provided
      let studentName = bodyStudentName || user.userDisplayName || 'طالب';
      let studentCode = bodyStudentCode || '';
      let className = bodyClassName || '';
      let schoolName = bodySchoolName || '';

      try {
        const studentRow = await db
          .select()
          .from(studentsTable)
          .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)))
          .limit(1);

        if (studentRow.length > 0) {
          studentName = studentRow[0].name || studentName;
          studentCode = studentRow[0].studentCode || studentCode;
          className = studentRow[0].className || className;
        }

        const schoolRow = await db
          .select({ name: schoolInfoTable.name })
          .from(schoolInfoTable)
          .where(eq(schoolInfoTable.schoolId, schoolId))
          .limit(1);

        if (schoolRow.length > 0) {
          schoolName = schoolRow[0].name || schoolName;
        }
      } catch (lookupErr) {
        // Fallback to provided names
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();

      const pool = createPool();
      client = await pool.connect();

      // Begin atomic transaction
      await client.query('BEGIN');

      // Acquire advisory transaction lock for (studentId + todayStr)
      // This guarantees that concurrent requests from the same student wait and evaluate atomically
      const lockKey = stringToSigned32BitInt(`ticket_limit_${studentId}_${todayStr}`);
      await client.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

      // Count today's tickets for this student
      const countRes = await client.query(
        'SELECT COUNT(*)::int as count FROM support_tickets WHERE student_id = $1 AND created_date = $2',
        [studentId, todayStr]
      );
      const currentCount = parseInt(countRes.rows[0]?.count || '0', 10);

      if (currentCount >= 2) {
        await client.query('ROLLBACK');
        safeRelease();
        return res.status(429).json({
          success: false,
          error: 'تجاوزت الحد اليومي المسموح به لتقديم التذاكر (تذكرتان كحد أقصى يومياً). يمكنك تقديم تذكرة جديدة غداً.',
          dailyLimitReached: true,
          usedToday: currentCount,
          maxDaily: 2,
        });
      }

      // Generate clean unique ticket code and ID
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `TCK-${randomSuffix}`;
      const ticketId = `tck_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

      // Insert ticket
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
          'جديدة',
          nowIso,
          todayStr,
          nowIso,
        ]
      );

      await client.query('COMMIT');
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
        status: 'جديدة' as TicketStatus,
        createdAt: nowIso,
        createdDate: todayStr,
        updatedAt: nowIso,
        answeredAt: null,
        answeredBy: null,
      };

      return res.status(201).json({
        success: true,
        message: 'تم إرسال الشكوى وتأكيد تسجيلها في قاعدة البيانات بنجاح',
        ticket: createdTicket,
        usage: {
          usedToday: currentCount + 1,
          maxDaily: 2,
          remainingToday: Math.max(0, 2 - (currentCount + 1)),
        },
      });
    } catch (err: any) {
      if (client && !isClientReleased) {
        await client.query('ROLLBACK').catch(() => {});
        safeRelease();
      }
      console.error('Error creating support ticket:', err);
      return res.status(500).json({
        success: false,
        error: 'حدث خطأ أثناء حفظ التذكرة في قاعدة البيانات. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      safeRelease();
    }
  });

  // ----------------------------------------------------
  // 4b. POST /api/support-tickets/public
  // Allows visitors/users to submit a support ticket without logging in
  // ----------------------------------------------------
  app.post('/api/support-tickets/public', async (req, res) => {
    try {
      const {
        senderName,
        contactInfo,
        schoolName,
        category,
        subject,
        description,
      } = req.body || {};

      if (!subject || !subject.trim() || !description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'يرجى كتابة موضوع المشكلة وتفاصيل الشكوى بالكامل',
        });
      }

      if (!senderName || !senderName.trim() || !contactInfo || !contactInfo.trim()) {
        return res.status(400).json({
          success: false,
          error: 'يرجى كتابة الاسم ومعلومات التواصل (الهاتف أو البريد الإلكتروني)',
        });
      }

      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const ticketId = `TK-PUB-${randomNum}`;
      const nowIso = new Date().toISOString();
      const todayStr = nowIso.split('T')[0];

      const cleanSchoolName = schoolName?.trim() || 'EduPortal الدعم العام';
      const cleanSender = senderName.trim();
      const cleanContact = contactInfo.trim();
      const cleanCategory = category?.trim() || 'دعم فني واستفسارات';
      const cleanSubject = subject.trim();
      const fullDescription = `${description.trim()}\n\n---\nمعلومات التواصل: ${cleanContact}\nالاسم: ${cleanSender}`;

      await db.insert(supportTicketsTable).values({
        id: ticketId,
        ticketCode: ticketId,
        schoolId: 'public_portal',
        schoolName: cleanSchoolName,
        studentId: `public-${Date.now()}`,
        studentName: cleanSender,
        studentCode: cleanContact.slice(0, 50),
        className: 'تذكرة خارجية عامة',
        category: cleanCategory,
        subcategory: 'دعم مباشر بدون تسجيل',
        subject: cleanSubject,
        description: fullDescription,
        status: 'جديدة' as TicketStatus,
        createdAt: nowIso,
        createdDate: todayStr,
        updatedAt: nowIso,
        answeredAt: null,
        answeredBy: null,
      });

      return res.status(201).json({
        success: true,
        message: 'تم تسجيل تذكرتك بنجاح برقم مميز للمتابعة',
        ticketId,
        ticket: {
          id: ticketId,
          ticketCode: ticketId,
          subject: cleanSubject,
          senderName: cleanSender,
          contactInfo: cleanContact,
          status: 'جديدة',
          createdAt: nowIso,
        },
      });
    } catch (err: any) {
      console.error('Error creating public support ticket:', err);
      return res.status(500).json({
        success: false,
        error: 'تعذر إرسال التذكرة حالياً في السيرفر، يرجى المحاولة بعد لحظات.',
      });
    }
  });

  // ----------------------------------------------------
  // 4c. GET /api/support-tickets/public/track/:ticketId
  // Allows visitors to check their ticket status and replies without logging in
  // ----------------------------------------------------
  app.get('/api/support-tickets/public/track/:ticketId', async (req, res) => {
    try {
      const { ticketId } = req.params;
      if (!ticketId || !ticketId.trim()) {
        return res.status(400).json({ success: false, error: 'رقم التذكرة مطلوب' });
      }

      const rows = await db
        .select()
        .from(supportTicketsTable)
        .where(
          or(
            eq(supportTicketsTable.id, ticketId.trim()),
            eq(supportTicketsTable.ticketCode, ticketId.trim()),
            ilike(supportTicketsTable.id, `%${ticketId.trim()}%`)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'لم يتم العثور على أي تذكرة بهذا الرقم. تأكد من إدخال الرقم الصحيح (مثال: TK-PUB-123456)',
        });
      }

      const ticket = rows[0];

      // Fetch replies
      const replies = await db
        .select()
        .from(supportTicketRepliesTable)
        .where(eq(supportTicketRepliesTable.ticketId, ticket.id))
        .orderBy(desc(supportTicketRepliesTable.createdAt));

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
            createdAt: r.createdAt,
          })),
        },
      });
    } catch (err: any) {
      console.error('Error tracking public support ticket:', err);
      return res.status(500).json({
        success: false,
        error: 'تعذر الاستعلام عن التذكرة حالياً.',
      });
    }
  });

  // ----------------------------------------------------
  // 5. POST /api/support-tickets/:ticketId/reply
  // Adds a reply to an existing ticket and updates status / timestamp
  // ----------------------------------------------------
  app.post('/api/support-tickets/:ticketId/reply', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { ticketId } = req.params;
      const { message, newStatus } = req.body || {};

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'لا يمكن إرسال رد فارغ',
        });
      }

      // Check ticket exists
      const ticketRows = await db
        .select()
        .from(supportTicketsTable)
        .where(eq(supportTicketsTable.id, ticketId))
        .limit(1);

      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'التذكرة غير موجودة',
        });
      }

      const ticket = ticketRows[0];

      // Multi-tenant check
      const isOwner = user.userRole === 'owner';
      const isAdmin = user.userRole === 'school_admin' || user.userRole === 'admin';
      const isStudent = user.userRole === 'parent' || user.userRole === 'student';

      if (!isOwner) {
        if (isAdmin && ticket.schoolId !== user.schoolId) {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: لا يمكنك الرد على تذاكر مدرسة أخرى',
          });
        }
        if (isStudent) {
          const studentId = user.studentId || user.userId;
          if (ticket.studentId !== studentId) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: لا يمكنك الرد على تذاكر طلاب آخرين',
            });
          }
        }
      }

      const replyId = `rep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      let senderRole: 'student' | 'owner' | 'school_admin' = 'student';
      let senderName = user.userDisplayName || 'مستخدم';

      if (isOwner) {
        senderRole = 'owner';
        senderName = user.userDisplayName || 'فريق الدعم الفني المركزي';
      } else if (isAdmin) {
        senderRole = 'school_admin';
        senderName = user.userDisplayName || 'إدارة المدرسة';
      } else {
        senderRole = 'student';
        senderName = ticket.studentName || user.userDisplayName || 'الطالب';
      }

      // Insert reply
      const newReply = {
        id: replyId,
        ticketId,
        schoolId: ticket.schoolId,
        senderRole,
        senderId: user.userId || user.studentId || 'unknown',
        senderName,
        message: message.trim(),
        createdAt: nowIso,
      };

      await db.insert(supportTicketRepliesTable).values(newReply);

      // Determine updated status
      let updatedStatus: TicketStatus = ticket.status as TicketStatus;
      let answeredAt = ticket.answeredAt;
      let answeredBy = ticket.answeredBy;

      if (isOwner || isAdmin) {
        updatedStatus = (newStatus && ['جديدة', 'قيد المراجعة', 'تم الرد', 'مغلقة'].includes(newStatus))
          ? (newStatus as TicketStatus)
          : 'تم الرد';
        answeredAt = nowIso;
        answeredBy = senderName;
      } else if (isStudent) {
        // If student replies, status can switch to 'قيد المراجعة' if previously 'تم الرد'
        if (ticket.status === 'تم الرد') {
          updatedStatus = 'قيد المراجعة';
        }
      }

      await db
        .update(supportTicketsTable)
        .set({
          status: updatedStatus,
          updatedAt: nowIso,
          answeredAt,
          answeredBy,
        })
        .where(eq(supportTicketsTable.id, ticketId));

      return res.status(201).json({
        success: true,
        message: 'تم إرسال الرد وتحديث التذكرة بنجاح',
        reply: newReply,
        updatedStatus,
      });
    } catch (err: any) {
      console.error('Error adding ticket reply:', err);
      return res.status(500).json({
        success: false,
        error: 'فشل إرسال الرد إلى قاعدة البيانات',
      });
    }
  });

  // ----------------------------------------------------
  // 6. PATCH /api/support-tickets/:ticketId/status
  // Updates ticket status directly (Owner / School Admin)
  // ----------------------------------------------------
  app.patch('/api/support-tickets/:ticketId/status', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { ticketId } = req.params;
      const { status } = req.body || {};

      const validStatuses: TicketStatus[] = ['جديدة', 'قيد المراجعة', 'تم الرد', 'مغلقة'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'حالة التذكرة المحددة غير صالحة',
        });
      }

      const ticketRows = await db
        .select()
        .from(supportTicketsTable)
        .where(eq(supportTicketsTable.id, ticketId))
        .limit(1);

      if (ticketRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'التذكرة غير موجودة',
        });
      }

      const ticket = ticketRows[0];

      // Multi-tenant check
      if (user.userRole !== 'owner') {
        if (user.userRole === 'school_admin' || user.userRole === 'admin') {
          if (ticket.schoolId !== user.schoolId) {
            return res.status(403).json({
              success: false,
              error: 'غير مصرح: لا يمكنك تغيير حالة تذاكر مدرسة أخرى',
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: فقط إدارة المنظومة يمكنها تغيير حالة التذكرة',
          });
        }
      }

      const nowIso = new Date().toISOString();
      await db
        .update(supportTicketsTable)
        .set({
          status,
          updatedAt: nowIso,
        })
        .where(eq(supportTicketsTable.id, ticketId));

      return res.json({
        success: true,
        message: 'تم تحديث حالة التذكرة بنجاح',
        status,
      });
    } catch (err: any) {
      console.error('Error updating ticket status:', err);
      return res.status(500).json({
        success: false,
        error: 'فشل تحديث حالة التذكرة',
      });
    }
  });
}
