import {
  bindDialogEnterSubmit,
  bindEditorDialogDismiss,
} from "./editorDialogDismiss";
import { DUPLICATE_SYMBOL_MESSAGE } from "../symbols/symbolRegistry";
import {
  CUSTOM_PRESET_VALUE,
  STITCH_PRESETS,
  suggestedSymbolForPreset,
} from "../symbols/stitchPresets";
import type { StitchSymbol, SymbolId } from "../types";

export interface SymbolDialogElements {
  dialog: HTMLDialogElement;
  titleEl: HTMLHeadingElement;
  stitchControlSlot: HTMLElement;
  presetSelect: HTMLSelectElement;
  symbolInput: HTMLInputElement;
  btnUsePreset: HTMLButtonElement;
  stitchErrorEl: HTMLElement;
  symbolErrorEl: HTMLElement;
  btnCancel: HTMLButtonElement;
  btnCreate: HTMLButtonElement;
}

export interface SymbolDialogValues {
  abbreviation: string;
  symbol: string;
}

export { DUPLICATE_SYMBOL_MESSAGE };

let lastPresetForSuggestion: string | null = null;
let customMode = false;
let customStitchInput: HTMLInputElement | null = null;
let editingSymbolId: SymbolId | null = null;
let stitchErrorTimeout: ReturnType<typeof setTimeout> | null = null;
let symbolErrorTimeout: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_PRESET = STITCH_PRESETS[0]?.abbreviation ?? "yo";
const FIELD_ERROR_VISIBLE_MS = 1000;

function cancelStitchErrorTimeout(): void {
  if (stitchErrorTimeout !== null) {
    clearTimeout(stitchErrorTimeout);
    stitchErrorTimeout = null;
  }
}

function cancelSymbolErrorTimeout(): void {
  if (symbolErrorTimeout !== null) {
    clearTimeout(symbolErrorTimeout);
    symbolErrorTimeout = null;
  }
}

function scheduleStitchErrorDismiss(elements: SymbolDialogElements): void {
  cancelStitchErrorTimeout();
  stitchErrorTimeout = setTimeout(() => {
    clearStitchFieldError(elements);
    stitchErrorTimeout = null;
  }, FIELD_ERROR_VISIBLE_MS);
}

function scheduleSymbolErrorDismiss(elements: SymbolDialogElements): void {
  cancelSymbolErrorTimeout();
  symbolErrorTimeout = setTimeout(() => {
    clearSymbolFieldError(elements);
    symbolErrorTimeout = null;
  }, FIELD_ERROR_VISIBLE_MS);
}

function activeStitchControl(
  elements: SymbolDialogElements,
): HTMLSelectElement | HTMLInputElement {
  if (customMode && customStitchInput) {
    return customStitchInput;
  }
  return elements.presetSelect;
}

function clearStitchFieldError(elements: SymbolDialogElements): void {
  cancelStitchErrorTimeout();
  elements.stitchErrorEl.hidden = true;
  elements.stitchErrorEl.textContent = "";
  activeStitchControl(elements).removeAttribute("aria-invalid");
}

function clearSymbolFieldError(elements: SymbolDialogElements): void {
  cancelSymbolErrorTimeout();
  elements.symbolErrorEl.hidden = true;
  elements.symbolErrorEl.textContent = "";
  elements.symbolInput.removeAttribute("aria-invalid");
}

export function clearSymbolDialogFieldErrors(
  elements: SymbolDialogElements,
): void {
  clearStitchFieldError(elements);
  clearSymbolFieldError(elements);
}

function setStitchFieldError(
  elements: SymbolDialogElements,
  message: string,
): void {
  cancelStitchErrorTimeout();
  elements.stitchErrorEl.textContent = message;
  elements.stitchErrorEl.hidden = false;
  activeStitchControl(elements).setAttribute("aria-invalid", "true");
  scheduleStitchErrorDismiss(elements);
}

function setSymbolFieldError(
  elements: SymbolDialogElements,
  message: string,
): void {
  cancelSymbolErrorTimeout();
  elements.symbolErrorEl.textContent = message;
  elements.symbolErrorEl.hidden = false;
  elements.symbolInput.setAttribute("aria-invalid", "true");
  scheduleSymbolErrorDismiss(elements);
}

export function showSymbolDialogSymbolFieldError(
  elements: SymbolDialogElements,
  message: string,
): void {
  clearSymbolDialogFieldErrors(elements);
  setSymbolFieldError(elements, message);
}

function validateDialogFields(
  elements: SymbolDialogElements,
): SymbolDialogValues | null {
  clearSymbolDialogFieldErrors(elements);

  const symbol = elements.symbolInput.value.trim();
  let abbreviation: string;
  if (customMode && customStitchInput) {
    abbreviation = customStitchInput.value.trim();
  } else {
    abbreviation = elements.presetSelect.value.trim();
  }

  let valid = true;
  if (!abbreviation || abbreviation === CUSTOM_PRESET_VALUE) {
    setStitchFieldError(elements, "Stitch abbreviation is required.");
    valid = false;
  }
  if (!symbol) {
    setSymbolFieldError(elements, "Symbol is required.");
    valid = false;
  }
  if (!valid) {
    return null;
  }
  return { abbreviation, symbol };
}

