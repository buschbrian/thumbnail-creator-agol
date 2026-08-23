const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IEND_TYPE = [0x49, 0x45, 0x4e, 0x44];
const TEXT_TYPE = [0x74, 0x45, 0x58, 0x74];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function latin1Safe(text: string): string {
  return text.replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

function pngChunk(type: readonly number[], data: Uint8Array): Uint8Array {
  const length = data.length;
  const out = new Uint8Array(12 + length);
  const view = new DataView(out.buffer);
  view.setUint32(0, length);
  out.set(type, 4);
  out.set(data, 8);
  const crcInput = new Uint8Array(4 + length);
  crcInput.set(type, 0);
  crcInput.set(data, 4);
  view.setUint32(8 + length, crc32(crcInput));
  return out;
}

function pngTextChunk(keyword: string, value: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(latin1Safe(keyword));
  const valueBytes = new TextEncoder().encode(latin1Safe(value));
  const data = new Uint8Array(keywordBytes.length + 1 + valueBytes.length);
  data.set(keywordBytes, 0);
  data[keywordBytes.length] = 0;
  data.set(valueBytes, keywordBytes.length + 1);
  return pngChunk(TEXT_TYPE, data);
}

function findIendOffset(bytes: Uint8Array): number {
  for (let i = bytes.length - 4; i >= 8; i--) {
    if (
      bytes[i] === IEND_TYPE[0] &&
      bytes[i + 1] === IEND_TYPE[1] &&
      bytes[i + 2] === IEND_TYPE[2] &&
      bytes[i + 3] === IEND_TYPE[3]
    ) {
      return i - 4;
    }
  }
  return -1;
}

export interface ImageMetadata {
  title: string;
  description: string;
}

export async function embedPngMetadata(
  blob: Blob,
  metadata: ImageMetadata,
): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (
    bytes.length < 16 ||
    !PNG_SIGNATURE.every((b, i) => bytes[i] === b)
  ) {
    throw new Error("Exported file is not a valid PNG.");
  }
  const iendOffset = findIendOffset(bytes);
  if (iendOffset < 0) throw new Error("PNG is missing its IEND chunk.");

  const chunks = [
    pngTextChunk("Title", metadata.title),
    pngTextChunk("Description", metadata.description),
    pngTextChunk("Alt Text", metadata.description),
    pngTextChunk("Software", "ArcGIS Thumbnail Maker"),
  ];
  const insertLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(bytes.length + insertLength);
  out.set(bytes.subarray(0, iendOffset), 0);
  let cursor = iendOffset;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  out.set(bytes.subarray(iendOffset), cursor);
  return new Blob([out], { type: "image/png" });
}

export async function embedJpegMetadata(
  blob: Blob,
  metadata: ImageMetadata,
): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Exported file is not a valid JPEG.");
  }
  const payload = latin1Safe(
    `${metadata.title}\n${metadata.description}`,
  ).replace(/\xff/g, ".");
  const encoded = new TextEncoder().encode(payload);
  const segment = new Uint8Array(4 + encoded.length);
  segment[0] = 0xff;
  segment[1] = 0xfe;
  segment[2] = ((encoded.length + 2) >> 8) & 0xff;
  segment[3] = (encoded.length + 2) & 0xff;
  segment.set(encoded, 4);

  const out = new Uint8Array(2 + segment.length + (bytes.length - 2));
  out.set(bytes.subarray(0, 2), 0);
  out.set(segment, 2);
  out.set(bytes.subarray(2), 2 + segment.length);
  return new Blob([out], { type: "image/jpeg" });
}
