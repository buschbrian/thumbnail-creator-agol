import { useBrandStore } from "../brand/brandStore";
import { relativeLuminance } from "../brand/colorMath";
import { COLORS } from "../constants";
import { fetchImageAsObjectUrl, type AgolSourceInfo } from "./fetchInfo";
import { suggestForInfo } from "./mapping";
import { findTemplate } from "../templates/templates";
import { pauseHistory, resumeHistory, useEditorStore } from "../state/store";
import type { IconLayer, ShapeLayer, TextLayer } from "../state/types";

export interface GenerateOptions {
  /** Explicit template override; otherwise auto-matched from metadata. */
  templateId?: string;
  /** Use the item's existing thumbnail as the background image. */
  useExistingThumbnail: boolean;
  /** Recolor accent/band colors using the imported brand kit. */
  tintWithBrand: boolean;
}

export interface GenerateResult {
  templateId: string;
  usedBackgroundImage: boolean;
  tintedWithBrand: boolean;
}

const FALLBACK_ID = "side-accent";

function saturation(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/**
 * Builds a complete thumbnail from ArcGIS metadata. Runs through normal
 * store actions while history recording is paused; the pre-generation
 * document snapshot is then pushed onto the undo stack explicitly so the
 * whole generation collapses into a single undo step.
 */
export async function generateFromAgol(
  info: AgolSourceInfo,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const before = pickHistorySlice(useEditorStore.getState());
  pauseHistory();
  try {
    const suggestion = suggestForInfo(info);
    const template =
      (options.templateId ? findTemplate(options.templateId) : undefined) ??
      findTemplate(suggestion.templateId) ??
      findTemplate(FALLBACK_ID);
    const templateId = template?.id ?? FALLBACK_ID;

    const store = useEditorStore.getState();
    store.setTitle(info.title.slice(0, 80));
    store.applyTemplate(templateId);

    // applyTemplate stamps the template category; the real AGOL type is better.
    useEditorStore.getState().setItemType(info.typeName);

    replacePlaceholderText(info);

    let usedBackgroundImage = false;
    if (
      options.useExistingThumbnail &&
      info.thumbnailAbsoluteUrl &&
      info.kind === "item"
    ) {
      try {
        const objectUrl = await fetchImageAsObjectUrl(info.thumbnailAbsoluteUrl);
        useEditorStore.getState().setBackgroundImage(objectUrl);
        usedBackgroundImage = true;
      } catch {
        /* thumbnail is optional — skip silently */
      }
    }

    let tintedWithBrand = false;
    if (options.tintWithBrand) {
      tintedWithBrand = applyBrandTint();
    }

    commitHistoryBaseline(before);
    return { templateId, usedBackgroundImage, tintedWithBrand };
  } catch (error) {
    useEditorStore.setState(before);
    throw error;
  } finally {
    resumeHistory();
  }
}

type HistorySlice = Pick<
  ReturnType<typeof useEditorStore.getState>,
  "doc" | "backgroundColor" | "layers"
>;

function pickHistorySlice(state: ReturnType<typeof useEditorStore.getState>): HistorySlice {
  return { doc: state.doc, backgroundColor: state.backgroundColor, layers: state.layers };
}

function commitHistoryBaseline(before: HistorySlice): void {
  const temporal = useEditorStore.temporal.getState();
  temporal.clear();
  useEditorStore.temporal.setState({
    pastStates: [...temporal.pastStates, before],
    futureStates: [],
  });
}

function replacePlaceholderText(info: AgolSourceInfo): void {
  const state = useEditorStore.getState();
  for (const layer of state.layers) {
    if (layer.type !== "text") continue;
    const textLayer = layer as TextLayer;
    if (/^add a short subtitle/i.test(textLayer.text)) {
      if (info.snippet) {
        state.updateLayer(textLayer.id, { text: info.snippet });
      }
      continue;
    }
    if (/^item type$/i.test(layer.name)) {
      state.updateLayer(textLayer.id, { text: `${info.typeName} · ${info.owner ?? "ArcGIS Online"}` });
    }
  }
}

function applyBrandTint(): boolean {
  const brandColors = useBrandStore.getState().colors;
  if (brandColors.length === 0) return false;

  const sortedByLuminance = [...brandColors].sort(
    (a, b) => relativeLuminance(a.hex) - relativeLuminance(b.hex),
  );
  const darkest = sortedByLuminance[0];
  const vivid =
    [...brandColors].sort((a, b) => saturation(b.hex) - saturation(a.hex))[0] ??
    darkest;

  const state = useEditorStore.getState();
  const darkEnough = relativeLuminance(darkest.hex) < 0.45;

  for (const layer of state.layers) {
    switch (layer.type) {
      case "shape": {
        const shape = layer as ShapeLayer;
        if (shape.fill.toLowerCase() === COLORS.accent.toLowerCase()) {
          state.updateLayer(shape.id, { fill: vivid.hex });
        } else if (
          darkEnough &&
          shape.fill.toLowerCase() === COLORS.ink.toLowerCase()
        ) {
          state.updateLayer(shape.id, { fill: darkest.hex });
        }
        break;
      }
      case "icon": {
        const icon = layer as IconLayer;
        if (icon.color.toLowerCase() === COLORS.accent.toLowerCase()) {
          state.updateLayer(icon.id, { color: vivid.hex });
        }
        break;
      }
      case "backgroundImage":
      case "logo":
      case "text":
        break;
    }
  }

  if (darkEnough && !state.layers.some((l) => l.type === "backgroundImage")) {
    state.setBackgroundColor(darkest.hex);
  }
  return true;
}
