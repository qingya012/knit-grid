import type { ChartCell, StitchSymbol, SymbolId } from "../types";
import { cloneCells } from "./chartModel";

export interface PaletteSnapshot {
  userSymbols: StitchSymbol[];
  sessionColors: string[];
  paintMode: string;
  activeSymbolId: SymbolId;
  activeColor: string;
}

export interface HistorySnapshot {
  cells: ChartCell[];
  palette?: PaletteSnapshot;
}

export interface ChartHistory {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

function clonePalette(palette: PaletteSnapshot): PaletteSnapshot {
  return {
    userSymbols: palette.userSymbols.map((s) => ({ ...s })),
    sessionColors: [...palette.sessionColors],
    paintMode: palette.paintMode,
    activeSymbolId: palette.activeSymbolId,
    activeColor: palette.activeColor,
  };
}

function cloneSnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return {
    cells: cloneCells(snapshot.cells),
    palette: snapshot.palette ? clonePalette(snapshot.palette) : undefined,
  };
}

export function createHistory(): ChartHistory {
  return { past: [], future: [] };
}

export function pushSnapshot(
  history: ChartHistory,
  snapshot: HistorySnapshot,
): void {
  history.past.push(cloneSnapshot(snapshot));
  history.future = [];
}

export function canUndo(history: ChartHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: ChartHistory): boolean {
  return history.future.length > 0;
}

export function undo(
  history: ChartHistory,
  current: HistorySnapshot,
): HistorySnapshot | null {
  if (!canUndo(history)) {
    return null;
  }
  history.future.push(cloneSnapshot(current));
  return cloneSnapshot(history.past.pop()!);
}

export function redo(
  history: ChartHistory,
  current: HistorySnapshot,
): HistorySnapshot | null {
  if (!canRedo(history)) {
    return null;
  }
  history.past.push(cloneSnapshot(current));
  return cloneSnapshot(history.future.pop()!);
}

export function resetHistory(history: ChartHistory): void {
  history.past = [];
  history.future = [];
}
