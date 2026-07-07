"use client";

import { useCallback, useState } from "react";
import type { CanvasState, Outfit, OutfitSort } from "shared-types";
import { api } from "@/lib/api";

interface PaginatedOutfits {
  outfits: Outfit[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOutfitInput {
  name: string;
  description?: string;
  canvasState: CanvasState;
  itemIds: string[];
  tags?: string[];
}

/** Outfit data actions. Kept stateless (no global cache) — the gallery holds its own list. */
export function useOutfits() {
  const [loading, setLoading] = useState(false);

  const list = useCallback(async (sort: OutfitSort = "newest") => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedOutfits>("/outfits", { query: { sort, limit: 100 } });
      return data.outfits;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((id: string) => api.get<Outfit>(`/outfits/${id}`), []);

  const create = useCallback(
    (input: CreateOutfitInput) => api.post<Outfit>("/outfits", input),
    [],
  );

  const update = useCallback(
    (id: string, input: Partial<CreateOutfitInput>) => api.patch<Outfit>(`/outfits/${id}`, input),
    [],
  );

  const remove = useCallback((id: string) => api.delete(`/outfits/${id}`), []);

  const duplicate = useCallback(
    (id: string) => api.post<Outfit>(`/outfits/${id}/duplicate`),
    [],
  );

  const exportPng = useCallback(
    (id: string, imageData: string) =>
      api.post<Outfit>(`/outfits/${id}/export`, { imageData }),
    [],
  );

  const markWorn = useCallback(
    (id: string, date?: string) => api.post<Outfit>(`/outfits/${id}/worn`, { date }),
    [],
  );

  return { loading, list, get, create, update, remove, duplicate, exportPng, markWorn };
}
