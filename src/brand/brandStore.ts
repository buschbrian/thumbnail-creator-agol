import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { BrandColor, BrandLogo } from "./types";
import { BRAND_STORAGE_KEY, MAX_BRAND_COLORS } from "./types";
import type { ParsedColor } from "./parseColors";

export interface BrandState {
  name: string;
  logo: BrandLogo | null;
  colors: ParsedColor[];

  setName(name: string): void;
  setLogo(logo: BrandLogo | null): void;
  /** Returns the number of colors actually added after deduplication. */
  importColors(colors: ReadonlyArray<BrandColor>, mode: "replace" | "append"): number;
  removeColor(index: number): void;
  renameColor(index: number, name: string): void;
  clearAll(): void;
}

const memoryStore = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(name);
      }
    } catch {
      /* private mode / blocked storage */
    }
    return memoryStore.get(name) ?? null;
  },
  setItem: (name, value) => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(name, value);
        return;
      }
    } catch {
      /* quota exceeded or blocked — degrade to session-only */
    }
    memoryStore.set(name, value);
  },
  removeItem: (name) => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(name);
        return;
      }
    } catch {
      /* ignore */
    }
    memoryStore.delete(name);
  },
};

function dedupe(
  incoming: ReadonlyArray<BrandColor>,
  existingHexes: Set<string>,
): ParsedColor[] {
  const added: ParsedColor[] = [];
  for (const color of incoming) {
    if (existingHexes.size >= MAX_BRAND_COLORS) break;
    const hex = color.hex.toLowerCase();
    if (existingHexes.has(hex)) continue;
    existingHexes.add(hex);
    added.push(color.name ? { hex, name: color.name } : { hex });
  }
  return added;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      name: "",
      logo: null,
      colors: [],

      setName: (name) => set({ name }),

      setLogo: (logo) => set({ logo }),

      importColors: (colors, mode) => {
        if (mode === "replace") {
          const unique = dedupe(colors, new Set());
          set({ colors: unique });
          return unique.length;
        }
        const state = useBrandStore.getState();
        const hexes = new Set(state.colors.map((c) => c.hex.toLowerCase()));
        const added = dedupe(colors, hexes);
        if (added.length > 0) set({ colors: [...state.colors, ...added] });
        return added.length;
      },

      removeColor: (index) =>
        set((state) => ({
          colors: state.colors.filter((_, i) => i !== index),
        })),

      renameColor: (index, name) =>
        set((state) => ({
          colors: state.colors.map((c, i) =>
            i === index
              ? { ...c, name: name.trim() || undefined }
              : c,
          ),
        })),

      clearAll: () => set({ name: "", logo: null, colors: [] }),
    }),
    {
      name: BRAND_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

export function resetBrandForTests(): void {
  useBrandStore.setState({ name: "", logo: null, colors: [] });
  useBrandStore.persist.clearStorage();
}
