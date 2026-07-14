/**
 * Shared clothing domain types, used by both the NestJS API and the Next.js web app.
 */

/** Wardrobe item categories. DRESS is displayed as the gender-neutral "Full-body" slot (dresses, jumpsuits, co-ord sets). */
export const CATEGORIES = ['TOP', 'BOTTOM', 'DRESS', 'SHOE', 'ACCESSORY', 'OUTERWEAR'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Style tags an item can carry. */
export const STYLES = ['casual', 'formal', 'streetwear', 'smart-casual', 'sport', 'ethnic'] as const;
export type Style = (typeof STYLES)[number];

/** Occasion tags an item can carry. */
export const OCCASIONS = ['daily', 'work', 'party', 'gym', 'date', 'wedding', 'festival', 'puja'] as const;
export type Occasion = (typeof OCCASIONS)[number];

/**
 * Ethnic / Indian Wear subcategories. Each maps a garment to the structural
 * category that drives storage, filters and canvas slots (a saree occupies the
 * full-body slot like a dress; a kurta is a top; juttis are footwear). The
 * subcategory name is stored as the item's `subtype`.
 */
export interface EthnicSubcategory {
  /** Display name, also saved as the item's subtype (e.g. "saree"). */
  name: string;
  /** Structural category the piece occupies. */
  category: Category;
  /** Wardrobes this is offered to by default; omitted = every gender. */
  genders?: ('male' | 'female')[];
}

export const ETHNIC_WEAR: EthnicSubcategory[] = [
  // Women
  { name: 'saree', category: 'DRESS', genders: ['female'] },
  { name: 'lehenga', category: 'BOTTOM', genders: ['female'] },
  { name: 'choli', category: 'TOP', genders: ['female'] },
  { name: 'salwar', category: 'BOTTOM', genders: ['female'] },
  { name: 'churidar', category: 'BOTTOM' },
  { name: 'kameez', category: 'TOP', genders: ['female'] },
  { name: 'kurti', category: 'TOP', genders: ['female'] },
  { name: 'kurta', category: 'TOP' },
  { name: 'anarkali', category: 'DRESS', genders: ['female'] },
  { name: 'ethnic gown', category: 'DRESS', genders: ['female'] },
  { name: 'sharara', category: 'BOTTOM', genders: ['female'] },
  { name: 'palazzo', category: 'BOTTOM', genders: ['female'] },
  // Men
  { name: 'kurta-pajama set', category: 'DRESS', genders: ['male'] },
  { name: 'sherwani', category: 'DRESS', genders: ['male'] },
  { name: 'nehru jacket', category: 'OUTERWEAR', genders: ['male'] },
  { name: 'bandhgala', category: 'OUTERWEAR', genders: ['male'] },
  { name: 'dhoti', category: 'BOTTOM', genders: ['male'] },
  { name: 'pajama', category: 'BOTTOM', genders: ['male'] },
  { name: 'pathani suit', category: 'DRESS', genders: ['male'] },
  // Unisex footwear & accessories
  { name: 'juttis', category: 'SHOE' },
  { name: 'mojaris', category: 'SHOE' },
  { name: 'kolhapuris', category: 'SHOE' },
  { name: 'dupatta', category: 'ACCESSORY' },
  { name: 'stole', category: 'ACCESSORY' },
  { name: 'turban / safa', category: 'ACCESSORY', genders: ['male'] },
  { name: 'potli bag', category: 'ACCESSORY' },
  { name: 'jhumkas', category: 'ACCESSORY', genders: ['female'] },
  { name: 'ethnic jewelry', category: 'ACCESSORY' },
  { name: 'bangles', category: 'ACCESSORY', genders: ['female'] },
  { name: 'maang tikka', category: 'ACCESSORY', genders: ['female'] },
  { name: 'brooch', category: 'ACCESSORY' },
];

export const ETHNIC_SUBTYPE_NAMES: string[] = ETHNIC_WEAR.map((e) => e.name);

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
  /** Ids of items this piece pairs with as a set (lehenga + choli + dupatta). */
  pairedItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Whether two items are linked as a set (pairing reads as symmetric). */
export function arePaired(
  a: Pick<ClothingItem, 'id' | 'pairedItemIds'>,
  b: Pick<ClothingItem, 'id' | 'pairedItemIds'>,
): boolean {
  return a.pairedItemIds.includes(b.id) || b.pairedItemIds.includes(a.id);
}
