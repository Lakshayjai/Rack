"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Shirt } from "lucide-react";
import { type Category, type ClothingItem } from "shared-types";
import { thumb } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { categoriesFor } from "@/lib/wardrobe-constants";

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
  const { user } = useAuth();
  const categories = categoriesFor(user?.gender);
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
            i.subtype?.toLowerCase().includes(t) ||
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
      <div className="flex items-center gap-2 border-b border-border py-2 focus-within:border-accent-gold">
        <Search size={14} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["ALL", ...categories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] transition-all duration-200",
              category === c
                ? "border-text-primary bg-text-primary text-bg-primary"
                : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
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
              className="relative aspect-square cursor-grab overflow-hidden border border-border bg-white transition-colors hover:border-accent-gold active:cursor-grabbing"
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
