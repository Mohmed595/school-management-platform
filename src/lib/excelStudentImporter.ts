import * as XLSX from 'xlsx';
import { mapEgyptianSheetName } from './egyptianSchoolUtils.ts';

export interface ParsedStudentRow {
  fileName: string;
  sheetName: string;
  age: string;            // Canonical student cohort/age (الصف الأول الإعدادي، الثاني الثانوي، الصف الأول الابتدائي...)
  gradeLevel: string;     // Synced cohort/grade field for backward compatibility
  stage?: string;         // Educational stage (المرحلة الابتدائية، الإعدادية، الثانوية، رياض الأطفال)
  grade?: number;         // Grade number 1-6
  className?: string;     // Optional for backward compatibility
  class_number?: number;
  rowNumber: number;      // 1-indexed in Excel sheet
  name: string;
  ministryCode: string;
  nationalId: string;
  birthDate?: string;     // ISO format YYYY-MM-DD
  isValid: boolean;
  isDuplicate?: boolean;
  errorReason?: string;
}

export interface ParsedClassBatch {
  fileName: string;
  sheetName: string;
  age?: string;           // Detected student cohort/age (e.g. الصف الأول الإعدادي)
  gradeLevel?: string;    // Synced cohort
  stage?: string;
  grade?: number;
  className?: string;     // Optional for backward compatibility
  class_number?: number;
  students: ParsedStudentRow[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  headerError?: string;
}

export interface ImportValidationSummary {
  totalFiles: number;
  totalSheets: number;
  totalClasses?: number;
  totalGrades: number;    // Count of distinct age/grade levels (الأول الإعدادي، الثاني الثانوي...)
  totalAges: number;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
}

/**
 * Normalizes Arabic text for tolerant matching:
 * - Strips diacritics / tashkeel & tatweel
 * - Normalizes Unicode variations of alef (أ, إ, آ, ٱ -> ا)
 * - Normalizes alef maksura (ى -> ي)
 * - Normalizes taa marbouta (ة -> ه)
 * - Removes zero-width characters and normalizes spaces
 */
export function normalizeArabicText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // tashkeel & tatweel
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // zero-width and non-breaking spaces
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا') // alef variants
    .replace(/\u0649/g, 'ي') // alef maksura -> yaa
    .replace(/\u0629/g, 'ه') // taa marbouta -> haa
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Identifies the column role based on normalized Arabic aliases:
 * - ministryCode (كود التلميذ, كود الوزارة, كود الطالب, كود الطالب/التلميذ, الكود...)
 * - name (اسم التلميذ, الاسم, اسم الطالب, اسم التلميذ / الاسم...)
 * - nationalId (الرقم القومى, الرقم القومي, الرقم القومى للطالب, الرقم القومي للطالب...)
 * - age / gradeLevel (السن, الصف, الصف الدراسي, المرحلة, السنة الدراسية, الفرقة, الدفعة, العمر...)
 * - birthDate (تاريخ الميلاد, الميلاد, تاريخ ميلاد الطالب, birth date, dob...)
 * - unknown (any extra column)
 */
export function identifyHeaderColumn(
  rawHeader: any
): 'ministryCode' | 'name' | 'nationalId' | 'gradeLevel' | 'age' | 'className' | 'birthDate' | 'unknown' {
  const norm = normalizeArabicText(rawHeader);
  if (!norm) return 'unknown';

  // 1. National ID aliases
  if (
    norm.includes('قومي') ||
    norm.includes('قومى') ||
    norm.includes('شهاده الميلاد') ||
    norm.includes('بطاقه') ||
    norm.includes('الرقم القومي') ||
    norm.includes('الرقم القومى')
  ) {
    return 'nationalId';
  }

  // 2. Ministry / Student Code aliases
  if (
    norm.includes('كود') ||
    norm.includes('الكود') ||
    norm.includes('رقم الجلوس') ||
    norm.includes('رقم الطالب') ||
    norm.includes('رقم التلميذ')
  ) {
    return 'ministryCode';
  }

  // 3. Student Name aliases
  if (
    norm === 'الاسم' ||
    norm === 'اسم' ||
    norm.startsWith('اسم ') ||
    norm.includes('اسم التلميذ') ||
    norm.includes('اسم الطالب') ||
    norm.includes('الاسم بالكامل') ||
    norm.includes('اسم التلميذ / الاسم') ||
    norm.includes('اسم الطالب / الاسم')
  ) {
    return 'name';
  }

  // 4. Section / Class / Classroom aliases (الفصل، الشعبة، رقم الفصل، اسم الفصل...)
  if (
    norm === 'الفصل' ||
    norm === 'فصل' ||
    norm === 'الشعبة' ||
    norm === 'الشعبه' ||
    norm === 'شعبة' ||
    norm === 'شعبه' ||
    norm === 'class' ||
    norm === 'section' ||
    norm === 'classroom' ||
    norm.includes('اسم الفصل') ||
    norm.includes('رقم الفصل') ||
    norm.startsWith('فصل ') ||
    (norm.startsWith('الفصل ') && !norm.includes('الدراسي') && !norm.includes('الدراسية'))
  ) {
    return 'className';
  }

  // 5. Age / Grade Level / Cohort aliases (السن، العمر، الصف، الصف الدراسي، المرحلة، السنة الدراسية، الفرقة، الدفعة...)
  if (
    norm === 'السن' ||
    norm === 'العمر' ||
    norm === 'سن' ||
    norm === 'سنه' ||
    norm === 'سنة' ||
    norm === 'سنوات' ||
    norm === 'السنوات' ||
    norm === 'age' ||
    norm === 'years' ||
    norm === 'الصف' ||
    norm === 'صف' ||
    norm === 'المرحله' ||
    norm === 'المرحلة' ||
    norm === 'grade' ||
    norm === 'gradelevel' ||
    norm === 'level' ||
    norm === 'stage' ||
    norm === 'cohort' ||
    norm.startsWith('الصف ') ||
    norm.includes('الصف الدراسي') ||
    norm.includes('المرحله الدراسيه') ||
    norm.includes('المرحلة الدراسية') ||
    norm.includes('السنه الدراسيه') ||
    norm.includes('السنة الدراسية') ||
    norm.includes('الفرقه') ||
    norm.includes('الفرقة') ||
    norm.includes('الدفعه') ||
    norm.includes('الدفعة') ||
    norm.includes('المستوي') ||
    norm.includes('المستوى') ||
    norm.startsWith('السن ') ||
    norm.startsWith('عمر ') ||
    norm.startsWith('سن ') ||
    norm.includes('سن الطالب') ||
    norm.includes('سن التلميذ') ||
    norm.includes('عمر الطالب') ||
    norm.includes('عمر التلميذ') ||
    norm.includes('السن في') ||
    norm.includes('السن فى') ||
    norm.includes('السن اول') ||
    norm.includes('السن بالسنوات') ||
    norm.includes('السن بالسنين') ||
    norm.includes('العمر بالسنوات') ||
    norm.includes('student age')
  ) {
    return 'age';
  }

  // 5. Birth Date aliases (تاريخ الميلاد...)
  if (
    norm.includes('تاريخ الميلاد') ||
    norm.includes('تاريخ ميلاد') ||
    norm === 'الميلاد' ||
    norm === 'تاريخ' ||
    norm === 'dob' ||
    norm.includes('birth')
  ) {
    return 'birthDate';
  }

  return 'unknown';
}

/**
 * Safely extracts cell content as a clean string representation,
 * strictly preventing scientific notation (e.g. 3.18102E+13) or floating-point rounding.
 * Also converts Eastern Arabic / Indic numerals (٠-٩) to standard ASCII digits (0-9).
 */
export function extractCellSafeString(cellValue: any): string {
  if (cellValue === null || cellValue === undefined) return '';

  let str = '';
  if (typeof cellValue === 'number') {
    if (Number.isFinite(cellValue)) {
      str = BigInt(Math.round(cellValue)).toString();
    } else {
      str = String(cellValue);
    }
  } else if (typeof cellValue === 'bigint') {
    str = cellValue.toString();
  } else {
    str = String(cellValue).trim();
    if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
      const num = Number(str);
      if (Number.isFinite(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    }
  }

  // Convert Eastern Arabic / Indic digits (٠-٩) to standard digits
  const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(arabicIndic[i], 'g'), String(i));
  }

