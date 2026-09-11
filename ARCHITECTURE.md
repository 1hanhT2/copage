# Architecture — Copage Browser Extension

## 1. System Overview

Copage is built as a modern **Chrome / Chromium Manifest V3 WebExtension** using TypeScript and modular subsystem architecture. It bridges in-browser DOM inspection with LLM-powered prompt and code synthesis.

```
┌─────────────────────────────────────────────────────────────┐
│                       Host Web Page                         │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │ Target DOM Element      │   │ Copage Content Script   │  │
│  │ (Hovered / Selected)    │──>│ • Shadow DOM Overlay    │  │
│  └─────────────────────────┘   │ • Bounding Box HUD      │  │
│                                │ • Event Interceptor     │  │
│                                └────────────┬────────────┘  │
└─────────────────────────────────────────────┼───────────────┘
                                              │ Extracted Node & Styles
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Copage Extension Core                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ DOM & Style Extractor                               │   │
│   │ • Prunes script / noise tags                        │   │
│   │ • Distills computed layout, typography & colors     │   │
│   │ • Inlines SVGs and image asset references           │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │ Clean Element Spec            │
│                             ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ LLM Gateway (BYOK Client-Side)                      │   │
│   │ • OpenRouter & OpenAI-compatible endpoints          │   │
│   │ • Prompt synthesizer (Claude / Cursor / v0 / Code)  │   │
│   │ • Secure local key storage (chrome.storage.local)   │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │ Destination: Clipboard / AI Chat / Editor │
        │ • Optimized Reproduction Prompt           │
        │ • Production React + Tailwind Component   │
        └───────────────────────────────────────────┘
```

---

## 2. Directory Layout Conventions

```
copage/
├── manifest.json         # Extension Manifest V3 configuration
├── AGENTS.md             # Authoritative agent rules & workflow
├── CLAUDE.md             # Pointer to AGENTS.md
├── PRODUCT.md            # Product spec & constraints
├── DESIGN.md             # Design tokens & HUD craft floor
├── ARCHITECTURE.md       # Technical boundaries & contracts
├── VERSION               # Plain-text version mirror
├── CHANGELOG/            # Per-release changelog variants
│   └── README.md
├── memory/               # Git-backed deterministic memories
│   ├── README.md
│   ├── _template.md
│   └── index.json
├── scripts/              # Release and memory automation
│   ├── bump-version.mjs
│   ├── memory.mjs
│   └── hooks/
│       └── post-commit.sh
└── src/
    ├── background/       # Service worker (shortcuts, messaging)
    ├── content/          # In-page inspector & Shadow DOM HUD
    │   ├── inspector.ts  # Hover, bounding box, hit detection
    │   ├── overlay.ts    # Shadow DOM container renderer
    │   └── events.ts     # Keyboard shortcuts & lock events
    ├── extractor/        # DOM & CSS extraction engine
    │   ├── dom.ts        # DOM sanitizer, tree pruner, SVG inliner
    │   └── styles.ts     # Computed CSS & typography extractor
    ├── llm/              # LLM client & prompt synthesizer
    │   ├── providers/    # OpenRouter, OpenAI-compatible adapters
    │   └── prompts/      # Target-specific prompt templates
    ├── ui/               # Extension popup, options, & HUD components
    │   ├── popup/        # Action popup
    │   ├── options/      # API key & model settings
    │   └── hud/          # Floating inspection dock
    └── lib/              # Shared types, storage helpers, utils
```

---

## 3. Core Technical Principles

1. **Zero Host Contamination (Shadow DOM):** All injected overlays, bounding boxes, and HUD controls must reside within an isolated `ShadowRoot` (`mode: 'closed'` or `'open'` with strict styling resets) to prevent host page CSS from leaking in and extension CSS from leaking out.
2. **Local Security (BYOK):** API keys must be stored in `chrome.storage.local`. Under no circumstances should keys be logged, sent to telemetry, or transmitted to any server other than the user-configured LLM endpoint.
3. **High Framerate Hover (<16ms):** Bounding box positioning must use `requestAnimationFrame` and `getBoundingClientRect()`. Avoid heavy tree traversals during hover; defer deep extraction until element lock (click).
4. **Resilient DOM Sanitization:** Strip scripts, tracking pixels, ads, and hidden elements to keep token count compact and signal-to-noise ratio high for LLMs.
