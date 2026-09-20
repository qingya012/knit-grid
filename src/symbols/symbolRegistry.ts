import type { StitchSymbol, SymbolId } from "../types";
import { BLANK_SYMBOL_ID } from "../types";
import { DEFAULT_SYMBOLS } from "./defaultSymbols";

export const DUPLICATE_SYMBOL_MESSAGE = "Symbol already exists";

export interface CustomSymbolInput {
  abbreviation: string;
  symbol: string;
}

export class SymbolRegistry {
  private readonly byId = new Map<SymbolId, StitchSymbol>();

  constructor() {
    for (const s of DEFAULT_SYMBOLS) {
      this.byId.set(s.id, { ...s });
    }
  }

  get(id: SymbolId): StitchSymbol | undefined {
    return this.byId.get(id);
  }

  getAll(): StitchSymbol[] {
    return [...this.byId.values()];
  }

  getUserSymbols(): StitchSymbol[] {
    return this.getAll().filter((s) => s.id !== BLANK_SYMBOL_ID);
  }

  hasStitchSymbolPair(abbreviation: string, symbol: string): boolean {
    const abbr = abbreviation.trim();
    const sym = symbol.trim();
    return this.getUserSymbols().some(
      (s) => s.abbreviation === abbr && s.symbol === sym,
    );
  }

  addCustomSymbol(input: CustomSymbolInput): StitchSymbol {
    const symbol = input.symbol.trim();
    const abbreviation = input.abbreviation.trim();

    if (!symbol) {
      throw new Error("Symbol character is required.");
    }
    if (!abbreviation) {
      throw new Error("Stitch abbreviation is required.");
    }
    if (this.hasStitchSymbolPair(abbreviation, symbol)) {
      throw new Error(DUPLICATE_SYMBOL_MESSAGE);
    }

    const id = this.uniqueId(abbreviation);
    const entry: StitchSymbol = {
      id,
      symbol,
      abbreviation,
      builtin: false,
    };
    this.byId.set(id, entry);
    return entry;
  }

  private uniqueId(base: string): SymbolId {
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const root = slug || "custom";
    if (!this.byId.has(root)) {
      return root;
    }
    let n = 2;
    while (this.byId.has(`${root}-${n}`)) {
      n++;
    }
    return `${root}-${n}`;
  }
}