export function bindSymbolDialog(
  elements: SymbolDialogElements,
  onSubmit: (values: SymbolDialogValues, editId: SymbolId | null) => void,
): void {
  populatePresetSelect(elements.presetSelect);

  elements.presetSelect.addEventListener("change", () => {
    clearStitchFieldError(elements);
    if (elements.presetSelect.value === CUSTOM_PRESET_VALUE) {
      enterCustomMode(elements);
      return;
    }
    exitCustomMode(elements);
    const preset = elements.presetSelect.value;
    if (preset !== lastPresetForSuggestion) {
      elements.symbolInput.value = suggestedSymbolForPreset(preset);
      lastPresetForSuggestion = preset;
    }
  });

  elements.stitchControlSlot.addEventListener("input", () => {
    clearStitchFieldError(elements);
  });

  elements.symbolInput.addEventListener("input", () => {
    clearSymbolFieldError(elements);
  });

  elements.btnUsePreset.addEventListener("click", () => {
    elements.presetSelect.value = DEFAULT_PRESET;
    exitCustomMode(elements);
    elements.symbolInput.value = suggestedSymbolForPreset(DEFAULT_PRESET);
    lastPresetForSuggestion = DEFAULT_PRESET;
    clearStitchFieldError(elements);
  });

  const cancelDialog = (): void => {
    elements.dialog.close();
  };

  bindEditorDialogDismiss(elements.dialog, cancelDialog);
  bindDialogEnterSubmit(elements.dialog, elements.btnCreate);

  elements.btnCancel.addEventListener("click", cancelDialog);

  elements.btnCreate.addEventListener("click", () => {
    const values = validateDialogFields(elements);
    if (!values) {
      return;
    }
    onSubmit(values, editingSymbolId);
  });

  elements.dialog.addEventListener("close", () => {
    clearSymbolDialogFieldErrors(elements);
    exitCustomMode(elements);
    lastPresetForSuggestion = null;
    editingSymbolId = null;
    elements.titleEl.textContent = "Create Symbol";
    elements.btnCreate.textContent = "Create";
  });
}

export function openSymbolDialog(elements: SymbolDialogElements): void {
  editingSymbolId = null;
  elements.titleEl.textContent = "Create Symbol";
  elements.btnCreate.textContent = "Create";
  resetSymbolDialogToDefault(elements);
  clearSymbolDialogFieldErrors(elements);
  elements.dialog.showModal();
}

export function openSymbolDialogForEdit(
  elements: SymbolDialogElements,
  stitch: StitchSymbol,
): void {
  editingSymbolId = stitch.id;
  elements.titleEl.textContent = "Edit Stitch";
  elements.btnCreate.textContent = "Save";
  clearSymbolDialogFieldErrors(elements);
  prefillSymbolDialogForEdit(elements, stitch);
  elements.dialog.showModal();
}

export function closeSymbolDialog(elements: SymbolDialogElements): void {
  elements.dialog.close();
}

export function showDuplicateSymbolToast(
  elements: SymbolDialogElements,
): void {
  clearSymbolDialogFieldErrors(elements);
  setStitchFieldError(elements, DUPLICATE_SYMBOL_MESSAGE);
}

function resetSymbolDialogToDefault(elements: SymbolDialogElements): void {
  exitCustomMode(elements);
  elements.presetSelect.value = DEFAULT_PRESET;
  lastPresetForSuggestion = DEFAULT_PRESET;
  elements.symbolInput.value = suggestedSymbolForPreset(DEFAULT_PRESET);
}

function prefillSymbolDialogForEdit(
  elements: SymbolDialogElements,
  stitch: StitchSymbol,
): void {
  const presetMatch = STITCH_PRESETS.some(
    (p) => p.abbreviation === stitch.abbreviation,
  );
  if (presetMatch) {
    exitCustomMode(elements);
    elements.presetSelect.value = stitch.abbreviation;
    lastPresetForSuggestion = stitch.abbreviation;
  } else {
    enterCustomMode(elements);
    if (customStitchInput) {
      customStitchInput.value = stitch.abbreviation;
    }
    lastPresetForSuggestion = null;
  }
  elements.symbolInput.value = stitch.symbol;
}

function populatePresetSelect(select: HTMLSelectElement): void {
  select.replaceChildren();
  for (const preset of STITCH_PRESETS) {
    const opt = document.createElement("option");
    opt.value = preset.abbreviation;
    opt.textContent = preset.abbreviation;
    select.appendChild(opt);
  }
  const custom = document.createElement("option");
  custom.value = CUSTOM_PRESET_VALUE;
  custom.textContent = "Create your own...";
  select.appendChild(custom);
}

function enterCustomMode(elements: SymbolDialogElements): void {
  if (customMode) {
    return;
  }
  customMode = true;
  elements.presetSelect.remove();

  customStitchInput = document.createElement("input");
  customStitchInput.type = "text";
  customStitchInput.id = "stitch-custom-input";
  customStitchInput.value = "";
  elements.stitchControlSlot.append(customStitchInput);

  elements.btnUsePreset.hidden = false;
  elements.symbolInput.value = "";
  customStitchInput.focus();
}

function exitCustomMode(elements: SymbolDialogElements): void {
  if (customStitchInput) {
    customStitchInput.remove();
    customStitchInput = null;
  }
  customMode = false;
  elements.btnUsePreset.hidden = true;
  if (!elements.stitchControlSlot.contains(elements.presetSelect)) {
    elements.stitchControlSlot.append(elements.presetSelect);
  }
}
