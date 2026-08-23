import type { DocumentSpec, LayerDraft, TextLayer } from "../state/types";
import { COLORS } from "../constants";
import type { TemplateDefinition } from "./templateKit";
import { makeBand, makeSubtitle, makeText } from "./templateKit";

function title(doc: DocumentSpec, overrides: Partial<TextLayer> = {}): LayerDraft {
  return makeText(doc, overrides);
}

function subtitle(doc: DocumentSpec, overrides: Partial<TextLayer> = {}): LayerDraft {
  return makeSubtitle(doc, overrides);
}

export const ESSENTIAL_TEMPLATES: readonly TemplateDefinition[] = [
  {
    id: "footer-dark",
    name: "Footer band · Dark",
    category: "Essentials",
    description: "Bottom band with title and accent rule",
    swatch: [COLORS.ink, COLORS.accent],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const bandHeight = Math.round(doc.height * 0.18);
      const bandY = doc.height - bandHeight;
      return [
        makeBand(doc, { name: "Footer band", y: bandY, height: bandHeight }),
        makeBand(doc, { name: "Accent rule", y: bandY - 4, height: 4 }),
        title(doc, {
          y: bandY + Math.round(bandHeight * 0.12),
          fontSize: Math.max(16, Math.round(bandHeight * 0.36)),
          width: Math.round(doc.width * 0.9),
        }),
        subtitle(doc, {
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
    category: "Essentials",
    description: "Light bottom band with accent edge",
    swatch: [COLORS.light, COLORS.accent],
    build: (doc: DocumentSpec): LayerDraft[] => {
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
        title(doc, {
          y: bandY + Math.round(bandHeight * 0.12),
          fontSize: Math.max(16, Math.round(bandHeight * 0.36)),
          color: COLORS.ink,
          width: Math.round(doc.width * 0.9),
        }),
        subtitle(doc, {
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
    category: "Essentials",
    description: "Vertical accent bar with side title",
    swatch: [COLORS.accent, COLORS.white],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const barWidth = Math.max(20, Math.round(doc.width * 0.06));
      return [
        makeBand(doc, { name: "Sidebar", width: barWidth, height: doc.height }),
        title(doc, {
          x: barWidth + Math.round(doc.width * 0.04),
          y: Math.round(doc.height * 0.08),
          fontSize: Math.max(18, Math.round(doc.height * 0.1)),
          width: doc.width - barWidth - Math.round(doc.width * 0.08),
        }),
        subtitle(doc, {
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
    name: "Top banner · Indigo",
    category: "Essentials",
    description: "Midnight indigo banner across the top",
    swatch: [COLORS.accentDark, COLORS.white],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const bandHeight = Math.round(doc.height * 0.17);
      return [
        makeBand(doc, { name: "Banner", height: bandHeight, fill: COLORS.accentDark }),
        title(doc, {
          y: Math.round(bandHeight * 0.14),
          fontSize: Math.max(16, Math.round(bandHeight * 0.4)),
          width: Math.round(doc.width * 0.9),
        }),
        subtitle(doc, {
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
    category: "Essentials",
    description: "Compact translucent title chip",
    swatch: ["rgba(39,38,37,0.85)", COLORS.white],
    build: (doc: DocumentSpec): LayerDraft[] => {
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
          fill: "rgba(39,38,37,0.85)",
          cornerRadius: Math.max(4, Math.round(chipHeight * 0.12)),
        }),
        title(doc, {
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
    category: "Essentials",
    description: "Remove all template layers",
    swatch: ["#ffffff", "#b1b1af"],
    build: (): LayerDraft[] => [],
  },
];
