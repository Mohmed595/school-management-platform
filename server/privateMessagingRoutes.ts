import express from 'express';
import { db, createPool } from '../src/db/index.ts';
import {
  privateConversationsTable,
  privateMessagesTable,
  studentsTable,
  teachersTable,
  schoolInfoTable,
} from '../src/db/schema.ts';
import { eq, and, or, desc, sql, asc, inArray } from 'drizzle-orm';
import type { AuthenticatedUserSession } from './serverAuth.ts';

interface ResolvedParticipant {
  id: string;
  role: string;
  name: string;
  details?: string;
}

function resolveCallerParticipant(session: AuthenticatedUserSession, schoolId: string): ResolvedParticipant {
  const role = session.userRole;
  if (role === 'owner' || role === 'school_admin' || role === 'admin' || role === 'super_admin') {
    return {
      id: `admin_${schoolId}`,
      role: 'school_admin',
      name: session.schoolName || session.userDisplayName || 'إدارة المدرسة',
      details: 'إدارة المدرسة',
    };
  }
  if (role === 'teacher' || role === 'attendance_teacher') {
    return {
      id: session.teacherId || session.userId,
      role: role,
      name: session.userDisplayName || 'المعلم',
      details: role === 'attendance_teacher' ? 'مسؤول الحضور والغياب' : 'معلم بالمدرسة',
    };
  }
  // Student / Parent
  return {
    id: session.studentId || session.userId,
    role: 'student',
    name: session.studentName || session.userDisplayName || 'طالب',
    details: session.className || 'طالب بالمدرسة',
  };
}

async function resolveCandidateParticipantIds(
  session: AuthenticatedUserSession,
  caller: ResolvedParticipant,
  schoolId: string
): Promise<string[]> {
  const candidateIds = new Set<string>();
  if (caller.id) candidateIds.add(caller.id);
  if (session.userId) candidateIds.add(session.userId);
  if (session.studentId) candidateIds.add(session.studentId);
  if (session.teacherId) candidateIds.add(session.teacherId);
  if (session.studentCode) candidateIds.add(session.studentCode);

  if (caller.role === 'student' || session.userRole === 'parent' || session.userRole === 'student') {
    const studentQueryValues = [
      session.studentId,
      session.userId,
      session.studentCode,
      caller.id,
    ].filter(Boolean) as string[];

    if (studentQueryValues.length > 0) {
      try {
        const matchedStudents = await db
          .select()
          .from(studentsTable)
          .where(
            and(
              eq(studentsTable.schoolId, schoolId),
              or(
                inArray(studentsTable.id, studentQueryValues),
                inArray(studentsTable.nationalId, studentQueryValues),
                inArray(studentsTable.studentCode, studentQueryValues),
                ...(session.studentName ? [eq(studentsTable.name, session.studentName)] : []),
                ...(session.userDisplayName ? [eq(studentsTable.name, session.userDisplayName)] : [])
              )
            )
          )
          .limit(5);

        for (const st of matchedStudents) {
          if (st.id) candidateIds.add(st.id);
          if (st.nationalId) candidateIds.add(st.nationalId);
          if (st.studentCode) candidateIds.add(st.studentCode);
          if (st.ministryCode) candidateIds.add(st.ministryCode);
        }
      } catch (e) {
        console.warn('[PrivateMessaging] Error resolving student candidates from DB:', e);
      }
    }
  }

  return Array.from(candidateIds);
}

interface SseClient {
  id: string;
  res: express.Response;
  schoolId: string;
  callerId: string;
  candidateIds: string[];
}
const sseClients = new Map<string, SseClient>();

function broadcastPrivateMessage(
  schoolId: string,
  event: {
    type: 'new_message' | 'messages_read' | 'conversation_updated';
    conversationId: string;
    message?: any;
    readAt?: string;
    participantIds?: string[];
  }
) {
  const payload = JSON.stringify(event);
  for (const [clientId, client] of sseClients.entries()) {
    if (client.schoolId !== schoolId) continue;
    if (event.participantIds && event.participantIds.length > 0) {
      const match = client.candidateIds.some((cid) => event.participantIds!.includes(cid));
      if (!match) continue;
    }
    try {
      client.res.write(`event: ${event.type}\ndata: ${payload}\n\n`);
    } catch {
      sseClients.delete(clientId);
    }
  }
}

