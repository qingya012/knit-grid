import { createDefaultCell, getCell } from "../chart/chartModel";
import type { Chart, ChartCell } from "../types";
import type { CellRect } from "./types";

export interface ClipboardData {
  rows: number;
  cols: number;
  cells: ChartCell[][];
}

export function extractRegion(chart: Chart, rect: CellRect): ClipboardData {
  const rows = rect.endRow - rect.startRow + 1;
  const cols = rect.endCol - rect.startCol + 1;
  const cells: ChartCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: ChartCell[] = [];
    for (let c = 0; c < cols; c++) {
      const src = getCell(chart, rect.startRow + r, rect.startCol + c);
      row.push({ symbolId: src.symbolId, backgroundColor: src.backgroundColor });
    }
    cells.push(row);
  }
  return { rows, cols, cells };
}

export function clearRegionContents(chart: Chart, rect: CellRect): void {
  for (let row = rect.startRow; row <= rect.endRow; row++) {
    for (let col = rect.startCol; col <= rect.endCol; col++) {
      const cell = getCell(chart, row, col);
      const blank = createDefaultCell();
      cell.symbolId = blank.symbolId;
      cell.backgroundColor = blank.backgroundColor;
    }
  }
}

export function pasteRegion(
  chart: Chart,
  anchorRow: number,
  anchorCol: number,
  data: ClipboardData,
): CellRect | null {
  if (data.rows <= 0 || data.cols <= 0) {
    return null;
  }

  let pastedEndRow = anchorRow + data.rows - 1;
  let pastedEndCol = anchorCol + data.cols - 1;
  if (anchorRow >= chart.rows || anchorCol >= chart.cols) {
    return null;
  }

  pastedEndRow = Math.min(pastedEndRow, chart.rows - 1);
  pastedEndCol = Math.min(pastedEndCol, chart.cols - 1);

  const srcRows = pastedEndRow - anchorRow + 1;
  const srcCols = pastedEndCol - anchorCol + 1;

  for (let r = 0; r < srcRows; r++) {
    for (let c = 0; c < srcCols; c++) {
      const src = data.cells[r][c];
      const dest = getCell(chart, anchorRow + r, anchorCol + c);
      dest.symbolId = src.symbolId;
      dest.backgroundColor = src.backgroundColor;
    }
  }

  return {
    startRow: anchorRow,
    startCol: anchorCol,
    endRow: pastedEndRow,
    endCol: pastedEndCol,
  };
}

export function writeRegion(
  chart: Chart,
  rect: CellRect,
  data: ClipboardData,
): void {
  const rows = Math.min(data.rows, rect.endRow - rect.startRow + 1);
  const cols = Math.min(data.cols, rect.endCol - rect.startCol + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const src = data.cells[r][c];
      const dest = getCell(chart, rect.startRow + r, rect.startCol + c);
      dest.symbolId = src.symbolId;
      dest.backgroundColor = src.backgroundColor;
    }
  }
}

export function flipClipboardHorizontal(data: ClipboardData): ClipboardData {
  const cells: ChartCell[][] = [];
  for (let r = 0; r < data.rows; r++) {
    const row: ChartCell[] = [];
    for (let c = 0; c < data.cols; c++) {
      const src = data.cells[r][data.cols - 1 - c];
      row.push({
        symbolId: src.symbolId,
        backgroundColor: src.backgroundColor,
      });
    }
    cells.push(row);
  }
  return { rows: data.rows, cols: data.cols, cells };
}

export function flipClipboardVertical(data: ClipboardData): ClipboardData {
  const cells: ChartCell[][] = [];
  for (let r = 0; r < data.rows; r++) {
    const srcRow = data.cells[data.rows - 1 - r];
    const row: ChartCell[] = [];
    for (let c = 0; c < data.cols; c++) {
      row.push({
        symbolId: srcRow[c].symbolId,
        backgroundColor: srcRow[c].backgroundColor,
      });
    }
    cells.push(row);
  }
  return { rows: data.rows, cols: data.cols, cells };
}

export function flipHorizontal(chart: Chart, rect: CellRect): void {
  const data = extractRegion(chart, rect);
  writeRegion(chart, rect, flipClipboardHorizontal(data));
}

export function flipVertical(chart: Chart, rect: CellRect): void {
  const data = extractRegion(chart, rect);
  writeRegion(chart, rect, flipClipboardVertical(data));
}
