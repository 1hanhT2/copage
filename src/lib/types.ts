export interface BoxEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BreadcrumbItem {
  tagName: string;
  id: string;
  className: string;
  index: number;
}

export interface SvgAsset {
  viewBox: string;
  width: number;
  height: number;
  svgString: string;
  suggestedLucideIcon?: string;
}

export interface DistilledStyles {
  layout: Record<string, string>;
  boxModel: Record<string, string>;
  typography: Record<string, string>;
  visual: Record<string, string>;
  transforms: Record<string, string>;
}

export interface InspectedElementData {
  tagName: string;
  id: string;
  classList: string[];
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  };
  boxModel: {
    margin: BoxEdges;
    padding: BoxEdges;
    border: BoxEdges;
  };
  cleanHtml: string;
  distilledStyles: DistilledStyles;
  tailwindClasses: string[];
  svgAssets: SvgAsset[];
  breadcrumbs: BreadcrumbItem[];
  computedFont: string;
  cssVariables?: Record<string, string>;
  pageUrl: string;
  pageTitle: string;
}

export type LLMProvider = "openrouter" | "openai-compatible";

export interface UserPreferences {
  pruneNoise: boolean;
  mapTailwind: boolean;
  extractSvgs: boolean;
  autoCopy: boolean;
  deepShadow: boolean;
  frameworkTarget: "react" | "vue" | "svelte" | "html";
  autoSaveToLibrary?: boolean;
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  customSystemPrompt?: string;
}

export type PromptTarget =
  | "cursor"
  | "claude"
  | "v0"
  | "opencode"
  | "codex"
  | "react-component"
  | "html-tailwind";

export type MessageType =
  | "TOGGLE_INSPECTOR"
  | "INSPECTOR_STATE_CHANGED"
  | "ELEMENT_SELECTED"
  | "GET_INSPECTOR_STATE"
  | "SAVE_CAPTURE"
  | "SAVE_TO_LIBRARY"
  | "GET_LIBRARY_ITEMS"
  | "LIBRARY_UPDATED"
  | "OPEN_LIBRARY";

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface RecentCapture {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  tagName: string;
  dimensions: string;
  summary: string;
  cleanHtml: string;
  reproductionPrompt: string;
}

export interface LibraryItem {
  id: string;
  timestamp: number;
  url: string;
  pageTitle: string;
  name: string;
  tagName: string;
  classList: string[];
  dimensions: string;
  summary: string;
  cleanHtml: string;
  distilledStyles?: DistilledStyles;
  tailwindClasses?: string[];
  svgAssets?: SvgAsset[];
  reproductionPrompt?: string;
  generatedCode?: string;
  tags: string[];
  notes?: string;
  favorite?: boolean;
}