export function registerPrivateMessagingRoutes(
  app: express.Express,
  extractAuthSession: (req: express.Request) => any
) {
  // Middleware: Require valid session and school access
  const requireAuthAndSchool = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let session = extractAuthSession(req);
    if (!session || !session.isAuthenticated) {
      // Support query parameters for SSE EventSource where custom headers cannot be set
      const qRole = typeof req.query?.role === 'string' ? req.query.role.trim() : '';
      const qSchoolId = typeof req.query?.schoolId === 'string' ? req.query.schoolId.trim() : req.params.schoolId;
      const qUserId = typeof req.query?.userId === 'string' ? req.query.userId.trim() : '';
      const qName = typeof req.query?.name === 'string' ? decodeURIComponent(req.query.name.trim()) : '';

      if (qRole && qSchoolId) {
        session = {
          isAuthenticated: true,
          sessionId: `sse_${Date.now()}`,
          deviceId: 'device-sse',
          userId: qUserId || (qRole === 'school_admin' ? `admin_${qSchoolId}` : 'user-sse'),
          userRole: qRole,
          schoolId: qSchoolId,
          userDisplayName: qName || undefined,
          studentId: qRole === 'student' ? qUserId : undefined,
          teacherId: qRole === 'teacher' || qRole === 'attendance_teacher' ? qUserId : undefined,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };
      } else {
        return res.status(401).json({
          success: false,
          error: 'غير مصرح: يرجى تسجيل الدخول أولاً للوصول إلى الرسائل الخاصة',
        });
      }
    }

    const { schoolId } = req.params;
    if (session.userRole !== 'owner' && session.schoolId && session.schoolId !== schoolId) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: لا تملك صلاحية الوصول لبيانات هذه المدرسة',
      });
    }

    (req as any).user = session;
    next();
  };

  // ----------------------------------------------------
  // REAL-TIME SSE STREAM
  // GET /api/schools/:schoolId/private-conversations/stream
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/private-conversations/stream', requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.flushHeaders?.();

      const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const client: SseClient = {
        id: clientId,
        res,
        schoolId,
        callerId: caller.id,
        candidateIds,
      };
      sseClients.set(clientId, client);

      res.write(`event: connected\ndata: ${JSON.stringify({ clientId, status: 'connected' })}\n\n`);

      const heartbeat = setInterval(() => {
        try {
          res.write(': heartbeat\n\n');
        } catch {
          clearInterval(heartbeat);
          sseClients.delete(clientId);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(clientId);
      });
    } catch (err: any) {
      console.warn('[PrivateMessaging] SSE Stream setup error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'تعذر تشغيل البث المباشر للرسائل' });
      }
    }
  });

  // ----------------------------------------------------
  // 1. GET /api/schools/:schoolId/private-conversations
  // Returns all conversations for the authenticated participant
  // Bounded single-pass query with unread count
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/private-conversations', requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);

      // Fetch conversations involving the caller or any associated identifier
      const convRows = await db
        .select()
        .from(privateConversationsTable)
        .where(
          and(
            eq(privateConversationsTable.schoolId, schoolId),
            or(
              inArray(privateConversationsTable.participant1Id, candidateIds),
              inArray(privateConversationsTable.participant2Id, candidateIds)
            )
          )
        )
        .orderBy(desc(privateConversationsTable.updatedAt));

      if (convRows.length === 0) {
        return res.json({ success: true, conversations: [] });
      }

      // Compute unread counts per conversation in a single grouped query
      const convIds = convRows.map((c) => c.id);
      const pool = createPool();
      const unreadResult = await pool.query(
        `SELECT conversation_id, COUNT(*)::int as unread_count
         FROM private_messages
         WHERE conversation_id = ANY($1::text[])
           AND NOT (sender_id = ANY($2::text[]))
           AND read_at IS NULL
         GROUP BY conversation_id`,
        [convIds, candidateIds]
      );

      const unreadMap = new Map<string, number>();
      unreadResult.rows.forEach((row: any) => {
        unreadMap.set(row.conversation_id, parseInt(row.unread_count || '0', 10));
      });

      // Format response with explicit 'otherParticipant'
      const conversations = convRows.map((c) => {
        const isCallerP1 = candidateIds.includes(c.participant1Id);
        const other = isCallerP1
          ? {
              id: c.participant2Id,
              role: c.participant2Role,
              name: c.participant2Name,
              details: c.participant2Details || '',
            }
          : {
              id: c.participant1Id,
              role: c.participant1Role,
              name: c.participant1Name,
              details: c.participant1Details || '',
            };

        return {
          id: c.id,
          schoolId: c.schoolId,
          otherParticipant: other,
          lastMessage: c.lastMessageBody
            ? {
                body: c.lastMessageBody,
                senderId: c.lastMessageSenderId || '',
                createdAt: c.lastMessageAt || c.updatedAt,
                isFromMe: c.lastMessageSenderId ? candidateIds.includes(c.lastMessageSenderId) : false,
              }
            : null,
          unreadCount: unreadMap.get(c.id) || 0,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      });

      res.json({ success: true, conversations });
    } catch (error: any) {
      console.error('[PrivateMessaging] Error listing conversations:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل تحميل الرسائل الخاصة' });
    }
  });

  // ----------------------------------------------------
  // 2. POST /api/schools/:schoolId/private-conversations
  // Starts a new 1-to-1 conversation
  // Strict role permissions: Student CANNOT start conversations
  // ----------------------------------------------------
  app.post('/api/schools/:schoolId/private-conversations', requireAuthAndSchool, express.json(), async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);

      // 1. Role Authorization check: Student CANNOT initiate conversations
      if (caller.role === 'student' || session.userRole === 'parent' || session.userRole === 'student') {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح: لا يمكن للطالب بدء محادثة جديدة. يمكن الرد فقط على المحادثات القائمة.',
        });
      }

      const { recipientType, recipientId, initialMessage } = req.body || {};

      if (!recipientType || !['student', 'teacher'].includes(recipientType)) {
        return res.status(400).json({
          success: false,
          error: 'نوع المستلم غير صالح (يجب أن يكون طالب أو معلم)',
        });
      }

      if (!recipientId || typeof recipientId !== 'string' || !recipientId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'معرف المستلم مطلوب',
        });
      }

      const cleanMessage = typeof initialMessage === 'string' ? initialMessage.trim() : '';
      if (!cleanMessage) {
        return res.status(400).json({
          success: false,
          error: 'نص الرسالة مطلوب ولا يمكن إرسال رسالة فارغة',
        });
      }

      if (cleanMessage.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'تجاوزت الحد الأقصى لطول الرسالة (2000 حرف)',
        });
      }

      // Teacher / Attendance Teacher can only start conversations with STUDENTS
      if (caller.role === 'teacher' || caller.role === 'attendance_teacher') {
        if (recipientType !== 'student') {
          return res.status(403).json({
            success: false,
            error: 'غير مصرح: يحق للمعلم بدء محادثات مع الطلاب فقط',
          });
        }
      }

      // 2. Recipient lookup & tenant isolation check (must belong to this schoolId)
      let recipient: ResolvedParticipant;
      if (recipientType === 'student') {
        const studentRows = await db
          .select()
          .from(studentsTable)
          .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.id, recipientId.trim())))
          .limit(1);

        if (studentRows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'الطالب المحدد غير موجود في هذه المدرسة',
          });
        }

        recipient = {
          id: studentRows[0].id,
          role: 'student',
          name: studentRows[0].name,
          details: studentRows[0].className || 'طالب بالمدرسة',
        };
      } else {
        // Teacher
        const teacherRows = await db
          .select()
          .from(teachersTable)
          .where(and(eq(teachersTable.schoolId, schoolId), eq(teachersTable.id, recipientId.trim())))
          .limit(1);

        if (teacherRows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'المعلم المحدد غير موجود في هذه المدرسة',
          });
        }

        const t = teacherRows[0];
        const spec = (t.assignedSubjects && (t.assignedSubjects as string[])[0]) || t.specialization || 'معلم';
        recipient = {
          id: t.id,
          role: t.isAttendanceOfficer ? 'attendance_teacher' : 'teacher',
          name: t.name,
          details: spec,
        };
      }

      // 3. Guarantee Conversation Uniqueness (Sort p1, p2 deterministically by ID)
      const participants = [caller, recipient].sort((a, b) => a.id.localeCompare(b.id));
      const p1 = participants[0];
      const p2 = participants[1];
      const convId = `pconv-${schoolId}-${p1.id}_${p2.id}`;
      const nowIso = new Date().toISOString();

      const messageId = `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Execute transaction in PostgreSQL
      const pool = createPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Upsert conversation
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
            p1.details || '',
            p2.id,
            p2.role,
            p2.name,
            p2.details || '',
            cleanMessage,
            caller.id,
            nowIso,
            nowIso,
            nowIso,
          ]
        );

        // Insert message
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
            null, // unread
          ]
        );

        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
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
          isFromMe: true,
        },
      });

      // Broadcast live event to participants
      broadcastPrivateMessage(schoolId, {
        type: 'new_message',
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
          isFromMe: false,
        },
        participantIds: [p1.id, p2.id],
      });
    } catch (error: any) {
      console.error('[PrivateMessaging] Error starting conversation:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل بدء المحادثة' });
    }
  });

  // ----------------------------------------------------
  // 3. GET /api/schools/:schoolId/private-conversations/:conversationId/messages
  // Returns bounded message history (default limit 50, optional keyset cursor 'before')
  // Automatically marks received messages as read
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/private-conversations/:conversationId/messages', requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId, conversationId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);

      // Verify conversation ownership
      const convRows = await db
        .select()
        .from(privateConversationsTable)
        .where(
          and(
            eq(privateConversationsTable.schoolId, schoolId),
            eq(privateConversationsTable.id, conversationId)
          )
        )
        .limit(1);

      if (convRows.length === 0) {
        return res.status(404).json({ success: false, error: 'المحادثة غير موجودة' });
      }

      const conv = convRows[0];
      const isParticipant = candidateIds.includes(conv.participant1Id) || candidateIds.includes(conv.participant2Id);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح: لست طرفاً في هذه المحادثة الخاصة',
        });
      }

      const parsedLimit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 100);
      const beforeCursor = typeof req.query.before === 'string' ? req.query.before.trim() : null;

      const pool = createPool();

      // Fetch messages with keyset pagination
      let msgQuery = `
        SELECT id, conversation_id, school_id, sender_id, sender_role, sender_name, body, created_at, read_at
        FROM private_messages
        WHERE conversation_id = $1 AND school_id = $2
      `;
      const queryParams: any[] = [conversationId, schoolId];

      if (beforeCursor) {
        queryParams.push(beforeCursor);
        msgQuery += ` AND created_at < $${queryParams.length}`;
      }

      queryParams.push(parsedLimit + 1);
      msgQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;

      const msgResult = await pool.query(msgQuery, queryParams);
      const rows = msgResult.rows;

      const hasMore = rows.length > parsedLimit;
      const slicedRows = hasMore ? rows.slice(0, parsedLimit) : rows;

      // Reverse so messages are chronological (oldest to newest)
      slicedRows.reverse();

      const messages = slicedRows.map((r: any) => ({
        id: r.id,
        conversationId: r.conversation_id,
        senderId: r.sender_id,
        senderRole: r.sender_role,
        senderName: r.sender_name,
        body: r.body,
        createdAt: r.created_at,
        readAt: r.read_at,
        isFromMe: candidateIds.includes(r.sender_id),
      }));

      // Automatically mark received unread messages as read in background
      const nowIso = new Date().toISOString();
      pool.query(
        `UPDATE private_messages
         SET read_at = $1
         WHERE conversation_id = $2
           AND NOT (sender_id = ANY($3::text[]))
           AND read_at IS NULL`,
        [nowIso, conversationId, candidateIds]
      ).then((res) => {
        if ((res?.rowCount || 0) > 0) {
          broadcastPrivateMessage(schoolId, {
            type: 'messages_read',
            conversationId,
            readAt: nowIso,
            participantIds: [conv.participant1Id, conv.participant2Id],
          });
        }
      }).catch((e) => console.warn('[PrivateMessaging] Error auto-marking messages read:', e));

      const isCallerP1 = candidateIds.includes(conv.participant1Id);
      const otherParticipant = isCallerP1
        ? {
            id: conv.participant2Id,
            role: conv.participant2Role,
            name: conv.participant2Name,
            details: conv.participant2Details || '',
          }
        : {
            id: conv.participant1Id,
            role: conv.participant1Role,
            name: conv.participant1Name,
            details: conv.participant1Details || '',
          };

      // Calculate start of today UTC for quota tracking
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayStartIso = todayStart.toISOString();

      const quotaResult = await pool.query(
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
          updatedAt: conv.updatedAt,
        },
        messages,
        hasMore,
        oldestCursor: slicedRows.length > 0 ? slicedRows[0].createdAt : null,
        dailyLimit,
        dailySentCount,
        dailyRemaining,
      });
    } catch (error: any) {
      console.error('[PrivateMessaging] Error loading messages:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل تحميل الرسائل' });
    }
  });

  // ----------------------------------------------------
  // 4. POST /api/schools/:schoolId/private-conversations/:conversationId/messages
  // Sends a reply in an existing conversation
  // Verifies participant ownership
  // ----------------------------------------------------
  app.post('/api/schools/:schoolId/private-conversations/:conversationId/messages', requireAuthAndSchool, express.json(), async (req, res) => {
    try {
      const { schoolId, conversationId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);

      // Verify conversation ownership
      const convRows = await db
        .select()
        .from(privateConversationsTable)
        .where(
          and(
            eq(privateConversationsTable.schoolId, schoolId),
            eq(privateConversationsTable.id, conversationId)
          )
        )
        .limit(1);

      if (convRows.length === 0) {
        return res.status(404).json({ success: false, error: 'المحادثة غير موجودة' });
      }

      const conv = convRows[0];
      const isParticipant = candidateIds.includes(conv.participant1Id) || candidateIds.includes(conv.participant2Id);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح: لست طرفاً في هذه المحادثة الخاصة',
        });
      }

      // Determine sender identity mapped to the conversation participant
      const effectiveSenderId = candidateIds.includes(conv.participant1Id)
        ? conv.participant1Id
        : (candidateIds.includes(conv.participant2Id) ? conv.participant2Id : caller.id);
      const effectiveSenderRole = candidateIds.includes(conv.participant1Id)
        ? conv.participant1Role
        : (candidateIds.includes(conv.participant2Id) ? conv.participant2Role : caller.role);
      const effectiveSenderName = caller.name || (candidateIds.includes(conv.participant1Id) ? conv.participant1Name : conv.participant2Name);

      const { body } = req.body || {};
      const cleanBody = typeof body === 'string' ? body.trim() : '';

      if (!cleanBody) {
        return res.status(400).json({
          success: false,
          error: 'نص الرسالة مطلوب ولا يمكن إرسال رسالة فارغة',
        });
      }

      // Check max 8 lines
      const lines = cleanBody.split('\n');
      if (lines.length > 8) {
        return res.status(400).json({
          success: false,
          error: 'الحد الأقصى للرسالة هو 8 أسطر فقط',
        });
      }

      // Check max 55 characters per line (excluding valid URLs which may exceed 55 chars)
      const urlRegex = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
      const overlongLineIndex = lines.findIndex((l) => {
        const nonUrlText = l.replace(urlRegex, '').trim();
        // If line has no URL, check raw length; if it contains URL(s), check remaining text length
        const hasUrl = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/i.test(l);
        if (hasUrl) {
          return nonUrlText.length > 55;
        }
        return l.length > 55;
      });

      if (overlongLineIndex !== -1) {
        return res.status(400).json({
          success: false,
          error: `السطر (${overlongLineIndex + 1}) يتجاوز الحد الأقصى المسموح به (55 حرفاً لكل سطر)`,
        });
      }

      const pool = createPool();
      const client = await pool.connect();
      const messageId = `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      try {
        await client.query('BEGIN');

        // Check daily limit of 55 messages per conversation
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayStartIso = todayStart.toISOString();

        const quotaCheck = await client.query(
          `SELECT COUNT(*)::int AS count FROM private_messages
           WHERE conversation_id = $1 AND (sender_id = ANY($2::text[])) AND created_at >= $3`,
          [conversationId, candidateIds, todayStartIso]
        );
        const dailyCount = Number(quotaCheck.rows[0]?.count || 0);
        if (dailyCount >= 55) {
          await client.query('ROLLBACK');
          return res.status(429).json({
            success: false,
            error: 'لقد استنفدت الحد اليومي المسموح به (55 رسالة يومياً في هذه المحادثة). يرجى المحاولة غداً.',
            dailyLimitReached: true,
          });
        }

        // Insert message
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
            null,
          ]
        );

        // Update conversation last message timestamp & body
        await client.query(
          `UPDATE private_conversations
           SET last_message_body = $1,
               last_message_sender_id = $2,
               last_message_at = $3,
               updated_at = $4
           WHERE id = $5 AND school_id = $6`,
          [cleanBody, effectiveSenderId, nowIso, nowIso, conversationId, schoolId]
        );

        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
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
          isFromMe: true,
        },
      });

      // Broadcast live event to participants
      broadcastPrivateMessage(schoolId, {
        type: 'new_message',
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
          isFromMe: false,
        },
        participantIds: [conv.participant1Id, conv.participant2Id],
      });
    } catch (error: any) {
      console.error('[PrivateMessaging] Error sending message:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل إرسال الرسالة' });
    }
  });

  // ----------------------------------------------------
  // 5. POST /api/schools/:schoolId/private-conversations/:conversationId/read
  // Explicitly marks all incoming messages in a conversation as read
  // ----------------------------------------------------
  app.post('/api/schools/:schoolId/private-conversations/:conversationId/read', requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId, conversationId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);
      const candidateIds = await resolveCandidateParticipantIds(session, caller, schoolId);

      const pool = createPool();
      const nowIso = new Date().toISOString();
      const result = await pool.query(
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
          type: 'messages_read',
          conversationId,
          readAt: nowIso,
        });
      }
    } catch (error: any) {
      console.error('[PrivateMessaging] Error marking read:', error);
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // ----------------------------------------------------
  // 6. GET /api/schools/:schoolId/private-conversations/recipients
  // Search potential recipients by name / class
  // Sanitized: Never exposes nationalId, phone, email, password, etc.
  // ----------------------------------------------------
  app.get('/api/schools/:schoolId/private-conversations/recipients', requireAuthAndSchool, async (req, res) => {
    try {
      const { schoolId } = req.params;
      const session = (req as any).user as AuthenticatedUserSession;
      const caller = resolveCallerParticipant(session, schoolId);

      // Student cannot search or start conversations
      if (caller.role === 'student' || session.userRole === 'parent' || session.userRole === 'student') {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح للطلاب بالبحث عن مستلمين لبدء محادثات',
        });
      }

      const type = (String(req.query.type || 'student')).toLowerCase();
      const q = String(req.query.q || '').trim();

      // Teacher / Attendance Teacher can only search students
      if ((caller.role === 'teacher' || caller.role === 'attendance_teacher') && type !== 'student') {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح: يحق للمعلم مراسلة الطلاب فقط',
        });
      }

      const pool = createPool();

      if (type === 'teacher') {
        // School Admin searching teachers
        let query = `
          SELECT id, name, specialization, assigned_subjects, is_attendance_officer
          FROM teachers
          WHERE school_id = $1
        `;
        const params: any[] = [schoolId];

        if (q) {
          params.push(`%${q}%`);
          query += ` AND (name ILIKE $2 OR specialization ILIKE $2)`;
        }

        query += ` ORDER BY name ASC LIMIT 25`;
        const result = await pool.query(query, params);

        const recipients = result.rows.map((row: any) => {
          let spec = row.specialization || '';
          if (row.is_attendance_officer) {
            spec = 'مسؤول الحضور والغياب';
          } else if (Array.isArray(row.assigned_subjects) && row.assigned_subjects.length > 0) {
            spec = `معلم ${row.assigned_subjects[0]}`;
          }
          return {
            id: row.id,
            role: row.is_attendance_officer ? 'attendance_teacher' : 'teacher',
            name: row.name,
            details: spec || 'معلم بالمدرسة',
          };
        });

        return res.json({ success: true, recipients });
      }

      // Search students (default)
      let query = `
        SELECT id, name, class_name
        FROM students
        WHERE school_id = $1
      `;
      const params: any[] = [schoolId];

      if (q) {
        params.push(`%${q}%`);
        query += ` AND (name ILIKE $2 OR class_name ILIKE $2)`;
      }

      query += ` ORDER BY name ASC LIMIT 25`;
      const result = await pool.query(query, params);

      const recipients = result.rows.map((row: any) => ({
        id: row.id,
        role: 'student',
        name: row.name,
        details: row.class_name || 'طالب بالمدرسة',
      }));

      res.json({ success: true, recipients });
    } catch (error: any) {
      console.error('[PrivateMessaging] Error searching recipients:', error);
      res.status(500).json({ success: false, error: error?.message || 'فشل البحث عن المستلمين' });
    }
  });
}
