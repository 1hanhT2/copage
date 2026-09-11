import { ElementInspector } from "./inspector";
// Singleton inspector instance for this frame
let inspector = null;
function getInspector() {
    if (!inspector) {
        inspector = new ElementInspector();
    }
    return inspector;
}
function showToast(message, isActivated) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #0f172a;
    color: ${isActivated ? "#38bdf8" : "#94a3b8"};
    border: 1px solid #334155;
    border-radius: 9999px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 600;
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 2147483647;
    pointer-events: none;
    transition: opacity 0.2s ease-out;
  `;
    document.documentElement.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 250);
    }, 1400);
}
// Listen for messages from background script or popup
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === "TOGGLE_INSPECTOR") {
            const active = getInspector().toggle();
            showToast(active ? "Copage Inspector Active (Hover to inspect, Esc to exit)" : "Copage Inspector Deactivated", active);
            sendResponse({ active });
        }
        else if (message.type === "GET_INSPECTOR_STATE") {
            sendResponse({ active: !!inspector });
        }
        return true;
    });
}
// Global shortcut listener in content script as direct fallback
window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "c" || e.key === "C" || e.code === "KeyC")) {
        e.preventDefault();
        const active = getInspector().toggle();
        showToast(active ? "Copage Inspector Active (Hover to inspect, Esc to exit)" : "Copage Inspector Deactivated", active);
    }
});
