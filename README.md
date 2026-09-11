# Copage

> A focused collaborative workspace application designed for speed, clarity, and frictionless authoring.

---

## Architecture & Conventions

- **Agent Guidelines:** [`AGENTS.md`](./AGENTS.md) — Authoritative instructions, memory logging, SemVer, and verification rules.
- **Product Overview:** [`PRODUCT.md`](./PRODUCT.md) — Personas, positioning, constraints, and principles.
- **Design System:** [`DESIGN.md`](./DESIGN.md) — Design tokens, aesthetic goals, and craft floor.
- **System Architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Directory layout, data contracts, and boundaries.
- **Changelog & Releases:** [`CHANGELOG/`](./CHANGELOG/README.md) — Per-variant release notes.
- **Project Memory:** [`memory/`](./memory/README.md) — Git-backed deterministic project memory fragments.

---

## Development & Automation Scripts

```bash
# Version bump and release scaffold:
node scripts/bump-version.mjs patch --title "Fix description"
node scripts/bump-version.mjs minor --title "New feature"

# Deterministic memory generator:
node scripts/memory.mjs --hook      # generate memory for latest commit
node scripts/memory.mjs --sync      # backfill missing commit memories
node scripts/memory.mjs --index     # regenerate memory/index.json
```
