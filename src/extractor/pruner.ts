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
  "checked",
  "disabled",
  "title",
  "target",
  "class",
  "id"
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

  // Create clean clone
  const cleanEl = document.createElement(tagName.toLowerCase());

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

    cleanEl.setAttribute(name, attr.value);
  }

  // Process children
  let child = el.firstChild;
  let childCount = 0;
  let omittedCount = 0;

  while (child) {
    if (childCount >= truncateThreshold && el.children.length > truncateThreshold + 1) {
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
    child = child.nextSibling;
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
