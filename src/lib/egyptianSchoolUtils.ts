export interface EgyptianClassStructure {
  stage?: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال';
  grade: number; // 1, 2, 3, 4, 5, 6
  class_number: number; // 1, 2, 3...
}

export const EGYPTIAN_STAGES = [
  'المرحلة الابتدائية',
  'المرحلة الإعدادية',
  'المرحلة الثانوية',
  'رياض الأطفال',
] as const;

export const EGYPTIAN_GRADES_BY_STAGE: Record<string, { gradeNum: number; fullGradeName: string; shortGradeName: string }[]> = {
  'المرحلة الابتدائية': [
    { gradeNum: 1, fullGradeName: 'الصف الأول الابتدائي', shortGradeName: 'الأول الابتدائي' },
    { gradeNum: 2, fullGradeName: 'الصف الثاني الابتدائي', shortGradeName: 'الثاني الابتدائي' },
    { gradeNum: 3, fullGradeName: 'الصف الثالث الابتدائي', shortGradeName: 'الثالث الابتدائي' },
    { gradeNum: 4, fullGradeName: 'الصف الرابع الابتدائي', shortGradeName: 'الرابع الابتدائي' },
    { gradeNum: 5, fullGradeName: 'الصف الخامس الابتدائي', shortGradeName: 'الخامس الابتدائي' },
    { gradeNum: 6, fullGradeName: 'الصف السادس الابتدائي', shortGradeName: 'السادس الابتدائي' },
  ],
  'المرحلة الإعدادية': [
    { gradeNum: 1, fullGradeName: 'الصف الأول الإعدادي', shortGradeName: 'الأول الإعدادي' },
    { gradeNum: 2, fullGradeName: 'الصف الثاني الإعدادي', shortGradeName: 'الثاني الإعدادي' },
    { gradeNum: 3, fullGradeName: 'الصف الثالث الإعدادي', shortGradeName: 'الثالث الإعدادي' },
  ],
  'المرحلة الثانوية': [
    { gradeNum: 1, fullGradeName: 'الصف الأول الثانوي', shortGradeName: 'الأول الثانوي' },
    { gradeNum: 2, fullGradeName: 'الصف الثاني الثانوي', shortGradeName: 'الثاني الثانوي' },
    { gradeNum: 3, fullGradeName: 'الصف الثالث الثانوي', shortGradeName: 'الثالث الثانوي' },
  ],
  'رياض الأطفال': [
    { gradeNum: 1, fullGradeName: 'روضة أولى (KG1)', shortGradeName: 'روضة أولى' },
    { gradeNum: 2, fullGradeName: 'روضة ثانية (KG2)', shortGradeName: 'روضة ثانية' },
  ],
};

export const ALL_EGYPTIAN_GRADES = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

/**
 * Structure of a parsed / mapped Egyptian class
 */
export interface MappedClassInfo {
  className: string;      // e.g. "1/1 ابتدائي", "2/1 اعدادي", "1/1 ثانوي"
  gradeLevel: string;     // e.g. "الصف الأول الابتدائي", "الصف الثاني الإعدادي", "الصف الأول الثانوي"
  stage: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال';
  grade: number;          // 1, 2, 3, 4, 5, 6
  class_number: number;   // 1, 2, 3...
  stageSuffix: string;    // "ابتدائي" | "اعدادي" | "ثانوي" | "رياض أطفال"
}

/**
 * Maps raw sheet names (windows/tabs from Excel) or class identifiers into
 * standardized Egyptian class names, gradeLevel (الصف), and educational stage.
 *
 * Rules:
 * - Ends with 'ب' or contains 'ابتدائي':
 *     "الاول ب"  -> "1/1 ابتدائي", الصف الأول الابتدائي
 *     "الثاني ب" -> "2/1 ابتدائي", الصف الثاني الابتدائي
 *     "الثالث ب" -> "3/1 ابتدائي", الصف الثالث الابتدائي
 *     "الرابع ب" -> "4/1 ابتدائي", الصف الرابع الابتدائي
 *     "الخامس ب" -> "5/1 ابتدائي", الصف الخامس الابتدائي
 *     "السادس ب" -> "6/1 ابتدائي", الصف السادس الابتدائي
 * - Ends with 'ع' or contains 'اعدادي':
 *     "الاول ع"  -> "1/1 اعدادي", الصف الأول الإعدادي
 *     "الثاني ع" -> "2/1 اعدادي", الصف الثاني الإعدادي
 *     "الثالث ع" -> "3/1 اعدادي", الصف الثالث الإعدادي
 * - Ends with 'ثانوي' or contains 'ثانوي':
 *     "الاول ثانوي"  -> "1/1 ثانوي", الصف الأول الثانوي
 *     "الثاني ثانوي" -> "2/1 ثانوي", الصف الثاني الثانوي
 *     "الثالث ثانوي" -> "3/1 ثانوي", الصف الثالث الثانوي
 */
