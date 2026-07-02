"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Shirt } from "lucide-react";
import { CATEGORIES, type Category, type ClothingItem } from "shared-types";
import { thumb } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const DRAG_MIME = "application/x-wardrobe-item";

/**
 * Left panel of draggable wardrobe thumbnails. Dragging sets the item id + image URL
 * on the dataTransfer; the canvas reads it on drop. Double-click also adds the item.
 */
export function CanvasSidebar({
  items,
  onAdd,
}: {
  items: ClothingItem[];
  onAdd: (item: ClothingItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "ALL">("ALL");

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (category !== "ALL" && i.category !== category) return false;
        if (search) {
          const t = search.toLowerCase();
          return (
            i.brand?.toLowerCase().includes(t) ||
            i.colors.some((c) => c.includes(t)) ||
            i.category.toLowerCase().includes(t)
          );
        }
        return true;
      }),
    [items, category, search],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-2.5 py-2">
        <Search size={14} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["ALL", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors",
              category === c
                ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                : "border-border text-text-secondary hover:border-accent-gold/50",
            )}
          >
            {c === "ALL" ? "all" : c.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center gap-2 py-10 text-center text-text-muted">
            <Shirt size={24} />
            <span className="text-xs">No items. Add pieces in your wardrobe first.</span>
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  DRAG_MIME,
                  JSON.stringify({ id: item.id, imageUrl: item.imageUrl }),
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAdd(item)}
              title="Tap to add, or drag onto the canvas"
              className="relative aspect-square cursor-grab overflow-hidden rounded-lg border border-border bg-bg-secondary active:cursor-grabbing"
            >
              <Image
                src={thumb(item.imageUrl)}
                alt={item.brand ?? item.category}
                fill
                sizes="120px"
                className="object-contain p-1"
                draggable={false}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
