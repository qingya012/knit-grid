import type { StitchSymbol } from "../types";
import { BLANK_SYMBOL_ID } from "../types";

export const DEFAULT_SYMBOLS: StitchSymbol[] = [
  {
    id: BLANK_SYMBOL_ID,
    symbol: "",
    abbreviation: "",
    builtin: true,
  },
];
