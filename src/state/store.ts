import { create } from "zustand";
import { temporal } from "zundo";
import { newId } from "./id";
import { COLORS, DEFAULT_BACKGROUND_COLOR } from "../constants";
import type {
  DocumentSpec,
  Layer,
} from "./types";
import { findTemplate } from "../templates/templates";
import { buildTextPreset } from "../templates/textPresets";
import type { TextPresetKind } from "../templates/textPresets";

export interface EditorState {
  doc: DocumentSpec;
  backgroundColor: string;
  layers: Layer[];
  selectedId: string | null;

  setSize(width: number, height: number): void;
  setTitle(title: string): void;
  setAltTextOverride(text: string): void;
  setItemType(itemType?: string): void;
  setBackgroundColor(color: string): void;
  setBackgroundImage(src: string): void;
  removeBackgroundImage(): void;
  addText(): string;
  addTextPreset(kind: TextPresetKind): string;
  addLogo(src: string, naturalWidth: number, naturalHeight: number): string;
  addRectangle(): string;
  addIcon(iconId: string): string;
  updateLayer(id: string, patch: Record<string, unknown>): void;
  removeLayer(id: string): void;
  moveLayer(id: string, direction: -1 | 1): void;
  select(id: string | null): void;
  applyTemplate(templateId: string): void;
}

interface HistorySlice {
  doc: DocumentSpec;
  backgroundColor: string;
  layers: Layer[];
}

export function createBlankState(): HistorySlice & { selectedId: string | null } {
  return {
    doc: { width: 600, height: 400, title: "My thumbnail" },
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    layers: [],
    selectedId: null,
  };
}