export function mapEgyptianSheetName(rawSheetName?: string): MappedClassInfo {
  if (!rawSheetName || !rawSheetName.trim()) {
    return {
      className: '1/1 ابتدائي',
      gradeLevel: 'الصف الأول الابتدائي',
      stage: 'المرحلة الابتدائية',
      grade: 1,
      class_number: 1,
      stageSuffix: 'ابتدائي',
    };
  }

  const raw = rawSheetName.trim();
  // Normalize text (strip tashkeel, zero-width chars, normalize alef, yaa, taa marbouta)
  const norm = raw
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    .replace(/\u0649/g, 'ي')
    .replace(/\u0629/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // 1. Detect Stage
  let stage: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال' = 'المرحلة الابتدائية';
  let stageSuffix = 'ابتدائي';
  let stageGradeWord = 'الابتدائي';

  // Check Secondary first
  if (norm.includes('ثانوي') || norm.includes('ثانوى') || norm.includes('secondary') || norm.includes('sec')) {
    stage = 'المرحلة الثانوية';
    stageSuffix = 'ثانوي';
    stageGradeWord = 'الثانوي';
  }
  // Check Preparatory (ع)
  else if (
    norm.endsWith(' ع') ||
    norm.endsWith('-ع') ||
    norm.endsWith('_ع') ||
    norm.endsWith('/ع') ||
    norm === 'ع' ||
    /(^|\s)ع($|\s)/.test(norm) ||
    norm.includes('اعدادي') ||
    norm.includes('إعدادي') ||
    norm.includes('prep')
  ) {
    stage = 'المرحلة الإعدادية';
    stageSuffix = 'اعدادي';
    stageGradeWord = 'الإعدادي';
  }
  // Check Kindergarten
  else if (norm.includes('روضه') || norm.includes('روضة') || norm.includes('kg')) {
    stage = 'رياض الأطفال';
    stageSuffix = 'رياض أطفال';
    stageGradeWord = 'رياض الأطفال';
  }
  // Check Primary (ب or ابتدائي or default)
  else if (
    norm.endsWith(' ب') ||
    norm.endsWith('-ب') ||
    norm.endsWith('_ب') ||
    norm.endsWith('/ب') ||
    norm === 'ب' ||
    /(^|\s)ب($|\s)/.test(norm) ||
    norm.includes('ابتدائي') ||
    norm.includes('ابتدائى') ||
    norm.includes('primary')
  ) {
    stage = 'المرحلة الابتدائية';
    stageSuffix = 'ابتدائي';
    stageGradeWord = 'الابتدائي';
  }

  // 2. Detect Grade (1 to 6)
  let grade = 1;
  const slashMatch = norm.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) {
    grade = parseInt(slashMatch[1], 10) || 1;
  } else if (norm.includes('سادس') || norm.includes('سادسه') || norm.includes(' 6') || norm.startsWith('6') || norm.includes('primary 6')) {
    grade = 6;
  } else if (norm.includes('خامس') || norm.includes('خامسه') || norm.includes(' 5') || norm.startsWith('5') || norm.includes('primary 5')) {
    grade = 5;
  } else if (norm.includes('رابع') || norm.includes('رابعه') || norm.includes(' 4') || norm.startsWith('4') || norm.includes('primary 4')) {
    grade = 4;
  } else if (norm.includes('ثالث') || norm.includes('ثالثه') || norm.includes(' 3') || norm.startsWith('3') || norm.includes('primary 3') || norm.includes('prep 3') || norm.includes('sec 3')) {
    grade = 3;
  } else if (norm.includes('ثاني') || norm.includes('ثانيه') || norm.includes(' 2') || norm.startsWith('2') || norm.includes('primary 2') || norm.includes('prep 2') || norm.includes('sec 2')) {
    grade = 2;
  } else if (norm.includes('اول') || norm.includes('اولى') || norm.includes(' 1') || norm.startsWith('1') || norm.includes('primary 1') || norm.includes('prep 1') || norm.includes('sec 1')) {
    grade = 1;
  }

  // 3. Detect Class Number (1, 2...)
  let class_number = 1;
  if (slashMatch) {
    class_number = parseInt(slashMatch[2], 10) || 1;
  } else {
    // Check if there is an explicit section number, e.g. "فصل 2" or " 2 "
    const subMatch = norm.match(/فصل\s*(\d+)/);
    if (subMatch) {
      class_number = parseInt(subMatch[1], 10) || 1;
    }
  }

  // Cap grade limits
  if (stage === 'المرحلة الإعدادية' && grade > 3) grade = 3;
  if (stage === 'المرحلة الثانوية' && grade > 3) grade = 3;
  if (stage === 'رياض الأطفال' && grade > 2) grade = 2;
  if (stage === 'المرحلة الابتدائية' && grade > 6) grade = 6;

  const gradeArabicNames: Record<number, string> = {
    1: 'الأول',
    2: 'الثاني',
    3: 'الثالث',
    4: 'الرابع',
    5: 'الخامس',
    6: 'السادس',
  };

  const gradeLevel =
    stage === 'رياض الأطفال'
      ? grade === 1
        ? 'روضة أولى (KG1)'
        : 'روضة ثانية (KG2)'
      : `الصف ${gradeArabicNames[grade] || 'الأول'} ${stageGradeWord}`;

  const className = `${grade}/${class_number} ${stageSuffix}`;

  return {
    className,
    gradeLevel,
    stage,
    grade,
    class_number,
    stageSuffix,
  };
}

