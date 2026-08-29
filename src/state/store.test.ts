import { beforeEach, describe, expect, it } from "vitest";
import {
  createDesignSnapshot,
  designStateFromSnapshot,
} from "../project/schema";
import { resetEditorForTests, useEditorStore } from "./store";

describe("editor store", () => {
  beforeEach(() => {
    resetEditorForTests();
  });

  it("starts on the ArcGIS Online preset", () => {
    expect(useEditorStore.getState().doc).toEqual({
      width: 600,
      height: 400,
      title: "My thumbnail",
    });
    expect(useEditorStore.getState().layers).toEqual([]);
  });

  it("addText adds a selected text layer", () => {
    const id = useEditorStore.getState().addText();
    const state = useEditorStore.getState();
    expect(state.layers).toHaveLength(1);
    expect(state.layers[0].type).toBe("text");
    expect(state.selectedId).toBe(id);
  });

  it("undo and redo round-trip layer additions", () => {
    useEditorStore.getState().addText();
    const temporal = useEditorStore.temporal.getState();
    temporal.undo();
    expect(useEditorStore.getState().layers).toHaveLength(0);
    temporal.redo();
    expect(useEditorStore.getState().layers).toHaveLength(1);
  });

  it("setSize rescales existing layers", () => {
    useEditorStore.getState().addText();
    useEditorStore.getState().setSize(1200, 800);
    const [layer] = useEditorStore.getState().layers;
    if (layer.type !== "text") throw new Error("expected text layer");
    expect(layer.x).toBe(72);
    expect(layer.fontSize).toBeGreaterThanOrEqual(16);
  });

  it("setBackgroundImage replaces any previous background image", () => {
    useEditorStore.getState().setBackgroundImage("blob:first");
    useEditorStore.getState().setBackgroundImage("blob:second");
    const backgrounds = useEditorStore
      .getState()
      .layers.filter((l) => l.type === "backgroundImage");
    expect(backgrounds).toHaveLength(1);
    if (backgrounds[0].type !== "backgroundImage") throw new Error("bad type");
    expect(backgrounds[0].src).toBe("blob:second");
    expect(useEditorStore.getState().layers[0]).toBe(backgrounds[0]);
  });

  it("removeLayer deletes the background image", () => {
    useEditorStore.getState().setBackgroundImage("blob:x");
    const bg = useEditorStore.getState().layers[0];
    useEditorStore.getState().removeLayer(bg.id);
    expect(useEditorStore.getState().layers).toHaveLength(0);
  });

  it("moveLayer never moves the background image from the bottom", () => {
    useEditorStore.getState().setBackgroundImage("blob:x");
    useEditorStore.getState().addText();
    const [, text] = useEditorStore.getState().layers;
    useEditorStore.getState().moveLayer(text.id, -1);
    expect(useEditorStore.getState().layers[0].type).toBe("backgroundImage");
  });

  it("applyTemplate builds idempotent layers and is undoable", () => {
    useEditorStore.getState().applyTemplate("footer-dark");
    const state = useEditorStore.getState();
    expect(state.layers.length).toBeGreaterThanOrEqual(3);
    const ids = state.layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);

    useEditorStore.temporal.getState().undo();
    expect(useEditorStore.getState().layers).toHaveLength(0);
  });

  it("paused history skips live updates", () => {
    const id = useEditorStore.getState().addText();
    useEditorStore.temporal.getState().pause();
    useEditorStore.getState().updateLayer(id, { x: 123 });
    useEditorStore.temporal.getState().resume();

    const temporal = useEditorStore.temporal.getState();
    temporal.undo();
    expect(useEditorStore.getState().layers).toHaveLength(0);
  });

  it("converts editor state through a detached snapshot without changing history", () => {
    useEditorStore.getState().addText();
    const before = useEditorStore.getState();

    const snapshot = createDesignSnapshot(before);
    const restored = designStateFromSnapshot(snapshot);

    expect(restored).toEqual({
      doc: before.doc,
      backgroundColor: before.backgroundColor,
      layers: before.layers,
    });
    restored.layers[0].name = "Detached copy";
    expect(useEditorStore.getState().layers[0].name).toBe("Text");

    const temporal = useEditorStore.temporal.getState();
    temporal.undo();
    expect(useEditorStore.getState().layers).toHaveLength(0);
    temporal.redo();
    expect(useEditorStore.getState().layers).toHaveLength(1);
  });
});
