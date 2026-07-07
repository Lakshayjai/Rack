import type { Category } from "shared-types";

/**
 * Flat-lay auto-layout for outfit collages.
 *
 * Pure geometry: given the selected pieces (with their image aspect ratios), produce
 * fractional placements on a portrait 3:4 canvas that read like a styled Pinterest
 * flat-lay — top center-left with the bottoms tucked underneath it (waistband under
 * the hem, like a dressed mannequin), or a single full-body piece; shoes overlap
 * the bottoms at bottom-right; accessories run down a right-hand rail with the bag
 * bridging the top/bottom boundary. Consumed both by the builder's live preview
 * (absolute-positioned <img>s) and the Fabric designer canvas.
 */

export type SlotRole =
  | "top"
  | "bottom"
  | "full"
  | "outerwear"
  | "drape"
  | "shoes"
  | "accessory";

/**
 * Which layout slot a wardrobe category occupies. The subtype refines it:
 * a dupatta/stole is an ACCESSORY by category but drapes as its own tall layer
 * beside the main column, between the garments and the accessory rail.
 */
export function roleFor(category: Category, subtype?: string | null): SlotRole {
  if (/dupatta|stole/.test((subtype ?? "").toLowerCase())) return "drape";
  switch (category) {
    case "TOP":
      return "top";
    case "BOTTOM":
      return "bottom";
    case "DRESS":
      return "full";
    case "OUTERWEAR":
      return "outerwear";
    case "SHOE":
      return "shoes";
    default:
      return "accessory";
  }
}

export interface LayoutPiece {
  id: string;
  url: string;
  role: SlotRole;
  /** Garment type — used to order accessories (cap up top, bag mid-frame, …). */
  subtype?: string | null;
  /** height / width of the source image. Defaults to 1.15 until measured. */
  aspect?: number;
}

/** A placement in fractional canvas units (cx/cy/w of width, h of height). */
export interface Placement {
  id: string;
  url: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  z: number;
}

/** Canvas aspect (height / width) the fractions are tuned for — 600×800. */
const CANVAS_RATIO = 800 / 600;

/** Realistic relative proportions: display width as a fraction of canvas width. */
const BASE_W: Record<SlotRole, number> = {
  top: 0.46,
  bottom: 0.46,
  full: 0.48,
  outerwear: 0.46,
  drape: 0.22,
  shoes: 0.32,
  accessory: 0.18,
};

/** Height caps so tall photos (full-length pants, gowns) can't swallow the canvas. */
const MAX_H: Record<SlotRole, number> = {
  top: 0.32,
  bottom: 0.54,
  full: 0.66,
  outerwear: 0.38,
  drape: 0.52,
  shoes: 0.21,
  accessory: 0.15,
};

const DEFAULT_ASPECT = 1.15;

/** Vertical rail slots for accessories, ordered by where each kind naturally sits. */
function accessoryRailY(subtype: string | null | undefined): number {
  const t = (subtype ?? "").toLowerCase();
  if (/cap|hat|beanie|turban|safa|pagdi/.test(t)) return 0.1;
  if (/sunglass|glass|headphone|tikka/.test(t)) return 0.28;
  if (/watch|chain|necklace|earring|jhumka|bracelet|bangle|jewel|brooch|tie|hair/.test(t))
    return 0.44;
  if (/belt|scarf/.test(t)) return 0.62;
  return 0.44;
}

function isBag(subtype: string | null | undefined): boolean {
  return /bag|tote|backpack|purse|clutch|potli/.test((subtype ?? "").toLowerCase());
}

/** Width + clamped height (both fractional) for a piece at a given base width. */
function sized(role: SlotRole, aspect: number, widthFrac: number): { w: number; h: number } {
  let w = widthFrac;
  let h = (w * aspect) / CANVAS_RATIO;
  if (h > MAX_H[role]) {
    h = MAX_H[role];
    w = (h * CANVAS_RATIO) / aspect;
  }
  return { w, h };
}

/**
 * Computes the collage. Placements use center coordinates as fractions of the
 * canvas (cx, w of width; cy, h of height) so they scale to any renderer.
 */
