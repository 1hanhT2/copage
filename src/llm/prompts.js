export function buildPromptForTarget(data, target) {
    const { tagName, classList, rect, distilledStyles, tailwindClasses, cleanHtml, svgAssets, computedFont, pageUrl, pageTitle } = data;
    const layoutInfo = Object.entries(distilledStyles.layout).map(([k, v]) => `${k}: ${v}`).join(", ") || "default";
    const boxInfo = Object.entries(distilledStyles.boxModel).map(([k, v]) => `${k}: ${v}`).join(", ") || "default";
    const typoInfo = Object.entries(distilledStyles.typography).map(([k, v]) => `${k}: ${v}`).join(", ") || "default";
    const visualInfo = Object.entries(distilledStyles.visual).map(([k, v]) => `${k}: ${v}`).join(", ") || "default";
    const svgSummary = svgAssets.length > 0
        ? svgAssets.map((s, i) => `Icon #${i + 1}: viewBox="${s.viewBox}"${s.suggestedLucideIcon ? ` (Suggest Lucide '${s.suggestedLucideIcon}')` : ""}`).join("\n")
        : "None";
    // Shared context block
    const contextBlock = `
Source: ${pageTitle} (${pageUrl})
Element: <${tagName}> with classes [${classList.slice(0, 5).join(" ")}]
Dimensions: ${rect.width}px × ${rect.height}px
Font: ${computedFont}
Layout: ${layoutInfo}
Box Model: ${boxInfo}
Typography: ${typoInfo}
Visual: ${visualInfo}
Tailwind Equivalents: ${tailwindClasses.join(" ")}
Vector Assets:
${svgSummary}

Extracted Clean HTML:
\`\`\`html
${cleanHtml}
\`\`\`
`.trim();
    if (target === "cursor") {
        return {
            system: "You are an expert fullstack frontend engineer specializing in React 19, TypeScript, and modern Tailwind CSS. Output clean, modular, and accessible code.",
            prompt: `
Reproduce the following web UI component in React + Tailwind CSS:

${contextBlock}

Requirements for Cursor Composer:
1. Output a single self-contained TypeScript React component.
2. Use standard Tailwind utility classes; do NOT use fixed arbitrary pixel widths for containers (use fluid w-full, max-w-*, flex, grid).
3. Import icons from 'lucide-react' matching the vector assets above.
4. Include typed props interface and realistic interactive states (hover, active, focus-visible).
5. Ensure accessible markup (semantic elements, aria labels).
`.trim()
        };
    }
    if (target === "claude") {
        return {
            system: "You are a world-class UI/UX engineer and design technologist. You reproduce interfaces with meticulous attention to typography, spacing rhythm, and fluid responsive design.",
            prompt: `
Please analyze and recreate this UI component:

${contextBlock}

Guidelines:
- Deconstruct the visual hierarchy and layout rhythm.
- Rebuild using React + Tailwind CSS with clean code architecture.
- Maintain exact visual fidelity (colors, borders, typography, spacing) while ensuring responsiveness on mobile (375px) and desktop (1280px+).
- Map any icons to Lucide icons.
`.trim()
        };
    }
    if (target === "v0") {
        return {
            system: "You are a component generator for v0 and 21st.dev. You output single-file, production-grade React components styled with Tailwind CSS.",
            prompt: `
Recreate this component for 21st.dev / v0:

${contextBlock}

Rules:
- Output only the self-contained component.
- Use Tailwind CSS and Lucide React icons.
- Add smooth micro-interactions and transitions.
`.trim()
        };
    }
    if (target === "html-tailwind") {
        return {
            system: "You are an HTML and Tailwind CSS converter. You output pure HTML with Tailwind utility classes.",
            prompt: `
Convert this extracted DOM and computed styles into clean, modern semantic HTML with Tailwind CSS:

${contextBlock}

Output only the clean HTML snippet with Tailwind classes.
`.trim()
        };
    }
    // Default: react-component
    return {
        system: "You are an expert React and Tailwind CSS developer. When provided with extracted DOM and CSS metrics, you produce clean, production-ready TSX code. Output code only inside ```tsx blocks without conversational filler.",
        prompt: `
Generate a production-ready React component based on this inspected element:

${contextBlock}

Specifications:
- Language: TypeScript + React (functional component)
- Styling: Tailwind CSS
- Icons: 'lucide-react'
- Structure: Typed props interface, accessible semantics, responsive layout
- Prohibitions: No fixed desktop pixel wrappers (e.g. no w-[432px]), no external CSS dependencies.
`.trim()
    };
}
