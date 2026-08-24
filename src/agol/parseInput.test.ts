import { describe, expect, it } from "vitest";
import { parseAgolInput } from "./parseInput";

describe("parseAgolInput", () => {
  it("parses org item pages and derives the sharing base", () => {
    const target = parseAgolInput(
      "https://acme.maps.arcgis.com/home/item.html?id=A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6",
    );
    expect(target?.kind).toBe("item");
    if (target?.kind === "item") {
      expect(target.id).toBe("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6");
      expect(target.sharingBase).toBe("https://acme.maps.arcgis.com/sharing/rest");
    }
  });

  it("handles portal sub-paths", () => {
    const target = parseAgolInput(
      "https://gis.city.example.org/arcgis/home/item.html?id=1111222233334444555566667777aaaa",
    );
    if (target?.kind === "item") {
      expect(target.sharingBase).toBe("https://gis.city.example.org/arcgis/sharing/rest");
    } else {
      throw new Error("expected item target");
    }
  });

  it("accepts bare 32-hex item IDs with the default sharing base", () => {
    const target = parseAgolInput("1111 2222 3333 4444 5555 6666 7777 8888".replace(/ /g, ""));
    if (target?.kind === "item") {
      expect(target.sharingBase).toBe("https://www.arcgis.com/sharing/rest");
    } else {
      throw new Error("expected item target");
    }
  });

  it("parses sharing REST item URLs", () => {
    const target = parseAgolInput(
      "https://www.arcgis.com/sharing/rest/content/items/aabbccddeeff00112233445566778899?f=json",
    );
    expect(target?.kind).toBe("item");
  });

  it("normalizes service URLs, dropping layer indexes and queries", () => {
    const target = parseAgolInput(
      "https://services.arcgis.com/orgabc/ArcGIS/rest/services/Trails/FeatureServer/0?f=json",
    );
    expect(target).toEqual({
      kind: "service",
      url: "https://services.arcgis.com/orgabc/ArcGIS/rest/services/Trails/FeatureServer",
      serviceType: "FeatureServer",
      sourceUrl:
        "https://services.arcgis.com/orgabc/ArcGIS/rest/services/Trails/FeatureServer",
    });
  });

  it("inserts /rest when the URL omits it", () => {
    const target = parseAgolInput(
      "https://sampleserver6.arcgisonline.com/arcgis/services/Elevation/ImageServer",
    );
    if (target?.kind === "service") {
      expect(target.url).toBe(
        "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Elevation/ImageServer",
      );
      expect(target.serviceType).toBe("ImageServer");
    } else {
      throw new Error("expected service target");
    }
  });

  it("recognizes vector tile services inside folders", () => {
    const target = parseAgolInput(
      "https://tiles.example.gov/server/rest/services/Basemaps/Dark/VectorTileServer",
    );
    expect(target?.kind).toBe("service");
    if (target?.kind === "service") expect(target.serviceType).toBe("VectorTileServer");
  });

  it("rejects garbage", () => {
    expect(parseAgolInput("not a url")).toBeNull();
    expect(parseAgolInput("")).toBeNull();
    expect(parseAgolInput("https://example.com/something/else")).toBeNull();
    expect(parseAgolInput("https://services.arcgis.com/x/rest/services/A/NotAType")).toBeNull();
  });
});
