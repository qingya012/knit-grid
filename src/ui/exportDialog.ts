import { getChartTitle } from "../chart/chartTitle";
import type { ChartImageFormat } from "../export/chartImageExport";

export interface ExportDialogElements {
  dialog: HTMLDialogElement;
  filenameInput: HTMLInputElement;
  formatSelect: HTMLSelectElement;
  btnCancel: HTMLButtonElement;
  btnExport: HTMLButtonElement;
}

export function bindExportDialog(
  elements: ExportDialogElements,
  onExport: (basename: string, format: ChartImageFormat) => void,
): void {
  function performExport(): void {
    const formatValue = elements.formatSelect.value;
    const format: ChartImageFormat =
      formatValue === "jpeg" ? "jpeg" : "png";
    onExport(elements.filenameInput.value, format);
    elements.dialog.close();
  }

  elements.btnCancel.addEventListener("click", () => {
    elements.dialog.close();
  });

  elements.btnExport.addEventListener("click", () => {
    performExport();
  });

  elements.dialog.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") {
      return;
    }
    if (e.target instanceof HTMLTextAreaElement) {
      return;
    }
    e.preventDefault();
    performExport();
  });
}

export function openExportDialog(elements: ExportDialogElements): void {
  elements.filenameInput.value = getChartTitle();
  elements.formatSelect.value = "png";
  elements.dialog.showModal();
  elements.filenameInput.focus();
  elements.filenameInput.select();
}
