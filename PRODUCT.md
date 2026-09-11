# Product

<!-- impeccable:product-schema 1 -->

## Platform
browser-extension (Chromium / Chrome Manifest V3, with Firefox WebExtension support planned)

## Stack
TypeScript, Tailwind CSS, Chrome Extension API (Manifest V3), Client-Side LLM SDK / Fetch

## Users
Frontend engineers, fullstack developers, UI/UX designers, prompt engineers, and creators who want to inspect, capture, and reproduce web UI components into code or AI prompts with zero friction.

## Product Purpose
Copage is a developer-first browser extension that allows users to hover over and select any UI element on any webpage, extract its structure, computed styles, and assets, and leverage user-configured LLM providers (OpenRouter, OpenAI-compatible, etc.) to synthesize targeted reproduction prompts or clean component code.

## Positioning
Sits between the raw, manual F12 browser inspector and AI code generators. Rather than manually copying messy, compiled DOM or taking lossy screenshots, Copage extracts clean semantic DOM + computed styles and structures them into rich LLM prompts for Claude, Cursor, v0, ChatGPT, or direct code output.

## Operating Context
Operates inside any web page via an injected content script overlay, supported by a popup / side panel / floating action HUD, options page for configuration, and a background service worker for shortcuts and cross-tab communication.

## Capabilities and Constraints
- **In-Page Hover Inspector:** Real-time element highlight, dimensions tag, selector path, and breadcrumbs without modifying or breaking the host page's styling or events.
- **Deep Element Extraction:** Sanitized DOM tree, computed typography/colors/layout styles, SVG paths, and image assets.
- **BYOK (Bring Your Own Key):** Users configure API keys for OpenRouter or OpenAI-compatible endpoints.
- **Strict Privacy:** Keys and inspected data are stored locally (`chrome.storage.local`); requests are sent directly to the selected LLM endpoint without intermediary servers.
- **Performance:** Inspector overlay must add negligible overhead (< 16ms per frame), ensuring fluid 60fps scrolling and hover transitions on heavy host pages.

## Brand Commitments
- Precision developer aesthetics: clean hairline HUD, readable typography, clear hierarchy.
- Non-invasive: must never interfere with or break host web page layouts or event handling.
- Instant response: zero lag when entering/exiting inspect mode.

## Product Principles
- **Respect the Host Page:** The inspector lives in an isolated shadow DOM or protective container to guarantee zero CSS bleeding both ways.
- **Developer Agency (BYOK):** The developer controls their model choice, API keys, and prompt output formats.
- **Signal Over Noise:** Extract semantic essence and key styling without dumping megabytes of minified DOM noise to the LLM.
