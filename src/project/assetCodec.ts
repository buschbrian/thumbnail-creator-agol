import type { DesignState, Layer } from "../state/types";

const PORTABLE_IMAGE_RE = /^data:image\/(?:png|jpeg|webp);base64,/i;
const BASE64_CHUNK_SIZE = 0x8000;

export class ProjectAssetEncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectAssetEncodingError";
  }
}

export interface AssetCodecOptions {
  fetchObjectUrl?: (src: string) => Promise<Blob>;
}

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function detectRasterMime(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (
    hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + BASE64_CHUNK_SIZE),
    );
  }
  return btoa(binary);
}

async function fetchObjectUrl(src: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(src);
  } catch {
    throw new ProjectAssetEncodingError(
      "The session image is no longer available. Add it again and retry.",
    );
  }
  if (!response.ok) {
    throw new ProjectAssetEncodingError(
      "The session image could not be read. Add it again and retry.",
    );
  }
  return response.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const mime = detectRasterMime(bytes);
  if (!mime) {
    throw new ProjectAssetEncodingError(
      "Only PNG, JPEG, or WebP image content can be embedded.",
    );
  }
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

async function portableSource(
  layer: Extract<Layer, { type: "backgroundImage" | "logo" }>,
  fetchBlob: (src: string) => Promise<Blob>,
): Promise<string> {
  if (PORTABLE_IMAGE_RE.test(layer.src)) return layer.src;

  try {
    return await blobToDataUrl(await fetchBlob(layer.src));
  } catch (error) {
    if (error instanceof ProjectAssetEncodingError) {
      throw new ProjectAssetEncodingError(
        `Could not embed “${layer.name}”. ${error.message}`,
      );
    }
    throw new ProjectAssetEncodingError(
      `Could not embed “${layer.name}”. The session image could not be read.`,
    );
  }
}

/** Returns a detached design whose image layers are safe to persist to disk. */
export async function embedProjectAssets(
  state: DesignState,
  options: AssetCodecOptions = {},
): Promise<DesignState> {
  const fetchBlob = options.fetchObjectUrl ?? fetchObjectUrl;
  // Check all sources before reading any assets; portableSource only receives local URLs.
  for (const layer of state.layers) {
    if (
      (layer.type === "backgroundImage" || layer.type === "logo") &&
      !PORTABLE_IMAGE_RE.test(layer.src) &&
      !layer.src.startsWith("blob:")
    ) {
      throw new ProjectAssetEncodingError(
        `Could not embed “${layer.name}”. Only local session images can be exported.`,
      );
    }
  }
  const layers = await Promise.all(
    state.layers.map(async (layer): Promise<Layer> => {
      if (layer.type !== "backgroundImage" && layer.type !== "logo") {
        return { ...layer };
      }
      return { ...layer, src: await portableSource(layer, fetchBlob) };
    }),
  );

  return {
    doc: { ...state.doc },
    backgroundColor: state.backgroundColor,
    layers,
  };
}
