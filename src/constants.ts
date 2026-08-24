export const COLORS = {
  accent: "#e8400d",
  accentDark: "#10054d",
  ink: "#272625",
  gray: "#6d6c6b",
  light: "#ecebea",
  white: "#ffffff",
} as const;

export interface FontOption {
  id: string;
  label: string;
  css: string;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: "avenir",
    label: "Avenir / Esri style",
    css: '"Avenir Next", Avenir, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "georgia", label: "Georgia", css: 'Georgia, "Times New Roman", serif' },
  { id: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "trebuchet", label: "Trebuchet MS", css: '"Trebuchet MS", Tahoma, sans-serif' },
  { id: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { id: "courier", label: "Courier New", css: '"Courier New", Courier, monospace' },
];

export function getFontCss(fontId: string): string {
  return FONT_OPTIONS.find((f) => f.id === fontId)?.css ?? FONT_OPTIONS[0].css;
}

export const DEFAULT_BACKGROUND_COLOR = "#efece7";

export const QUICK_PALETTE: readonly string[] = [
  "#ffffff",
  "#f6f5f3",
  "#272625",
  "#10054d",
  "#e8400d",
  "#ffd7f0",
  "#b7efb2",
  "#ffef99",
];