  return str.replace(/[\s\-_]/g, '').trim();
}

/**
 * Tries parsing date from various common Excel/Arabic formats
 */
function tryParseDate(str: string): Date | null {
  if (!str) return null;
  // Format: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-/]/).map((p) => parseInt(p, 10));
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!isNaN(d.getTime())) return d;
  }
  // Format: DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
    const parts = str.split(/[-/]/).map((p) => parseInt(p, 10));
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1990 && d.getFullYear() < 2030) {
    return d;
  }
  return null;
}

/**
 * Maps chronological age in years to canonical Egyptian school age / grade cohort
 */
export function mapNumericAgeToCohort(ageYears: number): {
  age: string;
  stage: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال';
  grade: number;
} {
  const rounded = Math.round(ageYears);
  if (rounded <= 4) {
    return { age: 'روضة أولى (KG1)', stage: 'رياض الأطفال', grade: 1 };
  } else if (rounded === 5) {
    return { age: 'روضة ثانية (KG2)', stage: 'رياض الأطفال', grade: 2 };
  } else if (rounded === 6) {
    return { age: 'الصف الأول الابتدائي', stage: 'المرحلة الابتدائية', grade: 1 };
  } else if (rounded === 7) {
    return { age: 'الصف الثاني الابتدائي', stage: 'المرحلة الابتدائية', grade: 2 };
  } else if (rounded === 8) {
    return { age: 'الصف الثالث الابتدائي', stage: 'المرحلة الابتدائية', grade: 3 };
  } else if (rounded === 9) {
    return { age: 'الصف الرابع الابتدائي', stage: 'المرحلة الابتدائية', grade: 4 };
  } else if (rounded === 10) {
    return { age: 'الصف الخامس الابتدائي', stage: 'المرحلة الابتدائية', grade: 5 };
  } else if (rounded === 11) {
    return { age: 'الصف السادس الابتدائي', stage: 'المرحلة الابتدائية', grade: 6 };
  } else if (rounded === 12) {
    return { age: 'الصف الأول الإعدادي', stage: 'المرحلة الإعدادية', grade: 1 };
  } else if (rounded === 13) {
    return { age: 'الصف الثاني الإعدادي', stage: 'المرحلة الإعدادية', grade: 2 };
  } else if (rounded === 14) {
    return { age: 'الصف الثالث الإعدادي', stage: 'المرحلة الإعدادية', grade: 3 };
  } else if (rounded === 15) {
    return { age: 'الصف الأول الثانوي', stage: 'المرحلة الثانوية', grade: 1 };
  } else if (rounded === 16) {
    return { age: 'الصف الثاني الثانوي', stage: 'المرحلة الثانوية', grade: 2 };
  } else {
    return { age: 'الصف الثالث الثانوي', stage: 'المرحلة الثانوية', grade: 3 };
  }
}

