import * as XLSX from 'xlsx';

export interface ExcelAttachment {
  fileName: string;
  sheetName?: string;
  columns: string[];
  rows: (string | number | boolean | null | undefined)[][];
  metadata?: {
    title?: string;
    generatedAt?: string;
    schoolName?: string;
  };
}

/**
 * Generates and triggers download of a styled, RTL-formatted .xlsx file.
 */
export function downloadExcelAttachment(attachment: ExcelAttachment): void {
  try {
    if (!attachment || !Array.isArray(attachment.columns) || !Array.isArray(attachment.rows)) {
      throw new Error('بيانات ملف الإكسيل غير مكتملة');
    }

    // Ensure valid filename with .xlsx extension
    let safeFileName = (attachment.fileName || 'بيانات_مدرستي.xlsx').trim();
    if (!safeFileName.toLowerCase().endsWith('.xlsx')) {
      safeFileName += '.xlsx';
    }

    const sheetName = (attachment.sheetName || 'البيانات').slice(0, 31); // Excel sheet name max 31 chars

    // Build sheet rows: header row followed by data rows
    const sheetData: (string | number | boolean | null | undefined)[][] = [];

    // Optional metadata title row
    if (attachment.metadata?.title) {
      sheetData.push([attachment.metadata.title]);
      sheetData.push([]); // blank row
    }

    // Header columns
    sheetData.push(attachment.columns);

    // Data rows
    for (const row of attachment.rows) {
      sheetData.push(row);
    }

    // Create worksheet from array of arrays
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Calculate column widths automatically based on content
    const colWidths = attachment.columns.map((colName, colIdx) => {
      let maxLen = (colName || '').toString().length;
      for (const row of attachment.rows) {
        const val = row[colIdx];
        if (val !== undefined && val !== null) {
          const str = val.toString();
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });
    ws['!cols'] = colWidths;

    // Set sheet view to RTL (Right to Left) for proper Arabic rendering
    (ws as any)['!views'] = [{ RTL: true }];

    // Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Write file and trigger browser download
    XLSX.writeFile(wb, safeFileName, { bookType: 'xlsx', type: 'binary' });
  } catch (error) {
    console.error('Failed to generate or download Excel file:', error);
    throw error;
  }
}

const ARABIC_KEY_MAP: Record<string, string> = {
  rank: 'الترتيب',
  studentName: 'اسم الطالب',
  student_name: 'اسم الطالب',
  name: 'الاسم',
  className: 'الفصل',
  class_name: 'الفصل',
  points: 'مجموع النقاط',
  notes: 'الملاحظات',
  note: 'الملاحظة',
  score: 'الدرجة',
  maxScore: 'الدرجة العظمى',
  subjectName: 'المادة',
  subject_name: 'المادة',
  date: 'التاريخ',
  status: 'الحالة',
  attendanceRate: 'نسبة الحضور',
  gender: 'النوع',
  phone: 'رقم الهاتف',
  specialization: 'التخصص',
  title: 'العنوان',
  priority: 'الأولوية',
  schoolName: 'اسم المدرسة',
  school_name: 'اسم المدرسة',
  governorate: 'المحافظة',
  code: 'الكود',
  studentsCount: 'عدد الطلاب',
  subscription: 'الاشتراك',
  systemStatus: 'حالة النظام',
  keyObservation: 'أبرز الملاحظات',
  reportTitle: 'عنوان التقرير',
  reportDate: 'تاريخ التقرير',
};

function formatColumnTitle(key: string): string {
  if (ARABIC_KEY_MAP[key]) return ARABIC_KEY_MAP[key];
  if (/[\u0600-\u06FF]/.test(key)) return key;
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
}

function cleanReportText(text: string, matchedBlock: string): string {
  let cleaned = text.replace(matchedBlock, '').trim();
  cleaned = cleaned
    .replace(/إلى صيغة JSON المهيكلة[،,\s]*والتي يمكنك استخدامها برمجياً لربطها بأنظمة التقارير أو لوحات التحكم الخاصة بالمدرسة:/g, 'إلى ملف إكسيل (.xlsx) مهيكل وجاهز للتحميل والمعاينة:')
    .replace(/إلى صيغة JSON المهيكلة/g, 'إلى ملف إكسيل (.xlsx) مهيكل')
    .replace(/صيغة JSON/g, 'ملف Excel (.xlsx)')
    .replace(/بصيغة JSON/g, 'بملف Excel (.xlsx)');
  if (!cleaned) {
    cleaned = 'تم إعداد وتوليد ملف الإكسيل المطلوب بنجاح، يمكنك تحميل الملف أو الاطلاع على المعاينة المباشرة أدناه:';
  }
  return cleaned;
}

/**
 * Utility to extract structured excel-export JSON from AI response text if present.
 */
export function extractExcelFromResponse(text: string): {
  cleanText: string;
  attachment?: ExcelAttachment;
} {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '' };
  }

  // Find all code blocks in the text
  const codeBlockRegex = /```(?:[a-zA-Z0-9_\-:]+)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const rawBlock = match[0];
    const content = match[1].trim();

    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') continue;

      // Case 1: Standard excel-export format (has columns + rows/data)
      const rawFileNameVal = parsed.fileName || parsed.filename || parsed.file_name;
      const rawColsVal = parsed.columns || parsed.headers || parsed.fields;
      const rawRowsVal = parsed.rows || parsed.data || parsed.records;

      if (rawRowsVal && Array.isArray(rawRowsVal)) {
        let rawFileName = (rawFileNameVal || parsed.reportTitle || 'تقرير_مدرستي.xlsx').trim();
        if (!rawFileName.toLowerCase().endsWith('.xlsx')) rawFileName += '.xlsx';

        let cols: string[] = [];
        if (Array.isArray(rawColsVal)) {
          cols = rawColsVal.map((c: any) => formatColumnTitle(String(c ?? '')));
        } else if (rawRowsVal.length > 0 && typeof rawRowsVal[0] === 'object' && !Array.isArray(rawRowsVal[0])) {
          cols = Object.keys(rawRowsVal[0]).map(formatColumnTitle);
        }

        const normalizedRows: (string | number | boolean | null | undefined)[][] = [];
        for (const row of rawRowsVal) {
          if (Array.isArray(row)) {
            normalizedRows.push(row);
          } else if (typeof row === 'object' && row !== null) {
            const rawKeys = Object.keys(row);
            normalizedRows.push(rawKeys.map((k) => (row as any)[k]));
          }
        }

        return {
          cleanText: cleanReportText(text, rawBlock),
          attachment: {
            fileName: rawFileName,
            sheetName: parsed.sheetName || parsed.sheetname || parsed.sheet_name || 'البيانات',
            columns: cols,
            rows: normalizedRows,
            metadata: parsed.metadata,
          },
        };
      }

      // Case 2: Object containing an array property (like leaderboard, students, attendance, grades, list, items)
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        const arrayKey = Object.keys(parsed).find((k) => Array.isArray((parsed as any)[k]) && (parsed as any)[k].length > 0);
        if (arrayKey) {
          const list: any[] = (parsed as any)[arrayKey];
          const rawKeys = list.length > 0 && typeof list[0] === 'object' && !Array.isArray(list[0])
            ? Object.keys(list[0])
            : ['البيان', 'القيمة'];
          const cols = rawKeys.map(formatColumnTitle);
          const rows: (string | number | boolean | null | undefined)[][] = [];

          for (const item of list) {
            if (Array.isArray(item)) {
              rows.push(item);
            } else if (typeof item === 'object' && item !== null) {
              rows.push(rawKeys.map((k) => (item as any)[k]));
            } else {
              rows.push([item]);
            }
          }

          let reportTitle = parsed.reportTitle || parsed.title || parsed.report_title || formatColumnTitle(arrayKey);
          let safeFileName = (reportTitle.replace(/[\\/:*?"<>|\s]+/g, '_') + '.xlsx');

          return {
            cleanText: cleanReportText(text, rawBlock),
            attachment: {
              fileName: safeFileName,
              sheetName: formatColumnTitle(arrayKey).slice(0, 30),
              columns: cols,
              rows,
              metadata: {
                title: reportTitle,
                schoolName: parsed.schoolName || parsed.school_name,
                generatedAt: parsed.reportDate || parsed.date,
              },
            },
          };
        }
      }

      // Case 3: Top-level array of objects [ { ... }, { ... } ]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const rawKeys = typeof parsed[0] === 'object' && !Array.isArray(parsed[0])
          ? Object.keys(parsed[0])
          : ['البيان'];
        const cols = rawKeys.map(formatColumnTitle);
        const rows = parsed.map((item) => {
          if (Array.isArray(item)) return item;
          if (typeof item === 'object' && item !== null) {
            return rawKeys.map((k) => (item as any)[k]);
          }
          return [item];
        });

        return {
          cleanText: cleanReportText(text, rawBlock),
          attachment: {
            fileName: 'كشف_بيانات_مدرستي.xlsx',
            sheetName: 'البيانات',
            columns: cols,
            rows,
          },
        };
      }
    } catch {
      // Not a valid JSON block, continue to next code block
    }
  }

  return { cleanText: text };
}
