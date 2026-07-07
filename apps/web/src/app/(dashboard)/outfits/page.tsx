"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Grid2x2, CalendarDays, Layers, Plus, RefreshCw } from "lucide-react";
import type { Outfit, OutfitSort } from "shared-types";
import { OUTFIT_SORTS } from "shared-types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { OutfitGrid } from "@/components/outfits/OutfitGrid";
import { OutfitCalendar } from "@/components/outfits/OutfitCalendar";
import { OutfitDetailModal } from "@/components/outfits/OutfitDetailModal";
import { useOutfits } from "@/hooks/useOutfits";
import { useWardrobe } from "@/hooks/useWardrobe";
import { renderOutfitPreview } from "@/lib/outfit-preview";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<OutfitSort, string> = {
  newest: "Newest",
  "most-worn": "Most worn",
  "name-asc": "Name A–Z",
};

type View = "grid" | "calendar";

export default function OutfitsPage() {
  const toast = useToast();
  const { list, markWorn, exportPng, loading } = useOutfits();
  const { items, fetchItems } = useWardrobe();

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [sort, setSort] = useState<OutfitSort>("newest");
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    list(sort)
      .then(setOutfits)
      .catch(() => toast.error("Could not load outfits"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Wardrobe items are needed to render "pieces" thumbnails in the detail modal.
  useEffect(() => {
    void fetchItems().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyUpdate = (updated: Outfit) => {
    setOutfits((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelected((cur) => (cur && cur.id === updated.id ? updated : cur));
  };

  const handleMarkWorn = async (outfitId: string, dateISO: string) => {
    try {
      const updated = await markWorn(outfitId, dateISO);
      applyUpdate(updated);
      toast.success("Marked as worn");
    } catch {
      toast.error("Could not mark worn");
    }
  };

  const isEmpty = !loading && outfits.length === 0;
  const missingPreviews = outfits.filter((o) => !o.exportedImageUrl);

  /** One-off backfill: re-export every preview-less outfit from its saved canvas state. */
  const handleBackfill = async () => {
    setBackfilling(true);
    let done = 0;
    try {
      for (const outfit of missingPreviews) {
        try {
          const png = await renderOutfitPreview(outfit.canvasState);
          applyUpdate(await exportPng(outfit.id, png));
          done += 1;
        } catch {
          // Keep going — one unrenderable outfit shouldn't block the rest.
        }
      }
      if (done === missingPreviews.length) {
        toast.success(`Generated ${done} preview${done === 1 ? "" : "s"}`);
      } else {
        toast.error(`Generated ${done} of ${missingPreviews.length} previews — some failed`);
      }
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="The Lookbook"
        subtitle="Your composed looks, kept and worn."
        eyebrow="Outfits"
        action={
          <div className="flex items-center gap-2">
            <Link href="/outfits/new">
              <Button size="sm">
                <Plus size={15} /> Make outfit
              </Button>
            </Link>
            {view === "grid" && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as OutfitSort)}
                className="border border-border bg-bg-secondary px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-text-secondary focus:border-accent-gold focus:outline-none"
              >
                {OUTFIT_SORTS.map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
            <div className="flex overflow-hidden border border-border">
              <ViewBtn active={view === "grid"} onClick={() => setView("grid")} label="Grid">
                <Grid2x2 size={18} />
              </ViewBtn>
              <ViewBtn active={view === "calendar"} onClick={() => setView("calendar")} label="Calendar">
                <CalendarDays size={18} />
              </ViewBtn>
            </div>
          </div>
        }
      />

      {missingPreviews.length > 0 && view === "grid" && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-accent-gold/40 bg-bg-secondary px-4 py-3 shadow-plume">
          <p className="font-serif text-sm italic text-text-secondary">
            {missingPreviews.length} look{missingPreviews.length === 1 ? " is" : "s are"} missing a
            preview — generate them from their saved canvases.
          </p>
          <Button size="sm" variant="secondary" onClick={handleBackfill} loading={backfilling}>
            <RefreshCw size={14} /> Generate previews
          </Button>
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          icon={Layers}
          title="No outfits yet"
          description="Pick pieces from your wardrobe and let the flat-lay compose itself."
          action={
            <Link href="/outfits/new">
              <Button>
                <Plus size={16} /> Make your first outfit
              </Button>
            </Link>
          }
        />
      ) : view === "grid" ? (
        <OutfitGrid outfits={outfits} loading={loading} onOpen={setSelected} />
      ) : (
        <OutfitCalendar outfits={outfits} onMarkWorn={handleMarkWorn} />
      )}

      <OutfitDetailModal
        outfit={selected}
        items={items}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={applyUpdate}
        onDeleted={(id) => {
          setOutfits((prev) => prev.filter((o) => o.id !== id));
          setSelected(null);
        }}
        onDuplicated={(copy) => {
          setOutfits((prev) => [copy, ...prev]);
          setSelected(copy);
        }}
      />
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-10 w-10 items-center justify-center transition-colors",
        active ? "bg-text-primary text-bg-primary" : "text-text-secondary hover:bg-bg-tertiary",
      )}
    >
      {children}
    </button>
  );
}