/**
 * Maps textual representation of grade/age cohort into canonical Egyptian format
 * (e.g. "الاول الاعدادي", "الأول الإعدادي", "أولى إعدادي", "1 ع", "الثاني الثانوي"...)
 */
export function mapTextToCohort(text: string): {
  age: string;
  stage: 'المرحلة الابتدائية' | 'المرحلة الإعدادية' | 'المرحلة الثانوية' | 'رياض الأطفال';
  grade: number;
} | null {
  if (!text || !text.trim()) return null;
  const norm = normalizeArabicText(text);

  // Secondary
  if (norm.includes('ثانوي') || norm.includes('ثانوى') || norm.includes('sec')) {
    if (norm.includes('ثالث') || norm.includes('تالت') || norm.includes('3')) {
      return { age: 'الصف الثالث الثانوي', stage: 'المرحلة الثانوية', grade: 3 };
    }
    if (norm.includes('ثاني') || norm.includes('تاني') || norm.includes('2')) {
      return { age: 'الصف الثاني الثانوي', stage: 'المرحلة الثانوية', grade: 2 };
    }
    return { age: 'الصف الأول الثانوي', stage: 'المرحلة الثانوية', grade: 1 };
  }
  if (norm.endsWith('3 ث') || norm.endsWith('3ث') || norm === '3 ث') {
    return { age: 'الصف الثالث الثانوي', stage: 'المرحلة الثانوية', grade: 3 };
  }
  if (norm.endsWith('2 ث') || norm.endsWith('2ث') || norm === '2 ث') {
    return { age: 'الصف الثاني الثانوي', stage: 'المرحلة الثانوية', grade: 2 };
  }
  if (norm.endsWith('1 ث') || norm.endsWith('1ث') || norm === '1 ث') {
    return { age: 'الصف الأول الثانوي', stage: 'المرحلة الثانوية', grade: 1 };
  }

  // Prep (إعدادي)
  if (norm.includes('اعدادي') || norm.includes('إعدادي') || norm.includes('prep') || norm.endsWith(' ع') || norm.endsWith('-ع') || norm.endsWith('_ع') || norm === 'ع') {
    if (norm.includes('ثالث') || norm.includes('تالت') || norm.includes('3')) {
      return { age: 'الصف الثالث الإعدادي', stage: 'المرحلة الإعدادية', grade: 3 };
    }
    if (norm.includes('ثاني') || norm.includes('تاني') || norm.includes('2')) {
      return { age: 'الصف الثاني الإعدادي', stage: 'المرحلة الإعدادية', grade: 2 };
    }
    return { age: 'الصف الأول الإعدادي', stage: 'المرحلة الإعدادية', grade: 1 };
  }
  if (norm.endsWith('3 ع') || norm.endsWith('3ع') || norm === '3 ع') {
    return { age: 'الصف الثالث الإعدادي', stage: 'المرحلة الإعدادية', grade: 3 };
  }
  if (norm.endsWith('2 ع') || norm.endsWith('2ع') || norm === '2 ع') {
    return { age: 'الصف الثاني الإعدادي', stage: 'المرحلة الإعدادية', grade: 2 };
  }
  if (norm.endsWith('1 ع') || norm.endsWith('1ع') || norm === '1 ع') {
    return { age: 'الصف الأول الإعدادي', stage: 'المرحلة الإعدادية', grade: 1 };
  }

  // Kindergarten
  if (norm.includes('روضه') || norm.includes('روضة') || norm.includes('kg')) {
    if (norm.includes('ثاني') || norm.includes('تاني') || norm.includes('2')) {
      return { age: 'روضة ثانية (KG2)', stage: 'رياض الأطفال', grade: 2 };
    }
    return { age: 'روضة أولى (KG1)', stage: 'رياض الأطفال', grade: 1 };
  }

  // Primary (ابتدائي)
  if (norm.includes('ابتدائي') || norm.includes('ابتدائى') || norm.includes('primary') || norm.endsWith(' ب') || norm.endsWith('-ب') || norm.endsWith('_ب') || norm === 'ب') {
    if (norm.includes('سادس') || norm.includes('6')) {
      return { age: 'الصف السادس الابتدائي', stage: 'المرحلة الابتدائية', grade: 6 };
    }
    if (norm.includes('خامس') || norm.includes('5')) {
      return { age: 'الصف الخامس الابتدائي', stage: 'المرحلة الابتدائية', grade: 5 };
    }
    if (norm.includes('رابع') || norm.includes('4')) {
      return { age: 'الصف الرابع الابتدائي', stage: 'المرحلة الابتدائية', grade: 4 };
    }
    if (norm.includes('ثالث') || norm.includes('تالت') || norm.includes('3')) {
      return { age: 'الصف الثالث الابتدائي', stage: 'المرحلة الابتدائية', grade: 3 };
    }
    if (norm.includes('ثاني') || norm.includes('تاني') || norm.includes('2')) {
      return { age: 'الصف الثاني الابتدائي', stage: 'المرحلة الابتدائية', grade: 2 };
    }
    return { age: 'الصف الأول الابتدائي', stage: 'المرحلة الابتدائية', grade: 1 };
  }

  // Direct numbers / suffixes
  if (norm.endsWith('6 ب') || norm.endsWith('6ب')) {
    return { age: 'الصف السادس الابتدائي', stage: 'المرحلة الابتدائية', grade: 6 };
  }
  if (norm.endsWith('5 ب') || norm.endsWith('5ب')) {
    return { age: 'الصف الخامس الابتدائي', stage: 'المرحلة الابتدائية', grade: 5 };
  }
  if (norm.endsWith('4 ب') || norm.endsWith('4ب')) {
    return { age: 'الصف الرابع الابتدائي', stage: 'المرحلة الابتدائية', grade: 4 };
  }
  if (norm.endsWith('3 ب') || norm.endsWith('3ب')) {
    return { age: 'الصف الثالث الابتدائي', stage: 'المرحلة الابتدائية', grade: 3 };
  }
  if (norm.endsWith('2 ب') || norm.endsWith('2ب')) {
    return { age: 'الصف الثاني الابتدائي', stage: 'المرحلة الابتدائية', grade: 2 };
  }
  if (norm.endsWith('1 ب') || norm.endsWith('1ب')) {
    return { age: 'الصف الأول الابتدائي', stage: 'المرحلة الابتدائية', grade: 1 };
  }

  return null;
}

