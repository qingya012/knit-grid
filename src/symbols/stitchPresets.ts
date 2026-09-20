export const CUSTOM_PRESET_VALUE = "__custom__";

export interface StitchPreset {
  abbreviation: string;
  label: string;
  suggestedSymbol: string;
}

export const STITCH_PRESETS: StitchPreset[] = [
  { abbreviation: "yo", label: "yo — yarn over", suggestedSymbol: "○" },
  { abbreviation: "p", label: "p — purl", suggestedSymbol: "—" },
  {
    abbreviation: "k2tog",
    label: "k2tog — knit two together",
    suggestedSymbol: "/",
  },
  {
    abbreviation: "ssk",
    label: "ssk — slip, slip, knit",
    suggestedSymbol: "\\",
  },
  {
    abbreviation: "sk2p",
    label: "sk2p — slip 1, k2tog, pass slipped stitch over",
    suggestedSymbol: "",
  },
  {
    abbreviation: "M1R",
    label: "M1R — make one right",
    suggestedSymbol: "",
  },
  {
    abbreviation: "M1L",
    label: "M1L — make one left",
    suggestedSymbol: "",
  },
];

export function suggestedSymbolForPreset(abbreviation: string): string {
  const preset = STITCH_PRESETS.find((p) => p.abbreviation === abbreviation);
  return preset?.suggestedSymbol ?? "";
}
