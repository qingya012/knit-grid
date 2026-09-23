export function bindEditorDialogDismiss(
  dialog: HTMLDialogElement,
  onCancel: () => void,
): void {
  let backdropPointerDown = false;

  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    onCancel();
  });

  dialog.addEventListener("pointerdown", (e) => {
    backdropPointerDown = e.target === dialog;
  });

  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog || !backdropPointerDown) {
      return;
    }
    onCancel();
  });
}

export function bindDialogEnterSubmit(
  dialog: HTMLDialogElement,
  primaryButton: HTMLButtonElement,
): void {
  dialog.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter") {
        return;
      }
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      if (primaryButton.disabled) {
        return;
      }
      primaryButton.click();
    },
    true,
  );
}
