import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const iconsPackage = require("@esri/calcite-ui-icons");

const EXCLUDE_PATTERN =
  /(chevron|caret|arrow|cursor|triangle|bracket|handle|margin|indent)/i;

const INCLUDE_PATTERNS = [
  /^(map|layer|basemap|globe|world|pin|locator|compass|zoom|search|magnif)/,
  /^(gear|settings|user|users|group|people|person|contact)/,
  /^(chart|graph|data|table|database|server|cloud|code|browser|web|app)/,
  /^(file|folder|description|application|dashboard|home|office|building|city|urban)/,
  /^(road|highway|street|car|truck|bus|bicycle|walk|pedestrian|plane|airplane|airport|boat|ship|anchor|heli|drone|rail|train|ferry|traffic|navigation|direction)/,
  /^(tree|forest|leaf|plant|flower|garden|park|nature|seed|sprout|grass|animal|bird|fish|paw|dog|cat|horse|live|farm|agricultur|crop|wheat|tractor|bug|insect|deer|bear|wolf|turtle|egg)/,
  /^(mountain|terrain|hill|volcano|peak|cave|desert|water|drop|wave|river|lake|ocean|sea|beach|coast|rain|snow|sun|moon|cloud|storm|lightning|thunder|tornado|hurricane|umbrella|temperature|thermometer|wind|fog|hail)/,
  /^(fire|flame|smoke|flood|earthquake|disaster|emergency|hospital|doctor|health|medical|police|shield|siren|ambulance)/,
  /^(school|education|book|library|graduation|learn|science|lab|experiment|telescope|microscope|atom|brain|idea|bulb)/,
  /^(bank|dollar|money|credit|wallet|shopping|cart|store|tag|price|coin|cash|finance|report)/,
  /^(industry|factory|power|energy|electric|bolt|gas|oil|coal|mine|recycle|trash|waste|battery|solar|nuclear|dam|windmill)/,
  /^(star|heart|flag|bookmark|award|ribbon|trophy|medal|badge|thumbs)/,
  /^(calendar|clock|time|hourglass|history|schedule|event)/,
  /^(envelope|email|phone|address|link|share|download|upload|save|print|copy|paste|duplicate)/,
  /^(camera|image|picture|photo|gallery|video|play|media|music|sound|audio|microphone)/,
  /^(draw|edit|pen|pencil|erase|measure|ruler|polygon|vertex|sketch|legend|key|lock|unlock|eye|hide|show|visible|invisible)/,
  /^(check|approve|close|x|plus|minus|add|remove|delete|trash|refresh|rotate|move|drag|resize|expand|collapse)/,
  /^(grid|tile|list|menu|ellipsis|grip)/,
];

const MAX_ICONS = 220;

function normalizePaths(value) {
  const raw = typeof value === "string" ? [value] : value;
  return raw.map((entry) =>
    typeof entry === "string" ? { d: entry } : { d: entry.d, opacity: entry.opacity },
  );
}

function humanize(id) {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const entries = Object.entries(iconsPackage)
  .filter(([key]) => key.endsWith("16"))
  .map(([key, value]) => [key.slice(0, -2), value])
  .filter(([id]) => !EXCLUDE_PATTERN.test(id))
  .filter(([id]) => INCLUDE_PATTERNS.some((pattern) => pattern.test(id)))
  .sort(([a], [b]) => a.localeCompare(b))
  .slice(0, MAX_ICONS);

if (entries.length < 50) {
  console.error(
    `[generate-icon-index] Only found ${entries.length} icons — include patterns may be stale.`,
  );
  process.exit(1);
}

const iconLines = entries.map(([id, value]) => {
  const pathArgs = normalizePaths(value)
    .map((p) =>
      p.opacity === undefined
        ? `{ d: ${JSON.stringify(p.d)} }`
        : `{ d: ${JSON.stringify(p.d)}, opacity: ${JSON.stringify(p.opacity)} }`,
    )
    .join(", ");
  return `  { id: ${JSON.stringify(id)}, label: ${JSON.stringify(humanize(id))}, paths: [${pathArgs}] },`;
});

const output = `export interface IconPathEntry {
  d: string;
  opacity?: string;
}

export interface IconDefinition {
  id: string;
  label: string;
  paths: IconPathEntry[];
}

export const ICON_CATALOG: readonly IconDefinition[] = [
${iconLines.join("\n")}
];

const ICON_MAP = new Map(ICON_CATALOG.map((icon) => [icon.id, icon]));

export function findIcon(id: string): IconDefinition | undefined {
  return ICON_MAP.get(id);
}
`;

mkdirSync(join("src", "icons", "generated"), { recursive: true });
writeFileSync(join("src", "icons", "generated", "iconData.ts"), output);
console.log(`[generate-icon-index] Wrote catalog with ${entries.length} icons.`);
