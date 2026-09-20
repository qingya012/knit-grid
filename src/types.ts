export type SymbolId = string;

export interface StitchSymbol {
  id: SymbolId;
  symbol: string;
  abbreviation: string;
  builtin?: boolean;
}

export interface ChartCell {
  symbolId: SymbolId;
  backgroundColor: string | null;
}

export interface Chart {
  rows: number;
  cols: number;
  cells: ChartCell[];
}

export const BLANK_SYMBOL_ID = "blank";
