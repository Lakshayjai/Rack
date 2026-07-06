/**
 * Shared clothing domain types, used by both the NestJS API and the Next.js web app.
 */

/** Wardrobe item categories. DRESS is shown only for female users in the UI. */
export const CATEGORIES = ['TOP', 'BOTTOM', 'DRESS', 'SHOE', 'ACCESSORY', 'OUTERWEAR'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Style tags an item can carry. */
export const STYLES = ['casual', 'formal', 'streetwear', 'smart-casual', 'sport'] as const;
export type Style = (typeof STYLES)[number];

/** Occasion tags an item can carry. */
export const OCCASIONS = ['daily', 'work', 'party', 'gym', 'date'] as const;
export type Occasion = (typeof OCCASIONS)[number];

/** A single wardrobe item as returned by the API. */
export interface ClothingItem {
  id: string;
  userId: string;
  imageUrl: string;
  thumbUrl: string | null;
  category: Category;
  /** Gender-aware garment type, e.g. "t-shirt", "shirt", "heels". */
  subtype: string | null;
  colors: string[];
  styles: string[];
  occasions: string[];
  brand: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
