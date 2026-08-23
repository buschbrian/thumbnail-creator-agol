import { describe, expect, it } from "vitest";
import { embedJpegMetadata, embedPngMetadata } from "./metadata";

function crc32(bytes: Uint8Array): number {
  let c: number;
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function minimalPng(): Uint8Array<ArrayBuffer> {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = new Uint8Array(13);
  const ihdrType = Uint8Array.from([0x49, 0x48, 0x44, 0x52]);
  const crcInput = new Uint8Array(17);
  crcInput.set(ihdrType, 0);
  crcInput.set(ihdrData, 4);
  const ihdr = new Uint8Array(25);
  new DataView(ihdr.buffer).setUint32(0, 13);
  ihdr.set(ihdrType, 4);
  ihdr.set(ihdrData, 8);
  new DataView(ihdr.buffer).setUint32(21, crc32(crcInput));
  const iend = Uint8Array.from([
    0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const out = new Uint8Array(signature.length + ihdr.length + iend.length);
  out.set(signature, 0);
  out.set(ihdr, signature.length);
  out.set(iend, signature.length + ihdr.length);
  return out;
}

describe("embedPngMetadata", () => {
  it("inserts Alt Text before IEND and keeps the file structurally valid", async () => {
    const original = minimalPng();
    const blob = new Blob([original], { type: "image/png" });
    const result = new Uint8Array(
      await (
        await embedPngMetadata(blob, {
          title: "My map",
          description: "A thumbnail of my map",
        })
      ).arrayBuffer(),
    );

    expect([...result.subarray(0, 8)]).toEqual([...original.subarray(0, 8)]);
    const asText = new TextDecoder("latin1").decode(result);
    expect(asText).toContain("Alt Text");
    expect(asText).toContain("A thumbnail of my map");
    expect(asText).toContain("Title");
    expect(asText).toContain("ArcGIS Thumbnail Maker");

    const tail = result.subarray(result.length - 12);
    expect([...tail.subarray(4, 8)]).toEqual([0x49, 0x45, 0x4e, 0x44]);

    let offset = 8;
    while (offset < result.length) {
      const view = new DataView(result.buffer, result.byteOffset + offset);
      const length = view.getUint32(0);
      const type = String.fromCharCode(
        result[offset + 4],
        result[offset + 5],
        result[offset + 6],
        result[offset + 7],
      );
      const dataStart = offset + 8;
      const crcBytes = result.subarray(dataStart + length, dataStart + length + 4);
      const crcInput = result.subarray(offset + 4, dataStart + length);
      const expected = crc32(crcInput);
      const actual =
        ((crcBytes[0] << 24) | (crcBytes[1] << 16) | (crcBytes[2] << 8) | crcBytes[3]) >>> 0;
      expect(actual, `CRC mismatch in ${type} chunk`).toBe(expected);
      offset = dataStart + length + 4;
      if (type === "IEND") break;
    }
    expect(offset).toBe(result.length);
  });

  it("rejects non-PNG input", async () => {
    await expect(
      embedPngMetadata(new Blob([new Uint8Array(32)]), {
        title: "x",
        description: "y",
      }),
    ).rejects.toThrow();
  });
});

describe("embedJpegMetadata", () => {
  it("inserts a COM segment after SOI", async () => {
    const original = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    const blob = new Blob([original], { type: "image/jpeg" });
    const result = new Uint8Array(
      await (
        await embedJpegMetadata(blob, {
          title: "My map",
          description: "A thumbnail of my map",
        })
      ).arrayBuffer(),
    );

    expect(result[0]).toBe(0xff);
    expect(result[1]).toBe(0xd8);
    expect(result[2]).toBe(0xff);
    expect(result[3]).toBe(0xfe);
    const markerLength = (result[4] << 8) | result[5];
    const payload = new TextDecoder("latin1").decode(
      result.subarray(6, 4 + markerLength),
    );
    expect(payload).toContain("My map");
    expect(payload).toContain("A thumbnail of my map");
    expect(result.subarray(result.length - 2)).toEqual(Uint8Array.from([0xff, 0xd9]));
  });
});
