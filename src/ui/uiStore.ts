import { create } from "zustand";

export type AlertKind = "info" | "success" | "warning" | "danger";

export interface AlertItem {
  id: number;
  kind: AlertKind;
  title: string;
  message: string;
}

let nextAlertId = 1;

interface UIState {
  alerts: AlertItem[];
  pushAlert: (kind: AlertKind, title: string, message?: string) => void;
  dismissAlert: (id: number) => void;
  iconPickerOpen: boolean;
  replaceIconTargetId: string | null;
  openIconPicker: (replaceTargetId?: string | null) => void;
  closeIconPicker: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  alerts: [],

  pushAlert: (kind, title, message = "") => {
    const id = nextAlertId++;
    set((state) => ({
      alerts: [...state.alerts, { id, kind, title, message }],
    }));
    if (kind !== "danger") {
      setTimeout(() => get().dismissAlert(id), 6000);
    }
  },

  dismissAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  iconPickerOpen: false,
  replaceIconTargetId: null,

  openIconPicker: (replaceTargetId = null) =>
    set({ iconPickerOpen: true, replaceIconTargetId: replaceTargetId }),

  closeIconPicker: () => set({ iconPickerOpen: false, replaceIconTargetId: null }),
}));
