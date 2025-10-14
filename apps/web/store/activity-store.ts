import { create } from "zustand";

export type ActivityKind = "simulation" | "transaction";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
  href?: string;
}

interface ActivityState {
  isOpen: boolean;
  entries: ActivityEntry[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  log: (entry: ActivityEntry) => void;
  updateStatus: (id: string, status: ActivityEntry["status"]) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  isOpen: false,
  entries: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  log: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, 20)
    })),
  updateStatus: (id, status) =>
    set((state) => ({
      entries: state.entries.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    }))
}));
