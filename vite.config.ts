/// <reference types="vitest" />
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir, access } from "node:fs/promises";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

function copyManifestAndIcons() {
  return {
    name: "copy-manifest-and-icons",
    async closeBundle() {
      await copyFile("manifest.json", "dist/manifest.json");
      await mkdir("dist/icons", { recursive: true });

      // Ensure root-level popup.html and options.html are available
      try {
        await copyFile("dist/src/ui/popup/index.html", "dist/popup.html");
      } catch {}
      try {
        await copyFile("dist/src/ui/options/index.html", "dist/options.html");
      } catch {}

      for (const size of [16, 48, 128]) {
        const iconSrc = `public/icons/icon-${size}.png`;
        try {
          await access(iconSrc);
          await copyFile(iconSrc, `dist/icons/icon-${size}.png`);
        } catch {
          try {
            await copyFile("copage-logo-for-white-mode.png", `dist/icons/icon-${size}.png`);
          } catch {}
        }
      }
    }
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir, "src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(rootDir, "src/ui/popup/index.html"),
        options: resolve(rootDir, "src/ui/options/index.html"),
        background: resolve(rootDir, "src/background/index.ts"),
        content: resolve(rootDir, "src/content/index.ts")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "content") return "content.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  plugins: [copyManifestAndIcons()],
  test: {
    globals: true,
    environment: "jsdom"
  }
});
