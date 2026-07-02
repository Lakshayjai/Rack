"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Layers } from "lucide-react";
import type { Outfit } from "shared-types";

/** Gallery tile for a saved outfit: preview image + name + meta, opens detail on click. */
export function OutfitCard({ outfit, onOpen }: { outfit: Outfit; onOpen: (o: Outfit) => void }) {
  return (
    <button
      onClick={() => onOpen(outfit)}
      className="group overflow-hidden rounded-2xl border border-border bg-bg-secondary text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-accent-gold/50"
    >
      <div className="relative aspect-[4/5] bg-bg-tertiary">
        {outfit.exportedImageUrl ? (
          <Image
            src={outfit.exportedImageUrl}
            alt={outfit.name}
            fill
            sizes="(max-width: 640px) 45vw, 240px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
            <Layers size={28} strokeWidth={1.25} />
            <span className="text-xs">No preview yet</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-text-primary">{outfit.name}</p>
        <p className="mt-1 text-xs text-text-muted">
          {outfit.itemIds.length} piece{outfit.itemIds.length === 1 ? "" : "s"} ·{" "}
          {format(new Date(outfit.createdAt), "MMM d")}
          {outfit.wornDates.length > 0 && ` · worn ${outfit.wornDates.length}×`}
        </p>
      </div>
    </button>
  );
}