/**
 * Robust age normalization:
 * Evaluates source in strict priority order:
 * 1. Direct Age in workbook cell (Cohort text e.g. "الأول الإعدادي", "الثاني الثانوي", or numeric age / text age)
 * 2. Direct Birth Date in workbook cell
 * 3. Derives age from 14-digit Egyptian National ID
 * 4. Falls back to worksheet name cohort if available
 * Returns consistent canonical age (e.g. "الصف الأول الإعدادي", "الصف الثاني الثانوي", "الصف الأول الابتدائي")
 * suitable for filtering, grouping, sorting, attendance, grades, and reports.
 * If age cannot be determined, returns error without silently inventing values.
 */
export function normalizeStudentAge(options: {
  rawAge?: any;
  rawBirthDate?: any;
  nationalId?: string;
  sheetName?: string;
  referenceDate?: Date;
}): {
  age?: string;
  gradeLevel?: string;
  stage?: string;
  grade?: number;
  birthDate?: string;
  error?: string;
} {
  const refDate = options.referenceDate || new Date();
  const currentYear = refDate.getFullYear();

  // 1. Direct Age in Workbook cell (Priority 1)
  if (options.rawAge !== undefined && options.rawAge !== null && String(options.rawAge).trim() !== '') {
    const rawVal = options.rawAge;

    // A. Check if raw value is direct cohort text (e.g. "الاول الاعدادي", "الثاني الثانوي", "الصف الاول الابتدائي")
    const textCohort = mapTextToCohort(String(rawVal));
    if (textCohort) {
      return {
        age: textCohort.age,
        gradeLevel: textCohort.age,
        stage: textCohort.stage,
        grade: textCohort.grade,
      };
    }

    // B. Numeric value
    if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
      // Check if Excel serial date number (e.g. 25000 to 60000)
      if (rawVal > 25000 && rawVal < 60000) {
        const dateFromSerial = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
        if (!isNaN(dateFromSerial.getTime())) {
          let calculatedAge = currentYear - dateFromSerial.getFullYear();
          const m = refDate.getMonth() - dateFromSerial.getMonth();
          if (m < 0 || (m === 0 && refDate.getDate() < dateFromSerial.getDate())) calculatedAge--;
          if (calculatedAge >= 3 && calculatedAge <= 30) {
            const bDate = dateFromSerial.toISOString().split('T')[0];
            const cohort = mapNumericAgeToCohort(calculatedAge);
            return {
              age: cohort.age,
              gradeLevel: cohort.age,
              stage: cohort.stage,
              grade: cohort.grade,
              birthDate: bDate,
            };
          }
        }
      } else if (rawVal >= 3 && rawVal <= 30) {
        const cohort = mapNumericAgeToCohort(rawVal);
        return {
          age: cohort.age,
          gradeLevel: cohort.age,
          stage: cohort.stage,
          grade: cohort.grade,
        };
      }
    }

    // C. String representation of numbers / years
    let cleanStr = String(rawVal).trim().replace(/,/g, '.');
    const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
      cleanStr = cleanStr.replace(new RegExp(arabicIndic[i], 'g'), String(i));
    }

    // Check plain number string like "12" or "12.5"
    if (/^\d+(\.\d+)?$/.test(cleanStr)) {
      const parsedNum = parseFloat(cleanStr);
      if (!isNaN(parsedNum) && parsedNum >= 3 && parsedNum <= 30) {
        const cohort = mapNumericAgeToCohort(parsedNum);
        return {
          age: cohort.age,
          gradeLevel: cohort.age,
          stage: cohort.stage,
          grade: cohort.grade,
        };
      }
    }

    // Check text with years e.g. "12 سنة" or "7 سنوات و 6 شهور"
    const textYearMatch =
      cleanStr.match(/^(\d+(\.\d+)?)\s*(سنوات|سنة|سنه|س|عام|اعوام|أعوام)?/i) ||
      cleanStr.match(/(\d+(\.\d+)?)\s*(سنوات|سنة|سنه|س|عام|اعوام|أعوام)/i) ||
      cleanStr.match(/^(\d+)/);
    if (textYearMatch) {
      const parsed = parseFloat(textYearMatch[1]);
      if (!isNaN(parsed) && parsed >= 3 && parsed <= 30) {
        const cohort = mapNumericAgeToCohort(parsed);
        return {
          age: cohort.age,
          gradeLevel: cohort.age,
          stage: cohort.stage,
          grade: cohort.grade,
        };
      }
    }

    // Check if cell is a date string e.g. "2012-05-10" or "10/05/2012"
    const parsedDate = tryParseDate(cleanStr);
    if (parsedDate) {
      let calculatedAge = currentYear - parsedDate.getFullYear();
      const m = refDate.getMonth() - parsedDate.getMonth();
      if (m < 0 || (m === 0 && refDate.getDate() < parsedDate.getDate())) calculatedAge--;
      if (calculatedAge >= 3 && calculatedAge <= 30) {
        const bDate = parsedDate.toISOString().split('T')[0];
        const cohort = mapNumericAgeToCohort(calculatedAge);
        return {
          age: cohort.age,
          gradeLevel: cohort.age,
          stage: cohort.stage,
          grade: cohort.grade,
          birthDate: bDate,
        };
      }
    }
  }

  // 2. Direct Birth Date in Workbook cell (Priority 2)
  if (options.rawBirthDate !== undefined && options.rawBirthDate !== null && String(options.rawBirthDate).trim() !== '') {
    const rawBirth = options.rawBirthDate;
    let bDateObj: Date | null = null;

    if (typeof rawBirth === 'number' && Number.isFinite(rawBirth) && rawBirth > 25000 && rawBirth < 60000) {
      bDateObj = new Date(Math.round((rawBirth - 25569) * 86400 * 1000));
    } else {
      let cleanBirthStr = String(rawBirth).trim();
      const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      for (let i = 0; i < 10; i++) {
        cleanBirthStr = cleanBirthStr.replace(new RegExp(arabicIndic[i], 'g'), String(i));
      }
      bDateObj = tryParseDate(cleanBirthStr);
    }

    if (bDateObj && !isNaN(bDateObj.getTime())) {
      let calculatedAge = currentYear - bDateObj.getFullYear();
      const m = refDate.getMonth() - bDateObj.getMonth();
      if (m < 0 || (m === 0 && refDate.getDate() < bDateObj.getDate())) calculatedAge--;
      if (calculatedAge >= 3 && calculatedAge <= 30) {
        const bDate = bDateObj.toISOString().split('T')[0];
        const cohort = mapNumericAgeToCohort(calculatedAge);
        return {
          age: cohort.age,
          gradeLevel: cohort.age,
          stage: cohort.stage,
          grade: cohort.grade,
          birthDate: bDate,
        };
      }
    }
  }

  // 3. Derive from 14-digit Egyptian National ID (Priority 3)
  const cleanNatId = (options.nationalId || '').trim();
  if (/^[23]\d{13}$/.test(cleanNatId)) {
    const centuryDigit = cleanNatId.charAt(0);
    const yearDigits = cleanNatId.substring(1, 3);
    const monthDigits = cleanNatId.substring(3, 5);
    const dayDigits = cleanNatId.substring(5, 7);

    const fullYear = (centuryDigit === '3' ? 2000 : 1900) + parseInt(yearDigits, 10);
    const month = parseInt(monthDigits, 10);
    const day = parseInt(dayDigits, 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const birthObj = new Date(fullYear, month - 1, day);
      if (!isNaN(birthObj.getTime())) {
        let calculatedAge = currentYear - fullYear;
        const m = refDate.getMonth() - (month - 1);
        if (m < 0 || (m === 0 && refDate.getDate() < day)) calculatedAge--;
        if (calculatedAge >= 3 && calculatedAge <= 30) {
          const bDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const cohort = mapNumericAgeToCohort(calculatedAge);
          return {
            age: cohort.age,
            gradeLevel: cohort.age,
            stage: cohort.stage,
            grade: cohort.grade,
            birthDate: bDate,
          };
        }
      }
    }
  }

  // 4. Fallback from Sheet Name (e.g. "الاول ع", "الثاني ثانوي", "الاول ب")
  if (options.sheetName) {
    const sheetCohort = mapTextToCohort(options.sheetName);
    if (sheetCohort) {
      return {
        age: sheetCohort.age,
        gradeLevel: sheetCohort.age,
        stage: sheetCohort.stage,
        grade: sheetCohort.grade,
      };
    }
    const mapped = mapEgyptianSheetName(options.sheetName);
    if (mapped && mapped.gradeLevel) {
      return {
        age: mapped.gradeLevel,
        gradeLevel: mapped.gradeLevel,
        stage: mapped.stage,
        grade: mapped.grade,
      };
    }
  }

  // No usable age found: Do NOT silently invent one; report error.
  return {
    error: 'تعذر تحديد السن أو الصف الدراسي للطالب (يرجى توفير عمود السن/الصف أو تاريخ الميلاد أو الرقم القومي)',
  };
}

