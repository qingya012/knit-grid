import type { StitchSymbol } from "../types";

export const LEGEND_GAP_PX = 16;

export const KEY_CELL_LINE_COLOR = "#333333";
export const KEY_CELL_BACKGROUND = "#ffffff";

export interface LegendRenderOptions {
  fontSize?: number;
  lineHeight?: number;
  itemGap?: number;
  maxWidth?: number;
  textColor?: string;
  keyCellSizePx?: number;
  abbrGap?: number;
  lineColor?: string;
  cellBackground?: string;
}

const DEFAULT_LEGEND_OPTIONS: Required<LegendRenderOptions> = {
  fontSize: 14,
  lineHeight: 24,
  itemGap: 24,
  maxWidth: 800,
  textColor: "#111111",
  keyCellSizePx: 22,
  abbrGap: 6,
  lineColor: KEY_CELL_LINE_COLOR,
  cellBackground: KEY_CELL_BACKGROUND,
};

export interface LegendLayout {
  width: number;
  height: number;
}

interface KeyItemMeasure {
  entry: StitchSymbol;
  width: number;
}

interface MeasuredRow {
  items: KeyItemMeasure[];
  width: number;
}

function measureKeyItem(
  ctx: CanvasRenderingContext2D,
  entry: StitchSymbol,
  opts: Required<LegendRenderOptions>,
): number {
  const abbrWidth = ctx.measureText(entry.abbreviation).width;
  return opts.keyCellSizePx + opts.abbrGap + abbrWidth;
}

function measureLegendRows(
  ctx: CanvasRenderingContext2D,
  entries: StitchSymbol[],
  opts: Required<LegendRenderOptions>,
): MeasuredRow[] {
  if (entries.length === 0) {
    return [];
  }

  ctx.font = `${opts.fontSize}px ui-monospace, monospace`;

  const rows: MeasuredRow[] = [];
  let current: MeasuredRow = { items: [], width: 0 };

  for (const entry of entries) {
    const itemWidth = measureKeyItem(ctx, entry, opts);
    const gap = current.items.length > 0 ? opts.itemGap : 0;
    const nextWidth = current.width + gap + itemWidth;

    if (current.items.length > 0 && nextWidth > opts.maxWidth) {
      rows.push(current);
      current = {
        items: [{ entry, width: itemWidth }],
        width: itemWidth,
      };
    } else {
      current.items.push({ entry, width: itemWidth });
      current.width = nextWidth;
    }
  }

  if (current.items.length > 0) {
    rows.push(current);
  }

  return rows;
}

function rowHeight(opts: Required<LegendRenderOptions>): number {
  return Math.max(opts.keyCellSizePx, opts.lineHeight);
}

export function legendLayout(
  entries: StitchSymbol[],
  options: LegendRenderOptions = {},
): LegendLayout {
  const opts = { ...DEFAULT_LEGEND_OPTIONS, ...options };
  if (entries.length === 0) {
    return { width: 0, height: 0 };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: 0, height: 0 };
  }

  const rows = measureLegendRows(ctx, entries, opts);
  let width = 0;
  for (const row of rows) {
    width = Math.max(width, row.width);
  }
  const height = rows.length * rowHeight(opts);

  return { width: Math.ceil(width), height: Math.ceil(height) };
}

function drawKeyCell(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  x: number,
  y: number,
  opts: Required<LegendRenderOptions>,
): void {
  const size = opts.keyCellSizePx;
  ctx.fillStyle = opts.cellBackground;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = opts.lineColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

  const glyphFontSize = Math.round(size * 0.55);
  ctx.fillStyle = opts.textColor;
  ctx.font = `${glyphFontSize}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, x + size / 2, y + size / 2);
}

export function renderLegend(
  ctx: CanvasRenderingContext2D,
  entries: StitchSymbol[],
  offsetX: number,
  offsetY: number,
  options: LegendRenderOptions = {},
): void {
  const opts = { ...DEFAULT_LEGEND_OPTIONS, ...options };
  if (entries.length === 0) {
    return;
  }

  const rows = measureLegendRows(ctx, entries, opts);
  const rh = rowHeight(opts);
  let y = offsetY;

  for (const row of rows) {
    let x = offsetX;
    for (let i = 0; i < row.items.length; i++) {
      if (i > 0) {
        x += opts.itemGap;
      }
      const { entry } = row.items[i];
      const cellY = y + (rh - opts.keyCellSizePx) / 2;
      drawKeyCell(ctx, entry.symbol, x, cellY, opts);

      ctx.font = `${opts.fontSize}px ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = opts.textColor;
      const abbrX = x + opts.keyCellSizePx + opts.abbrGap;
      const abbrY = y + rh / 2;
      ctx.fillText(entry.abbreviation, abbrX, abbrY);

      x += row.items[i].width;
    }
    y += rh;
  }
}
