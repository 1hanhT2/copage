/**
 * Copage Dynamic Favicon Synchronizer
 * Automatically synchronizes the active favicon with the user's OS/browser color scheme.
 * - Mini Logo 1 (white "c" + chromatic torus "o") for Dark Mode
 * - Mini Logo 2 (dark "c" + chromatic torus "o") for White / Light Mode
 */

export function setupDynamicFavicon(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const getFaviconUrl = (filename: string): string => {
    try {
      if (typeof chrome !== "undefined" && chrome?.runtime?.getURL) {
        return chrome.runtime.getURL(`assets/${filename}`);
      }
    } catch {
      // Fallback if chrome.runtime is unavailable
    }
    return `/assets/${filename}`;
  };

  const updateFavicon = (isDark: boolean): void => {
    const filename = isDark ? "favicon-dark.png" : "favicon-light.png";
    const href = getFaviconUrl(filename);

    let activeLink = document.querySelector<HTMLLinkElement>("link[rel='icon']:not([media])");
    if (!activeLink) {
      activeLink = document.createElement("link");
      activeLink.rel = "icon";
      activeLink.type = "image/png";
      document.head.appendChild(activeLink);
    }
    activeLink.href = href;
  };

  // Synchronize on initialization
  updateFavicon(mediaQuery.matches);

  // Dynamically update when theme changes
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", (event: MediaQueryListEvent) => {
      updateFavicon(event.matches);
    });
  } else if (typeof (mediaQuery as any).addListener === "function") {
    (mediaQuery as any).addListener((event: MediaQueryListEvent) => {
      updateFavicon(event.matches);
    });
  }
}