export function layoutOutfit(pieces: LayoutPiece[]): Placement[] {
  const byRole = (role: SlotRole) => pieces.filter((p) => p.role === role);
  const fulls = byRole("full");
  const tops = byRole("top");
  const bottoms = byRole("bottom");
  const outers = byRole("outerwear");
  const drapes = byRole("drape");
  const shoes = byRole("shoes");
  const accessories = byRole("accessory");

  const placements: Placement[] = [];
  const total = pieces.length;
  // Sparse selections get scaled up so a 2-piece look still fills the frame.
  const boost = total <= 3 ? 1.16 : total <= 5 ? 1.06 : 1;
  const hasRail = accessories.some((a) => !isBag(a.subtype));
  // Main column sits left-of-center when an accessory rail needs the right side.
  const mainX = hasRail ? 0.36 : 0.44;
  // Where the top's hem meets the bottoms' waistband — the bag anchors here too.
  let boundaryY = 0.4;

  const place = (
    piece: LayoutPiece,
    role: SlotRole,
    cx: number,
    cy: number,
    z: number,
    widthFrac = BASE_W[role] * boost,
    index = 0,
  ) => {
    const { w, h } = sized(role, piece.aspect ?? DEFAULT_ASPECT, widthFrac);
    // Duplicate pieces in one slot cascade slightly instead of stacking exactly.
    placements.push({
      id: piece.id,
      url: piece.url,
      cx: cx + index * 0.06,
      cy: cy + index * 0.05,
      w,
      h,
      z,
    });
    return { w, h };
  };

  if (fulls.length > 0) {
    // Full-body look: dress/jumpsuit anchors the column; outerwear layers behind it.
    outers.forEach((p, i) => place(p, "outerwear", mainX - 0.14, 0.28, 1, undefined, i));
    fulls.forEach((p, i) => place(p, "full", mainX, 0.42, 2, undefined, i));
    boundaryY = 0.5;
  } else {
    const outerAside = tops.length > 0;
    const topY = 0.23;

    if (tops.length > 0) {
      const { h } = place(tops[0], "top", mainX, topY, 3);
      boundaryY = topY + h / 2;
      tops.slice(1).forEach((p, i) => place(p, "top", mainX, topY, 3, undefined, i + 1));
    }
    outers.forEach((p, i) =>
      outerAside
        ? place(p, "outerwear", mainX - 0.17, topY + 0.04, 2, undefined, i)
        : place(p, "outerwear", mainX, topY, 3, undefined, i),
    );
    if (!tops.length && outers.length) {
      const outerH = sized(
        "outerwear",
        outers[0].aspect ?? DEFAULT_ASPECT,
        BASE_W.outerwear * boost,
      ).h;
      boundaryY = topY + outerH / 2;
    }

    bottoms.forEach((p, i) => {
      const { h } = sized("bottom", p.aspect ?? DEFAULT_ASPECT, BASE_W.bottom * boost);
      const hasUpper = tops.length > 0 || outers.length > 0;
      // The waistband tucks under the top's hem, like the reference flat-lays.
      const cy = hasUpper ? Math.min(boundaryY + h / 2 - 0.05, 0.72) : 0.4;
      place(p, "bottom", mainX + 0.05, cy, 2, undefined, i);
    });
  }

  const hasMains = fulls.length + tops.length + bottoms.length + outers.length > 0;

  // Dupatta / stole: a tall drape hanging beside the main column, layered above
  // the garments and below the accessory rail (like a flat-lay's trailing fabric).
  drapes.forEach((p, i) =>
    hasMains
      ? place(p, "drape", mainX - 0.21, Math.min(boundaryY + 0.06, 0.6), 4, undefined, i)
      : place(p, "drape", 0.34, 0.42, 2, BASE_W.drape * 1.5, i),
  );

  shoes.forEach((p, i) => {
    // Shoes sit bottom-right, slightly overlapping the bottoms' leg.
    const cx = hasMains ? 0.72 : 0.5;
    const cy = hasMains ? 0.86 : hasRail ? 0.62 : 0.5;
    place(p, "shoes", cx, cy, 5, undefined, i);
  });

  if (accessories.length > 0) {
    if (!hasMains && shoes.length === 0) {
      // Accessories-only board: a simple centered grid.
      const cols = Math.min(3, Math.ceil(Math.sqrt(accessories.length)));
      const rows = Math.ceil(accessories.length / cols);
      accessories.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        place(
          p,
          "accessory",
          0.5 + (col - (cols - 1) / 2) * 0.3,
          0.5 + (row - (rows - 1) / 2) * 0.24,
          3,
          BASE_W.accessory * 1.4,
        );
      });
    } else {
      const bags = accessories.filter((a) => isBag(a.subtype));
      const rail = accessories.filter((a) => !isBag(a.subtype));

      // The bag bridges the top/bottom boundary, overlapping both (reference style).
      bags.forEach((p, i) =>
        hasMains
          ? place(p, "accessory", mainX + 0.16, boundaryY + 0.02, 6, 0.26 * boost, i)
          : place(p, "accessory", 0.85, 0.55, 4, 0.26 * boost, i),
      );

      // Everything else runs down the right-hand rail in natural order.
      const sorted = [...rail].sort(
        (a, b) => accessoryRailY(a.subtype) - accessoryRailY(b.subtype),
      );
      const many = sorted.length > 4;
      sorted.forEach((p, i) => {
        const cy = many
          ? 0.08 + (i * 0.6) / (sorted.length - 1)
          : accessoryRailY(p.subtype);
        place(p, "accessory", 0.84, cy, 4);
      });
    }
  }

  // Vertically re-center the main column so short stacks don't hug the top edge.
  if (hasMains) {
    const mains = placements.filter((pl) => pl.cx <= mainX + 0.1);
    const min = Math.min(...mains.map((pl) => pl.cy - pl.h / 2));
    const max = Math.max(...mains.map((pl) => pl.cy + pl.h / 2));
    const shift = Math.max(-0.06, Math.min(0.06, 0.47 - (min + max) / 2));
    mains.forEach((pl) => {
      pl.cy += shift;
    });
  }

  return placements.sort((a, b) => a.z - b.z);
}
