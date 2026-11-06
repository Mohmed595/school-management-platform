export type StudentAvatarThemeId =
  | 'theme_default_blue'
  | 'theme_purple_blue'
  | 'theme_simple_orange'
  | 'theme_orange_gold'
  | 'theme_top10_aurora';

export interface StudentAvatarTheme {
  id: StudentAvatarThemeId;
  name: string;
  description: string;
  requirementText: string;
  requirementShort: string;
  solidFallbackColor: string;
  gradientClass: string;
  borderClass: string;
  glowClass: string;
  badgeAccentClass: string;
}

export const STUDENT_AVATAR_THEMES: Record<StudentAvatarThemeId, StudentAvatarTheme> = {
  theme_default_blue: {
    id: 'theme_default_blue',
    name: 'الأزرق الافتراضي',
    description: 'السمة الأساسية المعتمدة لجميع الطلاب في منصة مدرستي.',
    requirementText: 'متاحة للجميع دائماً',
    requirementShort: 'الافتراضية للجميع',
    solidFallbackColor: '#2563eb', // bg-blue-600
    gradientClass: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
    borderClass: 'border border-blue-400/30',
    glowClass: 'shadow-md shadow-blue-500/20',
    badgeAccentClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  },
  theme_purple_blue: {
    id: 'theme_purple_blue',
    name: 'البنفسجي الفاخر',
    description: 'سمة فاخرة تمنح للطلاب المتميزين الحاصلين على وسام مدرسي واحد على الأقل.',
    requirementText: 'احصل على وسام واحد على الأقل',
    requirementShort: 'وسام واحد على الأقل',
    solidFallbackColor: '#7c3aed', // bg-purple-600
    gradientClass: 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600',
    borderClass: 'border border-purple-400/40',
    glowClass: 'shadow-md shadow-purple-500/25',
    badgeAccentClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  },
  theme_simple_orange: {
    id: 'theme_simple_orange',
    name: 'البرتقالي الأسطوري',
    description: 'سمة أسطورية متوهجة تمنح للطلاب الحاصلين على وسام برتبة أسطوري (Legendary).',
    requirementText: 'احصل على وسام أسطوري',
    requirementShort: 'وسام أسطوري',
    solidFallbackColor: '#ea580c', // bg-orange-600
    gradientClass: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600',
    borderClass: 'border border-orange-400/40',
    glowClass: 'shadow-md shadow-orange-500/25',
    badgeAccentClass: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  },
  theme_orange_gold: {
    id: 'theme_orange_gold',
    name: 'الذهبي والأصفر الملكي',
    description: 'سمة ملكية براقة مخصصة لنخبة أفضل 100 طالب بنقاط إيجابية على مستوى المدرسة.',
    requirementText: 'كن ضمن أفضل 100 في لوحة الشرف (مع نقاط أكبر من 0)',
    requirementShort: 'أفضل 100 طالب (نقاط > 0)',
    solidFallbackColor: '#d97706', // bg-amber-600
    gradientClass: 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600',
    borderClass: 'border border-amber-300/60',
    glowClass: 'shadow-lg shadow-amber-500/30',
    badgeAccentClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
  theme_top10_aurora: {
    id: 'theme_top10_aurora',
    name: 'شفق الأوائل',
    description: 'أعلى سمة تميز في المدرسة، تمنح حصرياً للعشرة الأوائل (Top 10) بنقاط إيجابية على مستوى المدرسة.',
    requirementText: 'كن ضمن أفضل 10 في لوحة الشرف (مع نقاط أكبر من 0)',
    requirementShort: 'العشرة الأوائل (نقاط > 0)',
    solidFallbackColor: '#0284c7', // bg-sky-600
    gradientClass: 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600',
    borderClass: 'border border-cyan-300/70',
    glowClass: 'shadow-xl shadow-cyan-500/40',
    badgeAccentClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  },
};

export const ALL_STUDENT_AVATAR_THEMES: StudentAvatarTheme[] = [
  STUDENT_AVATAR_THEMES.theme_default_blue,
  STUDENT_AVATAR_THEMES.theme_purple_blue,
  STUDENT_AVATAR_THEMES.theme_simple_orange,
  STUDENT_AVATAR_THEMES.theme_orange_gold,
  STUDENT_AVATAR_THEMES.theme_top10_aurora,
];

export const DEFAULT_STUDENT_AVATAR_THEME_ID: StudentAvatarThemeId = 'theme_default_blue';

/**
 * Checks whether a given string is a valid StudentAvatarThemeId
 */
export function isStudentAvatarThemeId(themeId?: string | null): themeId is StudentAvatarThemeId {
  if (!themeId) return false;
  return Object.prototype.hasOwnProperty.call(STUDENT_AVATAR_THEMES, themeId);
}

/**
 * Resolves a StudentAvatarTheme by ID with safe fallback to theme_default_blue
 */
export function getStudentAvatarTheme(themeId?: string | null): StudentAvatarTheme {
  if (isStudentAvatarThemeId(themeId)) {
    return STUDENT_AVATAR_THEMES[themeId];
  }
  return STUDENT_AVATAR_THEMES[DEFAULT_STUDENT_AVATAR_THEME_ID];
}

/**
 * Extracts the first meaningful visible character from the student's name
 * Rules:
 * - Trims leading/trailing whitespace
 * - Supports Arabic names accurately
 * - Do NOT remove "الـ"
 * - Returns "ط" as fallback for missing or empty names
 */
export function getStudentInitial(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return 'ط';
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return 'ط';
  }

  // Use Array.from to respect full Unicode graphemes/codepoints
  const chars = Array.from(trimmed);
  for (const ch of chars) {
    // Exclude zero-width, formatting, or invisible whitespace characters
    if (ch.trim() && ch !== '\u200B' && ch !== '\u200C' && ch !== '\u200D' && ch !== '\uFEFF') {
      return ch;
    }
  }

  return 'ط';
}

