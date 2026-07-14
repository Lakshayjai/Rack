"use client";

import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
import { STYLES, OCCASIONS, CATEGORIES, type Gender } from "shared-types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import {
  CATEGORY_LABELS,
  ETHNIC_GROUP_LABEL,
  ethnicWearFor,
  subtypesFor,
} from "@/lib/wardrobe-constants";
import {
  CHECKER,
  ChipRow,
  ColorSwatchRow,
  Field,
  toggleValue,
} from "@/components/wardrobe/form-fields";
import { cn } from "@/lib/utils";
import { CandidateThumb } from "./CandidateThumb";
import type { CandidateState, ItemDetailsForm } from "./types";

/**
 * Step 3 of the upload wizard: shared colors/style/occasion metadata for every
 * cutout being saved. Category/type are asked here only for the legacy single
 * upload or when exactly one cutout is selected — multi-cutout categories were
 * already chosen per-candidate in the review step.
 */
export function DetailsStep({
  form,
  patch,
  gender,
  legacyMode,
  previewUrl,
  selected,
  single,
  uploading,
  canSave,
  onBack,
  onCancel,
  onSave,
}: {
  form: ItemDetailsForm;
  patch: (changes: Partial<ItemDetailsForm>) => void;
  gender: Gender | null | undefined;
  /** True when extraction failed and the classic single-photo upload is used. */
  legacyMode: boolean;
  previewUrl: string | null;
  selected: CandidateState[];
  /** The one selected candidate, when exactly one is selected. */
  single: CandidateState | null;
  uploading: boolean;
  canSave: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const asksCategory = legacyMode || Boolean(single);
  const { category, subtype, ethnicMode } = form;

  return (
    <div className="flex flex-col gap-5">
      {/* Compact preview strip of what will be saved. */}
      <div className="flex flex-wrap gap-2">
        {legacyMode && previewUrl ? (
          <div className="relative h-20 w-20 border border-border bg-white">
            <Image src={previewUrl} alt="Preview" fill unoptimized className="object-contain p-1" />
          </div>
        ) : (
          selected.map((c) => (
            <div key={c.key} className="flex h-20 w-20 items-center justify-center border border-border" style={CHECKER}>
              <CandidateThumb imageData={c.imageData} bbox={c.bbox} />
            </div>
          ))
        )}
      </div>

      {/* Category is chosen per-cutout in review; ask here only for single/legacy. */}
      {asksCategory && (
        <Field label="Category" required>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const active = !ethnicMode && category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => patch({ ethnicMode: false, category: cat, subtype: null })}
                  className={cn(
                    "border px-1 py-2 text-[10px] uppercase tracking-[0.1em] transition-all duration-200",
                    active
                      ? "border-text-primary bg-text-primary text-bg-primary"
                      : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => patch({ ethnicMode: true, category: null, subtype: null })}
              className={cn(
                "border px-1 py-2 text-[10px] uppercase tracking-[0.1em] transition-all duration-200",
                ethnicMode
                  ? "border-accent-gold bg-accent-gold text-white"
                  : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
              )}
            >
              {ETHNIC_GROUP_LABEL}
            </button>
          </div>
        </Field>
      )}

      {/* Ethnic garments carry their structural slot; picking one sets both. */}
      {asksCategory && ethnicMode && (
        <Field label="Garment" required>
          <ChipRow
            options={ethnicWearFor(gender).map((e) => e.name)}
            selected={subtype ? [subtype] : []}
            onToggle={(name) => {
              const entry = ethnicWearFor(gender).find((e) => e.name === name);
              if (!entry) return;
              if (subtype === name) {
                patch({ subtype: null, category: null });
                return;
              }
              patch({
                subtype: name,
                category: entry.category,
                // Ethnic pieces are tagged with the "ethnic" style automatically.
                styles: form.styles.includes("ethnic") ? form.styles : [...form.styles, "ethnic"],
              });
            }}
          />
          {subtype && category && (
            <p className="font-serif text-sm italic text-text-muted">
              {subtype} → worn as {CATEGORY_LABELS[category]}
            </p>
          )}
        </Field>
      )}

      {asksCategory && !ethnicMode && category && subtypesFor(gender, category).length > 0 && (
        <Field label="Type">
          <ChipRow
            options={subtypesFor(gender, category)}
            selected={subtype ? [subtype] : []}
            onToggle={(t) => patch({ subtype: subtype === t ? null : t })}
          />
        </Field>
      )}

      <Field label="Colors">
        <ColorSwatchRow
          selected={form.colors}
          onToggle={(name) => patch({ colors: toggleValue(form.colors, name) })}
        />
      </Field>

      <Field label="Style">
        <ChipRow
          options={[...STYLES]}
          selected={form.styles}
          onToggle={(v) => patch({ styles: toggleValue(form.styles, v) })}
        />
      </Field>

      <Field label="Occasion">
        <ChipRow
          options={[...OCCASIONS]}
          selected={form.occasions}
          onToggle={(v) => patch({ occasions: toggleValue(form.occasions, v) })}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Brand (optional)"
          value={form.brand}
          onChange={(e) => patch({ brand: e.target.value })}
          placeholder="e.g. Uniqlo"
        />
      </div>
      <Textarea
        label="Notes (optional)"
        value={form.notes}
        rows={2}
        onChange={(e) => patch({ notes: e.target.value })}
        placeholder="Anything worth remembering…"
      />

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!canSave || uploading} loading={uploading}>
            {uploading
              ? "Saving…"
              : legacyMode || selected.length <= 1
                ? "Add item"
                : `Add ${selected.length} items`}
          </Button>
        </div>
      </div>
      {uploading && (
        <p className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 size={12} className="animate-spin" />
          Uploading cutout{selected.length > 1 ? "s" : ""} — this can take a few seconds.
        </p>
      )}
    </div>
  );
}
