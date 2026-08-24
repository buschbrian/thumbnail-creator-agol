import { beforeEach, describe, expect, it } from "vitest";
import { resetBrandForTests, useBrandStore } from "./brandStore";

describe("brand store", () => {
  beforeEach(() => {
    resetBrandForTests();
  });

  it("importColors in replace mode dedupes and resets the palette", () => {
    const added = useBrandStore
      .getState()
      .importColors(
        [
          { hex: "#E8400D", name: "Orange" },
          { hex: "#e8400d" },
          { hex: "#10054d" },
        ],
        "replace",
      );
    expect(added).toBe(2);
    expect(useBrandStore.getState().colors).toEqual([
      { hex: "#e8400d", name: "Orange" },
      { hex: "#10054d" },
    ]);
  });

  it("append mode only adds colors that are new", () => {
    const store = useBrandStore.getState();
    store.importColors([{ hex: "#e8400d" }], "replace");
    const added = useBrandStore
      .getState()
      .importColors([{ hex: "#e8400d" }, { hex: "#ffffff" }], "append");
    expect(added).toBe(1);
    expect(useBrandStore.getState().colors.map((c) => c.hex)).toEqual([
      "#e8400d",
      "#ffffff",
    ]);
  });

  it("removeColor, renameColor and clearAll work by index", () => {
    useBrandStore
      .getState()
      .importColors([{ hex: "#111111" }, { hex: "#222222" }], "replace");
    useBrandStore.getState().renameColor(0, "Ink");
    expect(useBrandStore.getState().colors[0].name).toBe("Ink");
    useBrandStore.getState().removeColor(0);
    expect(useBrandStore.getState().colors.map((c) => c.hex)).toEqual([
      "#222222",
    ]);
    useBrandStore.getState().clearAll();
    expect(useBrandStore.getState().colors).toHaveLength(0);
    expect(useBrandStore.getState().logo).toBeNull();
  });

  it("setLogo stores data URLs and can clear them", () => {
    useBrandStore
      .getState()
      .setLogo({ src: "data:image/png;base64,AA", width: 64, height: 32 });
    expect(useBrandStore.getState().logo?.width).toBe(64);
    useBrandStore.getState().setLogo(null);
    expect(useBrandStore.getState().logo).toBeNull();
  });
});
