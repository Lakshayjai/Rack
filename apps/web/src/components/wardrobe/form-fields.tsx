"use client";

import { cn } from "@/lib/utils";
import { PRESET_COLORS } from "@/lib/wardrobe-constants";

/*
 * Small form building blocks shared by the wardrobe item forms
 * (UploadModal and EditItemModal).
 */

/** Toggle a value in a string[] (used by chip/swatch multi-selects). */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** CSS checkerboard backdrop so transparent cutout areas read as "removed". */
export const CHECKER: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #ece8de 25%, transparent 25%, transparent 75%, #ece8de 75%), " +
    "linear-gradient(45deg, #ece8de 25%, transparent 25%, transparent 75%, #ece8de 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 7px 7px",
  backgroundColor: "#faf8f3",
};

/** Uppercase-label wrapper for one form field. */
export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">
        {label} {required && <span className="text-accent-gold">*</span>}
      </span>
      {children}
    </div>
  );
}

/** Row of toggleable uppercase chips (styles, occasions, garment types). */
export function ChipRow({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
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
  );
}

/** Round color swatches for the preset palette; stores lowercase color names. */
export function ColorSwatchRow({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map(({ name, hex }) => (
        <button
          key={name}
          type="button"
          onClick={() => onToggle(name)}
          title={name}
          aria-label={name}
          aria-pressed={selected.includes(name)}
          className={cn(
            "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
            selected.includes(name) ? "border-accent-gold" : "border-border",
          )}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}
