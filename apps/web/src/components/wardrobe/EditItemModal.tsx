"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Link2 } from "lucide-react";
import { STYLES, OCCASIONS, type Category, type ClothingItem } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_ICONS, CATEGORY_LABELS, categoriesFor, subtypesFor } from "@/lib/wardrobe-constants";
import { ChipRow, ColorSwatchRow, Field, toggleValue } from "@/components/wardrobe/form-fields";
import { ApiError } from "@/lib/api";
import { thumb, cn } from "@/lib/utils";

/** Edit an existing item's metadata (image is not re-uploaded here). */
export function EditItemModal({
  item,
  onOpenChange,
}: {
  item: ClothingItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const { items, editItem } = useWardrobe();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const categories = categoriesFor(user?.gender);

  const [category, setCategory] = useState<Category>("TOP");
  const [subtype, setSubtype] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [pairedIds, setPairedIds] = useState<string[]>([]);

  // Hydrate the form whenever a new item is opened.
  useEffect(() => {
    if (!item) return;
    setCategory(item.category);
    setSubtype(item.subtype);
    setColors(item.colors);
    setStyles(item.styles);
    setOccasions(item.occasions);
    setBrand(item.brand ?? "");
    setNotes(item.notes ?? "");
    setPairedIds(item.pairedItemIds ?? []);
  }, [item]);

  const pairCandidates = items.filter((i) => i.id !== item?.id);

  const save = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await editItem(item.id, {
        category,
        subtype: subtype ?? undefined,
        colors,
        styles,
        occasions,
        brand,
        notes,
        pairedItemIds: pairedIds,
      });
      toast.success("Item updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={item !== null} onOpenChange={onOpenChange} title="Edit item">
      <div className="flex flex-col gap-5">
        <Field label="Category">
          <div className={cn("grid gap-2", categories.length > 5 ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-5")}>
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setSubtype(null); // types depend on the category
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 border py-3 text-[10px] uppercase tracking-[0.12em] transition-all duration-200",
                    category === cat
                      ? "border-text-primary bg-text-primary text-bg-primary"
                      : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
                  )}
                >
                  <Icon size={18} />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </Field>

        {subtypesFor(user?.gender, category).length > 0 && (
          <Field label="Type">
            <ChipRow
              options={subtypesFor(user?.gender, category)}
              selected={subtype ? [subtype] : []}
              onToggle={(t) => setSubtype((cur) => (cur === t ? null : t))}
            />
          </Field>
        )}

        <Field label="Colors">
          <ColorSwatchRow selected={colors} onToggle={(name) => setColors((c) => toggleValue(c, name))} />
        </Field>

        <Field label="Style">
          <ChipRow options={[...STYLES]} selected={styles} onToggle={(v) => setStyles((s) => toggleValue(s, v))} />
        </Field>
        <Field label="Occasion">
          <ChipRow options={[...OCCASIONS]} selected={occasions} onToggle={(v) => setOccasions((o) => toggleValue(o, v))} />
        </Field>

        {pairCandidates.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-text-secondary">
              <Link2 size={13} /> Pairs with
              <span className="normal-case tracking-normal font-serif italic text-text-muted">
                — link set pieces (lehenga + choli + dupatta)
              </span>
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pairCandidates.map((i) => {
                const active = pairedIds.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    title={i.subtype ?? i.category}
                    onClick={() => setPairedIds((cur) => toggleValue(cur, i.id))}
                    className={cn(
                      "relative h-16 w-16 shrink-0 border bg-white transition-all duration-200",
                      active ? "border-accent-gold shadow-plume" : "border-border opacity-80 hover:opacity-100",
                    )}
                  >
                    <Image src={thumb(i.imageUrl)} alt={i.subtype ?? i.category} fill sizes="64px" className="object-contain p-1" />
                    {active && (
                      <span className="absolute left-0.5 top-0.5 flex h-4 w-4 items-center justify-center bg-accent-gold text-white">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Input label="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <Textarea label="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
