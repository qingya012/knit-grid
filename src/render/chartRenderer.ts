import { visibleColLabels, visibleRowLabels } from "../chart/chartNumbering";
import type { Chart } from "../types";
import { BLANK_SYMBOL_ID } from "../types";
import type { SymbolRegistry } from "../symbols/symbolRegistry";
import { getCell } from "../chart/chartModel";
import { symbolFillColor } from "./cellContrast";
import type { CellRect } from "../selection/types";
import { FONT_SYMBOL_GLYPH, FONT_UI } from "./fontStacks";

export interface RenderOptions {
  cellSizePx: number;
  lineWidth?: number;
  background?: string;
  lineColor?: string;
  textColor?: string;
  labelFontSize?: number;
  labelColor?: string;
  selectionRect?: CellRect | null;
  selectionBorderColor?: string;
  selectionFillColor?: string;
}

export interface RenderedSize {
  width: number;
  height: number;
}

export interface ChartFrameLayout {
  gridWidth: number;
  gridHeight: number;
  frameWidth: number;
  frameHeight: number;
  rowLabelWidth: number;
  colLabelHeight: number;
}

export interface RenderedFrameSize extends RenderedSize {
  gridWidth: number;
  gridHeight: number;
}

type CoreRenderOptions = Required<
  Omit<
    RenderOptions,
    "cellSizePx" | "selectionRect" | "selectionBorderColor" | "selectionFillColor"
  >
>;

const DEFAULT_OPTIONS: CoreRenderOptions & { cellSizePx: number } = {
  cellSizePx: 20,
  lineWidth: 1,
  background: "#ffffff",
  lineColor: "#333333",
  textColor: "#111111",
  labelFontSize: 12,
  labelColor: "#666666",
};

const ROW_LABEL_GAP_PX = 6;
const COL_LABEL_GAP_PX = 4;

export function chartPixelSize(
  chart: Chart,
  cellSizePx: number,
  lineWidth = 1,
): { width: number; height: number } {
  return {
    width: chart.cols * cellSizePx + lineWidth,
    height: chart.rows * cellSizePx + lineWidth,
  };
}

function measureRowLabelWidth(
  ctx: CanvasRenderingContext2D,
  chart: Chart,
  labelFontSize: number,
): number {
  ctx.font = `${labelFontSize}px ${FONT_UI}`;
  const sample = String(chart.rows);
  return Math.ceil(ctx.measureText(sample).width);
}

