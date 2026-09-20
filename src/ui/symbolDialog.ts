import { DUPLICATE_SYMBOL_MESSAGE } from "../symbols/symbolRegistry";
import {
  CUSTOM_PRESET_VALUE,
  STITCH_PRESETS,
  suggestedSymbolForPreset,
} from "../symbols/stitchPresets";

export interface SymbolDialogElements {
  dialog: HTMLDialogElement;
  stitchControlSlot: HTMLElement;
  presetSelect: HTMLSelectElement;
  symbolInput: HTMLInputElement;
  btnUsePreset: HTMLButtonElement;
  errorEl: HTMLElement;
  toastEl: HTMLElement;
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
let duplicateToastTimeout: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_PRESET = STITCH_PRESETS[0]?.abbreviation ?? "yo";

export function bindSymbolDialog(
  elements: SymbolDialogElements,
  onCreate: (values: SymbolDialogValues) => void,
): void {
  populatePresetSelect(elements.presetSelect);

  elements.presetSelect.addEventListener("change", () => {
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

  elements.btnUsePreset.addEventListener("click", () => {
    elements.presetSelect.value = DEFAULT_PRESET;
    exitCustomMode(elements);
    elements.symbolInput.value = suggestedSymbolForPreset(DEFAULT_PRESET);
    lastPresetForSuggestion = DEFAULT_PRESET;
  });

  elements.btnCancel.addEventListener("click", () => {
    elements.dialog.close();
  });

  elements.btnCreate.addEventListener("click", () => {
    elements.errorEl.hidden = true;
    const values = readDialogValues(elements);
    if (!values) {
      elements.errorEl.hidden = false;
      elements.errorEl.textContent =
        "Stitch abbreviation and symbol are required.";
      return;
    }
    onCreate(values);
  });

  elements.dialog.addEventListener("close", () => {
    elements.errorEl.hidden = true;
    hideDuplicateToast(elements);
    exitCustomMode(elements);
    lastPresetForSuggestion = null;
  });
}

export function openSymbolDialog(elements: SymbolDialogElements): void {
  resetSymbolDialogToDefault(elements);
  elements.errorEl.hidden = true;
  elements.dialog.showModal();
}

export function closeSymbolDialog(elements: SymbolDialogElements): void {
  elements.dialog.close();
}

export function showDuplicateSymbolToast(
  elements: SymbolDialogElements,
): void {
  if (duplicateToastTimeout !== null) {
    clearTimeout(duplicateToastTimeout);
    duplicateToastTimeout = null;
  }

  elements.toastEl.hidden = false;

  duplicateToastTimeout = setTimeout(() => {
    hideDuplicateToast(elements);
    resetSymbolDialogToDefault(elements);
    duplicateToastTimeout = null;
  }, 1000);
}

function hideDuplicateToast(elements: SymbolDialogElements): void {
  elements.toastEl.hidden = true;
}

function resetSymbolDialogToDefault(elements: SymbolDialogElements): void {
  exitCustomMode(elements);
  elements.presetSelect.value = DEFAULT_PRESET;
  lastPresetForSuggestion = DEFAULT_PRESET;
  elements.symbolInput.value = suggestedSymbolForPreset(DEFAULT_PRESET);
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

function readDialogValues(
  elements: SymbolDialogElements,
): SymbolDialogValues | null {
  const symbol = elements.symbolInput.value.trim();
  let abbreviation: string;
  if (customMode && customStitchInput) {
    abbreviation = customStitchInput.value.trim();
  } else {
    abbreviation = elements.presetSelect.value.trim();
  }
  if (
    !abbreviation ||
    abbreviation === CUSTOM_PRESET_VALUE ||
    !symbol
  ) {
    return null;
  }
  return { abbreviation, symbol };
}
