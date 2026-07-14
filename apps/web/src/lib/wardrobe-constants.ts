import {
  Shirt,
  Rows3,
  Footprints,
  Watch,
  Layers,
  Ribbon,
  type LucideIcon,
} from "lucide-react";
import { ETHNIC_WEAR, type Category, type EthnicSubcategory, type Gender } from "shared-types";

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
 * Gender-neutral display names. DRESS is the "full-body" slot (dresses, jumpsuits,
 * co-ord sets) so it reads correctly for every wardrobe.
 */
export const CATEGORY_LABELS: Record<Category, string> = {
  TOP: "top",
  BOTTOM: "bottom",
  DRESS: "full-body",
  SHOE: "footwear",
  ACCESSORY: "accessory",
  OUTERWEAR: "outerwear",
};

/**
 * Categories offered per wardrobe owner. Every gender gets the full set —
 * DRESS ("full-body") covers jumpsuits and co-ord sets too.
 */
export function categoriesFor(_gender: Gender | null | undefined): Category[] {
  return ["TOP", "BOTTOM", "DRESS", "SHOE", "ACCESSORY", "OUTERWEAR"];
}

/** Gender-aware garment types offered per category (saved as `subtype`). */
const SUBTYPES: Record<Gender, Partial<Record<Category, string[]>>> = {
  male: {
    TOP: ["t-shirt", "shirt", "polo", "jersey", "hoodie", "sweatshirt", "sweater", "vest"],
    BOTTOM: ["jeans", "trousers", "chinos", "cargos", "shorts", "joggers"],
    DRESS: ["co-ord set", "jumpsuit", "tracksuit"],
    SHOE: ["sneakers", "loafers", "boots", "formal shoes", "sandals", "slippers", "sports shoes"],
    ACCESSORY: ["watch", "belt", "cap", "sunglasses", "chain", "bracelet", "tie", "bag", "headphones"],
    OUTERWEAR: ["jacket", "denim jacket", "blazer", "overshirt", "coat", "bomber", "cardigan"],
  },
  female: {
    TOP: ["top", "t-shirt", "blouse", "shirt", "crop top", "bodysuit", "camisole", "sweater", "hoodie"],
    BOTTOM: ["jeans", "skirt", "trousers", "shorts", "leggings", "culottes", "cargos"],
    DRESS: ["midi dress", "maxi dress", "mini dress", "bodycon", "slip dress", "gown", "jumpsuit", "co-ord set"],
    SHOE: ["heels", "flats", "sneakers", "boots", "sandals", "wedges", "mules", "slippers"],
    ACCESSORY: ["earrings", "necklace", "bag", "belt", "scarf", "sunglasses", "bracelet", "hair clip", "watch", "cap", "headphones"],
    OUTERWEAR: ["jacket", "cardigan", "blazer", "coat", "shrug", "denim jacket"],
  },
};

/** Ethnic subcategories offered to a wardrobe owner (unknown gender gets all). */
export function ethnicWearFor(gender: Gender | null | undefined): EthnicSubcategory[] {
  if (gender !== "male" && gender !== "female") return ETHNIC_WEAR;
  return ETHNIC_WEAR.filter((e) => !e.genders || e.genders.includes(gender));
}

/** Label for the Ethnic / Indian Wear group in pickers and filters. */
export const ETHNIC_GROUP_LABEL = "ethnic / indian";

/**
 * Garment types for a category; unknown gender gets the union of both lists.
 * Ethnic wear (saree, kurta, juttis, …) is appended under its structural category.
 */
export function subtypesFor(
  gender: Gender | null | undefined,
  category: Category,
): string[] {
  const western =
    gender === "male" || gender === "female"
      ? (SUBTYPES[gender][category] ?? [])
      : [...(SUBTYPES.male[category] ?? []), ...(SUBTYPES.female[category] ?? [])];
  const ethnic = ethnicWearFor(gender)
    .filter((e) => e.category === category)
    .map((e) => e.name);
  return Array.from(new Set([...western, ...ethnic]));
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
