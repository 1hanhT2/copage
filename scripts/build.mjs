#!/usr/bin/env node
import { build } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir, access, readdir } from "node:fs/promises";
import { generateIcons } from "./generate-icons.mjs";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

async function main() {
  console.log("Building Copage extension...");
  await generateIcons();

  // 1. Build UI & Background (ESM format)
  await build({
    configFile: false,
    resolve: {
      alias: {
        "@": resolve(rootDir, "src")
      }
    },
    build: {
      outDir: resolve(rootDir, "dist"),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(rootDir, "src/ui/popup/index.html"),
          options: resolve(rootDir, "src/ui/options/index.html"),
          background: resolve(rootDir, "src/background/index.ts")
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === "background") return "background.js";
            return "assets/[name]-[hash].js";
          },
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
        }
      }
    }
  });

  // 2. Build Content Script (IIFE format — 100% self-contained, NO imports)
  await build({
    configFile: false,
    resolve: {
      alias: {
        "@": resolve(rootDir, "src")
      }
    },
    build: {
      outDir: resolve(rootDir, "dist"),
      emptyOutDir: false, // keep existing background and UI
      rollupOptions: {
        input: resolve(rootDir, "src/content/index.ts"),
        output: {
          format: "iife",
          name: "CopageContentScript",
          entryFileNames: "content.js",
          inlineDynamicImports: true
        }
      }
    }
  });

  // 3. Post-build file layout for Manifest V3
  const distDir = resolve(rootDir, "dist");
  await copyFile(resolve(rootDir, "manifest.json"), resolve(distDir, "manifest.json"));
  await mkdir(resolve(distDir, "icons"), { recursive: true });

  try {
    await copyFile(resolve(distDir, "src/ui/popup/index.html"), resolve(distDir, "popup.html"));
  } catch {}
  try {
    await copyFile(resolve(distDir, "src/ui/options/index.html"), resolve(distDir, "options.html"));
  } catch {}

  for (const size of [16, 48, 128]) {
    const iconSrc = resolve(rootDir, `public/icons/icon-${size}.png`);
    try {
      await access(iconSrc);
      await copyFile(iconSrc, resolve(distDir, `icons/icon-${size}.png`));
    } catch {
      try {
        await copyFile(resolve(rootDir, "copage-logo-for-white-mode.png"), resolve(distDir, `icons/icon-${size}.png`));
      } catch {}
    }
  }

  // Copy assets to dist/assets
  const assetsSrc = resolve(rootDir, "public/assets");
  const assetsDist = resolve(distDir, "assets");
  await mkdir(assetsDist, { recursive: true });
  try {
    const assetFiles = await readdir(assetsSrc);
    for (const file of assetFiles) {
      await copyFile(resolve(assetsSrc, file), resolve(assetsDist, file));
    }
  } catch {}

  console.log("✓ Build complete. Clean IIFE content.js and ESM background.js ready in dist/");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
