/**
 * Material 3 Expressive Shape Library
 * Strict Zero-Emoji implementation of Google's M3 Expressive shape taxonomy.
 * Includes 4-point starburst (sparkle), scalloped flower, astroid diamond,
 * 8-point sunburst, and squircle tokens.
 */

export type M3ShapeName = "sparkle" | "flower" | "diamond" | "sunburst" | "squircle" | "radar";

export const M3_SHAPE_PATHS: Record<M3ShapeName, string> = {
  // 4-point starburst / sparkle (AI, flagship, primary)
  sparkle: "M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z",
  // Scalloped flower badge (DeepSeek, reasoning, creative)
  flower: "M12 3a3 3 0 0 1 2.83 2 3 3 0 0 1 3.47 1.44 3 3 0 0 1 1.44 3.47A3 3 0 0 1 21 12a3 3 0 0 1-1.26 2.09 3 3 0 0 1-1.44 3.47 3 3 0 0 1-3.47 1.44A3 3 0 0 1 12 21a3 3 0 0 1-2.83-2 3 3 0 0 1-3.47-1.44 3 3 0 0 1-1.44-3.47A3 3 0 0 1 3 12a3 3 0 0 1 1.26-2.09 3 3 0 0 1 1.44-3.47 3 3 0 0 1 3.47-1.44A3 3 0 0 1 12 3z",
  // Astroid diamond / curved rhombus (Qwen, code precision)
  diamond: "M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z",
  // 8-point sunburst (Meta Llama, open weights, power)
  sunburst: "M12 2l2.4 4.8 5.3-1.6-1.6 5.3 4.8 2.4-4.8 2.4 1.6 5.3-5.3-1.6-2.4 4.8-2.4-4.8-5.3 1.6 1.6-5.3-4.8-2.4 4.8-2.4-1.6-5.3 5.3 1.6z",
  // Rounded polygon squircle
  squircle: "M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z",
  // Concentric radar sensor (scanning, active detection)
  radar: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
};

/**
 * Returns an inline SVG string for the requested M3 Expressive shape.
 */
export function getM3ShapeSvg(name: M3ShapeName, size = 16, color = "currentColor", extraStyle = ""): string {
  const path = M3_SHAPE_PATHS[name] || M3_SHAPE_PATHS.sparkle;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" style="flex-shrink: 0; ${extraStyle}" aria-hidden="true"><path d="${path}"/></svg>`;
}

/**
 * Resolves the appropriate M3 Expressive shape for a given model or provider ID.
 */
export function getProviderShape(providerOrModel: string): M3ShapeName {
  const lower = providerOrModel.toLowerCase();
  if (lower.includes("google") || lower.includes("gemini")) return "sparkle";
  if (lower.includes("deepseek")) return "flower";
  if (lower.includes("qwen")) return "diamond";
  if (lower.includes("meta") || lower.includes("llama")) return "sunburst";
  if (lower.includes("anthropic") || lower.includes("claude")) return "sparkle";
  return "squircle";
}
