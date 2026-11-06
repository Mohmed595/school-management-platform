import bidiFactory from 'bidi-js';
import type { PDFPage, PDFFont, RGB } from 'pdf-lib';
import { rgb } from 'pdf-lib';

const bidi = bidiFactory();

interface CharMap {
  code: number;
  isolated: number;
  end: number;
  middle: number;
  beginning: number;
}

// Unicode Arabic characters mapping table
const ARABIC_CHARS: Record<number, CharMap> = {
  0x0621: { code: 0x0621, isolated: 0xfe80, end: 0xfe80, middle: 0xfe80, beginning: 0xfe80 }, // HAMZA
  0x0622: { code: 0x0622, isolated: 0xfe81, end: 0xfe82, middle: 0xfe82, beginning: 0xfe81 }, // ALEF WITH MADDA ABOVE
  0x0623: { code: 0x0623, isolated: 0xfe83, end: 0xfe84, middle: 0xfe84, beginning: 0xfe83 }, // ALEF WITH HAMZA ABOVE
  0x0624: { code: 0x0624, isolated: 0xfe85, end: 0xfe86, middle: 0xfe86, beginning: 0xfe85 }, // WAW WITH HAMZA ABOVE
  0x0625: { code: 0x0625, isolated: 0xfe87, end: 0xfe88, middle: 0xfe88, beginning: 0xfe87 }, // ALEF WITH HAMZA BELOW
  0x0626: { code: 0x0626, isolated: 0xfe89, end: 0xfe8a, middle: 0xfe8b, beginning: 0xfe8c }, // YEH WITH HAMZA ABOVE
  0x0627: { code: 0x0627, isolated: 0xfe8d, end: 0xfe8e, middle: 0xfe8e, beginning: 0xfe8d }, // ALEF
  0x0628: { code: 0x0628, isolated: 0xfe8f, end: 0xfe90, middle: 0xfe91, beginning: 0xfe92 }, // BEH
  0x0629: { code: 0x0629, isolated: 0xfe93, end: 0xfe94, middle: 0xfe94, beginning: 0xfe93 }, // TEH MARBUTA
  0x062a: { code: 0x062a, isolated: 0xfe95, end: 0xfe96, middle: 0xfe97, beginning: 0xfe98 }, // TEH
  0x062b: { code: 0x062b, isolated: 0xfe99, end: 0xfe9a, middle: 0xfe9b, beginning: 0xfe9c }, // THEH
  0x062c: { code: 0x062c, isolated: 0xfe9d, end: 0xfe9e, middle: 0xfe9f, beginning: 0xfea0 }, // JEEM
  0x062d: { code: 0x062d, isolated: 0xfea1, end: 0xfea2, middle: 0xfea3, beginning: 0xfea4 }, // HAH
  0x062e: { code: 0x062e, isolated: 0xfea5, end: 0xfea6, middle: 0xfea7, beginning: 0xfea8 }, // KHAH
  0x062f: { code: 0x062f, isolated: 0xfea9, end: 0xfeaa, middle: 0xfeaa, beginning: 0xfea9 }, // DAL
  0x0630: { code: 0x0630, isolated: 0xfeab, end: 0xfeac, middle: 0xfeac, beginning: 0xfeab }, // THAL
  0x0631: { code: 0x0631, isolated: 0xfead, end: 0xfeae, middle: 0xfeae, beginning: 0xfead }, // REH
  0x0632: { code: 0x0632, isolated: 0xfeaf, end: 0xfeb0, middle: 0xfeb0, beginning: 0xfeaf }, // ZAIN
  0x0633: { code: 0x0633, isolated: 0xfeb1, end: 0xfeb2, middle: 0xfeb3, beginning: 0xfeb4 }, // SEEN
  0x0634: { code: 0x0634, isolated: 0xfeb5, end: 0xfeb6, middle: 0xfeb7, beginning: 0xfeb8 }, // SHEEN
  0x0635: { code: 0x0635, isolated: 0xfeb9, end: 0xfeba, middle: 0xfebb, beginning: 0xfebc }, // SAD
  0x0636: { code: 0x0636, isolated: 0xfebd, end: 0xfebe, middle: 0xfebf, beginning: 0xfec0 }, // DAD
  0x0637: { code: 0x0637, isolated: 0xfec1, end: 0xfec2, middle: 0xfec3, beginning: 0xfec4 }, // TAH
  0x0638: { code: 0x0638, isolated: 0xfec5, end: 0xfec6, middle: 0xfec7, beginning: 0xfec8 }, // ZAH
  0x0639: { code: 0x0639, isolated: 0xfec9, end: 0xfeca, middle: 0xfecb, beginning: 0xfecc }, // AIN
  0x063a: { code: 0x063a, isolated: 0xfecd, end: 0xfece, middle: 0xfecf, beginning: 0xfed0 }, // GHAIN
  0x0641: { code: 0x0641, isolated: 0xfed1, end: 0xfed2, middle: 0xfed3, beginning: 0xfed4 }, // FEH
  0x0642: { code: 0x0642, isolated: 0xfed5, end: 0xfed6, middle: 0xfed7, beginning: 0xfed8 }, // QAF
  0x0643: { code: 0x0643, isolated: 0xfed9, end: 0xfeda, middle: 0xfedb, beginning: 0xfedc }, // KAF
  0x0644: { code: 0x0644, isolated: 0xfedd, end: 0xfede, middle: 0xfedf, beginning: 0xfee0 }, // LAM
  0x0645: { code: 0x0645, isolated: 0xfee1, end: 0xfee2, middle: 0xfee3, beginning: 0xfee4 }, // MEEM
  0x0646: { code: 0x0646, isolated: 0xfee5, end: 0xfee6, middle: 0xfee7, beginning: 0xfee8 }, // NOON
  0x0647: { code: 0x0647, isolated: 0xfee9, end: 0xfeea, middle: 0xfeeb, beginning: 0xfeec }, // HAH
  0x0648: { code: 0x0648, isolated: 0xfeed, end: 0xfeee, middle: 0xfeee, beginning: 0xfeed }, // WAW
  0x0649: { code: 0x0649, isolated: 0xfeef, end: 0xfef0, middle: 0xfef0, beginning: 0xfeef }, // ALEF MAKSURA
  0x064a: { code: 0x064a, isolated: 0xfef1, end: 0xfef2, middle: 0xfef3, beginning: 0xfef4 }, // YEH
  0x067e: { code: 0x067e, isolated: 0xfb56, end: 0xfb57, middle: 0xfb58, beginning: 0xfb59 }, // PEH
  0x0686: { code: 0x0686, isolated: 0xfb7a, end: 0xfb7b, middle: 0xfb7c, beginning: 0xfb7d }, // TCHEH
  0x0698: { code: 0x0698, isolated: 0xfb8a, end: 0xfb8b, middle: 0xfb8b, beginning: 0xfb8a }, // JEH
  0x06af: { code: 0x06af, isolated: 0xfb92, end: 0xfb93, middle: 0xfb94, beginning: 0xfb95 }, // GAF
};

