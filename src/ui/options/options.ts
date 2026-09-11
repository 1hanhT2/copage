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
      card.className = `model-card ${customModelInput.value === preset.id ? "selected" : ""}`;
      card.innerHTML = `
        <div class="model-card-name">${preset.name}</div>
        <div class="model-card-meta">${preset.speed} • ${preset.cost}</div>
      `;
      card.addEventListener("click", () => {
        customModelInput.value = preset.id;
        document.querySelectorAll(".model-card").forEach((c) => c.classList.remove("selected"));
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
    testBtn.textContent = "Testing...";
    testResultBox.className = "test-result";
    testResultBox.textContent = "Connecting to endpoint...";
    testResultBox.style.display = "block";

    const currentTestConfig = {
      provider: providerSelect.value as LLMProvider,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: customModelInput.value.trim()
    };

    const res = await testConnection(currentTestConfig);
    testBtn.disabled = false;
    testBtn.textContent = "🔍 Test Connection";

    if (res.success) {
      testResultBox.className = "test-result test-success";
      testResultBox.textContent = "✓ " + res.message;
    } else {
      testResultBox.className = "test-result test-error";
      testResultBox.textContent = "✕ " + res.message;
    }
  });

  // Save Settings
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    await setLLMConfig({
      provider: providerSelect.value as LLMProvider,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrlInput.value.trim(),
      model: customModelInput.value.trim()
    });

    saveBtn.textContent = "✓ Saved!";
    saveBtn.style.backgroundColor = "#059669";
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Save Settings";
      saveBtn.style.backgroundColor = "";
    }, 1500);
  });
});
