import type { Chart, SymbolId } from "../types";
import { BLANK_SYMBOL_ID } from "../types";

export function clearStitchFromChart(chart: Chart, symbolId: SymbolId): void {
  if (symbolId === BLANK_SYMBOL_ID) {
    return;
  }
  for (const cell of chart.cells) {
    if (cell.symbolId === symbolId) {
      cell.symbolId = BLANK_SYMBOL_ID;
    }
  }
}

export function replaceColorInChart(
  chart: Chart,
  fromHex: string,
  toHex: string,
): void {
  if (fromHex === toHex) {
    return;
  }
  for (const cell of chart.cells) {
    if (cell.backgroundColor === fromHex) {
      cell.backgroundColor = toHex;
    }
  }
}

export function clearColorFromChart(chart: Chart, hex: string): void {
  for (const cell of chart.cells) {
    if (cell.backgroundColor === hex) {
      cell.backgroundColor = null;
    }
  }
}
