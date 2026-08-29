import { describe, expect, it } from "vitest";
import type { DesignState } from "../state/types";
import {
  DESIGN_SNAPSHOT_FORMAT,
  DESIGN_SNAPSHOT_VERSION,
  DesignSnapshotValidationError,
  createDesignSnapshot,
  designStateFromSnapshot,
  parseDesignSnapshot,
} from "./schema";

const SAFE_PNG = "data:image/png;base64,iVBORw0KGgo=";

const DESIGN: DesignState = {
  doc: {
    width: 600,
    height: 400,
    title: "Public trails",
    itemType: "Web Map",
    altTextOverride: "A trail map thumbnail",
  },
  backgroundColor: "#efece7",
  layers: [
    {
      id: "bg-1",
      name: "Background image",
      type: "backgroundImage",
      src: SAFE_PNG,
      fit: "cover",
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
    },
    {
      id: "logo-1",
      name: "Organization logo",
      type: "logo",
      src: SAFE_PNG,
      x: 500,
      y: 320,
      width: 64,
      height: 40,
      opacity: 0.9,
      visible: true,
    },
    {
      id: "text-1",
      name: "Title",
      type: "text",
      x: 36,
      y: 32,
      rotation: -2,
      opacity: 1,
      visible: true,
      text: "Explore the network",
      fontId: "avenir",
      fontSize: 42,
      fontWeight: 700,
      italic: false,
      color: "#ffffff",
      align: "left",
      width: 480,
      lineHeight: 1.15,
      letterSpacing: 0,
    },
    {
      id: "shape-1",
      name: "Accent panel",
      type: "shape",
      shape: "rectangle",
      x: 20,
      y: 280,
      width: 220,
      height: 84,
      fill: "#e8400dcc",
      cornerRadius: 8,
      opacity: 0.85,
      visible: true,
    },
    {
      id: "icon-1",
      name: "Trail icon",
      type: "icon",
      iconId: "walking",
      x: 260,
      y: 300,
      size: 48,
      color: "#10054d",
      opacity: 1,
      visible: false,
    },
  ],
};

function externalCopy(): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(createDesignSnapshot(DESIGN)),
  ) as Record<string, unknown>;
}

describe("DesignSnapshot v1", () => {
  it("round-trips every current layer type without editor-only state", () => {
    const editorState = {
      ...DESIGN,
      selectedId: "text-1",
    };
    const snapshot = createDesignSnapshot(editorState);
    const parsed = parseDesignSnapshot(
      JSON.parse(JSON.stringify(snapshot)) as unknown,
    );
    const restored = designStateFromSnapshot(parsed);

    expect(snapshot.format).toBe(DESIGN_SNAPSHOT_FORMAT);
    expect(snapshot.version).toBe(DESIGN_SNAPSHOT_VERSION);
    expect(snapshot.layers.map((layer) => layer.type)).toEqual([
      "backgroundImage",
      "logo",
      "text",
      "shape",
      "icon",
    ]);
    expect("selectedId" in snapshot).toBe(false);
    expect(restored).toEqual(DESIGN);
    expect(restored.doc).not.toBe(DESIGN.doc);
    expect(restored.layers).not.toBe(DESIGN.layers);
  });

  it.each([
    ["foreign format", "format", "foreign-design"],
    ["unsupported version", "version", 2],
  ])("rejects %s", (_label, field, value) => {
    const candidate = externalCopy();
    candidate[field] = value;

    expect(() => parseDesignSnapshot(candidate)).toThrow(
      DesignSnapshotValidationError,
    );
    expect(() => parseDesignSnapshot(candidate)).toThrow(field);
  });

  it.each([
    ["dimensions below the editor minimum", (value: Record<string, unknown>) => {
      (value.doc as Record<string, unknown>).width = 49;
    }, "doc.width"],
    ["non-integer dimensions", (value: Record<string, unknown>) => {
      (value.doc as Record<string, unknown>).height = 400.5;
    }, "doc.height"],
    ["invalid background colors", (value: Record<string, unknown>) => {
      value.backgroundColor = "red";
    }, "backgroundColor"],
    ["invalid layer colors", (value: Record<string, unknown>) => {
      const layers = value.layers as Array<Record<string, unknown>>;
      layers[2].color = "url(javascript:alert(1))";
    }, "layers[2].color"],
    ["malformed layer IDs", (value: Record<string, unknown>) => {
      const layers = value.layers as Array<Record<string, unknown>>;
      layers[0].id = "bad id";
    }, "layers[0].id"],
    ["duplicate layer IDs", (value: Record<string, unknown>) => {
      const layers = value.layers as Array<Record<string, unknown>>;
      layers[1].id = layers[0].id;
    }, "layers[1].id"],
  ])("rejects %s", (_label, mutate, expectedPath) => {
    const candidate = externalCopy();
    mutate(candidate);

    expect(() => parseDesignSnapshot(candidate)).toThrow(expectedPath);
  });

  it.each([
    "https://example.com/tracking.png",
    "blob:ephemeral-image",
    "data:image/svg+xml;base64,PHN2Zy8+",
    "javascript:alert(1)",
  ])("rejects unsafe external image source %s", (src) => {
    const candidate = externalCopy();
    const layers = candidate.layers as Array<Record<string, unknown>>;
    layers[0].src = src;

    expect(() => parseDesignSnapshot(candidate)).toThrow("layers[0].src");
  });

  it("rejects incomplete and unknown layer variants", () => {
    const incomplete = externalCopy();
    const incompleteLayers = incomplete.layers as Array<Record<string, unknown>>;
    delete incompleteLayers[2].fontSize;
    expect(() => parseDesignSnapshot(incomplete)).toThrow(
      "layers[2].fontSize",
    );

    const unknown = externalCopy();
    const unknownLayers = unknown.layers as Array<Record<string, unknown>>;
    unknownLayers[4].type = "video";
    expect(() => parseDesignSnapshot(unknown)).toThrow("layers[4].type");
  });
});
