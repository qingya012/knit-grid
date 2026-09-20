import type { Chart, ChartCell, SymbolId } from "../types";
import { BLANK_SYMBOL_ID } from "../types";

export function createDefaultCell(): ChartCell {
  return { symbolId: BLANK_SYMBOL_ID, backgroundColor: null };
}

export function createChart(rows: number, cols: number): Chart {
  const r = Math.max(1, Math.floor(rows));
  const c = Math.max(1, Math.floor(cols));
  const cells = Array.from({ length: r * c }, () => createDefaultCell());
  return { rows: r, cols: c, cells };
}

export function cellIndex(chart: Chart, row: number, col: number): number {
  return row * chart.cols + col;
}

export function isInBounds(chart: Chart, row: number, col: number): boolean {
  return row >= 0 && row < chart.rows && col >= 0 && col < chart.cols;
}

export function getCell(chart: Chart, row: number, col: number): ChartCell {
  if (!isInBounds(chart, row, col)) {
    throw new RangeError(`Cell out of bounds: (${row}, ${col})`);
  }
  return chart.cells[cellIndex(chart, row, col)];
}

export function getCellSymbolId(
  chart: Chart,
  row: number,
  col: number,
): SymbolId {
  return getCell(chart, row, col).symbolId;
}

export function setCellSymbolId(
  chart: Chart,
  row: number,
  col: number,
  symbolId: SymbolId,
): void {
  if (!isInBounds(chart, row, col)) {
    return;
  }
  chart.cells[cellIndex(chart, row, col)].symbolId = symbolId;
}

export function getCellBackgroundColor(
  chart: Chart,
  row: number,
  col: number,
): string | null {
  return getCell(chart, row, col).backgroundColor;
}

export function setCellBackgroundColor(
  chart: Chart,
  row: number,
  col: number,
  backgroundColor: string | null,
): void {
  if (!isInBounds(chart, row, col)) {
    return;
  }
  chart.cells[cellIndex(chart, row, col)].backgroundColor = backgroundColor;
}

export function clearChart(chart: Chart): void {
  for (let i = 0; i < chart.cells.length; i++) {
    chart.cells[i] = createDefaultCell();
  }
}

export function cloneCells(cells: ChartCell[]): ChartCell[] {
  return cells.map((cell) => ({ ...cell }));
}
