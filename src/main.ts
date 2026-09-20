import { usedSymbolsForLegend } from "./chart/usedSymbols";
import { EditorController } from "./editing/editorController";
import { exportChartPng } from "./export/pngExport";
import {
  cellFromPointer,
  getChartFrameLayout,
  renderChartFrame,
} from "./render/chartRenderer";
import { SymbolRegistry } from "./symbols/symbolRegistry";
import {
  bindSymbolDialog,
  closeSymbolDialog,
  DUPLICATE_SYMBOL_MESSAGE,
  openSymbolDialog,
  showDuplicateSymbolToast,
  type SymbolDialogElements,
} from "./ui/symbolDialog";
import { BLANK_SYMBOL_ID } from "./types";

const DISPLAY_CELL_SIZE = 28;

const canvas = document.getElementById("chart-canvas") as HTMLCanvasElement;
const paletteEl = document.getElementById("symbol-palette")!;
const legendEl = document.getElementById("legend-preview")!;
const inputRows = document.getElementById("input-rows") as HTMLInputElement;
const inputCols = document.getElementById("input-cols") as HTMLInputElement;
const btnNewChart = document.getElementById("btn-new-chart")!;
const btnUndo = document.getElementById("btn-undo") as HTMLButtonElement;
const btnRedo = document.getElementById("btn-redo") as HTMLButtonElement;
const btnClear = document.getElementById("btn-clear")!;
const btnExport = document.getElementById("btn-export")!;

const symbolDialog: SymbolDialogElements = {
  dialog: document.getElementById("symbol-dialog") as HTMLDialogElement,
  stitchControlSlot: document.getElementById("stitch-control-slot")!,
  presetSelect: document.getElementById("stitch-preset") as HTMLSelectElement,
  symbolInput: document.getElementById("modal-symbol-char") as HTMLInputElement,
  btnUsePreset: document.getElementById(
    "btn-use-preset",
  ) as HTMLButtonElement,
  errorEl: document.getElementById("create-symbol-error")!,
  toastEl: document.getElementById("symbol-dialog-toast")!,
  btnCancel: document.getElementById("btn-dialog-cancel") as HTMLButtonElement,
  btnCreate: document.getElementById("btn-dialog-create") as HTMLButtonElement,
};

const registry = new SymbolRegistry();
const editor = new EditorController(10, 10);

function refreshCanvas(): void {
  renderChartFrame(canvas, editor.chart, registry, {
    cellSizePx: DISPLAY_CELL_SIZE,
  });
}

function chartGridBounds(): { gridWidth: number; gridHeight: number } {
  const layout = getChartFrameLayout(editor.chart, DISPLAY_CELL_SIZE);
  return { gridWidth: layout.gridWidth, gridHeight: layout.gridHeight };
}

function refreshToolbar(): void {
  btnUndo.disabled = !editor.canUndo();
  btnRedo.disabled = !editor.canRedo();
}

function makeEraserButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn";
  btn.textContent = "Eraser";
  btn.title = "Erase cells (blank)";
  if (editor.activeSymbolId === BLANK_SYMBOL_ID) {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    editor.setActiveSymbol(BLANK_SYMBOL_ID);
    refreshPalette();
  });
  return btn;
}

function makeSymbolButton(sym: {
  id: string;
  symbol: string;
  abbreviation: string;
}): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn palette-btn--inline";
  btn.title = sym.abbreviation;

  const abbr = document.createElement("span");
  abbr.className = "palette-abbr";
  abbr.textContent = sym.abbreviation;

  const glyph = document.createElement("span");
  glyph.className = "palette-symbol";
  glyph.textContent = sym.symbol;

  btn.append(glyph, abbr);

  if (sym.id === editor.activeSymbolId) {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    editor.setActiveSymbol(sym.id);
    refreshPalette();
  });
  return btn;
}

function makeCreateButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn palette-btn--create";
  btn.textContent = "+ Create Symbol";
  btn.addEventListener("click", () => {
    openSymbolDialog(symbolDialog);
  });
  return btn;
}

function refreshPalette(): void {
  paletteEl.replaceChildren();
  paletteEl.append(
    makeEraserButton(),
    ...registry.getUserSymbols().map(makeSymbolButton),
    makeCreateButton(),
  );
}

function refreshLegend(): void {
  const entries = usedSymbolsForLegend(editor.chart, registry);
  legendEl.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "legend-empty";
    empty.textContent = "(none)";
    legendEl.append(empty);
    return;
  }
  for (const entry of entries) {
    const item = document.createElement("span");
    item.className = "legend-key-item";

    const cell = document.createElement("span");
    cell.className = "legend-key-cell";
    cell.textContent = entry.symbol;

    const abbr = document.createElement("span");
    abbr.className = "legend-key-abbr";
    abbr.textContent = entry.abbreviation;

    item.append(cell, abbr);
    legendEl.append(item);
  }
}

function refreshAll(): void {
  refreshCanvas();
  refreshPalette();
  refreshToolbar();
  refreshLegend();
}

function paintAtEvent(e: PointerEvent): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { gridWidth, gridHeight } = chartGridBounds();
  if (x >= gridWidth || y >= gridHeight) {
    return;
  }
  const cell = cellFromPointer(editor.chart, DISPLAY_CELL_SIZE, x, y);
  if (!cell) {
    return;
  }
  if (editor.paintCell(cell.row, cell.col)) {
    refreshCanvas();
    refreshToolbar();
    refreshLegend();
  }
}

btnNewChart.addEventListener("click", () => {
  const rows = Number(inputRows.value) || 10;
  const cols = Number(inputCols.value) || 10;
  editor.newChart(rows, cols);
  refreshAll();
});

bindSymbolDialog(symbolDialog, (values) => {
  try {
    const created = registry.addCustomSymbol(values);
    editor.setActiveSymbol(created.id);
    closeSymbolDialog(symbolDialog);
    refreshAll();
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === DUPLICATE_SYMBOL_MESSAGE
    ) {
      showDuplicateSymbolToast(symbolDialog);
      return;
    }
    symbolDialog.errorEl.hidden = false;
    symbolDialog.errorEl.textContent =
      err instanceof Error ? err.message : "Could not create symbol.";
  }
});

btnUndo.addEventListener("click", () => {
  if (editor.undo()) {
    refreshCanvas();
    refreshToolbar();
    refreshLegend();
  }
});

btnRedo.addEventListener("click", () => {
  if (editor.redo()) {
    refreshCanvas();
    refreshToolbar();
    refreshLegend();
  }
});

btnClear.addEventListener("click", () => {
  editor.clear();
  refreshAll();
});

btnExport.addEventListener("click", () => {
  exportChartPng(editor.chart, registry);
});

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  editor.beginStroke();
  paintAtEvent(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.buttons !== 1) {
    return;
  }
  paintAtEvent(e);
});

canvas.addEventListener("pointerup", () => {
  editor.endStroke();
});

canvas.addEventListener("pointercancel", () => {
  editor.endStroke();
});

refreshAll();
