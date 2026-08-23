import { describe, expect, it } from "vitest";
import { altTextHealth, generateAltText, resolveAltText } from "./altText";
import type { DocumentSpec, Layer } from "../state/types";

const DOC: DocumentSpec = { width: 600, height: 400, title: "Trail Conditions" };

function iconLayer(iconId: string): Layer {
  return {
    id: "i1",
    name: "Icon",
    type: "icon",
    x: 10,
    y: 10,
    opacity: 1,
    visible: true,
    iconId,
    size: 40,
    color: "#ffffff",
  };
}

describe("generateAltText", () => {
  it("mentions item type and title when a template is applied", () => {
    const text = generateAltText(
      { ...DOC, itemType: "Web map" },
      [iconLayer("map")],
    );
    expect(text).toContain('web map "Trail Conditions"');
    expect(text).toContain("map symbol");
  });

  it("falls back to generic item wording", () => {
    const text = generateAltText(DOC, []);
    expect(text).toContain('item "Trail Conditions"');
    expect(text).toContain("flat background");
  });

  it("describes photo backgrounds and logos", () => {
    const layers: Layer[] = [
      {
        id: "b1",
        name: "Background",
        type: "backgroundImage",
        src: "blob:x",
        fit: "cover",
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
      },
      {
        id: "l1",
        name: "Logo",
        type: "logo",
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        src: "blob:y",
        width: 40,
        height: 40,
      },
    ];
    const text = generateAltText(DOC, layers);
    expect(text).toContain("photo background");
    expect(text).toContain("logo");
  });
});

describe("resolveAltText", () => {
  it("prefers a non-empty override", () => {
    const resolved = resolveAltText(
      { ...DOC, altTextOverride: "Custom description" },
      [],
    );
    expect(resolved).toBe("Custom description");
  });

  it("falls back to generated text for blank overrides", () => {
    const resolved = resolveAltText({ ...DOC, altTextOverride: "   " }, []);
    expect(resolved).toBe(generateAltText(DOC, []));
  });
});

describe("altTextHealth", () => {
  it("flags empty text", () => {
    expect(altTextHealth("  ").level).toBe("empty");
  });
  it("flags very long text", () => {
    expect(altTextHealth("x".repeat(200)).level).toBe("long");
  });
  it("accepts reasonable text", () => {
    expect(altTextHealth("A map thumbnail").level).toBe("good");
  });
});
