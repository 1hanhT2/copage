import { getLLMConfig, setLLMConfig, RECOMMENDED_MODELS } from "../../lib/storage";
import { testConnection } from "../../llm/gateway";
import type { LLMProvider } from "../../lib/types";

document.addEventListener("DOMContentLoaded", async () => {
  const providerSelect = document.getElementById("provider-select") as HTMLSelectElement;
  const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
  const baseUrlInput = document.getElementById("base-url-input") as HTMLInputElement;
  const customModelInput = document.getElementById("custom-model-input") as HTMLInputElement;
  const modelPresetsContainer = document.getElementById("model-presets-container") as HTMLElement;
  const testBtn = document.getElementById("test-conn-btn") as HTMLButtonElement;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const testResultBox = document.getElementById("test-result-box") as HTMLElement;

  // Load existing config
  const config = await getLLMConfig();
  providerSelect.value = config.provider;
  apiKeyInput.value = config.apiKey || "";
  baseUrlInput.value = config.baseUrl;
  customModelInput.value = config.model;

  // Render recommended fast & cheap model cards
  function renderPresets() {
    modelPresetsContainer.innerHTML = "";
    RECOMMENDED_MODELS.forEach((preset) => {
      const card = document.createElement("div");
      card.className = `mui-action-card ${customModelInput.value === preset.id ? "selected" : ""}`;
      card.innerHTML = `
        <div class="mui-card-name">${preset.name}</div>
        <div class="mui-card-meta">${preset.speed} • ${preset.cost}</div>
      `;
      card.addEventListener("click", () => {
        customModelInput.value = preset.id;
        document.querySelectorAll(".mui-action-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
      });
      modelPresetsContainer.appendChild(card);
    });
  }

  renderPresets();

  providerSelect.addEventListener("change", () => {
    if (providerSelect.value === "openrouter") {
      baseUrlInput.value = "https://openrouter.ai/api/v1";
    } else {
      baseUrlInput.value = "http://localhost:11434/v1";
    }
  });

  // Test Connection
  testBtn.addEventListener("click", async () => {
    testBtn.disabled = true;
    testBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="animation: spin 1s linear infinite;">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
      <span>Testing...</span>
    `;
    testResultBox.className = "mui-alert";
    testResultBox.textContent = "Connecting to endpoint...";
    testResultBox.style.display = "flex";

    const currentTestConfig = {
      provider: providerSelect.value as LLMProvider,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: customModelInput.value.trim()
    };

    const res = await testConnection(currentTestConfig);
    testBtn.disabled = false;
    testBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
      <span>Test Connection</span>
    `;

    if (res.success) {
      testResultBox.className = "mui-alert mui-alert-success";
      testResultBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="flex-shrink: 0;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>${res.message}</span>
      `;
    } else {
      testResultBox.className = "mui-alert mui-alert-error";
      testResultBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="flex-shrink: 0;">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        <span>${res.message}</span>
      `;
    }
  });

  // Save Settings
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Saving...</span>`;

    await setLLMConfig({
      provider: providerSelect.value as LLMProvider,
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
    saveBtn.style.backgroundColor = "#66bb6a";
    saveBtn.style.color = "#003300";
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
});
