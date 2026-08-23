import type { DocumentSpec, LayerDraft } from "../state/types";
import { COLORS } from "../constants";
import type { TemplateDefinition } from "./templateKit";
import {
  makeBand,
  makeGhostIcon,
  makeIconChip,
  makeSubtitle,
  makeText,
} from "./templateKit";

export const ITEM_TEMPLATES_A: readonly TemplateDefinition[] = [
  {
    id: "webmap-hero",
    name: "Web map · Hero band",
    category: "Web map",
    description: "Charcoal title band with map badge",
    iconId: "map",
    swatch: [COLORS.ink, COLORS.accent],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const bandHeight = Math.round(doc.height * 0.2);
      const bandY = doc.height - bandHeight;
      const chip = Math.round(bandHeight * 0.66);
      const contentX = Math.round(doc.width * 0.05) + chip + Math.round(doc.width * 0.03);
      return [
        makeBand(doc, { name: "Footer band", y: bandY, height: bandHeight }),
        makeBand(doc, { name: "Accent rule", y: bandY - 4, height: 4 }),
        ...makeIconChip(doc, "map", {
          chipX: Math.round(doc.width * 0.05),
          chipY: bandY + Math.round((bandHeight - chip) / 2),
          chipSize: chip,
        }),
        makeText(doc, {
          x: contentX,
          y: bandY + Math.round(bandHeight * 0.14),
          fontSize: Math.max(16, Math.round(bandHeight * 0.34)),
          width: Math.round(doc.width * 0.62),
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "Interactive web map · ArcGIS Online",
          x: contentX,
          y: bandY + Math.round(bandHeight * 0.58),
          fontSize: Math.max(10, Math.round(bandHeight * 0.2)),
          width: Math.round(doc.width * 0.62),
        }),
      ];
    },
  },
  {
    id: "feature-layer-side",
    name: "Feature layer · Sidebar",
    category: "Feature layer",
    description: "Accent sidebar with ghost layers watermark",
    iconId: "layers",
    swatch: [COLORS.accent, COLORS.white],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const barWidth = Math.max(22, Math.round(doc.width * 0.065));
      const textX = barWidth + Math.round(doc.width * 0.045);
      const textWidth = doc.width - textX - Math.round(doc.width * 0.06);
      return [
        makeGhostIcon(doc, "layers", COLORS.white),
        makeBand(doc, { name: "Sidebar", width: barWidth, height: doc.height }),
        makeText(doc, {
          x: textX,
          y: Math.round(doc.height * 0.12),
          fontSize: Math.max(20, Math.round(doc.height * 0.11)),
          width: textWidth,
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "Feature layer · ArcGIS Online",
          x: textX,
          y: Math.round(doc.height * 0.32),
          fontSize: Math.max(12, Math.round(doc.height * 0.055)),
          color: "#f0f0f0",
          width: textWidth,
        }),
      ];
    },
  },
  {
    id: "dashboard-split",
    name: "Dashboard · Stat split",
    category: "Dashboard",
    description: "Indigo header, chart badge and stat tiles",
    iconId: "dashboard",
    swatch: [COLORS.accentDark, "#b7efb2"],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const headerH = Math.round(doc.height * 0.42);
      const chip = Math.round(headerH * 0.52);
      const contentX = Math.round(doc.width * 0.06) + chip + Math.round(doc.width * 0.03);
      const tileW = Math.round(doc.width * 0.26);
      const tileH = Math.round(doc.height * 0.16);
      const tileY = Math.round(headerH + doc.height * 0.14);
      const gap = Math.round(doc.width * 0.055);
      const startX = Math.round((doc.width - (tileW * 3 + gap * 2)) / 2);
      const statTiles = [0, 1, 2].map<LayerDraft>((i) =>
        makeBand(doc, {
          name: `Stat tile ${i + 1}`,
          x: startX + i * (tileW + gap),
          y: tileY,
          width: tileW,
          height: tileH,
          fill: "#ffffff",
          cornerRadius: Math.round(tileH * 0.16),
        }),
      );
      return [
        makeGhostIcon(doc, "dashboard", "#ffffff"),
        makeBand(doc, { name: "Header", height: headerH, fill: COLORS.accentDark }),
        ...makeIconChip(doc, "graphBar", {
          chipX: Math.round(doc.width * 0.06),
          chipY: Math.round((headerH - chip) / 2),
          chipSize: chip,
          chipFill: COLORS.accent,
        }),
        makeText(doc, {
          x: contentX,
          y: Math.round(headerH * 0.24),
          fontSize: Math.max(17, Math.round(headerH * 0.3)),
          width: Math.round(doc.width * 0.6),
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "Operations dashboard",
          x: contentX,
          y: Math.round(headerH * 0.6),
          fontSize: Math.max(11, Math.round(headerH * 0.18)),
          width: Math.round(doc.width * 0.6),
        }),
        ...statTiles,
      ];
    },
  },
  {
    id: "storymap-centered",
    name: "Story map · Centered",
    category: "Story map",
    description: "Editorial centered title with hairline rules",
    iconId: "book",
    swatch: ["#efece7", COLORS.ink],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const centerX = Math.round(doc.width * 0.14);
      const centerW = Math.round(doc.width * 0.72);
      return [
        makeBand(doc, {
          name: "Top rule",
          x: centerX,
          y: Math.round(doc.height * 0.24),
          width: centerW,
          height: 2,
          fill: COLORS.accent,
        }),
        makeText(doc, {
          x: centerX,
          y: Math.round(doc.height * 0.33),
          fontSize: Math.max(22, Math.round(doc.height * 0.13)),
          align: "center",
          width: centerW,
          color: COLORS.ink,
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "A story about places and change",
          x: centerX,
          y: Math.round(doc.height * 0.56),
          fontSize: Math.max(11, Math.round(doc.height * 0.05)),
          align: "center",
          color: COLORS.gray,
          width: centerW,
        }),
        makeBand(doc, {
          name: "Bottom rule",
          x: centerX,
          y: Math.round(doc.height * 0.71),
          width: centerW,
          height: 2,
          fill: COLORS.accent,
        }),
      ];
    },
  },
];
