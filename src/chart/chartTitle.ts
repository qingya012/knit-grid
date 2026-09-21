export const DEFAULT_CHART_TITLE = "Untitled Chart";

let chartTitle = DEFAULT_CHART_TITLE;

export function getChartTitle(): string {
  return chartTitle;
}

export function setChartTitle(name: string): void {
  chartTitle = name;
}

export function commitChartTitle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return chartTitle;
  }
  chartTitle = trimmed;
  return chartTitle;
}

function sanitizeExportBasename(base: string): string {
  let sanitized = base.replace(/\s+/g, "-");
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, "");
  sanitized = sanitized.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  if (!sanitized) {
    return "chart";
  }
  return sanitized;
}

export function exportFilenameFromBasename(
  rawBasename: string,
  ext: "png" | "jpg",
): string {
  let base = rawBasename.trim();
  if (!base) {
    base = DEFAULT_CHART_TITLE;
  }
  return `${sanitizeExportBasename(base)}.${ext}`;
}

export function exportFilenameFromTitle(
  title: string,
  ext: "png" | "jpg",
): string {
  return exportFilenameFromBasename(title, ext);
}
