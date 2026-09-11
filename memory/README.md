# Memory — Deterministic, Git-Backed Project Memory

This folder is the **project's long-term memory**. Every git commit deterministically yields a memory entry, so agents and collaborators can reconstruct *why* decisions were made, not just *what* changed.

> **Rule:** If it's not in `memory/`, it didn't happen. Agents MUST ensure a memory entry is recorded after every significant change or commit — see `AGENTS.md §1`.

---

## How It Works (Deterministic)

1. **Trigger:** `git commit` triggers `.git/hooks/post-commit` → `node scripts/memory.mjs --hook` → creates `memory/YYYY-MM-DD_<shortHash>_<slug>.md` if missing.
2. **Sync / Backfill:** `node scripts/memory.mjs --sync` backfills missing commits (idempotent). Run after rebase or version bump.
3. **Source of Truth:** Git history. Filename encodes date + short hash + slug; frontmatter stores full hash, author, tags, and stats.
4. **Manual Annotation:** `node scripts/memory.mjs --from HEAD -m "extra context"` appends specific agent notes to the generated stub.

---

## Structure

```
memory/
  README.md          ← this file
  _template.md       ← manual entry template
  index.json         ← auto-generated manifest (do not edit)
  YYYY-MM-DD_<hash>_<slug>.md
```

---

## When to Write / Expand

- Every release (`Release vX.Y.Z — Title`) — must link corresponding `CHANGELOG/` file.
- Every significant change per `AGENTS.md §1.1` — new feature, schema change, dependency/config change, or refactor.
- Every major UI design decision — note rules checked, 21st.dev component source, and rejected alternatives.

---

## Index

`memory/index.json` is regenerated on every run — do not edit by hand. AI agents load this index for historical context rather than reading huge commit histories.

---

## Retention

Never delete a memory file. Fix factual errors by appending `> **Correction (YYYY-MM-DD):** ...`.
