import type { LLMConfig, RecentCapture, UserPreferences, LibraryItem, InspectedElementData } from "./types";

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
  frameworkTarget: "react",
  autoSaveToLibrary: false
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
const STORAGE_KEY_LIBRARY = "copage_element_library";

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

/**
 * Generates semantic tag categories from HTML element tag name and CSS class tokens.
 */
export function generateSmartTags(tagName: string, classList: string[] = []): string[] {
  const tags = new Set<string>();
  const tagLower = tagName.toLowerCase();
  const classStr = classList.join(" ").toLowerCase();

  if (tagLower === "button" || classStr.includes("btn") || classStr.includes("button")) {
    tags.add("Button");
  }
  if (tagLower === "nav" || classStr.includes("nav") || classStr.includes("menu") || classStr.includes("header")) {
    tags.add("Navigation");
  }
  if (classStr.includes("card") || classStr.includes("tile") || classStr.includes("box")) {
    tags.add("Card");
  }
  if (tagLower === "form" || classStr.includes("form") || classStr.includes("input") || tagLower === "input") {
    tags.add("Form");
  }
  if (classStr.includes("hero") || classStr.includes("banner")) {
    tags.add("Hero");
  }
  if (classStr.includes("modal") || classStr.includes("dialog") || classStr.includes("popup")) {
    tags.add("Modal");
  }
  if (tagLower === "footer" || classStr.includes("footer")) {
    tags.add("Footer");
  }
  if (classStr.includes("badge") || classStr.includes("chip") || classStr.includes("pill") || classStr.includes("tag")) {
    tags.add("Badge");
  }
  if (classStr.includes("table") || tagLower === "table") {
    tags.add("Table");
  }
  if (classStr.includes("pricing") || classStr.includes("plan")) {
    tags.add("Pricing");
  }
  if (classStr.includes("sidebar") || classStr.includes("aside") || tagLower === "aside") {
    tags.add("Sidebar");
  }
  if (tagLower === "svg" || classStr.includes("icon")) {
    tags.add("Icon");
  }

  if (tags.size === 0) {
    if (tagLower === "section" || tagLower === "article" || tagLower === "main") {
      tags.add("Section");
    } else {
      tags.add(tagName.toUpperCase());
    }
  }

  return Array.from(tags);
}

/**
 * Generates an intuitive human-readable component name based on element properties.
 */
export function generateComponentName(tagName: string, classList: string[] = [], pageTitle = ""): string {
  const classStr = classList.join(" ").toLowerCase();
  let baseName = "";

  if (classStr.includes("pricing")) baseName = "Pricing Card";
  else if (classStr.includes("hero")) baseName = "Hero Section";
  else if (classStr.includes("navbar") || (tagName.toLowerCase() === "nav" && classStr.includes("bar"))) baseName = "Navbar";
  else if (classStr.includes("nav") || tagName.toLowerCase() === "nav") baseName = "Navigation Bar";
  else if (classStr.includes("header") || tagName.toLowerCase() === "header") baseName = "Header";
  else if (classStr.includes("footer") || tagName.toLowerCase() === "footer") baseName = "Footer";
  else if (classStr.includes("sidebar") || tagName.toLowerCase() === "aside") baseName = "Sidebar";
  else if (classStr.includes("card")) baseName = "Card Component";
  else if (tagName.toLowerCase() === "button" || classStr.includes("btn")) baseName = "Action Button";
  else if (tagName.toLowerCase() === "form") baseName = "Form Component";
  else if (classStr.includes("modal") || classStr.includes("dialog")) baseName = "Modal Dialog";
  else if (classStr.includes("banner")) baseName = "Announcement Banner";
  else if (classStr.includes("badge") || classStr.includes("chip")) baseName = "Badge Chip";
  else if (classList.length > 0) {
    baseName = classList[0]
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } else {
    baseName = `${tagName.charAt(0).toUpperCase() + tagName.slice(1)} Component`;
  }


  return baseName;
}

/**
 * Converts extracted element data into a complete LibraryItem.
 */
