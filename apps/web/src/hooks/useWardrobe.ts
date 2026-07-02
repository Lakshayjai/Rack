"use client";

import { useCallback, useState } from "react";
import type { ClothingItem, Category } from "shared-types";
import { api } from "@/lib/api";
import { useWardrobeStore } from "@/stores/wardrobeStore";

export interface WardrobeFilters {
  category?: Category;
  style?: string;
  color?: string;
  search?: string;
}

interface PaginatedItems {
  items: ClothingItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadMetadata {
  category: Category;
  colors: string[];
  styles: string[];
  occasions: string[];
  brand?: string;
  notes?: string;
}

/** Wardrobe data actions backed by the Zustand cache. */
export function useWardrobe() {
  const { items, loaded, setItems, addItem, updateItem, removeItem } = useWardrobeStore();
  const [fetching, setFetching] = useState(false);

  /** Load items from the API applying the given filters. */
  const fetchItems = useCallback(
    async (filters: WardrobeFilters = {}) => {
      setFetching(true);
      try {
        const data = await api.get<PaginatedItems>("/items", {
          query: { ...filters, limit: 100 },
        });
        setItems(data.items);
        return data.items;
      } finally {
        setFetching(false);
      }
    },
    [setItems],
  );

  /** Upload a photo + metadata; the API processes the image and returns the item. */
  const uploadItem = useCallback(
    async (file: File, meta: UploadMetadata) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", meta.category);
      fd.append("colors", JSON.stringify(meta.colors));
      fd.append("styles", JSON.stringify(meta.styles));
      fd.append("occasions", JSON.stringify(meta.occasions));
      if (meta.brand) fd.append("brand", meta.brand);
      if (meta.notes) fd.append("notes", meta.notes);
      const item = await api.upload<ClothingItem>("/items", fd);
      addItem(item);
      return item;
    },
    [addItem],
  );

  const editItem = useCallback(
    async (id: string, dto: Partial<UploadMetadata>) => {
      const item = await api.patch<ClothingItem>(`/items/${id}`, dto);
      updateItem(item);
      return item;
    },
    [updateItem],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await api.delete(`/items/${id}`);
      removeItem(id);
    },
    [removeItem],
  );

  return { items, loaded, fetching, fetchItems, uploadItem, editItem, deleteItem };
}
