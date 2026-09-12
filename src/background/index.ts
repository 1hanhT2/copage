import type { ExtensionMessage } from "../lib/types";

// 1. Immediate Service Worker activation & client claiming (inspired by SingleFile's sw-reload-hack)
self.addEventListener("install", () => {
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting?.();
});
self.addEventListener("activate", (event) => {
  (event as ExtendableEvent).waitUntil?.(
    (self as unknown as ServiceWorkerGlobalScope).clients?.claim?.()
  );
});

export function isScriptableUrl(url?: string): boolean {
  if (!url) return false;
  const restrictedPrefixes = [
    "chrome://",
    "chrome-extension://",
    "edge://",
    "about:",
    "devtools://",
    "view-source:"
  ];
  if (restrictedPrefixes.some((prefix) => url.startsWith(prefix))) {
    return false;
  }
  if (url.includes("chromewebstore.google.com") || url.includes("chrome.google.com/webstore")) {
    return false;
  }
  return true;
}

async function toggleInspectorInTab(tab: chrome.tabs.Tab) {
  if (!tab || typeof tab.id !== "number") return;
  if (!isScriptableUrl(tab.url)) {
    console.info("[Copage] Cannot inspect restricted browser page:", tab.url);
    return;
  }

  const tabId = tab.id;
  try {
    // 1. Fast path: try sending message to already injected content script in top frame
    await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage, { frameId: 0 });
  } catch {
    // 2. Tab was opened before extension installation or reload; dynamically inject content.js
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: ["content.js"]
      });
      // The promise resolves after top-level script execution, so onMessage is active
      await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage, { frameId: 0 });
    } catch (err) {
      console.warn("[Copage] Cannot execute script in tab:", tabId, err);
    }
  }
}

// Command listener for keyboard shortcuts (e.g. Alt+C)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-inspector") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await toggleInspectorInTab(tab);
    }
  }
});

// Setup context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copage-inspect",
    title: "Inspect Element with Copage",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "copage-inspect" && tab) {
    await toggleInspectorInTab(tab);
  }
});

