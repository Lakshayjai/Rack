"use client";

import { OUTFIT_TAG_PRESETS } from "shared-types";
import { cn } from "@/lib/utils";

/** Toggleable chips for the preset outfit tags (seasons + occasions). */
export function TagPresetPicker({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <>
      {OUTFIT_TAG_PRESETS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() =>
            onChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])
          }
          className={cn(
            "border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] transition-all duration-200",
            tags.includes(tag)
              ? "border-text-primary bg-text-primary text-bg-primary"
              : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
          )}
        >
          {tag}
        </button>
      ))}
    </>
  );
}
