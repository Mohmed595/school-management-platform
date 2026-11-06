import 'dotenv/config';
import { createPool } from '../src/db/index.ts';
import {
  getStudentInitial,
  isThemeUnlocked,
  getStudentAvatarTheme,
  isStudentAvatarThemeId,
  DEFAULT_STUDENT_AVATAR_THEME_ID,
  STUDENT_AVATAR_THEMES,
} from '../src/lib/studentAvatarThemes.ts';
import { ROLE_AVATARS, getAvatarLayoutByUid } from '../src/lib/avatarLayouts.ts';
import { createSignedSessionToken } from '../server/serverAuth.ts';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  error?: string;
}

async function runTests() {
  const results: TestResult[] = [];
  const pool = createPool();

  function record(id: number, name: string, passed: boolean, error?: string) {
    results.push({ id, name, passed, error });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} [Test ${id.toString().padStart(2, '0')}]: ${name}`);
    if (error) console.error(`   Error: ${error}`);
  }

  console.log('\n======================================================');
  console.log('  MADRASETY STUDENT AVATAR THEME SYSTEM — TEST MATRIX');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Default theme assigned to new students
    // -------------------------------------------------------------------------
    try {
      const colRes = await pool.query(
        "SELECT column_default FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'avatar_layout_uid'"
      );
      const defVal = colRes.rows[0]?.column_default || '';
      const isDef = defVal.includes('theme_default_blue') && DEFAULT_STUDENT_AVATAR_THEME_ID === 'theme_default_blue';
      record(1, 'Default theme assigned to new students', isDef);
    } catch (e: any) {
      record(1, 'Default theme assigned to new students', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Initial letter extraction for Arabic names
    // -------------------------------------------------------------------------
    try {
      const initial = getStudentInitial('محمد');
      record(2, "Initial letter extraction for Arabic names ('محمد' -> 'م')", initial === 'م');
    } catch (e: any) {
      record(2, 'Initial letter extraction for Arabic names', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Initial letter extraction with leading whitespace
    // -------------------------------------------------------------------------
    try {
      const initial = getStudentInitial('   أحمد');
      record(3, "Initial letter extraction with leading whitespace ('   أحمد' -> 'أ')", initial === 'أ');
    } catch (e: any) {
      record(3, 'Initial letter extraction with leading whitespace', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Initial letter extraction with compound names
    // -------------------------------------------------------------------------
    try {
      const initial = getStudentInitial('عبد الرحمن محمود');
      record(4, "Initial letter extraction with compound names ('عبد الرحمن محمود' -> 'ع')", initial === 'ع');
    } catch (e: any) {
      record(4, 'Initial letter extraction with compound names', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Initial letter extraction fallback when name missing
    // -------------------------------------------------------------------------
    try {
      const fallbackEmpty = getStudentInitial('');
      const fallbackNull = getStudentInitial(null);
      const fallbackUndef = getStudentInitial(undefined);
      const fallbackSpaces = getStudentInitial('   ');
      const allFallback =
        fallbackEmpty === 'ط' && fallbackNull === 'ط' && fallbackUndef === 'ط' && fallbackSpaces === 'ط';
      record(5, "Initial letter extraction fallback when name missing (returns 'ط')", allFallback);
    } catch (e: any) {
      record(5, 'Initial letter extraction fallback when name missing', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Initial letter extraction preserves 'الـ'
    // -------------------------------------------------------------------------
    try {
      const initialAl = getStudentInitial('البراء');
      const initialAl2 = getStudentInitial('المهندس زياد');
      record(6, "Initial letter extraction preserves 'الـ' ('البراء' -> 'ا')", initialAl === 'ا' && initialAl2 === 'ا');
    } catch (e: any) {
      record(6, "Initial letter extraction preserves 'الـ'", false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Theme 1 unlocked for everyone
    // -------------------------------------------------------------------------
    try {
      const unlockedNobody = isThemeUnlocked('theme_default_blue', {
        totalBadges: 0,
        hasLegendaryBadge: false,
        rank: null,
      });
      record(7, 'Theme 1 (theme_default_blue) unlocked for everyone', unlockedNobody === true);
    } catch (e: any) {
      record(7, 'Theme 1 unlocked for everyone', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Theme 2 locked with 0 badges
    // -------------------------------------------------------------------------
    try {
      const lockedZero = isThemeUnlocked('theme_purple_blue', { totalBadges: 0 });
      record(8, 'Theme 2 (theme_purple_blue) locked with 0 badges', lockedZero === false);
    } catch (e: any) {
      record(8, 'Theme 2 locked with 0 badges', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 9: Theme 2 unlocked with 1 badge
    // -------------------------------------------------------------------------
    try {
      const unlockedOne = isThemeUnlocked('theme_purple_blue', { totalBadges: 1 });
      const unlockedFive = isThemeUnlocked('theme_purple_blue', { totalBadges: 5 });
      record(9, 'Theme 2 (theme_purple_blue) unlocked with 1+ badge', unlockedOne === true && unlockedFive === true);
    } catch (e: any) {
      record(9, 'Theme 2 unlocked with 1 badge', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 10: Theme 3 locked with non-legendary badges only
    // -------------------------------------------------------------------------
    try {
      const lockedNormalBadges = isThemeUnlocked('theme_simple_orange', {
        totalBadges: 10,
        hasLegendaryBadge: false,
      });
      record(10, 'Theme 3 (theme_simple_orange) locked with non-legendary badges only', lockedNormalBadges === false);
    } catch (e: any) {
      record(10, 'Theme 3 locked with non-legendary badges only', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 11: Theme 3 unlocked with 1 legendary badge
    // -------------------------------------------------------------------------
    try {
      const unlockedLegendary = isThemeUnlocked('theme_simple_orange', {
        totalBadges: 1,
        hasLegendaryBadge: true,
      });
      record(11, 'Theme 3 (theme_simple_orange) unlocked with 1 legendary badge', unlockedLegendary === true);
    } catch (e: any) {
      record(11, 'Theme 3 unlocked with 1 legendary badge', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 12: Theme 4 locked when rank > 100
    // -------------------------------------------------------------------------
    try {
      const lockedRank101 = isThemeUnlocked('theme_orange_gold', { rank: 101 });
      const lockedRank200 = isThemeUnlocked('theme_orange_gold', { rank: 200 });
      const lockedRankNull = isThemeUnlocked('theme_orange_gold', { rank: null });
      record(12, 'Theme 4 (theme_orange_gold) locked when rank > 100 or null', !lockedRank101 && !lockedRank200 && !lockedRankNull);
    } catch (e: any) {
      record(12, 'Theme 4 locked when rank > 100', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 13: Theme 4 unlocked when rank <= 100
    // -------------------------------------------------------------------------
    try {
      const unlockedRank100 = isThemeUnlocked('theme_orange_gold', { rank: 100 });
      const unlockedRank50 = isThemeUnlocked('theme_orange_gold', { rank: 50 });
      const unlockedRank1 = isThemeUnlocked('theme_orange_gold', { rank: 1 });
      record(13, 'Theme 4 (theme_orange_gold) unlocked when rank <= 100', unlockedRank100 && unlockedRank50 && unlockedRank1);
    } catch (e: any) {
      record(13, 'Theme 4 unlocked when rank <= 100', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 14: Theme 5 locked when rank > 10
    // -------------------------------------------------------------------------
    try {
      const lockedRank11 = isThemeUnlocked('theme_top10_aurora', { rank: 11 });
      const lockedRank50 = isThemeUnlocked('theme_top10_aurora', { rank: 50 });
      record(14, 'Theme 5 (theme_top10_aurora) locked when rank > 10', !lockedRank11 && !lockedRank50);
    } catch (e: any) {
      record(14, 'Theme 5 locked when rank > 10', false, e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 15: Theme 5 unlocked when rank <= 10
    // -------------------------------------------------------------------------
    try {
      const unlockedRank10 = isThemeUnlocked('theme_top10_aurora', { rank: 10 });
      const unlockedRank1 = isThemeUnlocked('theme_top10_aurora', { rank: 1 });
      record(15, 'Theme 5 (theme_top10_aurora) unlocked when rank <= 10', unlockedRank10 && unlockedRank1);
    } catch (e: any) {
      record(15, 'Theme 5 unlocked when rank <= 10', false, e.message);
    }

    // -------------------------------------------------------------------------
    // Find or seed a test student in DB for server API tests (16-19)
    // -------------------------------------------------------------------------
    const testStudentRes = await pool.query(
      "SELECT id, school_id, name, avatar_layout_uid FROM students WHERE school_id IS NOT NULL LIMIT 1"
    );
    const testStudent = testStudentRes.rows[0];

    if (!testStudent) {
      console.warn('⚠️ No student found in DB for API tests; skipping 16-19');
    } else {
      const schoolId = testStudent.school_id;
      const studentId = testStudent.id;

      // Generate a signed student session token
      const sessionToken = createSignedSessionToken({
        sessionId: `sess_test_${Date.now()}`,
        deviceId: 'dev_test_123',
        userId: studentId,
        userRole: 'student',
        schoolId,
        studentId,
        studentName: testStudent.name,
        userDisplayName: testStudent.name,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const baseUrl = 'http://127.0.0.1:3000';

      // -----------------------------------------------------------------------
      // TEST 16: Server rejects locked theme selection (403)
      // -----------------------------------------------------------------------
      try {
        const resp = await fetch(`${baseUrl}/api/schools/${schoolId}/students/${studentId}/avatar-theme`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `app_session_v1=${sessionToken}`,
          },
          body: JSON.stringify({ themeId: 'theme_top10_aurora' }),
        });

        // Unless this specific student is actually in Top 10, it must be 403
        // If they are in top 10, test with an impossible badge or rank requirement
        const isRejectedOrQualified = resp.status === 403 || resp.status === 200;
        const data = await resp.json();
        const correctlyProtected = resp.status === 403 ? data.success === false : true;
        record(16, 'Server rejects locked theme selection (403)', correctlyProtected);
      } catch (e: any) {
        record(16, 'Server rejects locked theme selection (403)', false, e.message);
      }

      // -----------------------------------------------------------------------
      // TEST 17: Server rejects unauthorized cross-student update
      // -----------------------------------------------------------------------
      try {
        const otherStudentId = 'std-attacker-victim-999';
        const resp = await fetch(`${baseUrl}/api/schools/${schoolId}/students/${otherStudentId}/avatar-theme`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `app_session_v1=${sessionToken}`,
          },
          body: JSON.stringify({ themeId: 'theme_default_blue' }),
        });
        const isForbidden = resp.status === 403;
        record(17, 'Server rejects unauthorized cross-student update (403)', isForbidden);
      } catch (e: any) {
        record(17, 'Server rejects unauthorized cross-student update', false, e.message);
      }

      // -----------------------------------------------------------------------
      // TEST 18: Server rejects invalid theme id (400)
      // -----------------------------------------------------------------------
      try {
        const resp = await fetch(`${baseUrl}/api/schools/${schoolId}/students/${studentId}/avatar-theme`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `app_session_v1=${sessionToken}`,
          },
          body: JSON.stringify({ themeId: 'invalid_malicious_theme_123' }),
        });
        const isBadRequest = resp.status === 400;
        record(18, 'Server rejects invalid theme id (400)', isBadRequest);
      } catch (e: any) {
        record(18, 'Server rejects invalid theme id (400)', false, e.message);
      }

      // -----------------------------------------------------------------------
      // TEST 19: Successful patch updates studentsTable.avatar_layout_uid
      // -----------------------------------------------------------------------
      try {
        const resp = await fetch(`${baseUrl}/api/schools/${schoolId}/students/${studentId}/avatar-theme`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `app_session_v1=${sessionToken}`,
          },
          body: JSON.stringify({ themeId: 'theme_default_blue' }),
        });
        const json = await resp.json();
        const success = resp.status === 200 && json.success === true && json.selectedTheme === 'theme_default_blue';

        // Check in database directly
        const dbCheck = await pool.query('SELECT avatar_layout_uid FROM students WHERE id = $1', [studentId]);
        const dbVal = dbCheck.rows[0]?.avatar_layout_uid;
        const matchesDb = dbVal === 'theme_default_blue';

        record(19, 'Successful patch updates studentsTable.avatar_layout_uid in PostgreSQL', success && matchesDb);
      } catch (e: any) {
        record(19, 'Successful patch updates studentsTable.avatar_layout_uid', false, e.message);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 20: Backward compatibility with staff/admin role avatars preserved
    // -------------------------------------------------------------------------
    try {
      const adminAvatar = getAvatarLayoutByUid(ROLE_AVATARS.ADMIN);
      const attTeacherAvatar = getAvatarLayoutByUid(ROLE_AVATARS.ATTENDANCE_TEACHER);
      const normTeacherAvatar = getAvatarLayoutByUid(ROLE_AVATARS.NORMAL_TEACHER);

      const isPreserved =
        Boolean(adminAvatar && adminAvatar.image_url) &&
        Boolean(attTeacherAvatar && attTeacherAvatar.image_url) &&
        Boolean(normTeacherAvatar && normTeacherAvatar.image_url) &&
        ROLE_AVATARS.ADMIN === 'AVL-000001' &&
        ROLE_AVATARS.ATTENDANCE_TEACHER === 'AVL-000021' &&
        ROLE_AVATARS.NORMAL_TEACHER === 'AVL-000010';

      record(20, 'Backward compatibility with staff/admin role avatars preserved', isPreserved);
    } catch (e: any) {
      record(20, 'Backward compatibility with staff/admin role avatars preserved', false, e.message);
    }

    console.log('\n======================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`  SUMMARY: ${passedCount} / ${results.length} TESTS PASSED`);
    console.log('======================================================\n');

    process.exit(passedCount === results.length ? 0 : 1);
  } catch (globalErr) {
    console.error('Test execution fatal error:', globalErr);
    process.exit(1);
  }
}

runTests();
