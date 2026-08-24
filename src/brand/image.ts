import type { BrandColor } from "./types";
import { extractThemeFromPixels } from "./extractTheme";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The image could not be loaded or decoded."));
    image.src = src;
  });
}

function drawScaled(
  image: HTMLImageElement,
  maxDimension: number,
): HTMLCanvasElement {
  const scale = Math.min(
    maxDimension / Math.max(1, image.naturalWidth),
    maxDimension / Math.max(1, image.naturalHeight),
    1,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable in this browser.");
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

/**
 * Reads a logo file and produces a persistent data URL (downscaled to at
 * most 512px so it survives localStorage). Falls back to JPEG-on-white when
 * the PNG payload would be unreasonably large.
 */
export async function fileToLogoDataUrl(file: File): Promise<{
  src: string;
  width: number;
  height: number;
}> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is not an image file.`);
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return canvasToLogoDataUrl(drawScaled(image, 512));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToLogoDataUrl(canvas: HTMLCanvasElement): {
  src: string;
  width: number;
  height: number;
} {
  let src = canvas.toDataURL("image/png");
  if (src.length > 900_000) {
    // Very large PNG (usually a photo used as a logo): composite on white
    // and store JPEG instead so localStorage stays manageable.
    const jpeg = document.createElement("canvas");
    jpeg.width = canvas.width;
    jpeg.height = canvas.height;
    const context = jpeg.getContext("2d");
    if (context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, jpeg.width, jpeg.height);
      context.drawImage(canvas, 0, 0);
      src = jpeg.toDataURL("image/jpeg", 0.85);
    }
  }
  return { src, width: canvas.width, height: canvas.height };
}

/** Extracts the dominant palette of an image already readable as a URL. */
export async function extractThemeFromSrc(
  src: string,
  max = 6,
): Promise<BrandColor[]> {
  const image = await loadImage(src);
  let data: Uint8ClampedArray;
  try {
    const canvas = drawScaled(image, 96);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no-2d");
    data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    throw new Error(
      "Could not read pixel colors from this image (cross-origin restrictions).",
    );
  }
  return extractThemeFromPixels(data, { max }).map((hex) => ({ hex }));
}
