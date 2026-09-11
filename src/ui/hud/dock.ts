import type { InspectedElementData, PromptTarget, LLMConfig } from "../../lib/types";
import { buildPromptForTarget } from "../../llm/prompts";
import { streamCompletion } from "../../llm/gateway";
import { getLLMConfig, saveRecentCapture, RECOMMENDED_MODELS } from "../../lib/storage";

export class CopageDock {
  private container: HTMLElement;
  private currentData: InspectedElementData | null = null;
  private isStreaming = false;
  private generatedCode = "";
  private onUnlock: () => void;
  private onSelectBreadcrumb: (index: number) => void;

  constructor(
    container: HTMLElement,
    callbacks: { onUnlock: () => void; onSelectBreadcrumb: (index: number) => void }
  ) {
    this.container = container;
    this.onUnlock = callbacks.onUnlock;
    this.onSelectBreadcrumb = callbacks.onSelectBreadcrumb;
  }

  public show(data: InspectedElementData) {
    this.currentData = data;
    this.generatedCode = "";
    this.isStreaming = false;
    this.render();
  }

  public hide() {
    this.container.innerHTML = "";
    this.currentData = null;
  }

  private async copyToClipboard(text: string, button: HTMLElement, successLabel = "Copied!") {
    try {
      await navigator.clipboard.writeText(text);
      const originalHtml = button.innerHTML;
      button.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="#66bb6a" style="flex-shrink: 0;">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span style="color: #a5d6a7; font-weight: 500;">${successLabel}</span>
      `;
      button.style.backgroundColor = "rgba(102, 187, 106, 0.15)";
      button.style.borderColor = "rgba(102, 187, 106, 0.4)";
      setTimeout(() => {
        button.innerHTML = originalHtml;
        button.style.backgroundColor = "";
        button.style.borderColor = "";
      }, 1600);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      const originalHtml = button.innerHTML;
      button.innerHTML = `<span>${successLabel}</span>`;
      setTimeout(() => {
        button.innerHTML = originalHtml;
      }, 1600);
    }
  }

  private async handleStreamGeneration(outputPre: HTMLElement, actionBtn: HTMLButtonElement) {
    if (!this.currentData || this.isStreaming) return;

    const config = await getLLMConfig();
    if (!config.apiKey && config.provider === "openrouter") {
      outputPre.textContent = "Error: OpenRouter API key not configured. Open Copage extension options to add your key.";
      outputPre.style.color = "#f44336";
      return;
    }

    this.isStreaming = true;
    this.generatedCode = "";
    actionBtn.disabled = true;
    actionBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="animation: spin 1s linear infinite;">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
      <span>Synthesizing...</span>
    `;
    outputPre.textContent = "Connecting to " + config.model + "...\n";
    outputPre.style.color = "rgba(255, 255, 255, 0.6)";

    const { system, prompt } = buildPromptForTarget(this.currentData, "react-component");

    try {
      await streamCompletion(
        config,
        [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        (delta) => {
          this.generatedCode += delta;
          outputPre.textContent = this.generatedCode;
          outputPre.style.color = "rgba(255, 255, 255, 0.87)";
          outputPre.scrollTop = outputPre.scrollHeight;
        }
      );

      actionBtn.disabled = false;
      actionBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
        </svg>
        <span>Regenerate React Component</span>
      `;

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      outputPre.textContent = `Stream Error: ${msg}\n\nTip: Verify your API key or try switching to another recommended model in Settings.`;
      outputPre.style.color = "#f44336";
      actionBtn.disabled = false;
      actionBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
        </svg>
        <span>Retry Component Generation</span>
      `;
    } finally {
      this.isStreaming = false;
    }
  }

  private render() {
    if (!this.currentData) return;
    const d = this.currentData;

    // Breadcrumbs items HTML with Material chevron separator
    const chevronSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="rgba(255,255,255,0.38)" style="flex-shrink: 0;"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
    const breadcrumbHtml = d.breadcrumbs
      .map(
        (b) => `
        <button class="copage-bc-btn" data-index="${b.index}" title="Select parent &lt;${b.tagName}&gt;">
          &lt;${b.tagName}${b.className ? `.${b.className}` : ""}&gt;
        </button>
      `
      )
      .join(chevronSvg);

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
            <button id="copage-unlock-btn" class="copage-btn-secondary" title="Resume hover inspection (Esc)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
              </svg>
              <span>Unlock</span>
            </button>
          </div>
        </div>

        <!-- Breadcrumbs Navigation -->
        ${d.breadcrumbs.length > 1 ? `<div class="copage-breadcrumbs-bar">${breadcrumbHtml}</div>` : ""}

        <!-- Prompt Copy Grid (MUI Cards) -->
        <div class="copage-action-grid">
          <button class="copage-action-card" data-target="cursor">
            <div class="copage-card-top">
              <div class="copage-card-title">Cursor Composer</div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="copage-card-icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </div>
            <div class="copage-card-desc">Production prompt for Cursor &amp; Windsurf</div>
          </button>
          <button class="copage-action-card" data-target="claude">
            <div class="copage-card-top">
              <div class="copage-card-title">Claude Prompt</div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="copage-card-icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </div>
            <div class="copage-card-desc">Detailed UI decomposition &amp; hierarchy</div>
          </button>
          <button class="copage-action-card" data-target="v0">
            <div class="copage-card-top">
              <div class="copage-card-title">v0 / 21st.dev</div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="copage-card-icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </div>
            <div class="copage-card-desc">Tailwind component reproduction prompt</div>
          </button>
          <button class="copage-action-card" data-target="html-tailwind">
            <div class="copage-card-top">
              <div class="copage-card-title">HTML + Tailwind</div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="copage-card-icon"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </div>
            <div class="copage-card-desc">Clean semantic HTML with utility classes</div>
          </button>
        </div>

        <!-- Live AI Synthesis Section -->
        <div class="copage-ai-section">
          <div class="copage-ai-header">
            <div class="copage-model-info">
              <span class="copage-model-label">Active Model:</span>
              <select id="copage-quick-model-select" class="copage-model-select">
                ${RECOMMENDED_MODELS.map(
                  (m) => `<option value="${m.id}">${m.name} (${m.speed}, ${m.cost})</option>`
                ).join("")}
              </select>
            </div>
            <button id="copage-stream-btn" class="copage-btn-primary">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
              </svg>
              <span>Synthesize React Component</span>
            </button>
          </div>
          <div class="copage-code-preview-wrap">
            <div class="copage-code-preview-header">
              <span class="copage-code-title">Output Preview (React TSX)</span>
              <button id="copage-copy-code-btn" class="copage-btn-secondary" style="font-size: 11px; padding: 3px 10px;">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span>Copy Code</span>
              </button>
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
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index || "0", 10);
        this.onSelectBreadcrumb(idx);
      });
    });

    // Copy prompt cards
    this.container.querySelectorAll(".copage-action-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target as PromptTarget;
        const { prompt } = buildPromptForTarget(this.currentData!, target);
        this.copyToClipboard(prompt, e.currentTarget as HTMLElement, "Prompt Copied!");
      });
    });

    // Stream generation button
    const streamBtn = this.container.querySelector("#copage-stream-btn") as HTMLButtonElement;
    const outputPre = this.container.querySelector("#copage-stream-output") as HTMLElement;
    const modelSelect = this.container.querySelector("#copage-quick-model-select") as HTMLSelectElement;

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
    const copyCodeBtn = this.container.querySelector("#copage-copy-code-btn") as HTMLElement;
    copyCodeBtn?.addEventListener("click", () => {
      if (this.generatedCode) {
        this.copyToClipboard(this.generatedCode, copyCodeBtn, "TSX Copied!");
      }
    });
  }
}
