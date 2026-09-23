import { COLOR_PRESETS } from "../colors/colorPresets";
import {
  bindDialogEnterSubmit,
  bindEditorDialogDismiss,
} from "./editorDialogDismiss";
import { formatHexDisplay, parseHexColor } from "../colors/hexColor";

export interface ColorDialogElements {
  dialog: HTMLDialogElement;
  titleEl: HTMLHeadingElement;
  presetGrid: HTMLElement;
  selectedPreview: HTMLElement;
  hexInput: HTMLInputElement;
  colorErrorEl: HTMLElement;
  btnChooseMore: HTMLButtonElement;
  nativePicker: HTMLInputElement;
  btnCancel: HTMLButtonElement;
  btnAdd: HTMLButtonElement;
}

export const DUPLICATE_COLOR_MESSAGE = "Color already exists";

let selectedHex: string | null = null;
let editingColorHex: string | null = null;
let colorErrorTimeout: ReturnType<typeof setTimeout> | null = null;
const presetButtons = new Map<string, HTMLButtonElement>();

const FIELD_ERROR_VISIBLE_MS = 1000;

function cancelColorErrorTimeout(): void {
  if (colorErrorTimeout !== null) {
    clearTimeout(colorErrorTimeout);
    colorErrorTimeout = null;
  }
}

export function clearColorFieldError(elements: ColorDialogElements): void {
  cancelColorErrorTimeout();
  elements.colorErrorEl.hidden = true;
  elements.colorErrorEl.textContent = "";
  elements.hexInput.removeAttribute("aria-invalid");
}

function showColorFieldError(
  elements: ColorDialogElements,
  message: string,
): void {
  cancelColorErrorTimeout();
  elements.colorErrorEl.textContent = message;
  elements.colorErrorEl.hidden = false;
  elements.hexInput.setAttribute("aria-invalid", "true");
  colorErrorTimeout = setTimeout(() => {
    clearColorFieldError(elements);
    colorErrorTimeout = null;
  }, FIELD_ERROR_VISIBLE_MS);
}

export function showColorDuplicateError(
  elements: ColorDialogElements,
): void {
  showColorFieldError(elements, DUPLICATE_COLOR_MESSAGE);
}

export function bindColorDialog(
  elements: ColorDialogElements,
  onSubmit: (hex: string, editHex: string | null) => boolean,
): void {
  buildPresetGrid(elements.presetGrid);

  elements.presetGrid.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    if (!target.classList.contains("color-preset-swatch")) {
      return;
    }
    const hex = target.dataset.hex;
    if (!hex) {
      return;
    }
    const parsed = parseHexColor(hex);
    if (parsed) {
      applySelectedColor(elements, parsed);
    }
  });

  elements.hexInput.addEventListener("input", () => {
    clearColorFieldError(elements);
    syncFromHexInput(elements);
  });

  elements.btnChooseMore.addEventListener("click", () => {
    elements.nativePicker.click();
  });

  const onNativePicked = (): void => {
    const parsed = parseHexColor(elements.nativePicker.value);
    if (parsed) {
      applySelectedColor(elements, parsed);
    }
  };
  elements.nativePicker.addEventListener("input", onNativePicked);
  elements.nativePicker.addEventListener("change", onNativePicked);

  const cancelDialog = (): void => {
    elements.dialog.close();
  };

  bindEditorDialogDismiss(elements.dialog, cancelDialog);
  bindDialogEnterSubmit(elements.dialog, elements.btnAdd);

  elements.btnCancel.addEventListener("click", cancelDialog);

  elements.btnAdd.addEventListener("click", () => {
    if (!selectedHex) {
      return;
    }
    if (onSubmit(selectedHex, editingColorHex)) {
      elements.dialog.close();
    }
  });

  elements.dialog.addEventListener("close", () => {
    clearColorFieldError(elements);
    elements.btnAdd.disabled = false;
    editingColorHex = null;
    elements.titleEl.textContent = "Add Color";
    elements.btnAdd.textContent = "Add";
  });
}

export function openColorDialog(elements: ColorDialogElements): void {
  editingColorHex = null;
  elements.titleEl.textContent = "Add Color";
  elements.btnAdd.textContent = "Add";
  const first = COLOR_PRESETS[0];
  if (first) {
    const parsed = parseHexColor(first);
    if (parsed) {
      applySelectedColor(elements, parsed);
    }
  } else {
    selectedHex = null;
    elements.hexInput.value = "";
    elements.selectedPreview.style.backgroundColor = "transparent";
    syncPresetSelection();
    updateAddButton(elements);
  }
  elements.dialog.showModal();
}

export function openColorDialogForEdit(
  elements: ColorDialogElements,
  hex: string,
): void {
  const parsed = parseHexColor(hex);
  if (!parsed) {
    return;
  }
  editingColorHex = parsed;
  elements.titleEl.textContent = "Edit Color";
  elements.btnAdd.textContent = "Save";
  applySelectedColor(elements, parsed);
  elements.dialog.showModal();
}

function buildPresetGrid(container: HTMLElement): void {
  container.replaceChildren();
  presetButtons.clear();
  for (const hex of COLOR_PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-preset-swatch";
    btn.style.backgroundColor = hex;
    btn.dataset.hex = hex;
    const label = formatHexDisplay(hex);
    btn.title = label;
    btn.setAttribute("aria-label", label);
    container.append(btn);
    presetButtons.set(hex, btn);
  }
}

function applySelectedColor(
  elements: ColorDialogElements,
  parsed: string,
): void {
  clearColorFieldError(elements);
  selectedHex = parsed;
  elements.selectedPreview.style.backgroundColor = parsed;
  elements.hexInput.value = formatHexDisplay(parsed);
  elements.hexInput.removeAttribute("aria-invalid");
  elements.nativePicker.value = parsed;
  syncPresetSelection();
  updateAddButton(elements);
}

function syncFromHexInput(elements: ColorDialogElements): void {
  const parsed = parseHexColor(elements.hexInput.value);
  if (parsed) {
    applySelectedColor(elements, parsed);
    return;
  }
  selectedHex = null;
  if (elements.hexInput.value.trim()) {
    elements.hexInput.setAttribute("aria-invalid", "true");
  } else {
    elements.hexInput.removeAttribute("aria-invalid");
  }
  syncPresetSelection();
  updateAddButton(elements);
}

function syncPresetSelection(): void {
  for (const [hex, btn] of presetButtons) {
    btn.classList.toggle("selected", selectedHex === hex);
  }
}

function updateAddButton(elements: ColorDialogElements): void {
  elements.btnAdd.disabled = selectedHex === null;
}
