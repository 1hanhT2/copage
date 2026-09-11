import { describe, it, expect } from "vitest";
import {
  getBrandIconSvg,
  getFrameworkIconSvg,
  getPromptTargetIconSvg,
  formatBrandSvg,
  BRAND_SVGS,
  reactSvg,
  tailwindSvg,
  vueSvg,
  svelteSvg,
  htmlSvg,
  cursorSvg,
  claudeSvg,
  v0Svg,
  poolsideSvg,
  thinkingmachinesSvg
} from "../src/lib/brand-icons";

describe("Brand and Framework Icons", () => {
  it("formats brand SVGs cleanly without XML declarations or hardcoded dimensions", () => {
    const formatted = formatBrandSvg(reactSvg, 20, "color: cyan;");
    expect(formatted).not.toContain("<?xml");
    expect(formatted).not.toContain("<!--");
    expect(formatted).toContain('width="20"');
    expect(formatted).toContain('height="20"');
    expect(formatted).toContain("color: cyan;");
  });

  it("provides official vector brand icons for all supported frameworks", () => {
    const reactIcon = getFrameworkIconSvg("react", 14);
    expect(reactIcon).toContain("<svg");
    expect(reactIcon).toContain('width="14"');

    const vueIcon = getFrameworkIconSvg("vue", 14);
    expect(vueIcon).toContain("<svg");
    expect(vueIcon).toContain('width="14"');

    const svelteIcon = getFrameworkIconSvg("svelte", 14);
    expect(svelteIcon).toContain("<svg");
    expect(svelteIcon).toContain('width="14"');

    const htmlIcon = getFrameworkIconSvg("html", 14);
    expect(htmlIcon).toContain("<svg");
    expect(htmlIcon).toContain('width="14"');

    const twIcon = getFrameworkIconSvg("tailwind", 14);
    expect(twIcon).toContain("<svg");
    expect(twIcon).toContain('width="14"');
  });

  it("provides official icons for prompt targets (Cursor, Claude, v0, Tailwind)", () => {
    const cursorIcon = getPromptTargetIconSvg("cursor", 13);
    expect(cursorIcon).toContain("<svg");

    const claudeIcon = getPromptTargetIconSvg("claude", 13);
    expect(claudeIcon).toContain("<svg");

    const v0Icon = getPromptTargetIconSvg("v0", 13);
    expect(v0Icon).toContain("<svg");

    const twIcon = getPromptTargetIconSvg("html-tailwind", 13);
    expect(twIcon).toContain("<svg");
  });

  it("resolves model brand icons for all current model presets", () => {
    const gemmaIcon = getBrandIconSvg("google/gemma-4-26b-a4b-it:free", 16);
    expect(gemmaIcon).toContain("<svg");

    const poolsideIcon = getBrandIconSvg("poolside/laguna-s-2.1:free", 16);
    expect(poolsideIcon).toContain("<svg");
    expect(poolsideIcon).toContain("Poolside");

    const thinkingIcon = getBrandIconSvg("thinkingmachines/inkling-small:free", 16);
    expect(thinkingIcon).toContain("<svg");
    expect(thinkingIcon).toContain("Thinking Machines");

    const nemotronIcon = getBrandIconSvg("nvidia/nemotron-3.5-lightning:free", 16);
    expect(nemotronIcon).toContain("<svg");
  });

  it("strictly enforces zero-emoji across all brand SVG assets", () => {
    for (const [name, svg] of Object.entries(BRAND_SVGS)) {
      expect(svg).not.toMatch(/[\u{1F300}-\u{1F6FF}]/u);
      expect(svg).not.toMatch(/[\u{1F900}-\u{1F9FF}]/u);
      expect(svg).not.toMatch(/[\u{2600}-\u{26FF}]/u);
    }
  });
});
