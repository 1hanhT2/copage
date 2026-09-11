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
      @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Lexend:wght@400;500;600;700&display=swap');

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
        font-family: 'Lexend', 'Google Sans Text', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        box-sizing: border-box !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }

      /* Bounding Box Highlight (Material 3 Expressive Electric Primary / Mint Locked) */
      .copage-bbox {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        pointer-events: none !important;
        border: 2px solid #a8c7fa !important;
        background-color: rgba(168, 199, 250, 0.12) !important;
        border-radius: 8px !important;
        box-shadow: 0 0 0 1px rgba(168, 199, 250, 0.25), 0 0 16px -2px rgba(168, 199, 250, 0.25) !important;
        animation: copagePulseAura 2.2s ease-in-out infinite alternate !important;
        transition: transform 0.04s cubic-bezier(0.2, 0, 0, 1), width 0.04s cubic-bezier(0.2, 0, 0, 1), height 0.04s cubic-bezier(0.2, 0, 0, 1);
        will-change: transform, width, height;
        display: none;
        z-index: 2147483640 !important;
      }
      @keyframes copagePulseAura {
        0% { box-shadow: 0 0 0 1px rgba(168, 199, 250, 0.25), 0 0 12px -2px rgba(168, 199, 250, 0.2); }
        100% { box-shadow: 0 0 0 2px rgba(168, 199, 250, 0.55), 0 0 24px 2px rgba(168, 199, 250, 0.35); }
      }
      .copage-bbox.locked {
        border-color: #78dc77 !important;
        background-color: rgba(120, 220, 119, 0.16) !important;
        box-shadow: 0 0 0 2px rgba(120, 220, 119, 0.5), 0 0 32px rgba(120, 220, 119, 0.35) !important;
        animation: copageLockShockwave 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
      }
      @keyframes copageLockShockwave {
        0% { box-shadow: 0 0 0 0 rgba(120, 220, 119, 0.8), 0 0 16px rgba(120, 220, 119, 0.5); }
        50% { box-shadow: 0 0 0 8px rgba(120, 220, 119, 0.25), 0 0 28px rgba(120, 220, 119, 0.6); }
        100% { box-shadow: 0 0 0 2px rgba(120, 220, 119, 0.5), 0 0 32px rgba(120, 220, 119, 0.35); }
      }

      /* Reticle Precision Calipers */
      .copage-caliper {
        position: absolute !important;
        width: 10px !important;
        height: 10px !important;
        border-color: #a8c7fa !important;
        border-style: solid !important;
        pointer-events: none !important;
        transition: border-color 0.2s ease;
      }
      .copage-caliper.tl {
        top: -3px !important;
        left: -3px !important;
        border-width: 3px 0 0 3px !important;
        border-top-left-radius: 5px !important;
      }
      .copage-caliper.tr {
        top: -3px !important;
        right: -3px !important;
        border-width: 3px 3px 0 0 !important;
        border-top-right-radius: 5px !important;
      }
      .copage-caliper.bl {
        bottom: -3px !important;
        left: -3px !important;
        border-width: 0 0 3px 3px !important;
        border-bottom-left-radius: 5px !important;
      }
      .copage-caliper.br {
        bottom: -3px !important;
        right: -3px !important;
        border-width: 0 3px 3px 0 !important;
        border-bottom-right-radius: 5px !important;
      }
      .copage-bbox.locked .copage-caliper {
        border-color: #78dc77 !important;
      }

      /* Spring Jelly Wobble Keyframes */
      @keyframes copageJelly {
        0% { transform: scale(1, 1); }
        25% { transform: scale(1.08, 0.92); }
        50% { transform: scale(0.95, 1.05); }
        75% { transform: scale(1.02, 0.98); }
        100% { transform: scale(1, 1); }
      }

      /* Floating Tooltip (M3 Expressive Squircle Tooltip) */
      .copage-tooltip {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        pointer-events: none !important;
        background-color: rgba(39, 37, 45, 0.94) !important;
        color: rgba(255, 255, 255, 0.92) !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        border-radius: 12px !important;
        padding: 6px 12px !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
        box-shadow: 0px 8px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08) !important;
        backdrop-filter: blur(16px) !important;
        display: none;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        z-index: 2147483645 !important;
        transition: opacity 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-tt-tag {
        color: #a8c7fa;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace !important;
      }
      .copage-tt-dim {
        color: #ffdf99;
        font-family: 'JetBrains Mono', monospace !important;
      }
      .copage-tt-class {
        color: #d0bcff;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Dock Panel (M3 Expressive Floating Island) */
      .copage-dock-panel {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: 92vw;
        max-width: 760px;
        background: linear-gradient(180deg, rgba(28, 27, 33, 0.96) 0%, rgba(20, 19, 24, 0.98) 100%);
        backdrop-filter: blur(28px) saturate(190%);
        border: 1px solid rgba(168, 199, 250, 0.22);
        border-radius: 28px;
        padding: 16px 20px;
        box-shadow: 0 24px 56px -8px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.08), 0 0 44px -4px rgba(168, 199, 250, 0.22), inset 0 1px 1px rgba(255,255,255,0.16);
        pointer-events: auto !important;
        z-index: 2147483646 !important;
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: copageExpressiveSpring 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: 'Lexend', 'Google Sans Text', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      @keyframes copageExpressiveSpring {
        from { opacity: 0; transform: translate(-50%, 28px) scale(0.92); }
        65% { transform: translate(-50%, -4px) scale(1.015); }
        to { opacity: 1; transform: translate(-50%, 0) scale(1); }
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
        font-family: 'Comfortaa', cursive, sans-serif !important;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: linear-gradient(135deg, #a8c7fa 0%, #7cacf8 100%);
        color: #062e6f;
        padding: 3px 10px;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 2px 8px rgba(168, 199, 250, 0.35);
      }
      .copage-tag-badge {
        font-size: 13px;
        font-weight: 600;
        color: #a8c7fa;
        font-family: 'JetBrains Mono', monospace !important;
      }
      .copage-dim-badge {
        font-size: 11px;
        color: #ffdf99;
        font-family: 'JetBrains Mono', monospace !important;
      }
      .copage-class-badge {
        font-size: 11px;
        color: #d0bcff;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Breadcrumbs bar (M3 Pill Chips) */
      .copage-breadcrumbs-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .copage-bc-btn {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.75);
        font-size: 11px;
        font-family: 'JetBrains Mono', monospace !important;
        padding: 3px 10px;
        border-radius: 9999px;
        cursor: pointer;
        white-space: nowrap;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .copage-bc-btn:hover {
        border-color: #a8c7fa;
        color: #ffffff;
        background-color: rgba(168, 199, 250, 0.16);
        transform: translateY(-1px) scale(1.03);
      }
      .copage-bc-btn:active {
        animation: copageJelly 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* AI Section (M3 Expressive Sub-Surface) */
      .copage-ai-section {
        background-color: rgba(21, 21, 26, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 12px 16px;
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
        font-size: 11.5px;
        color: rgba(255, 255, 255, 0.65);
        font-weight: 500;
      }

      /* M3 Expressive Dropdown Select in HUD */
      .copage-select-wrap {
        position: relative;
      }
      .copage-select-trigger {
        background-color: #27252d;
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: rgba(255, 255, 255, 0.92);
        font-size: 11.5px;
        font-weight: 500;
        font-family: 'Lexend', sans-serif !important;
        padding: 6px 12px;
        border-radius: 9999px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        user-select: none;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.15s ease, background-color 0.15s ease;
      }
      .copage-select-trigger:hover {
        border-color: #a8c7fa;
        transform: translateY(-1px);
        background-color: rgba(255, 255, 255, 0.1);
      }
      .copage-select-trigger:active {
        transform: scale(0.97);
      }
      .copage-select-trigger.open {
        border-color: #a8c7fa;
        box-shadow: 0 0 0 2px rgba(168, 199, 250, 0.25);
      }
      .copage-select-arrow {
        color: rgba(255, 255, 255, 0.55);
        transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
        flex-shrink: 0;
      }
      .copage-select-trigger.open .copage-select-arrow {
        transform: rotate(180deg);
        color: #a8c7fa;
      }
      .copage-menu-popover {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 0;
        min-width: 270px;
        background-color: #27252d;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 20px;
        box-shadow: 0px 16px 36px -4px rgba(0,0,0,0.55), 0px 0px 24px rgba(168,199,250,0.12);
        backdrop-filter: blur(24px);
        padding: 6px 0;
        z-index: 2147483647;
        display: none;
        transform-origin: bottom left;
        animation: copageMenuSpring 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-menu-popover.open {
        display: block;
      }
      @keyframes copageMenuSpring {
        from { opacity: 0; transform: scale(0.88) translateY(12px); }
        65% { transform: scale(1.02) translateY(-2px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .copage-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 16px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.88);
        cursor: pointer;
        transition: background-color 120ms ease;
      }
      .copage-menu-item:first-child {
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
      }
      .copage-menu-item:last-child {
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
      }
      .copage-menu-item:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }
      .copage-menu-item.selected {
        background-color: rgba(168, 199, 250, 0.16);
        color: #a8c7fa;
        font-weight: 500;
      }
      .copage-menu-item-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .copage-menu-item-title {
        font-weight: 500;
        font-size: 12.5px;
      }
      .copage-menu-item-desc {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.55);
      }
      .copage-menu-item-check {
        color: #a8c7fa;
        opacity: 0;
        flex-shrink: 0;
      }
      .copage-menu-item.selected .copage-menu-item-check {
        opacity: 1;
      }

      /* M3 Expressive Segmented Button Group (Capsule Toggle) */
      .copage-segmented-group {
        display: inline-flex;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 9999px;
        overflow: hidden;
        background-color: #15151a;
        padding: 3px;
        gap: 2px;
      }
      .copage-segmented-btn {
        background: transparent;
        border: none;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        border-radius: 9999px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.18s ease, color 0.18s ease;
        font-family: 'Lexend', sans-serif !important;
      }
      .copage-segmented-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }
      .copage-segmented-btn:active {
        animation: copageJelly 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-segmented-btn.active {
        background-color: rgba(168, 199, 250, 0.22);
        color: #a8c7fa;
        font-weight: 600;
      }

      /* M3 Expressive Split Button */
      .copage-split-group {
        display: inline-flex;
        border-radius: 9999px;
        box-shadow: 0px 4px 12px -2px rgba(0,0,0,0.4), 0px 2px 4px 0px rgba(0,0,0,0.2);
        position: relative;
      }
      .copage-split-main {
        background-color: #a8c7fa;
        color: #062e6f;
        border: none;
        border-radius: 9999px 0 0 9999px;
        padding: 7px 16px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Lexend', sans-serif !important;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
      }
      .copage-split-main:hover:not(:disabled) {
        background-color: #7cacf8;
        transform: translateY(-1px);
      }
      .copage-split-main:active:not(:disabled) {
        animation: copageJelly 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-split-main:disabled {
        background-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.38);
        cursor: not-allowed;
      }
      .copage-split-arrow-btn {
        background-color: #a8c7fa;
        color: #062e6f;
        border: none;
        border-left: 1px solid rgba(6, 46, 111, 0.25);
        border-radius: 0 9999px 9999px 0;
        padding: 7px 10px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
      }
      .copage-split-arrow-btn:hover:not(:disabled) {
        background-color: #7cacf8;
      }
      .copage-split-arrow-btn:active:not(:disabled) {
        animation: copageJelly 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-split-arrow-btn:disabled {
        background-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.38);
        cursor: not-allowed;
      }
      .copage-actions-popover {
        position: absolute;
        bottom: calc(100% + 8px);
        right: 0;
        min-width: 210px;
        background-color: #27252d;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 20px;
        box-shadow: 0px 16px 36px -4px rgba(0,0,0,0.55), 0px 0px 24px rgba(168,199,250,0.12);
        backdrop-filter: blur(24px);
        padding: 6px 0;
        z-index: 2147483647;
        display: none;
        transform-origin: bottom right;
        animation: copageMenuSpring 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-actions-popover.open {
        display: block;
      }

      /* M3 Expressive Outlined Button */
      .copage-btn-secondary {
        background: transparent;
        border: 1px solid rgba(168, 199, 250, 0.5);
        color: #a8c7fa;
        border-radius: 9999px;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Lexend', sans-serif !important;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease, border-color 0.15s ease;
      }
      .copage-btn-secondary:hover {
        background-color: rgba(168, 199, 250, 0.12);
        border-color: #a8c7fa;
        transform: translateY(-1px) scale(1.02);
      }
      .copage-btn-secondary:active {
        animation: copageJelly 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
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
        color: rgba(255, 255, 255, 0.65);
        font-family: 'JetBrains Mono', monospace !important;
      }
      .copage-code-pre {
        background-color: #0f0f12;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 12px;
        font-family: "JetBrains Mono", monospace !important;
        font-size: 11px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.9);
        max-height: 180px;
        overflow-y: auto;
        white-space: pre-wrap;
        margin: 0;
      }
    `;

    // 4. Create and attach elements
    this.bbox = document.createElement("div");
    this.bbox.className = "copage-bbox";

    const tlCaliper = document.createElement("div");
    tlCaliper.className = "copage-caliper tl";
    const trCaliper = document.createElement("div");
    trCaliper.className = "copage-caliper tr";
    const blCaliper = document.createElement("div");
    blCaliper.className = "copage-caliper bl";
    const brCaliper = document.createElement("div");
    brCaliper.className = "copage-caliper br";
    this.bbox.appendChild(tlCaliper);
    this.bbox.appendChild(trCaliper);
    this.bbox.appendChild(blCaliper);
    this.bbox.appendChild(brCaliper);

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
