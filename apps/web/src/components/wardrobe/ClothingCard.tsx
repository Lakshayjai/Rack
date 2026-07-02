"use client";

import Image from "next/image";
import { Edit2, Trash2 } from "lucide-react";
import type { ClothingItem } from "shared-types";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { IconButton } from "@/components/ui/Button";
import { thumb } from "@/lib/utils";

/** A single wardrobe item tile with a hover action overlay. */
export function ClothingCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ClothingItem;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-bg-secondary">
      <Image
        src={thumb(item.imageUrl)}
        alt={item.brand ?? item.category}
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        className="object-contain p-2"
      />

      <CategoryBadge category={item.category} className="absolute right-2 top-2" />

      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <IconButton label="Edit" onClick={() => onEdit(item)}>
          <Edit2 size={18} />
        </IconButton>
        <IconButton label="Delete" onClick={() => onDelete(item)}>
          <Trash2 size={18} />
        </IconButton>
      </div>
    </div>
  );
}
