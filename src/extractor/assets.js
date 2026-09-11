export function cleanSvgElement(svg) {
    const clone = svg.cloneNode(true);
    // Clean unnecessary namespace and internal attributes
    clone.removeAttribute("xmlns:xlink");
    clone.removeAttribute("xml:space");
    const width = parseFloat(svg.getAttribute("width") || "24") || 24;
    const height = parseFloat(svg.getAttribute("height") || "24") || 24;
    const viewBox = svg.getAttribute("viewBox") || `0 0 ${width} ${height}`;
    const rawXml = clone.outerHTML;
    // Suggest common icon based on classes, aria-label, or shape
    let suggestedLucideIcon;
    const lower = (svg.getAttribute("class") || "") + " " + (svg.getAttribute("aria-label") || "") + " " + (svg.id || "");
    if (lower.includes("search"))
        suggestedLucideIcon = "Search";
    else if (lower.includes("close") || lower.includes("cross") || lower.includes("cancel"))
        suggestedLucideIcon = "X";
    else if (lower.includes("check") || lower.includes("tick") || lower.includes("success"))
        suggestedLucideIcon = "Check";
    else if (lower.includes("chevron-down") || lower.includes("arrow-down"))
        suggestedLucideIcon = "ChevronDown";
    else if (lower.includes("chevron-right") || lower.includes("arrow-right"))
        suggestedLucideIcon = "ChevronRight";
    else if (lower.includes("menu") || lower.includes("hamburger"))
        suggestedLucideIcon = "Menu";
    else if (lower.includes("user") || lower.includes("avatar") || lower.includes("profile"))
        suggestedLucideIcon = "User";
    else if (lower.includes("star"))
        suggestedLucideIcon = "Star";
    else if (lower.includes("heart") || lower.includes("like"))
        suggestedLucideIcon = "Heart";
    else if (lower.includes("settings") || lower.includes("gear"))
        suggestedLucideIcon = "Settings";
    else if (lower.includes("copy"))
        suggestedLucideIcon = "Copy";
    return {
        viewBox,
        width,
        height,
        svgString: rawXml,
        suggestedLucideIcon
    };
}
export function extractSvgAssets(root) {
    const assets = [];
    if (root.tagName.toUpperCase() === "SVG") {
        assets.push(cleanSvgElement(root));
    }
    const svgs = root.querySelectorAll("svg");
    svgs.forEach((s) => {
        assets.push(cleanSvgElement(s));
    });
    return assets;
}
export function resolveAbsoluteUrl(url, base = window.location.href) {
    try {
        return new URL(url, base).href;
    }
    catch {
        return url;
    }
}
export function cleanFontFamily(rawFont) {
    if (!rawFont)
        return "sans-serif";
    const first = rawFont.split(",")[0].trim().replace(/['"]/g, "");
    return first || "sans-serif";
}
