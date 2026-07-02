"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { OutfitCanvas } from "./OutfitCanvas";
import { ZoneOverlay } from "./ZoneOverlay";
import { DRAG_MIME } from "./CanvasSidebar";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type CanvasController,
  type CanvasStatus,
} from "@/types/canvas";

/**
 * Hosts the fabric canvas at its natural 600×800 size but scales it with a CSS
 * transform to fit the available width. Handles HTML5 drops from the sidebar,
 * translating pointer coordinates back into canvas space using the current scale.
 */
export function CanvasStage({
  canvasRef,
  onStatusChange,
  zonesVisible,
}: {
  canvasRef: RefObject<CanvasController | null>;
  onStatusChange: (status: CanvasStatus) => void;
  zonesVisible: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const scaledRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragOver, setDragOver] = useState(false);

  // Fit the canvas to the container width (never upscale beyond 1).
  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth;
      setScale(Math.min(1, available / CANVAS_WIDTH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep hasObjects state fresh for the ZoneOverlay via the shared status callback.
  const [hasObjects, setHasObjects] = useState(false);
  const handleStatus = (s: CanvasStatus) => {
    setHasObjects(s.hasObjects);
    onStatusChange(s);
  };

  return (
    <div ref={outerRef} className="w-full">
      {/* Reserve layout space equal to the scaled canvas height. */}
      <div style={{ height: CANVAS_HEIGHT * scale }} className="relative mx-auto" >
        <div
          ref={scaledRef}
          className="absolute left-1/2"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            if (!dragOver) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const raw = e.dataTransfer.getData(DRAG_MIME);
            if (!raw) return;
            try {
              const { id, imageUrl } = JSON.parse(raw) as { id: string; imageUrl: string };
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              // Convert the drop point from scaled screen px into canvas px.
              const x = (e.clientX - rect.left) / scale;
              const y = (e.clientY - rect.top) / scale;
              void canvasRef.current?.addImage(imageUrl, id, x, y);
            } catch {
              /* ignore malformed drops */
            }
          }}
        >
          <div
            className="relative rounded-xl border border-border"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              // Light neutral canvas backdrop as specified in the design system.
              background: "var(--canvas-bg)",
              outline: dragOver ? "2px solid var(--accent-gold)" : "none",
            }}
          >
            <OutfitCanvas ref={canvasRef} onStatusChange={handleStatus} />
            <ZoneOverlay visible={zonesVisible && !hasObjects} />
          </div>
        </div>
      </div>
    </div>
  );
}
