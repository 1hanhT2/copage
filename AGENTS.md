# AGENTS.md — Copage

> **For AI Agents working in this repo:** Read this file FIRST. It defines mandatory workflows for project memory, versioning, quality gates, and development logs. If a task described here is already done (e.g., git exists, VERSION exists), count the requirement as satisfied and proceed.

---

## 0. Project Overview & Conventions

- **Mission:** **Copage** is a developer-first browser extension (Manifest V3) that allows engineers to hover, inspect, and copy any element on the web—similar to the F12 DevTools element inspector, but with complete flexibility and LLM superpower.
- **Core Concept:**
  - **In-Page Hover & Select:** Intuitive overlay highlighting elements with bounding boxes, dimensions, HTML tags, classes, and parent/child breadcrumb traversal.
  - **DOM & Style Extraction:** Captures sanitized HTML, computed CSS styles, font metrics, layout box data, and inline SVGs/assets.
  - **LLM Prompt Synthesis:** Users plug in their own LLM API key (OpenRouter, OpenAI-compatible, Anthropic, etc.). An LLM processes the captured element and distills it into a hyper-targeted reproduction prompt (for Claude, ChatGPT, Cursor, v0, 21st.dev) or directly generates ready-to-use component code (React + Tailwind CSS, Vue, Svelte, or plain HTML).
  - **Extensible Roadmap:** Screenshot-to-code multimodal prompts, local snippet library, prompt template customization, and 1-click export to clipboard or editor.
- **Key Subsystems:**
  1. `content/`: High-performance in-page inspector overlay, event interceptors, bounding-box renderer.
  2. `extractor/`: Tree pruning, computed style distillation, asset and SVG collector.
  3. `llm/`: Client-side multi-provider gateway (OpenRouter, OpenAI-compatible), prompt templates, streaming responses.
  4. `ui/`: Extension popup, side panel / floating action HUD, settings/options surface for API keys and preferences.
  5. `background/`: Extension service worker for shortcuts, cross-tab messaging, and storage coordination.
- **Security & Privacy (Non-Negotiable):**
  - User API keys are stored strictly in local browser storage (`chrome.storage.local`).
  - Never transmit user API keys to any third-party intermediary backend; all requests go directly from the client/extension to the configured provider endpoint.
  - Never commit `.env`, test keys, or log secrets to git or `memory/`.