/**
 * Automatically detects the grade level (الصف) from a class name (الفصل) for any student.
 * Example:
 * - "1/1 ابتدائي" -> "الصف الأول الابتدائي"
 * - "2/1 ابتدائي" -> "الصف الثاني الابتدائي"
 * - "1/1 اعدادي"  -> "الصف الأول الإعدادي"
 * - "1/1 ثانوي"   -> "الصف الأول الثانوي"
 */
export function getGradeLevelFromClassName(className?: string): string {
  if (!className || !className.trim() || className === 'غير محدد') return 'المرحلة الدراسية';
  const mapped = mapEgyptianSheetName(className);
  return mapped.gradeLevel || 'المرحلة الدراسية';
}

/**
 * Returns standardized Egyptian class name (e.g. "1/1 ابتدائي", "2/1 اعدادي", "3/1 ثانوي")
 * from any raw class name, sheet name, or grade level.
 */
export function getStandardClassName(inputNameOrGrade?: string, fallbackGrade?: string): string {
  const target = inputNameOrGrade || fallbackGrade;
  if (!target || !target.trim() || target === 'غير محدد' || target === 'الصف العام') {
    if (fallbackGrade && fallbackGrade !== 'المرحلة الدراسية') {
      return mapEgyptianSheetName(fallbackGrade).className;
    }
    return '1/1 ابتدائي';
  }
  return mapEgyptianSheetName(target).className;
}

/**
 * Derives the canonical Egyptian Grade Level (الصف) from a 14-digit Egyptian National ID
 * based on standard school admission age rules in Egypt (as of 1 October 2025).
 */
export function deriveGradeFromNationalId(nationalId?: string | null): string {
  if (!nationalId) return 'المرحلة الدراسية';
  const clean = String(nationalId).replace(/\D/g, '');
  if (!/^[23]\d{13}$/.test(clean)) return 'المرحلة الدراسية';

  const century = clean[0] === '3' ? 2000 : 1900;
  const year = century + parseInt(clean.substring(1, 3), 10);
  const month = parseInt(clean.substring(3, 5), 10);
  const day = parseInt(clean.substring(5, 7), 10);

  const refYear = 2025;
  const refMonth = 10;
  let age = refYear - year;
  if (month > refMonth || (month === refMonth && day > 1)) {
    age--;
  }

  if (age <= 4) return 'روضة أولى (KG1)';
  if (age === 5) return 'روضة ثانية (KG2)';
  if (age === 6) return 'الصف الأول الابتدائي';
  if (age === 7) return 'الصف الثاني الابتدائي';
  if (age === 8) return 'الصف الثالث الابتدائي';
  if (age === 9) return 'الصف الرابع الابتدائي';
  if (age === 10) return 'الصف الخامس الابتدائي';
  if (age === 11) return 'الصف السادس الابتدائي';
  if (age === 12) return 'الصف الأول الإعدادي';
  if (age === 13) return 'الصف الثاني الإعدادي';
  if (age === 14) return 'الصف الثالث الإعدادي';
  if (age === 15) return 'الصف الأول الثانوي';
  if (age === 16) return 'الصف الثاني الثانوي';
  return 'الصف الثالث الثانوي';
}

/**
 * Format displayed class identifier automatically using `grade/class_number` (e.g. 1/1, 1/2, 2/3)
 */
