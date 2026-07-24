import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { FilterColumn } from "../pages/tabs/user/Filter";
import { PostI } from "../components/pages/tabs/Post";

export interface BottomSheetContentI {
  title: string;
  body: string;
  action: { title: string; method: () => void };
}

interface AlertI {
  title?: string;
  body: string;
}

export interface AppStoreI {
  filters: FilterColumn[];
  showHomeBadge: boolean;
  setShowHomeBadge: () => void;
  error: AlertI;
  postToUpdate?: PostI;
  setPostToUpdate: (p?: PostI) => void;
  setError: (e: AlertI) => void;
  success: AlertI;
  setSuccess: (e: AlertI) => void;
  favouritesCount: number;
  setFavouritesCount: (c: number) => void;
  RootBottomContent?: BottomSheetContentI;
  setRootBottomContent: (c?: BottomSheetContentI) => void;
  LoginPrompt: (page: string) => void;
  selectedPost?: PostI;
  setSelectedPost: (p?: PostI) => void;
  updateFilters: (c: FilterColumn[]) => void;
  removeFilter: (column: string) => void;
}
const STORAGE_KEY = "app";
export const useAppStore = create<AppStoreI>()(
  persist(
    (set, get) => ({
      postToUpdate: undefined,
      setPostToUpdate: (p) => {
        set({ postToUpdate: p });
      },
      filters: [],
      favouritesCount: 0,
      setFavouritesCount: (c) => {
        set({ favouritesCount: c });
      },
      error: { body: "" },
      setError: (v) => {
        set({ error: v });
      },
      success: { body: "" },
      setSuccess: (v) => {
        set({ success: v });
      },
      showHomeBadge: true,
      setShowHomeBadge: () => {
        set({ showHomeBadge: !get()?.showHomeBadge });
      },
      LoginPrompt: (p) => {
        set({
          RootBottomContent: {
            title: "Login is required",
            body:
              "inorder to acess " +
              p +
              " you have to be logged in, its super simple, would you like to proceed",
            action: {
              title: "get started",
              method: () => {
                set({ RootBottomContent: undefined });
                window.location.href = "/auth";
              },
            },
          },
        });
      },
      setSelectedPost: (p) => {
        set({ selectedPost: p });
      },
      setRootBottomContent: (c) => {
        set({ RootBottomContent: c });
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
      partialize: (state) => ({
        filters: state.filters,
        showHomeBadge: state.showHomeBadge,
        favouritesCount: state.favouritesCount,
        // only persist what actually needs to survive reload
      }),
    }
  )
);
