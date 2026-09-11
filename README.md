<p align="center">
  <img src="./copage-github-banner.png" alt="Copage Banner" width="100%" />
</p>

# Copage


> **Inspect, hover, and copy any web element into an AI-ready reproduction prompt or component code.**

Copage is a developer-first browser extension (Manifest V3) designed to bridge the gap between web inspection and modern AI-assisted engineering. Think of it like your browser's F12 DevTools element inspector, but built for the generative AI era with unmatched flexibility.

---

## What is Copage?

When browsing the web, developers frequently encounter UI patterns, interactive widgets, polished navigation headers, and hero layouts they want to study or recreate. Today, this requires manually digging through minified DOM trees, copying obfuscated CSS classes, or grabbing a rough screenshot that loses dimensions, typography, and SVG markup.

**Copage solves this seamlessly:**
1. **Interactive Hover & Inspect:** Activate Copage to hover over any element on any webpage. A non-intrusive bounding box shows tag names, dimensions, CSS classes, and a parent/child breadcrumb trail to pinpoint the exact container.
2. **Comprehensive Element Extraction:** With one click, Copage grabs clean sanitized HTML, computed CSS styles, font metrics, spacing tokens, and inline SVGs/assets.
3. **LLM-Powered Reproduction:** Plug in your own API key (OpenRouter, OpenAI-compatible, Anthropic, etc.). An LLM automatically converts the extracted element into an optimized prompt to reproduce it in Claude, ChatGPT, Cursor, or v0—or directly generates production-ready React + Tailwind CSS code.

---

## Core Capabilities

- **Visual Element Inspector:** Precision bounding box highlight, layout metrics HUD, and DOM hierarchy breadcrumb navigation.
- **Bring Your Own Key (BYOK):** Direct connection to OpenRouter, OpenAI-compatible APIs, Anthropic, or local LLM instances (Ollama / OpenCode). Keys stay safely in your browser's local storage (`chrome.storage.local`).
- **Smart Prompt Synthesizer:** Crafts structured, high-context AI prompts tailored to your favorite coding assistant (Claude, Cursor, v0, ChatGPT).
- **1-Click Component Generation:** Direct translation of captured elements into clean, modern component frameworks (React + Tailwind CSS, Vue, Svelte, or plain HTML/CSS).
- **Zero-Leakage Privacy:** No telemetry, no third-party proxies. Requests travel directly from your browser to your configured LLM endpoint.

---

## Architecture & Project Standards

This repository follows strict development standards, deterministic memory logging, and automated versioning:

- **Agent Guidelines:** [`AGENTS.md`](./AGENTS.md) — Authoritative AI assistant protocol, memory workflows, and quality checklist.
- **Product Specification:** [`PRODUCT.md`](./PRODUCT.md) — Personas, positioning, constraints, and product principles.
- **Design System:** [`DESIGN.md`](./DESIGN.md) — Token architecture, HUD styling, and craft floor rules.
- **System Boundaries:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Extension architecture (Manifest V3, content scripts, background worker, LLM gateway).
- **Changelog:** [`CHANGELOG/`](./CHANGELOG/README.md) — Per-release variant documentation.
- **Project Memory:** [`memory/`](./memory/README.md) — Git-backed deterministic memory tracking decisions across sessions.

---

## Scripts & Automation

```bash
# Release & SemVer versioning:
npm run version:patch -- --title "Fix inspector overlay bounds"
npm run version:minor -- --title "Add OpenRouter streaming support"

# Deterministic memory system:
npm run memory:sync   # Backfill missing git commit memories
npm run memory:index  # Refresh memory/index.json
```