// Non-connecting Arabic letters
const NON_CONNECTING_NEXT = new Set([
  0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x062f, 0x0630, 0x0631, 0x0632, 0x0648, 0x0649, 0x0698,
]);

function isArabic(code: number): boolean {
  return (code >= 0x0600 && code <= 0x06ff) || (code >= 0xfb50 && code <= 0xfdff) || (code >= 0xfe70 && code <= 0xfefc);
}

function connectsBefore(code: number): boolean {
  if (!isArabic(code)) return false;
  const map = ARABIC_CHARS[code];
  if (!map) return false;
  return map.end !== map.isolated || map.middle !== map.beginning;
}

function connectsNext(code: number): boolean {
  if (!isArabic(code)) return false;
  return !NON_CONNECTING_NEXT.has(code) && ARABIC_CHARS[code] !== undefined;
}

/**
 * Contextual Arabic Reshaping (combines isolated characters into presentation forms)
 */
export function shapeArabicText(text: string): string {
  if (!text) return '';

  const chars = Array.from(text);
  const codes = chars.map((c) => c.charCodeAt(0));
  const shapedCodes: number[] = [];

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const map = ARABIC_CHARS[code];

    if (!map) {
      shapedCodes.push(code);
      continue;
    }

    const prevCode = i > 0 ? codes[i - 1] : 0;
    const nextCode = i < codes.length - 1 ? codes[i + 1] : 0;

    const connectPrev = i > 0 && connectsNext(prevCode) && connectsBefore(code);
    const connectNext = i < codes.length - 1 && connectsNext(code) && connectsBefore(nextCode);

    // Handle Lam-Alef ligatures
    if (code === 0x0644 && i < codes.length - 1) {
      const nextC = codes[i + 1];
      let ligature: number | null = null;
      if (nextC === 0x0622) ligature = connectPrev ? 0xfef6 : 0xfef5;
      else if (nextC === 0x0623) ligature = connectPrev ? 0xfef8 : 0xfef7;
      else if (nextC === 0x0625) ligature = connectPrev ? 0xfefa : 0xfef9;
      else if (nextC === 0x0627) ligature = connectPrev ? 0xfefc : 0xfefb;

      if (ligature !== null) {
        shapedCodes.push(ligature);
        i++; // skip next alef
        continue;
      }
    }

    if (connectPrev && connectNext) {
      shapedCodes.push(map.middle);
    } else if (connectPrev) {
      shapedCodes.push(map.end);
    } else if (connectNext) {
      shapedCodes.push(map.beginning);
    } else {
      shapedCodes.push(map.isolated);
    }
  }

  return String.fromCharCode(...shapedCodes);
}

