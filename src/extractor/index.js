import { formatPrunedHtml } from "./pruner";
import { extractDistilledStyles, extractFlatDistilledStyles } from "./styles";
import { mapStylesToTailwind } from "./tailwind-mapper";
import { extractSvgAssets, cleanFontFamily } from "./assets";
function parseBoxEdges(computed, prefix) {
    const getVal = (side) => {
        const key = prefix === "border" ? `border${side}Width` : `${prefix}${side}`;
        return parseFloat(computed[key] || "0") || 0;
    };
    return {
        top: getVal("Top"),
        right: getVal("Right"),
        bottom: getVal("Bottom"),
        left: getVal("Left")
    };
}
export function extractBreadcrumbs(element) {
    const breadcrumbs = [];
    let current = element;
    let index = 0;
    while (current && current !== document.body && current !== document.documentElement) {
        breadcrumbs.unshift({
            tagName: current.tagName.toLowerCase(),
            id: current.id || "",
            className: typeof current.className === "string" ? current.className.split(/\s+/)[0] || "" : "",
            index: index++
        });
        current = current.parentElement;
        if (breadcrumbs.length >= 8)
            break; // Limit depth
    }
    return breadcrumbs;
}
export function extractElementData(element) {
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
    const distilledStyles = extractDistilledStyles(element, parent);
    const flatStyles = extractFlatDistilledStyles(element);
    const tailwindClasses = mapStylesToTailwind(flatStyles);
    const cleanHtml = formatPrunedHtml(element);
    const svgAssets = extractSvgAssets(element);
    const breadcrumbs = extractBreadcrumbs(element);
    const computedFont = cleanFontFamily(computed.fontFamily);
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
        pageUrl: window.location.href,
        pageTitle: document.title || ""
    };
}
