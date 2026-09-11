import type { InspectedElementData } from "../lib/types";
import { CopageDock } from "../ui/hud/dock";

export class InspectorOverlay {
  private hostEl: HTMLElement;
  private shadow: ShadowRoot;
  private bbox: HTMLElement;
  private tooltip: HTMLElement;
  private dockContainer: HTMLElement;
  private dock: CopageDock;
  private isLocked = false;

  constructor(callbacks: { onUnlock: () => void; onSelectBreadcrumb: (index: number) => void }) {
    // 1. Create custom host element and apply inline styles (custom tag avoids matching page div CSS)
    this.hostEl = document.createElement("copage-inspector-root");
    this.hostEl.id = "copage-inspector-root";
    this.hostEl.style.cssText = `
      all: initial !important;
      display: block !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
    `;

    // 2. Attach isolated ShadowRoot
    this.shadow = this.hostEl.attachShadow({ mode: "open" });

    // 3. Inject scoped CSS
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial !important;
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        box-sizing: border-box !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }

      /* Bounding Box Highlight (Material primary / success) */
      .copage-bbox {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        pointer-events: none !important;
        border: 2px solid #90caf9 !important;
        background-color: rgba(144, 202, 249, 0.12) !important;
        border-radius: 2px !important;
        transition: transform 0.03s linear, width 0.03s linear, height 0.03s linear;
        will-change: transform, width, height;
        display: none;
        z-index: 2147483640 !important;
      }
      .copage-bbox.locked {
        border-color: #66bb6a !important;
        background-color: rgba(102, 187, 106, 0.1) !important;
        box-shadow: 0 0 0 1px rgba(102, 187, 106, 0.4), 0 0 16px rgba(102, 187, 106, 0.25) !important;
      }

