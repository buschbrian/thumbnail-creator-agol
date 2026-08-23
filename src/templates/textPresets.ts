import { COLORS } from "../constants";
import type { DocumentSpec, LayerDraft, TextLayer } from "../state/types";

export type TextPresetKind = "heading" | "subtitle" | "body" | "impact" | "label";

export const TEXT_PRESETS: ReadonlyArray<{
  kind: TextPresetKind;
  label: string;
  description: string;
  previewStyle: React.CSSProperties;
}> = [
  {
    kind: "heading",
    label: "Heading",
    description: "Bold title line",
    previewStyle: { fontSize: "1.05rem", fontWeight: 700 },
  },
  {
    kind: "subtitle",
    label: "Subtitle",
    description: "Supporting line under a heading",
    previewStyle: { fontSize: "0.82rem", color: "var(--am-ash)" },
  },
  {
    kind: "body",
    label: "Body text",
    description: "Small paragraph copy",
    previewStyle: { fontSize: "0.74rem", fontWeight: 400 },
  },
  {
    kind: "impact",
    label: "Impact",
    description: "Oversized poster statement",
    previewStyle: {
      fontSize: "1.3rem",
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1,
    },
  },
  {
    kind: "label",
    label: "Label chip",
    description: "Spaced uppercase kicker",
    previewStyle: {
      fontSize: "0.66rem",
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
    },
  },
];

export function buildTextPreset(kind: TextPresetKind, doc: DocumentSpec): LayerDraft {
  const base = {
    type: "text",
    x: Math.round(doc.width * 0.07),
    y: Math.round(doc.height * 0.1),
    opacity: 1,
    visible: true,
    fontId: "avenir",
    italic: false,
    align: "left",
    width: Math.round(doc.width * 0.8),
    lineHeight: 1.15,
    letterSpacing: 0,
  } as Partial<TextLayer>;

  switch (kind) {
    case "heading":
      return {
        ...base,
        name: "Heading",
        text: doc.title || "Your heading",
        fontSize: Math.max(20, Math.round(doc.height * 0.12)),
        fontWeight: 700,
        color: COLORS.white,
        y: Math.round(doc.height * 0.08),
      } as LayerDraft;
    case "subtitle":
      return {
        ...base,
        name: "Subtitle",
        text: "A short supporting line",
        fontSize: Math.max(13, Math.round(doc.height * 0.06)),
        fontWeight: 400,
        color: COLORS.white,
        y: Math.round(doc.height * 0.26),
      } as LayerDraft;
    case "body":
      return {
        ...base,
        name: "Body",
        text: "Add a sentence of context here.",
        fontSize: Math.max(11, Math.round(doc.height * 0.042)),
        fontWeight: 400,
        lineHeight: 1.35,
        color: COLORS.white,
        y: Math.round(doc.height * 0.4),
      } as LayerDraft;
    case "impact":
      return {
        ...base,
        name: "Impact",
        text: "BIG\nSTATEMENT",
        fontSize: Math.max(34, Math.round(doc.height * 0.24)),
        fontWeight: 700,
        lineHeight: 0.95,
        letterSpacing: -Math.round(doc.height * 0.006),
        color: COLORS.white,
        width: Math.round(doc.width * 0.86),
        y: Math.round(doc.height * 0.14),
      } as LayerDraft;
    case "label":
      return {
        ...base,
        name: "Label",
        text: "NEW · 2026",
        fontSize: Math.max(11, Math.round(doc.height * 0.038)),
        fontWeight: 700,
        letterSpacing: Math.max(2, Math.round(doc.height * 0.02)),
        color: COLORS.accent,
        y: Math.round(doc.height * 0.09),
      } as LayerDraft;
  }
}