export function getChartFrameLayout(
  chart: Chart,
  cellSizePx: number,
  options: Pick<RenderOptions, "lineWidth" | "labelFontSize"> = {},
): ChartFrameLayout {
  const lineWidth = options.lineWidth ?? 1;
  const labelFontSize = options.labelFontSize ?? DEFAULT_OPTIONS.labelFontSize;
  const { width: gridWidth, height: gridHeight } = chartPixelSize(
    chart,
    cellSizePx,
    lineWidth,
  );

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let rowLabelWidth = 20;
  if (ctx) {
    rowLabelWidth =
      measureRowLabelWidth(ctx, chart, labelFontSize) + ROW_LABEL_GAP_PX;
  }

  const colLabelHeight = labelFontSize + COL_LABEL_GAP_PX * 2;

  return {
    gridWidth,
    gridHeight,
    frameWidth: gridWidth + rowLabelWidth,
    frameHeight: gridHeight + colLabelHeight,
    rowLabelWidth,
    colLabelHeight,
  };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  chart: Chart,
  registry: SymbolRegistry,
  opts: CoreRenderOptions & { cellSizePx: number },
  originX: number,
  originY: number,
): { gridWidth: number; gridHeight: number } {
  const cell = opts.cellSizePx;
  const gridWidth = chart.cols * cell + opts.lineWidth;
  const gridHeight = chart.rows * cell + opts.lineWidth;

  ctx.fillStyle = opts.background;
  ctx.fillRect(originX, originY, gridWidth, gridHeight);

  for (let row = 0; row < chart.rows; row++) {
    for (let col = 0; col < chart.cols; col++) {
      const cellData = getCell(chart, row, col);
      if (cellData.backgroundColor !== null) {
        ctx.fillStyle = cellData.backgroundColor;
        ctx.fillRect(
          originX + col * cell,
          originY + row * cell,
          cell,
          cell,
        );
      }
    }
  }

  const fontSize = Math.round(cell * 0.55);
  ctx.font = `${fontSize}px ${FONT_SYMBOL_GLYPH}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let row = 0; row < chart.rows; row++) {
    for (let col = 0; col < chart.cols; col++) {
      const cellData = getCell(chart, row, col);
      const symbolId = cellData.symbolId;
      if (symbolId === BLANK_SYMBOL_ID) {
        continue;
      }
      const def = registry.get(symbolId);
      const glyph = def?.symbol ?? "";
      if (!glyph) {
        continue;
      }
      ctx.fillStyle = symbolFillColor(cellData.backgroundColor);
      const x = originX + col * cell + cell / 2;
      const y = originY + row * cell + cell / 2;
      ctx.fillText(glyph, x, y);
    }
  }

  ctx.strokeStyle = opts.lineColor;
  ctx.lineWidth = opts.lineWidth;
  ctx.beginPath();
  for (let c = 0; c <= chart.cols; c++) {
    const x = originX + c * cell + 0.5;
    ctx.moveTo(x, originY);
    ctx.lineTo(x, originY + gridHeight);
  }
  for (let r = 0; r <= chart.rows; r++) {
    const y = originY + r * cell + 0.5;
    ctx.moveTo(originX, y);
    ctx.lineTo(originX + gridWidth, y);
  }
  ctx.stroke();

  return { gridWidth, gridHeight };
}

function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  rect: CellRect,
  cellSizePx: number,
  lineWidth: number,
  borderColor: string,
  fillColor: string,
): void {
  const inset = lineWidth / 2;
  const x = rect.startCol * cellSizePx + inset;
  const y = rect.startRow * cellSizePx + inset;
  const w = (rect.endCol - rect.startCol + 1) * cellSizePx - lineWidth;
  const h = (rect.endRow - rect.startRow + 1) * cellSizePx - lineWidth;

  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawFrameLabels(
  ctx: CanvasRenderingContext2D,
  chart: Chart,
  layout: ChartFrameLayout,
  opts: CoreRenderOptions & { cellSizePx: number },
): void {
  const cell = opts.cellSizePx;
  ctx.fillStyle = opts.labelColor;
  ctx.font = `${opts.labelFontSize}px ${FONT_UI}`;

  const rowLabels = visibleRowLabels(chart.rows);
  const rowLabelCenterX =
    layout.gridWidth + layout.rowLabelWidth / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const { screenRow, knittingRow: label } of rowLabels) {
    const y = screenRow * cell + cell / 2;
    ctx.fillText(String(label), rowLabelCenterX, y);
  }

  const colLabels = visibleColLabels(chart.cols);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const colLabelCenterY =
    layout.gridHeight + layout.colLabelHeight / 2;
  for (const { screenCol, knittingCol: label } of colLabels) {
    const x = screenCol * cell + cell / 2;
    ctx.fillText(String(label), x, colLabelCenterY);
  }
}

export function renderChart(
  canvas: HTMLCanvasElement,
  chart: Chart,
  registry: SymbolRegistry,
  options: RenderOptions,
): RenderedSize {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width: gridWidth, height: gridHeight } = chartPixelSize(
    chart,
    opts.cellSizePx,
    opts.lineWidth,
  );

  canvas.width = gridWidth;
  canvas.height = gridHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: 0, height: 0 };
  }

  drawGrid(ctx, chart, registry, opts, 0, 0);
  return { width: canvas.width, height: canvas.height };
}

export function renderChartFrame(
  canvas: HTMLCanvasElement,
  chart: Chart,
  registry: SymbolRegistry,
  options: RenderOptions,
): RenderedFrameSize {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const layout = getChartFrameLayout(chart, opts.cellSizePx, {
    lineWidth: opts.lineWidth,
    labelFontSize: opts.labelFontSize,
  });

  canvas.width = layout.frameWidth;
  canvas.height = layout.frameHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: 0, height: 0, gridWidth: 0, gridHeight: 0 };
  }

  ctx.fillStyle = opts.background;
  ctx.fillRect(0, 0, layout.frameWidth, layout.frameHeight);

  drawGrid(ctx, chart, registry, opts, 0, 0);
  if (options.selectionRect) {
    drawSelectionOverlay(
      ctx,
      options.selectionRect,
      opts.cellSizePx,
      opts.lineWidth,
      options.selectionBorderColor ?? "#525252",
      options.selectionFillColor ?? "rgba(82, 82, 82, 0.12)",
    );
  }
  drawFrameLabels(ctx, chart, layout, opts);

  return {
    width: layout.frameWidth,
    height: layout.frameHeight,
    gridWidth: layout.gridWidth,
    gridHeight: layout.gridHeight,
  };
}

export function cellFromPointer(
  chart: Chart,
  cellSizePx: number,
  offsetX: number,
  offsetY: number,
): { row: number; col: number } | null {
  const col = Math.floor(offsetX / cellSizePx);
  const row = Math.floor(offsetY / cellSizePx);
  if (row < 0 || row >= chart.rows || col < 0 || col >= chart.cols) {
    return null;
  }
  return { row, col };
}
