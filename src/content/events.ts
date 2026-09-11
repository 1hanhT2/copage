export interface KeyboardNavHandlers {
  onParent: () => void;
  onChild: () => void;
  onPrevSibling: () => void;
  onNextSibling: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const INTERCEPT_EVENTS = ["click", "mousedown", "mouseup", "pointerdown", "pointerup"];

export class EventManager {
  private isCapturing = false;
  private clickInterceptor: (e: Event) => void;
  private keydownInterceptor: (e: KeyboardEvent) => void;
  private navHandlers: KeyboardNavHandlers;

  constructor(onSelect: (target: Element) => void, navHandlers: KeyboardNavHandlers) {
    this.navHandlers = navHandlers;

    this.clickInterceptor = (e: Event) => {
      if (!this.isCapturing) return;

      // Ignore clicks originating from inside Copage Shadow DOM
      const path = e.composedPath();
      for (const el of path) {
        if (el instanceof Element && (el.tagName.toLowerCase() === "copage-inspector-root" || el.id === "copage-inspector-root")) {
          return;
        }
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const target = (path[0] instanceof Element ? path[0] : e.target) as Element;
      if (e.type === "click" && target instanceof Element) {
        onSelect(target);
      }
    };

    this.keydownInterceptor = (e: KeyboardEvent) => {
      if (!this.isCapturing) return;

      // If typing inside an input/textarea/select inside our dock, do not intercept navigation keys
      const path = e.composedPath();
      for (const el of path) {
        if (el instanceof Element && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
          if (e.key === "Escape") {
            this.navHandlers.onCancel();
          }
          return;
        }
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          this.navHandlers.onParent();
          break;
        case "ArrowDown":
          e.preventDefault();
          this.navHandlers.onChild();
          break;
        case "ArrowLeft":
          e.preventDefault();
          this.navHandlers.onPrevSibling();
          break;
        case "ArrowRight":
          e.preventDefault();
          this.navHandlers.onNextSibling();
          break;
        case "Enter":
          e.preventDefault();
          this.navHandlers.onConfirm();
          break;
        case "Escape":
          e.preventDefault();
          this.navHandlers.onCancel();
          break;
      }
    };
  }

  public enable() {
    this.isCapturing = true;
    INTERCEPT_EVENTS.forEach((evt) => {
      window.addEventListener(evt, this.clickInterceptor, { capture: true });
    });
    window.addEventListener("keydown", this.keydownInterceptor, { capture: true });
  }

  public disable() {
    this.isCapturing = false;
    INTERCEPT_EVENTS.forEach((evt) => {
      window.removeEventListener(evt, this.clickInterceptor, { capture: true });
    });
    window.removeEventListener("keydown", this.keydownInterceptor, { capture: true });
  }
}
