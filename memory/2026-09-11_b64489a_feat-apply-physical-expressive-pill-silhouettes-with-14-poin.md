---
hash: "b64489a3421e31d95d55d6358e36cbadef25eb23"
short: "b64489a"
date: "2026-09-11"
author: "1hanhT2 <thanh--12@outlook.com>"
version: "null"
tags: ["feature"]
commit: "feat: apply physical expressive pill silhouettes with 14-point polygon morphing across selection elements"
---

# feat: apply physical expressive pill silhouettes with 14-point polygon morphing across selection elements

## Context
Deterministic memory from git commit `b64489a` on 2026-09-11 by 1hanhT2 <thanh--12@outlook.com>.


## Decision
- Subject: `feat: apply physical expressive pill silhouettes with 14-point polygon morphing across selection elements`
- Version: — (not a release commit)
- Tags: feature

### Summary & Architecture
- Replaced standard rounded-corner pills (`border-radius: 9999px`) on interactive selection elements (model selector dropdown triggers, prompt target toggle buttons, split action buttons) with **expressive shape-extended pills**.
- Implemented **14-point normalized CSS polygon clip-paths** (`M3_EXPRESSIVE_PILL_POLYGONS`) across 5 canonical silhouettes:
  1. `rugged`: 3 sharp sawtooth teeth on each end (Gemini/Meta/Tailwind HTML).
  2. `scalloped`: 3 undulating wavy lobes on each end (DeepSeek/Claude).
  3. `diamond`: Pointed chevron caps (Qwen/Cursor).
  4. `arch`: Inward architectural notches (v0/21st.dev).
  5. `round`: Normalized 14-point smooth pill for fluid fallback.
- Because all 5 silhouettes share an exact 14-vertex topology, CSS `transition: clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)` performs smooth shape-morphing when switching active models or prompt targets.
- Applied layered `filter: drop-shadow(0 0 1px var(--m3-primary)) drop-shadow(0 4px 14px rgba(0,0,0,0.45))` contour glow wrappers to trace the jagged/scalloped physical ends with razor-sharp contour outlines.
- Maintained safe text/icon padding (`padding: 7px 18px` to `11px 24px`) ensuring zero overlap or clipping.
- Verified: all 17 tests pass, `tsc --noEmit` 0 errors, production build succeeds.

## Details
- Commit: `b64489a3421e31d95d55d6358e36cbadef25eb23`
- Stat:

```
src/content/overlay.ts    | 92 ++++++++++++++++++++++++++++++-----------------
 src/lib/shapes.ts         | 75 ++++++++++++++++++++++++++++++++++++++
 src/ui/hud/dock.ts        |  9 ++++-
 src/ui/options/index.html | 45 +++++++++++++----------
 src/ui/options/options.ts |  3 ++
 src/ui/popup/index.html   | 74 ++++++++++++++++++++++++--------------
 src/ui/popup/popup.ts     | 10 +++++-
 tests/shapes.test.ts      | 43 ++++++++++++++++++++++
 8 files changed, 271 insertions(+), 80 deletions(-)
```

- Numstat:

```
59	33	src/content/overlay.ts
75	0	src/lib/shapes.ts
8	1	src/ui/hud/dock.ts
27	18	src/ui/options/index.html
3	0	src/ui/options/options.ts
47	27	src/ui/popup/index.html
9	1	src/ui/popup/popup.ts
43	0	tests/shapes.test.ts
```

## Consequences
- Diff: `git show b64489a`
- Follow-ups tracked in `CHANGELOG/—` when applicable.

## Verification
- [ ] `git show b64489a --stat` matches above
- [ ] `memory/index.json` regenerated

## Links
- Commit: `git show b64489a3421e31d95d55d6358e36cbadef25eb23`

- Memory file: `memory\2026-09-11_b64489a_feat-apply-physical-expressive-pill-silhouettes-with-14-poin.md`
