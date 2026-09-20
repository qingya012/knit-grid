import type { SymbolId } from "../types";
import { cloneCells } from "./chartModel";

export interface ChartHistory {
  past: SymbolId[][];
  future: SymbolId[][];
}

export function createHistory(): ChartHistory {
  return { past: [], future: [] };
}

export function pushSnapshot(history: ChartHistory, cells: SymbolId[]): void {
  history.past.push(cloneCells(cells));
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
  currentCells: SymbolId[],
): SymbolId[] | null {
  if (!canUndo(history)) {
    return null;
  }
  history.future.push(cloneCells(currentCells));
  return history.past.pop()!;
}

export function redo(
  history: ChartHistory,
  currentCells: SymbolId[],
): SymbolId[] | null {
  if (!canRedo(history)) {
    return null;
  }
  history.past.push(cloneCells(currentCells));
  return history.future.pop()!;
}

export function resetHistory(history: ChartHistory): void {
  history.past = [];
  history.future = [];
}
