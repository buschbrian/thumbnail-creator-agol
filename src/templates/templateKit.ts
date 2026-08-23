import type { DocumentSpec, LayerDraft, ShapeLayer, TextLayer } from "../state/types";
import { COLORS } from "../constants";

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  iconId?: string;
  swatch: [string, string];
  build: (doc: DocumentSpec) => LayerDraft[];
}

export function makeText(
  doc: DocumentSpec,
  overrides: Partial<TextLayer> = {},
): LayerDraft {
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

export function makeSubtitle(
  doc: DocumentSpec,
  overrides: Partial<TextLayer> = {},
): LayerDraft {
  return makeText(doc, {
    name: "Subtitle",
    text: "Add a short subtitle",
    fontWeight: 400,
    color: "#d6d6d6",
    fontSize: Math.max(12, Math.round(doc.height * 0.055)),
    ...overrides,
  });
}

export function makeBand(
  doc: DocumentSpec,
  overrides: Partial<ShapeLayer> = {},
): LayerDraft {
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

export interface ChipOptions {
  chipX: number;
  chipY: number;
  chipSize: number;
  chipFill?: string;
  iconColor?: string;
  radius?: number;
  label?: string;
}

export function makeIconChip(
  _doc: DocumentSpec,
  iconId: string,
  opts: ChipOptions,
): LayerDraft[] {
  const pad = Math.round(opts.chipSize * 0.22);
  const iconSize = opts.chipSize - pad * 2;
  const label = opts.label ?? "Badge";
  return [
    {
      type: "shape",
      name: `${label} chip`,
      x: opts.chipX,
      y: opts.chipY,
      opacity: 1,
      visible: true,
      shape: "rectangle",
      width: opts.chipSize,
      height: opts.chipSize,
      fill: opts.chipFill ?? COLORS.accent,
      cornerRadius: opts.radius ?? Math.round(opts.chipSize * 0.2),
    },
    {
      type: "icon",
      name: `${label} icon`,
      x: opts.chipX + pad,
      y: opts.chipY + pad,
      opacity: 1,
      visible: true,
      iconId,
      size: iconSize,
      color: opts.iconColor ?? COLORS.white,
    },
  ];
}

export function makeGhostIcon(
  doc: DocumentSpec,
  iconId: string,
  color: string,
): LayerDraft {
  const size = Math.round(Math.min(doc.width, doc.height) * 0.92);
  return {
    type: "icon",
    name: "Watermark",
    x: Math.round(doc.width - size * 0.72),
    y: Math.round(doc.height - size * 0.72),
    opacity: 0.09,
    visible: true,
    iconId,
    size,
    color,
  };
}