      /* Floating Tooltip (MUI Tooltip Style) */
      .copage-tooltip {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        pointer-events: none !important;
        background-color: #2c2c2c !important;
        color: rgba(255, 255, 255, 0.87) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 4px !important;
        padding: 5px 10px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        box-shadow: 0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12) !important;
        display: none;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        z-index: 2147483645 !important;
      }
      .copage-tt-tag {
        color: #90caf9;
        font-weight: 600;
        font-family: monospace;
      }
      .copage-tt-dim {
        color: #ffe082;
        font-family: monospace;
      }
      .copage-tt-class {
        color: #ce93d8;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Dock Panel (MUI Paper Elevation-8) */
      .copage-dock-panel {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 92vw;
        max-width: 740px;
        background-color: #1e1e1e;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 16px 18px;
        box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.3), 0px 8px 10px 1px rgba(0,0,0,0.22), 0px 3px 14px 2px rgba(0,0,0,0.18);
        pointer-events: auto !important;
        z-index: 2147483646 !important;
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: copageSlideUp 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes copageSlideUp {
        from { opacity: 0; transform: translate(-50%, 14px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      .copage-dock-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .copage-badge-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .copage-brand-tag {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: #90caf9;
        color: #0d47a1;
        padding: 2px 7px;
        border-radius: 4px;
      }
      .copage-tag-badge {
        font-size: 13px;
        font-weight: 600;
        color: #90caf9;
        font-family: monospace;
      }
      .copage-dim-badge {
        font-size: 11px;
        color: #ffe082;
        font-family: monospace;
      }
      .copage-class-badge {
        font-size: 11px;
        color: #ce93d8;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Breadcrumbs bar (MUI Chips) */
      .copage-breadcrumbs-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .copage-bc-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        font-family: monospace;
        padding: 2px 8px;
        border-radius: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
      }
      .copage-bc-btn:hover {
        border-color: #90caf9;
        color: #ffffff;
        background-color: rgba(144, 202, 249, 0.12);
      }

      /* Action Grid (MUI Action Cards) */
      .copage-action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
        gap: 8px;
      }
      .copage-action-card {
        background-color: #252525;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        padding: 10px 12px;
        text-align: left;
        cursor: pointer;
        transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      .copage-action-card:hover {
        background-color: rgba(255, 255, 255, 0.08);
        border-color: #90caf9;
        transform: translateY(-1px);
      }
      .copage-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .copage-card-title {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.87);
        letter-spacing: 0.01em;
      }
      .copage-card-icon {
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
      }
      .copage-card-desc {
        font-size: 10.5px;
        color: rgba(255, 255, 255, 0.60);
        line-height: 1.35;
      }

      /* AI Section (MUI Sub-Paper) */
      .copage-ai-section {
        background-color: #171717;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .copage-ai-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .copage-model-info {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
      }
      .copage-model-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.60);
        font-weight: 400;
      }

      /* MUI Dropdown Select in HUD */
      .copage-select-wrap {
        position: relative;
      }
      .copage-select-trigger {
        background-color: #252525;
        border: 1px solid rgba(255, 255, 255, 0.23);
        color: rgba(255, 255, 255, 0.87);
        font-size: 11.5px;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        user-select: none;
        transition: border-color 150ms ease;
      }
      .copage-select-trigger:hover,
      .copage-select-trigger.open {
        border-color: #90caf9;
      }
      .copage-select-arrow {
        color: rgba(255, 255, 255, 0.5);
        transition: transform 180ms ease;
        flex-shrink: 0;
      }
      .copage-select-trigger.open .copage-select-arrow {
        transform: rotate(180deg);
        color: #90caf9;
      }
      .copage-menu-popover {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        min-width: 260px;
        background-color: #292929;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.4), 0px 8px 10px 1px rgba(0,0,0,0.28), 0px 3px 14px 2px rgba(0,0,0,0.22);
        padding: 4px 0;
        z-index: 2147483647;
        display: none;
        animation: copageMenuPop 140ms ease;
      }
      .copage-menu-popover.open {
        display: block;
      }
      @keyframes copageMenuPop {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .copage-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.87);
        cursor: pointer;
        transition: background-color 120ms ease;
      }
      .copage-menu-item:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }
      .copage-menu-item.selected {
        background-color: rgba(144, 202, 249, 0.14);
        color: #90caf9;
        font-weight: 500;
      }
      .copage-menu-item-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .copage-menu-item-title {
        font-weight: 500;
        font-size: 12px;
      }
      .copage-menu-item-desc {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
      }
      .copage-menu-item-check {
        color: #90caf9;
        opacity: 0;
        flex-shrink: 0;
      }
      .copage-menu-item.selected .copage-menu-item-check {
        opacity: 1;
      }

      /* MUI Segmented Button Group (Toggle Buttons) */
      .copage-segmented-group {
        display: inline-flex;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        overflow: hidden;
        background-color: #252525;
      }
      .copage-segmented-btn {
        background: transparent;
        border: none;
        border-right: 1px solid rgba(255, 255, 255, 0.12);
        padding: 5px 11px;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.65);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: background-color 150ms ease, color 150ms ease;
        font-family: inherit;
      }
      .copage-segmented-btn:last-child {
        border-right: none;
      }
      .copage-segmented-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.95);
      }
      .copage-segmented-btn.active {
        background-color: rgba(144, 202, 249, 0.18);
        color: #90caf9;
        font-weight: 600;
      }

      /* MUI Split Button */
      .copage-split-group {
        display: inline-flex;
        border-radius: 4px;
        box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12);
        position: relative;
      }
      .copage-split-main {
        background-color: #90caf9;
        color: #0d47a1;
        border: none;
        border-radius: 4px 0 0 4px;
        padding: 6px 14px;
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background-color 200ms ease;
      }
      .copage-split-main:hover:not(:disabled) {
        background-color: #64b5f6;
      }
      .copage-split-main:disabled {
        background-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.38);
        cursor: not-allowed;
      }
      .copage-split-arrow-btn {
        background-color: #90caf9;
        color: #0d47a1;
        border: none;
        border-left: 1px solid rgba(13, 71, 161, 0.3);
        border-radius: 0 4px 4px 0;
        padding: 6px 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 200ms ease;
      }
      .copage-split-arrow-btn:hover:not(:disabled) {
        background-color: #64b5f6;
      }
      .copage-split-arrow-btn:disabled {
        background-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.38);
        cursor: not-allowed;
      }
      .copage-actions-popover {
        position: absolute;
        bottom: calc(100% + 6px);
        right: 0;
        min-width: 200px;
        background-color: #292929;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.4), 0px 8px 10px 1px rgba(0,0,0,0.28), 0px 3px 14px 2px rgba(0,0,0,0.22);
        padding: 4px 0;
        z-index: 2147483647;
        display: none;
        animation: copageMenuPop 140ms ease;
      }
      .copage-actions-popover.open {
        display: block;
      }

      /* MUI Outlined Button */
      .copage-btn-secondary {
        background: transparent;
        border: 1px solid rgba(144, 202, 249, 0.5);
        color: #90caf9;
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      .copage-btn-secondary:hover {
        background-color: rgba(144, 202, 249, 0.08);
        border-color: #90caf9;
      }

      .copage-code-preview-wrap {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .copage-code-preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .copage-code-title {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.60);
        font-family: monospace;
      }
      .copage-code-pre {
        background-color: #121212;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        padding: 10px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.87);
        max-height: 180px;
        overflow-y: auto;
        white-space: pre-wrap;
        margin: 0;
      }
    `;

    // 4. Create and attach elements
    this.bbox = document.createElement("div");
    this.bbox.className = "copage-bbox";

    this.tooltip = document.createElement("div");
    this.tooltip.className = "copage-tooltip";

    this.dockContainer = document.createElement("div");
    this.dock = new CopageDock(this.dockContainer, callbacks);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.bbox);
    this.shadow.appendChild(this.tooltip);
    this.shadow.appendChild(this.dockContainer);

    // Mount to documentElement (SingleFile approach) to avoid body transform stacking contexts
    const mount = () => {
      if (!this.hostEl.isConnected) {
        const mountPoint = document.documentElement || document.body;
        if (mountPoint) {
          mountPoint.appendChild(this.hostEl);
        } else {
          document.addEventListener("DOMContentLoaded", () => {
            (document.documentElement || document.body)?.appendChild(this.hostEl);
          }, { once: true });
        }
      }
    };
    mount();
  }

  public updateHover(target: Element) {
    if (this.isLocked) return;

    const r = target.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      this.clearHover();
      return;
    }

    // Position bounding box via GPU translate from (0,0)
    this.bbox.style.display = "block";
    this.bbox.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
    this.bbox.style.width = `${r.width}px`;
    this.bbox.style.height = `${r.height}px`;
    this.bbox.classList.remove("locked");

    // Build tooltip safely without innerHTML (Trusted Types safe)
    const tag = target.tagName.toLowerCase();
    const rawClass = typeof target.className === "string" ? target.className : (target.getAttribute("class") || "");
    const className = rawClass.split(/\s+/).filter(Boolean).slice(0, 2).join(".");
    const dim = `${Math.round(r.width)} × ${Math.round(r.height)}`;

    this.tooltip.textContent = "";

    const tagSpan = document.createElement("span");
    tagSpan.className = "copage-tt-tag";
    tagSpan.textContent = `<${tag}>`;

    const dimSpan = document.createElement("span");
    dimSpan.className = "copage-tt-dim";
    dimSpan.textContent = dim;

    this.tooltip.appendChild(tagSpan);
    this.tooltip.appendChild(dimSpan);

    if (className) {
      const classSpan = document.createElement("span");
      classSpan.className = "copage-tt-class";
      classSpan.textContent = `.${className}`;
      this.tooltip.appendChild(classSpan);
    }

    this.tooltip.style.display = "flex";

    // Viewport clamping
    const ttHeight = 28;
    const offset = 6;
    let top = r.top - ttHeight - offset;
    if (top < 8) {
      top = r.bottom + offset; // Flip below
    }
    let left = r.left;
    const maxLeft = window.innerWidth - 240;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    this.tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  public clearHover() {
    if (this.isLocked) return;
    this.bbox.style.display = "none";
    this.tooltip.style.display = "none";
  }

  public lock(data: InspectedElementData) {
    this.isLocked = true;
    this.tooltip.style.display = "none";

    // Lock bounding box with emerald outline
    this.bbox.style.display = "block";
    this.bbox.style.transform = `translate3d(${data.rect.left}px, ${data.rect.top}px, 0)`;
    this.bbox.style.width = `${data.rect.width}px`;
    this.bbox.style.height = `${data.rect.height}px`;
    this.bbox.classList.add("locked");

    // Show floating action dock
    this.dock.show(data);
  }

  public updateLockedPosition(r: DOMRect) {
    if (!this.isLocked) return;
    this.bbox.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
    this.bbox.style.width = `${r.width}px`;
    this.bbox.style.height = `${r.height}px`;
  }

  public unlock() {
    this.isLocked = false;
    this.bbox.classList.remove("locked");
    this.bbox.style.display = "none";
    this.tooltip.style.display = "none";
    this.dock.hide();
  }

  public destroy() {
    this.dock.hide();
    this.hostEl.remove();
  }
}
