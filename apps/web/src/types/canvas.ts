import type { CanvasState, Category } from "shared-types";

/** Minimal item info the canvas needs to auto-arrange a flat-lay collage. */
export interface ArrangeItem {
  id: string;
  url: string;
  category: Category;
  subtype?: string | null;
}

/** Canvas dimensions (design units). The element is scaled responsively via CSS. */
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

/** Vertical drop-zone guides (y ranges), shown as dashed overlays when the canvas is empty. */
export const ZONES = [
  { key: "top", label: "Tops & Outerwear", from: 0, to: 280, color: "#93c5fd" },
  { key: "middle", label: "Bottoms", from: 280, to: 560, color: "#c4b5fd" },
  { key: "bottom", label: "Shoes", from: 560, to: 720, color: "#fdba74" },
] as const;

/** Snapshot of canvas state exposed to React for enabling/disabling controls. */
export interface CanvasStatus {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasObjects: boolean;
}

/** Imperative handle exposed by <OutfitCanvas> for the toolbar / properties panel. */
export interface CanvasController {
  /** Add a wardrobe item's image to the canvas, optionally at drop coordinates (element pixels). */
  addImage: (url: string, itemId: string, dropX?: number, dropY?: number) => Promise<void>;
  /** Clear the canvas and lay the given items out as a styled flat-lay collage. */
  autoLayout: (items: ArrangeItem[]) => Promise<void>;
  /** Swap the selected image for another item, keeping position, size and rotation. */
  replaceSelected: (url: string, itemId: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  removeSelected: () => void;
  clear: () => void;
  /** Serialize the canvas (Fabric JSON) for saving. */
  toState: () => CanvasState;
  /** Restore a previously saved canvas state. */
  loadState: (state: CanvasState) => Promise<void>;
  /** Export a high-res PNG data URL. */
  toPng: () => string;
  /** The ids of wardrobe items currently on the canvas. */
  usedItemIds: () => string[];
}
