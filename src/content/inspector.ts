import { InspectorOverlay } from "./overlay";
import { EventManager } from "./events";
import { extractElementData } from "../extractor";
import type { InspectedElementData } from "../lib/types";

export function getDeepElementFromPoint(x: number, y: number): HTMLElement | null {
  let el = document.elementFromPoint(x, y);
  while (el && (el as Element).shadowRoot) {
    const nested = (el as Element).shadowRoot!.elementFromPoint(x, y);
    if (!nested || nested === el) break;
    el = nested;
  }
  if (!el || el.tagName.toLowerCase() === "copage-inspector-root") return null;
  return el as HTMLElement;
}

export class ElementInspector {
  private overlay: InspectorOverlay;
  private eventManager: EventManager;
  private currentHoverTarget: HTMLElement | null = null;
  private currentLockedTarget: HTMLElement | null = null;
  private currentElementData: InspectedElementData | null = null;
  private rafId: number | null = null;
  private isActive = false;
  private isLocked = false;
  private pointerMoveHandler: (e: PointerEvent) => void;

  constructor() {
    this.overlay = new InspectorOverlay({
      onUnlock: () => this.unlock(),
      onSelectBreadcrumb: (index: number) => this.selectBreadcrumbIndex(index)
    });

    this.eventManager = new EventManager(
      (selected) => this.lock(selected),
      {
        onParent: () => this.traverseParent(),
        onChild: () => this.traverseChild(),
        onPrevSibling: () => this.traversePrevSibling(),
        onNextSibling: () => this.traverseNextSibling(),
        onConfirm: () => {
          if (!this.isLocked && this.currentHoverTarget) {
            this.lock(this.currentHoverTarget);
          }
        },
        onCancel: () => {
          if (this.isLocked) {
            this.unlock();
          } else {
            this.deactivate();
          }
        }
      }
    );

    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.isActive || this.isLocked) return;
      const x = e.clientX;
      const y = e.clientY;

      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          const target = getDeepElementFromPoint(x, y);
          if (target && target !== this.currentHoverTarget) {
            this.currentHoverTarget = target;
            this.overlay.updateHover(target);
          }
        });
      }
    };
  }

  public activate() {
    if (this.isActive) return;
    this.isActive = true;
    this.isLocked = false;
    this.eventManager.enable();
    window.addEventListener("pointermove", this.pointerMoveHandler, { passive: true });
  }

  public deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    this.unlock();
    this.eventManager.disable();
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    this.overlay.clearHover();
  }

  public toggle(): boolean {
    if (this.isActive) {
      this.deactivate();
      return false;
    } else {
      this.activate();
      return true;
    }
  }

  public lock(target: HTMLElement) {
    this.isLocked = true;
    this.currentLockedTarget = target;
    this.currentElementData = extractElementData(target);
    this.overlay.lock(this.currentElementData);
  }

  public unlock() {
    this.isLocked = false;
    this.currentLockedTarget = null;
    this.currentElementData = null;
    this.overlay.unlock();
  }

  private selectBreadcrumbIndex(targetIndex: number) {
    if (!this.currentLockedTarget || !this.currentElementData) return;
    let node: HTMLElement | null = this.currentLockedTarget;
    let steps = 0;
    while (node && steps < targetIndex) {
      if (node.parentElement && node.parentElement !== document.body) {
        node = node.parentElement;
        steps++;
      } else {
        break;
      }
    }
    if (node) {
      this.lock(node);
    }
  }

  private traverseParent() {
    const target = this.currentLockedTarget || this.currentHoverTarget;
    if (target && target.parentElement && target.parentElement !== document.body && target.parentElement !== document.documentElement) {
      if (this.isLocked) {
        this.lock(target.parentElement);
      } else {
        this.currentHoverTarget = target.parentElement;
        this.overlay.updateHover(target.parentElement);
      }
    }
  }

  private traverseChild() {
    const target = this.currentLockedTarget || this.currentHoverTarget;
    if (target && target.firstElementChild instanceof HTMLElement) {
      if (this.isLocked) {
        this.lock(target.firstElementChild);
      } else {
        this.currentHoverTarget = target.firstElementChild;
        this.overlay.updateHover(target.firstElementChild);
      }
    }
  }

  private traversePrevSibling() {
    const target = this.currentLockedTarget || this.currentHoverTarget;
    if (target && target.previousElementSibling instanceof HTMLElement) {
      if (this.isLocked) {
        this.lock(target.previousElementSibling);
      } else {
        this.currentHoverTarget = target.previousElementSibling;
        this.overlay.updateHover(target.previousElementSibling);
      }
    }
  }

  private traverseNextSibling() {
    const target = this.currentLockedTarget || this.currentHoverTarget;
    if (target && target.nextElementSibling instanceof HTMLElement) {
      if (this.isLocked) {
        this.lock(target.nextElementSibling);
      } else {
        this.currentHoverTarget = target.nextElementSibling;
        this.overlay.updateHover(target.nextElementSibling);
      }
    }
  }

  public destroy() {
    this.deactivate();
    this.overlay.destroy();
  }
}
