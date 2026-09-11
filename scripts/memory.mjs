#!/usr/bin/env node
/**
 * memory.mjs — Deterministic, git-backed memory generator.
 *
 * Idempotent: each git commit yields exactly one file:
 *   memory/YYYY-MM-DD_<short>_<slug>.md
 *
 * CLI:
 *   node scripts/memory.mjs --hook              # post-commit (latest commit only)
 *   node scripts/memory.mjs --sync              # backfill all commits (missing only)
 *   node scripts/memory.mjs --from <rev>        # generate for specific rev (e.g. HEAD)
 *   node scripts/memory.mjs --from <rev> -m "note"  # append extra note
 *   node scripts/memory.mjs --index             # regenerate index.json only
 */

import { execSync } from "node:child_process";
import { mkdir, writeFile, readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";

const MEMORY_DIR = "memory";
const INDEX_PATH = join(MEMORY_DIR, "index.json");

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (err) {
    return "";
  }
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "commit";
}

function getCommits(range = "") {
  const hashListRaw = sh(range ? `git log --reverse --format="%H" ${range}` : `git log --reverse --format="%H"`);
  if (!hashListRaw) return [];
  const hashes = hashListRaw.split("\n").filter(Boolean);
  const fmt = "%H%x1f%h%x1f%ai%x1f%an%x1f%ae%x1f%s%x1f%b";
  return hashes.map((h) => {
    const line = sh(`git show -s --format="${fmt}" ${h}`);
    const parts = line.split("\x1f");
    const hash = (parts[0] || "").trim();
    const short = (parts[1] || "").trim();
    const dateIso = (parts[2] || "").trim();
    const an = (parts[3] || "").trim();
    const ae = (parts[4] || "").trim();
    const subject = (parts[5] || "").trim();
    const body = parts.slice(6).join("\x1f").trim();
    const date = dateIso ? dateIso.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return { hash, short, date, author: `${an} <${ae}>`, subject, body };
  });
}

function versionFromSubject(subject) {
  const m = subject.match(/v\d+\.\d+\.\d+/);
  return m ? m[0] : null;
}

function tagsForLine(subject) {
  const tags = [];
  const lower = subject.toLowerCase();
  if (lower.includes("release")) tags.push("release");
  if (lower.includes("fix")) tags.push("fix");
  if (lower.includes("feat") || lower.includes("feature")) tags.push("feature");
  if (lower.includes("ui") || lower.includes("design") || lower.includes("impeccable")) tags.push("ui");
  if (lower.includes("memory")) tags.push("memory");
  if (lower.includes("refactor")) tags.push("refactor");
  if (lower.includes("test")) tags.push("test");
  if (lower.includes("docs")) tags.push("docs");
  if (tags.length === 0) tags.push("chore");
  return tags;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function generateFor(commit, extraNote = "") {
  const { hash, short, date, author, subject, body } = commit;
  if (!hash || !short) return { filepath: null, skipped: true };

  const slug = slugify(subject);
  const version = versionFromSubject(subject);
  const filename = `${date}_${short}_${slug}.md`;
  const filepath = join(MEMORY_DIR, filename);

  if (await exists(filepath)) {
    return { filepath, skipped: true };
  }

  let stat = "";
  let numstat = "";
  try {
    stat = sh(`git show --stat --format="" ${hash}`);
  } catch {}
  try {
    numstat = sh(`git show --numstat --format="" ${hash}`);
  } catch {}

  const tags = tagsForLine(subject);
  const bodyBlock = body ? `\n\n> Original body:\n> ${body.replace(/\n/g, "\n> ")}` : "";

  const content = `---
hash: "${hash}"
short: "${short}"
date: "${date}"
author: "${author}"
version: "${version ?? "null"}"
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
commit: "${subject.replace(/"/g, '\\"')}"
---

# ${subject}

## Context
Deterministic memory from git commit \`${short}\` on ${date} by ${author}.${bodyBlock}
${extraNote ? `\n> Agent note: ${extraNote}\n` : ""}

## Decision
- Subject: \`${subject}\`
- Version: ${version ?? "— (not a release commit)"}
- Tags: ${tags.join(", ")}

## Details
- Commit: \`${hash}\`
- Stat:

\`\`\`
${stat}
\`\`\`

- Numstat:

\`\`\`
${numstat}
\`\`\`

## Consequences
- Diff: \`git show ${short}\`
- Follow-ups tracked in \`CHANGELOG/${version ? `v${version.replace(/^v/, "")}-*.md` : "—"}\` when applicable.

## Verification
- [ ] \`git show ${short} --stat\` matches above
- [ ] \`memory/index.json\` regenerated

## Links
- Commit: \`git show ${hash}\`
${version ? `- CHANGELOG: \`CHANGELOG/${version}-*.md\`` : ""}
- Memory file: \`${filepath}\`
`;

  await mkdir(MEMORY_DIR, { recursive: true });
  await writeFile(filepath, content, "utf8");
  return { filepath, skipped: false };
}

