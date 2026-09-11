import { describe, it, expect } from "vitest";
import { buildPromptForTarget } from "../src/llm/prompts";
import type { InspectedElementData } from "../src/lib/types";

describe("Prompt Synthesizer", () => {
  const mockData: InspectedElementData = {
    tagName: "button",
    id: "submit-btn",
    classList: ["btn-primary", "rounded-lg"],
    rect: { top: 100, left: 150, width: 140, height: 42, bottom: 142, right: 290 },
    boxModel: {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 10, right: 16, bottom: 10, left: 16 },
      border: { top: 1, right: 1, bottom: 1, left: 1 }
    },
    cleanHtml: '<button class="btn-primary rounded-lg"><span>Submit</span></button>',
    distilledStyles: {
      layout: { display: "flex", alignItems: "center" },
      boxModel: { padding: "10px 16px" },
      typography: { fontSize: "14px", fontWeight: "600", color: "#ffffff" },
      visual: { backgroundColor: "rgb(37, 99, 235)", borderRadius: "8px" },
      transforms: {}
    },
    tailwindClasses: ["flex", "items-center", "p-4", "rounded-lg", "bg-[#2563eb]"],
    svgAssets: [],
    breadcrumbs: [{ tagName: "button", id: "submit-btn", className: "btn-primary", index: 0 }],
    computedFont: "Inter",
    pageUrl: "https://example.com/checkout",
    pageTitle: "Checkout"
  };

  it("builds an optimized Cursor Composer prompt", () => {
    const { system, prompt } = buildPromptForTarget(mockData, "cursor");
    expect(system).toContain("expert fullstack frontend engineer");
    expect(prompt).toContain("Cursor Composer");
    expect(prompt).toContain("Reproduce the following web UI component");
    expect(prompt).toContain("140px × 42px");
    expect(prompt).toContain("btn-primary");
    expect(prompt).toContain("<button");
  });

  it("builds a React component prompt", () => {
    const { system, prompt } = buildPromptForTarget(mockData, "react-component");
    expect(system).toContain("React and Tailwind CSS developer");
    expect(prompt).toContain("Generate a production-ready React component");
  });

  it("builds a Claude reproduction prompt", () => {
    const { prompt } = buildPromptForTarget(mockData, "claude");
    expect(prompt).toContain("Please analyze and recreate this UI component");
  });
});
