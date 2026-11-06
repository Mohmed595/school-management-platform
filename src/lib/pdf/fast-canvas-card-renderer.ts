import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Student, Teacher } from '../../types/admin';

export interface GroupedClassPage {
  schoolName: string;
  gradeLevel: string;
  className: string;
  totalStudentsInClass: number;
  pageIndex: number;
  totalPagesInClass: number;
  students: Student[];
}

export interface GroupedTeacherPage {
  schoolName: string;
  departmentTitle: string;
  totalTeachers: number;
  pageIndex: number;
  totalPages: number;
  teachers: Teacher[];
}

// Canvas A4 dimensions for high-resolution output (~170 DPI, crisp and extremely fast)
export const CANVAS_WIDTH = 1414;
export const CANVAS_HEIGHT = 2000;

const CARD_WIDTH = 270;
const CARD_HEIGHT = 404;
const GAP_H = 32;
const GAP_V = 32;
const CARDS_PER_ROW = 4;
const START_Y = 180;
const TOTAL_CARDS_W = 4 * CARD_WIDTH + 3 * GAP_H; // 1176 px
const START_X = (CANVAS_WIDTH - TOTAL_CARDS_W) / 2; // 119 px (centered)

/**
 * Prepares and renders a single page of 16 cards onto an HTML5 2D Canvas in ~20ms
 */
export async function renderPageToCanvas(
  page: GroupedClassPage,
  platformUrl: string = 'https://madrasety.ai.studio',
  pageTotalIndex?: { current: number; total: number }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context could not be created');
  }

  // 1. Background (pure white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Page Header
  // School Name
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 28px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.fillText(page.schoolName || 'المدرسة', CANVAS_WIDTH / 2, 60);

  // Subtitle (Grade, Class, Students count)
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px "Cairo", "Segoe UI", Arial, sans-serif';
  let subtitle = `${page.gradeLevel} • ${page.className} • عدد الطلاب: ${page.totalStudentsInClass}`;
  if (page.totalPagesInClass > 1) {
    subtitle += ` • (صفحة ${page.pageIndex} من ${page.totalPagesInClass})`;
  }
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, 102);

  // Header Divider Line
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(START_X, 138);
  ctx.lineTo(CANVAS_WIDTH - START_X, 138);
  ctx.stroke();

  // 3. Render Cards in 4x4 Grid
  const qrCanvas = document.createElement('canvas');

  for (let i = 0; i < page.students.length && i < 16; i++) {
    const student = page.students[i];
    const col = i % CARDS_PER_ROW;
    const row = Math.floor(i / CARDS_PER_ROW);

    const x = START_X + col * (CARD_WIDTH + GAP_H);
    const y = START_Y + row * (CARD_HEIGHT + GAP_V);

    // Card Outer Border with rounded corners
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, 16);
    ctx.fill();
    ctx.stroke();

    // Top Pill: School Name Banner
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 10, CARD_WIDTH - 24, 28, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(page.schoolName || 'مدرسة المستقبل', x + CARD_WIDTH / 2, y + 24);

    // Divider under header banner
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 44);
    ctx.lineTo(x + CARD_WIDTH - 12, y + 44);
    ctx.stroke();

    // Student Name
    ctx.fillStyle = '#000000';
    ctx.font = '900 15px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    const studentName = student.name || 'طالب';
    ctx.fillText(studentName, x + CARD_WIDTH / 2, y + 64);

    // Ministry Code Box
    const ministryCode = student.ministryCode || student.studentCode || `STD-2026-${student.id}`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x + 16, y + 80, CARD_WIDTH - 32, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.fillText('كود الوزارة', x + CARD_WIDTH / 2, y + 94);

    ctx.fillStyle = '#000000';
    ctx.font = '900 14px monospace, "Courier New"';
    ctx.fillText(ministryCode, x + CARD_WIDTH / 2, y + 111);

    // Dashed separator
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 132);
    ctx.lineTo(x + CARD_WIDTH - 16, y + 132);
    ctx.stroke();
    ctx.setLineDash([]);

    // QR Code Container Box
    const qrBoxSize = 136;
    const qrBoxX = x + (CARD_WIDTH - qrBoxSize) / 2;
    const qrBoxY = y + 140;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 12);
    ctx.fill();
    ctx.stroke();

    // Fast In-Memory QR Generation straight to canvas
    const studentLoginUrl = `${platformUrl.replace(/\/+$/, '')}/login?ministryCode=${encodeURIComponent(ministryCode)}`;
    try {
      await QRCode.toCanvas(qrCanvas, studentLoginUrl, {
        width: 124,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      ctx.drawImage(qrCanvas, qrBoxX + 6, qrBoxY + 6, 124, 124);
    } catch (qrErr) {
      console.warn('Failed to draw QR code on canvas:', qrErr);
    }

    // Platform URL Black Pill directly underneath QR
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 284, CARD_WIDTH - 40, 24, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace, "Courier New"';
    ctx.fillText('madrasety.ai.studio', x + CARD_WIDTH / 2, y + 296);

    // Security Footer inside card
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 9.5px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.fillText('🔒 احتفظ بهذه البطاقة فهي خاصة بك', x + CARD_WIDTH / 2, y + 322);
  }

  // 4. Page Footer
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(START_X, 1920);
  ctx.lineTo(CANVAS_WIDTH - START_X, 1920);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('منصة مدرسة المستقبل التعليمية', CANVAS_WIDTH - START_X, 1948);

  ctx.textAlign = 'left';
  const pageNumberText = pageTotalIndex
    ? `صفحة ${pageTotalIndex.current} من ${pageTotalIndex.total}`
    : `صفحة ${page.pageIndex} من ${page.totalPagesInClass}`;
  ctx.fillText(pageNumberText, START_X, 1948);

  return canvas;
}

