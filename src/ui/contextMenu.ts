export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
}

let menuEl: HTMLDivElement | null = null;
let dismissListeners: (() => void) | null = null;

function ensureMenu(): HTMLDivElement {
  if (!menuEl) {
    menuEl = document.createElement("div");
    menuEl.className = "sidebar-context-menu";
    menuEl.hidden = true;
    menuEl.setAttribute("role", "menu");
    document.body.append(menuEl);
  }
  return menuEl;
}

function closeContextMenu(): void {
  if (dismissListeners) {
    dismissListeners();
    dismissListeners = null;
  }
  if (menuEl) {
    menuEl.hidden = true;
    menuEl.replaceChildren();
  }
}

export function isContextMenuOpen(): boolean {
  return menuEl !== null && !menuEl.hidden;
}

export function openContextMenu(
  clientX: number,
  clientY: number,
  items: ContextMenuItem[],
): void {
  closeContextMenu();
  const menu = ensureMenu();
  menu.replaceChildren();

  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-context-menu__item";
    btn.setAttribute("role", "menuitem");
    btn.textContent = item.label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeContextMenu();
      item.onSelect();
    });
    menu.append(btn);
  }

  menu.hidden = false;
  const pad = 4;
  const rect = menu.getBoundingClientRect();
  let left = clientX;
  let top = clientY;
  if (left + rect.width > window.innerWidth - pad) {
    left = Math.max(pad, window.innerWidth - rect.width - pad);
  }
  if (top + rect.height > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - rect.height - pad);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  const onPointerDown = (e: PointerEvent): void => {
    if (e.target instanceof Node && menu.contains(e.target)) {
      return;
    }
    closeContextMenu();
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeContextMenu();
    }
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("keydown", onKeyDown, true);
  dismissListeners = () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
  };
}

export function closeSidebarContextMenu(): void {
  closeContextMenu();
}
