#!/usr/bin/env node
/**
 * bump-version.mjs — SemVer bump automation for copage.
 *
 * Synchronizes:
 *   - package.json (if present)
 *   - VERSION file
 *   - CHANGELOG/vX.Y.Z-<slug>.md (scaffold)
 *   - CHANGELOG/README.md (variants list)
 *   - Annotated git tag vX.Y.Z
 *   - Deterministic memory sync via scripts/memory.mjs
 *
 * Usage:
 *   node scripts/bump-version.mjs patch --title "Brief title"
 *   node scripts/bump-version.mjs minor --title "Brief title"
 *   node scripts/bump-version.mjs major --title "Brief title"
 *   node scripts/bump-version.mjs 0.2.0 --title "Custom version"
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const bumpArg = args[0];

if (!bumpArg || bumpArg.startsWith("--")) {
  console.error(`Usage: node scripts/bump-version.mjs <patch|minor|major|x.y.z> --title "Title" [--dry-run] [--no-tag] [--no-changelog]`);
  process.exit(1);
}

function parseTitle() {
  const idx = args.indexOf("--title");
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  const eq = args.find((a) => a.startsWith("--title="));
  if (eq) return eq.split("=").slice(1).join("=");
  return null;
}

const title = parseTitle();
const dryRun = args.includes("--dry-run");
const noTag = args.includes("--no-tag");
const noChangelog = args.includes("--no-changelog");
const isSemVer = /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(bumpArg);
const isBumpType = ["patch", "minor", "major"].includes(bumpArg);

if (!isSemVer && !isBumpType) {
  console.error(`Invalid bump arg "${bumpArg}". Use patch|minor|major or explicit x.y.z`);
  process.exit(1);
}

function bumpSemver(current, type) {
  const [maj, min, pat] = current.split(".").map(Number);
  if (type === "major") return `${maj + 1}.0.0`;
  if (type === "minor") return `${maj}.${min + 1}.0`;
  if (type === "patch") return `${maj}.${min}.${pat + 1}`;
  return current;
}

async function getCurrentVersion() {
  try {
    const raw = await readFile("VERSION", "utf8");
    return raw.trim();
  } catch {
    try {
      const pkgRaw = await readFile("package.json", "utf8");
      return JSON.parse(pkgRaw).version || "0.1.0";
    } catch {
      return "0.1.0";
    }
  }
}

async function main() {
  const current = await getCurrentVersion();
  const next = isSemVer ? bumpArg : bumpSemver(current, bumpArg);

  console.log(`Current: ${current} -> Next: ${next}${dryRun ? " (dry-run)" : ""}`);
  if (title) console.log(`Title  : ${title}`);

  if (dryRun) {
    console.log("[dry-run] Would update package.json, VERSION, CHANGELOG, git tag");
    return;
  }

  // 1. package.json (if exists)
  try {
    const pkgRaw = await readFile("package.json", "utf8");
    const pkg = JSON.parse(pkgRaw);
    pkg.version = next;
    await writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("Updated package.json");
  } catch {}

  // 2. VERSION file
  await writeFile("VERSION", next + "\n", "utf8");
  console.log("Updated VERSION");

  // 3. CHANGELOG scaffold
  if (!noChangelog) {
    if (!title) {
      console.warn("No --title provided, skipping CHANGELOG scaffold. Create CHANGELOG/v" + next + "-*.md manually.");
    } else {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "release";
      const changelogPath = `CHANGELOG/v${next}-${slug}.md`;
      try {
        await access(changelogPath);
        console.warn(`CHANGELOG file already exists: ${changelogPath}, skipping`);
      } catch {
        const today = new Date().toISOString().slice(0, 10);
        const prev = `v${current}`;
        const content = `# v${next} — ${title}

**Date:** ${today}
**Base:** ${prev}

## What changed
- 

## Fixes
- 

## Technical notes
- 

## Verification
- [ ] \`npm run lint\` clean
- [ ] \`npx tsc --noEmit\` clean
- [ ] \`npm run build\` clean
- [ ] Tests passing
`;
        await writeFile(changelogPath, content, "utf8");
        console.log(`Created ${changelogPath}`);

        // Update CHANGELOG/README.md variants list
        try {
          let readme = await readFile("CHANGELOG/README.md", "utf8");
          const entry = `- [v${next} — ${title}](./v${next}-${slug}.md (current))`;
          readme = readme.replace(/ \(current\)/g, "");
          if (readme.includes("## Variants")) {
            readme = readme.replace(/(## Variants\s*\n)/, `$1${entry}\n`);
            await writeFile("CHANGELOG/README.md", readme, "utf8");
            console.log("Updated CHANGELOG/README.md");
          }
        } catch {}
      }
    }
  }

  // 4. Git tag (annotated)
  if (!noTag) {
    try {
      execSync(`git tag -a "v${next}" -m "v${next} — ${title || "Release"}"`, { stdio: "inherit" });
      console.log(`Created git tag v${next}`);
    } catch (e) {
      console.warn(`Note on git tag: ${e.message}`);
    }
  }

  // 5. Ensure git hook installed & memory synced
  try {
    execSync(`node scripts/memory.mjs --sync`, { stdio: "inherit" });
  } catch {}
  try {
    const hookSrc = "scripts/hooks/post-commit.sh";
    const hookDst = ".git/hooks/post-commit";
    await access(hookSrc);
    const hookContent = await readFile(hookSrc, "utf8");
    await writeFile(hookDst, hookContent, "utf8");
    console.log(`Ensured git hook ${hookDst}`);
  } catch {}

  console.log(`\nDone. Next steps:\n  git add package.json VERSION CHANGELOG/ memory/\n  git commit -m "Release v${next} — ${title || ""}"\n  git push && git push --tags`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
