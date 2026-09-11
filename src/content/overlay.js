import { CopageDock } from "../ui/hud/dock";
export class InspectorOverlay {
    hostEl;
    shadow;
    bbox;
    tooltip;
    dockContainer;
    dock;
    isLocked = false;
    constructor(callbacks) {
        // 1. Create isolated custom host on documentElement
        this.hostEl = document.createElement("copage-inspector-root");
        this.shadow = this.hostEl.attachShadow({ mode: "open" });
        // 2. Inject scoped CSS
        const style = document.createElement("style");
        style.textContent = `
      :host {
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
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

      /* Bounding Box Highlight */
      .copage-bbox {
        position: fixed;
        pointer-events: none;
        border: 1.5px solid #38bdf8;
        background-color: rgba(56, 189, 248, 0.08);
        border-radius: 2px;
        transition: transform 0.04s ease-out, width 0.04s ease-out, height 0.04s ease-out;
        will-change: transform, width, height;
        display: none;
        z-index: 10;
      }
      .copage-bbox.locked {
        border-color: #22c55e;
        background-color: rgba(34, 197, 94, 0.06);
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3), 0 0 16px rgba(34, 197, 94, 0.15);
      }

      /* Floating Tooltip */
      .copage-tooltip {
        position: fixed;
        pointer-events: none;
        background-color: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        line-height: 1.2;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        display: none;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        z-index: 20;
      }
      .copage-tt-tag {
        color: #38bdf8;
        font-weight: 700;
      }
      .copage-tt-dim {
        color: #fbbf24;
        font-family: monospace;
      }
      .copage-tt-class {
        color: #c084fc;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Dock Panel */
      .copage-dock-panel {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 92vw;
        max-width: 720px;
        background-color: #0f172a;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
        pointer-events: auto !important;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: copageSlideUp 0.16s ease-out;
      }

      @keyframes copageSlideUp {
        from { opacity: 0; transform: translate(-50%, 12px); }
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
        gap: 6px;
        flex-wrap: wrap;
      }
      .copage-brand-tag {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        background: #2563eb;
        color: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .copage-tag-badge {
        font-size: 12px;
        font-weight: 700;
        color: #38bdf8;
        font-family: monospace;
      }
      .copage-dim-badge {
        font-size: 11px;
        color: #fbbf24;
        font-family: monospace;
      }
      .copage-class-badge {
        font-size: 11px;
        color: #c084fc;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Breadcrumbs bar */
      .copage-breadcrumbs-bar {
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .copage-bc-btn {
        background: transparent;
        border: 1px solid #1e293b;
        color: #94a3b8;
        font-size: 11px;
        font-family: monospace;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.1s ease;
      }
      .copage-bc-btn:hover {
        border-color: #38bdf8;
        color: #f8fafc;
        background-color: #1e293b;
      }

      /* Action Grid */
      .copage-action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
      }
      .copage-action-card {
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 8px 10px;
        text-align: left;
        cursor: pointer;
        transition: all 0.12s ease;
      }
      .copage-action-card:hover {
        background-color: #273549;
        border-color: #38bdf8;
        transform: translateY(-1px);
      }
      .copage-card-title {
        font-size: 11px;
        font-weight: 600;
        color: #f8fafc;
        margin-bottom: 2px;
      }
      .copage-card-desc {
        font-size: 10px;
        color: #94a3b8;
      }

      /* AI Section */
      .copage-ai-section {
        background-color: #0b1120;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .copage-ai-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .copage-model-info {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .copage-model-select {
        background-color: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        font-size: 11px;
        padding: 3px 6px;
        border-radius: 4px;
        outline: none;
      }
      .copage-btn-primary {
        background-color: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.12s ease;
      }
      .copage-btn-primary:hover:not(:disabled) {
        background-color: #1d4ed8;
      }
      .copage-btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .copage-btn-secondary {
        background: transparent;
        border: 1px solid #334155;
        color: #94a3b8;
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.12s ease;
      }
      .copage-btn-secondary:hover {
        background-color: #1e293b;
        color: #f8fafc;
      }
      .copage-code-preview-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .copage-code-preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .copage-code-pre {
        background-color: #030712;
        border: 1px solid #1f2937;
        border-radius: 6px;
        padding: 8px;
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: #94a3b8;
        max-height: 180px;
        overflow-y: auto;
        white-space: pre-wrap;
        margin: 0;
      }
    `;
        // 3. Create elements
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
        document.documentElement.appendChild(this.hostEl);
    }
    updateHover(target) {
        if (this.isLocked)
            return;
        const r = target.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) {
            this.clearHover();
            return;
        }
        // Position bounding box via GPU translate
        this.bbox.style.display = "block";
        this.bbox.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
        this.bbox.style.width = `${r.width}px`;
        this.bbox.style.height = `${r.height}px`;
        this.bbox.classList.remove("locked");
        // Position & update tooltip
        const tag = target.tagName.toLowerCase();
        const className = typeof target.className === "string" ? target.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
        const dim = `${Math.round(r.width)} × ${Math.round(r.height)}`;
        this.tooltip.innerHTML = `
      <span class="copage-tt-tag">&lt;${tag}&gt;</span>
      <span class="copage-tt-dim">${dim}</span>
      ${className ? `<span class="copage-tt-class">.${className}</span>` : ""}
    `;
        this.tooltip.style.display = "flex";
        // Position clamping
        const ttHeight = 26;
        const offset = 6;
        let top = r.top - ttHeight - offset;
        if (top < 8) {
            top = r.bottom + offset; // Flip below
        }
        let left = r.left;
        const maxLeft = window.innerWidth - 220;
        if (left > maxLeft)
            left = maxLeft;
        if (left < 8)
            left = 8;
        this.tooltip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    }
    clearHover() {
        if (this.isLocked)
            return;
        this.bbox.style.display = "none";
        this.tooltip.style.display = "none";
    }
    lock(data) {
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
    unlock() {
        this.isLocked = false;
        this.bbox.classList.remove("locked");
        this.bbox.style.display = "none";
        this.tooltip.style.display = "none";
        this.dock.hide();
    }
    destroy() {
        this.dock.hide();
        this.hostEl.remove();
    }
}
