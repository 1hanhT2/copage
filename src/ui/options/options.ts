import {
  getLLMConfig,
  setLLMConfig,
  RECOMMENDED_MODELS,
  getUserPreferences,
  setUserPreferences,
  getRecentCaptures,
  clearRecentCaptures,
  getLibraryItems,
  saveLibraryItem,
  deleteLibraryItem,
  updateLibraryItem,
  toggleFavoriteLibraryItem,
  clearLibrary,
  exportLibraryJson,
  importLibraryJson
} from "../../lib/storage";
import { testConnection } from "../../llm/gateway";
import type { LLMProvider, UserPreferences, RecentCapture, LibraryItem } from "../../lib/types";
import {
  getM3ShapeSvg,
  getCanonicalM3ShapeSvg,
  getProviderShape,
  getCanonicalModelShape,
  getModelPillShapeClass,
  getElementM3Shape
} from "../../lib/shapes";
import { getBrandIconSvg } from "../../lib/brand-icons";
import { setupDynamicFavicon } from "../../lib/favicon";

document.addEventListener("DOMContentLoaded", async () => {
  setupDynamicFavicon();

  // Tabs
  const tabButtons = document.querySelectorAll<HTMLButtonElement>(".m3-tab");
  const tabPanels = document.querySelectorAll<HTMLElement>(".m3-tab-panel");

  function activateTab(tabName: string) {
    tabButtons.forEach((b) => {
      const match = b.dataset.tab === tabName || (tabName === "library" && b.dataset.tab === "history");
      b.classList.toggle("active", match);
      b.setAttribute("aria-selected", match ? "true" : "false");
    });
    tabPanels.forEach((p) => {
      const match = p.id === `tab-${tabName}` || (tabName === "library" && (p.id === "tab-library" || p.id === "tab-history"));
      p.classList.toggle("active", match);
    });

    if (tabName === "library" || tabName === "history") {
      renderLibrary();
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab || "inference";
      activateTab(targetTab);
    });
  });

  if (window.location.hash === "#library" || window.location.hash === "#history") {
    activateTab("library");
  }

  // Tab 1: Inference & Provider Form Elements
  const providerToggleGroup = document.getElementById("provider-toggle-group") as HTMLElement;
  const providerSelectHidden = document.getElementById("provider-select") as HTMLInputElement;
  const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
  const toggleKeyBtn = document.getElementById("toggle-key-visibility") as HTMLButtonElement;
  const baseUrlInput = document.getElementById("base-url-input") as HTMLInputElement;
  const customModelInput = document.getElementById("custom-model-input") as HTMLInputElement;
  const modelPresetsContainer = document.getElementById("model-presets-container") as HTMLElement;
  const modelDropdownTrigger = document.getElementById("model-dropdown-trigger") as HTMLElement;
  const modelDropdownMenu = document.getElementById("model-dropdown-menu") as HTMLElement;
  const selectedModelText = document.getElementById("selected-model-text") as HTMLElement;

  const testBtn = document.getElementById("test-conn-btn") as HTMLButtonElement;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const testResultBox = document.getElementById("test-result-box") as HTMLElement;

  // Tab 2: Extraction Form Elements
  const frameworkToggleGroup = document.getElementById("framework-toggle-group") as HTMLElement;
  const switchPrune = document.getElementById("switch-prune") as HTMLInputElement;
  const switchTailwind = document.getElementById("switch-tailwind") as HTMLInputElement;
  const switchSvg = document.getElementById("switch-svg") as HTMLInputElement;
  const switchDeepShadow = document.getElementById("switch-deep-shadow") as HTMLInputElement;
  const switchAutoCopy = document.getElementById("switch-autocopy") as HTMLInputElement;
  const savePrefsBtn = document.getElementById("save-prefs-btn") as HTMLButtonElement;

  // Tab 3: History Elements
  const historyContainer = document.getElementById("history-container") as HTMLElement;
  const clearHistoryBtn = document.getElementById("clear-history-btn") as HTMLButtonElement;

  // Load existing config & preferences
  const config = await getLLMConfig();
  const prefs = await getUserPreferences();

  // Set initial Provider Segmented Buttons
  function setProviderUI(provider: LLMProvider) {
    providerSelectHidden.value = provider;
    providerToggleGroup.querySelectorAll(".m3-toggle-button").forEach((btn) => {
      const p = (btn as HTMLElement).dataset.provider;
      if (p === provider) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Inject actual brand SVG icons from thesvg into provider buttons
  const orBtn = providerToggleGroup?.querySelector('[data-provider="openrouter"]');
  const oaiBtn = providerToggleGroup?.querySelector('[data-provider="openai-compatible"]');
  if (orBtn) {
    const existingSvg = orBtn.querySelector("svg");
    if (existingSvg) existingSvg.outerHTML = getBrandIconSvg("openrouter", 15);
  }
  if (oaiBtn) {
    const existingSvg = oaiBtn.querySelector("svg");
    if (existingSvg) existingSvg.outerHTML = getBrandIconSvg("openai", 15);
  }

  setProviderUI(config.provider);

  providerToggleGroup.querySelectorAll(".m3-toggle-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = (btn as HTMLElement).dataset.provider as LLMProvider;
      setProviderUI(p);
      if (p === "openrouter") {
        baseUrlInput.value = "https://openrouter.ai/api/v1";
      } else {
        baseUrlInput.value = "http://localhost:11434/v1";
      }
    });
  });

  apiKeyInput.value = config.apiKey || "";
  baseUrlInput.value = config.baseUrl;
  customModelInput.value = config.model;

  // Toggle API Key visibility
  let isKeyVisible = false;
  toggleKeyBtn.addEventListener("click", () => {
    isKeyVisible = !isKeyVisible;
    apiKeyInput.type = isKeyVisible ? "text" : "password";
    toggleKeyBtn.innerHTML = isKeyVisible
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
  });

  // Render Preset Cards with M3 Expressive Watermark and Silhouette Badges
  function getModelCardShapeClass(modelId: string): string {
    const lower = modelId.toLowerCase();
    if (lower.includes("gemma")) return "card-shape-gemma";
    if (lower.includes("poolside") || lower.includes("laguna")) return "card-shape-poolside";
    if (lower.includes("thinking") || lower.includes("inkling")) return "card-shape-thinking";
    if (lower.includes("nemotron") || lower.includes("nvidia")) return "card-shape-nemotron";
    if (lower.includes("google") || lower.includes("gemini")) return "card-shape-gemini";
    if (lower.includes("deepseek")) return "card-shape-deepseek";
    if (lower.includes("qwen")) return "card-shape-qwen";
    if (lower.includes("meta") || lower.includes("llama")) return "card-shape-llama";
    if (lower.includes("anthropic") || lower.includes("claude")) return "card-shape-claude";
    return "card-shape-gemma";
  }

  // Render Preset Cards with M3 Expressive Watermark and Silhouette Badges
  function renderPresets() {
    modelPresetsContainer.innerHTML = "";
    RECOMMENDED_MODELS.forEach((preset) => {
      const isSelected = customModelInput.value === preset.id;
      const shapeName = getCanonicalModelShape(preset.id);
      const watermarkSvg = getCanonicalM3ShapeSvg(shapeName, 90, "currentColor");
      const brandIcon = getBrandIconSvg(preset.id, 20);
      const card = document.createElement("div");
      card.className = `m3-action-card ${getModelCardShapeClass(preset.id)} ${isSelected ? "selected" : ""}`;
      card.innerHTML = `
        <div class="m3-action-card-watermark">${watermarkSvg}</div>
        <div class="m3-card-top" style="position: relative; z-index: 1;">
          <div class="m3-card-name">${preset.name}</div>
          <div class="m3-card-badge">${brandIcon}</div>
        </div>
        <div class="m3-card-meta" style="position: relative; z-index: 1;">
          <span class="m3-card-tag">${preset.provider}</span>
          <span>${preset.speed} • ${preset.cost}</span>
        </div>
      `;
      card.addEventListener("click", () => {
        selectModel(preset.id, preset.name);
      });
      modelPresetsContainer.appendChild(card);
    });
  }

  // Model Dropdown Menu with M3 Shapes & thesvg Brand Icons
  function renderModelDropdown() {
    modelDropdownMenu.innerHTML = "";
    RECOMMENDED_MODELS.forEach((preset) => {
      const isSelected = customModelInput.value === preset.id;
      const brandIcon = getBrandIconSvg(preset.id, 18);
      const item = document.createElement("div");
      item.className = `m3-menu-item ${isSelected ? "selected" : ""}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          ${brandIcon}
          <div class="m3-menu-item-text">
            <span class="m3-menu-item-title">${preset.name}</span>
            <span class="m3-menu-item-desc">${preset.provider} • ${preset.speed} • ${preset.cost}</span>
          </div>
        </div>
        <svg class="m3-menu-item-check" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
      item.addEventListener("click", () => {
        selectModel(preset.id, preset.name);
        closeDropdown();
      });
      modelDropdownMenu.appendChild(item);
    });

    const activePreset = RECOMMENDED_MODELS.find((m) => m.id === customModelInput.value);
    const activeBrandIcon = getBrandIconSvg(customModelInput.value, 16);
    selectedModelText.innerHTML = activePreset
      ? `<span style="display:inline-flex; align-items:center; gap:8px;">${activeBrandIcon} <span>${activePreset.name} (${activePreset.provider})</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:8px;">${activeBrandIcon} <span>${customModelInput.value}</span></span>`;
    modelDropdownTrigger.className = `m3-select-trigger ${getModelPillShapeClass(customModelInput.value)}`;
  }

  function selectModel(modelId: string, modelName: string) {
    customModelInput.value = modelId;
    const activePreset = RECOMMENDED_MODELS.find((m) => m.id === modelId);
    const activeBrandIcon = getBrandIconSvg(modelId, 16);
    selectedModelText.innerHTML = activePreset
      ? `<span style="display:inline-flex; align-items:center; gap:8px;">${activeBrandIcon} <span>${activePreset.name} (${activePreset.provider})</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:8px;">${activeBrandIcon} <span>${modelName}</span></span>`;
    modelDropdownTrigger.className = `m3-select-trigger ${getModelPillShapeClass(modelId)}`;
    document.querySelectorAll(".m3-action-card").forEach((c) => c.classList.remove("selected"));
    document.querySelectorAll(".m3-menu-item").forEach((item) => {
      const isMatch = item.querySelector(".m3-menu-item-title")?.textContent === modelName;
      item.classList.toggle("selected", isMatch);
      item.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
    renderPresets();
  }

  const optionsModelWrapper = document.getElementById("options-model-wrapper");

  function openDropdown() {
    optionsModelWrapper?.classList.add("open");
    modelDropdownTrigger.classList.add("open");
    modelDropdownTrigger.setAttribute("aria-expanded", "true");
    modelDropdownMenu.classList.add("open");
  }

  function closeDropdown() {
    optionsModelWrapper?.classList.remove("open");
    modelDropdownTrigger.classList.remove("open");
    modelDropdownTrigger.setAttribute("aria-expanded", "false");
    modelDropdownMenu.classList.remove("open");
  }

  modelDropdownTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (modelDropdownMenu.classList.contains("open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  modelDropdownTrigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (modelDropdownMenu.classList.contains("open")) {
        closeDropdown();
      } else {
        openDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!modelDropdownTrigger.contains(e.target as Node) && !modelDropdownMenu.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  customModelInput.addEventListener("input", () => {
    const matched = RECOMMENDED_MODELS.find((m) => m.id === customModelInput.value);
    const activeShape = getCanonicalM3ShapeSvg(getCanonicalModelShape(customModelInput.value), 14, "currentColor");
    selectedModelText.innerHTML = matched
      ? `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${matched.name} (${matched.provider})</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${customModelInput.value}</span></span>`;
    document.querySelectorAll(".m3-action-card").forEach((c) => {
      const name = c.querySelector(".m3-card-name")?.textContent;
      c.classList.toggle("selected", matched ? name === matched.name : false);
    });
  });

  renderPresets();
  renderModelDropdown();

  // Test Connection
  testBtn.addEventListener("click", async () => {
    testBtn.disabled = true;
    testBtn.classList.add("testing");
    testBtn.innerHTML = `
      <span class="m3-shape-beacon" style="display: inline-flex; animation: spin 1s linear infinite;">
        ${getCanonicalM3ShapeSvg("very-sunny", 16, "currentColor")}
      </span>
      <span>Testing...</span>
    `;
    testResultBox.className = "m3-alert";
    testResultBox.textContent = "Connecting to inference endpoint...";
    testResultBox.style.display = "flex";

    const currentTestConfig = {
      provider: providerSelectHidden.value as LLMProvider,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: customModelInput.value.trim()
    };

    try {
      const res = await testConnection(currentTestConfig);
      testBtn.classList.remove("testing");
      testBtn.disabled = false;
      testBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        <span>Test Connection</span>
      `;

      if (res.success) {
        testResultBox.className = "m3-alert m3-alert-success";
        testResultBox.innerHTML = `
          <span class="m3-shape-beacon ready">
            ${getCanonicalM3ShapeSvg("gem", 18, "#78dc77")}
          </span>
          <span>${res.message}</span>
        `;
      } else {
        testResultBox.className = "m3-alert m3-alert-error";
        testResultBox.innerHTML = `
          <span class="m3-shape-beacon warning">
            ${getCanonicalM3ShapeSvg("boom", 18, "#ffb4ab")}
          </span>
          <span>${res.message}</span>
        `;
      }
    } catch {
      testBtn.classList.remove("testing");
      testBtn.disabled = false;
    }
  });

  // Save Settings
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Saving...</span>`;

    await setLLMConfig({
      provider: providerSelectHidden.value as LLMProvider,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: customModelInput.value.trim()
    });

    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <span>Saved!</span>
    `;
    saveBtn.style.backgroundColor = "#78dc77";
    saveBtn.style.color = "#062e6f";
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        <span>Save Settings</span>
      `;
      saveBtn.style.backgroundColor = "";
      saveBtn.style.color = "";
    }, 1600);
  });

  // Tab 2: Initialize Preferences
  switchPrune.checked = prefs.pruneNoise;
  switchTailwind.checked = prefs.mapTailwind;
  switchSvg.checked = prefs.extractSvgs;
  switchDeepShadow.checked = prefs.deepShadow;
  switchAutoCopy.checked = prefs.autoCopy;
  const switchAutoLibrary = document.getElementById("switch-auto-library") as HTMLInputElement;
  if (switchAutoLibrary) {
    switchAutoLibrary.checked = !!prefs.autoSaveToLibrary;
  }

  let activeFramework = prefs.frameworkTarget || "react";
  const reactFwBtn = frameworkToggleGroup?.querySelector('[data-framework="react"]');
  const vueFwBtn = frameworkToggleGroup?.querySelector('[data-framework="vue"]');
  const svelteFwBtn = frameworkToggleGroup?.querySelector('[data-framework="svelte"]');
  const htmlFwBtn = frameworkToggleGroup?.querySelector('[data-framework="html"]');

  if (reactFwBtn) {
    const existingSvg = reactFwBtn.querySelector("svg");
    if (existingSvg) {
      existingSvg.outerHTML = `<span style="display:inline-flex; align-items:center; gap:3px;">${getBrandIconSvg("react", 13)}${getBrandIconSvg("tailwind", 13)}</span>`;
    }
  }
  if (vueFwBtn) {
    const existingSvg = vueFwBtn.querySelector("svg");
    if (existingSvg) existingSvg.outerHTML = getBrandIconSvg("vue", 13);
  }
  if (svelteFwBtn) {
    const existingSvg = svelteFwBtn.querySelector("svg");
    if (existingSvg) existingSvg.outerHTML = getBrandIconSvg("svelte", 13);
  }
  if (htmlFwBtn) {
    const existingSvg = htmlFwBtn.querySelector("svg");
    if (existingSvg) existingSvg.outerHTML = getBrandIconSvg("html", 13);
  }

  frameworkToggleGroup.querySelectorAll(".m3-toggle-button").forEach((btn) => {
    const fw = (btn as HTMLElement).dataset.framework;
    btn.classList.toggle("active", fw === activeFramework);
    btn.addEventListener("click", () => {
      activeFramework = fw as UserPreferences["frameworkTarget"];
      frameworkToggleGroup.querySelectorAll(".m3-toggle-button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  savePrefsBtn.addEventListener("click", async () => {
    savePrefsBtn.disabled = true;
    await setUserPreferences({
      pruneNoise: switchPrune.checked,
      mapTailwind: switchTailwind.checked,
      extractSvgs: switchSvg.checked,
      deepShadow: switchDeepShadow.checked,
      autoCopy: switchAutoCopy.checked,
      autoSaveToLibrary: switchAutoLibrary ? switchAutoLibrary.checked : false,
      frameworkTarget: activeFramework
    });

    savePrefsBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      <span>Preferences Saved!</span>
    `;
    savePrefsBtn.style.backgroundColor = "#78dc77";
    savePrefsBtn.style.color = "#062e6f";
    setTimeout(() => {
      savePrefsBtn.disabled = false;
      savePrefsBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        <span>Save Preferences</span>
      `;
      savePrefsBtn.style.backgroundColor = "";
      savePrefsBtn.style.color = "";
    }, 1600);
  });

  // Tab 3: Component Library State & Elements
  let searchQuery = "";
  let activeTagFilter = "all";
  let activeSort = "newest";

  const libraryContainer = (document.getElementById("library-container") || document.getElementById("history-container")) as HTMLElement;
  const libraryTabCount = document.getElementById("library-tab-count") as HTMLElement;
  const librarySearchInput = document.getElementById("library-search-input") as HTMLInputElement;
  const librarySortSelect = document.getElementById("library-sort-select") as HTMLSelectElement;
  const libraryTagFilters = document.getElementById("library-tag-filters") as HTMLElement;
  const exportLibraryBtn = document.getElementById("export-library-btn") as HTMLButtonElement;
  const importLibraryBtn = document.getElementById("import-library-btn") as HTMLButtonElement;
  const importFileInput = document.getElementById("library-import-file") as HTMLInputElement;
  const clearLibraryBtn = (document.getElementById("clear-library-btn") || document.getElementById("clear-history-btn")) as HTMLButtonElement;

  function copyTextToClipboard(text: string, button?: HTMLElement, successLabel?: string) {
    navigator.clipboard.writeText(text).then(() => {
      if (button && successLabel) {
        const originalHtml = button.innerHTML;
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="#78dc77">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span style="color: #78dc77;">${successLabel}</span>
        `;
        setTimeout(() => {
          button.innerHTML = originalHtml;
        }, 1500);
      }
    });
  }

  async function updateTabBadge() {
    const items = await getLibraryItems();
    if (libraryTabCount) {
      libraryTabCount.textContent = String(items.length);
      libraryTabCount.style.display = items.length > 0 ? "inline-block" : "none";
    }
  }

  // Initial tab count badge sync
  updateTabBadge();

  // Component Library Renderer
  async function renderLibrary() {
    await updateTabBadge();
    const allItems = await getLibraryItems();

    if (allItems.length === 0) {
      if (libraryContainer) {
        libraryContainer.innerHTML = `
          <div class="m3-history-empty">
            <div style="display: flex; justify-content: center; margin-bottom: 14px;">
              <div class="m3-lib-shape-badge" style="width: 44px; height: 44px;">
                ${getCanonicalM3ShapeSvg("gem", 22, "#a8c7fa")}
              </div>
            </div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--m3-text-primary);">
              Your Component Library is Empty
            </div>
            <p style="max-width: 440px; margin: 0 auto; line-height: 1.5; color: var(--m3-text-secondary); font-size: 12px;">
              Inspect elements on any webpage using <kbd>Alt + C</kbd>, then click <strong>"Save to Library"</strong> in the floating inspection dock.
            </p>
          </div>
        `;
      }
      if (libraryTagFilters) libraryTagFilters.innerHTML = "";
      return;
    }

    // Collect all tags across library items
    const tagSet = new Set<string>();
    allItems.forEach((it) => {
      (it.tags || []).forEach((t) => tagSet.add(t));
    });

    // Render tag filter chips
    if (libraryTagFilters) {
      libraryTagFilters.innerHTML = "";

      const createTagChip = (label: string, value: string) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `m3-tag-filter-chip ${activeTagFilter === value ? "active" : ""}`;
        chip.textContent = label;
        chip.addEventListener("click", () => {
          activeTagFilter = value;
          renderLibrary();
        });
        return chip;
      };

      libraryTagFilters.appendChild(createTagChip(`All (${allItems.length})`, "all"));
      const favCount = allItems.filter((it) => it.favorite).length;
      if (favCount > 0) {
        libraryTagFilters.appendChild(createTagChip(`Favorites (${favCount})`, "favorites"));
      }

      Array.from(tagSet).sort().forEach((tag) => {
        const count = allItems.filter((it) => it.tags && it.tags.includes(tag)).length;
        libraryTagFilters.appendChild(createTagChip(`${tag} (${count})`, tag));
      });
    }

    // Filter items
    const filtered = allItems.filter((item) => {
      if (activeTagFilter === "favorites") {
        if (!item.favorite) return false;
      } else if (activeTagFilter !== "all") {
        if (!item.tags || !item.tags.includes(activeTagFilter)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || "").toLowerCase().includes(q);
        const matchesTag = (item.tagName || "").toLowerCase().includes(q);
        const matchesClass = (item.classList || []).some((c) => c.toLowerCase().includes(q));
        const matchesUrl = (item.url || "").toLowerCase().includes(q) || (item.pageTitle || "").toLowerCase().includes(q);
        const matchesNotes = (item.notes || "").toLowerCase().includes(q);
        const matchesHtml = (item.cleanHtml || "").toLowerCase().includes(q);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTag && !matchesClass && !matchesUrl && !matchesNotes && !matchesHtml && !matchesTags) {
          return false;
        }
      }

      return true;
    });

    // Sort items
    if (activeSort === "newest") {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (activeSort === "oldest") {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (activeSort === "name") {
      filtered.sort((a, b) => (a.name || a.tagName).localeCompare(b.name || b.tagName));
    } else if (activeSort === "favorites") {
      filtered.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || b.timestamp - a.timestamp);
    }

    if (filtered.length === 0) {
      if (libraryContainer) {
        libraryContainer.innerHTML = `
          <div class="m3-history-empty">
            <div style="color: var(--m3-text-secondary); font-size: 13px;">No components match your search and filter criteria.</div>
          </div>
        `;
      }
      return;
    }

    if (libraryContainer) {
      libraryContainer.innerHTML = "";

      filtered.forEach((item) => {
        const card = document.createElement("div");
        card.className = `m3-lib-card ${item.favorite ? "favorite" : ""}`;

        const timeStr = new Date(item.timestamp).toLocaleDateString([], {
          month: "short",
          day: "numeric"
        }) + " • " + new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const shapeName = getElementM3Shape(item.tagName);
        const shapeSvg = getCanonicalM3ShapeSvg(shapeName, 16, "var(--m3-primary)");

        const starSvg = item.favorite
          ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="#ffdf99"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
          : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>`;

        const tagsHtml = (item.tags || [])
          .map(
            (t) => `
            <span class="m3-badge-pill" data-tag="${t}">
              <span>${t}</span>
              <button class="tag-remove-btn" title="Remove tag">&times;</button>
            </span>
          `
          )
          .join("");

        card.innerHTML = `
          <div class="m3-lib-header-row">
            <div class="m3-lib-title-group">
              <span class="m3-lib-shape-badge" title="Element type: <${item.tagName}>">${shapeSvg}</span>
              <input type="text" class="m3-lib-title-edit" value="${item.name || item.tagName}" title="Click to rename component" />
              <span class="m3-lib-tag-chip">&lt;${item.tagName}&gt;</span>
              <span class="m3-lib-dim-chip">${item.dimensions}</span>
            </div>
            <div class="m3-lib-controls">
              <span class="m3-lib-date">${timeStr}</span>
              <button class="m3-icon-btn m3-star-btn ${item.favorite ? "favorited" : ""}" title="${item.favorite ? "Unfavorite" : "Mark as favorite"}">
                ${starSvg}
              </button>
              <button class="m3-icon-btn m3-del-btn" title="Delete from library">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="m3-lib-source-row">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="m3-lib-link" title="${item.url}">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
              </svg>
              <span>${item.pageTitle || item.url}</span>
            </a>
            <div class="m3-lib-tags-list">
              ${tagsHtml}
              <button class="m3-add-tag-btn" title="Add tag">+ Tag</button>
            </div>
          </div>

          <div class="m3-lib-notes-row">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="rgba(255,255,255,0.4)" style="flex-shrink:0;">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <input type="text" class="m3-lib-notes-input" placeholder="+ Add a note..." value="${item.notes || ""}" />
          </div>

          <div class="m3-lib-actions-row">
            <div class="m3-lib-button-group">
              <button class="m3-lib-btn primary copy-code-btn" title="Copy code snippet">
                ${item.generatedCode ? getBrandIconSvg("react", 12) : getCanonicalM3ShapeSvg("gem", 12, "currentColor")}
                <span>${item.generatedCode ? "Copy React TSX" : "Copy Prompt"}</span>
              </button>
              <button class="m3-lib-btn copy-html-btn" title="Copy clean sanitized HTML">
                ${getBrandIconSvg("html", 12)}
                <span>HTML</span>
              </button>
              <button class="m3-lib-btn copy-tw-btn" title="Copy mapped Tailwind utilities">
                ${getBrandIconSvg("tailwind", 12)}
                <span>Tailwind</span>
              </button>
              <button class="m3-lib-btn copy-css-btn" title="Copy computed CSS styles">
                ${getCanonicalM3ShapeSvg("flower", 12, "currentColor")}
                <span>CSS</span>
              </button>
            </div>
            <button class="m3-lib-btn toggle-drawer-btn" title="Inspect clean HTML and code details">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3 3-3-3z"/>
              </svg>
              <span>Preview</span>
            </button>
          </div>

          <pre class="m3-lib-drawer">${item.generatedCode || item.cleanHtml}</pre>
        `;

        // Rename title
        const titleInput = card.querySelector(".m3-lib-title-edit") as HTMLInputElement;
        titleInput?.addEventListener("change", async () => {
          const newName = titleInput.value.trim() || item.tagName;
          await updateLibraryItem(item.id, { name: newName });
          item.name = newName;
        });

        // Notes
        const notesInput = card.querySelector(".m3-lib-notes-input") as HTMLInputElement;
        notesInput?.addEventListener("change", async () => {
          const newNotes = notesInput.value.trim();
          await updateLibraryItem(item.id, { notes: newNotes });
          item.notes = newNotes;
        });

        // Favorite toggle
        const starBtn = card.querySelector(".m3-star-btn") as HTMLButtonElement;
        starBtn?.addEventListener("click", async () => {
          const updated = await toggleFavoriteLibraryItem(item.id);
          const refreshed = updated.find((it) => it.id === item.id);
          if (refreshed) {
            item.favorite = refreshed.favorite;
          }
          renderLibrary();
        });

        // Delete item
        const delBtn = card.querySelector(".m3-del-btn") as HTMLButtonElement;
        delBtn?.addEventListener("click", async () => {
          await deleteLibraryItem(item.id);
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            renderLibrary();
          }, 180);
        });

        // Remove tag
        card.querySelectorAll(".tag-remove-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const pill = (e.currentTarget as HTMLElement).closest(".m3-badge-pill") as HTMLElement;
            const tag = pill?.dataset.tag;
            if (tag) {
              const nextTags = (item.tags || []).filter((t) => t !== tag);
              await updateLibraryItem(item.id, { tags: nextTags });
              item.tags = nextTags;
              renderLibrary();
            }
          });
        });

        // Add tag
        const addTagBtn = card.querySelector(".m3-add-tag-btn") as HTMLButtonElement;
        addTagBtn?.addEventListener("click", async () => {
          const newTag = prompt("Enter a tag for this component (e.g. Navigation, Hero, Modal):");
          if (newTag && newTag.trim()) {
            const formatted = newTag.trim().charAt(0).toUpperCase() + newTag.trim().slice(1);
            const nextTags = Array.from(new Set([...(item.tags || []), formatted]));
            await updateLibraryItem(item.id, { tags: nextTags });
            item.tags = nextTags;
            renderLibrary();
          }
        });

        // Copy Code / Prompt
        const copyCodeBtn = card.querySelector(".copy-code-btn") as HTMLElement;
        copyCodeBtn?.addEventListener("click", () => {
          const text = item.generatedCode || item.reproductionPrompt || item.cleanHtml;
          copyTextToClipboard(text, copyCodeBtn, "Copied!");
        });

        // Copy HTML
        const copyHtmlBtn = card.querySelector(".copy-html-btn") as HTMLElement;
        copyHtmlBtn?.addEventListener("click", () => {
          copyTextToClipboard(item.cleanHtml, copyHtmlBtn, "HTML Copied!");
        });

        // Copy Tailwind
        const copyTwBtn = card.querySelector(".copy-tw-btn") as HTMLElement;
        copyTwBtn?.addEventListener("click", () => {
          const tw = item.tailwindClasses && item.tailwindClasses.length > 0
            ? item.tailwindClasses.join(" ")
            : "No tailwind classes mapped.";
          copyTextToClipboard(tw, copyTwBtn, "TW Copied!");
        });

        // Copy CSS
        const copyCssBtn = card.querySelector(".copy-css-btn") as HTMLElement;
        copyCssBtn?.addEventListener("click", () => {
          let css = "";
          if (item.distilledStyles) {
            css = Object.entries(item.distilledStyles)
              .map(([group, styles]) => `/* ${group} */\n` + Object.entries(styles).map(([k, v]) => `  ${k}: ${v};`).join("\n"))
              .join("\n\n");
          } else {
            css = "/* No computed styles recorded */";
          }
          copyTextToClipboard(css, copyCssBtn, "CSS Copied!");
        });

        // Toggle drawer
        const drawerBtn = card.querySelector(".toggle-drawer-btn") as HTMLElement;
        const drawer = card.querySelector(".m3-lib-drawer") as HTMLElement;
        drawerBtn?.addEventListener("click", () => {
          const isOpen = drawer.classList.toggle("open");
          drawerBtn.classList.toggle("active", isOpen);
        });

        libraryContainer.appendChild(card);
      });
    }
  }

  // Toolbar Event Listeners
  librarySearchInput?.addEventListener("input", () => {
    searchQuery = librarySearchInput.value;
    renderLibrary();
  });

  librarySortSelect?.addEventListener("change", () => {
    activeSort = librarySortSelect.value;
    renderLibrary();
  });

  exportLibraryBtn?.addEventListener("click", async () => {
    const jsonStr = await exportLibraryJson();
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `copage-library-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importLibraryBtn?.addEventListener("click", () => {
    if (importFileInput) {
      importFileInput.value = "";
      importFileInput.click();
    }
  });

  importFileInput?.addEventListener("change", async () => {
    const file = importFileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importLibraryJson(text);
      alert(`Successfully imported ${res.added} component(s) into your library.`);
      renderLibrary();
    } catch (err) {
      alert("Failed to import library: " + (err instanceof Error ? err.message : String(err)));
    }
  });

  clearLibraryBtn?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all saved components in your library? This action cannot be undone.")) {
      await clearLibrary();
      await clearRecentCaptures();
      renderLibrary();
    }
  });
});