/**
 * Processes Arabic text through reshaping + Unicode BiDi reordering (bidi-js)
 */
export function processArabicForPdf(text: string): string {
  if (!text) return '';
  const shaped = shapeArabicText(text);

  // Apply bidi-js reordering
  const embeddingLevels = bidi.getEmbeddingLevels(shaped, 'rtl');
  return bidi.getReorderedString(shaped, embeddingLevels);
}

// Retain backward compatibility export
export const reshapeArabic = processArabicForPdf;

export interface DrawArabicTextOptions {
  x: number;
  y: number;
  font: PDFFont;
  size: number;
  color?: RGB;
  maxWidth?: number;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * High-level helper for drawing Arabic & mixed text in pdf-lib with reshaped glyphs and BiDi support
 */
export function drawArabicText(page: PDFPage, text: string, options: DrawArabicTextOptions) {
  if (!text) return;

  const {
    x,
    y,
    font,
    size: initialSize,
    color = rgb(0, 0, 0),
    maxWidth,
    alignment = 'left',
  } = options;

  // Process reshaped + bidi string
  const processedText = processArabicForPdf(text);

  let size = initialSize;
  let textWidth = font.widthOfTextAtSize(processedText, size);

  // Scale down automatically if text exceeds maxWidth
  if (maxWidth && maxWidth > 0 && textWidth > maxWidth) {
    size = Math.max(5, size * (maxWidth / textWidth));
    textWidth = font.widthOfTextAtSize(processedText, size);
  }

  let drawX = x;
  if (alignment === 'center') {
    if (maxWidth && maxWidth > 0) {
      drawX = x + (maxWidth - textWidth) / 2;
    } else {
      drawX = x - textWidth / 2;
    }
  } else if (alignment === 'right') {
    if (maxWidth && maxWidth > 0) {
      drawX = x + maxWidth - textWidth;
    } else {
      drawX = x - textWidth;
    }
  }

  page.drawText(processedText, {
    x: drawX,
    y,
    size,
    font,
    color,
  });
}

