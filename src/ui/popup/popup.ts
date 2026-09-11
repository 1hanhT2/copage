import { getLLMConfig } from "../../lib/storage";
import type { ExtensionMessage } from "../../lib/types";

document.addEventListener("DOMContentLoaded", async () => {
  const activateBtn = document.getElementById("activate-btn") as HTMLButtonElement;
  const optionsLink = document.getElementById("open-options-link");
  const optionsFooterLink = document.getElementById("options-footer-link");
  const statProvider = document.getElementById("stat-provider");
  const statModel = document.getElementById("stat-model");
  const statKey = document.getElementById("stat-key");

  // Load configuration
  const config = await getLLMConfig();
  if (statProvider) statProvider.textContent = config.provider === "openrouter" ? "OpenRouter" : "Custom OpenAI";
  if (statModel) statModel.textContent = config.model.split("/").pop() || config.model;

  if (statKey) {
    if (config.apiKey || config.provider === "openai-compatible") {
      statKey.innerHTML = `<span class="status-dot dot-green"></span>Ready`;
    } else {
      statKey.innerHTML = `<span class="status-dot dot-amber"></span>Missing Key`;
    }
  }

  // Activate Inspector button with automatic injection fallback
  activateBtn?.addEventListener("click", async () => {
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
          target: { tabId },
          files: ["content.js"]
        });
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
          } catch {}
          window.close();
        }, 60);
      } catch (err) {
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
