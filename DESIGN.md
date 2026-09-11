---
name: Copage
description: High-precision developer inspection overlay and clean HUD controls for capturing and translating web UI into AI prompts.
colors:
  canvas: "#ffffff"
  surface: "#0f172a"
  surface-raised: "#1e293b"
  surface-subtle: "#334155"
  border: "#334155"
  border-subtle: "#1e293b"
  ink: "#f8fafc"
  ink-muted: "#94a3b8"
  ink-subtle: "#64748b"
  inspector-box: "#2563eb"
  inspector-box-hover: "#3b82f6"
  inspector-box-fill: "rgba(37, 99, 235, 0.08)"
  inspector-tag: "#38bdf8"
  inspector-class: "#a78bfa"
  inspector-dimension: "#fbbf24"
  brand: "#0f172a"
  brand-accent: "#2563eb"
  brand-accent-hover: "#1d4ed8"
  danger: "#ef4444"
  danger-surface: "#450a0a"
  success: "#10b981"
  success-surface: "#064e3b"
typography:
  code:
    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
    fontSize: "12px"
    lineHeight: 1.4
  title:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    lineHeight: 1.5
---

# Design System & Craft Floor — Copage

## 1. Aesthetic Direction

Copage is an **elite developer utility**:
- **High-Contrast HUD & Floating Dock:** Dark, semi-translucent backdrop (`#0f172a` at 94% opacity with subtle backdrop blur), crisp hairline borders (`1px solid #334155`), and monospaced typography for metrics.
- **Precision Highlighting:** 1.5px solid bounding box around hovered elements with a soft primary fill (`rgba(37, 99, 235, 0.08)`) that indicates the exact target without obscuring underlying typography or borders.
- **Informative Floating Tooltip:** Positioned dynamically (defaulting above or below the bounding box without clipping the viewport), displaying:
  - Tag Name in cyan (`#38bdf8`)
  - Dimensions in amber (`#fbbf24`)
  - Top classes in purple (`#a78bfa`)
  - Parent/child traversal breadcrumbs

## 2. Craft Floor (Absolute Bans)

- **No host page layout shifts:** The overlay must be `position: absolute` or `fixed` inside an isolated Shadow DOM container with `pointer-events: none` during hover tracking.
- **No CSS collision:** Never inject global CSS classes or tags that can conflict with the host page (e.g. `body { ... }` or general utility classes).
- **No flickering tooltip:** The HUD and bounding box must recalculate smoothly via `requestAnimationFrame` with hysteresis/debouncing on rapid pointer movement.
- **No unhandled clipped state:** When an element is close to the window border, the tooltip must automatically flip inside or clamp within viewport coordinates.

## 3. UI Component Sourcing & Ergonomics

- All extension surfaces (Popup, Options, Floating Dock) should prefer clean, modern Tailwind styling compatible with [21st.dev](https://21st.dev) component conventions.
- Keyboard shortcuts (`Esc` to cancel, `Enter` to confirm, `Up/Down` arrow keys to navigate parent/child DOM hierarchy) must have immediate visual feedback in the HUD.
