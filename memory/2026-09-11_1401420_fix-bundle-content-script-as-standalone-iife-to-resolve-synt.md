---
hash: "14014204ac8bf64fc2b233d245f78c5f4facd635"
short: "1401420"
date: "2026-09-11"
author: "1hanhT2 <thanh--12@outlook.com>"
version: "null"
tags: ["fix"]
commit: "fix: bundle content script as standalone IIFE to resolve syntax error on all pages"
---

# fix: bundle content script as standalone IIFE to resolve syntax error on all pages

## Context
Deterministic memory from git commit `1401420` on 2026-09-11 by 1hanhT2 <thanh--12@outlook.com>.


## Decision
- Subject: `fix: bundle content script as standalone IIFE to resolve syntax error on all pages`
- Version: — (not a release commit)
- Tags: fix

## Details
- Commit: `14014204ac8bf64fc2b233d245f78c5f4facd635`
- Stat:

```
...09-11_51fa857_chore-memory-sync-memory-index.md | 50 ++++++++++++
 memory/index.json                                  | 16 +++-
 package.json                                       |  2 +-
 scripts/build.mjs                                  | 94 ++++++++++++++++++++++
 src/content/index.ts                               |  2 +
 5 files changed, 161 insertions(+), 3 deletions(-)
```

- Numstat:

```
50	0	memory/2026-09-11_51fa857_chore-memory-sync-memory-index.md
14	2	memory/index.json
1	1	package.json
94	0	scripts/build.mjs
2	0	src/content/index.ts
```

## Consequences
- Diff: `git show 1401420`
- Follow-ups tracked in `CHANGELOG/—` when applicable.

## Verification
- [ ] `git show 1401420 --stat` matches above
- [ ] `memory/index.json` regenerated

## Links
- Commit: `git show 14014204ac8bf64fc2b233d245f78c5f4facd635`

- Memory file: `memory\2026-09-11_1401420_fix-bundle-content-script-as-standalone-iife-to-resolve-synt.md`