/**
 * Ultra-fast Unified PDF generation from pre-arranged canvas PNG/JPEG pages
 * Runs in ~0.5 - 1.5 seconds for typical schools (50x-100x faster than html2canvas)
 */
export async function exportAllPagesToUnifiedPdf(
  pages: GroupedClassPage[],
  platformUrl: string,
  onProgress: (current: number, total: number, status: string) => void
): Promise<Blob> {
  const total = pages.length;
  if (total === 0) {
    throw new Error('لا توجد صفحات للتصدير');
  }

  // Initialize jsPDF A4 portrait document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;

  for (let i = 0; i < total; i++) {
    const pageData = pages[i];
    onProgress(
      i + 1,
      total,
      `جاري تجهيز صفحة ${i + 1} من ${total}: (${pageData.gradeLevel} - ${pageData.className})...`
    );

    // Yield control to browser event loop so UI progress updates smoothly
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Render page canvas
    const canvas = await renderPageToCanvas(pageData, platformUrl, {
      current: i + 1,
      total,
    });

    // Render as high-definition PNG image and convert into PDF page
    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, undefined, 'FAST');

    // Free canvas resources
    canvas.width = 0;
    canvas.height = 0;
  }

  onProgress(total, total, 'تم إكمال دمج جميع الصفحات داخل ملف PDF الموحد!');

  return pdf.output('blob');
}

/**
 * Secondary option: Exports arranged PNG images inside an organized ZIP archive
 */
