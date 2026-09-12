/**
 * pruner.ts — Intelligent DOM tree pruner for LLM context optimization.
 */

const BLACKLIST_TAGS = new Set([
  "SCRIPT",
  "NOSCRIPT",
  "STYLE",
  "LINK",
  "META",
  "TEMPLATE",
  "IFRAME",
  "AUDIO",
  "OBJECT",
  "EMBED",
  "HEAD"
]);

const ALLOWED_ATTRS = new Set([
  "href",
  "src",
  "alt",
  "role",
  "aria-label",
  "placeholder",
  "type",
  "value",
  "checked",
  "selected",
  "disabled",
  "title",
  "target",
  "class",
  "id",
  // SVG attributes
  "viewbox",
  "d",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "xmlns",
  "clip-rule",
  "fill-rule",
  "transform",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "width",
  "height"
]);

export interface PruneOptions {
  maxDepth?: number;
  truncateListThreshold?: number;
}

export function pruneElementTree(
  node: Node,
  depth = 0,
  options: PruneOptions = { maxDepth: 10, truncateListThreshold: 3 }
): Node | null {
  const maxDepth = options.maxDepth ?? 10;
  const truncateThreshold = options.truncateListThreshold ?? 3;

  if (depth > maxDepth) return null;
  if (node.nodeType === Node.COMMENT_NODE) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim() || "";
    return text ? document.createTextNode(node.textContent || "") : null;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tagName = el.tagName.toUpperCase();

  if (BLACKLIST_TAGS.has(tagName)) return null;

  // Visibility check
  try {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return null;
    }
  } catch {}

  // Tracking pixel check (0x0 or 1x1 images)
  if (tagName === "IMG") {
    const w = el.getAttribute("width");
    const h = el.getAttribute("height");
    if (w === "0" || w === "1" || h === "0" || h === "1") return null;
    const src = el.getAttribute("src") || "";
    if (/analytics|pixel|telemetry|doubleclick|bat\.bing/i.test(src)) return null;
  }

  // Create clean clone with proper namespace (SVG vs HTML)
  const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg" || tagName === "SVG";
  const cleanEl = (isSvg
    ? document.createElementNS("http://www.w3.org/2000/svg", tagName.toLowerCase())
    : document.createElement(tagName.toLowerCase())) as Element;

  // Copy allowed attributes only
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    const name = attr.name.toLowerCase();

    if (!ALLOWED_ATTRS.has(name)) continue;

    // Filter noisy dynamic IDs (like :r1: or random hashes)
    if (name === "id") {
      if (attr.value.startsWith(":") || attr.value.length > 30) continue;
    }

    // Truncate giant base64 data URIs
    if (name === "src" && attr.value.startsWith("data:") && attr.value.length > 100) {
      cleanEl.setAttribute(name, "[inline-image-data]");
      continue;
    }

    const targetAttrName = (isSvg && name === "viewbox") ? "viewBox" : name;
    cleanEl.setAttribute(targetAttrName, attr.value);
  }

  // Live form state capture (SingleFile inspiration)
  if (tagName === "INPUT") {
    const input = el as HTMLInputElement;
    if (input.type === "checkbox" || input.type === "radio") {
      if (input.checked) cleanEl.setAttribute("checked", "");
      else cleanEl.removeAttribute("checked");
    } else if (input.value) {
      cleanEl.setAttribute("value", input.value);
    }
  } else if (tagName === "TEXTAREA") {
    const textarea = el as HTMLTextAreaElement;
    if (textarea.value) {
      cleanEl.textContent = textarea.value;
    }
  } else if (tagName === "OPTION") {
    const option = el as HTMLOptionElement;
    if (option.selected) {
      cleanEl.setAttribute("selected", "");
    }
  }

  // Process children (including shadowRoot for Web Components)
  const childNodes: Node[] = [];
  if (el.shadowRoot) {
    el.shadowRoot.childNodes.forEach((c) => childNodes.push(c));
  }
  el.childNodes.forEach((c) => childNodes.push(c));

  let childCount = 0;
  let omittedCount = 0;

  for (const child of childNodes) {
    if (childCount >= truncateThreshold && childNodes.length > truncateThreshold + 1) {
      omittedCount++;
    } else {
      const prunedChild = pruneElementTree(child, depth + 1, options);
      if (prunedChild) {
        cleanEl.appendChild(prunedChild);
        if (prunedChild.nodeType === Node.ELEMENT_NODE) {
          childCount++;
        }
      }
    }
  }

  if (omittedCount > 0) {
    cleanEl.appendChild(
      document.createComment(` ... [${omittedCount} similar items omitted for brevity] ... `)
    );
  }

  return cleanEl;
}

export function formatPrunedHtml(root: HTMLElement): string {
  const pruned = pruneElementTree(root);
  if (!pruned) return "";
  const container = document.createElement("div");
  container.appendChild(pruned);
  return container.innerHTML;
}
