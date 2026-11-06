import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';

const FONT_URLS = [
  '/fonts/Cairo-Variable.ttf',
  '/fonts/Amiri-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf',
  'https://raw.githubusercontent.com/alif-type/amiri/main/Amiri-Regular.ttf',
];

let cachedFontBuffer: ArrayBuffer | null = null;

export async function embedArabicFont(pdfDoc: PDFDocument): Promise<PDFFont> {
  pdfDoc.registerFontkit(fontkit);

  if (cachedFontBuffer) {
    try {
      return await pdfDoc.embedFont(cachedFontBuffer, { subset: true });
    } catch (e) {
      console.warn('Failed to embed cached font buffer:', e);
    }
  }

  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        cachedFontBuffer = buffer;
        return await pdfDoc.embedFont(buffer, { subset: true });
      }
    } catch (err) {
      console.warn(`Font fetch failed from ${url}:`, err);
    }
  }

  // Fallback to standard Helvetica if network is unreachable
  return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
}
