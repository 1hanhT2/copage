import { describe, it, expect } from "vitest";
import {
  getM3ShapeSvg,
  getCanonicalM3ShapeSvg,
  getProviderShape,
  getElementM3Shape,
  getTargetM3Shape,
  getFrameworkM3Shape,
  getActionM3Shape,
  getCanonicalModelShape,
  getModelPillShape,
  getTargetPillShape,
  getModelPillShapeClass,
  getTargetPillShapeClass,
  M3_SHAPE_PATHS,
  M3_CANONICAL_SHAPE_PATHS,
  M3_EXPRESSIVE_PILL_POLYGONS,
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
    expect(getProviderShape("google/gemma-4-26b-a4b-it:free")).toBe("sparkle");
    expect(getProviderShape("poolside/laguna-s-2.1:free")).toBe("flower");
    expect(getProviderShape("thinkingmachines/inkling-small:free")).toBe("squircle");
    expect(getProviderShape("nvidia/nemotron-3.5-lightning:free")).toBe("sunburst");
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

    // Strict zero-emoji check across all 35 shapes
    for (const name of shapeKeys as (keyof typeof M3_CANONICAL_SHAPE_PATHS)[]) {
      const svg = getCanonicalM3ShapeSvg(name, 20);
      expect(svg).not.toMatch(/[\u{1F300}-\u{1F6FF}]/u);
      expect(svg).toContain('<svg viewBox="0 0 380 380"');
    }
  });

  it("contains valid M3 Expressive motion and corner tokens", () => {
    expect(M3_MOTION_SPRINGS.expressiveOvershoot).toBe("cubic-bezier(0.34, 1.56, 0.64, 1.00)");
    expect(M3_CORNER_TOKENS.extraLarge).toBe("28px");
    expect(M3_CORNER_TOKENS.full).toBe("9999px");
  });

  it("maps HTML element tags to semantic canonical shapes", () => {
    expect(getElementM3Shape("a")).toBe("arch");
    expect(getElementM3Shape("button")).toBe("pill");
    expect(getElementM3Shape("input")).toBe("pill");
    expect(getElementM3Shape("div")).toBe("square");
    expect(getElementM3Shape("section")).toBe("square");
    expect(getElementM3Shape("svg")).toBe("gem");
    expect(getElementM3Shape("img")).toBe("gem");
    expect(getElementM3Shape("span")).toBe("4-sided-cookie");
    expect(getElementM3Shape("p")).toBe("4-sided-cookie");
    expect(getElementM3Shape("table")).toBe("hexagon");
    expect(getElementM3Shape("code")).toBe("pixel-circle");
    expect(getElementM3Shape("unknown-element")).toBe("soft-burst");
  });

  it("maps prompt targets, frameworks, actions, and models to canonical shapes", () => {
    expect(getTargetM3Shape("cursor")).toBe("diamond");
    expect(getTargetM3Shape("claude")).toBe("flower");
    expect(getTargetM3Shape("v0")).toBe("arch");
    expect(getTargetM3Shape("html-tailwind")).toBe("sunny");
    expect(getTargetM3Shape("react-component")).toBe("gem");

    expect(getFrameworkM3Shape("react")).toBe("diamond");
    expect(getFrameworkM3Shape("vue")).toBe("triangle");
    expect(getFrameworkM3Shape("svelte")).toBe("soft-boom");
    expect(getFrameworkM3Shape("html")).toBe("arch");

    expect(getActionM3Shape("copy-html")).toBe("arch");
    expect(getActionM3Shape("copy-css")).toBe("flower");
    expect(getActionM3Shape("copy-tailwind")).toBe("diamond");
    expect(getActionM3Shape("copy-svgs")).toBe("burst");
    expect(getActionM3Shape("download-tsx")).toBe("gem");

    expect(getCanonicalModelShape("google/gemma-4-26b-a4b-it:free")).toBe("very-sunny");
    expect(getCanonicalModelShape("poolside/laguna-s-2.1:free")).toBe("flower");
    expect(getCanonicalModelShape("thinkingmachines/inkling-small:free")).toBe("arch");
    expect(getCanonicalModelShape("nvidia/nemotron-3.5-lightning:free")).toBe("burst");
    expect(getCanonicalModelShape("google/gemini-2.5-flash")).toBe("very-sunny");
    expect(getCanonicalModelShape("deepseek/deepseek-r1")).toBe("flower");
    expect(getCanonicalModelShape("qwen/qwen-2.5-coder-32b")).toBe("diamond");
    expect(getCanonicalModelShape("meta-llama/llama-3.3-70b")).toBe("burst");
    expect(getCanonicalModelShape("anthropic/claude-3-7-sonnet")).toBe("puffy-diamond");
  });

  it("normalizes all M3 Expressive pill polygons to exactly 14 vertices for smooth CSS morphing", () => {
    const pillKeys = Object.keys(M3_EXPRESSIVE_PILL_POLYGONS) as (keyof typeof M3_EXPRESSIVE_PILL_POLYGONS)[];
    expect(pillKeys).toEqual(["rugged", "scalloped", "diamond", "arch", "round"]);

    for (const key of pillKeys) {
      const polygonStr = M3_EXPRESSIVE_PILL_POLYGONS[key];
      expect(polygonStr.startsWith("polygon(")).toBe(true);
      expect(polygonStr.endsWith(")")).toBe(true);

      const inner = polygonStr.replace(/^polygon\(/, "").replace(/\)$/, "");
      // Split by commas not enclosed in calc parentheses
      const vertices = inner.split(/,(?![^(]*\))/);
      expect(vertices.length).toBe(14);
    }
  });

  it("maps models and targets to appropriate expressive pill silhouette classes", () => {
    expect(getModelPillShape("google/gemma-4-26b-a4b-it:free")).toBe("rugged");
    expect(getModelPillShape("poolside/laguna-s-2.1:free")).toBe("scalloped");
    expect(getModelPillShape("thinkingmachines/inkling-small:free")).toBe("arch");
    expect(getModelPillShape("nvidia/nemotron-3.5-lightning:free")).toBe("diamond");
    expect(getModelPillShape("google/gemini-2.5-flash")).toBe("rugged");
    expect(getModelPillShape("deepseek/deepseek-r1")).toBe("scalloped");
    expect(getModelPillShape("qwen/qwen-2.5-coder-32b")).toBe("diamond");
    expect(getModelPillShape("meta-llama/llama-3.3-70b")).toBe("rugged");
    expect(getModelPillShape("anthropic/claude-3-7-sonnet")).toBe("scalloped");

    expect(getModelPillShapeClass("google/gemma-4-26b-a4b-it:free")).toBe("m3-pill-rugged");
    expect(getModelPillShapeClass("poolside/laguna-s-2.1:free")).toBe("m3-pill-scalloped");
    expect(getModelPillShapeClass("thinkingmachines/inkling-small:free")).toBe("m3-pill-arch");
    expect(getModelPillShapeClass("nvidia/nemotron-3.5-lightning:free")).toBe("m3-pill-diamond");
    expect(getModelPillShapeClass("google/gemini-2.5-flash")).toBe("m3-pill-rugged");
    expect(getModelPillShapeClass("deepseek/deepseek-r1")).toBe("m3-pill-scalloped");
    expect(getModelPillShapeClass("qwen/qwen-2.5-coder-32b")).toBe("m3-pill-diamond");

    expect(getTargetPillShape("cursor")).toBe("diamond");
    expect(getTargetPillShape("claude")).toBe("scalloped");
    expect(getTargetPillShape("v0")).toBe("arch");
    expect(getTargetPillShape("html-tailwind")).toBe("rugged");

    expect(getTargetPillShapeClass("cursor")).toBe("m3-pill-diamond");
    expect(getTargetPillShapeClass("claude")).toBe("m3-pill-scalloped");
    expect(getTargetPillShapeClass("v0")).toBe("m3-pill-arch");
    expect(getTargetPillShapeClass("html-tailwind")).toBe("m3-pill-rugged");
  });
});
