import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateFromAgol } from "./generateFromAgol";
import type { AgolSourceInfo } from "./fetchInfo";
import { resetBrandForTests, useBrandStore } from "../brand/brandStore";
import { resetEditorForTests, useEditorStore } from "../state/store";
import { DEFAULT_BACKGROUND_COLOR } from "../constants";

const INFO: AgolSourceInfo = {
  kind: "item",
  title: "City Trail Network",
  typeName: "Feature Service",
  snippet: "Official trails dataset for the city.",
  owner: "city_gis",
  tags: ["trails"],
  thumbnailAbsoluteUrl:
    "https://www.arcgis.com/sharing/rest/content/items/aabb/info/thumb.png",
  sourceUrl: "https://www.arcgis.com/sharing/rest/content/items/aabb",
};

describe("generateFromAgol", () => {
  beforeEach(() => {
    resetEditorForTests();
    resetBrandForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    const urlCtor = globalThis.URL as unknown as Record<string, unknown>;
    delete urlCtor.createObjectURL;
    delete urlCtor.revokeObjectURL;
  });

  function stubThumbnailFetch(): void {
    const fetchMock = vi.fn(async () =>
      ({
        ok: true,
        blob: async () => new Blob(["fake-image"]),
      }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
    const urlCtor = globalThis.URL as unknown as Record<string, unknown>;
    urlCtor.createObjectURL = () => "blob:test-thumb";
    urlCtor.revokeObjectURL = () => undefined;
  }

  it("auto-matches the template, sets metadata and tints with the brand palette", async () => {
    useBrandStore
      .getState()
      .importColors(
        [{ hex: "#004da8", name: "Blue" }, { hex: "#e8400d", name: "Orange" }],
        "replace",
      );

    const result = await generateFromAgol(INFO, {
      useExistingThumbnail: false,
      tintWithBrand: true,
    });

    expect(result.templateId).toBe("feature-layer-side");
    const state = useEditorStore.getState();
    expect(state.doc.title).toBe("City Trail Network");
    expect(state.doc.itemType).toBe("Feature Service");

    // Brand tint: ink bands become the darkest brand color and the canvas
    // takes that background since there is no background image.
    expect(state.backgroundColor).toBe("#004da8");
    const sidebar = state.layers.find((l) => l.name === "Sidebar");
    expect(sidebar && sidebar.type === "shape" ? sidebar.fill : null).toBe(
      "#004da8",
    );
  });

  it("uses the existing item thumbnail as a background image", async () => {
    stubThumbnailFetch();

    const result = await generateFromAgol(INFO, {
      useExistingThumbnail: true,
      tintWithBrand: false,
    });

    expect(result.usedBackgroundImage).toBe(true);
    const state = useEditorStore.getState();
    const backgrounds = state.layers.filter((l) => l.type === "backgroundImage");
    expect(backgrounds).toHaveLength(1);
    if (backgrounds[0].type !== "backgroundImage") throw new Error("bad type");
    expect(backgrounds[0].src).toBe("blob:test-thumb");
    // With a photo background the tint step would fight it — untouched here.
    expect(state.backgroundColor).toBe(DEFAULT_BACKGROUND_COLOR);
  });

  it("replaces the 'Item type' placeholder with real metadata", async () => {
    await generateFromAgol(INFO, {
      useExistingThumbnail: false,
      tintWithBrand: false,
    });
    const itemTypeLayer = useEditorStore
      .getState()
      .layers.find((l) => l.name === "Item type");
    if (!itemTypeLayer || itemTypeLayer.type !== "text") {
      throw new Error("expected Item type text layer");
    }
    expect(itemTypeLayer.text).toBe("Feature Service · city_gis");
  });

  it("records the whole generation as one history entry", async () => {
    await generateFromAgol(INFO, {
      useExistingThumbnail: false,
      tintWithBrand: false,
    });
    const temporal = useEditorStore.temporal.getState();
    temporal.undo();
    const state = useEditorStore.getState();
    expect(state.doc.title).not.toBe("City Trail Network");
    expect(state.layers).toHaveLength(0);
  });
});
