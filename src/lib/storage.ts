import type { LLMConfig, RecentCapture, UserPreferences } from "./types";

export interface ModelPreset {
  id: string;
  name: string;
  provider: string;
  speed: "blazing" | "fast";
  cost: "ultra-low" | "near-free";
  description: string;
}

export const RECOMMENDED_MODELS: ModelPreset[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    speed: "blazing",
    cost: "ultra-low",
    description: "Sub-second TTFT, instant in-page streaming, ultra-low cost."
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3 / V4 Flash",
    provider: "DeepSeek",
    speed: "fast",
    cost: "near-free",
    description: "Fractions of a cent, exceptional UI & Tailwind code generation."
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    provider: "Qwen",
    speed: "blazing",
    cost: "near-free",
    description: "Specialized for fast code synthesis and idiomatic React."
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Turbo",
    provider: "Meta",
    speed: "fast",
    cost: "ultra-low",
    description: "Top-tier open model, fast inference and strong layout reasoning."
  }
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  pruneNoise: true,
  mapTailwind: true,
  extractSvgs: true,
  autoCopy: true,
  deepShadow: true,
  frameworkTarget: "react"
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "openrouter",
  apiKey: "",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "google/gemini-2.5-flash"
};

const STORAGE_KEY_CONFIG = "copage_llm_config";
const STORAGE_KEY_PREFS = "copage_user_prefs";
const STORAGE_KEY_CAPTURES = "copage_recent_captures";

export async function getUserPreferences(): Promise<UserPreferences> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(STORAGE_KEY_PREFS);
    return { ...DEFAULT_PREFERENCES, ...(res[STORAGE_KEY_PREFS] || {}) };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getUserPreferences();
  const updated = { ...current, ...prefs };
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_PREFS]: updated });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export async function getLLMConfig(): Promise<LLMConfig> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(STORAGE_KEY_CONFIG);
    return { ...DEFAULT_LLM_CONFIG, ...(res[STORAGE_KEY_CONFIG] || {}) };
  }
  // Fallback to localStorage in non-extension environments (tests)
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    return raw ? { ...DEFAULT_LLM_CONFIG, ...JSON.parse(raw) } : DEFAULT_LLM_CONFIG;
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

export async function setLLMConfig(config: Partial<LLMConfig>): Promise<LLMConfig> {
  const current = await getLLMConfig();
  const updated = { ...current, ...config };
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_CONFIG]: updated });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export async function getRecentCaptures(): Promise<RecentCapture[]> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(STORAGE_KEY_CAPTURES);
    return (res[STORAGE_KEY_CAPTURES] as RecentCapture[]) || [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAPTURES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveRecentCapture(capture: RecentCapture): Promise<RecentCapture[]> {
  const current = await getRecentCaptures();
  // Keep last 20 captures
  const updated = [capture, ...current.filter((c) => c.id !== capture.id)].slice(0, 20);
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_CAPTURES]: updated });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY_CAPTURES, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export async function clearRecentCaptures(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove(STORAGE_KEY_CAPTURES);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY_CAPTURES);
    } catch {}
  }
}
