"use client";

import type { ClothingItem } from "shared-types";
import { ClothingCard } from "./ClothingCard";
import { Skeleton } from "@/components/ui/Skeleton";

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** Responsive grid of clothing cards, with a skeleton loading state. */
export function WardrobeGrid({
  items,
  loading,
  onEdit,
  onDelete,
}: {
  items: ClothingItem[];
  loading: boolean;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
}) {
  if (loading && items.length === 0) {
    return (
      <div className={GRID}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  return (
    <div className={GRID}>
      {items.map((item) => (
        <ClothingCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