export async function exportAllPagesToImagesZip(
  pages: GroupedClassPage[],
  platformUrl: string,
  onProgress: (current: number, total: number, status: string) => void
): Promise<Blob> {
  const total = pages.length;
  if (total === 0) {
    throw new Error('لا توجد صفحات للتصدير');
  }

  const zip = new JSZip();

  for (let i = 0; i < total; i++) {
    const pageData = pages[i];
    onProgress(
      i + 1,
      total,
      `جاري التقاط صورة صفحة ${i + 1} من ${total}: (${pageData.gradeLevel} - ${pageData.className})...`
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const canvas = await renderPageToCanvas(pageData, platformUrl, {
      current: i + 1,
      total,
    });

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const base64Data = dataUrl.split(',')[1];

    canvas.width = 0;
    canvas.height = 0;

    const gradeFolderName = (pageData.gradeLevel || 'الصف').trim();
    const classNameClean = (pageData.className || 'فصل').replace(/[\/\\]/g, '-').trim();
    const fileName = `${classNameClean} - صفحة ${pageData.pageIndex}.png`;

    const gradeFolder = zip.folder(gradeFolderName) || zip;
    gradeFolder.file(fileName, base64Data, { base64: true });
  }

  onProgress(total, total, 'جاري ضغط حزمة الصور (ZIP)...');

  return await zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

/**
 * Prepares and renders a single page of 16 teacher cards onto an HTML5 2D Canvas
 */
export async function renderTeacherPageToCanvas(
  page: GroupedTeacherPage,
  platformUrl: string = 'https://madrasety.ai.studio',
  pageTotalIndex?: { current: number; total: number }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context could not be created');
  }

  // 1. Background (pure white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Page Header
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 28px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.fillText(page.schoolName || 'المدرسة', CANVAS_WIDTH / 2, 60);

  // Subtitle (Department, Teachers count)
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px "Cairo", "Segoe UI", Arial, sans-serif';
  let subtitle = `${page.departmentTitle || 'هيئة التدريس والمواد الدراسية'} • عدد المعلمين: ${page.totalTeachers}`;
  if (page.totalPages > 1) {
    subtitle += ` • (صفحة ${page.pageIndex} من ${page.totalPages})`;
  }
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, 102);

  // Header Divider Line
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(START_X, 138);
  ctx.lineTo(CANVAS_WIDTH - START_X, 138);
  ctx.stroke();

  // 3. Render Cards in 4x4 Grid
  const qrCanvas = document.createElement('canvas');

  for (let i = 0; i < page.teachers.length && i < 16; i++) {
    const teacher = page.teachers[i];
    const col = i % CARDS_PER_ROW;
    const row = Math.floor(i / CARDS_PER_ROW);

    const x = START_X + col * (CARD_WIDTH + GAP_H);
    const y = START_Y + row * (CARD_HEIGHT + GAP_V);

    // Card Outer Border with rounded corners
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, 16);
    ctx.fill();
    ctx.stroke();

    // Top Pill: School Name Banner
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 10, CARD_WIDTH - 24, 28, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(page.schoolName || 'مدرسة المستقبل', x + CARD_WIDTH / 2, y + 24);

    // Divider under header banner
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 44);
    ctx.lineTo(x + CARD_WIDTH - 12, y + 44);
    ctx.stroke();

    // Teacher Name
    ctx.fillStyle = '#000000';
    ctx.font = '900 15px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    const teacherName = teacher.name || 'معلم';
    ctx.fillText(teacherName, x + CARD_WIDTH / 2, y + 64);

    // Password Box
    const teacherPassword = (teacher.password && !teacher.password.startsWith('scrypt:') && !teacher.password.startsWith('$'))
      ? teacher.password
      : 'Pass#2026';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(x + 16, y + 80, CARD_WIDTH - 32, 42, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.fillText('كلمة المرور (Password)', x + CARD_WIDTH / 2, y + 94);

    ctx.fillStyle = '#000000';
    ctx.font = '900 14px monospace, "Courier New"';
    ctx.fillText(teacherPassword, x + CARD_WIDTH / 2, y + 111);

    // Dashed separator
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 132);
    ctx.lineTo(x + CARD_WIDTH - 16, y + 132);
    ctx.stroke();
    ctx.setLineDash([]);

    // QR Code Container Box
    const qrBoxSize = 136;
    const qrBoxX = x + (CARD_WIDTH - qrBoxSize) / 2;
    const qrBoxY = y + 140;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 12);
    ctx.fill();
    ctx.stroke();

    // Fast In-Memory QR Generation straight to canvas
    const teacherLoginUrl = `${platformUrl.replace(/\/+$/, '')}/login?role=teacher&username=${encodeURIComponent(teacher.username || teacher.name)}&pwd=${encodeURIComponent(teacherPassword)}`;
    try {
      await QRCode.toCanvas(qrCanvas, teacherLoginUrl, {
        width: 124,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      ctx.drawImage(qrCanvas, qrBoxX + 6, qrBoxY + 6, 124, 124);
    } catch (qrErr) {
      console.warn('Failed to draw teacher QR code on canvas:', qrErr);
    }

    // Platform URL Black Pill directly underneath QR
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(x + 20, y + 284, CARD_WIDTH - 40, 24, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace, "Courier New"';
    ctx.fillText('madrasety.ai.studio', x + CARD_WIDTH / 2, y + 296);

    // Security Footer inside card
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 9.5px "Cairo", "Segoe UI", Arial, sans-serif';
    ctx.fillText('🔒 بطاقة تسجيل دخول المعلم الرسمية', x + CARD_WIDTH / 2, y + 322);
  }

  // 4. Page Footer
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(START_X, 1920);
  ctx.lineTo(CANVAS_WIDTH - START_X, 1920);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px "Cairo", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('منصة مدرسة المستقبل التعليمية • كروت تسجيل دخول المعلمين', CANVAS_WIDTH - START_X, 1948);

  ctx.textAlign = 'left';
  const pageNumberText = pageTotalIndex
    ? `صفحة ${pageTotalIndex.current} من ${pageTotalIndex.total}`
    : `صفحة ${page.pageIndex} من ${page.totalPages}`;
  ctx.fillText(pageNumberText, START_X, 1948);

  return canvas;
}

/**
 * Ultra-fast Unified PDF generation from pre-arranged teacher pages
 */
export async function exportAllTeacherPagesToUnifiedPdf(
  pages: GroupedTeacherPage[],
  platformUrl: string,
  onProgress: (current: number, total: number, status: string) => void
): Promise<Blob> {
  const total = pages.length;
  if (total === 0) {
    throw new Error('لا توجد صفحات للتصدير');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;

  for (let i = 0; i < total; i++) {
    const pageData = pages[i];
    onProgress(
      i + 1,
      total,
      `جاري تجهيز صفحة المعلمين ${i + 1} من ${total}...`
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const canvas = await renderTeacherPageToCanvas(pageData, platformUrl, {
      current: i + 1,
      total,
    });

    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, undefined, 'FAST');

    canvas.width = 0;
    canvas.height = 0;
  }

  onProgress(total, total, 'تم إكمال دمج جميع بطاقات المعلمين داخل ملف PDF الموحد!');

  return pdf.output('blob');
}

/**
 * Secondary option: Exports arranged PNG images of teacher cards inside an organized ZIP archive
 */
export async function exportAllTeacherPagesToImagesZip(
  pages: GroupedTeacherPage[],
  platformUrl: string,
  onProgress: (current: number, total: number, status: string) => void
): Promise<Blob> {
  const total = pages.length;
  if (total === 0) {
    throw new Error('لا توجد صفحات للتصدير');
  }

  const zip = new JSZip();

  for (let i = 0; i < total; i++) {
    const pageData = pages[i];
    onProgress(
      i + 1,
      total,
      `جاري التقاط صورة صفحة المعلمين ${i + 1} من ${total}...`
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const canvas = await renderTeacherPageToCanvas(pageData, platformUrl, {
      current: i + 1,
      total,
    });

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const base64Data = dataUrl.split(',')[1];

    canvas.width = 0;
    canvas.height = 0;

    const fileName = `بطاقات_المعلمين - صفحة ${pageData.pageIndex}.png`;
    zip.file(fileName, base64Data, { base64: true });
  }

  onProgress(total, total, 'جاري ضغط حزمة صور بطاقات المعلمين (ZIP)...');

  return await zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

