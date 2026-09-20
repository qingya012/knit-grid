import { COLOR_PRESETS } from "../colors/colorPresets";
import { formatHexDisplay, parseHexColor } from "../colors/hexColor";

export interface ColorDialogElements {
  dialog: HTMLDialogElement;
  presetGrid: HTMLElement;
  selectedPreview: HTMLElement;
  hexInput: HTMLInputElement;
  btnChooseMore: HTMLButtonElement;
  nativePicker: HTMLInputElement;
  btnCancel: HTMLButtonElement;
  btnAdd: HTMLButtonElement;
}

let selectedHex: string | null = null;
const presetButtons = new Map<string, HTMLButtonElement>();

export function bindColorDialog(
  elements: ColorDialogElements,
  onAdd: (hex: string) => void,
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

  elements.btnCancel.addEventListener("click", () => {
    elements.dialog.close();
  });

  elements.btnAdd.addEventListener("click", () => {
    if (!selectedHex) {
      return;
    }
    onAdd(selectedHex);
    elements.dialog.close();
  });

  elements.dialog.addEventListener("close", () => {
    elements.hexInput.removeAttribute("aria-invalid");
    elements.btnAdd.disabled = false;
  });
}

export function openColorDialog(elements: ColorDialogElements): void {
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
