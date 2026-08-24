export const ARCGIS_SERVICE_TYPES = [
  "MapServer",
  "FeatureServer",
  "ImageServer",
  "SceneServer",
  "VectorTileServer",
  "StreamServer",
] as const;

export type AgolServiceType = (typeof ARCGIS_SERVICE_TYPES)[number];

const SERVICE_TYPE_SET = new Set<string>(ARCGIS_SERVICE_TYPES);

const ITEM_ID_RE = /^[0-9a-f]{32}$/i;

export type AgolTarget =
  | {
      kind: "item";
      id: string;
      /** Root of the sharing REST API, e.g. https://www.arcgis.com/sharing/rest */
      sharingBase: string;
      sourceUrl: string;
    }
  | {
      kind: "service";
      /** Normalized REST endpoint ending at the service type. */
      url: string;
      serviceType: AgolServiceType;
      sourceUrl: string;
    };

function sharingBaseFromParts(origin: string, pathPrefix: string): string {
  const cleanPrefix = pathPrefix.replace(/\/+$/, "");
  return `${origin}${cleanPrefix}/sharing/rest`;
}

/**
 * Accepts the URL shapes organizations actually paste:
 * - item pages: https://org.maps.arcgis.com/home/item.html?id=<32-hex>
 * - portal item pages: https://portal.example.com/arcgis/home/item.html?id=<32-hex>
 * - sharing REST items: https://www.arcgis.com/sharing/rest/content/items/<32-hex>
 * - bare 32-character item IDs
 * - ArcGIS Server services: …/rest/services/Folder/Name/FeatureServer[/0][?f=json]
 * Returns null for anything unrecognized.
 */
export function parseAgolInput(rawInput: string): AgolTarget | null {
  const raw = rawInput.trim();
  if (!raw) return null;

  if (ITEM_ID_RE.test(raw)) {
    const sharingBase = "https://www.arcgis.com/sharing/rest";
    return {
      kind: "item",
      id: raw.toLowerCase(),
      sharingBase,
      sourceUrl: `${sharingBase}/content/items/${raw.toLowerCase()}`,
    };
  }

  let text = raw;
  if (!/^https?:\/\//i.test(text)) {
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(text)) text = `https://${text}`;
    else return null;
  }

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }

  const path = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");

  const queryId = url.searchParams.get("id");
  if (queryId && ITEM_ID_RE.test(queryId)) {
    const homeIndex = path.toLowerCase().indexOf("/home/");
    const prefix =
      homeIndex >= 0 ? path.slice(0, homeIndex) : path.replace(/\/[^/]*$/, "");
    const sharingBase = sharingBaseFromParts(url.origin, prefix);
    return {
      kind: "item",
      id: queryId.toLowerCase(),
      sharingBase,
      sourceUrl: `${sharingBase}/content/items/${queryId.toLowerCase()}`,
    };
  }

  const sharingMatch = path.match(
    /\/sharing\/rest\/content\/items\/([0-9a-f]{32})(?:$|\/)/i,
  );
  if (sharingMatch) {
    const prefix = path
      .slice(0, path.toLowerCase().indexOf("/sharing/rest"))
      .replace(/\/+$/, "");
    const sharingBase = sharingBaseFromParts(url.origin, prefix);
    return {
      kind: "item",
      id: sharingMatch[1].toLowerCase(),
      sharingBase,
      sourceUrl: `${sharingBase}/content/items/${sharingMatch[1].toLowerCase()}`,
    };
  }

  const servicesIndex = path.toLowerCase().search(/\/(?:rest\/)?services\//i);
  if (servicesIndex >= 0) {
    const basePath = path.slice(0, servicesIndex);
    const tail = path
      .slice(servicesIndex)
      .replace(/^\/(?:rest\/)?services\//i, "")
      .split("/");
    const typeIndex = tail.findIndex((segment) =>
      SERVICE_TYPE_SET.has(segment),
    );
    if (typeIndex >= 0) {
      const serviceSegments = tail.slice(0, typeIndex + 1);
      const serviceType = serviceSegments[
        serviceSegments.length - 1
      ] as AgolServiceType;
      const normalized = `${url.origin}${basePath}/rest/services/${serviceSegments.join("/")}`;
      return { kind: "service", url: normalized, serviceType, sourceUrl: normalized };
    }
  }

  return null;
}
