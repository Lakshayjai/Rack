/**
 * Shared outfit domain types.
 */

/**
 * Serialized Fabric.js canvas state. Kept as an opaque record because the
 * shape is owned by Fabric.js; we only ever round-trip it through the API.
 */
export type CanvasState = Record<string, unknown>;

/** A saved outfit as returned by the API. */
export interface Outfit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  canvasState: CanvasState;
  exportedImageUrl: string | null;
  itemIds: string[];
  wornDates: string[];
  createdAt: string;
  updatedAt: string;
}

/** Sort options for the outfit gallery. */
export const OUTFIT_SORTS = ['newest', 'most-worn', 'name-asc'] as const;
export type OutfitSort = (typeof OUTFIT_SORTS)[number];