/**
 * Parses a single worksheet into a list of students.
 * Supports flexible column layouts and header-row auto-discovery.
 */
export function parseSingleWorksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
  fileName: string
): {
  students: Array<{
    rowNumber: number;
    ministryCode: string;
    name: string;
    nationalId: string;
    age: string;
    gradeLevel?: string;
    className?: string;
    stage?: string;
    grade?: number;
    birthDate?: string;
    ageError?: string;
  }>;
  headerError?: string;
} {
  if (!worksheet || !worksheet['!ref']) {
    return { students: [], headerError: 'ورقة العمل فارغة' };
  }

  // Convert sheet to array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  if (!rawRows || rawRows.length === 0) {
    return { students: [], headerError: 'ورقة العمل لا تحتوي على بيانات' };
  }

  // Phase 1: Scan first 15 rows to find the header row
  let headerRowIndex = -1;
  let ministryIdx = -1;
  let nameIdx = -1;
  let nationalIdx = -1;
  let ageIdx = -1;
  let birthDateIdx = -1;
  let classIdx = -1;

  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    let mIdx = -1;
    let nIdx = -1;
    let idIdx = -1;
    let aIdx = -1;
    let bIdx = -1;
    let cIdx = -1;

    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c];
      if (cellVal === null || cellVal === undefined || String(cellVal).trim() === '') continue;

      const colType = identifyHeaderColumn(cellVal);
      if (colType === 'ministryCode' && mIdx === -1) mIdx = c;
      else if (colType === 'name' && nIdx === -1) nIdx = c;
      else if (colType === 'nationalId' && idIdx === -1) idIdx = c;
      else if (colType === 'age' && aIdx === -1) aIdx = c;
      else if (colType === 'className' && cIdx === -1) cIdx = c;
      else if (colType === 'birthDate' && bIdx === -1) bIdx = c;
    }

    // Good: name + at least one identifier
    if (nIdx !== -1 && (mIdx !== -1 || idIdx !== -1)) {
      headerRowIndex = r;
      ministryIdx = mIdx;
      nameIdx = nIdx;
      nationalIdx = idIdx;
      ageIdx = aIdx;
      birthDateIdx = bIdx;
      classIdx = cIdx;
      break;
    }
  }

  // Phase 2: Heuristic detection if no explicit header row was identified
  let dataStartRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  if (headerRowIndex === -1 || nameIdx === -1) {
    let heuristicNatCol = -1;
    let heuristicMinistryCol = -1;
    let heuristicNameCol = -1;
    let maxNatMatches = 0;
    let maxMinistryMatches = 0;
    let maxNameMatches = 0;

    const sampleRowsCount = Math.min(rawRows.length, 30);
    const maxCols = Math.max(...rawRows.slice(0, sampleRowsCount).map((r) => (Array.isArray(r) ? r.length : 0)));

    for (let c = 0; c < maxCols; c++) {
      let natMatches = 0;
      let ministryMatches = 0;
      let nameMatches = 0;

      for (let r = 0; r < sampleRowsCount; r++) {
        const row = rawRows[r];
        if (!Array.isArray(row) || c >= row.length) continue;
        const cell = row[c];
        if (cell === null || cell === undefined || String(cell).trim() === '') continue;

        const cleaned = extractCellSafeString(cell);
        const str = String(cell).trim();

        // 14 digits (Egyptian National ID)
        if (/^[23]\d{13}$/.test(cleaned) || /^\d{14}$/.test(cleaned)) {
          natMatches++;
        }
        // 6 to 12 digits (Egyptian student ministry code)
        else if (/^\d{6,12}$/.test(cleaned)) {
          ministryMatches++;
        }
        // Arabic student name (at least 2 words or >= 4 chars, contains Arabic letters, not all digits)
        else if (/[\u0600-\u06FF]/.test(str) && !/^\d+$/.test(cleaned) && str.length >= 4) {
          nameMatches++;
        }
      }

      if (natMatches > maxNatMatches) {
        maxNatMatches = natMatches;
        heuristicNatCol = c;
      }
      if (ministryMatches > maxMinistryMatches) {
        maxMinistryMatches = ministryMatches;
        heuristicMinistryCol = c;
      }
      if (nameMatches > maxNameMatches) {
        maxNameMatches = nameMatches;
        heuristicNameCol = c;
      }
    }

    // Ensure columns are distinct
    if (heuristicNatCol === heuristicMinistryCol) {
      if (maxNatMatches >= maxMinistryMatches) {
        heuristicMinistryCol = -1;
      } else {
        heuristicNatCol = -1;
      }
    }
    if (heuristicNameCol === heuristicNatCol || heuristicNameCol === heuristicMinistryCol) {
      heuristicNameCol = -1;
    }

    if (heuristicNameCol !== -1 && (heuristicNatCol !== -1 || heuristicMinistryCol !== -1)) {
      nameIdx = heuristicNameCol;
      nationalIdx = heuristicNatCol;
      ministryIdx = heuristicMinistryCol;

      // Detect if row 0 is a header or data
      const row0 = rawRows[0];
      let row0IsData = false;
      if (Array.isArray(row0)) {
        const cellName = String(row0[nameIdx] || '').trim();
        const cellNat = nationalIdx !== -1 ? extractCellSafeString(row0[nationalIdx]) : '';
        const cellMin = ministryIdx !== -1 ? extractCellSafeString(row0[ministryIdx]) : '';

        if (
          (/^[23]\d{13}$/.test(cellNat) || /^\d{14}$/.test(cellNat) || /^\d{6,12}$/.test(cellMin)) &&
          /[\u0600-\u06FF]/.test(cellName) &&
          !cellName.includes('اسم') &&
          !cellName.includes('كود')
        ) {
          row0IsData = true;
        }
      }

      dataStartRow = row0IsData ? 0 : 1;
    }
  }

  // If still no name column detected, fail gracefully
  if (nameIdx === -1 || (nationalIdx === -1 && ministryIdx === -1)) {
    return {
      students: [],
      headerError: "تعذر التعرف على أعمدة الكشف (يتطلب: 'كود التلميذ/الوزارة' | 'اسم التلميذ' | 'الرقم القومي')",
    };
  }

  const students: Array<{
    rowNumber: number;
    ministryCode: string;
    name: string;
    nationalId: string;
    age: string;
    gradeLevel?: string;
    className?: string;
    stage?: string;
    grade?: number;
    birthDate?: string;
    ageError?: string;
  }> = [];

  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;

    // Skip entirely blank rows
    if (row.every((c) => c === null || c === undefined || String(c).trim() === '')) {
      continue;
    }

    const rawMinistry = ministryIdx !== -1 ? row[ministryIdx] : '';
    const rawName = nameIdx !== -1 ? row[nameIdx] : '';
    const rawNational = nationalIdx !== -1 ? row[nationalIdx] : '';
    const rawAge = ageIdx !== -1 ? row[ageIdx] : undefined;
    const rawClass = classIdx !== -1 ? row[classIdx] : undefined;
    const rawBirthDate = birthDateIdx !== -1 ? row[birthDateIdx] : undefined;

    const nameStr = String(rawName ?? '').trim();
    const minCode = extractCellSafeString(rawMinistry);
    const natId = extractCellSafeString(rawNational);
    const directClass = rawClass !== null && rawClass !== undefined ? String(rawClass).trim() : '';

    if (!nameStr && !minCode && !natId) {
      continue;
    }

    // Skip any repeated header text
    if (nameStr.includes('اسم التلميذ') || nameStr.includes('اسم الطالب') || nameStr === 'الاسم') {
      continue;
    }

    // Normalize Age (Priority: Direct Age -> Direct BirthDate -> National ID -> Sheet Name)
    const ageResult = normalizeStudentAge({
      rawAge,
      rawBirthDate,
      nationalId: natId,
      sheetName,
    });

    const isGenericSheet = !sheetName || /^(sheet\s*\d*|ورقة\s*\d*|كشف\s*الطلاب|بيانات\s*الطلاب|طلاب|students|data)$/i.test(sheetName.trim());
    const candidateClass = directClass || (!isGenericSheet ? sheetName.trim() : (ageResult.gradeLevel || ageResult.age || 'الصف الأول الابتدائي'));
    const mappedClass = mapEgyptianSheetName(candidateClass);
    const determinedClassName = mappedClass.className || candidateClass;

    students.push({
      rowNumber: r + 1, // 1-indexed for Excel
      ministryCode: minCode,
      name: nameStr,
      nationalId: natId,
      age: ageResult.age || '',
      gradeLevel: mappedClass.gradeLevel || ageResult.gradeLevel || ageResult.age || 'المرحلة الدراسية',
      className: determinedClassName,
      stage: mappedClass.stage || ageResult.stage,
      grade: mappedClass.grade || ageResult.grade,
      birthDate: ageResult.birthDate,
      ageError: ageResult.error,
    });
  }

  return { students };
}

