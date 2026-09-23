export interface PresentationMeasure {
  availWidth: number;
  availHeight: number;
  titleHeight: number;
  legendHeight: number;
  contentGapPx: number;
}

export function measurePresentationChrome(
  scrollEl: HTMLElement,
  centerEl: HTMLElement,
  contentEl: HTMLElement,
  titleSlot: HTMLElement,
  legendEl: HTMLElement,
): PresentationMeasure {
  const centerStyle = getComputedStyle(centerEl);
  const contentStyle = getComputedStyle(contentEl);
  const padX =
    parseFloat(centerStyle.paddingLeft) +
    parseFloat(centerStyle.paddingRight);
  const padY =
    parseFloat(centerStyle.paddingTop) +
    parseFloat(centerStyle.paddingBottom);

  const availWidth = Math.max(0, scrollEl.clientWidth - padX);
  const availHeight = Math.max(0, scrollEl.clientHeight - padY);

  const gap = parseFloat(contentStyle.rowGap || contentStyle.gap || "0") || 0;

  return {
    availWidth,
    availHeight,
    titleHeight: titleSlot.offsetHeight,
    legendHeight: legendEl.offsetHeight,
    contentGapPx: gap,
  };
}
