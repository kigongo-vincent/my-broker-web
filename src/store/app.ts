import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { FilterColumn } from "../pages/tabs/user/Filter";
import { PostI } from "../components/pages/tabs/Post";

export interface AppStoreI {
  filters: FilterColumn[];
  selectedPost?: PostI;
  setSelectedPost: (p?: PostI) => void;
  updateFilters: (c: FilterColumn[]) => void;
  removeFilter: (column: string) => void;
}
const STORAGE_KEY = "app";

export const useAppStore = create<AppStoreI>()(
  persist(
    (set, get) => ({
      filters: [],
      setSelectedPost: (p) => {
        set({ selectedPost: p });
      },
      updateFilters: (f) => {
        set({ filters: f });
      },
      removeFilter: (c) => {
        set({ filters: get()?.filters?.filter((f) => f?.column != c) });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
