const WRAP_CLASS = "control-tooltip-target";

function tooltipText(button: HTMLButtonElement): string {
  return (
    button.getAttribute("title") ||
    button.getAttribute("aria-label") ||
    ""
  );
}

export function mountControlTooltip(button: HTMLButtonElement): void {
  if (button.parentElement?.classList.contains(WRAP_CLASS)) {
    syncControlTooltip(button);
    return;
  }
  const wrap = document.createElement("span");
  wrap.className = WRAP_CLASS;
  button.replaceWith(wrap);
  wrap.append(button);
  syncControlTooltip(button);
}

export function syncControlTooltip(button: HTMLButtonElement): void {
  const wrap = button.parentElement;
  if (!wrap?.classList.contains(WRAP_CLASS)) {
    return;
  }
  const tip = tooltipText(button);
  if (button.disabled) {
    if (tip) {
      wrap.setAttribute("title", tip);
    } else {
      wrap.removeAttribute("title");
    }
  } else {
    wrap.removeAttribute("title");
    if (tip && !button.getAttribute("title")) {
      button.setAttribute("title", tip);
    }
  }
}
