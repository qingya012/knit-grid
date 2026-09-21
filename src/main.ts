import { usedSymbolsForLegend } from "./chart/usedSymbols";
import {
  EditorController,
  type PaintMode,
} from "./editing/editorController";
import { getChartTitle } from "./chart/chartTitle";
import { exportChartImage } from "./export/chartImageExport";
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
import { hasClipboardData } from "./selection/clipboard";
import { SelectionController } from "./selection/selectionController";
import { cellInRect } from "./selection/types";
import {
  COPY_ICON_SVG,
  CUT_ICON_SVG,
  ERASER_ICON_SVG,
  FLIP_H_ICON_SVG,
  FLIP_V_ICON_SVG,
  PASTE_ICON_SVG,
} from "./ui/icons";
import {
  bindChartTitleEditor,
  resetChartTitleToDefault,
  type ChartTitleEditorElements,
} from "./ui/chartTitleEditor";
import {
  bindExportDialog,
  openExportDialog,
  type ExportDialogElements,
} from "./ui/exportDialog";
import { isDialogOpen, isEditableTarget } from "./ui/selectionKeyboard";
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

function themeCssVar(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
}

function themeLabelColor(): string {
  return themeCssVar("--text-secondary", "#5c5c5c");
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
const btnExport = document.getElementById("btn-export") as HTMLButtonElement;
const chartTitleSlot = document.getElementById("chart-title-slot")!;
const chartTitleEditor: ChartTitleEditorElements = {
  container: chartTitleSlot,
};
const btnSelect = document.getElementById("btn-select") as HTMLButtonElement;
const toolbarSelectionActions = document.getElementById(
  "toolbar-selection-actions",
)!;
const btnSelCopy = document.getElementById("btn-sel-copy") as HTMLButtonElement;
const btnSelCut = document.getElementById("btn-sel-cut") as HTMLButtonElement;
const btnSelPaste = document.getElementById(
  "btn-sel-paste",
) as HTMLButtonElement;
const btnSelFlipH = document.getElementById(
  "btn-sel-flip-h",
) as HTMLButtonElement;
const btnSelFlipV = document.getElementById(
  "btn-sel-flip-v",
) as HTMLButtonElement;

btnSelCopy.innerHTML = COPY_ICON_SVG;
btnSelCut.innerHTML = CUT_ICON_SVG;
btnSelPaste.innerHTML = PASTE_ICON_SVG;
btnSelFlipH.innerHTML = FLIP_H_ICON_SVG;
btnSelFlipV.innerHTML = FLIP_V_ICON_SVG;

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

const exportDialog: ExportDialogElements = {
  dialog: document.getElementById("export-dialog") as HTMLDialogElement,
  filenameInput: document.getElementById("export-filename") as HTMLInputElement,
  formatSelect: document.getElementById("export-format") as HTMLSelectElement,
  btnCancel: document.getElementById("btn-export-cancel") as HTMLButtonElement,
  btnExport: document.getElementById("btn-export-confirm") as HTMLButtonElement,
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
const selection = new SelectionController();
let paintModeBeforeSelect: PaintMode = "symbol";
let copyPasteModeActive = false;

function restorePaintMode(mode: PaintMode): void {
  if (mode === "symbol") {
    editor.setActiveSymbol(editor.activeSymbolId);
  } else if (mode === "color") {
    editor.setActiveColor(editor.activeColor);
  } else if (mode === "clearColor") {
    editor.setClearColorTool();
  } else {
    editor.setActiveSymbol(editor.activeSymbolId);
  }
}

function exitSelectToNormal(): void {
  copyPasteModeActive = false;
  selection.clearSelection();
  if (editor.paintMode === "select") {
    restorePaintMode(paintModeBeforeSelect);
  }
  refreshCanvas();
  refreshToolActiveState();
}

function enterSelectMode(): void {
  paintModeBeforeSelect = editor.paintMode;
  editor.setSelectTool();
  refreshToolActiveState();
}

function isSelectionDismissExempt(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) {
    return false;
  }
  if (target === canvas || canvas.contains(target)) {
    return true;
  }
  if (target === btnSelect || btnSelect.contains(target)) {
    return true;
  }
  if (toolbarSelectionActions.contains(target)) {
    return true;
  }
  if (btnExport.contains(target)) {
    return true;
  }
  if (
    isDialogOpen(symbolDialog.dialog) &&
    symbolDialog.dialog.contains(target)
  ) {
    return true;
  }
  if (
    isDialogOpen(colorDialog.dialog) &&
    colorDialog.dialog.contains(target)
  ) {
    return true;
  }
  if (
    isDialogOpen(exportDialog.dialog) &&
    exportDialog.dialog.contains(target)
  ) {
    return true;
  }
  return false;
}

function refreshCanvas(): void {
  renderChartFrame(canvas, editor.chart, registry, {
    cellSizePx: DISPLAY_CELL_SIZE,
    labelFontSize: 10,
    labelColor: themeLabelColor(),
    selectionRect: selection.selection,
    selectionBorderColor: themeCssVar("--selection-border", "#525252"),
    selectionFillColor: themeCssVar("--selection-fill", "rgba(82, 82, 82, 0.12)"),
  });
}

function chartGridBounds(): { gridWidth: number; gridHeight: number } {
  const layout = getChartFrameLayout(editor.chart, DISPLAY_CELL_SIZE);
  return { gridWidth: layout.gridWidth, gridHeight: layout.gridHeight };
}

function refreshToolbar(): void {
  btnUndo.disabled = !editor.canUndo();
  btnRedo.disabled = !editor.canRedo();
  refreshSelectionToolbar();
}

function refreshSelectionToolbar(): void {
  const hasSelection = selection.selection !== null;
  toolbarSelectionActions.hidden = !(hasSelection || copyPasteModeActive);
  btnSelect.classList.toggle("active", editor.paintMode === "select");
  btnSelCopy.classList.toggle("active", copyPasteModeActive);

  btnSelCopy.disabled = !hasSelection;
  btnSelCut.disabled = !hasSelection;
  btnSelFlipH.disabled = !hasSelection;
  btnSelFlipV.disabled = !hasSelection;
  btnSelPaste.disabled = !hasClipboardData() || !hasSelection;
}

function makeEraserButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "palette-btn palette-btn--icon";
  btn.innerHTML = ERASER_ICON_SVG;
  btn.setAttribute("aria-label", "Eraser");
  btn.title = "Eraser";
  if (
    editor.paintMode !== "select" &&
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

  if (
    editor.paintMode !== "select" &&
    editor.paintMode === "symbol" &&
    sym.id === editor.activeSymbolId
  ) {
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
    exitSelectToNormal();
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
  if (editor.paintMode !== "select" && editor.paintMode === "clearColor") {
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
  if (
    editor.paintMode !== "select" &&
    editor.paintMode === "color" &&
    editor.activeColor === hex
  ) {
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
    exitSelectToNormal();
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
  refreshSelectionToolbar();
}

function cellAtPointer(e: PointerEvent): { row: number; col: number } | null {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { gridWidth, gridHeight } = chartGridBounds();
  if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) {
    return null;
  }
  return cellFromPointer(editor.chart, DISPLAY_CELL_SIZE, x, y);
}

function refreshAfterChartMutation(): void {
  refreshCanvas();
  refreshToolbar();
  refreshLegend();
}

function performCopy(): void {
  if (!selection.selection) {
    return;
  }
  editor.copySelection(selection.selection);
  selection.clearSelection();
  copyPasteModeActive = true;
  refreshCanvas();
  refreshSelectionToolbar();
}

function performCut(): void {
  if (!selection.selection) {
    return;
  }
  editor.cutSelection(selection.selection);
  refreshAfterChartMutation();
  exitSelectToNormal();
}

function performDeleteSelection(): void {
  if (!selection.selection) {
    return;
  }
  editor.deleteSelection(selection.selection);
  refreshAfterChartMutation();
}

function performPaste(): void {
  if (!selection.selection || !hasClipboardData()) {
    return;
  }
  const anchor = {
    row: selection.selection.startRow,
    col: selection.selection.startCol,
  };
  const pasted = editor.pasteSelection(anchor);
  if (!pasted) {
    return;
  }
  refreshAfterChartMutation();
  exitSelectToNormal();
}

function performFlipHorizontal(): void {
  if (!selection.selection) {
    return;
  }
  editor.flipSelectionHorizontal(selection.selection);
  refreshAfterChartMutation();
}

function performFlipVertical(): void {
  if (!selection.selection) {
    return;
  }
  editor.flipSelectionVertical(selection.selection);
  refreshAfterChartMutation();
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
  const cell = cellAtPointer(e);
  if (!cell) {
    return;
  }
  if (editor.paintCell(cell.row, cell.col)) {
    refreshAfterChartMutation();
  }
}

function selectAtEvent(e: PointerEvent): void {
  const cell = cellAtPointer(e);
  if (!cell) {
    return;
  }
  if (selection.isDragging()) {
    selection.updateSelect(cell);
  }
  refreshCanvas();
}

btnNewChart.addEventListener("click", () => {
  const rows = Number(inputRows.value) || 10;
  const cols = Number(inputCols.value) || 10;
  editor.newChart(rows, cols);
  selection.clearAll();
  exitSelectToNormal();
  resetChartTitleToDefault(chartTitleEditor);
  refreshToolbar();
  refreshLegend();
});

btnSelect.addEventListener("click", () => {
  if (editor.paintMode === "select") {
    exitSelectToNormal();
    return;
  }
  enterSelectMode();
});

btnSelCopy.addEventListener("click", () => performCopy());
btnSelCut.addEventListener("click", () => performCut());
btnSelPaste.addEventListener("click", () => performPaste());
btnSelFlipH.addEventListener("click", () => performFlipHorizontal());
btnSelFlipV.addEventListener("click", () => performFlipVertical());

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
    exitSelectToNormal();
    refreshToolbar();
    refreshLegend();
  }
});

