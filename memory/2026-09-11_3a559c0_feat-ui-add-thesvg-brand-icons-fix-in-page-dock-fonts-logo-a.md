---
hash: "3a559c0bcf7f93d4f8059b94b41ebe131a4c286a"
short: "3a559c0"
date: "2026-09-11"
author: "1hanhT2 <thanh--12@outlook.com>"
version: "null"
tags: ["fix", "feature", "ui"]
commit: "feat(ui): add thesvg brand icons, fix in-page dock fonts, logo, and horizontal scrollbars"
---

# feat(ui): add thesvg brand icons, fix in-page dock fonts, logo, and horizontal scrollbars

## Context
Deterministic memory from git commit `3a559c0` on 2026-09-11 by 1hanhT2 <thanh--12@outlook.com>.


## Decision
- Subject: `feat(ui): add thesvg brand icons, fix in-page dock fonts, logo, and horizontal scrollbars`
- Version: — (not a release commit)
- Tags: fix, feature, ui

## Details
- Commit: `3a559c0bcf7f93d4f8059b94b41ebe131a4c286a`
- Stat:

```
package-lock.json         |  24 ++++++++++
 package.json              |   3 ++
 src/content/index.ts      |  15 +++++-
 src/content/overlay.ts    | 113 +++++++++++++++++++++++++++++++++++++++++-----
 src/lib/brand-icons.ts    |  65 ++++++++++++++++++++++++++
 src/lib/copage-logo.ts    |  24 ++++++++++
 src/ui/hud/dock.ts        |  19 ++++----
 src/ui/options/options.ts |  36 ++++++++++-----
 src/ui/popup/popup.ts     |  20 ++++----
 9 files changed, 276 insertions(+), 43 deletions(-)
```

- Numstat:

```
24	0	package-lock.json
3	0	package.json
14	1	src/content/index.ts
101	12	src/content/overlay.ts
65	0	src/lib/brand-icons.ts
24	0	src/lib/copage-logo.ts
9	10	src/ui/hud/dock.ts
24	12	src/ui/options/options.ts
12	8	src/ui/popup/popup.ts
```

## Consequences
- Diff: `git show 3a559c0`
- Follow-ups tracked in `CHANGELOG/—` when applicable.

## Verification
- [ ] `git show 3a559c0 --stat` matches above
- [ ] `memory/index.json` regenerated

## Links
- Commit: `git show 3a559c0bcf7f93d4f8059b94b41ebe131a4c286a`

- Memory file: `memory\2026-09-11_3a559c0_feat-ui-add-thesvg-brand-icons-fix-in-page-dock-fonts-logo-a.md`
