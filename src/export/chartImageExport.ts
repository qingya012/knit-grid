import { exportFilenameFromBasename } from "../chart/chartTitle";
import { usedSymbolsForLegend } from "../chart/usedSymbols";
import { FONT_BRAND } from "../render/fontStacks";
import { renderChartFrame } from "../render/chartRenderer";
import {
  LEGEND_GAP_PX,
  legendLayout,
  renderLegend,
} from "../render/legendRenderer";
import type { Chart } from "../types";
import type { SymbolRegistry } from "../symbols/symbolRegistry";

const EXPORT_CELL_SIZE_PX = 32;
const EXPORT_PADDING_PX = 8;
const EXPORT_TITLE_FONT_SIZE = 20;
const EXPORT_TITLE_GAP_PX = 16;
const EXPORT_LEGEND_FONT_SIZE = 14;
const EXPORT_LEGEND_LINE_HEIGHT = 24;
const EXPORT_LEGEND_ITEM_GAP = 24;
const EXPORT_KEY_CELL_SIZE_PX = 22;
const EXPORT_KEY_ABBR_GAP = 6;
const EXPORT_LABEL_FONT_SIZE = 13;
const JPEG_QUALITY = 0.92;

export type ChartImageFormat = "png" | "jpeg";

function measureTitleBlock(
  ctx: CanvasRenderingContext2D,
  title: string,
  contentWidth: number,
): { height: number } {
  ctx.font = `600 ${EXPORT_TITLE_FONT_SIZE}px ${FONT_BRAND}`;
  const lines = wrapTitleLines(ctx, title, contentWidth);
  const lineHeight = EXPORT_TITLE_FONT_SIZE * 1.25;
  const height =
    lines.length > 0
      ? lines.length * lineHeight
      : EXPORT_TITLE_FONT_SIZE * 1.25;
  return { height };
}

function wrapTitleLines(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  centerX: number,
  y: number,
  contentWidth: number,
): number {
  ctx.font = `600 ${EXPORT_TITLE_FONT_SIZE}px ${FONT_BRAND}`;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const lines = wrapTitleLines(ctx, title, contentWidth);
  const lineHeight = EXPORT_TITLE_FONT_SIZE * 1.25;
  let drawY = y;
  for (const line of lines) {
    ctx.fillText(line, centerX, drawY);
    drawY += lineHeight;
  }
  return drawY - y;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportChartImage(
  chart: Chart,
  registry: SymbolRegistry,
  chartTitleForRender: string,
  format: ChartImageFormat,
  downloadBasename: string,
): void {
  const legendEntries = usedSymbolsForLegend(chart, registry);

  const frameCanvas = document.createElement("canvas");
  const frameSize = renderChartFrame(frameCanvas, chart, registry, {
    cellSizePx: EXPORT_CELL_SIZE_PX,
    lineWidth: 1,
    labelFontSize: EXPORT_LABEL_FONT_SIZE,
  });

  const contentWidth = frameSize.width;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  const titleHeight =
    measureCtx && chartTitleForRender.trim()
      ? measureTitleBlock(measureCtx, chartTitleForRender, contentWidth).height
      : 0;

  const legendSize =
    legendEntries.length > 0
      ? legendLayout(legendEntries, {
          fontSize: EXPORT_LEGEND_FONT_SIZE,
          lineHeight: EXPORT_LEGEND_LINE_HEIGHT,
          itemGap: EXPORT_LEGEND_ITEM_GAP,
          maxWidth: contentWidth,
          keyCellSizePx: EXPORT_KEY_CELL_SIZE_PX,
          abbrGap: EXPORT_KEY_ABBR_GAP,
        })
      : { width: 0, height: 0 };

  const titleBlockHeight =
    titleHeight > 0 ? titleHeight + EXPORT_TITLE_GAP_PX : 0;
  const legendBlockHeight =
    legendEntries.length > 0 ? LEGEND_GAP_PX + legendSize.height : 0;
  const innerWidth = Math.max(frameSize.width, legendSize.width);
  const innerHeight =
    titleBlockHeight + frameSize.height + legendBlockHeight;
  const width = innerWidth + 2 * EXPORT_PADDING_PX;
  const height = innerHeight + 2 * EXPORT_PADDING_PX;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let contentY = EXPORT_PADDING_PX;
  if (chartTitleForRender.trim()) {
    drawTitle(
      ctx,
      chartTitleForRender,
      EXPORT_PADDING_PX + innerWidth / 2,
      contentY,
      contentWidth,
    );
    contentY += titleBlockHeight;
  }

  ctx.drawImage(frameCanvas, EXPORT_PADDING_PX, contentY);

  if (legendEntries.length > 0) {
    renderLegend(
      ctx,
      legendEntries,
      EXPORT_PADDING_PX,
      contentY + frameSize.height + LEGEND_GAP_PX,
      {
        fontSize: EXPORT_LEGEND_FONT_SIZE,
        lineHeight: EXPORT_LEGEND_LINE_HEIGHT,
        itemGap: EXPORT_LEGEND_ITEM_GAP,
        maxWidth: contentWidth,
        keyCellSizePx: EXPORT_KEY_CELL_SIZE_PX,
        abbrGap: EXPORT_KEY_ABBR_GAP,
      },
    );
  }

  const ext = format === "jpeg" ? "jpg" : "png";
  const filename = exportFilenameFromBasename(downloadBasename, ext);
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = format === "jpeg" ? JPEG_QUALITY : undefined;

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        return;
      }
      downloadBlob(blob, filename);
    },
    mimeType,
    quality,
  );
}