export interface StudentThemeEligibilityContext {
  totalBadges?: number;
  hasLegendaryBadge?: boolean;
  rank?: number | null;
  points?: number | null;
}

/**
 * Helper to check whether a specific theme is unlocked for a student
 * based on current authoritative context (total badges, legendary badges, current rank, points)
 * 
 * Rules:
 * - Default theme: always unlocked.
 * - Purple theme: requires >= 1 badge.
 * - Orange legendary theme: requires at least 1 legendary badge.
 * - Top 100 Royal Gold: requires rank <= 100 AND points > 0.
 * - Top 10 Aurora: requires rank <= 10 AND points > 0.
 * 
 * Any student with 0 points (e.g. freshly created school) cannot unlock rank-based themes.
 * If a student drops out of Top 10 / Top 100, the theme is dynamically locked (un-gained).
 */
export function isThemeUnlocked(
  themeId: StudentAvatarThemeId,
  context: StudentThemeEligibilityContext
): boolean {
  const points = typeof context.points === 'number' ? context.points : 0;
  const rank = typeof context.rank === 'number' ? context.rank : null;

  switch (themeId) {
    case 'theme_default_blue':
      return true; // Always available to everyone

    case 'theme_purple_blue':
      return typeof context.totalBadges === 'number' && context.totalBadges >= 1;

    case 'theme_simple_orange':
      return context.hasLegendaryBadge === true;

    case 'theme_orange_gold':
      // Must be ranked <= 100 AND have at least 1 point earned (0 points does not qualify)
      return rank !== null && rank > 0 && rank <= 100 && points > 0;

    case 'theme_top10_aurora':
      // Must be ranked in Top 10 AND have at least 1 point earned (0 points does not qualify)
      return rank !== null && rank > 0 && rank <= 10 && points > 0;

    default:
      return false;
  }
}

/**
 * Resolves the effective theme for a student given their current context.
 * If the student had an honor theme equipped but is no longer eligible (un-gained),
 * this falls back safely to 'theme_default_blue'.
 */
export function getEffectiveStudentTheme(
  themeId: string | null | undefined,
  context: StudentThemeEligibilityContext
): StudentAvatarThemeId {
  if (!themeId || !isStudentAvatarThemeId(themeId)) {
    return DEFAULT_STUDENT_AVATAR_THEME_ID;
  }
  if (!isThemeUnlocked(themeId, context)) {
    return DEFAULT_STUDENT_AVATAR_THEME_ID;
  }
  return themeId;
}