/**
 * Parses multiple Excel files into raw student batches.
 * CLASS IS NO LONGER REQUIRED:
 * The Excel workbook may contain one large student sheet and no class information.
 * Worksheet names are NOT treated as classes.
 */
export async function parseExcelFilesToBatches(
  files: Array<{ name: string; buffer: ArrayBuffer | Uint8Array }>
): Promise<ParsedClassBatch[]> {
  const batches: ParsedClassBatch[] = [];

  for (const file of files) {
    const workbook = XLSX.read(file.buffer, { type: 'array', raw: true });
    const sheetNames = workbook.SheetNames || [];

    for (const sheetName of sheetNames) {
      const ws = workbook.Sheets[sheetName];
      const parsed = parseSingleWorksheet(ws, sheetName, file.name);

      const rawStudents: ParsedStudentRow[] = parsed.students.map((st) => ({
        fileName: file.name,
        sheetName,
        rowNumber: st.rowNumber,
        name: st.name,
        ministryCode: st.ministryCode,
        nationalId: st.nationalId,
        age: st.age,
        gradeLevel: st.gradeLevel || st.age,
        className: st.className || st.gradeLevel || st.age || 'الصف العام',
        stage: st.stage,
        grade: st.grade,
        birthDate: st.birthDate,
        isValid: !st.ageError && Boolean(st.age),
        errorReason: st.ageError || undefined,
      }));

      batches.push({
        fileName: file.name,
        sheetName,
        age: rawStudents[0]?.age,
        gradeLevel: rawStudents[0]?.gradeLevel || rawStudents[0]?.age,
        className: rawStudents[0]?.className,
        stage: rawStudents[0]?.stage,
        grade: rawStudents[0]?.grade,
        students: rawStudents,
        totalRows: rawStudents.length,
        validCount: rawStudents.filter((s) => s.isValid).length,
        errorCount: rawStudents.filter((s) => !s.isValid).length,
        duplicateCount: 0,
        headerError: parsed.headerError,
      });
    }
  }

  return batches;
}

