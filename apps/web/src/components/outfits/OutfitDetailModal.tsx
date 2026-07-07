"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil, Download, Trash2, CalendarPlus, Layers, Copy, RefreshCw } from "lucide-react";
import type { ClothingItem, Outfit } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useToast } from "@/components/ui/Toast";
import { useOutfits } from "@/hooks/useOutfits";
import { ApiError } from "@/lib/api";
import { renderOutfitPreview } from "@/lib/outfit-preview";
import { thumb } from "@/lib/utils";

/** Full detail view for an outfit: preview, pieces, worn history, and actions. */
export function OutfitDetailModal({
  outfit,
  items,
  onOpenChange,
  onChanged,
  onDeleted,
  onDuplicated,
}: {
  outfit: Outfit | null;
  items: ClothingItem[];
  onOpenChange: (open: boolean) => void;
  onChanged: (o: Outfit) => void;
  onDeleted: (id: string) => void;
  /** Called with the freshly created copy. */
  onDuplicated: (o: Outfit) => void;
}) {
  const toast = useToast();
  const { markWorn, remove, duplicate, exportPng } = useOutfits();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  if (!outfit) return null;

  const previewUrl =
    outfit.exportedImageUrl && outfit.exportedImageUrl !== brokenUrl
      ? outfit.exportedImageUrl
      : null;

  /** Re-export the preview from the saved canvas state (offscreen render → upload). */
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const png = await renderOutfitPreview(outfit.canvasState);
      const updated = await exportPng(outfit.id, png);
      onChanged(updated);
      toast.success("Preview regenerated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not regenerate the preview");
    } finally {
      setRegenerating(false);
    }
  };

  const usedItems = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ClothingItem => Boolean(i));

  const handleWornToday = async () => {
    setBusy(true);
    try {
      const updated = await markWorn(outfit.id);
      onChanged(updated);
      toast.success("Marked as worn today");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not mark worn");
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const copy = await duplicate(outfit.id);
      onDuplicated(copy);
      toast.success("Outfit duplicated — opening the copy");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not duplicate");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await remove(outfit.id);
      onDeleted(outfit.id);
      toast.success("Outfit deleted");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal open={outfit !== null} onOpenChange={onOpenChange} title={outfit.name} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_1fr]">
          {/* Preview */}
          <div className="relative aspect-[4/5] overflow-hidden border border-border bg-white">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={outfit.name}
                fill
                sizes="320px"
                className="object-contain"
                onError={() => setBrokenUrl(previewUrl)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
                <Layers size={28} strokeWidth={1.25} />
                <span className="text-xs">No preview yet</span>
                <Button size="sm" variant="secondary" onClick={handleRegenerate} loading={regenerating}>
                  <RefreshCw size={14} /> Generate preview
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {outfit.description && (
              <p className="font-serif text-lg italic text-text-secondary">{outfit.description}</p>
            )}

            {outfit.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {outfit.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                Pieces ({usedItems.length})
              </p>
              {usedItems.length === 0 ? (
                <p className="text-xs text-text-muted">No matching items (they may have been deleted).</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {usedItems.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="relative h-14 w-14 overflow-hidden border border-border bg-white">
                        <Image src={thumb(item.imageUrl)} alt={item.category} fill sizes="56px" className="object-contain p-1" />
                      </div>
                      <CategoryBadge category={item.category} className="absolute -bottom-1 -right-1 scale-75" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                Worn {outfit.wornDates.length}×
              </p>
              {outfit.wornDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {outfit.wornDates
                    .slice()
                    .sort((a, b) => b.localeCompare(a))
                    .slice(0, 8)
                    .map((d) => (
                      <span key={d} className="bg-bg-tertiary px-2.5 py-0.5 font-serif text-sm italic text-text-secondary">
                        {format(new Date(d), "MMM d, yyyy")}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={handleWornToday} loading={busy}>
            <CalendarPlus size={16} /> Worn today
          </Button>
          {outfit.exportedImageUrl && (
            <a href={outfit.exportedImageUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">
                <Download size={16} /> Download
              </Button>
            </a>
          )}
          <Button variant="ghost" onClick={handleRegenerate} loading={regenerating}>
            <RefreshCw size={16} /> Regenerate preview
          </Button>
          <Button variant="ghost" onClick={handleDuplicate} disabled={busy}>
            <Copy size={16} /> Duplicate
          </Button>
          <Link href={`/designer?id=${outfit.id}`}>
            <Button variant="ghost">
              <Pencil size={16} /> Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete outfit?"
        message="This permanently deletes the outfit and its exported preview."
        onConfirm={handleDelete}
        loading={busy}
      />
    </>
  );
}
