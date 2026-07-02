import {
  Shirt,
  Rows3,
  Footprints,
  Watch,
  Layers,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "shared-types";

/** Icon shown for each category in selectors and badges. */
export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  TOP: Shirt,
  BOTTOM: Rows3,
  SHOE: Footprints,
  ACCESSORY: Watch,
  OUTERWEAR: Layers,
};

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
  { name: "cream", hex: "#f5f0e1" },
];

export const HEX_BY_COLOR: Record<string, string> = Object.fromEntries(
  PRESET_COLORS.map((c) => [c.name, c.hex]),
);
