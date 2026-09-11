import type { InspectedElementData, PromptTarget, LLMConfig } from "../../lib/types";
import { buildPromptForTarget } from "../../llm/prompts";
import { streamCompletion } from "../../llm/gateway";
import { getLLMConfig, setLLMConfig, saveRecentCapture, RECOMMENDED_MODELS, getUserPreferences } from "../../lib/storage";
import {
  getM3ShapeSvg,
  getCanonicalM3ShapeSvg,
  getProviderShape,
  getElementM3Shape,
  getTargetM3Shape,
  getActionM3Shape,
  getCanonicalModelShape,
  getModelPillShapeClass
} from "../../lib/shapes";

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

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async handleStreamGeneration(outputPre: HTMLElement, actionBtn: HTMLButtonElement) {
    if (!this.currentData || this.isStreaming) return;

    const config = await getLLMConfig();
    if (!config.apiKey && config.provider === "openrouter") {
      outputPre.textContent = "Error: OpenRouter API key not configured. Open Copage extension settings to add your key.";
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
        <span>Regenerate Component</span>
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

      // Auto-copy preference check
      const prefs = await getUserPreferences();
      if (prefs.autoCopy && this.generatedCode) {
        try {
          await navigator.clipboard.writeText(this.generatedCode);
        } catch {}
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      outputPre.textContent = `Stream Error: ${msg}\n\nTip: Check API Key or choose a different model.`;
      outputPre.style.color = "#f44336";
      actionBtn.disabled = false;
      actionBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
        </svg>
        <span>Retry Generation</span>
      `;
    } finally {
      this.isStreaming = false;
    }
  }

  private render() {
    if (!this.currentData) return;
    const d = this.currentData;

    // Breadcrumbs items HTML with Material chevron separator and M3 semantic shapes
    const chevronSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="rgba(255,255,255,0.38)" style="flex-shrink: 0;"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
    const breadcrumbHtml = d.breadcrumbs
      .map(
        (b) => `
        <button class="copage-bc-btn" data-index="${b.index}" title="Select parent &lt;${b.tagName}&gt;">
          ${getCanonicalM3ShapeSvg(getElementM3Shape(b.tagName), 11, "currentColor", "opacity: 0.85; margin-right: 2px;")}
          <span>&lt;${b.tagName}${b.className ? `.${b.className}` : ""}&gt;</span>
        </button>
      `
      )
      .join(chevronSvg);

    this.container.innerHTML = `
      <div class="copage-dock-panel">
        <!-- Top Bar -->
        <div class="copage-dock-header">
          <div class="copage-badge-group">
            <span class="copage-brand-tag">
              ${getCanonicalM3ShapeSvg("very-sunny", 12, "currentColor")}
              <span>Copage</span>
            </span>
            <span class="copage-tag-badge">
              ${getCanonicalM3ShapeSvg(getElementM3Shape(d.tagName), 12, "#a8c7fa", "vertical-align: -1px; margin-right: 3px;")}
              <span>&lt;${d.tagName}&gt;</span>
            </span>
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

        <!-- Material 3 Segmented Toggle Group for Prompt Targets with M3 Shapes -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div class="copage-segmented-group" id="copage-prompt-targets">
            <button class="copage-segmented-btn active" data-target="cursor" title="Copy production prompt for Cursor &amp; Windsurf">
              ${getCanonicalM3ShapeSvg("diamond", 13, "currentColor")}
              <span>Cursor</span>
            </button>
            <button class="copage-segmented-btn" data-target="claude" title="Copy detailed UI decomposition prompt for Claude">
              ${getCanonicalM3ShapeSvg("flower", 13, "currentColor")}
              <span>Claude</span>
            </button>
            <button class="copage-segmented-btn" data-target="v0" title="Copy Tailwind component prompt for v0 &amp; 21st.dev">
              ${getCanonicalM3ShapeSvg("arch", 13, "currentColor")}
              <span>v0 / 21st</span>
            </button>
            <button class="copage-segmented-btn" data-target="html-tailwind" title="Copy semantic HTML with mapped Tailwind utilities">
              ${getCanonicalM3ShapeSvg("sunny", 13, "currentColor")}
              <span>Tailwind HTML</span>
            </button>
          </div>
          <button id="copage-copy-prompt-btn" class="copage-btn-secondary" style="font-size: 11px; padding: 5px 12px;">
            ${getCanonicalM3ShapeSvg("puffy-diamond", 13, "currentColor")}
            <span>Copy Prompt</span>
          </button>
        </div>

        <!-- Live AI Synthesis Section -->
        <div class="copage-ai-section">
          <div class="copage-ai-header">
            <!-- Material Outlined Model Selector Dropdown -->
            <div class="copage-model-info">
              <span class="copage-model-label">Model:</span>
              <div class="copage-select-wrap" id="copage-dock-select-wrap">
                <div class="copage-trigger-contour">
                  <div id="copage-dock-model-trigger" class="copage-select-trigger" tabindex="0">
                    <span id="copage-dock-model-icon" style="display: inline-flex; align-items: center;"></span>
                    <span id="copage-dock-model-name">Gemini 2.5 Flash</span>
                    <svg class="copage-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </div>
                </div>
                <div id="copage-dock-model-menu" class="copage-menu-popover">
                  <!-- Injected dynamically -->
                </div>
              </div>
            </div>

            <!-- Material Split Action Button -->
            <div class="copage-split-group">
              <button id="copage-stream-btn" class="copage-split-main" title="Synthesize full production React component">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
                </svg>
                <span>Synthesize Component</span>
              </button>
              <button id="copage-split-arrow" class="copage-split-arrow-btn" title="Quick copy raw assets &amp; code">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              <div id="copage-actions-menu" class="copage-actions-popover">
                <div class="copage-menu-item" data-action="copy-html">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="copage-action-badge">${getCanonicalM3ShapeSvg("arch", 15, "#a8c7fa")}</div>
                    <div class="copage-menu-item-text">
                      <span class="copage-menu-item-title">Copy Clean HTML</span>
                      <span class="copage-menu-item-desc">Pruned DOM without trackers</span>
                    </div>
                  </div>
                </div>
                <div class="copage-menu-item" data-action="copy-css">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="copage-action-badge">${getCanonicalM3ShapeSvg("flower", 15, "#d0bcff")}</div>
                    <div class="copage-menu-item-text">
                      <span class="copage-menu-item-title">Copy Distilled CSS</span>
                      <span class="copage-menu-item-desc">Layout &amp; box-model rules</span>
                    </div>
                  </div>
                </div>
                <div class="copage-menu-item" data-action="copy-tailwind">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="copage-action-badge">${getCanonicalM3ShapeSvg("diamond", 15, "#78dc77")}</div>
                    <div class="copage-menu-item-text">
                      <span class="copage-menu-item-title">Copy Tailwind Classes</span>
                      <span class="copage-menu-item-desc">${d.tailwindClasses.length} mapped utility classes</span>
                    </div>
                  </div>
                </div>
                <div class="copage-menu-item" data-action="copy-svgs">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="copage-action-badge">${getCanonicalM3ShapeSvg("burst", 15, "#ffdf99")}</div>
                    <div class="copage-menu-item-text">
                      <span class="copage-menu-item-title">Copy Inlined SVGs</span>
                      <span class="copage-menu-item-desc">${d.svgAssets.length} sanitized vector assets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Code Preview Area -->
          <div class="copage-code-preview-wrap">
            <div class="copage-code-preview-header">
              <span class="copage-code-title">
                ${getCanonicalM3ShapeSvg("gem", 12, "#a8c7fa", "margin-right: 4px; vertical-align: -1px;")}
                <span>Component Output (React TSX + Tailwind)</span>
              </span>
              <div style="display: flex; gap: 6px;">
                <button id="copage-copy-code-btn" class="copage-btn-secondary" style="font-size: 11px; padding: 3px 10px;">
                  ${getCanonicalM3ShapeSvg("diamond", 12, "currentColor")}
                  <span>Copy Code</span>
                </button>
                <button id="copage-download-code-btn" class="copage-btn-secondary" style="font-size: 11px; padding: 3px 10px;">
                  ${getCanonicalM3ShapeSvg("gem", 12, "currentColor")}
                  <span>Download .tsx</span>
                </button>
              </div>
            </div>
            <pre id="copage-stream-output" class="copage-code-pre">Click "Synthesize Component" above to generate with your configured model...</pre>
          </div>
        </div>
      </div>
    `;

    // Unlock button
    const unlockBtn = this.container.querySelector("#copage-unlock-btn");
    unlockBtn?.addEventListener("click", () => this.onUnlock());

    // Breadcrumb clicks
    this.container.querySelectorAll(".copage-bc-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index || "0", 10);
        this.onSelectBreadcrumb(idx);
      });
    });

    // Segmented Prompt Target selection & Copy Prompt
    let activePromptTarget: PromptTarget = "cursor";
    const promptTargetBtns = this.container.querySelectorAll(".copage-segmented-btn");
    const copyPromptBtn = this.container.querySelector("#copage-copy-prompt-btn") as HTMLElement;

    promptTargetBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.target as PromptTarget;
        activePromptTarget = target;
        promptTargetBtns.forEach((b) => b.classList.remove("active"));
        (e.currentTarget as HTMLElement).classList.add("active");

        // Quick copy prompt on target click
        const { prompt } = buildPromptForTarget(this.currentData!, activePromptTarget);
        this.copyToClipboard(prompt, copyPromptBtn, `${target.toUpperCase()} Copied!`);
      });
    });

    copyPromptBtn?.addEventListener("click", () => {
      const { prompt } = buildPromptForTarget(this.currentData!, activePromptTarget);
      this.copyToClipboard(prompt, copyPromptBtn, "Prompt Copied!");
    });

    // Model Dropdown Menu
    const modelTrigger = this.container.querySelector("#copage-dock-model-trigger") as HTMLElement;
    const modelMenu = this.container.querySelector("#copage-dock-model-menu") as HTMLElement;
    const modelNameLabel = this.container.querySelector("#copage-dock-model-name") as HTMLElement;
    const modelIconSpan = this.container.querySelector("#copage-dock-model-icon") as HTMLElement;

    getLLMConfig().then((cfg) => {
      const activePreset = RECOMMENDED_MODELS.find((m) => m.id === cfg.model);
      if (modelTrigger) {
        modelTrigger.className = `copage-select-trigger ${getModelPillShapeClass(cfg.model)}`;
      }
      if (modelNameLabel) {
        modelNameLabel.textContent = activePreset ? activePreset.name : (cfg.model.split("/").pop() || cfg.model);
      }
      if (modelIconSpan) {
        modelIconSpan.innerHTML = `<span class="copage-shape-well">${getCanonicalM3ShapeSvg(getCanonicalModelShape(cfg.model), 13, "currentColor")}</span>`;
      }

      if (modelMenu) {
        modelMenu.innerHTML = "";
        RECOMMENDED_MODELS.forEach((preset) => {
          const isSelected = cfg.model === preset.id;
          const shapeSvg = `<span class="copage-shape-well" style="width: 20px; height: 20px;">${getCanonicalM3ShapeSvg(getCanonicalModelShape(preset.id), 12, "currentColor")}</span>`;
          const item = document.createElement("div");
          item.className = `copage-menu-item ${isSelected ? "selected" : ""}`;
          item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              ${shapeSvg}
              <div class="copage-menu-item-text">
                <span class="copage-menu-item-title">${preset.name}</span>
                <span class="copage-menu-item-desc">${preset.speed} • ${preset.cost}</span>
              </div>
            </div>
            <svg class="copage-menu-item-check" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          `;
          item.addEventListener("click", async () => {
            await setLLMConfig({ model: preset.id });
            modelNameLabel.textContent = preset.name;
            if (modelIconSpan) {
              modelIconSpan.innerHTML = `<span class="copage-shape-well">${getCanonicalM3ShapeSvg(getCanonicalModelShape(preset.id), 13, "currentColor")}</span>`;
            }
            if (modelTrigger) {
              modelTrigger.className = `copage-select-trigger ${getModelPillShapeClass(preset.id)}`;
            }
            modelMenu.querySelectorAll(".copage-menu-item").forEach((it) => it.classList.remove("selected"));
            item.classList.add("selected");
            modelMenu.classList.remove("open");
            modelTrigger.classList.remove("open");
            dockSelectWrap?.classList.remove("open");
          });
          modelMenu.appendChild(item);
        });
      }
    });

    const dockSelectWrap = this.container.querySelector("#copage-dock-select-wrap") as HTMLElement;

    modelTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = modelMenu.classList.toggle("open");
      modelTrigger.classList.toggle("open", isOpen);
      dockSelectWrap?.classList.toggle("open", isOpen);
      // Close actions menu if open
      actionsMenu?.classList.remove("open");
    });

    modelTrigger?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const isOpen = modelMenu.classList.toggle("open");
        modelTrigger.classList.toggle("open", isOpen);
        dockSelectWrap?.classList.toggle("open", isOpen);
        actionsMenu?.classList.remove("open");
      } else if (e.key === "Escape") {
        modelMenu.classList.remove("open");
        modelTrigger.classList.remove("open");
        dockSelectWrap?.classList.remove("open");
      }
    });

    // Split Button Actions Dropdown
    const splitArrow = this.container.querySelector("#copage-split-arrow") as HTMLElement;
    const actionsMenu = this.container.querySelector("#copage-actions-menu") as HTMLElement;

    splitArrow?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = actionsMenu.classList.toggle("open");
      // Close model menu if open
      modelMenu?.classList.remove("open");
      modelTrigger?.classList.remove("open");
      dockSelectWrap?.classList.remove("open");
    });

    // Actions items
    actionsMenu?.querySelectorAll(".copage-menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        actionsMenu.classList.remove("open");
        if (!this.currentData) return;
        if (action === "copy-html") {
          this.copyToClipboard(this.currentData.cleanHtml, splitArrow, "HTML Copied!");
        } else if (action === "copy-css") {
          const cssText = Object.entries(this.currentData.distilledStyles)
            .map(([group, styles]) => `/* ${group} */\n` + Object.entries(styles).map(([k, v]) => `  ${k}: ${v};`).join("\n"))
            .join("\n\n");
          this.copyToClipboard(cssText, splitArrow, "CSS Copied!");
        } else if (action === "copy-tailwind") {
          this.copyToClipboard(this.currentData.tailwindClasses.join(" "), splitArrow, "Tailwind Copied!");
        } else if (action === "copy-svgs") {
          const svgs = this.currentData.svgAssets.map((s, i) => `<!-- SVG Asset ${i + 1} (${s.suggestedLucideIcon || "icon"}) -->\n${s.svgString}`).join("\n\n");
          this.copyToClipboard(svgs || "No SVGs found in this element.", splitArrow, "SVGs Copied!");
        }
      });
    });

    // Dismiss menus on click outside inside dock
    this.container.addEventListener("click", (e) => {
      if (!modelTrigger.contains(e.target as Node) && !modelMenu.contains(e.target as Node)) {
        modelMenu.classList.remove("open");
        modelTrigger.classList.remove("open");
        dockSelectWrap?.classList.remove("open");
      }
      if (!splitArrow.contains(e.target as Node) && !actionsMenu.contains(e.target as Node)) {
        actionsMenu.classList.remove("open");
      }
    });

    // Stream generation button
    const streamBtn = this.container.querySelector("#copage-stream-btn") as HTMLButtonElement;
    const outputPre = this.container.querySelector("#copage-stream-output") as HTMLElement;

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

    // Download code button
    const downloadCodeBtn = this.container.querySelector("#copage-download-code-btn") as HTMLElement;
    downloadCodeBtn?.addEventListener("click", () => {
      if (this.generatedCode) {
        const componentName = `${d.tagName.charAt(0).toUpperCase() + d.tagName.slice(1)}Component`;
        this.downloadFile(this.generatedCode, `${componentName}.tsx`);
      }
    });
  }
}
