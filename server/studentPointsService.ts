import { db } from '../src/db/index.ts';
import { sql, eq, and, inArray } from 'drizzle-orm';
import { studentsTable, studentBadgesTable, badgesTable, attendanceTable, behaviorTable } from '../src/db/schema.ts';

export interface StudentPointsBreakdown {
  badges: {
    rareCount: number;
    epicCount: number;
    legendaryCount: number;
    mythicalCount: number;
    unknownCount: number;
    totalBadgeCount: number;
    points: number;
  };
  attendance: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    otherCount: number;
    totalDays: number;
    points: number;
  };
  behavior: {
    positiveCount: number;
    negativeCount: number;
    totalCount: number;
    positivePoints: number;
    negativePoints: number;
    points: number;
  };
}

export interface StudentPointsResult {
  success: boolean;
  schoolId: string;
  studentId: string;
  studentName?: string;
  totalPoints: number;
  badgePoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  breakdown: StudentPointsBreakdown;
  calculatedAt: string;
}

export interface LeaderboardStudentItem {
  rank: number;
  studentId: string;
  name: string;
  className?: string;
  points: number;
  avatar_layout_uid?: string;
}

export interface CurrentStudentRanking {
  rank: number;
  points: number;
  totalStudents: number;
  isTop10: boolean;
  isTop100: boolean;
  isFirstPlace: boolean;
  nextRank?: number;
  pointsNeeded?: number;
  nextStudentPoints?: number;
}

export interface LeaderboardSchoolSummary {
  totalStudents: number;
  topScore: number;
  averageTopPoints: number;
  rankedCount: number;
}

export interface LeaderboardResult {
  success: boolean;
  schoolId: string;
  leaderboard: LeaderboardStudentItem[];
  currentStudent?: CurrentStudentRanking;
  schoolSummary: LeaderboardSchoolSummary;
  generatedAt: string;
}

/**
 * Authoritative server-side function to calculate a student's total points dynamically from PostgreSQL.
 *
 * Rules:
 * BADGES (case-insensitive):
 *  - rare = 10
 *  - epic = 15
 *  - legendary = 25
 *  - mythical = 50
 *  - other/unknown = 0
 *
 * ATTENDANCE (persisted status):
 *  - حاضر = 3
 *  - متأخر = 1
 *  - غائب = 0
 *  - other = 0
 *
 * Student Points = SUM(valid student badge rarity points) + SUM(student attendance status points)
 */
