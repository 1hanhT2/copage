import type { InspectedElementData } from "../lib/types";
import { CopageDock } from "../ui/hud/dock";
import { getCanonicalM3ShapeSvg, getElementM3Shape } from "../lib/shapes";

export class InspectorOverlay {
  private hostEl: HTMLElement;
  private shadow: ShadowRoot;
  private bbox: HTMLElement;
  private tooltip: HTMLElement;
  private dockContainer: HTMLElement;
  private dock: CopageDock;
  private isLocked = false;

  constructor(callbacks: { onUnlock: () => void; onSelectBreadcrumb: (index: number) => void }) {
    // Inject web fonts into document head so Shadow DOM can render Comfortaa, Lexend, JetBrains Mono
    const fontId = "copage-google-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Lexend:wght@400;500;600;700&display=swap";
      try {
        (document.head || document.documentElement).appendChild(link);
      } catch {}
    }

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
        --copage-font-brand: 'Comfortaa', 'Google Sans Display', 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif;
        --copage-font-ui: 'Lexend', 'Google Sans Text', 'Google Sans', 'Segoe UI Variable Text', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
        --copage-font-code: 'JetBrains Mono', 'Google Sans Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
        font-family: var(--copage-font-ui) !important;
        box-sizing: border-box !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }

      /* Universal Expressive Scrollbar Styling */
      *::-webkit-scrollbar {
        width: 5px;
        height: 4px;
      }
      *::-webkit-scrollbar-track {
        background: transparent;
      }
      *::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 9999px;
      }
      *::-webkit-scrollbar-thumb:hover {
        background: rgba(168, 199, 250, 0.45);
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
      }

      /* Bounding Box Highlight (Material 3 Expressive Electric Primary / Mint Locked) */
      .copage-bbox {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        pointer-events: none !important;
        border: 1.5px solid #a8c7fa !important;
        background-color: rgba(168, 199, 250, 0.08) !important;
        border-radius: 6px !important;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.25) !important;
        transition: transform 0.04s cubic-bezier(0.2, 0, 0, 1), width 0.04s cubic-bezier(0.2, 0, 0, 1), height 0.04s cubic-bezier(0.2, 0, 0, 1);
        will-change: transform, width, height;
        display: none;
        z-index: 2147483640 !important;
      }
      .copage-bbox.locked {
        border: 2px solid #78dc77 !important;
        background-color: rgba(120, 220, 119, 0.12) !important;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35) !important;
        animation: copageLockShockwave 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
      }
      @keyframes copageLockShockwave {
        0% { box-shadow: 0 0 0 0 rgba(120, 220, 119, 0.6), 0 0 0 1px rgba(0,0,0,0.5); }
        50% { box-shadow: 0 0 0 4px rgba(120, 220, 119, 0.2), 0 0 0 1px rgba(0,0,0,0.5); }
        100% { box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35); }
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

      /* M3 Expressive Locked Element Beacon Badge */
      .copage-lock-badge {
        position: absolute !important;
        top: -26px !important;
        left: -2px !important;
        background: rgba(16, 32, 20, 0.94) !important;
        border: 1px solid #78dc77 !important;
        color: #78dc77 !important;
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 9.5px !important;
        font-weight: 700 !important;
        letter-spacing: 0.05em !important;
        padding: 2px 8px !important;
        border-radius: 9999px !important;
        display: none;
        align-items: center;
        gap: 5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
        backdrop-filter: blur(8px) !important;
        z-index: 2147483648 !important;
        user-select: none !important;
      }
      .copage-bbox.locked .copage-lock-badge {
        display: inline-flex !important;
        animation: copageLockShockwave 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
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
      .copage-tt-shape {
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        padding: 16px 20px;
        box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.12);
        pointer-events: auto !important;
        z-index: 2147483646 !important;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-x: hidden;
        animation: copageExpressiveSpring 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: var(--copage-font-ui) !important;
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
      .copage-dock-logo {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        display: block;
        object-fit: contain;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      }
      .copage-brand-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        user-select: none;
      }
      .copage-brand-title {
        font-family: var(--copage-font-brand) !important;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #ffffff;
        line-height: 1;
        display: inline-block;
      }
      .copage-tag-badge {
        font-size: 13px;
        font-weight: 600;
        color: #a8c7fa;
        font-family: var(--copage-font-code) !important;
      }
      .copage-dim-badge {
        font-size: 11px;
        color: #ffdf99;
        font-family: var(--copage-font-code) !important;
      }
      .copage-class-badge {
        font-size: 11px;
        color: #d0bcff;
        max-width: 240px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--copage-font-code) !important;
      }

      /* Breadcrumbs bar (M3 Pill Chips) with Sleek Expressive Horizontal Scrollbar */
      .copage-breadcrumbs-bar {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
        scrollbar-color: rgba(168, 199, 250, 0.35) rgba(255, 255, 255, 0.04);
        padding-bottom: 5px;
        -webkit-overflow-scrolling: touch;
      }
      .copage-breadcrumbs-bar::-webkit-scrollbar {
        height: 4px;
      }
      .copage-breadcrumbs-bar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 9999px;
      }
      .copage-breadcrumbs-bar::-webkit-scrollbar-thumb {
        background: rgba(168, 199, 250, 0.35);
        border-radius: 9999px;
        transition: background-color 0.2s ease;
      }
      .copage-breadcrumbs-bar::-webkit-scrollbar-thumb:hover {
        background: #a8c7fa;
      }
      .copage-bc-btn {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.75);
        font-size: 11px;
        font-family: var(--copage-font-code) !important;
        padding: 3px 10px;
        border-radius: 9999px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
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

      /* Material 3 Expressive Physical Pill Shapes (Normalized 14-Point Geometry) */
      .m3-pill-rugged, .copage-pill-rugged {
        clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 16.7%, calc(100% - 6px) 33.3%, 100% 50%, calc(100% - 6px) 66.7%, 100% 83.3%, calc(100% - 8px) 100%, 8px 100%, 0% 83.3%, 6px 66.7%, 0% 50%, 6px 33.3%, 0% 16.7%);
      }
      .m3-pill-scalloped, .copage-pill-scalloped {
        clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 16.7%, calc(100% - 4px) 33.3%, 100% 50%, calc(100% - 4px) 66.7%, 100% 83.3%, calc(100% - 8px) 100%, 8px 100%, 0% 83.3%, 4px 66.7%, 0% 50%, 4px 33.3%, 0% 16.7%);
      }
      .m3-pill-diamond, .copage-pill-diamond {
        clip-path: polygon(12px 0%, calc(100% - 12px) 0%, calc(100% - 6px) 25%, calc(100% - 6px) 25%, 100% 50%, calc(100% - 6px) 75%, calc(100% - 6px) 75%, calc(100% - 12px) 100%, 12px 100%, 6px 75%, 6px 75%, 0% 50%, 6px 25%, 6px 25%);
      }
      .m3-pill-arch, .copage-pill-arch {
        clip-path: polygon(8px 0%, calc(100% - 8px) 0%, calc(100% - 8px) 25%, calc(100% - 2px) 35%, calc(100% - 1px) 50%, calc(100% - 2px) 65%, calc(100% - 8px) 75%, calc(100% - 8px) 100%, 8px 100%, 8px 75%, 2px 65%, 1px 50%, 2px 35%, 8px 25%);
      }
      .m3-pill-round, .copage-pill-round {
        clip-path: polygon(16px 0%, calc(100% - 16px) 0%, calc(100% - 6px) 15%, calc(100% - 1px) 33%, 100% 50%, calc(100% - 1px) 67%, calc(100% - 6px) 85%, calc(100% - 16px) 100%, 16px 100%, 6px 85%, 1px 67%, 0% 50%, 1px 33%, 6px 15%);
      }

      /* M3 Expressive Dropdown Select in HUD with Morphing Pill Silhouette */
      .copage-select-wrap {
        position: relative;
        z-index: 10;
      }
      .copage-select-wrap.open {
        z-index: 1000;
      }
      .copage-trigger-contour {
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
        transition: filter 0.25s ease;
      }
      .copage-trigger-contour:hover,
      .copage-select-wrap.open .copage-trigger-contour {
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
      }
      .copage-select-trigger {
        background-color: #27252d;
        border: none;
        color: rgba(255, 255, 255, 0.92);
        font-size: 11.5px;
        font-weight: 500;
        font-family: 'Lexend', sans-serif !important;
        padding: 7px 18px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        user-select: none;
        transition: clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
      }
      .copage-select-trigger:hover:not(.open) {
        transform: translateY(-1px);
        background-color: rgba(168, 199, 250, 0.12);
      }
      .copage-select-trigger:active {
        transform: scale(0.98);
      }
      .copage-select-trigger.open {
        outline: none;
        background-color: rgba(168, 199, 250, 0.18);
        transform: translateY(-1px);
      }
      /* Dedicated HUD M3 Inner Shape Well */
      .copage-shape-well {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 7px 4px 7px 4px;
        background: rgba(168, 199, 250, 0.16);
        color: #a8c7fa;
        flex-shrink: 0;
        transition: transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.18s ease, color 0.18s ease;
      }
      .copage-select-trigger:hover .copage-shape-well {
        transform: rotate(14deg) scale(1.14);
        border-radius: 4px 7px 4px 7px;
        background: rgba(168, 199, 250, 0.25);
      }
      .copage-select-trigger.open .copage-shape-well {
        transform: rotate(20deg) scale(1.18);
        border-radius: 50%;
        background: #a8c7fa;
        color: #062e6f;
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
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 18px;
        box-shadow: 0px 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12);
        padding: 6px 0;
        z-index: 2147483647;
        display: none;
        max-height: 280px;
        overflow-y: auto;
        overscroll-behavior: contain;
        transform-origin: bottom left;
      }
      .copage-menu-popover.open {
        display: block;
        animation: copageMenuSpring 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .copage-menu-popover::-webkit-scrollbar {
        width: 5px;
      }
      .copage-menu-popover::-webkit-scrollbar-track {
        background: transparent;
      }
      .copage-menu-popover::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.22);
        border-radius: 9999px;
      }
      @keyframes copageMenuSpring {
        from { opacity: 0; transform: scale(0.92) translateY(8px); }
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

      /* M3 Expressive Connected Button Group for Targets */
      .copage-segmented-group {
        display: inline-flex;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 9999px;
        background-color: #15151a;
        padding: 3px;
        gap: 3px;
      }
      .copage-segmented-btn {
        background: transparent;
        border: none;
        padding: 5px 14px;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.18s ease, color 0.18s ease;
        font-family: 'Lexend', sans-serif !important;
      }
      .copage-segmented-btn:hover {
        background-color: rgba(255, 255, 255, 0.09);
        color: #ffffff;
        transform: translateY(-1px);
      }
      .copage-segmented-btn:active {
        animation: copageJelly 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .copage-segmented-btn.active {
        background-color: rgba(168, 199, 250, 0.26);
        color: #a8c7fa;
        font-weight: 600;
        transform: scale(1.04);
      }
      .copage-segmented-btn[data-target="cursor"].active {
        clip-path: polygon(12px 0%, calc(100% - 12px) 0%, calc(100% - 6px) 25%, calc(100% - 6px) 25%, 100% 50%, calc(100% - 6px) 75%, calc(100% - 6px) 75%, calc(100% - 12px) 100%, 12px 100%, 6px 75%, 6px 75%, 0% 50%, 6px 25%, 6px 25%);
      }
      .copage-segmented-btn[data-target="claude"].active {
        clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 16.7%, calc(100% - 4px) 33.3%, 100% 50%, calc(100% - 4px) 66.7%, 100% 83.3%, calc(100% - 8px) 100%, 8px 100%, 0% 83.3%, 4px 66.7%, 0% 50%, 4px 33.3%, 0% 16.7%);
      }
      .copage-segmented-btn[data-target="v0"].active {
        clip-path: polygon(8px 0%, calc(100% - 8px) 0%, calc(100% - 8px) 25%, calc(100% - 2px) 35%, calc(100% - 1px) 50%, calc(100% - 2px) 65%, calc(100% - 8px) 75%, calc(100% - 8px) 100%, 8px 100%, 8px 75%, 2px 65%, 1px 50%, 2px 35%, 8px 25%);
      }
      .copage-segmented-btn[data-target="html-tailwind"].active {
        clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 16.7%, calc(100% - 6px) 33.3%, 100% 50%, calc(100% - 6px) 66.7%, 100% 83.3%, calc(100% - 8px) 100%, 8px 100%, 0% 83.3%, 6px 66.7%, 0% 50%, 6px 33.3%, 0% 16.7%);
      }

      /* M3 Expressive Connected Split Button with Tactile Elevation */
      .copage-split-group {
        display: inline-flex;
        position: relative;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
        transition: filter 0.25s ease;
      }
      .copage-split-group:hover {
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
      }
      .copage-split-main {
        background-color: #a8c7fa;
        color: #062e6f;
        border: none;
        padding: 7px 18px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Lexend', sans-serif !important;
        transition: clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
        /* Left end rugged sawtooth */
        clip-path: polygon(0% 16.7%, 6px 33.3%, 0% 50%, 6px 66.7%, 0% 83.3%, 8px 100%, 100% 100%, 100% 0%, 8px 0%);
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
        padding: 7px 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
        /* Right end rugged sawtooth */
        clip-path: polygon(0% 0%, calc(100% - 8px) 0%, 100% 16.7%, calc(100% - 6px) 33.3%, 100% 50%, calc(100% - 6px) 66.7%, 100% 83.3%, calc(100% - 8px) 100%, 0% 100%);
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
        box-shadow: 0px 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12);
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
      .copage-action-badge {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
      }
      .copage-menu-item:hover .copage-action-badge {
        transform: scale(1.1) rotate(6deg);
        background: rgba(168, 199, 250, 0.16);
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
      .copage-btn-secondary.copage-save-btn {
        background: rgba(168, 199, 250, 0.08);
        border-color: rgba(168, 199, 250, 0.4);
      }
      .copage-btn-secondary.copage-save-btn:hover {
        background: rgba(168, 199, 250, 0.18);
        border-color: #a8c7fa;
      }
      .copage-btn-secondary.copage-save-btn.saved {
        background: rgba(120, 220, 119, 0.16);
        border-color: #78dc77;
        color: #78dc77;
      }
      .copage-btn-secondary.copage-save-btn.saved:hover {
        background: rgba(120, 220, 119, 0.24);
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
        font-family: var(--copage-font-code) !important;
      }
      .copage-code-pre {
        background-color: #0f0f12;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 12px;
        font-family: var(--copage-font-code) !important;
        font-size: 11px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.9);
        max-height: 180px;
        overflow-y: auto;
        overflow-x: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.18) rgba(0, 0, 0, 0.2);
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
      }
      .copage-code-pre::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      .copage-code-pre::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 8px;
      }
      .copage-code-pre::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.18);
        border-radius: 8px;
      }
      .copage-code-pre::-webkit-scrollbar-thumb:hover {
        background: rgba(168, 199, 250, 0.45);
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

    // M3 Expressive Locked Element Beacon
    const lockBadge = document.createElement("div");
    lockBadge.className = "copage-lock-badge";
    lockBadge.innerHTML = `
      ${getCanonicalM3ShapeSvg("gem", 11, "#78dc77")}
      <span>LOCKED</span>
    `;
    this.bbox.appendChild(lockBadge);

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

    const shapeSpan = document.createElement("span");
    shapeSpan.className = "copage-tt-shape";
    shapeSpan.innerHTML = getCanonicalM3ShapeSvg(getElementM3Shape(tag), 11, "#a8c7fa");

    const tagSpan = document.createElement("span");
    tagSpan.className = "copage-tt-tag";
    tagSpan.textContent = `<${tag}>`;

    const dimSpan = document.createElement("span");
    dimSpan.className = "copage-tt-dim";
    dimSpan.textContent = dim;

    this.tooltip.appendChild(shapeSpan);
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
