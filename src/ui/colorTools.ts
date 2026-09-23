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

export function replaceSessionColor(oldHex: string, newHex: string): string {
  const from = parseHexColor(oldHex);
  const to = parseHexColor(newHex);
  if (!from || !to) {
    return newHex;
  }
  const index = sessionColors.indexOf(from);
  if (index === -1) {
    return to;
  }
  if (from !== to && sessionColors.includes(to)) {
    throw new Error("That color is already in the palette.");
  }
  sessionColors[index] = to;
  return to;
}

export function removeSessionColor(hex: string): void {
  const normalized = parseHexColor(hex);
  if (!normalized) {
    return;
  }
  const index = sessionColors.indexOf(normalized);
  if (index !== -1) {
    sessionColors.splice(index, 1);
  }
}

export function setSessionColors(colors: string[]): void {
  sessionColors.length = 0;
  for (const hex of colors) {
    const normalized = parseHexColor(hex);
    if (normalized && !sessionColors.includes(normalized)) {
      sessionColors.push(normalized);
    }
  }
}

export function hasSessionColor(hex: string, exceptHex?: string): boolean {
  const normalized = parseHexColor(hex);
  const except = exceptHex ? parseHexColor(exceptHex) : null;
  if (!normalized) {
    return false;
  }
  return sessionColors.some((c) => c === normalized && c !== except);
}

export function formatColorTitle(hex: string): string {
  return formatHexDisplay(hex);
}