- **Current Version:** Defined in `VERSION` and `package.json` (`version` field). Starts at `0.1.0`.
- **Source of Truth for Version:** `package.json` `version` + `VERSION` file (must stay in sync) + annotated git tag `vX.Y.Z`.
- **Changelog:** `CHANGELOG/` — one markdown file per variant/release indexed in `CHANGELOG/README.md`.
- **Architecture Context:**
  - [`PRODUCT.md`](./PRODUCT.md) — Product purpose, user personas, operating context, brand commitments.
  - [`DESIGN.md`](./DESIGN.md) — Design system, aesthetic principles, typography, tokens, craft floor.
  - [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System boundaries, data flow, API contracts.
- **Git Repo:** Default branch `main`, remote `origin` = `https://github.com/1hanhT2/copage.git`. Annotated tags only (`git tag -a vX.Y.Z -m "..."`).

---

## 1. MANDATORY: Auto-Create Development Logs & Memory

**Every AI agent MUST automatically record project memory after any *significant* change. Do not wait for the user to ask.**

### 1.1 When to Log (Significant = Any of These)
- New feature, route, component, or API (> ~30 LOC or new user-visible behavior)
- Bug fix that changes behavior or touches > 2 files
- Data model / schema change or migration
- Dependency addition / upgrade, tooling or configuration change
- Refactor that moves files or changes > 50 LOC
- Any change requiring verification / QA / E2E testing

**Skip logging for:** Typo-only fixes, single-line copy tweaks, formatting-only, or pure docs tweaks (batch these into the next significant log if they accumulate).

### 1.2 Memory System: Deterministic & Git-Backed
This project uses the proven deterministic memory architecture:
- **Location:** `memory/` at repo root (committed to git).
- **Files:** `memory/YYYY-MM-DD_<shortHash>_<slug>.md` — one per commit.
- **Manifest:** `memory/index.json` aggregates all memories (`generatedAt`, `count`, `entries[]`). Agents read this index for context, not raw `git log`.
- **Automation:**
  ```bash
  node scripts/memory.mjs --hook                # post-commit: process latest commit
  node scripts/memory.mjs --sync                # backfill missing commits (idempotent)
  node scripts/memory.mjs --from HEAD -m "note" # annotate on top of deterministic stub
  node scripts/memory.mjs --index               # regenerate index.json only
  ```
- **Git Hook:** `.git/hooks/post-commit` invokes `node scripts/memory.mjs --hook`. (Template at `scripts/hooks/post-commit.sh`).
- **Retention:** Never delete a memory. If an error occurred in history, append `> **Correction (YYYY-MM-DD):** ...`.

---

## 2. Version Numbering System — SemVer

```
vMAJOR.MINOR.PATCH    e.g., v0.1.0, v0.2.0, v1.0.0
```

| Bump | When | Example |
|---|---|---|
| **PATCH** `0.1.0 → 0.1.1` | Bug fix, UI polish, minor defect resolution | Fix modal backdrop alignment |
| **MINOR** `0.1.0 → 0.2.0` | New feature, new route/screen, backward-compatible schema addition | Add workspace sharing |
| **MAJOR** `0.2.0 → 1.0.0` | Breaking change, core architecture rewrite, public stable milestone | Public launch / 1.0 |

- **Bumping Script:**
  ```bash
  node scripts/bump-version.mjs patch --title "Fix modal backdrop"
  node scripts/bump-version.mjs minor --title "Add workspace sharing"
  # Dry-run first if testing:
  node scripts/bump-version.mjs patch --title "Title" --dry-run
  ```
  The script synchronizes `package.json`, `VERSION`, scaffolds `CHANGELOG/vX.Y.Z-<slug>.md`, updates `CHANGELOG/README.md`, creates an annotated tag, and syncs `memory/`.

---

## 3. UI & Design Quality Gate (Impeccable + 21st.dev)

All user interface work must meet rigorous design and craftsmanship standards:

### 3.1 Impeccable Anti-Slop Gate
- Never produce generic, low-effort AI aesthetics (excessive purple gradients, unnatural glow, cluttered card layouts, unformatted empty states).
- Follow the craft floor defined in [`DESIGN.md`](./DESIGN.md).
- Run `npx impeccable detect <path>` when available to identify contrast, layout, overflow, or design token drift.

### 3.2 21st.dev (Crafted Component Source)
- Registry: [https://21st.dev](https://21st.dev) — crafted React + Tailwind components.
- Prefer sourcing and adapting proven 21st.dev UI patterns over hand-rolling generic boilerplate.
- Adapt all imported components to local tokens in `globals.css` (never the reverse).
- Cite component URLs and authors in memory notes.

---

## 4. Git & Code Hygiene

- **Commit Messages:**
  - Release: `Release vX.Y.Z — <Title>`
  - Feature: `feat: <what and why>`
  - Fix: `fix: <what and why>`
  - Chore: `chore: <what and why>`
- **Never Commit:** Secrets, API keys, tokens, `.env`, local databases, credentials, build caches, or `node_modules`.
- **Pre-Commit Check:** Run `git status` and `git diff --stat` to verify only intended files are staged.

---

## 5. Agent Verification Checklist (Copy for Tasks / Releases)

Before claiming a task or feature is complete:

```markdown
- [ ] Code adheres to architecture in `PRODUCT.md` and `DESIGN.md`
- [ ] Formatter / Linter clean (`npm run lint` or equivalent)
- [ ] TypeScript clean (`npx tsc --noEmit` with 0 errors)
- [ ] Production build succeeds (`npm run build`)
- [ ] Relevant tests pass (`npm test` / `npx playwright test`)
- [ ] No layout overflow or broken responsive states on mobile (375px) & desktop (1280px+)
- [ ] No secrets, temp files, or credentials staged
- [ ] Version bumped if release: `package.json` == `VERSION` == git tag `vX.Y.Z`
- [ ] `memory/` updated: `node scripts/memory.mjs --hook` (or sync verified, `memory/index.json` updated)
```

---

## 6. Language & Communication Rule

- **AI Agent Responses:** Default to concise, well-structured English. If the user initiates in another language, respond in that language.
- **UI Content:** Keep UI copy clean, purposeful, and contextual.
