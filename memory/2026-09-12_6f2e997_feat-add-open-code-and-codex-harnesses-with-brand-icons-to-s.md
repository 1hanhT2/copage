---
hash: "6f2e997205fac0e303f6316b03318dc5301b07d6"
short: "6f2e997"
date: "2026-09-12"
author: "1hanhT2 <thanh--12@outlook.com>"
version: "null"
tags: ["feature"]
commit: "feat: add Open Code and Codex harnesses with brand icons to selector island"
---

# feat: add Open Code and Codex harnesses with brand icons to selector island

## Context
Deterministic memory from git commit `6f2e997` on 2026-09-12 by 1hanhT2 <thanh--12@outlook.com>.


## Decision
- Subject: `feat: add Open Code and Codex harnesses with brand icons to selector island`
- Version: — (not a release commit)
- Tags: feature

## Details
- Commit: `6f2e997205fac0e303f6316b03318dc5301b07d6`
- Stat:

```
src/content/overlay.ts    | 17 ++++++++++++++++-
 src/lib/brand-icons.ts    | 18 ++++++++++++++----
 src/lib/shapes.ts         |  8 ++++++++
 src/lib/types.ts          |  2 ++
 src/llm/prompts.ts        | 34 ++++++++++++++++++++++++++++++++++
 src/ui/hud/dock.ts        | 14 +++++++++++---
 tests/brand-icons.test.ts | 10 +++++++++-
 tests/prompts.test.ts     | 14 ++++++++++++++
 tests/shapes.test.ts      |  6 ++++++
 9 files changed, 114 insertions(+), 9 deletions(-)
```

- Numstat:

```
16	1	src/content/overlay.ts
14	4	src/lib/brand-icons.ts
8	0	src/lib/shapes.ts
2	0	src/lib/types.ts
34	0	src/llm/prompts.ts
11	3	src/ui/hud/dock.ts
9	1	tests/brand-icons.test.ts
14	0	tests/prompts.test.ts
6	0	tests/shapes.test.ts
```

## Consequences
- Diff: `git show 6f2e997`
- Follow-ups tracked in `CHANGELOG/—` when applicable.

## Verification
- [ ] `git show 6f2e997 --stat` matches above
- [ ] `memory/index.json` regenerated

## Links
- Commit: `git show 6f2e997205fac0e303f6316b03318dc5301b07d6`

- Memory file: `memory\2026-09-12_6f2e997_feat-add-open-code-and-codex-harnesses-with-brand-icons-to-s.md`