export function createLibraryItemFromElement(
  data: InspectedElementData,
  extras?: Partial<LibraryItem>
): LibraryItem {
  const defaultName = generateComponentName(data.tagName, data.classList, data.pageTitle);
  const defaultTags = generateSmartTags(data.tagName, data.classList);

  return {
    id: extras?.id || `lib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: extras?.timestamp || Date.now(),
    url: data.pageUrl,
    pageTitle: data.pageTitle,
    name: extras?.name || defaultName,
    tagName: data.tagName,
    classList: data.classList,
    dimensions: `${data.rect.width} × ${data.rect.height}px`,
    summary: `<${data.tagName}> ${data.classList.length > 0 ? "." + data.classList.slice(0, 2).join(".") : ""}`,
    cleanHtml: data.cleanHtml,
    distilledStyles: data.distilledStyles,
    tailwindClasses: data.tailwindClasses,
    svgAssets: data.svgAssets,
    reproductionPrompt: extras?.reproductionPrompt || "",
    generatedCode: extras?.generatedCode || "",
    tags: extras?.tags && extras.tags.length > 0 ? extras.tags : defaultTags,
    notes: extras?.notes || "",
    favorite: extras?.favorite ?? false
  };
}

/**
 * Retrieves all saved components from local library storage.
 */
export async function getLibraryItems(): Promise<LibraryItem[]> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get(STORAGE_KEY_LIBRARY);
    return (res[STORAGE_KEY_LIBRARY] as LibraryItem[]) || [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Checks whether an element is already in the library based on URL and HTML signature.
 */
export async function isElementInLibrary(url: string, cleanHtml: string): Promise<LibraryItem | null> {
  const items = await getLibraryItems();
  const match = items.find((it) => it.url === url && it.cleanHtml === cleanHtml);
  return match || null;
}

/**
 * Saves or updates a component in the library.
 */
export async function saveLibraryItem(item: LibraryItem): Promise<LibraryItem[]> {
  const current = await getLibraryItems();
  const existingIdx = current.findIndex(
    (it) => it.id === item.id || (it.url === item.url && it.cleanHtml === item.cleanHtml)
  );

  let updated: LibraryItem[];
  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const merged: LibraryItem = {
      ...existing,
      ...item,
      id: existing.id,
      timestamp: Date.now(),
      favorite: item.favorite !== undefined ? item.favorite : existing.favorite,
      tags: Array.from(new Set([...(existing.tags || []), ...(item.tags || [])]))
    };
    updated = [merged, ...current.filter((_, idx) => idx !== existingIdx)];
  } else {
    updated = [item, ...current];
  }

  // Also sync with recent captures so history is preserved
  await saveRecentCapture({
    id: item.id,
    timestamp: item.timestamp,
    url: item.url,
    title: item.name || item.pageTitle,
    tagName: item.tagName,
    dimensions: item.dimensions,
    summary: item.summary,
    cleanHtml: item.cleanHtml,
    reproductionPrompt: item.reproductionPrompt || item.generatedCode || ""
  });

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_LIBRARY]: updated });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Deletes a component from the library by ID.
 */
export async function deleteLibraryItem(id: string): Promise<LibraryItem[]> {
  const current = await getLibraryItems();
  const updated = current.filter((it) => it.id !== id);
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_LIBRARY]: updated });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Updates partial properties of an existing library item.
 */
export async function updateLibraryItem(id: string, updates: Partial<LibraryItem>): Promise<LibraryItem[]> {
  const current = await getLibraryItems();
  const updated = current.map((it) => (it.id === id ? { ...it, ...updates } : it));
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY_LIBRARY]: updated });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Toggles the favorite status of a library item.
 */
export async function toggleFavoriteLibraryItem(id: string): Promise<LibraryItem[]> {
  const current = await getLibraryItems();
  const item = current.find((it) => it.id === id);
  if (!item) return current;
  return updateLibraryItem(id, { favorite: !item.favorite });
}

/**
 * Clears all items in the library.
 */
export async function clearLibrary(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove(STORAGE_KEY_LIBRARY);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY_LIBRARY);
    } catch {}
  }
}

/**
 * Exports the entire library as a structured JSON string.
 */
export async function exportLibraryJson(): Promise<string> {
  const items = await getLibraryItems();
  return JSON.stringify(
    {
      copage: "library",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items
    },
    null,
    2
  );
}

/**
 * Imports components from a JSON string into the library.
 */
export async function importLibraryJson(jsonStr: string): Promise<{ added: number; total: number }> {
  try {
    const data = JSON.parse(jsonStr);
    const items: LibraryItem[] = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items)) {
      throw new Error("Invalid library format: expected an array of items");
    }

    const current = await getLibraryItems();
    const existingIds = new Set(current.map((i) => i.id));
    const validNewItems = items.filter((it) => it && it.tagName && it.cleanHtml);

    let added = 0;
    const merged = [...current];

    for (const item of validNewItems) {
      if (!item.id || existingIds.has(item.id)) {
        item.id = `lib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      existingIds.add(item.id);
      merged.unshift(item);
      added++;
    }

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [STORAGE_KEY_LIBRARY]: merged });
    } else {
      try {
        localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(merged));
      } catch {}
    }

    return { added, total: merged.length };
  } catch (err) {
    throw new Error("Failed to import library: " + (err instanceof Error ? err.message : String(err)));
  }
}

