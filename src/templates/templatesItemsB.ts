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

export const ITEM_TEMPLATES_B: readonly TemplateDefinition[] = [
  {
    id: "instant-app-banner",
    name: "App · Indigo banner",
    category: "App",
    description: "Deep indigo banner with app badge",
    iconId: "applications",
    swatch: [COLORS.accentDark, COLORS.white],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const bandHeight = Math.round(doc.height * 0.19);
      const chip = Math.round(bandHeight * 0.64);
      const contentX =
        Math.round(doc.width * 0.05) + chip + Math.round(doc.width * 0.028);
      return [
        makeBand(doc, { name: "Banner", height: bandHeight, fill: COLORS.accentDark }),
        ...makeIconChip(doc, "applications", {
          chipX: Math.round(doc.width * 0.05),
          chipY: Math.round((bandHeight - chip) / 2),
          chipSize: chip,
          chipFill: COLORS.accent,
          radius: Math.round(chip * 0.28),
        }),
        makeText(doc, {
          x: contentX,
          y: Math.round(bandHeight * 0.16),
          fontSize: Math.max(16, Math.round(bandHeight * 0.36)),
          width: Math.round(doc.width * 0.66),
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "Web app · ArcGIS Online",
          x: contentX,
          y: Math.round(bandHeight * 0.6),
          fontSize: Math.max(10, Math.round(bandHeight * 0.2)),
          width: Math.round(doc.width * 0.66),
        }),
      ];
    },
  },
  {
    id: "scene-globe",
    name: "Scene · 3D split",
    category: "Scene",
    description: "Diagonal ink split with globe watermark",
    iconId: "globe",
    swatch: [COLORS.ink, "#99fff9"],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const splitW = Math.round(doc.width * 0.62);
      const skew = Math.round(doc.height * 0.3);
      return [
        {
          type: "shape",
          name: "Diagonal panel",
          x: -skew,
          y: 0,
          opacity: 1,
          visible: true,
          shape: "rectangle",
          width: splitW + skew,
          height: doc.height,
          fill: COLORS.ink,
          cornerRadius: 0,
          rotation: 0,
        },
        makeGhostIcon(doc, "globe", "#ffffff"),
        makeText(doc, {
          x: Math.round(doc.width * 0.06),
          y: Math.round(doc.height * 0.16),
          fontSize: Math.max(20, Math.round(doc.height * 0.115)),
          width: Math.round(doc.width * 0.5),
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "3D scene · ArcGIS Online",
          x: Math.round(doc.width * 0.06),
          y: Math.round(doc.height * 0.4),
          fontSize: Math.max(12, Math.round(doc.height * 0.055)),
          color: "#e3e3e3",
          width: Math.round(doc.width * 0.5),
        }),
        {
          type: "icon",
          name: "Globe badge",
          x: Math.round(doc.width * 0.68),
          y: Math.round(doc.height * 0.34),
          opacity: 1,
          visible: true,
          iconId: "globe",
          size: Math.round(doc.height * 0.3),
          color: COLORS.white,
        },
      ];
    },
  },
  {
    id: "survey-field",
    name: "Survey · Field kit",
    category: "Survey",
    description: "Mint chip and clean title stack",
    iconId: "formField",
    swatch: ["#b7efb2", COLORS.ink],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const chip = Math.round(doc.height * 0.17);
      return [
        makeGhostIcon(doc, "formField", COLORS.ink),
        ...makeIconChip(doc, "formField", {
          chipX: Math.round(doc.width * 0.06),
          chipY: Math.round(doc.height * 0.1),
          chipSize: chip,
          chipFill: "#2f7d4f",
          radius: Math.round(chip * 0.24),
          label: "Survey",
        }),
        makeText(doc, {
          x: Math.round(doc.width * 0.06),
          y: Math.round(doc.height * 0.42),
          fontSize: Math.max(19, Math.round(doc.height * 0.11)),
          color: COLORS.ink,
          width: Math.round(doc.width * 0.86),
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "Field survey · ArcGIS Online",
          x: Math.round(doc.width * 0.06),
          y: Math.round(doc.height * 0.62),
          fontSize: Math.max(11, Math.round(doc.height * 0.05)),
          color: COLORS.gray,
          width: Math.round(doc.width * 0.86),
        }),
      ];
    },
  },
  {
    id: "dataset-minimal",
    name: "Dataset · Minimal",
    category: "Dataset",
    description: "Quiet title with table badge and underline",
    iconId: "table",
    swatch: ["#ecebea", COLORS.accent],
    build: (doc: DocumentSpec): LayerDraft[] => {
      const chip = Math.round(doc.height * 0.16);
      const underlineY = Math.round(doc.height * 0.62);
      return [
        makeGhostIcon(doc, "table", COLORS.ink),
        makeText(doc, {
          x: Math.round(doc.width * 0.07),
          y: Math.round(doc.height * 0.24),
          fontSize: Math.max(20, Math.round(doc.height * 0.12)),
          color: COLORS.ink,
          width: Math.round(doc.width * 0.84),
        }),
        makeBand(doc, {
          name: "Underline",
          x: Math.round(doc.width * 0.07),
          y: underlineY,
          width: Math.round(doc.width * 0.2),
          height: 5,
          fill: COLORS.accent,
          cornerRadius: 3,
        }),
        ...makeIconChip(doc, "table", {
          chipX: Math.round(doc.width * 0.07),
          chipY: Math.round(doc.height * 0.72),
          chipSize: chip,
          chipFill: COLORS.ink,
          radius: Math.round(chip * 0.22),
          label: "Dataset",
        }),
        makeSubtitle(doc, {
          name: "Item type",
          text: "Hosted table · ArcGIS Online",
          x: Math.round(doc.width * 0.07) + chip + Math.round(doc.width * 0.025),
          y: Math.round(doc.height * 0.76),
          fontSize: Math.max(11, Math.round(doc.height * 0.048)),
          color: COLORS.gray,
          width: Math.round(doc.width * 0.6),
        }),
      ];
    },
  },
];
