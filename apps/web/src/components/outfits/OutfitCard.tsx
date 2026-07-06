"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Layers } from "lucide-react";
import type { Outfit } from "shared-types";

/** Lookbook plate for a saved outfit: white ground, hairline frame, serif caption. */
export function OutfitCard({ outfit, onOpen }: { outfit: Outfit; onOpen: (o: Outfit) => void }) {
  return (
    <button
      onClick={() => onOpen(outfit)}
      className="group overflow-hidden border border-border bg-bg-secondary text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-plume-lg"
    >
      <div className="relative aspect-[4/5] bg-white">
        {outfit.exportedImageUrl ? (
          <Image
            src={outfit.exportedImageUrl}
            alt={outfit.name}
            fill
            sizes="(max-width: 640px) 45vw, 240px"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
            <Layers size={26} strokeWidth={1} />
            <span className="font-serif text-sm italic">No preview yet</span>
          </div>
        )}
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="truncate font-display text-sm tracking-wide text-text-primary">
          {outfit.name}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-muted">
          {outfit.itemIds.length} piece{outfit.itemIds.length === 1 ? "" : "s"} ·{" "}
          {format(new Date(outfit.createdAt), "MMM d")}
          {outfit.wornDates.length > 0 && ` · worn ${outfit.wornDates.length}×`}
        </p>
      </div>
    </button>
  );
}
