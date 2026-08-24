import { describe, expect, it } from "vitest";
import { plainText, truncate, type AgolSourceInfo } from "./fetchInfo";
import { FALLBACK_SUGGESTION, suggestForInfo } from "./mapping";

function info(partial: Partial<AgolSourceInfo>): AgolSourceInfo {
  return {
    kind: "item",
    title: "Test",
    typeName: "Unknown type",
    tags: [],
    sourceUrl: "https://example.com",
    ...partial,
  };
}

describe("plainText", () => {
  it("strips HTML markup and decodes entities", () => {
    expect(plainText("<p>Trails &amp; Greenways<br>report 2026</p>")).toBe(
      "Trails & Greenways report 2026",
    );
  });
});

describe("truncate", () => {
  it("cuts on word boundaries with an ellipsis", () => {
    const result = truncate("one two three four five six seven eight", 14);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(14);
    expect(result.startsWith("one two")).toBe(true);
  });
});

describe("suggestForInfo", () => {
  it("maps web maps to the hero band template", () => {
    expect(suggestForInfo(info({ typeName: "Web Map" }))).toEqual({
      templateId: "webmap-hero",
      iconId: "map",
    });
  });

  it("maps hosted feature layers via the service type name", () => {
    expect(suggestForInfo(info({ typeName: "Feature Service" }))).toEqual({
      templateId: "feature-layer-side",
      iconId: "layers",
    });
  });

  it("falls back to tags when the type is generic", () => {
    expect(
      suggestForInfo(info({ typeName: "ArcGIS item", tags: ["story map"] })),
    ).toEqual({ templateId: "storymap-centered", iconId: "book" });
  });

  it("maps imagery services", () => {
    expect(suggestForInfo(info({ kind: "service", typeName: "Imagery layer" }))).toEqual({
      templateId: "dataset-minimal",
      iconId: "image",
    });
  });

  it("uses the fallback for unrecognized metadata", () => {
    expect(suggestForInfo(info({}))).toEqual(FALLBACK_SUGGESTION);
  });
});
