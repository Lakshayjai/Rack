"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brush, Eraser, Undo2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CHECKER } from "@/components/wardrobe/form-fields";
import { cn } from "@/lib/utils";

type Tool = "restore" | "erase";

const MAX_UNDO = 12;

/**
 * Manual cutout touch-up: paint with "restore" to bring back garment pixels the
 * model missed (from the original photo) or "erase" to remove leftover skin or
 * background. Works on the full-frame cutout so coordinates line up 1:1 with the
 * original image.
 */
export function MaskEditor({
  open,
  onOpenChange,
  originalUrl,
  cutoutData,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Object URL of the photo the cutout was extracted from. */
  originalUrl: string;
  /** Full-frame transparent PNG data URL to refine. */
  cutoutData: string;
  onApply: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(28);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  // Load the cutout onto the visible canvas and the original photo (scaled to the
  // exact same dimensions) onto an offscreen canvas used as the restore source.
  useEffect(() => {
    if (!open) return;
    setReady(false);
    undoStack.current = [];
    setCanUndo(false);
    let cancelled = false;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    void (async () => {
      try {
        const [cutout, original] = await Promise.all([load(cutoutData), load(originalUrl)]);
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = cutout.naturalWidth;
        canvas.height = cutout.naturalHeight;
        canvas.getContext("2d")?.drawImage(cutout, 0, 0);

        const source = document.createElement("canvas");
        source.width = cutout.naturalWidth;
        source.height = cutout.naturalHeight;
        source.getContext("2d")?.drawImage(original, 0, 0, source.width, source.height);
        originalRef.current = source;
        setReady(true);
      } catch {
        setReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, cutoutData, originalUrl]);

  const canvasPoint = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const stamp = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const radius = (brushSize / 2) * (canvas.width / 560); // brush size ≈ display px
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      if (tool === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill();
      } else if (originalRef.current) {
        ctx.clip();
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(originalRef.current, 0, 0);
      }
      ctx.restore();
    },
    [brushSize, tool],
  );

  const strokeTo = (x: number, y: number) => {
    // Interpolate between pointer events so fast strokes stay continuous.
    const from = lastPoint.current ?? { x, y };
    const dist = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(1, Math.floor(dist / 4));
    for (let i = 1; i <= steps; i++) {
      stamp(from.x + ((x - from.x) * i) / steps, from.y + ((y - from.y) * i) / steps);
    }
    lastPoint.current = { x, y };
  };

  const handleDown = (e: React.PointerEvent) => {
    if (!ready) return;
    const p = canvasPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!p || !ctx || !canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    undoStack.current.push(
      ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
    );
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    setCanUndo(true);
    drawing.current = true;
    lastPoint.current = null;
    strokeTo(p.x, p.y);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const p = canvasPoint(e);
    if (p) strokeTo(p.x, p.y);
  };

  const handleUp = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const handleUndo = () => {
    const ctx = canvasRef.current?.getContext("2d");
    const snapshot = undoStack.current.pop();
    if (ctx && snapshot) ctx.putImageData(snapshot, 0, 0);
    setCanUndo(undoStack.current.length > 0);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onApply(canvas.toDataURL("image/png"));
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Refine cutout"
      description="Paint to restore garment areas the extraction missed; erase leftover skin or background."
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToolButton
            active={tool === "restore"}
            onClick={() => setTool("restore")}
            icon={<Brush size={15} />}
            label="Restore"
          />
          <ToolButton
            active={tool === "erase"}
            onClick={() => setTool("erase")}
            icon={<Eraser size={15} />}
            label="Erase"
          />
          <div className="ml-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Brush</span>
            <input
              type="range"
              min={8}
              max={80}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-28 accent-accent-gold"
            />
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="ml-auto flex items-center gap-1.5 border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-accent-gold hover:text-accent-gold disabled:pointer-events-none disabled:opacity-30"
          >
            <Undo2 size={14} /> Undo
          </button>
        </div>

        <div className="flex max-h-[55vh] items-center justify-center overflow-auto border border-border" style={CHECKER}>
          <canvas
            ref={canvasRef}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerLeave={handleUp}
            className="max-h-[55vh] w-auto max-w-full touch-none cursor-crosshair"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!ready}>
            Apply changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-all duration-200",
        active
          ? "border-text-primary bg-text-primary text-bg-primary"
          : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
      )}
    >
      {icon} {label}
    </button>
  );
}
