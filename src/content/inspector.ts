import { InspectorOverlay } from "./overlay";
import { EventManager } from "./events";
import { extractElementData } from "../extractor";
import type { InspectedElementData } from "../lib/types";

export function getDeepElementFromPoint(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  if (!el) return null;
  const initialTag = el.tagName.toLowerCase();
  if (initialTag === "copage-inspector-root" || el.id === "copage-inspector-root") return null;

  while (el && (el as Element).shadowRoot) {
    const nested = (el as Element).shadowRoot!.elementFromPoint(x, y);
    if (!nested || nested === el) break;
    const nestedTag = nested.tagName.toLowerCase();
    if (nestedTag === "copage-inspector-root" || nested.id === "copage-inspector-root") return null;
    el = nested;
  }
  if (!el) return null;
  const tag = el.tagName.toLowerCase();
  if (tag === "copage-inspector-root" || el.id === "copage-inspector-root") return null;

  const root = el.getRootNode();
  if (root instanceof ShadowRoot) {
    const hostTag = root.host?.tagName.toLowerCase();
    if (root.host?.id === "copage-inspector-root" || hostTag === "copage-inspector-root") {
      return null;
    }
  }

  return el;
}

export class ElementInspector {
  private overlay: InspectorOverlay;
  private eventManager: EventManager;
  private currentHoverTarget: Element | null = null;
  private currentLockedTarget: Element | null = null;
  private currentElementData: InspectedElementData | null = null;
  private rafId: number | null = null;
  private scrollRafId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private isActive = false;
  private isLocked = false;
  private pointerMoveHandler: (e: PointerEvent) => void;
  private scrollHandler: () => void;

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
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          if (!this.isActive || this.isLocked) return;
          const target = getDeepElementFromPoint(this.lastPointerX, this.lastPointerY);
          if (target && target !== this.currentHoverTarget) {
            this.currentHoverTarget = target;
            this.overlay.updateHover(target);
          }
        });
      }
    };

    this.scrollHandler = () => {
      if (!this.isActive) return;
      if (!this.scrollRafId) {
        this.scrollRafId = requestAnimationFrame(() => {
          this.scrollRafId = null;
          if (!this.isActive) return;
          if (this.isLocked && this.currentLockedTarget) {
            this.overlay.updateLockedPosition(this.currentLockedTarget.getBoundingClientRect());
          } else if (this.currentHoverTarget) {
            this.overlay.updateHover(this.currentHoverTarget);
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
    window.addEventListener("scroll", this.scrollHandler, { capture: true, passive: true });
  }

  public deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.scrollRafId) {
      cancelAnimationFrame(this.scrollRafId);
      this.scrollRafId = null;
    }
    this.unlock();
    this.eventManager.disable();
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("scroll", this.scrollHandler);
    this.overlay.clearHover();
  }

  public getIsActive(): boolean {
    return this.isActive;
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

  public lock(target: Element) {
    this.isLocked = true;
    this.currentLockedTarget = target;
    const el = target instanceof HTMLElement ? target : target.parentElement || (target as unknown as HTMLElement);
    this.currentElementData = extractElementData(el);
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
    let node: Element | null = this.currentLockedTarget;
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
    if (target && target.firstElementChild) {
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
    if (target && target.previousElementSibling) {
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
    if (target && target.nextElementSibling) {
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
