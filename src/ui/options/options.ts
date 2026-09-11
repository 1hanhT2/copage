import {
  getLLMConfig,
  setLLMConfig,
  RECOMMENDED_MODELS,
  getUserPreferences,
  setUserPreferences,
  getRecentCaptures,
  clearRecentCaptures
} from "../../lib/storage";
import { testConnection } from "../../llm/gateway";
import type { LLMProvider, UserPreferences, RecentCapture } from "../../lib/types";
import {
  getM3ShapeSvg,
  getCanonicalM3ShapeSvg,
  getProviderShape,
  getCanonicalModelShape,
  getModelPillShapeClass,
  getElementM3Shape
} from "../../lib/shapes";
import { setupDynamicFavicon } from "../../lib/favicon";

document.addEventListener("DOMContentLoaded", async () => {
  setupDynamicFavicon();

  // Tabs
  const tabButtons = document.querySelectorAll<HTMLButtonElement>(".m3-tab");
  const tabPanels = document.querySelectorAll<HTMLElement>(".m3-tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;
      tabButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const targetPanel = document.getElementById(`tab-${targetTab}`);
      if (targetPanel) targetPanel.classList.add("active");

      if (targetTab === "history") {
        renderHistory();
      }
    });
  });

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
    if (lower.includes("google") || lower.includes("gemini")) return "card-shape-gemini";
    if (lower.includes("deepseek")) return "card-shape-deepseek";
    if (lower.includes("qwen")) return "card-shape-qwen";
    if (lower.includes("meta") || lower.includes("llama")) return "card-shape-llama";
    if (lower.includes("anthropic") || lower.includes("claude")) return "card-shape-claude";
    return "card-shape-gemini";
  }

  // Render Preset Cards with M3 Expressive Watermark and Silhouette Badges
  function renderPresets() {
    modelPresetsContainer.innerHTML = "";
    RECOMMENDED_MODELS.forEach((preset) => {
      const isSelected = customModelInput.value === preset.id;
      const shapeName = getCanonicalModelShape(preset.id);
      const watermarkSvg = getCanonicalM3ShapeSvg(shapeName, 90, "currentColor");
      const shapeSvg = getCanonicalM3ShapeSvg(shapeName, 16, "currentColor");
      const card = document.createElement("div");
      card.className = `m3-action-card ${getModelCardShapeClass(preset.id)} ${isSelected ? "selected" : ""}`;
      card.innerHTML = `
        <div class="m3-action-card-watermark">${watermarkSvg}</div>
        <div class="m3-card-top" style="position: relative; z-index: 1;">
          <div class="m3-card-name">${preset.name}</div>
          <div class="m3-card-badge">${shapeSvg}</div>
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

  // Model Dropdown Menu with M3 Shapes
  function renderModelDropdown() {
    modelDropdownMenu.innerHTML = "";
    RECOMMENDED_MODELS.forEach((preset) => {
      const isSelected = customModelInput.value === preset.id;
      const shapeName = getCanonicalModelShape(preset.id);
      const shapeSvg = getCanonicalM3ShapeSvg(shapeName, 16, "var(--m3-primary)");
      const item = document.createElement("div");
      item.className = `m3-menu-item ${isSelected ? "selected" : ""}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          ${shapeSvg}
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
    const activeShape = getCanonicalM3ShapeSvg(getCanonicalModelShape(customModelInput.value), 14, "currentColor");
    selectedModelText.innerHTML = activePreset
      ? `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${activePreset.name} (${activePreset.provider})</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${customModelInput.value}</span></span>`;
    modelDropdownTrigger.className = `m3-select-trigger ${getModelPillShapeClass(customModelInput.value)}`;
  }

  function selectModel(modelId: string, modelName: string) {
    customModelInput.value = modelId;
    const activePreset = RECOMMENDED_MODELS.find((m) => m.id === modelId);
    const activeShape = getCanonicalM3ShapeSvg(getCanonicalModelShape(modelId), 14, "currentColor");
    selectedModelText.innerHTML = activePreset
      ? `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${activePreset.name} (${activePreset.provider})</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${modelName}</span></span>`;
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

  let activeFramework = prefs.frameworkTarget || "react";
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

  // Tab 3: History renderer
  async function renderHistory() {
    const captures = await getRecentCaptures();
    if (captures.length === 0) {
      historyContainer.innerHTML = `
        <div class="m3-history-empty">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="rgba(255,255,255,0.25)" style="margin-bottom: 8px;">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <div>No elements captured yet. Inspect elements with <code>Alt+C</code> to populate history.</div>
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = "";
    captures.forEach((cap: RecentCapture) => {
      const card = document.createElement("div");
      card.className = "m3-history-card";
      const timeStr = new Date(cap.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const shapeName = getElementM3Shape(cap.tagName);
      const shapeSvg = getCanonicalM3ShapeSvg(shapeName, 13, "var(--m3-primary)");
      card.innerHTML = `
        <div class="m3-history-info">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="m3-history-shape" title="Element type: <${cap.tagName}>">${shapeSvg}</span>
            <span class="m3-history-tag">&lt;${cap.tagName}&gt;</span>
            <span style="font-size: 11px; color: var(--m3-text-secondary);">${cap.dimensions}</span>
            <span style="font-size: 10px; background: rgba(255,255,255,0.08); padding: 2px 7px; border-radius: 9999px; color: var(--m3-primary); font-weight: 500;">${timeStr}</span>
          </div>
          <div class="m3-history-meta">${cap.title || cap.url}</div>
        </div>
        <div class="m3-history-actions">
          <button class="m3-icon-btn copy-hist-btn" title="Copy Reproduction Prompt">
            ${getCanonicalM3ShapeSvg("diamond", 14, "currentColor")}
          </button>
        </div>
      `;

      const copyBtn = card.querySelector(".copy-hist-btn") as HTMLButtonElement;
      copyBtn?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(cap.reproductionPrompt || cap.cleanHtml);
        copyBtn.innerHTML = getCanonicalM3ShapeSvg("gem", 14, "#78dc77");
        setTimeout(() => {
          copyBtn.innerHTML = getCanonicalM3ShapeSvg("diamond", 14, "currentColor");
        }, 1500);
      });

      historyContainer.appendChild(card);
    });
  }

  clearHistoryBtn?.addEventListener("click", async () => {
    await clearRecentCaptures();
    renderHistory();
  });
});
