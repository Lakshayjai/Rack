import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ClothingItem } from "shared-types";

interface WardrobeState {
  items: ClothingItem[];
  /** Whether the cache has been loaded at least once this session. */
  loaded: boolean;
  setItems: (items: ClothingItem[]) => void;
  addItem: (item: ClothingItem) => void;
  updateItem: (item: ClothingItem) => void;
  removeItem: (id: string) => void;
  setLoaded: (loaded: boolean) => void;
}

/**
 * Client cache of the user's wardrobe. Persisted to sessionStorage so navigating
 * between pages doesn't force a re-fetch (network refresh still happens on mount).
 */
export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set) => ({
      items: [],
      loaded: false,
      setItems: (items) => set({ items, loaded: true }),
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      updateItem: (item) =>
        set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setLoaded: (loaded) => set({ loaded }),
    }),
    {
      name: "wardrobe-cache",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