async function generateIndex() {
  const files = (await readdir(MEMORY_DIR).catch(() => [])).filter(
    (f) => /^\d{4}-\d{2}-\d{2}_[a-z0-9]{6,8}_.*\.md$/.test(f) && f !== "_template.md" && f !== "README.md"
  );
  files.sort();
  const entries = [];
  for (const file of files) {
    try {
      const raw = await readFile(join(MEMORY_DIR, file), "utf8");
      const front = raw.match(/^---\n([\s\S]*?)\n---/);
      let meta = { file };
      if (front) {
        const lines = front[1].split("\n");
        for (const line of lines) {
          const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
          if (m) meta[m[1]] = m[2];
        }
      }
      const tagsMatch = raw.match(/tags:\s*\[([^\]]*)\]/);
      if (tagsMatch) {
        meta.tags = tagsMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""))
          .filter(Boolean);
      }
      entries.push(meta);
    } catch {}
  }
  const index = { generatedAt: new Date().toISOString(), count: entries.length, entries };
  await writeFile(INDEX_PATH, JSON.stringify(index, null, 2) + "\n", "utf8");
  return index;
}

async function main() {
  const args = process.argv.slice(2);
  const isHook = args.includes("--hook");
  const isSync = args.includes("--sync");
  const isIndex = args.includes("--index");
  const fromIdx = args.indexOf("--from");
  const fromRev = fromIdx !== -1 ? args[fromIdx + 1] : null;
  const noteIdx = args.indexOf("-m");
  const extraNote = noteIdx !== -1 ? args[noteIdx + 1] : "";

  if (isIndex) {
    const idx = await generateIndex();
    console.log(`Regenerated ${INDEX_PATH} — ${idx.count} entries`);
    return;
  }

  if (fromRev) {
    try {
      const fmt = "%H%x1f%h%x1f%ai%x1f%an%x1f%ae%x1f%s%x1f%b";
      const line = sh(`git show -s --format="${fmt}" ${fromRev}`);
      if (!line) throw new Error("Commit not found");
      const parts = line.split("\x1f");
      const hash = (parts[0] || "").trim();
      const short = (parts[1] || "").trim();
      const dateIso = (parts[2] || "").trim();
      const an = (parts[3] || "").trim();
      const ae = (parts[4] || "").trim();
      const subject = (parts[5] || "").trim();
      const body = parts.slice(6).join("\x1f").trim();
      const date = dateIso.slice(0, 10);
      const commit = { hash, short, date, author: `${an} <${ae}>`, subject, body };
      const res = await generateFor(commit, extraNote);
      console.log(res.skipped ? `Skipped (exists): ${res.filepath}` : `Created: ${res.filepath}`);
      await generateIndex();
      return;
    } catch (e) {
      console.error(`No commit found for ${fromRev}: ${e.message}`);
      process.exit(1);
    }
  }

  if (isHook) {
    const fmt = "%H%x1f%h%x1f%ai%x1f%an%x1f%ae%x1f%s%x1f%b";
    const line = sh(`git log -1 --format="${fmt}"`);
    if (!line) {
      console.log("Hook: no commits found in git log.");
      return;
    }
    const parts = line.split("\x1f");
    const hash = (parts[0] || "").trim();
    const short = (parts[1] || "").trim();
    const dateIso = (parts[2] || "").trim();
    const an = (parts[3] || "").trim();
    const ae = (parts[4] || "").trim();
    const subject = (parts[5] || "").trim();
    const body = parts.slice(6).join("\x1f").trim();
    const date = dateIso.slice(0, 10);
    const commit = { hash, short, date, author: `${an} <${ae}>`, subject, body };
    const res = await generateFor(commit, extraNote);
    console.log(res.skipped ? `Hook: skipped (exists): ${res.filepath}` : `Hook: created ${res.filepath}`);
    await generateIndex();
    return;
  }

  if (isSync) {
    const commits = getCommits();
    let created = 0, skipped = 0;
    for (const c of commits) {
      const res = await generateFor(c);
      if (res.skipped) skipped++;
      else {
        created++;
        console.log(`Created: ${res.filepath}`);
      }
    }
    const idx = await generateIndex();
    console.log(`Sync done: ${created} created, ${skipped} skipped, index ${idx.count}`);
    return;
  }

  // default: --sync
  const commits = getCommits();
  let created = 0, skipped = 0;
  for (const c of commits) {
    const res = await generateFor(c);
    if (res.skipped) skipped++;
    else {
      created++;
      console.log(`Created: ${res.filepath}`);
    }
  }
  const idx = await generateIndex();
  console.log(`Done: ${created} created, ${skipped} skipped, index ${idx.count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
