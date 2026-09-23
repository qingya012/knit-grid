export const CUSTOM_PRESET_VALUE = "__custom__";

export interface StitchPreset {
  abbreviation: string;
  label: string;
  suggestedSymbol: string;
}

export const STITCH_PRESETS: StitchPreset[] = [
  { abbreviation: "k", label: "k — knit", suggestedSymbol: "|" },
  { abbreviation: "p", label: "p — purl", suggestedSymbol: "—" },
  { abbreviation: "yo", label: "yo — yarn over", suggestedSymbol: "○" },
];

export function suggestedSymbolForPreset(abbreviation: string): string {
  const preset = STITCH_PRESETS.find((p) => p.abbreviation === abbreviation);
  return preset?.suggestedSymbol ?? "";
}