function rescaleLayer(layer: Layer, fx: number, fy: number): Layer {
  switch (layer.type) {
    case "backgroundImage":
      return layer;
    case "logo":
      return {
        ...layer,
        x: Math.round(layer.x * fx),
        y: Math.round(layer.y * fy),
        width: Math.max(12, Math.round(layer.width * fx)),
        height: Math.max(12, Math.round(layer.height * fy)),
      };
    case "text":
      return {
        ...layer,
        x: Math.round(layer.x * fx),
        y: Math.round(layer.y * fy),
        width: Math.round(layer.width * fx),
        fontSize: Math.max(9, Math.round(layer.fontSize * Math.min(fx, fy))),
      };
    case "shape":
      return {
        ...layer,
        x: Math.round(layer.x * fx),
        y: Math.round(layer.y * fy),
        width: Math.round(layer.width * fx),
        height: Math.round(layer.height * fy),
      };
    case "icon":
      return {
        ...layer,
        x: Math.round(layer.x * fx),
        y: Math.round(layer.y * fy),
        size: Math.max(10, Math.round(layer.size * Math.min(fx, fy))),
      };
  }
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      ...createBlankState(),

      setSize: (width, height) =>
        set((state) => {
          const fx = width / state.doc.width;
          const fy = height / state.doc.height;
          return {
            doc: { ...state.doc, width, height },
            layers: state.layers.map((l) => rescaleLayer(l, fx, fy)),
          };
        }),

      setTitle: (title) => set((state) => ({ doc: { ...state.doc, title } })),

      setAltTextOverride: (altTextOverride) =>
        set((state) => ({ doc: { ...state.doc, altTextOverride } })),

      setItemType: (itemType) =>
        set((state) => ({ doc: { ...state.doc, itemType } })),

      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),

      setBackgroundImage: (src) =>
        set((state) => ({
          layers: [
            {
              id: newId("bg"),
              name: "Background image",
              type: "backgroundImage",
              src,
              fit: "cover",
              x: 0,
              y: 0,
              opacity: 1,
              visible: true,
            } as Layer,
            ...state.layers.filter((l) => l.type !== "backgroundImage"),
          ],
          selectedId: state.selectedId ?? null,
        })),

      removeBackgroundImage: () =>
        set((state) => ({
          layers: state.layers.filter((l) => l.type !== "backgroundImage"),
          selectedId:
            state.selectedId &&
            state.layers.find((l) => l.id === state.selectedId)?.type ===
              "backgroundImage"
              ? null
              : state.selectedId,
        })),

      addText: () => {
        const id = newId("text");
        set((state) => {
          const { width, height } = state.doc;
          return {
            layers: [
              ...state.layers,
              {
                id,
                name: "Text",
                type: "text",
                x: Math.round(width * 0.06),
                y: Math.round(height * 0.08),
                opacity: 1,
                visible: true,
                text: "Your title here",
                fontId: "avenir",
                fontSize: Math.max(16, Math.round(height * 0.1)),
                fontWeight: 700,
                italic: false,
                color: COLORS.white,
                align: "left",
                width: Math.round(width * 0.85),
                lineHeight: 1.15,
                letterSpacing: 0,
              } as Layer,
            ],
            selectedId: id,
          };
        });
        return id;
      },

      addTextPreset: (kind) => {
        const id = newId("text");
        set((state) => {
          const draft = buildTextPreset(kind, state.doc);
          return {
            layers: [...state.layers, { ...draft, id } as Layer],
            selectedId: id,
          };
        });
        return id;
      },

      addLogo: (src, naturalWidth, naturalHeight) => {
        const id = newId("logo");
        set((state) => {
          const { width, height } = state.doc;
          const maxDimension = Math.min(width, height) * 0.32;
          const scale = Math.min(
            maxDimension / Math.max(1, naturalWidth),
            maxDimension / Math.max(1, naturalHeight),
            1,
          );
          const logoWidth = Math.max(24, Math.round(naturalWidth * scale));
          const logoHeight = Math.max(24, Math.round(naturalHeight * scale));
          const padding = Math.round(Math.min(width, height) * 0.05);
          return {
            layers: [
              ...state.layers,
              {
                id,
                name: "Logo",
                type: "logo",
                x: Math.max(padding, width - logoWidth - padding),
                y: Math.max(padding, height - logoHeight - padding),
                opacity: 1,
                visible: true,
                src,
                width: logoWidth,
                height: logoHeight,
              } as Layer,
            ],
            selectedId: id,
          };
        });
        return id;
      },

      addRectangle: () => {
        const id = newId("rect");
        set((state) => {
          const { width, height } = state.doc;
          return {
            layers: [
              ...state.layers,
              {
                id,
                name: "Rectangle",
                type: "shape",
                shape: "rectangle",
                x: Math.round(width * 0.5 - width * 0.18),
                y: Math.round(height * 0.42),
                opacity: 1,
                visible: true,
                width: Math.round(width * 0.36),
                height: Math.round(height * 0.16),
                fill: COLORS.accent,
                cornerRadius: 0,
              } as Layer,
            ],
            selectedId: id,
          };
        });
        return id;
      },

      addIcon: (iconId) => {
        const id = newId("icon");
        set((state) => {
          const { width, height } = state.doc;
          return {
            layers: [
              ...state.layers,
              {
                id,
                name: `Icon · ${iconId}`,
                type: "icon",
                x: Math.round(width / 2 - (Math.min(width, height) * 0.1) / 2),
                y: Math.round(height / 2 - (Math.min(width, height) * 0.1) / 2),
                opacity: 1,
                visible: true,
                iconId,
                size: Math.round(Math.min(width, height) * 0.2),
                color: COLORS.white,
              } as Layer,
            ],
            selectedId: id,
          };
        });
        return id;
      },

      updateLayer: (id, patch) =>
        set((state) => ({
          layers: state.layers.map((layer) =>
            layer.id === id ? ({ ...layer, ...patch } as Layer) : layer,
          ),
        })),

      removeLayer: (id) =>
        set((state) => ({
          layers: state.layers.filter((layer) => layer.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      moveLayer: (id, direction) =>
        set((state) => {
          const index = state.layers.findIndex((l) => l.id === id);
          const target = index + direction;
          if (
            index < 0 ||
            target < 0 ||
            target >= state.layers.length ||
            state.layers[index].type === "backgroundImage" ||
            state.layers[target].type === "backgroundImage"
          ) {
            return state;
          }
          const layers = [...state.layers];
          [layers[index], layers[target]] = [layers[target], layers[index]];
          return { layers };
        }),

      select: (selectedId) => set({ selectedId }),

      applyTemplate: (templateId) =>
        set((state) => {
          const template = findTemplate(templateId);
          if (!template) return state;
          const drafts = template.build(state.doc);
          const layers = drafts.map(
            (draft) => ({ ...draft, id: newId() }) as Layer,
          );
          return {
            layers,
            selectedId: null,
            doc: { ...state.doc, itemType: template.category },
          };
        }),
    }),
    {
      partialize: (state): HistorySlice => ({
        doc: state.doc,
        backgroundColor: state.backgroundColor,
        layers: state.layers,
      }),
      limit: 80,
    },
  ),
);

export const pauseHistory = (): void => {
  useEditorStore.temporal.getState().pause();
};

export const resumeHistory = (): void => {
  useEditorStore.temporal.getState().resume();
};

export function resetEditorForTests(): void {
  useEditorStore.setState(createBlankState());
  useEditorStore.temporal.getState().clear();
}
