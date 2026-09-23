import { getChartTitle } from "../chart/chartTitle";
import {
  bindDialogEnterSubmit,
  bindEditorDialogDismiss,
} from "./editorDialogDismiss";
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

  const cancelDialog = (): void => {
    elements.dialog.close();
  };

  bindEditorDialogDismiss(elements.dialog, cancelDialog);
  bindDialogEnterSubmit(elements.dialog, elements.btnExport);

  elements.btnCancel.addEventListener("click", cancelDialog);

  elements.btnExport.addEventListener("click", () => {
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
