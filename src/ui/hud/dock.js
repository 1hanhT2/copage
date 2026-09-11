import { buildPromptForTarget } from "../../llm/prompts";
import { streamCompletion } from "../../llm/gateway";
import { getLLMConfig, saveRecentCapture, RECOMMENDED_MODELS } from "../../lib/storage";
export class CopageDock {
    container;
    currentData = null;
    isStreaming = false;
    generatedCode = "";
    onUnlock;
    onSelectBreadcrumb;
    constructor(container, callbacks) {
        this.container = container;
        this.onUnlock = callbacks.onUnlock;
        this.onSelectBreadcrumb = callbacks.onSelectBreadcrumb;
    }
    show(data) {
        this.currentData = data;
        this.generatedCode = "";
        this.isStreaming = false;
        this.render();
    }
    hide() {
        this.container.innerHTML = "";
        this.currentData = null;
    }
    async copyToClipboard(text, button, successLabel = "Copied!") {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = successLabel;
            button.style.backgroundColor = "#059669";
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = "";
            }, 1800);
        }
        catch {
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            button.textContent = successLabel;
            setTimeout(() => {
                button.textContent = "Copy";
            }, 1800);
        }
    }
    async handleStreamGeneration(outputPre, actionBtn) {
        if (!this.currentData || this.isStreaming)
            return;
        const config = await getLLMConfig();
        if (!config.apiKey && config.provider === "openrouter") {
            outputPre.textContent = "Error: OpenRouter API key not configured. Open Copage extension options to add your key.";
            outputPre.style.color = "#f87171";
            return;
        }
        this.isStreaming = true;
        this.generatedCode = "";
        actionBtn.disabled = true;
        actionBtn.textContent = "Synthesizing...";
        outputPre.textContent = "Connecting to " + config.model + "...\n";
        outputPre.style.color = "#94a3b8";
        const { system, prompt } = buildPromptForTarget(this.currentData, "react-component");
        try {
            await streamCompletion(config, [
                { role: "system", content: system },
                { role: "user", content: prompt }
            ], (delta) => {
                this.generatedCode += delta;
                outputPre.textContent = this.generatedCode;
                outputPre.style.color = "#f8fafc";
                outputPre.scrollTop = outputPre.scrollHeight;
            });
            actionBtn.disabled = false;
            actionBtn.textContent = "Regenerate React Component";
            // Auto save capture
            await saveRecentCapture({
                id: "cap_" + Date.now(),
                timestamp: Date.now(),
                url: this.currentData.pageUrl,
                title: this.currentData.pageTitle,
                tagName: this.currentData.tagName,
                dimensions: `${this.currentData.rect.width} × ${this.currentData.rect.height}`,
                summary: `<${this.currentData.tagName}> with ${this.currentData.classList.length} classes`,
                cleanHtml: this.currentData.cleanHtml,
                reproductionPrompt: this.generatedCode
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            outputPre.textContent = `Stream Error: ${msg}\n\nTip: Verify your API key or try switching to another recommended model (e.g. Gemini 2.5 Flash or DeepSeek Flash).`;
            outputPre.style.color = "#f87171";
            actionBtn.disabled = false;
            actionBtn.textContent = "Retry Component Generation";
        }
        finally {
            this.isStreaming = false;
        }
    }
    render() {
        if (!this.currentData)
            return;
        const d = this.currentData;
        // Breadcrumbs items HTML
        const breadcrumbHtml = d.breadcrumbs
            .map((b) => `
        <button class="copage-bc-btn" data-index="${b.index}" title="Select parent &lt;${b.tagName}&gt;">
          &lt;${b.tagName}${b.className ? `.${b.className}` : ""}&gt;
        </button>
      `)
            .join('<span style="color: #64748b; font-size: 11px;">›</span>');
        this.container.innerHTML = `
      <div class="copage-dock-panel">
        <!-- Top Bar -->
        <div class="copage-dock-header">
          <div class="copage-badge-group">
            <span class="copage-brand-tag">Copage</span>
            <span class="copage-tag-badge">&lt;${d.tagName}&gt;</span>
            <span class="copage-dim-badge">${d.rect.width} × ${d.rect.height}px</span>
            ${d.classList.length > 0 ? `<span class="copage-class-badge">${d.classList.slice(0, 3).join(".")}</span>` : ""}
          </div>
          <div class="copage-header-actions">
            <button id="copage-unlock-btn" class="copage-btn-secondary" title="Resume hover inspection (Esc)">✕ Unlock</button>
          </div>
        </div>

        <!-- Breadcrumbs Navigation -->
        ${d.breadcrumbs.length > 1 ? `<div class="copage-breadcrumbs-bar">${breadcrumbHtml}</div>` : ""}

        <!-- Prompt Copy Grid -->
        <div class="copage-action-grid">
          <button class="copage-action-card" data-target="cursor">
            <div class="copage-card-title">Cursor Composer Prompt</div>
            <div class="copage-card-desc">Structured task prompt for Cursor & Windsurf</div>
          </button>
          <button class="copage-action-card" data-target="claude">
            <div class="copage-card-title">Claude Chat Prompt</div>
            <div class="copage-card-desc">Deep UI & layout deconstruction prompt</div>
          </button>
          <button class="copage-action-card" data-target="v0">
            <div class="copage-card-title">v0 / 21st.dev Prompt</div>
            <div class="copage-card-desc">Tailwind component generator prompt</div>
          </button>
          <button class="copage-action-card" data-target="html-tailwind">
            <div class="copage-card-title">Copy HTML + Tailwind</div>
            <div class="copage-card-desc">Clean semantic HTML with utility classes</div>
          </button>
        </div>

        <!-- Live AI Synthesis Section -->
        <div class="copage-ai-section">
          <div class="copage-ai-header">
            <div class="copage-model-info">
              <span style="font-size: 11px; color: #94a3b8;">Active Model:</span>
              <select id="copage-quick-model-select" class="copage-model-select">
                ${RECOMMENDED_MODELS.map((m) => `<option value="${m.id}">${m.name} (${m.speed}, ${m.cost})</option>`).join("")}
              </select>
            </div>
            <button id="copage-stream-btn" class="copage-btn-primary">⚡ Synthesize React Component</button>
          </div>
          <div class="copage-code-preview-wrap">
            <div class="copage-code-preview-header">
              <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">Output Preview (React TSX)</span>
              <button id="copage-copy-code-btn" class="copage-btn-secondary" style="font-size: 11px; padding: 2px 8px;">Copy Code</button>
            </div>
            <pre id="copage-stream-output" class="copage-code-pre">Click "Synthesize React Component" above to generate with your configured model...</pre>
          </div>
        </div>
      </div>
    `;
        // Event Bindings
        const unlockBtn = this.container.querySelector("#copage-unlock-btn");
        unlockBtn?.addEventListener("click", () => this.onUnlock());
        // Breadcrumb clicks
        this.container.querySelectorAll(".copage-bc-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const idx = parseInt(e.currentTarget.dataset.index || "0", 10);
                this.onSelectBreadcrumb(idx);
            });
        });
        // Copy prompt cards
        this.container.querySelectorAll(".copage-action-card").forEach((card) => {
            card.addEventListener("click", (e) => {
                const target = e.currentTarget.dataset.target;
                const { prompt } = buildPromptForTarget(this.currentData, target);
                this.copyToClipboard(prompt, e.currentTarget, "Prompt Copied!");
            });
        });
        // Stream generation button
        const streamBtn = this.container.querySelector("#copage-stream-btn");
        const outputPre = this.container.querySelector("#copage-stream-output");
        const modelSelect = this.container.querySelector("#copage-quick-model-select");
        // Load saved model selection into dropdown
        getLLMConfig().then((cfg) => {
            if (modelSelect) {
                if (!Array.from(modelSelect.options).some((opt) => opt.value === cfg.model)) {
                    const opt = document.createElement("option");
                    opt.value = cfg.model;
                    opt.text = cfg.model;
                    modelSelect.add(opt);
                }
                modelSelect.value = cfg.model;
            }
        });
        modelSelect?.addEventListener("change", async () => {
            // update storage
            const cfg = await getLLMConfig();
            cfg.model = modelSelect.value;
            if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ copage_llm_config: cfg });
            }
        });
        streamBtn?.addEventListener("click", () => {
            this.handleStreamGeneration(outputPre, streamBtn);
        });
        // Copy generated code button
        const copyCodeBtn = this.container.querySelector("#copage-copy-code-btn");
        copyCodeBtn?.addEventListener("click", () => {
            if (this.generatedCode) {
                this.copyToClipboard(this.generatedCode, copyCodeBtn, "TSX Copied!");
            }
        });
    }
}
