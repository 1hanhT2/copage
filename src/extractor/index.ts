import type { InspectedElementData, BreadcrumbItem, BoxEdges } from "../lib/types";
import { formatPrunedHtml } from "./pruner";
import { extractDistilledStyles, extractFlatDistilledStyles, extractRelevantCssVariables } from "./styles";
import { mapStylesToTailwind } from "./tailwind-mapper";
import { extractSvgAssets, cleanFontFamily } from "./assets";

function parseBoxEdges(computed: CSSStyleDeclaration, prefix: "margin" | "padding" | "border"): BoxEdges {
  const getVal = (side: "Top" | "Right" | "Bottom" | "Left") => {
    const key = prefix === "border" ? `border${side}Width` : `${prefix}${side}`;
    return parseFloat((computed as unknown as Record<string, string>)[key] || "0") || 0;
  };
  return {
    top: getVal("Top"),
    right: getVal("Right"),
    bottom: getVal("Bottom"),
    left: getVal("Left")
  };
}

export function extractBreadcrumbs(element: HTMLElement): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  let current: HTMLElement | null = element;
  let index = 0;

  while (current && current !== document.body && current !== document.documentElement) {
    breadcrumbs.unshift({
      tagName: current.tagName.toLowerCase(),
      id: current.id || "",
      className: typeof current.className === "string" ? current.className.split(/\s+/)[0] || "" : "",
      index: index++
    });
    current = current.parentElement;
    if (breadcrumbs.length >= 8) break; // Limit depth
  }

  return breadcrumbs;
}

export function extractElementData(element: HTMLElement): InspectedElementData {
  const rawRect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);

  const rect = {
    top: Math.round(rawRect.top),
    left: Math.round(rawRect.left),
    width: Math.round(rawRect.width),
    height: Math.round(rawRect.height),
    bottom: Math.round(rawRect.bottom),
    right: Math.round(rawRect.right)
  };

  const boxModel = {
    margin: parseBoxEdges(computed, "margin"),
    padding: parseBoxEdges(computed, "padding"),
    border: parseBoxEdges(computed, "border")
  };

  const parent = element.parentElement || undefined;
  const distilledStyles = extractDistilledStyles(element, parent, computed);
  const flatStyles = {
    ...distilledStyles.layout,
    ...distilledStyles.boxModel,
    ...distilledStyles.typography,
    ...distilledStyles.visual,
    ...distilledStyles.transforms
  };
  const tailwindClasses = mapStylesToTailwind(flatStyles);
  const cleanHtml = formatPrunedHtml(element);
  const svgAssets = extractSvgAssets(element);
  const breadcrumbs = extractBreadcrumbs(element);
  const computedFont = cleanFontFamily(computed.fontFamily);
  const cssVariables = extractRelevantCssVariables(element, computed);

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || "",
    classList: Array.from(element.classList),
    rect,
    boxModel,
    cleanHtml,
    distilledStyles,
    tailwindClasses,
    svgAssets,
    breadcrumbs,
    computedFont,
    cssVariables,
    pageUrl: window.location.href,
    pageTitle: document.title || ""
  };
}
