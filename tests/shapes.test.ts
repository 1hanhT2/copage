import { describe, it, expect } from "vitest";
import {
  getM3ShapeSvg,
  getCanonicalM3ShapeSvg,
  getProviderShape,
  M3_SHAPE_PATHS,
  M3_CANONICAL_SHAPE_PATHS,
  M3_MOTION_SPRINGS,
  M3_CORNER_TOKENS,
} from "../src/lib/shapes";

describe("Material 3 Expressive Shapes", () => {
  it("generates compact 24x24 SVG icons without emojis", () => {
    const sparkleSvg = getM3ShapeSvg("sparkle", 20, "#a8c7fa");
    expect(sparkleSvg).toContain('<svg viewBox="0 0 24 24" width="20" height="20" fill="#a8c7fa"');
    expect(sparkleSvg).toContain('<path d="M12 2L14.5 9.5L22 12');
    expect(sparkleSvg).not.toMatch(/[\u{1F300}-\u{1F6FF}]/u);
  });

  it("resolves model providers to M3 Expressive shape identities", () => {
    expect(getProviderShape("google/gemini-2.5-flash")).toBe("sparkle");
    expect(getProviderShape("deepseek/deepseek-r1")).toBe("flower");
    expect(getProviderShape("qwen/qwen-2.5-coder-32b")).toBe("diamond");
    expect(getProviderShape("meta-llama/llama-3.3-70b-instruct")).toBe("sunburst");
    expect(getProviderShape("anthropic/claude-3-7-sonnet")).toBe("sparkle");
    expect(getProviderShape("custom-local-model")).toBe("squircle");
  });

  it("provides canonical 380x380 SVG path geometry for all 35 M3 Expressive shapes", () => {
    const shapeKeys = Object.keys(M3_CANONICAL_SHAPE_PATHS);
    expect(shapeKeys.length).toBe(35);

    const sunnySvg = getCanonicalM3ShapeSvg("sunny", 32, "#ffdf99");
    expect(sunnySvg).toContain('viewBox="0 0 380 380"');
    expect(sunnySvg).toContain('width="32"');
    expect(sunnySvg).toContain('fill="#ffdf99"');

    const flowerSvg = getCanonicalM3ShapeSvg("flower", 24, "#d0bcff");
    expect(flowerSvg).toContain('viewBox="0 0 380 380"');
  });

  it("contains valid M3 Expressive motion and corner tokens", () => {
    expect(M3_MOTION_SPRINGS.expressiveOvershoot).toBe("cubic-bezier(0.34, 1.56, 0.64, 1.00)");
    expect(M3_CORNER_TOKENS.extraLarge).toBe("28px");
    expect(M3_CORNER_TOKENS.full).toBe("9999px");
  });
});
