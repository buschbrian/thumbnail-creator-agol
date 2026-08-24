import { describe, expect, it } from "vitest";
import {
  normalizeHex,
  parseColorSpecs,
  tryParseBrandKit,
} from "./parseColors";

describe("normalizeHex", () => {
  it("expands shorthand hex", () => {
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("FFF")).toBe("#ffffff");
  });

  it("keeps six-digit hex and drops alpha", () => {
    expect(normalizeHex("#004DA8")).toBe("#004da8");
    expect(normalizeHex("#004da8ff")).toBe("#004da8");
  });

  it("rejects invalid values", () => {
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("hello")).toBeNull();
    expect(normalizeHex("")).toBeNull();
  });
});

describe("parseColorSpecs", () => {
  it("parses a plain hex list with mixed case and shorthand", () => {
    const colors = parseColorSpecs("#e8400d\n10054d\n#fff");
    expect(colors.map((c) => c.hex)).toEqual([
      "#e8400d",
      "#10054d",
      "#ffffff",
    ]);
  });

  it("parses CSS custom properties with names", () => {
    const colors = parseColorSpecs(
      ":root {\n  --brand-blue: #004da8;\n  --brand_orange: #E8400D;\n}",
    );
    expect(colors).toEqual([
      { hex: "#004da8", name: "brand blue" },
      { hex: "#e8400d", name: "brand orange" },
    ]);
  });

  it("parses SCSS variables", () => {
    const colors = parseColorSpecs(
      "$primary: #272625;\n$secondary-color: rgb(232, 64, 13);",
    );
    expect(colors).toEqual([
      { hex: "#272625", name: "primary" },
      { hex: "#e8400d", name: "secondary color" },
    ]);
  });

  it("parses rgb() and rgba() tokens", () => {
    const colors = parseColorSpecs("rgba(16, 5, 77, 0.4) rgb(10% 20% 30%)");
    expect(colors.map((c) => c.hex)).toEqual(["#10054d", "#1a334d"]);
  });

  it("parses a GIMP palette file", () => {
    const gpl = [
      "GIMP Palette",
      "Name: Acme Brand",
      "Columns: 4",
      "#",
      "232  64  13\tSignal Orange",
      " 16   5  77 Deep Indigo",
      "255 255 255 White",
    ].join("\n");
    const colors = parseColorSpecs(gpl);
    expect(colors).toEqual([
      { hex: "#e8400d", name: "Signal Orange" },
      { hex: "#10054d", name: "Deep Indigo" },
      { hex: "#ffffff", name: "White" },
    ]);
  });

  it("parses JSON arrays of strings", () => {
    const colors = parseColorSpecs('["#e8400d", "#10054d"]');
    expect(colors.map((c) => c.hex)).toEqual(["#e8400d", "#10054d"]);
  });

  it("parses JSON arrays of named objects", () => {
    const colors = parseColorSpecs(
      '[{"name":"Primary","hex":"#e8400d"},{"label":"Ink","value":"#272625"}]',
    );
    expect(colors).toEqual([
      { hex: "#e8400d", name: "Primary" },
      { hex: "#272625", name: "Ink" },
    ]);
  });

  it("parses JSON maps keyed by name", () => {
    const colors = parseColorSpecs(
      '{"blue": "#004da8", "orange": {"hex": "#e8400d"}}',
    );
    expect(colors).toEqual([
      { hex: "#004da8", name: "blue" },
      { hex: "#e8400d", name: "orange" },
    ]);
  });

  it("parses Coolors URLs", () => {
    const colors = parseColorSpecs(
      "https://coolors.co/palette/002626-0e4749-95ae6f-eee5b5-dec491",
    );
    expect(colors.map((c) => c.hex)).toEqual([
      "#002626",
      "#0e4749",
      "#95ae6f",
      "#eee5b5",
      "#dec491",
    ]);
  });

  it("deduplicates by hex preserving first occurrence", () => {
    const colors = parseColorSpecs("#abc #AABBCC #fff\n--x: #ffffff;");
    expect(colors).toHaveLength(2);
    expect(colors[0].hex).toBe("#aabbcc");
  });

  it("returns nothing for garbage input", () => {
    expect(parseColorSpecs("this is not a palette")).toEqual([]);
    expect(parseColorSpecs("")).toEqual([]);
  });
});

describe("tryParseBrandKit", () => {
  it("round-trips a kit export including logo and name", () => {
    const kit = tryParseBrandKit(
      JSON.stringify({
        format: "thumbnail-maker-brandkit",
        version: 1,
        name: "Acme",
        colors: [{ hex: "#e8400d", name: "Orange" }, "bad-input", "#10054D"],
        logo: { src: "data:image/png;base64,xxx", width: 128, height: 64 },
      }),
    );
    expect(kit?.name).toBe("Acme");
    expect(kit?.colors).toEqual([
      { hex: "#e8400d", name: "Orange" },
      { hex: "#10054d", name: undefined },
    ]);
    expect(kit?.logo?.width).toBe(128);
  });

  it("rejects foreign JSON", () => {
    expect(tryParseBrandKit('{"foo": 1}')).toBeNull();
    expect(tryParseBrandKit("nope")).toBeNull();
  });

  it("drops non-data-URL logos", () => {
    const kit = tryParseBrandKit(
      JSON.stringify({
        format: "thumbnail-maker-brandkit",
        version: 1,
        colors: [],
        logo: { src: "blob:dying-on-reload", width: 10, height: 10 },
      }),
    );
    expect(kit?.logo ?? null).toBeNull();
  });
});
