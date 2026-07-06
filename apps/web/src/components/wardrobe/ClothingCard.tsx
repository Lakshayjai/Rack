"use client";

import Image from "next/image";
import { Edit2, Trash2 } from "lucide-react";
import type { ClothingItem } from "shared-types";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { IconButton } from "@/components/ui/Button";
import { thumb } from "@/lib/utils";

/** Gallery tile for a piece: white ground, hairline frame, ivory-veil hover actions. */
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
    <div className="group relative aspect-square overflow-hidden border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-plume-lg">
      <Image
        src={thumb(item.imageUrl)}
        alt={item.brand ?? item.category}
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
        className="object-contain p-3"
      />

      <CategoryBadge category={item.category} className="absolute right-0 top-0" />

      {item.brand && (
        <p className="absolute bottom-2 left-3 text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {item.brand}
        </p>
      )}

      {/* Ivory veil with actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-bg-primary/70 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
        <IconButton label="Edit" onClick={() => onEdit(item)}>
          <Edit2 size={16} strokeWidth={1.5} />
        </IconButton>
        <IconButton label="Delete" onClick={() => onDelete(item)}>
          <Trash2 size={16} strokeWidth={1.5} />
        </IconButton>
      </div>
    </div>
  );
}
