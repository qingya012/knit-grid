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
  addSessionColor,
  formatColorTitle,
  getSessionColors,
} from "./ui/colorTools";
import {
  bindColorDialog,
  openColorDialog,
  type ColorDialogElements,
} from "./ui/colorDialog";
import { ERASER_ICON_SVG } from "./ui/icons";
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

function themeLabelColor(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-secondary")
    .trim();
  return raw || "#5c5c5c";
}

const canvas = document.getElementById("chart-canvas") as HTMLCanvasElement;
const paletteEl = document.getElementById("symbol-palette")!;
const colorPaletteEl = document.getElementById("color-palette")!;
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

const colorDialog: ColorDialogElements = {
  dialog: document.getElementById("color-dialog") as HTMLDialogElement,
  presetGrid: document.getElementById("color-preset-grid")!,
  selectedPreview: document.getElementById("color-selected-preview")!,
  hexInput: document.getElementById("color-hex-input") as HTMLInputElement,
  btnChooseMore: document.getElementById(
    "btn-choose-more-colors",
  ) as HTMLButtonElement,
  nativePicker: document.getElementById(
    "color-native-picker",
  ) as HTMLInputElement,
  btnCancel: document.getElementById("btn-color-cancel") as HTMLButtonElement,
  btnAdd: document.getElementById("btn-color-add") as HTMLButtonElement,
};

const registry = new SymbolRegistry();
const editor = new EditorController(10, 10);

function refreshCanvas(): void {
  renderChartFrame(canvas, editor.chart, registry, {
    cellSizePx: DISPLAY_CELL_SIZE,
    labelFontSize: 10,
    labelColor: themeLabelColor(),
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
  btn.className = "palette-btn palette-btn--icon";
  btn.innerHTML = ERASER_ICON_SVG;
  btn.setAttribute("aria-label", "Eraser");
  btn.title = "Eraser";
  if (
    editor.paintMode === "symbol" &&
    editor.activeSymbolId === BLANK_SYMBOL_ID
  ) {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    editor.setActiveSymbol(BLANK_SYMBOL_ID);
    refreshToolActiveState();
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

  if (editor.paintMode === "symbol" && sym.id === editor.activeSymbolId) {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    editor.setActiveSymbol(sym.id);
    refreshToolActiveState();
  });
  return btn;
}

function makeCreateButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn palette-btn--icon palette-btn--create";
  btn.textContent = "+";
  btn.setAttribute("aria-label", "Create symbol");
  btn.title = "Create symbol";
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

function makeColorEraserButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn palette-btn--icon";
  btn.innerHTML = ERASER_ICON_SVG;
  btn.setAttribute("aria-label", "Erase color");
  btn.title = "Erase color";
  if (editor.paintMode === "clearColor") {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    editor.setClearColorTool();
    refreshToolActiveState();
  });
  return btn;
}

function makeColorSwatchButton(hex: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "color-swatch-btn";
  btn.style.backgroundColor = hex;
  btn.title = formatColorTitle(hex);
  btn.setAttribute("aria-label", `Color ${formatColorTitle(hex)}`);
  if (editor.paintMode === "color" && editor.activeColor === hex) {
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    editor.setActiveColor(hex);
    refreshToolActiveState();
  });
  return btn;
}

function makeAddColorButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn palette-btn--icon palette-btn--create";
  btn.textContent = "+";
  btn.setAttribute("aria-label", "Add color");
  btn.title = "Add color";
  btn.addEventListener("click", () => {
    openColorDialog(colorDialog);
  });
  return btn;
}

function refreshColorPalette(): void {
  colorPaletteEl.replaceChildren();
  colorPaletteEl.append(
    makeColorEraserButton(),
    ...getSessionColors().map(makeColorSwatchButton),
    makeAddColorButton(),
  );
}

function refreshToolActiveState(): void {
  refreshPalette();
  refreshColorPalette();
}

function refreshLegend(): void {
  const entries = usedSymbolsForLegend(editor.chart, registry);
  legendEl.replaceChildren();
  for (const entry of entries) {
    if (!entry.symbol.trim() && !entry.abbreviation.trim()) {
      continue;
    }
    const item = document.createElement("span");
    item.className = "legend-key-item";

    const cell = document.createElement("span");
    cell.className = "legend-key-cell";

    const symbol = document.createElement("span");
    symbol.className = "legend-key-symbol";
    symbol.textContent = entry.symbol;

    cell.append(symbol);

    const abbr = document.createElement("span");
    abbr.className = "legend-key-abbr";
    abbr.textContent = entry.abbreviation;

    item.append(cell, abbr);
    legendEl.append(item);
  }
}

function refreshAll(): void {
  refreshCanvas();
  refreshToolActiveState();
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

bindColorDialog(colorDialog, (hex) => {
  editor.setActiveColor(hex);
  addSessionColor(editor.activeColor);
  refreshToolActiveState();
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
