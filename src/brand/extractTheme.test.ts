import { describe, expect, it } from "vitest";
import { extractThemeFromPixels } from "./extractTheme";

function rgba(
  pixels: Array<[number, number, number, number]>,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b, a], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  });
  return data;
}

describe("extractThemeFromPixels", () => {
  it("returns the dominant color of a solid image", () => {
    const pixels = rgba(Array.from({ length: 64 }, () => [232, 64, 13, 255]));
    expect(extractThemeFromPixels(pixels)).toEqual(["#e8400d"]);
  });

  it("orders colors by prominence", () => {
    const pixels = rgba([
      ...Array.from({ length: 40 }, (): [number, number, number, number] => [0, 77, 168, 255]),
      ...Array.from({ length: 10 }, (): [number, number, number, number] => [255, 255, 255, 255]),
      ...Array.from({ length: 6 }, (): [number, number, number, number] => [232, 64, 13, 255]),
    ]);
    const hexes = extractThemeFromPixels(pixels);
    expect(hexes[0]).toBe("#004da8");
    expect(hexes).toContain("#ffffff");
  });

  it("skips transparent pixels", () => {
    const pixels = rgba([
      [0, 0, 0, 0],
      [0, 0, 0, 30],
      [200, 10, 10, 255],
    ]);
    expect(extractThemeFromPixels(pixels)).toEqual(["#c80a0a"]);
  });

  it("collapses near-duplicate colors via minimum distance", () => {
    const pixels = rgba([
      ...Array.from({ length: 20 }, (): [number, number, number, number] => [0, 80, 160, 255]),
      ...Array.from({ length: 20 }, (): [number, number, number, number] => [2, 82, 162, 255]),
      ...Array.from({ length: 20 }, (): [number, number, number, number] => [250, 240, 90, 255]),
    ]);
    expect(extractThemeFromPixels(pixels)).toHaveLength(2);
  });

  it("honors the max option", () => {
    const palette: Array<[number, number, number]> = [
      [232, 64, 13],
      [16, 5, 77],
      [183, 239, 178],
      [255, 239, 153],
      [226, 221, 253],
      [153, 255, 249],
      [109, 108, 107],
      [236, 235, 234],
    ];
    const pixels = rgba(
      palette.flatMap((color) =>
        Array.from({ length: 8 }, () => [...color, 255] as [number, number, number, number]),
      ),
    );
    expect(extractThemeFromPixels(pixels, { max: 3 })).toHaveLength(3);
  });
});
