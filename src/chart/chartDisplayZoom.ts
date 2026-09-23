import type { Chart } from "../types";
import { getChartFrameLayout } from "../render/chartRenderer";

export const CANONICAL_CELL_SIZE_PX = 28;

export const MANUAL_ZOOM_FACTORS: readonly number[] = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

const MIN_MANUAL_FACTOR = MANUAL_ZOOM_FACTORS[0];
const MAX_MANUAL_FACTOR = MANUAL_ZOOM_FACTORS[MANUAL_ZOOM_FACTORS.length - 1];
const MIN_FIT_CELL_SIZE_PX = 1;
const EDITOR_LABEL_FONT_SIZE = 10;

export interface FitMeasureInput {
  availWidth: number;
  availHeight: number;
  titleHeight: number;
  legendHeight: number;
  contentGapPx: number;
}

let fitMode = true;
let manualZoomFactor = 1;
let fitZoomFactor = 1;
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) {
    fn();
  }
}

export function onViewStateChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function isFitMode(): boolean {
  return fitMode;
}

export function getZoomFactor(): number {
  return fitMode ? fitZoomFactor : manualZoomFactor;
}

export function getEffectiveCellSizePx(): number {
  return CANONICAL_CELL_SIZE_PX * getZoomFactor();
}

export function getDisplayZoomPercent(): number {
  return Math.round(getZoomFactor() * 100);
}

function presentationHeightForCellSize(
  chart: Chart,
  cellSizePx: number,
  measure: FitMeasureInput,
): number {
  const layout = getChartFrameLayout(chart, cellSizePx, {
    labelFontSize: EDITOR_LABEL_FONT_SIZE,
  });
  let h = measure.titleHeight;
  if (measure.titleHeight > 0) {
    h += measure.contentGapPx;
  }
  h += layout.frameHeight;
  if (measure.legendHeight > 0) {
    h += measure.contentGapPx + measure.legendHeight;
  }
  return h;
}

function frameFits(
  chart: Chart,
  cellSizePx: number,
  measure: FitMeasureInput,
): boolean {
  if (cellSizePx < MIN_FIT_CELL_SIZE_PX) {
    return false;
  }
  const layout = getChartFrameLayout(chart, cellSizePx, {
    labelFontSize: EDITOR_LABEL_FONT_SIZE,
  });
  if (layout.frameWidth > measure.availWidth) {
    return false;
  }
  return (
    presentationHeightForCellSize(chart, cellSizePx, measure) <=
    measure.availHeight
  );
}

export function computeFitZoomFactor(
  chart: Chart,
  measure: FitMeasureInput,
): number {
  if (
    measure.availWidth <= 0 ||
    measure.availHeight <= 0 ||
    chart.rows < 1 ||
    chart.cols < 1
  ) {
    return 1;
  }

  let lo = MIN_FIT_CELL_SIZE_PX;
  let hi = CANONICAL_CELL_SIZE_PX;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (frameFits(chart, mid, measure)) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  const fitFactor = lo / CANONICAL_CELL_SIZE_PX;
  return Math.min(fitFactor, 1);
}

export function applyFitFactor(factor: number): void {
  const clamped = Math.min(factor, 1);
  fitZoomFactor = Math.max(
    clamped,
    MIN_FIT_CELL_SIZE_PX / CANONICAL_CELL_SIZE_PX,
  );
  notify();
}

export function enterFitMode(): void {
  fitMode = true;
  notify();
}

export function setManualZoomFactor(factor: number): void {
  fitMode = false;
  manualZoomFactor = Math.min(
    MAX_MANUAL_FACTOR,
    Math.max(MIN_MANUAL_FACTOR, factor),
  );
  notify();
}

function largestManualBelow(factor: number): number {
  let chosen = MIN_MANUAL_FACTOR;
  for (const step of MANUAL_ZOOM_FACTORS) {
    if (step < factor) {
      chosen = step;
    } else {
      break;
    }
  }
  return chosen;
}

function smallestManualAbove(factor: number): number {
  for (const step of MANUAL_ZOOM_FACTORS) {
    if (step > factor) {
      return step;
    }
  }
  return MAX_MANUAL_FACTOR;
}

export function zoomOut(): void {
  const current = getZoomFactor();
  if (fitMode) {
    setManualZoomFactor(largestManualBelow(current));
    return;
  }
  const idx = MANUAL_ZOOM_FACTORS.indexOf(manualZoomFactor);
  if (idx > 0) {
    setManualZoomFactor(MANUAL_ZOOM_FACTORS[idx - 1]);
  }
}

export function zoomIn(): void {
  const current = getZoomFactor();
  if (fitMode) {
    setManualZoomFactor(smallestManualAbove(current));
    return;
  }
  const idx = MANUAL_ZOOM_FACTORS.indexOf(manualZoomFactor);
  if (idx >= 0 && idx < MANUAL_ZOOM_FACTORS.length - 1) {
    setManualZoomFactor(MANUAL_ZOOM_FACTORS[idx + 1]);
  }
}

export function canZoomOut(): boolean {
  if (fitMode) {
    return getZoomFactor() > MIN_MANUAL_FACTOR;
  }
  return manualZoomFactor > MIN_MANUAL_FACTOR;
}

export function canZoomIn(): boolean {
  if (fitMode) {
    return getZoomFactor() < MAX_MANUAL_FACTOR;
  }
  return manualZoomFactor < MAX_MANUAL_FACTOR;
}

export function resetToFitMode(): void {
  fitMode = true;
  notify();
}
