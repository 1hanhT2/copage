---
hash: "19788c39feea07c358fdfbbb3ece610cb1d52d8a"
short: "19788c3"
date: "2026-09-11"
author: "1hanhT2 <thanh--12@outlook.com>"
version: "null"
tags: ["feature", "ui"]
commit: "feat(ui): use actual brand icons for React, Tailwind, Vue, Svelte, HTML, and prompt targets"
---

# feat(ui): use actual brand icons for React, Tailwind, Vue, Svelte, HTML, and prompt targets

## Context
Deterministic memory from git commit `19788c3` on 2026-09-11 by 1hanhT2 <thanh--12@outlook.com>.


## Decision
- Subject: `feat(ui): use actual brand icons for React, Tailwind, Vue, Svelte, HTML, and prompt targets`
- Version: — (not a release commit)
- Tags: feature, ui

## Details
- Commit: `19788c39feea07c358fdfbbb3ece610cb1d52d8a`
- Stat:

```
src/lib/brand-icons.ts    | 80 ++++++++++++++++++++++++++++++++++++++----
 src/ui/hud/dock.ts        | 19 +++++-----
 src/ui/options/options.ts | 32 ++++++++++++++---
 tests/brand-icons.test.ts | 89 +++++++++++++++++++++++++++++++++++++++++++++++
 4 files changed, 202 insertions(+), 18 deletions(-)
```

- Numstat:

```
74	6	src/lib/brand-icons.ts
11	8	src/ui/hud/dock.ts
28	4	src/ui/options/options.ts
89	0	tests/brand-icons.test.ts
```

## Consequences
- Diff: `git show 19788c3`
- Follow-ups tracked in `CHANGELOG/—` when applicable.

## Verification
- [ ] `git show 19788c3 --stat` matches above
- [ ] `memory/index.json` regenerated

## Links
- Commit: `git show 19788c39feea07c358fdfbbb3ece610cb1d52d8a`

- Memory file: `memory\2026-09-11_19788c3_feat-ui-use-actual-brand-icons-for-react-tailwind-vue-svelte.md`
