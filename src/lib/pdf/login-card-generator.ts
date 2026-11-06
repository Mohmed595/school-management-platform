import { PDFDocument, rgb } from 'pdf-lib';
import { embedArabicFont } from './fonts';
import { drawArabicText } from './arabic-reshaper';
import { generateQrPngBytes } from './qr';
import {
  PAGE_WIDTH_MM,
  PAGE_HEIGHT_MM,
  CARD_WIDTH_MM,
  CARD_HEIGHT_MM,
  CARDS_PER_PAGE,
  mmToPt,
  getCardPosition,
} from './layout';

export interface StudentPdfRecord {
  id: string;
  name: string;
  parentPhone?: string;
  studentCode?: string;
  ministryCode?: string;
  nationalId?: string;
}

export interface GroupedClassPdfData {
  schoolName: string;
  gradeName: string;
  className: string;
  students: StudentPdfRecord[];
}

/**
 * Generates a vector PDF with exact mm coordinates using pdf-lib
 */
export async function generateLoginCardsPDF(
  groups: GroupedClassPdfData[],
  platformUrl: string = 'madrasety.ai.studio'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await embedArabicFont(pdfDoc);

  // Colors
  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGrayBg = rgb(0.95, 0.96, 0.98);

  for (const group of groups) {
    if (!group.students || group.students.length === 0) continue;

    // Split students into chunks of 16 (CARDS_PER_PAGE)
    const studentChunks: StudentPdfRecord[][] = [];
    for (let i = 0; i < group.students.length; i += CARDS_PER_PAGE) {
      studentChunks.push(group.students.slice(i, i + CARDS_PER_PAGE));
    }

    for (let chunkIdx = 0; chunkIdx < studentChunks.length; chunkIdx++) {
      const chunk = studentChunks[chunkIdx];
      const page = pdfDoc.addPage([mmToPt(PAGE_WIDTH_MM), mmToPt(PAGE_HEIGHT_MM)]);

      // 1. Draw Page Header (Centered)
      const pageHeaderY_Pt = mmToPt(PAGE_HEIGHT_MM - 8);

      drawArabicText(page, group.schoolName || 'المدرسة', {
        x: mmToPt(PAGE_WIDTH_MM / 2),
        y: pageHeaderY_Pt,
        font,
        size: 14,
        color: black,
        alignment: 'center',
      });

      const subtitleRaw = `الصف: ${group.gradeName} | الفصل: ${group.className} | عدد الطلاب: ${chunk.length} (صفحة ${chunkIdx + 1} من ${studentChunks.length})`;
      drawArabicText(page, subtitleRaw, {
        x: mmToPt(PAGE_WIDTH_MM / 2),
        y: pageHeaderY_Pt - mmToPt(6),
        font,
        size: 9,
        color: darkGray,
        alignment: 'center',
      });

      // Header separator line
      page.drawLine({
        start: { x: mmToPt(10), y: pageHeaderY_Pt - mmToPt(10) },
        end: { x: mmToPt(PAGE_WIDTH_MM - 10), y: pageHeaderY_Pt - mmToPt(10) },
        thickness: 1.5,
        color: black,
      });

      // 2. Render Student Cards for this page
      for (let i = 0; i < chunk.length; i++) {
        const student = chunk[i];
        const studentCode = student.studentCode || `STD-2026-${student.id}`;
        const pos = getCardPosition(i);

        // Card Outer Border
        page.drawRectangle({
          x: pos.xPt,
          y: pos.yPt,
          width: pos.widthPt,
          height: pos.heightPt,
          borderColor: black,
          borderWidth: 1.5,
          color: rgb(1, 1, 1),
        });

        // Card Header Banner (School Name)
        const cardHeaderLineY = pos.yPt + pos.heightPt - mmToPt(9);
        page.drawLine({
          start: { x: pos.xPt, y: cardHeaderLineY },
          end: { x: pos.xPt + pos.widthPt, y: cardHeaderLineY },
          thickness: 1,
          color: black,
        });

        drawArabicText(page, group.schoolName, {
          x: pos.xPt + mmToPt(1),
          y: cardHeaderLineY + mmToPt(2.5),
          font,
          size: 7.5,
          color: black,
          maxWidth: pos.widthPt - mmToPt(2),
          alignment: 'center',
        });

        // Student Name
        drawArabicText(page, student.name, {
          x: pos.xPt + mmToPt(1),
          y: cardHeaderLineY - mmToPt(6),
          font,
          size: 8.5,
          color: black,
          maxWidth: pos.widthPt - mmToPt(2),
          alignment: 'center',
        });

        // Ministry Code Box
        const ministryCode = student.ministryCode || student.studentCode || `STD-2026-${student.id}`;
        const rawCode = `كود الوزارة: ${ministryCode}`;
        const codeBoxY = cardHeaderLineY - mmToPt(14);
        const codeBoxHeight = mmToPt(5.5);
        const codeBoxMargin = mmToPt(2);
        page.drawRectangle({
          x: pos.xPt + codeBoxMargin,
          y: codeBoxY,
          width: pos.widthPt - codeBoxMargin * 2,
          height: codeBoxHeight,
          borderColor: black,
          borderWidth: 0.8,
          color: lightGrayBg,
        });

        drawArabicText(page, rawCode, {
          x: pos.xPt + codeBoxMargin,
          y: codeBoxY + mmToPt(1.5),
          font,
          size: 7,
          color: black,
          maxWidth: pos.widthPt - codeBoxMargin * 2,
          alignment: 'center',
        });

        // Platform URL
        drawArabicText(page, platformUrl, {
          x: pos.xPt,
          y: codeBoxY - mmToPt(4.5),
          font,
          size: 6.5,
          color: darkGray,
          maxWidth: pos.widthPt,
          alignment: 'center',
        });

        // QR Code Image (Bottom of card)
        try {
          const qrBytes = await generateQrPngBytes(`${platformUrl}/login?ministryCode=${encodeURIComponent(ministryCode)}`);
          const qrImage = await pdfDoc.embedPng(qrBytes);
          const qrSizePt = mmToPt(18); // 18mm x 18mm QR image
          page.drawImage(qrImage, {
            x: pos.xPt + (pos.widthPt - qrSizePt) / 2,
            y: pos.yPt + mmToPt(2.5),
            width: qrSizePt,
            height: qrSizePt,
          });
        } catch (qrErr) {
          console.warn('Failed to embed QR code for student:', student.id, qrErr);
        }
      }

      // Page Footer Marker
      const footerY_Pt = mmToPt(6);
      page.drawLine({
        start: { x: mmToPt(10), y: footerY_Pt + mmToPt(4) },
        end: { x: mmToPt(PAGE_WIDTH_MM - 10), y: footerY_Pt + mmToPt(4) },
        thickness: 0.8,
        color: darkGray,
      });

      drawArabicText(page, 'منصة مدرسة المستقبل التعليمية - بطاقات الدخول', {
        x: mmToPt(10),
        y: footerY_Pt,
        font,
        size: 7.5,
        color: darkGray,
        alignment: 'left',
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Triggers a download of the generated PDF in the user's browser
 */
export function downloadPdfBuffer(pdfBytes: Uint8Array, filename: string = 'student-login-cards.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
