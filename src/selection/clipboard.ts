import type { ChartCell } from "../types";

export interface ClipboardData {
  rows: number;
  cols: number;
  cells: ChartCell[][];
}

let clipboard: ClipboardData | null = null;

function cloneGrid(cells: ChartCell[][]): ChartCell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

export function setClipboard(data: ClipboardData): void {
  clipboard = {
    rows: data.rows,
    cols: data.cols,
    cells: cloneGrid(data.cells),
  };
}

export function getClipboard(): ClipboardData | null {
  if (!clipboard) {
    return null;
  }
  return {
    rows: clipboard.rows,
    cols: clipboard.cols,
    cells: cloneGrid(clipboard.cells),
  };
}

export function hasClipboardData(): boolean {
  return clipboard !== null;
}

export function clearClipboard(): void {
  clipboard = null;
}
