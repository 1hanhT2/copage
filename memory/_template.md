---
hash: "<full 40-char commit hash>"
short: "<7-char hash>"
date: "YYYY-MM-DD"
author: "Author Name <email>"
version: "vX.Y.Z | null"
tags: ["template", "feature"]
commit: "Commit subject line"
---

# Title — One Line Summary

## Context
Why this work happened. Link the prompt, issue, user request, or design brief.

## Decision
What was chosen and what was rejected:
- Architecture or library decisions
- Component / UI patterns adapted (e.g. 21st.dev URL + author)
- Quality rules checked

## Details
- Affected files: `path/to/file.ts`
- Schema / contract modifications
- Design tokens or CSS changes

## Consequences
What this enables, what it restricts, and any technical debt or follow-up items.

## Verification
- [ ] Linter clean
- [ ] Type check clean (`npx tsc --noEmit`)
- [ ] Build clean (`npm run build`)
- [ ] Tests passed

## Links
- CHANGELOG: `CHANGELOG/vX.Y.Z-*.md`
- Git commit: `git show <hash>`
