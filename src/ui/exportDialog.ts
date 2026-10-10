import { getChartTitle } from "../chart/chartTitle";
import {
  bindDialogEnterSubmit,
  bindEditorDialogDismiss,
} from "./editorDialogDismiss";
import type {
  ChartImageFormat,
  ExportLegendOptions,
} from "../export/chartImageExport";

export interface ExportDialogElements {
  dialog: HTMLDialogElement;
  filenameInput: HTMLInputElement;
  formatSelect: HTMLSelectElement;
  includeBlankCheckbox: HTMLInputElement;
  blankLabelField: HTMLElement;
  blankLabelInput: HTMLInputElement;
  btnCancel: HTMLButtonElement;
  btnExport: HTMLButtonElement;
}

function syncBlankLegendFieldVisibility(
  elements: ExportDialogElements,
): void {
  const show = elements.includeBlankCheckbox.checked;
  elements.blankLabelField.hidden = !show;
  elements.blankLabelInput.disabled = !show;
}

export function bindExportDialog(
  elements: ExportDialogElements,
  onExport: (
    basename: string,
    format: ChartImageFormat,
    legend: ExportLegendOptions,
  ) => void,
): void {
  elements.includeBlankCheckbox.addEventListener("change", () => {
    syncBlankLegendFieldVisibility(elements);
    if (elements.includeBlankCheckbox.checked) {
      elements.blankLabelInput.focus();
    }
  });

  function performExport(): void {
    const formatValue = elements.formatSelect.value;
    const format: ChartImageFormat =
      formatValue === "jpeg" ? "jpeg" : "png";
    const legend: ExportLegendOptions = {
      includeBlankCell: elements.includeBlankCheckbox.checked,
      blankCellLabel: elements.blankLabelInput.value.trim(),
    };
    onExport(elements.filenameInput.value, format, legend);
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
  elements.includeBlankCheckbox.checked = false;
  elements.blankLabelInput.value = "";
  syncBlankLegendFieldVisibility(elements);
  elements.dialog.showModal();
  elements.filenameInput.focus();
  elements.filenameInput.select();
}
