"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as fabric from "fabric";
import type { CanvasState } from "shared-types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type CanvasController,
  type CanvasStatus,
} from "@/types/canvas";

const MAX_HISTORY = 20;
// Custom per-object property we persist so saved outfits remember which item each image is.
const EXTRA_PROPS = ["itemId"];

/**
 * Fabric.js v6 canvas wrapper. Manages the canvas instance, an undo/redo history
 * of JSON snapshots (max 20), and exposes an imperative controller to the parent.
 * `onStatusChange` reports derived flags used to enable/disable toolbar buttons.
 */
export const OutfitCanvas = forwardRef<
  CanvasController,
  { onStatusChange?: (status: CanvasStatus) => void }
>(function OutfitCanvas({ onStatusChange }, ref) {
  const elRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);

  // History stack of serialized states + the current index.
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  // When true, mutations are being applied programmatically (load/undo) and must not be recorded.
  const restoring = useRef(false);

  const emitStatus = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onStatusChange?.({
      canUndo: historyIndex.current > 0,
      canRedo: historyIndex.current < history.current.length - 1,
      hasSelection: canvas.getActiveObjects().length > 0,
      hasObjects: canvas.getObjects().length > 0,
    });
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || restoring.current) return;
    const json = JSON.stringify(canvas.toObject(EXTRA_PROPS));
    // Drop any redo branch, append, and cap the stack length.
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(json);
    if (history.current.length > MAX_HISTORY) history.current.shift();
    historyIndex.current = history.current.length - 1;
    emitStatus();
  };

  const restore = async (json: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    restoring.current = true;
    await canvas.loadFromJSON(JSON.parse(json));
    canvas.renderAll();
    restoring.current = false;
    emitStatus();
  };

  // Initialize the Fabric canvas once.
  useEffect(() => {
    if (!elRef.current) return;
    const canvas = new fabric.Canvas(elRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
    });
    canvasRef.current = canvas;

    // Seed history with the empty state.
    history.current = [JSON.stringify(canvas.toObject(EXTRA_PROPS))];
    historyIndex.current = 0;

    const onMutate = () => {
      snapshot();
    };
    canvas.on("object:added", onMutate);
    canvas.on("object:modified", onMutate);
    canvas.on("object:removed", onMutate);
    canvas.on("selection:created", emitStatus);
    canvas.on("selection:updated", emitStatus);
    canvas.on("selection:cleared", emitStatus);

    emitStatus();

    return () => {
      void canvas.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    (): CanvasController => ({
      addImage: async (url, itemId, dropX, dropY) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
        img.scaleToWidth(200);
        // Center on the drop point when provided, else near the top-center.
        const left = dropX ?? CANVAS_WIDTH / 2;
        const top = dropY ?? 140;
        img.set({ left, top, originX: "center", originY: "center" });
        // Persist which wardrobe item this image represents.
        (img as fabric.FabricImage & { itemId?: string }).itemId = itemId;
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      },
      undo: () => {
        if (historyIndex.current <= 0) return;
        historyIndex.current -= 1;
        void restore(history.current[historyIndex.current]);
      },
      redo: () => {
        if (historyIndex.current >= history.current.length - 1) return;
        historyIndex.current += 1;
        void restore(history.current[historyIndex.current]);
      },
      bringForward: () => {
        const c = canvasRef.current;
        const o = c?.getActiveObject();
        if (c && o) {
          c.bringObjectForward(o);
          c.renderAll();
          snapshot();
        }
      },
      sendBackward: () => {
        const c = canvasRef.current;
        const o = c?.getActiveObject();
        if (c && o) {
          c.sendObjectBackwards(o);
          c.renderAll();
          snapshot();
        }
      },
      bringToFront: () => {
        const c = canvasRef.current;
        const o = c?.getActiveObject();
        if (c && o) {
          c.bringObjectToFront(o);
          c.renderAll();
          snapshot();
        }
      },
      sendToBack: () => {
        const c = canvasRef.current;
        const o = c?.getActiveObject();
        if (c && o) {
          c.sendObjectToBack(o);
          c.renderAll();
          snapshot();
        }
      },
      removeSelected: () => {
        const c = canvasRef.current;
        if (!c) return;
        c.getActiveObjects().forEach((o) => c.remove(o));
        c.discardActiveObject();
        c.renderAll();
      },
      clear: () => {
        const c = canvasRef.current;
        if (!c) return;
        c.remove(...c.getObjects());
        c.discardActiveObject();
        c.renderAll();
      },
      toState: () => {
        const c = canvasRef.current;
        return (c ? c.toObject(EXTRA_PROPS) : {}) as CanvasState;
      },
      loadState: async (state) => {
        await restore(JSON.stringify(state));
        // Reset history to the loaded state so undo doesn't jump to the empty canvas.
        history.current = [JSON.stringify(state)];
        historyIndex.current = 0;
        emitStatus();
      },
      toPng: () => {
        const c = canvasRef.current;
        if (!c) return "";
        return c.toDataURL({ format: "png", multiplier: 2 });
      },
      usedItemIds: () => {
        const c = canvasRef.current;
        if (!c) return [];
        const ids = c
          .getObjects()
          .map((o) => (o as fabric.Object & { itemId?: string }).itemId)
          .filter((id): id is string => Boolean(id));
        return Array.from(new Set(ids));
      },
    }),
    [],
  );

  return <canvas ref={elRef} />;
});
