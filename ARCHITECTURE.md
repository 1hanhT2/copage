# Architecture

## 1. System Overview

Copage follows a modular, client-first collaborative architecture designed for predictable state management and high developer ergonomics.

## 2. Directory Structure Conventions

```
copage/
├── AGENTS.md             # Authoritative agent rules & workflow
├── CLAUDE.md             # Pointer to AGENTS.md
├── PRODUCT.md            # Product intent & constraints
├── DESIGN.md             # Design tokens & craft floor
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
└── src/                  # Application source code
    ├── app/              # Routes and page shells
    ├── components/       # Reusable UI components
    └── lib/              # Utilities, hooks, and adapters
```

## 3. Core Technical Principles

1. **Strict Typing:** All data models and component props must be explicitly typed (no implicit `any`).
2. **Deterministic State:** State mutations must be pure and reproducible.
3. **Boundary Isolation:** Keep server-side secrets, database credentials, and external tokens completely isolated from browser bundles.
4. **Verification-Driven Delivery:** Every pull request or release must pass type checking, linting, and build verification.
