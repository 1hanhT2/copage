import { getLLMConfig, setLLMConfig, RECOMMENDED_MODELS, getUserPreferences, setUserPreferences } from "../../lib/storage";
import type { ExtensionMessage } from "../../lib/types";
import { getM3ShapeSvg, getProviderShape } from "../../lib/shapes";

document.addEventListener("DOMContentLoaded", async () => {
  const activateBtn = document.getElementById("activate-btn") as HTMLButtonElement;
  const optionsLink = document.getElementById("open-options-link");
  const optionsFooterLink = document.getElementById("options-footer-link");
  const statProvider = document.getElementById("stat-provider");
  const statKey = document.getElementById("stat-key");

  const modelTrigger = document.getElementById("popup-model-trigger") as HTMLElement;
  const modelMenu = document.getElementById("popup-model-menu") as HTMLElement;
  const selectedModelLabel = document.getElementById("popup-selected-model") as HTMLElement;
  const switchShadow = document.getElementById("popup-switch-shadow") as HTMLInputElement;

  // Load configuration
  const config = await getLLMConfig();
  const prefs = await getUserPreferences();

  if (statProvider) statProvider.textContent = config.provider === "openrouter" ? "OpenRouter" : "Custom OpenAI";

  if (statKey) {
    if (config.apiKey || config.provider === "openai-compatible") {
      statKey.innerHTML = `<span class="status-dot dot-green"></span>Ready`;
    } else {
      statKey.innerHTML = `<span class="status-dot dot-amber"></span>Missing Key`;
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
      const shapeSvg = getM3ShapeSvg(getProviderShape(preset.id), 14, "#a8c7fa");
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

      item.addEventListener("click", async () => {
        config.model = preset.id;
        await setLLMConfig({ model: preset.id });
        const newShape = getM3ShapeSvg(getProviderShape(preset.id), 14, "#a8c7fa");
        selectedModelLabel.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;">${newShape} <span>${preset.name}</span></span>`;
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
    const activeShape = getM3ShapeSvg(getProviderShape(config.model), 14, "#a8c7fa");
    selectedModelLabel.innerHTML = activePreset
      ? `<span style="display:inline-flex; align-items:center; gap:6px;">${activeShape} <span>${activePreset.name}</span></span>`
      : `<span style="display:inline-flex; align-items:center; gap:6px;">${activeShape} <span>${config.model.split("/").pop() || config.model}</span></span>`;
  }

  function openDropdown() {
    modelTrigger.classList.add("open");
    modelTrigger.setAttribute("aria-expanded", "true");
    modelMenu.classList.add("open");
  }

  function closeDropdown() {
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
    activateBtn.textContent = "Unavailable on this page";
    activateBtn.style.opacity = "0.5";
    activateBtn.style.cursor = "not-allowed";
  }

  // Activate Inspector button with automatic injection fallback
  activateBtn?.addEventListener("click", async () => {
    if (isRestricted) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || typeof tab.id !== "number") return;
    const tabId = tab.id;

    activateBtn.textContent = "Activating...";

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
        activateBtn.textContent = "Cannot inspect this page";
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
