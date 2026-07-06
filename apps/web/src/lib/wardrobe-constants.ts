import {
  Shirt,
  Rows3,
  Footprints,
  Watch,
  Layers,
  Ribbon,
  type LucideIcon,
} from "lucide-react";
import type { Category, Gender } from "shared-types";

/** Icon shown for each category in selectors and badges. */
export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  TOP: Shirt,
  BOTTOM: Rows3,
  DRESS: Ribbon,
  SHOE: Footprints,
  ACCESSORY: Watch,
  OUTERWEAR: Layers,
};

/**
 * Categories offered per wardrobe owner. DRESS is a women's category;
 * a null/unknown gender sees everything.
 */
export function categoriesFor(gender: Gender | null | undefined): Category[] {
  if (gender === "male") return ["TOP", "BOTTOM", "SHOE", "ACCESSORY", "OUTERWEAR"];
  if (gender === "female") return ["TOP", "BOTTOM", "DRESS", "SHOE", "ACCESSORY", "OUTERWEAR"];
  return ["TOP", "BOTTOM", "DRESS", "SHOE", "ACCESSORY", "OUTERWEAR"];
}

/** Gender-aware garment types offered per category (saved as `subtype`). */
const SUBTYPES: Record<Gender, Partial<Record<Category, string[]>>> = {
  male: {
    TOP: ["t-shirt", "shirt", "polo", "hoodie", "sweatshirt", "sweater", "vest"],
    BOTTOM: ["jeans", "trousers", "chinos", "cargos", "shorts", "joggers"],
    SHOE: ["sneakers", "loafers", "boots", "formal shoes", "sandals", "sports shoes"],
    ACCESSORY: ["watch", "belt", "cap", "sunglasses", "chain", "bracelet", "tie"],
    OUTERWEAR: ["jacket", "denim jacket", "blazer", "overshirt", "coat", "bomber"],
  },
  female: {
    TOP: ["top", "t-shirt", "blouse", "shirt", "crop top", "bodysuit", "camisole", "sweater"],
    BOTTOM: ["jeans", "skirt", "trousers", "shorts", "leggings", "palazzo", "culottes"],
    DRESS: ["midi dress", "maxi dress", "mini dress", "bodycon", "slip dress", "gown", "jumpsuit"],
    SHOE: ["heels", "flats", "sneakers", "boots", "sandals", "wedges", "mules"],
    ACCESSORY: ["earrings", "necklace", "bag", "belt", "scarf", "sunglasses", "bracelet", "hair clip"],
    OUTERWEAR: ["jacket", "cardigan", "blazer", "coat", "shrug", "denim jacket"],
  },
};

/** Garment types for a category; unknown gender gets the union of both lists. */
export function subtypesFor(
  gender: Gender | null | undefined,
  category: Category,
): string[] {
  if (gender === "male" || gender === "female") return SUBTYPES[gender][category] ?? [];
  const merged = [
    ...(SUBTYPES.male[category] ?? []),
    ...(SUBTYPES.female[category] ?? []),
  ];
  return Array.from(new Set(merged));
}

/** Preset color swatches (name + hex). Stored as the lowercase name. */
export const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "black", hex: "#0a0a0a" },
  { name: "white", hex: "#f5f5f5" },
  { name: "grey", hex: "#9ca3af" },
  { name: "navy", hex: "#1e3a5f" },
  { name: "blue", hex: "#3b82f6" },
  { name: "beige", hex: "#d8c3a5" },
  { name: "brown", hex: "#7c5c3e" },
  { name: "green", hex: "#16a34a" },
  { name: "red", hex: "#dc2626" },
  { name: "pink", hex: "#e58aa8" },
  { name: "cream", hex: "#f5f0e1" },
];

export const HEX_BY_COLOR: Record<string, string> = Object.fromEntries(
  PRESET_COLORS.map((c) => [c.name, c.hex]),
);
