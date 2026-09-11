const LAYOUT_PROPS = [
    "display",
    "position",
    "flexDirection",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "gap",
    "gridTemplateColumns",
    "gridTemplateRows",
    "zIndex",
    "overflow"
];
const BOX_MODEL_PROPS = [
    "width",
    "height",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "boxSizing"
];
const TYPOGRAPHY_PROPS = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "textAlign",
    "color",
    "textTransform",
    "textDecoration",
    "whiteSpace"
];
const VISUAL_PROPS = [
    "backgroundColor",
    "backgroundImage",
    "borderTop",
    "borderRight",
    "borderBottom",
    "borderLeft",
    "borderRadius",
    "boxShadow",
    "opacity",
    "backdropFilter",
    "cursor"
];
const TRANSFORMS_PROPS = [
    "transform",
    "transition"
];
const INHERITED_PROPS = new Set([
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "textAlign",
    "color",
    "whiteSpace",
    "cursor"
]);
function shouldIgnoreValue(prop, val) {
    if (!val)
        return true;
    if (val === "none" || val === "normal" || val === "auto")
        return true;
    if (val === "rgba(0, 0, 0, 0)" || val === "transparent")
        return true;
    if (val === "0px" && (prop.startsWith("padding") || prop.startsWith("margin") || prop.startsWith("border")))
        return true;
    if (val === "static" && prop === "position")
        return true;
    if (val === "visible" && prop === "visibility")
        return true;
    return false;
}
export function extractDistilledStyles(element, parentElement) {
    const computed = window.getComputedStyle(element);
    const parentComputed = parentElement ? window.getComputedStyle(parentElement) : null;
    const extractGroup = (props) => {
        const group = {};
        for (const prop of props) {
            const val = computed[prop];
            if (!val || shouldIgnoreValue(prop, val))
                continue;
            // Check inheritance diffing
            if (INHERITED_PROPS.has(prop) && parentComputed) {
                const parentVal = parentComputed[prop];
                if (parentVal === val)
                    continue;
            }
            group[prop] = val;
        }
        return group;
    };
    // Combine directional paddings/margins for cleaner output if identical
    const boxModel = extractGroup(BOX_MODEL_PROPS);
    if (boxModel.paddingTop &&
        boxModel.paddingTop === boxModel.paddingRight &&
        boxModel.paddingTop === boxModel.paddingBottom &&
        boxModel.paddingTop === boxModel.paddingLeft) {
        boxModel.padding = boxModel.paddingTop;
        delete boxModel.paddingTop;
        delete boxModel.paddingRight;
        delete boxModel.paddingBottom;
        delete boxModel.paddingLeft;
    }
    return {
        layout: extractGroup(LAYOUT_PROPS),
        boxModel,
        typography: extractGroup(TYPOGRAPHY_PROPS),
        visual: extractGroup(VISUAL_PROPS),
        transforms: extractGroup(TRANSFORMS_PROPS)
    };
}
export function extractFlatDistilledStyles(element) {
    const distilled = extractDistilledStyles(element);
    return {
        ...distilled.layout,
        ...distilled.boxModel,
        ...distilled.typography,
        ...distilled.visual,
        ...distilled.transforms
    };
}
