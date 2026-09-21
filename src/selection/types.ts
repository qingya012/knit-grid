export interface CellRect {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface CellCoord {
  row: number;
  col: number;
}

export function normalizeRect(
  row0: number,
  col0: number,
  row1: number,
  col1: number,
): CellRect {
  return {
    startRow: Math.min(row0, row1),
    startCol: Math.min(col0, col1),
    endRow: Math.max(row0, row1),
    endCol: Math.max(col0, col1),
  };
}

export function rectFromAnchorAndCell(
  anchor: CellCoord,
  cell: CellCoord,
): CellRect {
  return normalizeRect(anchor.row, anchor.col, cell.row, cell.col);
}

export function rectWidth(rect: CellRect): number {
  return rect.endCol - rect.startCol + 1;
}

export function rectHeight(rect: CellRect): number {
  return rect.endRow - rect.startRow + 1;
}

export function cellInRect(cell: CellCoord, rect: CellRect): boolean {
  return (
    cell.row >= rect.startRow &&
    cell.row <= rect.endRow &&
    cell.col >= rect.startCol &&
    cell.col <= rect.endCol
  );
}
