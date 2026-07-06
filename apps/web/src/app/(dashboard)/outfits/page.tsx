"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Grid2x2, CalendarDays, Layers, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<OutfitSort, string> = {
  newest: "Newest",
  "most-worn": "Most worn",
  "name-asc": "Name A–Z",
};

type View = "grid" | "calendar";

export default function OutfitsPage() {
  const toast = useToast();
  const { list, markWorn, loading } = useOutfits();
  const { items, fetchItems } = useWardrobe();

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [sort, setSort] = useState<OutfitSort>("newest");
  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<Outfit | null>(null);

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

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="The Lookbook"
        subtitle="Your composed looks, kept and worn."
        eyebrow="Outfits"
        action={
          <div className="flex items-center gap-2">
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

      {isEmpty ? (
        <EmptyState
          icon={Layers}
          title="No outfits yet"
          description="Head to the designer and compose your first look."
          action={
            <Link href="/designer">
              <Button>
                <Plus size={16} /> Design your first outfit
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
