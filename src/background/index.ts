import type { ExtensionMessage } from "../lib/types";

// Command listener for keyboard shortcuts (e.g. Alt+C)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-inspector") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
      } catch {
        // Tab might be chrome:// or restricted page
      }
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
  if (info.menuItemId === "copage-inspect" && tab && tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
    } catch {}
  }
});
