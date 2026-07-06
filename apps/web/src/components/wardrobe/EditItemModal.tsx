"use client";

import { useEffect, useState } from "react";
import { STYLES, OCCASIONS, type Category, type ClothingItem } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_ICONS, PRESET_COLORS, categoriesFor, subtypesFor } from "@/lib/wardrobe-constants";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Edit an existing item's metadata (image is not re-uploaded here). */
export function EditItemModal({
  item,
  onOpenChange,
}: {
  item: ClothingItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const { editItem } = useWardrobe();
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
  }, [item]);

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
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">Category</span>
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
                  {cat.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {subtypesFor(user?.gender, category).length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">Type</span>
            <div className="flex flex-wrap gap-2">
              {subtypesFor(user?.gender, category).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSubtype((cur) => (cur === t ? null : t))}
                  className={cn(
                    "border px-3.5 py-1 text-[11px] uppercase tracking-[0.14em] transition-all duration-200",
                    subtype === t
                      ? "border-text-primary bg-text-primary text-bg-primary"
                      : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">Colors</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(({ name, hex }) => (
              <button
                key={name}
                type="button"
                onClick={() => setColors((c) => toggle(c, name))}
                title={name}
                aria-label={name}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                  colors.includes(name) ? "border-accent-gold" : "border-border",
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>

        <ChipField label="Style" options={[...STYLES]} selected={styles} onToggle={(v) => setStyles((s) => toggle(s, v))} />
        <ChipField label="Occasion" options={[...OCCASIONS]} selected={occasions} onToggle={(v) => setOccasions((o) => toggle(o, v))} />

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

function ChipField({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "border px-3.5 py-1 text-[11px] uppercase tracking-[0.14em] transition-all duration-200",
              selected.includes(opt)
                ? "border-text-primary bg-text-primary text-bg-primary"
                : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