export function formatEgyptianClassName(grade: number, class_number: number): string {
  if (!grade || !class_number) return '1/1';
  return `${grade}/${class_number}`;
}

/**
 * Normalizes any legacy or unformatted class string into Egyptian class format (e.g. 1/1 ابتدائي)
 */
export function normalizeClassName(rawClassName?: string, gradeLevel?: string): string {
  if (!rawClassName) return '1/1 ابتدائي';
  const str = rawClassName.trim();

  // If already standard e.g. "1/1 ابتدائي", "1/1 اعدادي", "1/1 ثانوي"
  if (/^\d+\/\d+\s*(ابتدائي|اعدادي|ثانوي|رياض أطفال)$/.test(str)) {
    return str;
  }

  const mapped = mapEgyptianSheetName(str);
  return mapped.className;
}

/**
 * Returns short grade name for student profile display (e.g., "الصف الأول الإعدادي" -> "الأول الإعدادي")
 */
export function getShortGradeName(fullGradeName?: string): string {
  if (!fullGradeName) return '';
  return fullGradeName.replace(/^الصف\s+/, '').trim();
}

/**
 * Automatically calculates stage, grade, and class_number from gradeLevel and class identifier
 */
export function parseEgyptianClassDetails(gradeLevel?: string, className?: string): {
  stage: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال';
  grade: number;
  class_number: number;
  formattedClassName: string;
  gradeName: string;
} {
  const mapped = mapEgyptianSheetName(className || gradeLevel || '');

  // If explicit gradeLevel was provided and is not default placeholder, prefer it
  let finalGradeName = gradeLevel && gradeLevel !== 'المرحلة الدراسية' ? gradeLevel : mapped.gradeLevel;
  let finalStage = mapped.stage;

  if (gradeLevel && gradeLevel !== 'المرحلة الدراسية') {
    if (gradeLevel.includes('الإعدادي') || gradeLevel.includes('إعدادي')) {
      finalStage = 'المرحلة الإعدادية';
    } else if (gradeLevel.includes('الثانوي') || gradeLevel.includes('ثانوي')) {
      finalStage = 'المرحلة الثانوية';
    } else if (gradeLevel.includes('روضة') || gradeLevel.includes('KG')) {
      finalStage = 'رياض الأطفال';
    } else if (gradeLevel.includes('الابتدائي') || gradeLevel.includes('ابتدائي')) {
      finalStage = 'المرحلة الابتدائية';
    }
  }

  return {
    stage: finalStage,
    grade: mapped.grade,
    class_number: mapped.class_number,
    formattedClassName: mapped.className,
    gradeName: finalGradeName,
  };
}

/**
 * Calculates a numerical rank for sorting educational stages and grades:
 * KG (10-20) -> الابتدائي (100-150) -> الإعدادي (200-220) -> الثانوي (300-320)
 */
