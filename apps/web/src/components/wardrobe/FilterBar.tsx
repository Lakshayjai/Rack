"use client";

import { Search, X } from "lucide-react";
import { STYLES, type Category } from "shared-types";
import { CATEGORY_LABELS, PRESET_COLORS, categoriesFor } from "@/lib/wardrobe-constants";
import { useAuth } from "@/hooks/useAuth";
import type { WardrobeFilters } from "@/hooks/useWardrobe";
import { cn } from "@/lib/utils";

const SELECT =
  "border border-border bg-bg-secondary px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] " +
  "text-text-secondary focus:border-accent-gold focus:outline-none";

/** Category / style / color / search filters for the wardrobe grid. */
export function FilterBar({
  filters,
  onChange,
}: {
  filters: WardrobeFilters;
  onChange: (next: WardrobeFilters) => void;
}) {
  const { user } = useAuth();
  const categories = categoriesFor(user?.gender);
  const set = (patch: Partial<WardrobeFilters>) => onChange({ ...filters, ...patch });
  const hasFilters =
    filters.category || filters.style || filters.color || filters.search;

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex max-w-md items-center gap-2 border-b border-border py-2 focus-within:border-accent-gold">
        <Search size={15} strokeWidth={1.5} className="text-text-muted" />
        <input
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value || undefined })}
          placeholder="Search by brand, note or color…"
          className="w-full bg-transparent text-sm font-light text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill active={!filters.category} onClick={() => set({ category: undefined })}>
          All
        </Pill>
        {categories.map((c) => (
          <Pill
            key={c}
            active={filters.category === c}
            onClick={() => set({ category: filters.category === c ? undefined : (c as Category) })}
          >
            {CATEGORY_LABELS[c]}
          </Pill>
        ))}

        <span className="mx-2 h-4 w-px bg-border" />

        <select
          value={filters.style ?? ""}
          onChange={(e) => set({ style: e.target.value || undefined })}
          className={SELECT}
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
          className={SELECT}
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
            className="ml-auto flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors hover:text-text-primary"
          >
            <X size={13} /> Clear
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
        "border px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-all duration-200",
        active
          ? "border-text-primary bg-text-primary text-bg-primary"
          : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
      )}
    >
      {children}
    </button>
  );
}
