import type { ChartCell } from "../types";
import { cloneCells } from "./chartModel";

export interface ChartHistory {
  past: ChartCell[][];
  future: ChartCell[][];
}

export function createHistory(): ChartHistory {
  return { past: [], future: [] };
}

export function pushSnapshot(history: ChartHistory, cells: ChartCell[]): void {
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
  currentCells: ChartCell[],
): ChartCell[] | null {
  if (!canUndo(history)) {
    return null;
  }
  history.future.push(cloneCells(currentCells));
  return history.past.pop()!;
}

export function redo(
  history: ChartHistory,
  currentCells: ChartCell[],
): ChartCell[] | null {
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