btnRedo.addEventListener("click", () => {
  if (editor.redo()) {
    exitSelectToNormal();
    refreshToolbar();
    refreshLegend();
  }
});

btnClear.addEventListener("click", () => {
  editor.clear();
  exitSelectToNormal();
  refreshToolbar();
  refreshLegend();
});

bindExportDialog(exportDialog, (basename, format) => {
  exportChartImage(
    editor.chart,
    registry,
    getChartTitle(),
    format,
    basename,
  );
});

btnExport.addEventListener("click", () => {
  openExportDialog(exportDialog);
});

bindChartTitleEditor(chartTitleEditor);

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  if (editor.paintMode === "select") {
    const cell = cellAtPointer(e);
    if (!cell) {
      exitSelectToNormal();
      return;
    }
    if (copyPasteModeActive) {
      selection.beginSelect(cell);
      refreshCanvas();
      refreshSelectionToolbar();
      return;
    }
    if (
      selection.selection &&
      !cellInRect(cell, selection.selection)
    ) {
      exitSelectToNormal();
      return;
    }
    selection.beginSelect(cell);
    refreshCanvas();
    refreshSelectionToolbar();
    return;
  }
  editor.beginStroke();
  paintAtEvent(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.buttons !== 1) {
    return;
  }
  if (editor.paintMode === "select") {
    selectAtEvent(e);
    return;
  }
  paintAtEvent(e);
});

