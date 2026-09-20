import { usedSymbolsForLegend } from "../chart/usedSymbols";
import type { Chart } from "../types";
import type { SymbolRegistry } from "../symbols/symbolRegistry";
import { renderChartFrame } from "../render/chartRenderer";
import {
  LEGEND_GAP_PX,
  legendLayout,
  renderLegend,
} from "../render/legendRenderer";

const EXPORT_CELL_SIZE_PX = 32;
const EXPORT_PADDING_PX = 8;
const EXPORT_LEGEND_FONT_SIZE = 14;
const EXPORT_LEGEND_LINE_HEIGHT = 24;
const EXPORT_LEGEND_ITEM_GAP = 24;
const EXPORT_KEY_CELL_SIZE_PX = 22;
const EXPORT_KEY_ABBR_GAP = 6;
const EXPORT_LABEL_FONT_SIZE = 13;

export function exportChartPng(
  chart: Chart,
  registry: SymbolRegistry,
  filename = "chart.png",
): void {
  const legendEntries = usedSymbolsForLegend(chart, registry);

  const frameCanvas = document.createElement("canvas");
  const frameSize = renderChartFrame(frameCanvas, chart, registry, {
    cellSizePx: EXPORT_CELL_SIZE_PX,
    lineWidth: 1,
    labelFontSize: EXPORT_LABEL_FONT_SIZE,
  });

  const contentWidth = frameSize.width;
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

  const legendBlockHeight =
    legendEntries.length > 0 ? LEGEND_GAP_PX + legendSize.height : 0;
  const innerWidth = Math.max(frameSize.width, legendSize.width);
  const innerHeight = frameSize.height + legendBlockHeight;
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

  ctx.drawImage(frameCanvas, EXPORT_PADDING_PX, EXPORT_PADDING_PX);

  if (legendEntries.length > 0) {
    renderLegend(
      ctx,
      legendEntries,
      EXPORT_PADDING_PX,
      EXPORT_PADDING_PX + frameSize.height + LEGEND_GAP_PX,
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

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
