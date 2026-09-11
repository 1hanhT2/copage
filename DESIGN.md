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
- **Tonal Elevation & Ambient Aurora Mesh Glow:** Dark tonal surfaces (`#0f0f12`, `#1c1b21`, `#27252d`, `#323039`) with ambient multi-stop radial gradient aura (`rgba(168, 199, 250, 0.14)` Electric Cyan, `rgba(208, 188, 255, 0.12)` Lilac, `rgba(120, 220, 119, 0.08)` Mint), deep backdrop glassmorphism (`backdrop-filter: blur(28px) saturate(190%)`), and glowing illuminated borders.
- **Expressive Shape Taxonomy (35 Expressive Shapes):**
  - **4-Point Starburst (Sparkle):** Core brand and AI synthesis badge (`M12 2L14.5 9.5L22 12...`).
  - **6-Petal Scalloped Flower Badge:** Reasoning and open-source models (DeepSeek).
  - **Astroid Diamond:** Precision code generation models (Qwen Coder).
  - **8-Point Sunburst:** Open weights power architectures (Meta Llama).
  - **Reticle Precision Calipers:** 4-corner bracket markers on the bounding box highlight for pixel-perfect targeting.
  - **Floating Island Dock:** Organic `28px` corner radius squircle capsule.
  - **Capsule Buttons & Segmented Groups:** Pill contours (`border-radius: 9999px`).
  - **Cards & Popovers:** Squircles with `18px` to `20px` corner radii.
- **Spring-Physics Motion & Jelly Wobble:**
  - **Jelly Wobble Micro-Interaction:** Tactile overshoot compression on `:active` clicks (`@keyframes copageJelly` and `@keyframes m3Jelly` cycling `scale(1) -> scale(1.08, 0.92) -> scale(0.95, 1.05) -> scale(1)`).
  - **Bouncy Spring Entrances:** Fast-settle spring curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for drop-down popovers, breadcrumb chips, and floating dock entrance.
  - **Lock Shockwave:** Concentric expanding ring animation (`@keyframes copageLockShockwave`) that radiates outward when locking onto an element.
  - **Radar Sensor Ring:** Concentric ping waves (`@keyframes m3RadarRing`) on the connection test action.
- **M3 Expressive Dynamic Color Roles:**
  - Primary Electric Cyan (`#a8c7fa`) with deep contrast `#062e6f`.
  - Secondary Cerulean (`#7cacf8`) and Tertiary Lilac (`#d0bcff`).
  - Mint Success (`#78dc77`), Warm Amber (`#ffdf99`), and Coral Alert (`#ffb4ab`).
- **Expressive Components:**
  - **M3 Expressive Floating Dock:** Capsule island with floating breadcrumbs, pill segmented buttons, and a spring-loaded split action button.
  - **M3 Expressive Switches:** Large pill track (`44px × 26px`) with bouncy spring-expanded thumb (`18px` expanding on toggle).
  - **M3 Expressive Tabs:** Capsule pill tabs with sliding primary container highlights.
  - **M3 Expressive Dropdowns:** Floating squircle popovers (`20px` radius) with spring scale-in transitions.

## 2. Craft Floor & Absolute Bans

- **Absolute Ban on Emojis:** Never use emojis or unicode pictographs anywhere in the user interface, dialogs, buttons, cards, or toasts. Always use crisp Google Material Symbol inline vector SVGs or M3 Expressive shape badges.
- **No host page layout shifts:** The overlay must be `position: fixed` inside an isolated Shadow DOM container mounted to `document.documentElement` with `pointer-events: none` during hover tracking.
- **No CSS collision:** Scoped within open Shadow DOM. Use custom element tags (`<copage-inspector-root>`) immune to host page CSS resets.
- **No flickering tooltip:** Bounding box and tooltip recalculate smoothly via `requestAnimationFrame`.
- **Keyboard shortcuts:** Immediate visual feedback in the HUD (`Esc` to unlock, `Enter` to lock, arrow keys for tree traversal).
