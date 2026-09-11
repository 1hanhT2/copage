import { getLLMConfig, setLLMConfig, RECOMMENDED_MODELS, getUserPreferences, setUserPreferences } from "../../lib/storage";
import type { ExtensionMessage } from "../../lib/types";
import {
  getM3ShapeSvg,
  getCanonicalM3ShapeSvg,
  getProviderShape,
  getCanonicalModelShape,
  getModelPillShapeClass
} from "../../lib/shapes";
import { setupDynamicFavicon } from "../../lib/favicon";

document.addEventListener("DOMContentLoaded", async () => {
  setupDynamicFavicon();
  const activateBtn = document.getElementById("activate-btn") as HTMLButtonElement;
  const activateIcon = document.getElementById("activate-icon") as HTMLElement;
  const activateBtnText = document.getElementById("activate-btn-text") as HTMLElement;
  const optionsLink = document.getElementById("open-options-link");
  const optionsFooterLink = document.getElementById("options-footer-link");
  const statProvider = document.getElementById("stat-provider");
  const statKey = document.getElementById("stat-key");
  const cardWatermark = document.getElementById("popup-card-watermark");

  const modelTrigger = document.getElementById("popup-model-trigger") as HTMLElement;
  const modelMenu = document.getElementById("popup-model-menu") as HTMLElement;
  const selectedModelLabel = document.getElementById("popup-selected-model") as HTMLElement;
  const switchShadow = document.getElementById("popup-switch-shadow") as HTMLInputElement;

  // Load configuration
  const config = await getLLMConfig();
  const prefs = await getUserPreferences();

  // Set action button icon
  if (activateIcon) {
    activateIcon.innerHTML = getCanonicalM3ShapeSvg("burst", 16, "currentColor");
  }

  // Set watermark shape for active model
  if (cardWatermark) {
    cardWatermark.innerHTML = getCanonicalM3ShapeSvg(getCanonicalModelShape(config.model), 130, "currentColor");
  }

  if (statProvider) statProvider.textContent = config.provider === "openrouter" ? "OpenRouter" : "Custom OpenAI";

  if (statKey) {
    if (config.apiKey || config.provider === "openai-compatible") {
      statKey.innerHTML = `<span class="m3-shape-beacon ready">${getCanonicalM3ShapeSvg("gem", 12, "currentColor")}</span><span>Ready</span>`;
    } else {
      statKey.innerHTML = `<span class="m3-shape-beacon warning">${getCanonicalM3ShapeSvg("diamond", 12, "currentColor")}</span><span>Missing Key</span>`;
    }
  }

  if (switchShadow) {
    switchShadow.checked = prefs.deepShadow;
    switchShadow.addEventListener("change", async () => {
      await setUserPreferences({ deepShadow: switchShadow.checked });
    });
  }

  // Populate & handle Model Dropdown Menu
  function renderModelMenu() {
    modelMenu.innerHTML = "";
    RECOMMENDED_MODELS.forEach((preset) => {
      const isSelected = config.model === preset.id;
      const shapeSvg = getCanonicalM3ShapeSvg(getCanonicalModelShape(preset.id), 15, "var(--m3-primary)");
      const item = document.createElement("div");
      item.className = `m3-menu-item ${isSelected ? "selected" : ""}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          ${shapeSvg}
          <div class="m3-menu-item-text">
            <span class="m3-menu-item-title">${preset.name}</span>
            <span class="m3-menu-item-desc">${preset.speed} • ${preset.cost}</span>
          </div>
        </div>
        <svg class="m3-menu-item-check" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;

      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        config.model = preset.id;
        await setLLMConfig({ model: preset.id });
        const newShape = getCanonicalM3ShapeSvg(getCanonicalModelShape(preset.id), 14, "currentColor");
        selectedModelLabel.innerHTML = `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${newShape}</span> <span>${preset.name}</span></span>`;
        modelTrigger.className = `m3-select-trigger ${getModelPillShapeClass(preset.id)}`;
        if (cardWatermark) {
          cardWatermark.innerHTML = getCanonicalM3ShapeSvg(getCanonicalModelShape(preset.id), 130, "currentColor");
        }
        document.querySelectorAll("#popup-model-menu .m3-menu-item").forEach((it) => {
          it.classList.remove("selected");
          it.setAttribute("aria-selected", "false");
        });
        item.classList.add("selected");
        item.setAttribute("aria-selected", "true");
        closeDropdown();
      });

      modelMenu.appendChild(item);
    });

    const activePreset = RECOMMENDED_MODELS.find((m) => m.id === config.model);
    const activeShape = getCanonicalM3ShapeSvg(getCanonicalModelShape(config.model), 14, "currentColor");
    selectedModelLabel.innerHTML = activePreset
      ? `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${activePreset.name}</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:8px;"><span class="m3-shape-well">${activeShape}</span> <span>${config.model.split("/").pop() || config.model}</span></span>`;
    modelTrigger.className = `m3-select-trigger ${getModelPillShapeClass(config.model)}`;
  }

  const modelWrapper = document.getElementById("popup-model-wrapper");

  function openDropdown() {
    modelWrapper?.classList.add("open");
    modelTrigger.classList.add("open");
    modelTrigger.setAttribute("aria-expanded", "true");
    modelMenu.classList.add("open");
  }

  function closeDropdown() {
    modelWrapper?.classList.remove("open");
    modelTrigger.classList.remove("open");
    modelTrigger.setAttribute("aria-expanded", "false");
    modelMenu.classList.remove("open");
  }

  modelTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (modelMenu.classList.contains("open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  modelTrigger?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (modelMenu.classList.contains("open")) {
        closeDropdown();
      } else {
        openDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (!modelTrigger?.contains(e.target as Node) && !modelMenu?.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  renderModelMenu();

  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isRestricted = !currentTab?.url || !currentTab.url.startsWith("http");

  if (isRestricted && activateBtn) {
    activateBtn.disabled = true;
    if (activateBtnText) activateBtnText.textContent = "Unavailable on this page";
    activateBtn.style.opacity = "0.5";
    activateBtn.style.cursor = "not-allowed";
  }

  // Activate Inspector button with automatic injection fallback
  activateBtn?.addEventListener("click", async () => {
    if (isRestricted) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || typeof tab.id !== "number") return;
    const tabId = tab.id;

    if (activateIcon) {
      activateIcon.innerHTML = getCanonicalM3ShapeSvg("sunny", 16, "currentColor", "animation: spin 1s linear infinite;");
    }
    if (activateBtnText) {
      activateBtnText.textContent = "Activating...";
    }

    try {
      await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
      window.close();
    } catch {
      // Content script was not present in this tab; inject it dynamically
      try {
        await chrome.scripting.executeScript({
          target: { tabId, allFrames: false },
          files: ["content.js"]
        });
        await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
        window.close();
      } catch {
        if (activateBtnText) activateBtnText.textContent = "Cannot inspect this page";
        activateBtn.style.backgroundColor = "#982e3b";
      }
    }
  });

  const openOptions = (e: Event) => {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  };

  optionsLink?.addEventListener("click", openOptions);
  optionsFooterLink?.addEventListener("click", openOptions);
});
