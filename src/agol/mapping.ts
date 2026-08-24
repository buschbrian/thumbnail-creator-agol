import type { AgolSourceInfo } from "./fetchInfo";

export interface Suggestion {
  templateId: string;
  iconId: string;
}

interface TypeRule {
  pattern: RegExp;
  suggestion: Suggestion;
}

/**
 * Ordered most-specific-first. Patterns run against the AGOL type name and
 * then the tag list. Template IDs reference existing entries in
 * `src/templates/`; icon IDs must exist in the generated catalog.
 */
const RULES: ReadonlyArray<TypeRule> = [
  {
    pattern: /\bdashboard\b|operations\s+dashboard|dashboard/i,
    suggestion: { templateId: "dashboard-split", iconId: "dashboard" },
  },
  {
    pattern: /story\s*map|journal|cascade|tour/i,
    suggestion: { templateId: "storymap-centered", iconId: "book" },
  },
  {
    pattern: /survey|form/i,
    suggestion: { templateId: "survey-field", iconId: "formField" },
  },
  {
    pattern: /scene|3d/i,
    suggestion: { templateId: "scene-globe", iconId: "globe" },
  },
  {
    pattern: /image|imagery|raster|lidar|elevation/i,
    suggestion: { templateId: "dataset-minimal", iconId: "image" },
  },
  {
    pattern:
      /web\s*map|webmap|map\s*(service|viewer)|wms|wfs|dynamic/i,
    suggestion: { templateId: "webmap-hero", iconId: "map" },
  },
  {
    pattern:
      /feature|layer|geodatabase|shapefile|geojson|kml|csv|spreadsheet|table|dataset|vector\s*tile|tile/i,
    suggestion: { templateId: "feature-layer-side", iconId: "layers" },
  },
  {
    pattern:
      /app|application|experience|hub|instant|web\s*mapping|dashboard|site|page/i,
    suggestion: { templateId: "instant-app-banner", iconId: "applications" },
  },
];

export const FALLBACK_SUGGESTION: Suggestion = {
  templateId: "side-accent",
  iconId: "map",
};

function firstMatch(haystacks: ReadonlyArray<string>): Suggestion | null {
  for (const rule of RULES) {
    if (haystacks.some((text) => rule.pattern.test(text))) {
      return rule.suggestion;
    }
  }
  return null;
}

/** Picks the closest template + icon from item/service metadata. */
export function suggestForInfo(info: AgolSourceInfo): Suggestion {
  const match = firstMatch([info.typeName, info.tags.join(" ")]);
  return match ?? FALLBACK_SUGGESTION;
}