/**
 * Validates parsed batches across:
 * 1. Missing fields (name, ministry code, national ID)
 * 2. Exact 14-digit national ID validation
 * 3. Canonical age validation (presence of valid cohort string)
 * 4. Intra-import duplicates (same ministry code or national ID anywhere in selected files)
 * 5. Database duplicates (from live validateStudentImportApi check)
 */
export function validateStudentBatches(
  batches: ParsedClassBatch[],
  dbExisting: { existingMinistryCodes?: string[]; existingNationalIds?: string[] } = {}
): {
  validatedBatches: ParsedClassBatch[];
  allStudents: ParsedStudentRow[];
  summary: ImportValidationSummary;
} {
  const dbMinistrySet = new Set((dbExisting.existingMinistryCodes || []).map((c) => String(c).trim()));
  const dbNationalSet = new Set((dbExisting.existingNationalIds || []).map((id) => String(id).trim()));

  const seenMinistryInImport = new Map<string, { fileName: string; sheetName: string; rowNumber: number }>();
  const seenNationalInImport = new Map<string, { fileName: string; sheetName: string; rowNumber: number }>();

  const validatedBatches: ParsedClassBatch[] = [];
  const allStudents: ParsedStudentRow[] = [];

  let totalRows = 0;
  let validRows = 0;
  let errorRows = 0;
  let duplicateRows = 0;

  for (const batch of batches) {
    if (batch.headerError) {
      validatedBatches.push({
        ...batch,
        validCount: 0,
        errorCount: 0,
        duplicateCount: 0,
      });
      continue;
    }

    const validatedStudents: ParsedStudentRow[] = [];
    let batchValid = 0;
    let batchErrors = 0;
    let batchDuplicates = 0;

    for (const st of batch.students) {
      totalRows++;
      let isValid = true;
      let isDuplicate = false;
      let errorReason = '';

      if (!st.name) {
        isValid = false;
        errorReason = 'اسم الطالب مفقود أو فارغ';
      } else if (!st.ministryCode) {
        isValid = false;
        errorReason = 'كود الوزارة/التلميذ مفقود أو فارغ';
      } else if (!st.nationalId) {
        isValid = false;
        errorReason = 'الرقم القومي مفقود أو فارغ';
      } else if (!/^\d{14}$/.test(st.nationalId)) {
        isValid = false;
        errorReason = `الرقم القومي غير صحيح (${st.nationalId.length} رقم بدلاً من 14 رقماً)`;
      } else if (!st.age || st.age.trim() === '') {
        isValid = false;
        errorReason = st.errorReason || 'سن / صف الطالب مفقود أو تعذر التعرف عليه';
      } else if (seenMinistryInImport.has(st.ministryCode)) {
        const prev = seenMinistryInImport.get(st.ministryCode)!;
        isValid = false;
        isDuplicate = true;
        errorReason = `كود الوزارة مكرر داخل الملفات المستوردة (${st.ministryCode} - ظهر سابقاً في ${prev.fileName} / ${prev.sheetName} سطر ${prev.rowNumber})`;
      } else if (seenNationalInImport.has(st.nationalId)) {
        const prev = seenNationalInImport.get(st.nationalId)!;
        isValid = false;
        isDuplicate = true;
        errorReason = `الرقم القومي مكرر داخل الملفات المستوردة (${st.nationalId} - ظهر سابقاً في ${prev.fileName} / ${prev.sheetName} سطر ${prev.rowNumber})`;
      } else if (dbMinistrySet.has(st.ministryCode)) {
        isValid = false;
        isDuplicate = true;
        errorReason = `كود الوزارة مسجل سابقاً بالنظام لدى طالب آخر (${st.ministryCode})`;
      } else if (dbNationalSet.has(st.nationalId)) {
        isValid = false;
        isDuplicate = true;
        errorReason = `الرقم القومي مسجل سابقاً بالنظام لدى طالب آخر (${st.nationalId})`;
      }

      if (st.ministryCode && !seenMinistryInImport.has(st.ministryCode)) {
        seenMinistryInImport.set(st.ministryCode, {
          fileName: st.fileName,
          sheetName: st.sheetName,
          rowNumber: st.rowNumber,
        });
      }

      if (st.nationalId && !seenNationalInImport.has(st.nationalId)) {
        seenNationalInImport.set(st.nationalId, {
          fileName: st.fileName,
          sheetName: st.sheetName,
          rowNumber: st.rowNumber,
        });
      }

      if (isValid) {
        batchValid++;
        validRows++;
      } else if (isDuplicate) {
        batchDuplicates++;
        duplicateRows++;
      } else {
        batchErrors++;
        errorRows++;
      }

      const validatedRow: ParsedStudentRow = {
        ...st,
        isValid,
        isDuplicate,
        errorReason: errorReason || undefined,
      };

      validatedStudents.push(validatedRow);
      allStudents.push(validatedRow);
    }

    validatedBatches.push({
      ...batch,
      students: validatedStudents,
      totalRows: validatedStudents.length,
      validCount: batchValid,
      errorCount: batchErrors,
      duplicateCount: batchDuplicates,
    });
  }

  const distinctAges = new Set(
    allStudents
      .filter((s) => s.isValid && s.age)
      .map((s) => s.age)
  );

  return {
    validatedBatches,
    allStudents,
    summary: {
      totalFiles: new Set(batches.map((b) => b.fileName)).size,
      totalSheets: batches.length,
      totalGrades: distinctAges.size,
      totalAges: distinctAges.size,
      totalRows,
      validRows,
      errorRows,
      duplicateRows,
    },
  };
}
