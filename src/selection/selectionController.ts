import { clearClipboard } from "./clipboard";
import type { CellCoord, CellRect } from "./types";
import { normalizeRect, rectFromAnchorAndCell } from "./types";

export class SelectionController {
  selection: CellRect | null = null;
  pasteAnchor: CellCoord | null = null;

  private dragAnchor: CellCoord | null = null;
  private dragMoved = false;

  beginSelect(cell: CellCoord): void {
    this.dragAnchor = { row: cell.row, col: cell.col };
    this.dragMoved = false;
    this.selection = normalizeRect(cell.row, cell.col, cell.row, cell.col);
    this.pasteAnchor = { row: cell.row, col: cell.col };
  }

  updateSelect(cell: CellCoord): void {
    if (!this.dragAnchor) {
      return;
    }
    if (cell.row !== this.dragAnchor.row || cell.col !== this.dragAnchor.col) {
      this.dragMoved = true;
    }
    this.selection = rectFromAnchorAndCell(this.dragAnchor, cell);
  }

  endSelect(cell: CellCoord): void {
    if (!this.dragAnchor) {
      return;
    }
    if (!this.dragMoved) {
      this.selection = normalizeRect(cell.row, cell.col, cell.row, cell.col);
      this.pasteAnchor = { row: cell.row, col: cell.col };
    } else {
      this.selection = rectFromAnchorAndCell(this.dragAnchor, cell);
      this.pasteAnchor = {
        row: this.selection.startRow,
        col: this.selection.startCol,
      };
    }
    this.dragAnchor = null;
    this.dragMoved = false;
  }

  cancelDrag(): void {
    this.dragAnchor = null;
    this.dragMoved = false;
  }

  isDragging(): boolean {
    return this.dragAnchor !== null;
  }

  clearSelection(): void {
    this.selection = null;
    this.pasteAnchor = null;
    this.cancelDrag();
  }

  clearAll(): void {
    this.clearSelection();
    clearClipboard();
  }

  setSelection(rect: CellRect): void {
    this.selection = rect;
  }

  setPasteAnchor(cell: CellCoord): void {
    this.pasteAnchor = { row: cell.row, col: cell.col };
  }
}
