import type { Chart, SymbolId } from "../types";
import { BLANK_SYMBOL_ID } from "../types";

export function createChart(rows: number, cols: number): Chart {
  const r = Math.max(1, Math.floor(rows));
  const c = Math.max(1, Math.floor(cols));
  const cells = Array.from({ length: r * c }, () => BLANK_SYMBOL_ID);
  return { rows: r, cols: c, cells };
}

export function cellIndex(chart: Chart, row: number, col: number): number {
  return row * chart.cols + col;
}

export function isInBounds(chart: Chart, row: number, col: number): boolean {
  return row >= 0 && row < chart.rows && col >= 0 && col < chart.cols;
}

export function getCell(chart: Chart, row: number, col: number): SymbolId {
  if (!isInBounds(chart, row, col)) {
    throw new RangeError(`Cell out of bounds: (${row}, ${col})`);
  }
  return chart.cells[cellIndex(chart, row, col)];
}

export function setCell(
  chart: Chart,
  row: number,
  col: number,
  symbolId: SymbolId,
): void {
  if (!isInBounds(chart, row, col)) {
    return;
  }
  chart.cells[cellIndex(chart, row, col)] = symbolId;
}

export function clearChart(chart: Chart): void {
  chart.cells.fill(BLANK_SYMBOL_ID);
}

export function cloneCells(cells: SymbolId[]): SymbolId[] {
  return cells.slice();
}
