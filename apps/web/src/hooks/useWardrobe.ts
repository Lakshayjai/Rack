"use client";

import { useCallback, useState } from "react";
import type { ClothingItem, Category, ExtractionResult } from "shared-types";
import { api } from "@/lib/api";
import { useWardrobeStore } from "@/stores/wardrobeStore";

export interface WardrobeFilters {
  category?: Category;
  /** Restrict to the Ethnic / Indian Wear group. Combines with the other filters. */
  ethnic?: boolean;
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
  subtype?: string;
  colors: string[];
  styles: string[];
  occasions: string[];
  brand?: string;
  notes?: string;
  /** Items this piece pairs with as a set (lehenga + choli + dupatta). */
  pairedItemIds?: string[];
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
      if (meta.subtype) fd.append("subtype", meta.subtype);
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

  /** Run garment extraction on a photo; returns candidate cutouts without saving. */
  const extractItem = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload<ExtractionResult>("/items/extract", fd);
  }, []);

  /** Save an approved cutout (transparent PNG data URL) as a new wardrobe item. */
  const uploadExtracted = useCallback(
    async (imageData: string, meta: UploadMetadata) => {
      const item = await api.post<ClothingItem>("/items", { ...meta, imageData });
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

  return {
    items,
    loaded,
    fetching,
    fetchItems,
    uploadItem,
    extractItem,
    uploadExtracted,
    editItem,
    deleteItem,
  };
}
