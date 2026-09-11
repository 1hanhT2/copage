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
  | "react-component"
  | "html-tailwind";

export type MessageType =
  | "TOGGLE_INSPECTOR"
  | "INSPECTOR_STATE_CHANGED"
  | "ELEMENT_SELECTED"
  | "GET_INSPECTOR_STATE"
  | "SAVE_CAPTURE";

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
