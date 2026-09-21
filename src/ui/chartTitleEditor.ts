import {
  commitChartTitle,
  DEFAULT_CHART_TITLE,
  getChartTitle,
  setChartTitle,
} from "../chart/chartTitle";

export interface ChartTitleEditorElements {
  container: HTMLElement;
}

function displayText(): string {
  return getChartTitle();
}

function renderDisplay(container: HTMLElement): void {
  container.replaceChildren();
  const heading = document.createElement("h1");
  heading.id = "chart-title";
  heading.className = "chart-title";
  heading.tabIndex = 0;
  heading.textContent = displayText();
  container.append(heading);
  bindDisplayHeading(container, heading);
}

function bindDisplayHeading(
  container: HTMLElement,
  heading: HTMLHeadingElement,
): void {
  const startEdit = () => {
    openEditor(container, heading.textContent ?? "");
  };
  heading.addEventListener("click", startEdit);
  heading.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      startEdit();
    }
  });
}

function openEditor(container: HTMLElement, initialValue: string): void {
  const previousTitle = getChartTitle();
  container.replaceChildren();
  const input = document.createElement("input");
  input.type = "text";
  input.className = "chart-title chart-title--edit";
  input.value = initialValue;
  input.setAttribute("aria-label", "Chart title");
  container.append(input);
  input.focus();
  input.select();

  let closed = false;
  const close = (commit: boolean) => {
    if (closed) {
      return;
    }
    closed = true;
    if (commit) {
      commitChartTitle(input.value);
    } else {
      setChartTitle(previousTitle);
    }
    renderDisplay(container);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(false);
    }
  });
  input.addEventListener("blur", () => {
    close(true);
  });
}

export function bindChartTitleEditor(elements: ChartTitleEditorElements): void {
  renderDisplay(elements.container);
}

export function refreshChartTitleDisplay(
  elements: ChartTitleEditorElements,
): void {
  renderDisplay(elements.container);
}

export function resetChartTitleToDefault(
  elements: ChartTitleEditorElements,
): void {
  setChartTitle(DEFAULT_CHART_TITLE);
  renderDisplay(elements.container);
}
