import type { BrandColor, BrandKitFile, BrandLogo } from "./types";
import { MAX_BRAND_COLORS } from "./types";

export type ParsedColor = BrandColor;

const TOKEN_RE = /rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/g;
const VAR_RE = /^(?:--|\$)([A-Za-z0-9_-]+)\s*:\s*(.+?);?\s*$/;
const GPL_RE = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s+(.*))?$/;

const HEX_KEYS = ["hex", "color", "value", "fill", "rgb"];
const NAME_KEYS = ["name", "label", "title", "id", "key"];

export function normalizeHex(input: string): string | null {
  let value = input.trim().replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(value)) return null;
  if (value.length === 3 || value.length === 4) {
    value = value
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (value.length === 6 || value.length === 8) {
    value = value.slice(0, 6);
  } else {
    return null;
  }
  return `#${value}`;
}

function parseRgbToken(token: string): string | null {
  const match = token.match(/^rgba?\(([^)]*)\)$/i);
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const channels = parts.slice(0, 3).map((part) => {
    const n = part.endsWith("%")
      ? (parseFloat(part) / 100) * 255
      : parseFloat(part);
    return Number.isFinite(n) ? Math.min(255, Math.max(0, Math.round(n))) : -1;
  });
  if (channels.some((n) => n < 0)) return null;
  return rgbToHexToken(channels[0], channels[1], channels[2]);
}

function rgbToHexToken(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

function prettyName(raw: string): string {
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

function firstColorIn(text: string): string | null {
  for (const token of text.match(TOKEN_RE) ?? []) {
    const hex = token.startsWith("#") ? normalizeHex(token) : parseRgbToken(token);
    if (hex) return hex;
  }
  return null;
}

class Collector {
  private seen = new Set<string>();
  readonly colors: ParsedColor[] = [];

  push(hex: string | null, name?: string): void {
    if (!hex || this.seen.has(hex)) return;
    if (this.colors.length >= MAX_BRAND_COLORS) return;
    this.seen.add(hex);
    const trimmed = name?.trim();
    this.colors.push(trimmed ? { hex, name: trimmed } : { hex });
  }
}

function collectFromJson(value: unknown, out: Collector): void {
  if (Array.isArray(value)) {
    for (const item of value) collectFromJson(item, out);
    return;
  }
  if (typeof value === "string") {
    out.push(
      value.startsWith("rgb")
        ? parseRgbToken(value)
        : normalizeHex(value),
    );
    return;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("colors" in record && Array.isArray(record.colors)) {
      collectFromJson(record.colors, out);
      return;
    }
    let hex: string | null = null;
    let name: string | undefined;
    for (const key of HEX_KEYS) {
      const candidate = record[key];
      if (typeof candidate === "string") {
        hex = candidate.startsWith("rgb")
          ? parseRgbToken(candidate)
          : normalizeHex(candidate);
        if (hex) break;
      }
    }
    for (const key of NAME_KEYS) {
      if (typeof record[key] === "string") {
        name = prettyName(record[key] as string);
        break;
      }
    }
    if (hex) {
      out.push(hex, name);
      return;
    }
    for (const [key, nested] of Object.entries(record)) {
      if (typeof nested === "string") {
        out.push(
          nested.startsWith("rgb")
            ? parseRgbToken(nested)
            : normalizeHex(nested),
          prettyName(key),
        );
      } else if (nested && typeof nested === "object") {
        const nestedRecord = nested as Record<string, unknown>;
        let nestedHex: string | null = null;
        for (const hexKey of HEX_KEYS) {
          const candidate = nestedRecord[hexKey];
          if (typeof candidate === "string") {
            nestedHex = normalizeHex(candidate);
            if (nestedHex) break;
          }
        }
        out.push(nestedHex, prettyName(key));
      }
    }
  }
}

/**
 * Parses brand color specs from the formats organizations actually have:
 * plain hex lists, rgb()/rgba() calls, CSS custom properties, SCSS variables,
 * JSON palettes (arrays or maps of `{name, hex}`), GIMP `.gpl` palettes,
 * Coolors palette URLs, and this app's own `.brandkit.json` exports.
 */
export function parseColorSpecs(text: string): ParsedColor[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const out = new Collector();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      collectFromJson(JSON.parse(trimmed), out);
    } catch {
      /* not valid JSON — fall through to line scanning */
    }
    if (out.colors.length > 0) return out.colors;
  }

  const coolors = trimmed.match(
    /coolors\.co\/(?:palette\/|g\/)?([0-9a-fA-F][0-9a-fA-F-]+)/,
  );
  if (coolors) {
    for (const part of coolors[1].split("-")) {
      out.push(normalizeHex(part));
    }
    if (out.colors.length > 0) return out.colors;
  }

  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const varMatch = line.match(VAR_RE);
    if (varMatch) {
      out.push(firstColorIn(varMatch[2]), prettyName(varMatch[1]));
      continue;
    }

    const gplMatch = line.match(GPL_RE);
    if (gplMatch) {
      const [r, g, b] = [gplMatch[1], gplMatch[2], gplMatch[3]].map((n) =>
        Math.min(255, parseInt(n, 10)),
      );
      const label = (gplMatch[4] ?? "").trim().slice(0, 48);
      out.push(rgbToHexToken(r, g, b), label || undefined);
      continue;
    }

    let pushed = false;
    for (const token of line.match(TOKEN_RE) ?? []) {
      out.push(
        token.startsWith("#") ? normalizeHex(token) : parseRgbToken(token),
      );
      pushed = true;
    }
    if (pushed) continue;

    // Bare hex runs without "#" separators, e.g. "10054d" or
    // "e8400d, f6f5f3 272625" — common when pasting from palette sites.
    if (/^[0-9a-fA-F]{3,8}(?:[\s,]+[0-9a-fA-F]{3,8})*$/.test(line)) {
      for (const run of line.split(/[\s,]+/)) {
        out.push(normalizeHex(run));
      }
    }
  }

  return out.colors;
}

export interface ParsedBrandKit {
  name?: string;
  colors: ParsedColor[];
  logo?: BrandLogo | null;
}

/** Detects and parses this app's own `.brandkit.json` export format. */
export function tryParseBrandKit(text: string): ParsedBrandKit | null {
  try {
    const parsed = JSON.parse(text) as BrandKitFile;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.format !== "thumbnail-maker-brandkit"
    ) {
      return null;
    }
    const colors: ParsedColor[] = [];
    const seen = new Set<string>();
    for (const item of parsed.colors ?? []) {
      const entry: BrandColor | null =
        typeof item === "string"
          ? (() => {
              const hex = normalizeHex(item);
              return hex ? { hex } : null;
            })()
          : item && typeof item.hex === "string"
            ? (() => {
                const hex = normalizeHex(item.hex);
                return hex ? { hex, name: item.name } : null;
              })()
            : null;
      if (entry && !seen.has(entry.hex) && colors.length < MAX_BRAND_COLORS) {
        seen.add(entry.hex);
        colors.push(entry);
      }
    }
    const logo =
      parsed.logo &&
      typeof parsed.logo.src === "string" &&
      parsed.logo.src.startsWith("data:")
        ? parsed.logo
        : null;
    return { name: parsed.name, colors, logo };
  } catch {
    return null;
  }
}
