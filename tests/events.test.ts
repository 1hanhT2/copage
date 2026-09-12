import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventManager, KeyboardNavHandlers } from "../src/content/events";

describe("EventManager", () => {
  let navHandlers: KeyboardNavHandlers;
  let onSelect: (target: Element) => void;
  let manager: EventManager;

  beforeEach(() => {
    onSelect = vi.fn();
    navHandlers = {
      onParent: vi.fn(),
      onChild: vi.fn(),
      onPrevSibling: vi.fn(),
      onNextSibling: vi.fn(),
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };
    manager = new EventManager(onSelect, navHandlers);
  });

  afterEach(() => {
    manager.disable();
    document.body.innerHTML = "";
  });

  it("intercepts click on page elements and triggers onSelect", () => {
    manager.enable();

    const button = document.createElement("button");
    button.textContent = "Click Me";
    document.body.appendChild(button);

    button.click();

    expect(onSelect).toHaveBeenCalledWith(button);
  });

  it("ignores clicks originating from inside copage-inspector-root", () => {
    manager.enable();

    const host = document.createElement("copage-inspector-root");
    const innerBtn = document.createElement("button");
    innerBtn.textContent = "Dock Button";
    host.appendChild(innerBtn);
    document.body.appendChild(host);

    innerBtn.click();

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("handles keyboard navigation keys on host page", () => {
    manager.enable();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(navHandlers.onParent).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(navHandlers.onChild).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(navHandlers.onPrevSibling).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(navHandlers.onNextSibling).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(navHandlers.onConfirm).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(navHandlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not trigger page navigation when keydown occurs inside copage-inspector-root", () => {
    manager.enable();

    const host = document.createElement("copage-inspector-root");
    const modelTrigger = document.createElement("div");
    modelTrigger.setAttribute("role", "combobox");
    host.appendChild(modelTrigger);
    document.body.appendChild(host);

    // Dispatch ArrowDown from inside dock control
    modelTrigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true }));

    // Should NOT trigger onChild page traversal
    expect(navHandlers.onChild).not.toHaveBeenCalled();

    // Escape inside dock should still trigger onCancel
    modelTrigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
    expect(navHandlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not hijack navigation keys when typing in input or textarea", () => {
    manager.enable();

    const input = document.createElement("input");
    document.body.appendChild(input);

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, composed: true }));
    expect(navHandlers.onPrevSibling).not.toHaveBeenCalled();

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
    expect(navHandlers.onCancel).toHaveBeenCalledTimes(1);
  });
});
