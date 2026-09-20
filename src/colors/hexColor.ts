/** Parse user hex input to normalized lowercase #rrggbb, or null if invalid. */
export function parseHexColor(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let hex = trimmed.toLowerCase();
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return `#${hex}`;
  }
  if (/^#[0-9a-f]{6}$/.test(hex)) {
    return hex;
  }
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

export function formatHexDisplay(normalizedHex: string): string {
  const parsed = parseHexColor(normalizedHex);
  if (!parsed) {
    return normalizedHex;
  }
  return parsed.toUpperCase();
}
