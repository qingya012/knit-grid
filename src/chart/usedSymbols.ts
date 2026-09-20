import type { Chart, StitchSymbol, SymbolId } from "../types";
import { BLANK_SYMBOL_ID } from "../types";
import type { SymbolRegistry } from "../symbols/symbolRegistry";

export function collectUsedSymbolIds(chart: Chart): SymbolId[] {
  const seen = new Set<SymbolId>();
  const ordered: SymbolId[] = [];
  for (const cell of chart.cells) {
    const id = cell.symbolId;
    if (id === BLANK_SYMBOL_ID || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

export function usedSymbolsForLegend(
  chart: Chart,
  registry: SymbolRegistry,
): StitchSymbol[] {
  return collectUsedSymbolIds(chart)
    .map((id) => registry.get(id))
    .filter((s): s is StitchSymbol => s !== undefined);
}
