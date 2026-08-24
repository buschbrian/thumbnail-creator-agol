import type { AgolServiceType, AgolTarget } from "./parseInput";

export interface AgolSourceInfo {
  kind: "item" | "service";
  title: string;
  /** Human display type, e.g. "Web Map", "Feature layer", "Imagery layer". */
  typeName: string;
  snippet?: string;
  owner?: string;
  tags: string[];
  thumbnailAbsoluteUrl?: string;
  sourceUrl: string;
}

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** Strips HTML markup and collapses whitespace (service descriptions are HTML). */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITY_MAP[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(0, cut.lastIndexOf(" ")))}…`;
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error(
      "Could not reach the server. Check the URL and your connection.",
    );
  }
  if (!response.ok) {
    throw new Error(
      `The server responded with HTTP ${response.status}. Private items need to be shared publicly.`,
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned a response that is not JSON.");
  }
  if (
    data &&
    typeof data === "object" &&
    "error" in (data as Record<string, unknown>)
  ) {
    const error = (data as Record<string, unknown>).error as
      | { message?: string; code?: number }
      | undefined;
    throw new Error(
      error?.message
        ? `ArcGIS error${error.code ? ` (${error.code})` : ""}: ${error.message}`
        : "The ArcGIS service returned an error for this URL.",
    );
  }
  return (data ?? {}) as Record<string, unknown>;
}

const SERVICE_TYPE_NAMES: Record<AgolServiceType, string> = {
  MapServer: "Map service",
  FeatureServer: "Feature layer",
  ImageServer: "Imagery layer",
  SceneServer: "Scene layer",
  VectorTileServer: "Vector tile layer",
  StreamServer: "Stream layer",
};

function serviceTitle(json: Record<string, unknown>, target: AgolTarget & { kind: "service" }): string {
  const candidates = [
    json.mapName,
    json.serviceName,
    json.name,
  ].filter((v): v is string => typeof v === "string" && v.trim() !== "");
  if (candidates.length > 0) return candidates[0].trim();
  // Fall back to the folder segment before the service type.
  const match = target.url.match(/\/services\/(.+)\/[A-Za-z]+Server$/i);
  if (match) {
    const segments = match[1].split("/");
    const last = segments[segments.length - 1];
    if (last) return last;
  }
  return "Untitled service";
}

function itemInfoFromJson(
  json: Record<string, unknown>,
  target: Extract<AgolTarget, { kind: "item" }>,
): AgolSourceInfo {
  const title =
    typeof json.title === "string" && json.title.trim()
      ? json.title.trim()
      : "Untitled item";
  const typeName =
    typeof json.type === "string" && json.type.trim()
      ? json.type.trim()
      : "ArcGIS item";
  const snippet =
    typeof json.snippet === "string" && plainText(json.snippet)
      ? truncate(plainText(json.snippet))
      : typeof json.description === "string" && plainText(json.description)
        ? truncate(plainText(json.description))
        : undefined;
  const tags = Array.isArray(json.tags)
    ? json.tags.filter((t): t is string => typeof t === "string")
    : [];
  const thumbnailAbsoluteUrl =
    typeof json.thumbnail === "string" && json.thumbnail
      ? `${target.sharingBase}/content/items/${target.id}/info/${json.thumbnail.replace(/^\/+/, "")}`
      : undefined;
  return {
    kind: "item",
    title,
    typeName,
    snippet,
    owner: typeof json.owner === "string" ? json.owner : undefined,
    tags,
    thumbnailAbsoluteUrl,
    sourceUrl: target.sourceUrl,
  };
}

function serviceInfoFromJson(
  json: Record<string, unknown>,
  target: Extract<AgolTarget, { kind: "service" }>,
): AgolSourceInfo {
  const description =
    typeof json.serviceDescription === "string" && json.serviceDescription
      ? json.serviceDescription
      : typeof json.description === "string"
        ? json.description
        : "";
  const text = plainText(description);
  return {
    kind: "service",
    title: serviceTitle(json, target),
    typeName: SERVICE_TYPE_NAMES[target.serviceType],
    snippet: text ? truncate(text) : undefined,
    tags: [],
    sourceUrl: target.sourceUrl,
  };
}

export async function fetchAgolInfo(target: AgolTarget): Promise<AgolSourceInfo> {
  if (target.kind === "item") {
    const json = await fetchJson(`${target.sourceUrl}?f=pjson`);
    return itemInfoFromJson(json, target);
  }
  const json = await fetchJson(`${target.url}?f=pjson`);
  return serviceInfoFromJson(json, target);
}

/**
 * Re-fetches a remote image as a blob so the export canvas is never tainted.
 * Returns an object URL valid for this session only.
 */
export async function fetchImageAsObjectUrl(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Could not download image: ${url}`);
  }
  if (!response.ok) {
    throw new Error(`Image request failed (HTTP ${response.status}).`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
