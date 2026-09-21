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
import {
  clearChart,
  createChart,
  getCellBackgroundColor,
  getCellSymbolId,
  setCellBackgroundColor,
  setCellSymbolId,
} from "../chart/chartModel";
import { parseHexColor } from "../colors/hexColor";
import { getClipboard, setClipboard } from "../selection/clipboard";
import type { CellCoord, CellRect } from "../selection/types";
import {
  clearRegionContents,
  extractRegion,
  flipHorizontal,
  flipVertical,
  pasteRegion,
} from "../selection/selectionOps";

export type PaintMode = "symbol" | "color" | "clearColor" | "select";

export class EditorController {
  chart: Chart;
  paintMode: PaintMode = "symbol";
  activeSymbolId: SymbolId = BLANK_SYMBOL_ID;
  activeColor = "#c97a8b";
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
    this.paintMode = "symbol";
    this.activeSymbolId = symbolId;
  }

  setActiveColor(hex: string): void {
    const parsed = parseHexColor(hex);
    if (!parsed) {
      return;
    }
    this.paintMode = "color";
    this.activeColor = parsed;
  }

  setClearColorTool(): void {
    this.paintMode = "clearColor";
  }

  setSelectTool(): void {
    this.paintMode = "select";
    this.endStroke();
  }

  mutateOnce(mutator: () => void): void {
    pushSnapshot(this.history, this.chart.cells);
    mutator();
  }

  copySelection(rect: CellRect): void {
    setClipboard(extractRegion(this.chart, rect));
  }

  cutSelection(rect: CellRect): void {
    const data = extractRegion(this.chart, rect);
    this.mutateOnce(() => {
      setClipboard(data);
      clearRegionContents(this.chart, rect);
    });
  }

  deleteSelection(rect: CellRect): void {
    this.mutateOnce(() => {
      clearRegionContents(this.chart, rect);
    });
  }

  pasteSelection(anchor: CellCoord): CellRect | null {
    const data = getClipboard();
    if (!data) {
      return null;
    }
    let pasted: CellRect | null = null;
    this.mutateOnce(() => {
      pasted = pasteRegion(this.chart, anchor.row, anchor.col, data);
    });
    return pasted;
  }

  flipSelectionHorizontal(rect: CellRect): void {
    this.mutateOnce(() => {
      flipHorizontal(this.chart, rect);
    });
  }

  flipSelectionVertical(rect: CellRect): void {
    this.mutateOnce(() => {
      flipVertical(this.chart, rect);
    });
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
    if (!this.strokeActive || this.paintMode === "select") {
      return false;
    }

    let changed = false;
    if (this.paintMode === "symbol") {
      const current = getCellSymbolId(this.chart, row, col);
      if (current === this.activeSymbolId) {
        return false;
      }
      if (!this.strokeSnapshotTaken) {
        pushSnapshot(this.history, this.chart.cells);
        this.strokeSnapshotTaken = true;
      }
      setCellSymbolId(this.chart, row, col, this.activeSymbolId);
      changed = true;
    } else if (this.paintMode === "color") {
      const current = getCellBackgroundColor(this.chart, row, col);
      if (current === this.activeColor) {
        return false;
      }
      if (!this.strokeSnapshotTaken) {
        pushSnapshot(this.history, this.chart.cells);
        this.strokeSnapshotTaken = true;
      }
      setCellBackgroundColor(this.chart, row, col, this.activeColor);
      changed = true;
    } else if (this.paintMode === "clearColor") {
      const current = getCellBackgroundColor(this.chart, row, col);
      if (current === null) {
        return false;
      }
      if (!this.strokeSnapshotTaken) {
        pushSnapshot(this.history, this.chart.cells);
        this.strokeSnapshotTaken = true;
      }
      setCellBackgroundColor(this.chart, row, col, null);
      changed = true;
    }

    return changed;
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
