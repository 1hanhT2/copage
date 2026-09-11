---
hash: "a63469adf6e851c6275dd15c4233ca804ffb2e25"
short: "a63469a"
date: "2026-09-11"
author: "1hanhT2 <thanh--12@outlook.com>"
version: "null"
tags: ["fix", "ui"]
commit: "fix(ui): eliminate dropdown popover glitch by decoupling contour filter and adding scroll containment"
---

# fix(ui): eliminate dropdown popover glitch by decoupling contour filter and adding scroll containment

## Context
User reported: "the drop down from the quick model sel glitches". When opening the quick model selector dropdown in the extension popup and hovering over menu items, the dropdown exhibited visual tearing, flickering, and 1px coordinate jitter.

### Root Causes
1. **GPU Compositing Conflict (Contour Filter wrapping Backdrop Filter):**
   The contour `filter: drop-shadow(...)` was placed on `.m3-select-wrapper` / `.copage-select-wrap`. Because this container enclosed both the trigger AND the dropdown menu (`.m3-menu-popover` with `backdrop-filter: blur(...)`), Chromium struggled to composite nested backdrop filters inside a parent CSS filter, causing alpha tearing and frame drops. Furthermore, hovering menu items re-evaluated the parent's hover state and re-rasterized the entire menu tree.
2. **Transform Coordinate Jitter:**
   The trigger had `transform: translateY(-1px) scale(1.01)` on hover. When the cursor moved from the trigger into the dropdown menu, the trigger lost `:hover`, snapping back to `scale(1) translateY(0)`. This physically shifted the menu (`top: calc(100% + 4px)`) upwards by 1px directly under the moving cursor, causing rapid mouseenter/mouseleave oscillation.
3. **Popup Viewport Scrollbar Thrashing:**
   The extension popup `body` lacked an explicit `min-height` and overflow containment. Opening the 200px+ dropdown menu caused the popup body to exceed the browser window bounds, instantly injecting a 15px-wide vertical scrollbar, which shrunk the content width and threw the mouse off the hovered item.

## Decision & Implementation
1. **Decoupled Contour Filter Wrapper:**
   Separated `.m3-trigger-contour` / `.copage-trigger-contour` so the SVG drop-shadow filter is strictly applied to the trigger pill container itself, leaving the popover menu outside the filter tree.
2. **Eliminated Scale Jitter & Preserved Stacking:**
   Changed hover transform to a stable `translateY(-1px)` without scale changes. Kept the trigger raised while the menu is open (`.open`). Elevated container `z-index` to 1000 when active.
3. **Viewport & Scroll Containment:**
   Set `body { width: 340px; min-height: 480px; overflow-x: hidden; overflow-y: auto; }` in popup, and added `overscroll-behavior: contain` with sleek custom scrollbars on the menu popovers.
4. **Keyboard & Event Hardening:**
   Added `Enter`/`Space` activation, `Escape` dismissal, and `stopPropagation()` on menu item selection across Popup, In-page Dock, and Options Studio.

## Verification
- [x] `npm test`: 17 of 17 tests passed (extraction, storage, provider catalog, prompt synthesis).
- [x] `npx tsc --noEmit`: 0 TypeScript errors.
- [x] `npm run build`: built clean bundles in `dist/`.
- [x] Manual inspection: smooth hover, no coordinate shifting, zero compositing flicker.
- [x] Memory index regenerated.

## Links
- Commit: `git show a63469adf6e851c6275dd15c4233ca804ffb2e25`

- Memory file: `memory\2026-09-11_a63469a_fix-ui-eliminate-dropdown-popover-glitch-by-decoupling-conto.md`
