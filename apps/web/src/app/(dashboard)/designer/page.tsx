"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
  Save,
  Loader2,
  MousePointerClick,
  Repeat,
} from "lucide-react";
import { OUTFIT_TAG_PRESETS, type ClothingItem } from "shared-types";
import { CanvasStage } from "@/components/canvas/CanvasStage";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ArrangeItem, CanvasController, CanvasStatus } from "@/types/canvas";

const toArrangeItem = (item: ClothingItem): ArrangeItem => ({
  id: item.id,
  url: item.imageUrl,
  category: item.category,
  subtype: item.subtype,
});

function DesignerInner() {
  const toast = useToast();
  const params = useSearchParams();
  const editId = params.get("id");
  // Set by the "Make Outfit" builder: item ids to auto-arrange plus prefilled meta.
  const itemsParam = params.get("items");
  const nameParam = params.get("name");
  const tagsParam = params.get("tags");

  const { items, fetchItems } = useWardrobe();
  const { get, create, update, exportPng } = useOutfits();

  const canvasRef = useRef<CanvasController | null>(null);
  const [status, setStatus] = useState<CanvasStatus>({
    canUndo: false,
    canRedo: false,
    hasSelection: false,
    hasObjects: false,
  });
  const [zonesVisible, setZonesVisible] = useState(true);

  const [outfitId, setOutfitId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** When armed, the next sidebar click swaps the selected piece instead of adding. */
  const [swapArmed, setSwapArmed] = useState(false);
  const arrangedRef = useRef(false);

  // Load wardrobe items for the sidebar.
  useEffect(() => {
    void fetchItems().catch(() => toast.error("Could not load your items"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If editing, load the outfit onto the canvas once the controller is ready.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    void (async () => {
      try {
        const outfit = await get(editId);
        if (cancelled) return;
        setOutfitId(outfit.id);
        setName(outfit.name);
        setDescription(outfit.description ?? "");
        setTags(outfit.tags ?? []);
        // Give the canvas a tick to mount before loading state.
        setTimeout(() => void canvasRef.current?.loadState(outfit.canvasState), 50);
      } catch {
        toast.error("Could not load that outfit");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Coming from the outfit builder: arrange the chosen pieces once items are loaded.
  useEffect(() => {
    if (!itemsParam || editId || arrangedRef.current || items.length === 0) return;
    const chosen = itemsParam
      .split(",")
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is ClothingItem => Boolean(i));
    if (chosen.length === 0) return;
    arrangedRef.current = true;
    if (nameParam) setName(nameParam);
    if (tagsParam) setTags(tagsParam.split(",").filter(Boolean));
    // Give the canvas a tick to mount before arranging.
    setTimeout(() => void canvasRef.current?.autoLayout(chosen.map(toArrangeItem)), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, itemsParam, editId]);

  const addItem = (item: ClothingItem) => {
    if (swapArmed && status.hasSelection) {
      void canvasRef.current?.replaceSelected(item.imageUrl, item.id);
      setSwapArmed(false);
      return;
    }
    void canvasRef.current?.addImage(item.imageUrl, item.id);
  };

  /** Re-run the flat-lay layout over whatever is currently on the canvas. */
  const handleAutoArrange = () => {
    const controller = canvasRef.current;
    if (!controller) return;
    const chosen = controller
      .usedItemIds()
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is ClothingItem => Boolean(i));
    if (chosen.length === 0) {
      toast.error("Add some pieces to the canvas first");
      return;
    }
    void controller.autoLayout(chosen.map(toArrangeItem));
  };

  /** Create or update the outfit; returns the id. */
  const persist = async (): Promise<string | null> => {
    const controller = canvasRef.current;
    if (!controller) return null;
    if (!name.trim()) {
      toast.error("Give your outfit a name first");
      return null;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      canvasState: controller.toState(),
      itemIds: controller.usedItemIds(),
      tags,
    };
    const saved = outfitId
      ? await update(outfitId, payload)
      : await create(payload);
    setOutfitId(saved.id);
    return saved.id;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const id = await persist();
      if (id) toast.success("Outfit saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const controller = canvasRef.current;
    if (!controller) return;
    setExporting(true);
    try {
      // Export requires a saved outfit — persist first if needed.
      const id = await persist();
      if (!id) return;
      await exportPng(id, controller.toPng());
      toast.success("Exported preview to your gallery");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <p className="eyebrow mb-2">The Atelier</p>
        <h1 className="font-display text-3xl tracking-wide text-text-primary md:text-4xl">
          {outfitId ? "Edit Outfit" : "Composition Room"}
        </h1>
        <div className="rule-gold mt-4" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
        {/* Left — wardrobe items */}
        <aside className="order-2 h-[560px] border border-border bg-bg-secondary p-4 shadow-plume lg:order-1 lg:h-[calc(100vh-13rem)]">
          <CanvasSidebar items={items} onAdd={addItem} />
        </aside>

        {/* Center — toolbar + canvas + save bar */}
        <section className="order-1 flex flex-col gap-3 lg:order-2">
          <CanvasToolbar
            controller={canvasRef.current}
            status={status}
            zonesVisible={zonesVisible}
            onToggleZones={() => setZonesVisible((v) => !v)}
            onAutoArrange={handleAutoArrange}
            onExport={handleExport}
          />

          <CanvasStage
            canvasRef={canvasRef}
            onStatusChange={setStatus}
            zonesVisible={zonesVisible}
          />

          <div className="flex flex-col gap-4 border border-border bg-bg-secondary p-5 shadow-plume">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Outfit name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunday linen"
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="notes about this look"
                />
              </div>
              <Button onClick={handleSave} loading={saving} disabled={!status.hasObjects}>
                <Save size={16} /> Save outfit
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">
                Tags
              </span>
              {OUTFIT_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setTags((cur) =>
                      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
                    )
                  }
                  className={cn(
                    "border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] transition-all duration-200",
                    tags.includes(tag)
                      ? "border-text-primary bg-text-primary text-bg-primary"
                      : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right — properties / layer controls */}
        <aside className="order-3 border border-border bg-bg-secondary p-5 shadow-plume">
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            Layers
          </h2>
          {status.hasSelection ? (
            <div className="flex flex-col gap-2">
              <LayerBtn icon={ArrowUpToLine} label="Bring to front" onClick={() => canvasRef.current?.bringToFront()} />
              <LayerBtn icon={ArrowDownToLine} label="Send to back" onClick={() => canvasRef.current?.sendToBack()} />
              <button
                onClick={() => setSwapArmed((v) => !v)}
                className={cn(
                  "flex items-center gap-2 border px-3 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors duration-200",
                  swapArmed
                    ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                    : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
                )}
              >
                <Repeat size={16} /> {swapArmed ? "Pick a piece…" : "Swap piece"}
              </button>
              {swapArmed && (
                <p className="text-[10px] leading-relaxed text-text-muted">
                  Click an item in the wardrobe panel to swap it in — position and size are kept.
                </p>
              )}
              <LayerBtn
                icon={Trash2}
                label="Remove"
                danger
                onClick={() => canvasRef.current?.removeSelected()}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-text-muted">
              <MousePointerClick size={22} />
              <span className="text-xs">Select an item on the canvas to reorder or remove it.</span>
            </div>
          )}
          {exporting && (
            <p className="mt-4 flex items-center gap-2 text-xs text-text-muted">
              <Loader2 size={12} className="animate-spin" /> Exporting…
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function LayerBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof ArrowUpToLine;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-2 border border-border px-3 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 " +
        (danger
          ? "text-error hover:border-error hover:bg-error hover:text-white"
          : "text-text-secondary hover:border-accent-gold hover:text-accent-gold")
      }
    >
      <Icon size={16} /> {label}
    </button>
  );
}

export default function DesignerPage() {
  return (
    <Suspense fallback={null}>
      <DesignerInner />
    </Suspense>
  );
}
