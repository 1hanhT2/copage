import { getLLMConfig, setLLMConfig, RECOMMENDED_MODELS } from "../../lib/storage";
import { testConnection } from "../../llm/gateway";
document.addEventListener("DOMContentLoaded", async () => {
    const providerSelect = document.getElementById("provider-select");
    const apiKeyInput = document.getElementById("api-key-input");
    const baseUrlInput = document.getElementById("base-url-input");
    const customModelInput = document.getElementById("custom-model-input");
    const modelPresetsContainer = document.getElementById("model-presets-container");
    const testBtn = document.getElementById("test-conn-btn");
    const saveBtn = document.getElementById("save-btn");
    const testResultBox = document.getElementById("test-result-box");
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
        }
        else {
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
            provider: providerSelect.value,
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
        }
        else {
            testResultBox.className = "test-result test-error";
            testResultBox.textContent = "✕ " + res.message;
        }
    });
    // Save Settings
    saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
        await setLLMConfig({
            provider: providerSelect.value,
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
