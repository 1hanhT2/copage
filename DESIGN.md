---
name: Copage
description: High-precision developer inspection overlay and clean HUD controls for capturing and translating web UI into AI prompts.
colors:
  canvas: "#121212"
  surface: "#1e1e1e"
  surface-raised: "#252525"
  surface-subtle: "#2c2c2c"
  border: "rgba(255, 255, 255, 0.12)"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  ink: "rgba(255, 255, 255, 0.87)"
  ink-muted: "rgba(255, 255, 255, 0.60)"
  ink-subtle: "rgba(255, 255, 255, 0.38)"
  inspector-box: "#90caf9"
  inspector-box-hover: "#64b5f6"
  inspector-box-fill: "rgba(144, 202, 249, 0.12)"
  inspector-tag: "#90caf9"
  inspector-class: "#ce93d8"
  inspector-dimension: "#ffe082"
  brand: "#121212"
  brand-accent: "#90caf9"
  brand-accent-hover: "#64b5f6"
  danger: "#f44336"
  danger-surface: "rgba(244, 67, 54, 0.12)"
  success: "#66bb6a"
  success-surface: "rgba(102, 187, 106, 0.12)"
typography:
  code:
    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace'
    fontSize: "12px"
    lineHeight: 1.45
  title:
    fontFamily: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "0.0075em"
  button:
    fontFamily: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.035em"
    textTransform: "uppercase"
  body:
    fontFamily: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    lineHeight: 1.43
    letterSpacing: "0.01071em"
---

# Design System & Craft Floor — Copage

## 1. Aesthetic Direction: Material UI (M3 / MUI Dark)

Copage follows **Material Design (MUI)** specifications for developer consoles and power utilities:
- **MUI Paper & Elevation Hierarchy:** Dark base canvas (`#121212`), elevated surfaces (`#1e1e1e` for cards, `#252525` for elevated dialogs, `#2c2c2c` for toolbars/tooltips), and Material Elevation double-drop shadows.
- **MUI Outlined Text Fields & Selects:** 1px hairline border (`rgba(255, 255, 255, 0.23)`), 4px border radius, clear labels, and primary focus halo (`#90caf9`).
- **MUI Contained & Outlined Buttons:** Elevated primary buttons (`#90caf9` fill with `#0d47a1` high-contrast typography, `letter-spacing: 0.035em; text-transform: uppercase; font-weight: 600`), and outlined utility buttons.
- **Precision Highlighting:** 2px solid primary outline (`#90caf9`) with soft fill (`rgba(144, 202, 249, 0.12)`). Locked state switches to Material Success Green (`#66bb6a`) with subtle glow.
- **MUI Floating Tooltip:** Dark elevated tooltip (`#2c2c2c`) displaying Tag Name in cyan (`#90caf9`), dimensions in amber (`#ffe082`), and classes in purple (`#ce93d8`).
- **Material Symbols & Vector Icons:** All icons are inline SVGs (`24x24` viewBox with `fill="currentColor"`).

## 2. Craft Floor & Absolute Bans

- **Absolute Ban on Emojis:** Never use emojis (such as 🎯, ⚙, 📋, ⚡, 🔍, 💾, 🔒, ✓, ✕) anywhere in the user interface, dialogs, buttons, cards, or status toasts. Always use crisp Material Design inline vector SVGs.
- **No host page layout shifts:** The overlay must be `position: fixed` inside an isolated Shadow DOM container mounted to `document.documentElement` with `pointer-events: none` during hover tracking.
- **No CSS collision:** Scoped within open Shadow DOM. Use custom element tags (`<copage-inspector-root>`) immune to host page CSS resets.
- **No flickering tooltip:** Bounding box and tooltip recalculate smoothly via `requestAnimationFrame`.
- **Keyboard shortcuts:** Immediate visual feedback in the HUD (`Esc` to unlock, `Enter` to lock, arrow keys for tree traversal).

