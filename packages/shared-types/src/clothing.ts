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

/**
 * Garment-extraction candidate labels produced by the rembg service:
 * cloth-parsing classes (`upper` / `lower` / `full`) when a person is wearing the
 * clothes, plus `item` for the whole-foreground cutout (product shots, shoes, bags).
 */
export const EXTRACTION_LABELS = ['upper', 'lower', 'full', 'item'] as const;
export type ExtractionLabel = (typeof EXTRACTION_LABELS)[number];

/** One garment cutout proposed by POST /api/items/extract. */
export interface ExtractionCandidate {
  label: ExtractionLabel;
  /** Category pre-selected in the UI for this cutout (user can override). */
  suggestedCategory: Category;
  /** 0..1 heuristic; low values mean "review / refine this one". */
  confidence: number;
  /** Full-frame transparent PNG as a data URL. */
  imageData: string;
  /** Tight bounding box of the garment inside the frame (pixels). */
  bbox: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
}

/** Response of POST /api/items/extract. */
export interface ExtractionResult {
  /** Whether a person appears to be wearing the clothes. */
  mode: 'person' | 'product';
  candidates: ExtractionCandidate[];
}

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
