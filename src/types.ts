export type SymbolId = string;

export interface StitchSymbol {
  id: SymbolId;
  symbol: string;
  abbreviation: string;
  builtin?: boolean;
}

export interface Chart {
  rows: number;
  cols: number;
  cells: SymbolId[];
}

export const BLANK_SYMBOL_ID = "blank";
