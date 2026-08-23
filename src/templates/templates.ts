import type { DocumentSpec, LayerDraft, ShapeLayer, TextLayer } from "../state/types";
import { COLORS } from "../constants";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  swatch: [string, string];
  build: (doc: DocumentSpec) => LayerDraft[];
}

function makeTitle(doc: DocumentSpec, overrides: Partial<TextLayer> = {}): LayerDraft {
  return {
    type: "text",
    name: "Title",
    x: Math.round(doc.width * 0.05),
    y: Math.round(doc.height * 0.05),
    opacity: 1,
    visible: true,
    text: doc.title,
    fontId: "avenir",
    fontSize: Math.max(18, Math.round(doc.height * 0.11)),
    fontWeight: 700,
    italic: false,
    color: COLORS.white,
    align: "left",
    width: Math.round(doc.width * 0.7),
    lineHeight: 1.15,
    letterSpacing: 0,
    ...overrides,
  };
}

function makeSubtitle(doc: DocumentSpec, overrides: Partial<TextLayer> = {}): LayerDraft {
  return makeTitle(doc, {
    name: "Subtitle",
    text: "Add a short subtitle",
    fontWeight: 400,
    color: "#d6d6d6",
    fontSize: Math.max(12, Math.round(doc.height * 0.055)),
    ...overrides,
  });
}

function makeBand(doc: DocumentSpec, overrides: Partial<ShapeLayer> = {}): LayerDraft {
  return {
    type: "shape",
    name: "Band",
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    shape: "rectangle",
    width: doc.width,
    height: Math.round(doc.height * 0.18),
    fill: COLORS.ink,
    cornerRadius: 0,
    ...overrides,
  };
}

export const TEMPLATES: readonly TemplateDefinition[] = [
  {
    id: "footer-dark",
    name: "Footer band · Dark",
    description: "Bottom band with title and accent rule",
    swatch: [COLORS.ink, COLORS.accent],
    build: (doc) => {
      const bandHeight = Math.round(doc.height * 0.18);
      const bandY = doc.height - bandHeight;
      return [
        makeBand(doc, { name: "Footer band", y: bandY, height: bandHeight, fill: COLORS.ink }),
        makeBand(doc, {
          name: "Accent rule",
          y: bandY - 4,
          height: 4,
          fill: COLORS.accent,
        }),
        makeTitle(doc, {
          y: bandY + Math.round(bandHeight * 0.12),
          fontSize: Math.max(16, Math.round(bandHeight * 0.36)),
          width: Math.round(doc.width * 0.9),
        }),
        makeSubtitle(doc, {
          y: bandY + Math.round(bandHeight * 0.56),
          fontSize: Math.max(11, Math.round(bandHeight * 0.22)),
          width: Math.round(doc.width * 0.9),
        }),
      ];
    },
  },
  {
    id: "footer-light",
    name: "Footer band · Light",
    description: "Light bottom band with blue edge",
    swatch: [COLORS.light, COLORS.accent],
    build: (doc) => {
      const bandHeight = Math.round(doc.height * 0.18);
      const bandY = doc.height - bandHeight;
      return [
        makeBand(doc, { name: "Footer band", y: bandY, height: bandHeight, fill: COLORS.light }),
        makeBand(doc, {
          name: "Edge accent",
          y: bandY,
          height: bandHeight,
          width: Math.max(6, Math.round(doc.width * 0.008)),
          fill: COLORS.accent,
        }),
        makeTitle(doc, {
          y: bandY + Math.round(bandHeight * 0.12),
          fontSize: Math.max(16, Math.round(bandHeight * 0.36)),
          color: COLORS.ink,
          width: Math.round(doc.width * 0.9),
        }),
        makeSubtitle(doc, {
          y: bandY + Math.round(bandHeight * 0.56),
          fontSize: Math.max(11, Math.round(bandHeight * 0.22)),
          color: COLORS.gray,
          width: Math.round(doc.width * 0.9),
        }),
      ];
    },
  },
  {
    id: "side-accent",
    name: "Accent sidebar",
    description: "Vertical accent bar with side title",
    swatch: [COLORS.accent, COLORS.white],
    build: (doc) => {
      const barWidth = Math.max(20, Math.round(doc.width * 0.06));
      return [
        makeBand(doc, {
          name: "Sidebar",
          width: barWidth,
          height: doc.height,
          fill: COLORS.accent,
        }),
        makeTitle(doc, {
          x: barWidth + Math.round(doc.width * 0.04),
          y: Math.round(doc.height * 0.08),
          fontSize: Math.max(18, Math.round(doc.height * 0.1)),
          width: doc.width - barWidth - Math.round(doc.width * 0.08),
        }),
        makeSubtitle(doc, {
          x: barWidth + Math.round(doc.width * 0.04),
          y: Math.round(doc.height * 0.26),
          fontSize: Math.max(12, Math.round(doc.height * 0.055)),
          color: "#eaeaea",
          width: doc.width - barWidth - Math.round(doc.width * 0.08),
        }),
      ];
    },
  },
  {
    id: "top-banner-navy",
    name: "Top banner · Navy",
    description: "Navy banner across the top",
    swatch: [COLORS.accentDark, COLORS.white],
    build: (doc) => {
      const bandHeight = Math.round(doc.height * 0.17);
      return [
        makeBand(doc, { name: "Banner", height: bandHeight, fill: COLORS.accentDark }),
        makeTitle(doc, {
          y: Math.round(bandHeight * 0.14),
          fontSize: Math.max(16, Math.round(bandHeight * 0.4)),
          width: Math.round(doc.width * 0.9),
        }),
        makeSubtitle(doc, {
          y: Math.round(bandHeight * 0.6),
          fontSize: Math.max(11, Math.round(bandHeight * 0.24)),
          width: Math.round(doc.width * 0.9),
        }),
      ];
    },
  },
  {
    id: "corner-chip",
    name: "Corner chip",
    description: "Compact translucent title chip",
    swatch: ["rgba(21,21,21,0.85)", COLORS.white],
    build: (doc) => {
      const pad = Math.round(doc.width * 0.04);
      const chipWidth = Math.round(doc.width * 0.55);
      const chipHeight = Math.round(doc.height * 0.22);
      return [
        makeBand(doc, {
          name: "Chip",
          x: pad,
          y: pad,
          width: chipWidth,
          height: chipHeight,
          fill: "rgba(21,21,21,0.85)",
          cornerRadius: Math.max(4, Math.round(chipHeight * 0.12)),
        }),
        makeTitle(doc, {
          x: pad + Math.round(chipWidth * 0.06),
          y: pad + Math.round(chipHeight * 0.16),
          fontSize: Math.max(15, Math.round(chipHeight * 0.34)),
          width: Math.round(chipWidth * 0.88),
        }),
      ];
    },
  },
  {
    id: "blank",
    name: "Blank canvas",
    description: "Remove all template layers",
    swatch: ["transparent", "#bfbfbf"],
    build: () => [],
  },
] as const;

export function findTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