export async function getStudentPoints(
  schoolId: string,
  studentId: string
): Promise<StudentPointsResult> {
  const cleanSchoolId = (schoolId || '').trim();
  const cleanStudentId = (studentId || '').trim();

  if (!cleanSchoolId || !cleanStudentId) {
    throw new Error('schoolId and studentId are required');
  }

  // 1. Verify student exists in this tenant (school)
  const studentRows = await db
    .select({
      id: studentsTable.id,
      name: studentsTable.name,
      schoolId: studentsTable.schoolId,
    })
    .from(studentsTable)
    .where(
      and(
        eq(studentsTable.id, cleanStudentId),
        eq(studentsTable.schoolId, cleanSchoolId)
      )
    )
    .limit(1);

  if (!studentRows || studentRows.length === 0) {
    throw new Error('الطالب غير موجود في هذه المدرسة');
  }

  const student = studentRows[0];

  // 2. Perform SQL aggregation on student badges, attendance, and behavior in parallel
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
    `),
  ]);

  const badgeRow: any = badgeAggResult.rows?.[0] || {};
  const attRow: any = attAggResult.rows?.[0] || {};
  const behRow: any = behAggResult.rows?.[0] || {};

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
        points: badgePoints,
      },
      attendance: {
        presentCount: Number(attRow.present_count || 0),
        lateCount: Number(attRow.late_count || 0),
        absentCount: Number(attRow.absent_count || 0),
        otherCount: Number(attRow.other_count || 0),
        totalDays: Number(attRow.total_days || 0),
        points: attendancePoints,
      },
      behavior: {
        positiveCount: Number(behRow.positive_count || 0),
        negativeCount: Number(behRow.negative_count || 0),
        totalCount: Number(behRow.total_behavior_count || 0),
        positivePoints: Number(behRow.positive_points || 0),
        negativePoints: Number(behRow.negative_points || 0),
        points: behaviorPoints,
      },
    },
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Authoritative server-side function to calculate the Top 100 Student Leaderboard for a school.
 * Uses a single, zero-N+1 PostgreSQL query with window ranking functions.
 * Deterministic tie-breaking: Total Points DESC -> Name ASC -> Student ID ASC.
 */
export async function getSchoolLeaderboard(
  schoolId: string,
  currentStudentId?: string
): Promise<LeaderboardResult> {
  const cleanSchoolId = (schoolId || '').trim();
  const cleanStudentId = (currentStudentId || '').trim();

  if (!cleanSchoolId) {
    throw new Error('schoolId is required');
  }

  // Single SQL CTE Pipeline for high performance & scalability (O(1) database trip)
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
      WHERE student_id = ${cleanStudentId ? cleanStudentId : '__NONE__'}
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

  const rows: any[] = result.rows || [];

  const topRows = rows.filter((r) => r.row_type === 'top');
  const currentRow = rows.find((r) => r.row_type === 'current');
  const nextRankRow = rows.find((r) => r.row_type === 'next_rank');

  const totalStudents = Number(rows[0]?.total_school_students || 0);

  // Dynamic avatar validation: Auto-revoke rank-based themes if student no longer qualifies
  const expiredStudentIdsToReset: string[] = [];

  const sanitizeAvatarLayout = (studentId: string, rank: number, points: number, rawAvatar?: string | null): string => {
    const avatar = rawAvatar ? String(rawAvatar) : 'theme_default_blue';
    if (avatar === 'theme_top10_aurora') {
      // Must have rank 1..10 AND points > 0. If points are 0 or rank > 10, theme is un-gained!
      if (rank <= 0 || rank > 10 || points <= 0) {
        expiredStudentIdsToReset.push(studentId);
        return 'theme_default_blue';
      }
    } else if (avatar === 'theme_orange_gold') {
      // Must have rank 1..100 AND points > 0. If points are 0 or rank > 100, theme is un-gained!
      if (rank <= 0 || rank > 100 || points <= 0) {
        expiredStudentIdsToReset.push(studentId);
        return 'theme_default_blue';
      }
    }
    return avatar;
  };

  const leaderboard: LeaderboardStudentItem[] = topRows.map((r) => {
    const rRank = Number(r.rank);
    const rPoints = Number(r.total_points || 0);
    const sId = String(r.student_id);
    return {
      rank: rRank,
      studentId: sId,
      name: String(r.student_name),
      className: r.class_name ? String(r.class_name) : undefined,
      points: rPoints,
      avatar_layout_uid: sanitizeAvatarLayout(sId, rRank, rPoints, r.avatar_layout_uid),
    };
  });

  // Background self-healing update in PostgreSQL if any student has an expired honor theme
  if (expiredStudentIdsToReset.length > 0) {
    const uniqueIds = Array.from(new Set(expiredStudentIdsToReset));
    db.update(studentsTable)
      .set({ avatar_layout_uid: 'theme_default_blue' })
      .where(and(eq(studentsTable.schoolId, cleanSchoolId), inArray(studentsTable.id, uniqueIds)))
      .catch((err) => console.error('[Leaderboard Auto-Revoke] Error resetting expired student themes:', err));
  }

  let currentStudentRanking: CurrentStudentRanking | undefined = undefined;

  if (cleanStudentId && currentRow) {
    const curRank = Number(currentRow.rank);
    const curPoints = Number(currentRow.total_points || 0);
    // Student must have at least 1 point earned to qualify for honors (0 points is never top 10 or first place)
    const isFirstPlace = curRank === 1 && curPoints > 0;
    const isTop10 = curRank <= 10 && curPoints > 0;
    const isTop100 = curRank <= 100 && curPoints > 0;

    let nextRank: number | undefined = undefined;
    let pointsNeeded: number | undefined = undefined;
    let nextStudentPoints: number | undefined = undefined;

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
      nextStudentPoints,
    };
  }

  const topScore = leaderboard.length > 0 ? leaderboard[0].points : 0;
  const totalTopPoints = leaderboard.reduce((acc, curr) => acc + curr.points, 0);
  const averageTopPoints = leaderboard.length > 0 ? Math.round(totalTopPoints / leaderboard.length) : 0;

  const schoolSummary: LeaderboardSchoolSummary = {
    totalStudents,
    topScore,
    averageTopPoints,
    rankedCount: leaderboard.length,
  };

  return {
    success: true,
    schoolId: cleanSchoolId,
    leaderboard,
    currentStudent: currentStudentRanking,
    schoolSummary,
    generatedAt: new Date().toISOString(),
  };
}

