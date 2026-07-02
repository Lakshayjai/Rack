"use client";

import type { Outfit } from "shared-types";
import { OutfitCard } from "./OutfitCard";
import { Skeleton } from "@/components/ui/Skeleton";

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** Responsive grid of outfit cards with a skeleton loading state. */
export function OutfitGrid({
  outfits,
  loading,
  onOpen,
}: {
  outfits: Outfit[];
  loading: boolean;
  onOpen: (o: Outfit) => void;
}) {
  if (loading && outfits.length === 0) {
    return (
      <div className={GRID}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    );
  }
  return (
    <div className={GRID}>
      {outfits.map((o) => (
        <OutfitCard key={o.id} outfit={o} onOpen={onOpen} />
      ))}
    </div>
  );
}
