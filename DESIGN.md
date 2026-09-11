---
name: Copage
description: High-precision developer inspection overlay and expressive M3 HUD controls for capturing and translating web UI into AI prompts.
colors:
  canvas: "#0f0f12"
  surface: "#1c1b21"
  surface-low: "#15151a"
  surface-high: "#27252d"
  surface-highest: "#323039"
  border: "rgba(255, 255, 255, 0.12)"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  ink: "rgba(255, 255, 255, 0.92)"
  ink-muted: "rgba(255, 255, 255, 0.65)"
  ink-subtle: "rgba(255, 255, 255, 0.42)"
  primary: "#a8c7fa"
  on-primary: "#062e6f"
  primary-container: "#0842a0"
  on-primary-container: "#d3e3fd"
  secondary: "#7cacf8"
  secondary-container: "#2b3d5b"
  tertiary: "#d0bcff"
  tertiary-container: "#4a3a75"
  inspector-box: "#a8c7fa"
  inspector-box-hover: "#7cacf8"
  inspector-box-fill: "rgba(168, 199, 250, 0.14)"
  inspector-tag: "#a8c7fa"
  inspector-class: "#d0bcff"
  inspector-dimension: "#ffdf99"
  danger: "#ffb4ab"
  danger-surface: "rgba(255, 180, 171, 0.14)"
  success: "#78dc77"
  success-surface: "rgba(120, 220, 119, 0.14)"
typography:
  code:
    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace'
    fontSize: "12px"
    lineHeight: 1.45
  title:
    fontFamily: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "0.0075em"
  button:
    fontFamily: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0.03em"
  body:
    fontFamily: 'Roboto, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    lineHeight: 1.45
    letterSpacing: "0.01071em"
shapes:
  full: "9999px"
  extra-large: "28px"
  large: "20px"
  medium: "16px"
  small: "12px"
motion:
  spring-overshoot: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  natural-settle: "cubic-bezier(0.2, 0, 0, 1)"
---

# Design System & Craft Floor — Copage (Material 3 Expressive)

## 1. Aesthetic Direction: Material 3 Expressive (M3 Expressive)

Copage follows **Google's Material 3 Expressive** design guidelines for high-productivity developer utilities:
- **Tonal Elevation & Ambient Glow:** Dark tonal surfaces (`#0f0f12`, `#1c1b21`, `#27252d`, `#323039`) with ambient primary luminescence, subtle backdrop blur (`backdrop-filter: blur(20px)`), and layered depth.
- **Expressive Pill & Squircle Shapes:**
  - **Containers:** Rounded `28px` floating island dock with organic curves.
  - **Buttons & Segmented Groups:** Fully rounded `9999px` pill contours (`shape-full`).
  - **Cards & Popovers:** Squircles with `16px` to `20px` corner radii.
  - **Inputs:** Ergonomic `12px` rounded corners.
- **Spring-Physics Motion System:**
  - Fast-settle spring curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for drop-down menus, switches, and tab indicators.
  - Micro-scale feedback: subtle press scale (`transform: scale(0.97)`) on active state, with a tactile spring return.
- **M3 Expressive Dynamic Color Roles:**
  - Primary Electric Cyan (`#a8c7fa`) with deep contrast `#062e6f`.
  - Secondary Cerulean (`#7cacf8`) and Tertiary Lilac (`#d0bcff`).
  - Mint Success (`#78dc77`), Warm Amber (`#ffdf99`), and Coral Alert (`#ffb4ab`).
- **Expressive Components:**
  - **M3 Expressive Floating Dock:** Capsule island with floating breadcrumbs, pill segmented buttons, and a spring-loaded split action button.
  - **M3 Expressive Switches:** Large pill track (`48px × 28px`) with bouncy spring-expanded thumb (`22px` expanding to `26px` on drag/toggle).
  - **M3 Expressive Tabs:** Capsule pill tabs with sliding primary container highlights.
  - **M3 Expressive Dropdowns:** Floating squircle popovers (`16px` radius) with spring scale-in transitions.

## 2. Craft Floor & Absolute Bans

- **Absolute Ban on Emojis:** Never use emojis or unicode pictographs anywhere in the user interface, dialogs, buttons, cards, or toasts. Always use crisp Google Material Symbol inline vector SVGs.
- **No host page layout shifts:** The overlay must be `position: fixed` inside an isolated Shadow DOM container mounted to `document.documentElement` with `pointer-events: none` during hover tracking.
- **No CSS collision:** Scoped within open Shadow DOM. Use custom element tags (`<copage-inspector-root>`) immune to host page CSS resets.
- **No flickering tooltip:** Bounding box and tooltip recalculate smoothly via `requestAnimationFrame`.
- **Keyboard shortcuts:** Immediate visual feedback in the HUD (`Esc` to unlock, `Enter` to lock, arrow keys for tree traversal).
