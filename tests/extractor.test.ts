import { describe, it, expect } from "vitest";
import { pruneElementTree, formatPrunedHtml } from "../src/extractor/pruner";
import { mapStylesToTailwind } from "../src/extractor/tailwind-mapper";
import { extractDistilledStyles } from "../src/extractor/styles";
import { cleanSvgElement } from "../src/extractor/assets";

describe("DOM & Style Extractor Engine", () => {
  it("prunes script tags, comments, and noisy attributes from DOM", () => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="card" data-testid="user-card" onclick="alert(1)">
        <h3>Title</h3>
        <script>console.log('malicious');</script>
        <!-- A comment -->
        <p>Description text</p>
      </div>
    `;

    const cleanHtml = formatPrunedHtml(div.firstElementChild as HTMLElement);
    expect(cleanHtml).toContain("Title");
    expect(cleanHtml).toContain("Description text");
    expect(cleanHtml).not.toContain("<script");
    expect(cleanHtml).not.toContain("malicious");
    expect(cleanHtml).not.toContain("alert(1)");
    expect(cleanHtml).not.toContain("data-testid");
    expect(cleanHtml).not.toContain("A comment");
  });

  it("maps computed styles to Tailwind classes accurately", () => {
    const styles: Record<string, string> = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px",
      gap: "8px",
      borderRadius: "8px",
      backgroundColor: "rgb(37, 99, 235)",
      fontSize: "14px",
      fontWeight: "600"
    };

    const classes = mapStylesToTailwind(styles);
    expect(classes).toContain("flex");
    expect(classes).toContain("items-center");
    expect(classes).toContain("justify-between");
    expect(classes).toContain("p-4");
    expect(classes).toContain("gap-2");
    expect(classes).toContain("rounded-lg");
    expect(classes).toContain("bg-[#2563eb]");
    expect(classes).toContain("text-sm");
    expect(classes).toContain("font-semibold");
  });

  it("distills computed styles into structured groups", () => {
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.padding = "12px";
    el.style.color = "rgb(15, 23, 42)";
    document.body.appendChild(el);

    const distilled = extractDistilledStyles(el);
    expect(distilled.layout.display).toBe("flex");
    expect(distilled.boxModel.padding).toBe("12px");
    expect(distilled.typography.color).toBe("rgb(15, 23, 42)");
    document.body.removeChild(el);
  });

  it("identifies and cleans SVG elements", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "icon-search");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0");
    svg.appendChild(path);

    const asset = cleanSvgElement(svg);
    expect(asset.viewBox).toBe("0 0 24 24");
    expect(asset.suggestedLucideIcon).toBe("Search");
    expect(asset.svgString).not.toContain("xmlns:xlink");
  });
});
