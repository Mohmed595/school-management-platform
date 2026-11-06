/**
 * Layout and Coordinate calculations for pdf-lib PDF card engine
 */

export const MM_TO_PT = 2.834645669291339; // 1mm in PDF points

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

export const MARGIN_LEFT_MM = 10;
export const MARGIN_RIGHT_MM = 10;
export const MARGIN_TOP_MM = 10;
export const MARGIN_BOTTOM_MM = 10;

export const HEADER_HEIGHT_MM = 16;

export const CARD_WIDTH_MM = 40;
export const CARD_HEIGHT_MM = 60;

export const HORIZONTAL_GAP_MM = 5;
export const VERTICAL_GAP_MM = 5;

export const CARDS_PER_ROW = 4;
export const ROWS_PER_PAGE = 4;
export const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE; // 16 cards max per page

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

export function getCardPosition(indexOnPage: number) {
  const col = indexOnPage % CARDS_PER_ROW;
  const row = Math.floor(indexOnPage / CARDS_PER_ROW);

  // Total width of 4 cards + 3 gaps = 175mm. Usable page width = 190mm.
  // Center grid horizontally within the margins: (190 - 175) / 2 = 7.5mm offset.
  const startX_mm = MARGIN_LEFT_MM + 7.5 + col * (CARD_WIDTH_MM + HORIZONTAL_GAP_MM);
  
  // Y position measured from top of page in mm
  const topY_mm = MARGIN_TOP_MM + HEADER_HEIGHT_MM + row * (CARD_HEIGHT_MM + VERTICAL_GAP_MM);
  const bottomY_mm = topY_mm + CARD_HEIGHT_MM;

  // In pdf-lib, (0,0) is bottom-left
  const xPt = mmToPt(startX_mm);
  const yPt = mmToPt(PAGE_HEIGHT_MM - bottomY_mm); // bottom-left of card
  const widthPt = mmToPt(CARD_WIDTH_MM);
  const heightPt = mmToPt(CARD_HEIGHT_MM);

  return {
    col,
    row,
    xPt,
    yPt,
    widthPt,
    heightPt,
    topY_mm,
    bottomY_mm,
  };
}
