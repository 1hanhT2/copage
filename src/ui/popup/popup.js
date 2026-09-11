import { getLLMConfig } from "../../lib/storage";
document.addEventListener("DOMContentLoaded", async () => {
    const activateBtn = document.getElementById("activate-btn");
    const optionsLink = document.getElementById("open-options-link");
    const optionsFooterLink = document.getElementById("options-footer-link");
    const statProvider = document.getElementById("stat-provider");
    const statModel = document.getElementById("stat-model");
    const statKey = document.getElementById("stat-key");
    // Load configuration
    const config = await getLLMConfig();
    if (statProvider)
        statProvider.textContent = config.provider === "openrouter" ? "OpenRouter" : "Custom OpenAI";
    if (statModel)
        statModel.textContent = config.model.split("/").pop() || config.model;
    if (statKey) {
        if (config.apiKey || config.provider === "openai-compatible") {
            statKey.innerHTML = `<span class="status-dot dot-green"></span>Ready`;
        }
        else {
            statKey.innerHTML = `<span class="status-dot dot-amber"></span>Missing Key`;
        }
    }
    // Activate Inspector button
    activateBtn?.addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            try {
                await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_INSPECTOR" });
                window.close();
            }
            catch {
                activateBtn.textContent = "Cannot inspect this tab";
                activateBtn.style.backgroundColor = "#982e3b";
            }
        }
    });
    const openOptions = (e) => {
        e.preventDefault();
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        }
        else {
            window.open(chrome.runtime.getURL("options.html"));
        }
    };
    optionsLink?.addEventListener("click", openOptions);
    optionsFooterLink?.addEventListener("click", openOptions);
});
