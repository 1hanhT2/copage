import { ElementInspector } from "./inspector";
import type { ExtensionMessage } from "../lib/types";

// Singleton inspector instance for this frame
let inspector: ElementInspector | null = null;

console.log("[Copage] Inspector content script loaded on", window.location.hostname);

function getInspector(): ElementInspector {
  if (!inspector) {
    inspector = new ElementInspector();
  }
  return inspector;
}

function showToast(message: string, isActivated: boolean) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed !important;
    top: 16px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background-color: rgba(28, 27, 33, 0.94) !important;
    color: ${isActivated ? "#a8c7fa" : "rgba(255, 255, 255, 0.7)"} !important;
    border: 1px solid rgba(168, 199, 250, 0.3) !important;
    border-radius: 9999px !important;
    padding: 7px 18px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    font-family: 'Lexend', 'Google Sans Text', -apple-system, BlinkMacSystemFont, sans-serif !important;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(16px) !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    transition: opacity 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  `;
  const mount = document.body || document.documentElement;
  mount.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 1400);
}

// Listen for messages from background script or popup
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "TOGGLE_INSPECTOR") {
      const active = getInspector().toggle();
      showToast(active ? "Copage Inspector Active (Hover to inspect, Esc to exit)" : "Copage Inspector Deactivated", active);
      sendResponse({ active });
    } else if (message.type === "GET_INSPECTOR_STATE") {
      sendResponse({ active: !!inspector });
    }
    return true;
  });
}

// Global shortcut listener in content script as direct fallback with capture: true
window.addEventListener(
  "keydown",
  (e) => {
    if (e.altKey && (e.key === "c" || e.key === "C" || e.code === "KeyC")) {
      e.preventDefault();
      e.stopPropagation();
      const active = getInspector().toggle();
      showToast(active ? "Copage Inspector Active (Hover to inspect, Esc to exit)" : "Copage Inspector Deactivated", active);
    }
  },
  { capture: true }
);
