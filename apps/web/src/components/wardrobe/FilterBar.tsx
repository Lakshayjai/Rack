"use client";

import { Search, X } from "lucide-react";
import { CATEGORIES, STYLES, type Category } from "shared-types";
import { PRESET_COLORS } from "@/lib/wardrobe-constants";
import type { WardrobeFilters } from "@/hooks/useWardrobe";
import { cn } from "@/lib/utils";

/** Category / style / color / search filters for the wardrobe grid. */
export function FilterBar({
  filters,
  onChange,
}: {
  filters: WardrobeFilters;
  onChange: (next: WardrobeFilters) => void;
}) {
  const set = (patch: Partial<WardrobeFilters>) => onChange({ ...filters, ...patch });
  const hasFilters =
    filters.category || filters.style || filters.color || filters.search;

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2">
        <Search size={16} className="text-text-muted" />
        <input
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value || undefined })}
          placeholder="Search by brand, note or color…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill active={!filters.category} onClick={() => set({ category: undefined })}>
          All
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill
            key={c}
            active={filters.category === c}
            onClick={() => set({ category: filters.category === c ? undefined : (c as Category) })}
          >
            {c.toLowerCase()}
          </Pill>
        ))}

        <span className="mx-1 h-5 w-px bg-border" />

        <select
          value={filters.style ?? ""}
          onChange={(e) => set({ style: e.target.value || undefined })}
          className="rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs capitalize text-text-secondary focus:border-accent-gold focus:outline-none"
        >
          <option value="">any style</option>
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.color ?? ""}
          onChange={(e) => set({ color: e.target.value || undefined })}
          className="rounded-full border border-border bg-bg-secondary px-3 py-1 text-xs capitalize text-text-secondary focus:border-accent-gold focus:outline-none"
        >
          <option value="">any color</option>
          {PRESET_COLORS.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => onChange({})}
            className="ml-auto flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
        active
          ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
          : "border-border text-text-secondary hover:border-accent-gold/50",
      )}
    >
      {children}
    </button>
  );
}