canvas.addEventListener("pointerup", (e) => {
  if (editor.paintMode === "select") {
    const cell = cellAtPointer(e);
    if (cell && selection.isDragging()) {
      selection.endSelect(cell);
    } else {
      selection.cancelDrag();
    }
    refreshCanvas();
    refreshSelectionToolbar();
    return;
  }
  editor.endStroke();
});

canvas.addEventListener("pointercancel", () => {
  if (editor.paintMode === "select") {
    selection.cancelDrag();
    refreshCanvas();
    return;
  }
  editor.endStroke();
});

window.addEventListener("keydown", (e) => {
  if (isEditableTarget(e.target)) {
    return;
  }
  if (
    isDialogOpen(symbolDialog.dialog) ||
    isDialogOpen(colorDialog.dialog) ||
    isDialogOpen(exportDialog.dialog)
  ) {
    return;
  }

  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "c") {
    if (selection.selection) {
      e.preventDefault();
      performCopy();
      refreshSelectionToolbar();
    }
    return;
  }
  if (mod && e.key.toLowerCase() === "x") {
    if (selection.selection) {
      e.preventDefault();
      performCut();
    }
    return;
  }
  if (mod && e.key.toLowerCase() === "v") {
    if (hasClipboardData() && selection.selection) {
      e.preventDefault();
      performPaste();
    }
    return;
  }
  if (e.key === "Escape") {
    if (editor.paintMode === "select") {
      e.preventDefault();
      exitSelectToNormal();
    }
    return;
  }
  if (e.key === "Backspace" || e.key === "Delete") {
    if (selection.selection && editor.paintMode === "select") {
      e.preventDefault();
      performDeleteSelection();
    }
  }
});

document.addEventListener("pointerdown", (e) => {
  if (isSelectionDismissExempt(e.target)) {
    return;
  }
  if (editor.paintMode !== "select" && selection.selection === null) {
    return;
  }
  exitSelectToNormal();
});

refreshAll();
