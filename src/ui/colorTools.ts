import { formatHexDisplay, parseHexColor } from "../colors/hexColor";

/** Session-scoped color painting tools (not stored in chart model). */

const sessionColors: string[] = [];

export function getSessionColors(): readonly string[] {
  return sessionColors;
}

export function addSessionColor(hex: string): string {
  const normalized = parseHexColor(hex);
  if (!normalized) {
    return hex;
  }
  if (!sessionColors.includes(normalized)) {
    sessionColors.push(normalized);
  }
  return normalized;
}

export function formatColorTitle(hex: string): string {
  return formatHexDisplay(hex);
}
