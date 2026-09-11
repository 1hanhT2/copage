import type { ExtensionMessage } from "../lib/types";

async function toggleInspectorInTab(tabId: number) {
  try {
    // Try sending message first
    await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
  } catch {
    // Content script is not running in this tab (e.g. open before extension installed/reloaded)
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
      // Small delay for script initialization
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, { type: "TOGGLE_INSPECTOR" } as ExtensionMessage);
        } catch (e) {
          console.error("Failed to toggle after injection:", e);
        }
      }, 50);
    } catch (err) {
      console.warn("Cannot execute script in tab:", tabId, err);
    }
  }
}

// Command listener for keyboard shortcuts (e.g. Alt+C)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-inspector") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await toggleInspectorInTab(tab.id);
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
    await toggleInspectorInTab(tab.id);
  }
});
