import * as fabric from "fabric";
import type { CanvasState } from "shared-types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/types/canvas";

/** Background used for exported collage PNGs (soft off-white, like a flat-lay board). */
export const EXPORT_BACKGROUND = "#f7f4ee";

/**
 * Renders a saved canvas state to a PNG data URL on an offscreen StaticCanvas,
 * so Lookbook previews can be (re)generated without mounting the designer.
 * `loadFromJSON` resolves only once every image element has finished loading,
 * so the export can never capture a half-loaded board. Saved image objects carry
 * `crossOrigin: "anonymous"` in their JSON, keeping the canvas untainted.
 */
export async function renderOutfitPreview(state: CanvasState): Promise<string> {
  const canvas = new fabric.StaticCanvas(undefined, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    enableRetinaScaling: false,
  });
  try {
    await canvas.loadFromJSON(state as object);
    // The designer works on a transparent ground; exports get the flat-lay board.
    canvas.backgroundColor = EXPORT_BACKGROUND;
    canvas.renderAll();
    return canvas.toDataURL({ format: "png", multiplier: 2 });
  } finally {
    void canvas.dispose();
  }
}
