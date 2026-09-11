import { svg as geminiSvg } from "thesvg/gemini";
import { svg as deepseekSvg } from "thesvg/deepseek";
import { svg as qwenSvg } from "thesvg/qwen";
import { svg as metaSvg } from "thesvg/meta";
import { svg as ollamaSvg } from "thesvg/ollama";
import { svg as openrouterSvg } from "thesvg/openrouter";
import { svg as googleSvg } from "thesvg/google";
import { svg as openaiSvg } from "thesvg/openai";
import { svg as anthropicSvg } from "thesvg/anthropic";

/**
 * Normalizes an SVG string from thesvg to fit given dimensions cleanly.
 */
export function formatBrandSvg(rawSvg: string, size = 16, extraStyle = ""): string {
  if (!rawSvg) return "";
  const cleaned = rawSvg
    .replace(/\s(width|height)="[^"]*"/gi, "")
    .replace(/<svg\b/i, '<svg width="' + size + '" height="' + size + '" style="width: ' + size + 'px; height: ' + size + 'px; flex-shrink: 0; display: inline-block; vertical-align: middle; ' + extraStyle + '"');
  return cleaned;
}

export type BrandIconKey =
  | "gemini"
  | "deepseek"
  | "qwen"
  | "llama"
  | "meta"
  | "ollama"
  | "openrouter"
  | "google"
  | "openai"
  | "anthropic";

export const BRAND_SVGS: Record<string, string> = {
  gemini: geminiSvg,
  deepseek: deepseekSvg,
  qwen: qwenSvg,
  llama: metaSvg,
  meta: metaSvg,
  ollama: ollamaSvg,
  openrouter: openrouterSvg,
  google: googleSvg,
  openai: openaiSvg,
  anthropic: anthropicSvg
};

/**
 * Returns the brand SVG for a model ID, provider name, or brand keyword.
 */
export function getBrandIconSvg(identifier: string, size = 16, extraStyle = ""): string {
  const lower = (identifier || "").toLowerCase();

  let raw: string = openrouterSvg;
  if (lower.includes("gemini")) raw = geminiSvg;
  else if (lower.includes("deepseek")) raw = deepseekSvg;
  else if (lower.includes("qwen")) raw = qwenSvg;
  else if (lower.includes("ollama")) raw = ollamaSvg;
  else if (lower.includes("llama") || lower.includes("meta")) raw = metaSvg;
  else if (lower.includes("claude") || lower.includes("anthropic")) raw = anthropicSvg;
  else if (lower.includes("gpt") || lower.includes("openai") || lower.includes("chatgpt") || lower.includes("o1") || lower.includes("o3")) raw = openaiSvg;
  else if (lower.includes("google")) raw = googleSvg;
  else if (lower.includes("openrouter")) raw = openrouterSvg;

  return formatBrandSvg(raw, size, extraStyle);
}