export function getGradeRank(gradeLevel?: string, className?: string): number {
  const normGrade = (gradeLevel || '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    .replace(/\u0649/g, 'ي')
    .replace(/\u0629/g, 'ه')
    .toLowerCase();

  // 1. Prioritize explicit gradeLevel string if available
  if (normGrade) {
    if (normGrade.includes('kg1') || normGrade.includes('روضه اولي')) return 10;
    if (normGrade.includes('kg2') || normGrade.includes('روضه ثانيه') || normGrade.includes('رياض')) return 20;

    if (normGrade.includes('ابتدائي') || normGrade.includes('ابتدائى') || normGrade.includes('primary')) {
      if (normGrade.includes('سادس') || normGrade.includes('سادسه') || normGrade.includes(' 6') || normGrade.startsWith('6')) return 150;
      if (normGrade.includes('خامس') || normGrade.includes('خامسه') || normGrade.includes(' 5') || normGrade.startsWith('5')) return 140;
      if (normGrade.includes('رابع') || normGrade.includes('رابعه') || normGrade.includes(' 4') || normGrade.startsWith('4')) return 130;
      if (normGrade.includes('ثالث') || normGrade.includes('ثالثه') || normGrade.includes(' 3') || normGrade.startsWith('3')) return 120;
      if (normGrade.includes('ثاني') || normGrade.includes('ثانيه') || normGrade.includes(' 2') || normGrade.startsWith('2')) return 110;
      if (normGrade.includes('اول') || normGrade.includes('اولي') || normGrade.includes(' 1') || normGrade.startsWith('1')) return 100;
      return 100;
    }

    if (normGrade.includes('اعدادي') || normGrade.includes('prep')) {
      if (normGrade.includes('ثالث') || normGrade.includes('ثالثه') || normGrade.includes(' 3')) return 220;
      if (normGrade.includes('ثاني') || normGrade.includes('ثانيه') || normGrade.includes(' 2')) return 210;
      if (normGrade.includes('اول') || normGrade.includes('اولي') || normGrade.includes(' 1')) return 200;
      return 200;
    }

    if (normGrade.includes('ثانوي') || normGrade.includes('sec')) {
      if (normGrade.includes('ثالث') || normGrade.includes('ثالثه') || normGrade.includes(' 3')) return 320;
      if (normGrade.includes('ثاني') || normGrade.includes('ثانيه') || normGrade.includes(' 2')) return 310;
      if (normGrade.includes('اول') || normGrade.includes('اولي') || normGrade.includes(' 1')) return 300;
      return 300;
    }
  }

  // 2. Fallback to className if gradeLevel was ambiguous
  const normClass = (className || '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    .replace(/\u0649/g, 'ي')
    .replace(/\u0629/g, 'ه')
    .toLowerCase();

  if (normClass.includes('kg1')) return 10;
  if (normClass.includes('kg2')) return 20;

  if (normClass.includes('ثانوي')) {
    if (normClass.includes('3') || normClass.includes('ثالث')) return 320;
    if (normClass.includes('2') || normClass.includes('ثاني')) return 310;
    if (normClass.includes('1') || normClass.includes('اول')) return 300;
    return 300;
  }
  if (normClass.includes('اعدادي')) {
    if (normClass.includes('3') || normClass.includes('ثالث')) return 220;
    if (normClass.includes('2') || normClass.includes('ثاني')) return 210;
    if (normClass.includes('1') || normClass.includes('اول')) return 200;
    return 200;
  }
  if (normClass.includes('ابتدائي')) {
    if (normClass.includes('6') || normClass.includes('سادس')) return 150;
    if (normClass.includes('5') || normClass.includes('خامس')) return 140;
    if (normClass.includes('4') || normClass.includes('رابع')) return 130;
    if (normClass.includes('3') || normClass.includes('ثالث')) return 120;
    if (normClass.includes('2') || normClass.includes('ثاني')) return 110;
    if (normClass.includes('1') || normClass.includes('اول')) return 100;
    return 100;
  }

  const details = parseEgyptianClassDetails(gradeLevel, className);
  let baseRank = 100;
  if (details.stage === 'رياض الأطفال') baseRank = 10;
  else if (details.stage === 'المرحلة الابتدائية') baseRank = 100;
  else if (details.stage === 'المرحلة الإعدادية') baseRank = 200;
  else if (details.stage === 'المرحلة الثانوية') baseRank = 300;

  return baseRank + (details.grade * 10);
}

/**
 * Compares two classes for strict ascending order:
 * 1. Educational Stage & Grade: رياض أطفال -> أول ابتدائي -> ثاني ابتدائي -> ... -> أول إعدادي -> أول ثانوي
 * 2. Class within grade: 1/1 -> 2/1 -> 3/1 ... or 1/1 -> 1/2 -> 1/3 (ascending natural order)
 */
export function compareClassesAscending(
  a: { gradeLevel?: string; className?: string },
  b: { gradeLevel?: string; className?: string }
): number {
  const rankA = getGradeRank(a.gradeLevel, a.className);
  const rankB = getGradeRank(b.gradeLevel, b.className);
  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const nameA = (a.className || '').trim();
  const nameB = (b.className || '').trim();

  const matchA = nameA.match(/(\d+)\s*\/\s*(\d+)/);
  const matchB = nameB.match(/(\d+)\s*\/\s*(\d+)/);

  if (matchA && matchB) {
    const a1 = parseInt(matchA[1], 10);
    const a2 = parseInt(matchA[2], 10);
    const b1 = parseInt(matchB[1], 10);
    const b2 = parseInt(matchB[2], 10);
    if (a1 !== b1) return a1 - b1;
    if (a2 !== b2) return a2 - b2;
  }

  return nameA.localeCompare(nameB, 'ar', { numeric: true, sensitivity: 'base' });
}

/**
 * Sorts students strictly by:
 * 1. Educational Stage & Grade (الصف والمرحلة الدراسية)
 * 2. Class / Section (الفصل)
 * 3. Student Name (اسم الطالب أبا عن جد)
 */
export function compareStudentsByGradeClassAndName(
  a: { name: string; className?: string; gradeLevel?: string },
  b: { name: string; className?: string; gradeLevel?: string }
): number {
  const classCmp = compareClassesAscending(a, b);
  if (classCmp !== 0) {
    return classCmp;
  }

  return (a?.name || '').localeCompare(b?.name || '', 'ar');
}

