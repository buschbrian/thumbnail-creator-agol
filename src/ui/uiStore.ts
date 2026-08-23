import { create } from "zustand";

export type AlertKind = "info" | "success" | "warning" | "danger";

export interface AlertItem {
  id: number;
  kind: AlertKind;
  title: string;
  message: string;
}

export type RightTab = "layers" | "properties" | "export";

export type LeftTab = "templates" | "elements" | "text" | "background";

export interface ExportSettings {
  format: "png" | "jpeg";
  quality: number;
}

let nextAlertId = 1;

interface UIState {
  alerts: AlertItem[];
  pushAlert: (kind: AlertKind, title: string, message?: string) => void;
  dismissAlert: (id: number) => void;

  rightTab: RightTab;
  setRightTab: (tab: RightTab) => void;

  leftTab: LeftTab;
  setLeftTab: (tab: LeftTab) => void;

  iconPickerOpen: boolean;
  replaceIconTargetId: string | null;
  openIconPicker: (replaceTargetId?: string | null) => void;
  closeIconPicker: () => void;

  exportSettings: ExportSettings;
  setExportSettings: (patch: Partial<ExportSettings>) => void;
  exportBusy: boolean;
  setExportBusy: (busy: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  alerts: [],

  pushAlert: (kind, title, message = "") => {
    const id = nextAlertId++;
    set((state) => ({
      alerts: [...state.alerts.slice(-3), { id, kind, title, message }],
    }));
    if (kind !== "danger") {
      setTimeout(() => get().dismissAlert(id), 6000);
    }
  },

  dismissAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  rightTab: "layers",
  setRightTab: (rightTab) => set({ rightTab }),

  leftTab: "templates",
  setLeftTab: (leftTab) => set({ leftTab }),

  iconPickerOpen: false,
  replaceIconTargetId: null,

  openIconPicker: (replaceTargetId = null) =>
    set({ iconPickerOpen: true, replaceIconTargetId: replaceTargetId }),

  closeIconPicker: () =>
    set({ iconPickerOpen: false, replaceIconTargetId: null }),

  exportSettings: { format: "png", quality: 90 },
  setExportSettings: (patch) =>
    set((state) => ({ exportSettings: { ...state.exportSettings, ...patch } })),
  exportBusy: false,
  setExportBusy: (exportBusy) => set({ exportBusy }),
}));
