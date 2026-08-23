import type { DocumentSpec, Layer } from "../state/types";
import { findIcon } from "../icons/generated/iconData";

const MAX_RECOMMENDED_CHARS = 125;

export function generateAltText(doc: DocumentSpec, layers: Layer[]): string {
  const title = doc.title.trim() || "Untitled item";
  const itemType = doc.itemType?.trim();

  const background = layers.find((l) => l.type === "backgroundImage");
  const textLayers = layers.filter((l) => l.type === "text" && l.visible);
  const iconLayers = layers.filter((l) => l.type === "icon" && l.visible);
  const hasLogo = layers.some((l) => l.type === "logo" && l.visible);
  const shapeCount = layers.filter((l) => l.type === "shape" && l.visible).length;

  const parts: string[] = [];

  parts.push(
    itemType
      ? `Thumbnail for the ArcGIS Online ${itemType.toLowerCase()} "${title}"`
      : `Thumbnail for the ArcGIS Online item "${title}"`,
  );

  const visual: string[] = [];
  visual.push(background ? "a photo background" : "a flat background");
  if (textLayers.length > 0) visual.push("title text");
  if (iconLayers.length > 0) {
    const labels = new Set<string>();
    for (const layer of iconLayers) {
      if (layer.type !== "icon") continue;
      const def = findIcon(layer.iconId);
      labels.add(def?.label?.toLowerCase() ?? "symbol");
      if (labels.size >= 3) break;
    }
    visual.push(`${[...labels].join(" and ")} symbol${labels.size > 1 ? "s" : ""}`);
  }
  if (hasLogo) visual.push("an organization logo");
  if (shapeCount >= 2 && textLayers.length === 0) visual.push("graphic panels");

  return `${parts[0]} with ${visual.join(", ")}.`;
}

export function resolveAltText(doc: DocumentSpec, layers: Layer[]): string {
  const override = (doc.altTextOverride ?? "").trim();
  return override.length > 0 ? override : generateAltText(doc, layers);
}

export function altTextHealth(text: string): {
  level: "good" | "long" | "empty";
  hint: string;
} {
  const length = text.trim().length;
  if (length === 0) {
    return { level: "empty", hint: "Alt text is required for accessibility." };
  }
  if (length > MAX_RECOMMENDED_CHARS) {
    return {
      level: "long",
      hint: `${length} characters — consider trimming to ~${MAX_RECOMMENDED_CHARS} for screen readers.`,
    };
  }
  return { level: "good", hint: `${length} characters — good length.` };
}
