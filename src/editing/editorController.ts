import type { Chart, SymbolId } from "../types";
import { BLANK_SYMBOL_ID } from "../types";
import {
  canRedo,
  canUndo,
  createHistory,
  pushSnapshot,
  redo,
  resetHistory,
  undo,
  type ChartHistory,
} from "../chart/chartHistory";
import { clearChart, createChart, getCell, setCell } from "../chart/chartModel";

export class EditorController {
  chart: Chart;
  activeSymbolId: SymbolId = BLANK_SYMBOL_ID;
  readonly history: ChartHistory = createHistory();

  private strokeActive = false;
  private strokeSnapshotTaken = false;

  constructor(rows: number, cols: number) {
    this.chart = createChart(rows, cols);
  }

  newChart(rows: number, cols: number): void {
    this.chart = createChart(rows, cols);
    resetHistory(this.history);
    this.strokeActive = false;
    this.strokeSnapshotTaken = false;
  }

  setActiveSymbol(symbolId: SymbolId): void {
    this.activeSymbolId = symbolId;
  }

  beginStroke(): void {
    this.strokeActive = true;
    this.strokeSnapshotTaken = false;
  }

  endStroke(): void {
    this.strokeActive = false;
    this.strokeSnapshotTaken = false;
  }

  paintCell(row: number, col: number): boolean {
    if (!this.strokeActive) {
      return false;
    }
    if (!this.strokeSnapshotTaken) {
      pushSnapshot(this.history, this.chart.cells);
      this.strokeSnapshotTaken = true;
    }
    const current = getCell(this.chart, row, col);
    if (current === this.activeSymbolId) {
      return false;
    }
    setCell(this.chart, row, col, this.activeSymbolId);
    return true;
  }

  undo(): boolean {
    const prev = undo(this.history, this.chart.cells);
    if (prev === null) {
      return false;
    }
    this.chart.cells = prev;
    return true;
  }

  redo(): boolean {
    const next = redo(this.history, this.chart.cells);
    if (next === null) {
      return false;
    }
    this.chart.cells = next;
    return true;
  }

  clear(): void {
    pushSnapshot(this.history, this.chart.cells);
    clearChart(this.chart);
  }

  canUndo(): boolean {
    return canUndo(this.history);
  }

  canRedo(): boolean {
    return canRedo(this.history);
  }
}
