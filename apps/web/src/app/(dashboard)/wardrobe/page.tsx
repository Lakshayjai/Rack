"use client";

import { useEffect, useMemo, useState } from "react";
import { Shirt, Plus, SearchX } from "lucide-react";
import type { ClothingItem } from "shared-types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { FilterBar } from "@/components/wardrobe/FilterBar";
import { UploadModal } from "@/components/wardrobe/UploadModal";
import { EditItemModal } from "@/components/wardrobe/EditItemModal";
import { useWardrobe, type WardrobeFilters } from "@/hooks/useWardrobe";
import { ApiError } from "@/lib/api";

export default function WardrobePage() {
  const toast = useToast();
  const { items, fetching, fetchItems, deleteItem } = useWardrobe();
  const [filters, setFilters] = useState<WardrobeFilters>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<ClothingItem | null>(null);
  const [deleting, setDeleting] = useState<ClothingItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Re-fetch whenever filters change (debounced lightly for the search box).
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchItems(filters).catch(() => toast.error("Could not load wardrobe"));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const hasActiveFilters = useMemo(
    () => Boolean(filters.category || filters.style || filters.color || filters.search),
    [filters],
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteItem(deleting.id);
      toast.success("Item deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isEmpty = !fetching && items.length === 0;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Wardrobe"
        subtitle="Your clothing, organized."
        action={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={16} /> Add piece
          </Button>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} />

      {isEmpty ? (
        hasActiveFilters ? (
          <EmptyState
            icon={SearchX}
            title="No items match your filters"
            description="Try adjusting or clearing your filters."
            action={
              <Button variant="secondary" onClick={() => setFilters({})}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Shirt}
            title="Your wardrobe is empty"
            description="Upload your first piece — the background is removed automatically."
            action={
              <Button onClick={() => setUploadOpen(true)}>
                <Plus size={16} /> Upload your first piece
              </Button>
            }
          />
        )
      ) : (
        <WardrobeGrid
          items={items}
          loading={fetching}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <EditItemModal item={editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete item?"
        message="This removes the item and its photo permanently. This cannot be undone."
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
