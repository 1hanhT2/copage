import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSmartTags,
  generateComponentName,
  createLibraryItemFromElement,
  getLibraryItems,
  saveLibraryItem,
  deleteLibraryItem,
  updateLibraryItem,
  toggleFavoriteLibraryItem,
  clearLibrary,
  isElementInLibrary,
  exportLibraryJson,
  importLibraryJson
} from "../src/lib/storage";
import type { InspectedElementData } from "../src/lib/types";

describe("Component Library & Storage Engine", () => {
  beforeEach(async () => {
    await clearLibrary();
  });

  it("generates intelligent semantic tags based on element tagName and classes", () => {
    expect(generateSmartTags("button", ["btn-primary"])).toContain("Button");
    expect(generateSmartTags("nav", ["main-navigation"])).toContain("Navigation");
    expect(generateSmartTags("div", ["pricing-card", "shadow"])).toContain("Card");
    expect(generateSmartTags("div", ["pricing-card", "shadow"])).toContain("Pricing");
    expect(generateSmartTags("form", ["contact-form"])).toContain("Form");
    expect(generateSmartTags("section", ["hero-banner"])).toContain("Hero");
    expect(generateSmartTags("div", ["modal-dialog", "fade"])).toContain("Modal");
    expect(generateSmartTags("footer", [])).toContain("Footer");
    expect(generateSmartTags("span", ["badge-pill"])).toContain("Badge");
    expect(generateSmartTags("table", [])).toContain("Table");
    expect(generateSmartTags("svg", [])).toContain("Icon");
    expect(generateSmartTags("article", [])).toContain("Section");
    expect(generateSmartTags("span", [])).toContain("SPAN");
  });

  it("generates natural, intuitive component names", () => {
    expect(generateComponentName("button", ["btn-submit"])).toBe("Action Button");
    expect(generateComponentName("div", ["pricing-card"])).toBe("Pricing Card");
    expect(generateComponentName("nav", ["navbar-expand"])).toBe("Navbar");
    expect(generateComponentName("section", ["hero-section"])).toBe("Hero Section");
    expect(generateComponentName("div", ["modal-dialog"])).toBe("Modal Dialog");
    expect(generateComponentName("form", [])).toBe("Form Component");
    expect(generateComponentName("div", ["custom-profile-widget"])).toBe("Custom Profile Widget");
    expect(generateComponentName("div", [])).toBe("Div Component");
  });

  it("creates a complete LibraryItem from InspectedElementData", () => {
    const mockData: InspectedElementData = {
      tagName: "button",
      id: "submit-btn",
      classList: ["btn", "btn-primary"],
      rect: { top: 10, left: 10, width: 140, height: 44, bottom: 54, right: 150 },
      boxModel: {
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 8, right: 16, bottom: 8, left: 16 },
        border: { top: 1, right: 1, bottom: 1, left: 1 }
      },
      cleanHtml: '<button class="btn btn-primary">Submit Form</button>',
      distilledStyles: {
        layout: { display: "inline-flex" },
        boxModel: { padding: "8px 16px" },
        typography: { fontSize: "14px", fontWeight: "600" },
        visual: { backgroundColor: "#2563eb", borderRadius: "8px" },
        transforms: {}
      },
      tailwindClasses: ["inline-flex", "px-4", "py-2", "text-sm", "font-semibold", "bg-[#2563eb]", "rounded-lg"],
      svgAssets: [],
      breadcrumbs: [{ tagName: "button", id: "submit-btn", className: "btn btn-primary", index: 0 }],
      computedFont: "Lexend",
      pageUrl: "https://example.com/checkout",
      pageTitle: "Checkout Page"
    };

    const item = createLibraryItemFromElement(mockData, {
      name: "Checkout Submit Button",
      notes: "Primary call to action on checkout"
    });

    expect(item.id).toMatch(/^lib_/);
    expect(item.name).toBe("Checkout Submit Button");
    expect(item.tagName).toBe("button");
    expect(item.dimensions).toBe("140 × 44px");
    expect(item.cleanHtml).toContain("Submit Form");
    expect(item.tags).toContain("Button");
    expect(item.notes).toBe("Primary call to action on checkout");
    expect(item.favorite).toBe(false);
  });

  it("saves, updates, and retrieves items from library storage", async () => {
    const mockData: InspectedElementData = {
      tagName: "div",
      id: "card-1",
      classList: ["pricing-card"],
      rect: { top: 0, left: 0, width: 300, height: 400, bottom: 400, right: 300 },
      boxModel: {
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        border: { top: 1, right: 1, bottom: 1, left: 1 }
      },
      cleanHtml: '<div class="pricing-card"><h3>Pro Plan</h3></div>',
      distilledStyles: { layout: {}, boxModel: {}, typography: {}, visual: {}, transforms: {} },
      tailwindClasses: ["p-5", "rounded-xl"],
      svgAssets: [],
      breadcrumbs: [],
      computedFont: "Lexend",
      pageUrl: "https://example.com/pricing",
      pageTitle: "Pricing"
    };

    const item1 = createLibraryItemFromElement(mockData);
    await saveLibraryItem(item1);

    const retrieved = await getLibraryItems();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].name).toBe("Pricing Card");
    expect(retrieved[0].tags).toContain("Pricing");

    // Check isElementInLibrary
    const found = await isElementInLibrary("https://example.com/pricing", mockData.cleanHtml);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(item1.id);

    // Update item properties
    await updateLibraryItem(item1.id, { name: "Featured Pro Tier", notes: "Updated note" });
    const afterUpdate = await getLibraryItems();
    expect(afterUpdate[0].name).toBe("Featured Pro Tier");
    expect(afterUpdate[0].notes).toBe("Updated note");

    // Toggle favorite
    await toggleFavoriteLibraryItem(item1.id);
    const afterFav = await getLibraryItems();
    expect(afterFav[0].favorite).toBe(true);

    // Delete item
    await deleteLibraryItem(item1.id);
    const afterDelete = await getLibraryItems();
    expect(afterDelete.length).toBe(0);
  });

  it("exports and imports library as JSON correctly", async () => {
    const mockData: InspectedElementData = {
      tagName: "nav",
      id: "navbar",
      classList: ["navbar"],
      rect: { top: 0, left: 0, width: 1200, height: 64, bottom: 64, right: 1200 },
      boxModel: {
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 }
      },
      cleanHtml: '<nav class="navbar"><a href="/">Home</a></nav>',
      distilledStyles: { layout: {}, boxModel: {}, typography: {}, visual: {}, transforms: {} },
      tailwindClasses: ["h-16", "flex"],
      svgAssets: [],
      breadcrumbs: [],
      computedFont: "Lexend",
      pageUrl: "https://example.com",
      pageTitle: "Home"
    };

    const item = createLibraryItemFromElement(mockData);
    await saveLibraryItem(item);

    const jsonExport = await exportLibraryJson();
    expect(jsonExport).toContain("copage");
    expect(jsonExport).toContain("Navbar");

    // Clear and re-import
    await clearLibrary();
    expect((await getLibraryItems()).length).toBe(0);

    const importResult = await importLibraryJson(jsonExport);
    expect(importResult.added).toBe(1);
    expect(importResult.total).toBe(1);

    const reloaded = await getLibraryItems();
    expect(reloaded.length).toBe(1);
    expect(reloaded[0].cleanHtml).toContain("Home");
  });
});
