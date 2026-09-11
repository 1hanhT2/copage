---
name: Copage
description: A restrained, typography-first collaborative interface with high information density and purposeful contrast.
colors:
  canvas: "#ffffff"
  surface: "#f8f9fa"
  surface-raised: "#ffffff"
  border: "#e5e7eb"
  border-subtle: "#f3f4f6"
  ink: "#111827"
  ink-muted: "#6b7280"
  ink-subtle: "#9ca3af"
  brand: "#0f172a"
  brand-accent: "#2563eb"
  brand-accent-hover: "#1d4ed8"
  danger: "#dc2626"
  danger-surface: "#fef2f2"
  success: "#16a34a"
  success-surface: "#f0fdf4"
typography:
  display:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(24px, 2.5vw, 32px)"
    fontWeight: 700
    letterSpacing: "-0.03em"
  title:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
---

# Design System & Craft Floor

## 1. Aesthetic Direction

Copage adheres to a **restrained, modern workspace aesthetic**:
- Generous but intentional whitespace.
- Crisp hairline borders (`1px solid #e5e7eb`) instead of heavy dropshadows.
- Clear visual hierarchy where interactive states are explicit and distinct.

## 2. Craft Floor (Absolute Bans)

- **No AI-slop visual cliches:** Avoid gratuitous floating spheres, saturated multi-stop purple/cyan gradients, or neon drop-shadow glows.
- **No horizontal layout blowouts:** Every container must respect viewport boundaries without unintentional scrollbars at any breakpoint (from 375px mobile to 1440px desktop).
- **No unstyled empty states:** Every list, table, or workspace surface must feature a clean, contextual empty state with a clear call-to-action.
- **No unhandled loading states:** Interactive buttons, mutations, and data fetches must display clear disabled or skeleton states.

## 3. Component Sourcing

- When implementing new UI elements, prefer referencing battle-tested component patterns from [21st.dev](https://21st.dev) (React + Tailwind + shadcn).
- Adapt all imported component styles to the tokens defined in this document and `globals.css`.
- Record component provenance in memory notes.
