import { rgbDistance, hexToRgb, rgbToHex } from "./colorMath";

export interface ExtractThemeOptions {
  max?: number;
  minDistance?: number;
}

interface Bucket {
  r: number;
  g: number;
  b: number;
  count: number;
}

/**
 * Pure pixel-bucketing palette extractor. `data` is RGBA bytes as returned
 * by canvas getImageData. Transparent pixels are ignored; buckets quantize
 * each channel to 16 levels, then the most frequent buckets become swatches
 * subject to a minimum perceptual distance so near-duplicates collapse.
 */
export function extractThemeFromPixels(
  data: Uint8ClampedArray,
  options: ExtractThemeOptions = {},
): string[] {
  const max = Math.max(1, options.max ?? 6);
  const minDistance = options.minDistance ?? 52;

  const buckets = new Map<number, Bucket>();
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 125) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const picked: Array<readonly [number, number, number]> = [];
  const hexes: string[] = [];

  for (const bucket of sorted) {
    if (picked.length >= max) break;
    const avg: [number, number, number] = [
      bucket.r / bucket.count,
      bucket.g / bucket.count,
      bucket.b / bucket.count,
    ];
    let tooClose = false;
    for (const existing of picked) {
      if (rgbDistance(avg, existing) < minDistance) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      picked.push(avg);
      hexes.push(rgbToHex(avg[0], avg[1], avg[2]));
    }
  }

  return hexes;
}

export function sortColorsByLuminance(
  hexes: readonly string[],
  direction: "dark-first" | "light-first",
): string[] {
  return [...hexes].sort((a, b) => {
    const delta = relative(a) - relative(b);
    return direction === "dark-first" ? delta : -delta;
  });
}

function relative(hex: string): number {
  // Inline luminance to keep this module dependency-light for callers.
  const [r, g, b] = hexToRgb(hex);
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
