"use client";

import { Check, Wand2, AlertTriangle, ArrowLeft } from "lucide-react";
import { CATEGORIES, type Category } from "shared-types";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/wardrobe-constants";
import { CHECKER } from "@/components/wardrobe/form-fields";
import { cn } from "@/lib/utils";
import { CandidateThumb } from "./CandidateThumb";
import { LABEL_TEXT, type CandidateState } from "./types";

/**
 * Step 2 of the upload wizard: shows every cutout the extraction produced and
 * lets the user keep/discard each one, fix its category, or open the mask editor.
 */
export function ReviewStep({
  candidates,
  onToggleSelected,
  onChangeCategory,
  onRefine,
  onBack,
  onContinue,
}: {
  candidates: CandidateState[];
  onToggleSelected: (key: number) => void;
  onChangeCategory: (key: number, category: Category) => void;
  /** Open the MaskEditor for this candidate. */
  onRefine: (key: number) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const selectedCount = candidates.filter((c) => c.selected).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {candidates.map((c) => (
          <div
            key={c.key}
            className={cn(
              "flex flex-col border transition-all duration-200",
              c.selected ? "border-accent-gold shadow-plume" : "border-border opacity-80",
            )}
          >
            <button
              type="button"
              onClick={() => onToggleSelected(c.key)}
              className="relative flex h-44 items-center justify-center overflow-hidden"
              style={CHECKER}
            >
              <CandidateThumb imageData={c.imageData} bbox={c.bbox} />
              <span
                className={cn(
                  "absolute left-2 top-2 flex h-5 w-5 items-center justify-center border",
                  c.selected
                    ? "border-accent-gold bg-accent-gold text-white"
                    : "border-border bg-white text-transparent",
                )}
              >
                <Check size={13} strokeWidth={3} />
              </span>
              {c.confidence < 0.55 && (
                <span className="absolute right-2 top-2 flex items-center gap-1 bg-warning/90 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white">
                  <AlertTriangle size={10} /> check edges
                </span>
              )}
            </button>
            <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.16em] text-text-primary">
                  {LABEL_TEXT[c.label]}
                  {c.refined && " · refined"}
                </span>
                <span className="text-[9px] uppercase tracking-[0.12em] text-text-muted">
                  {Math.round(c.confidence * 100)}% confidence
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={c.category}
                  onChange={(e) => onChangeCategory(c.key, e.target.value as Category)}
                  className="border border-border bg-bg-secondary px-1.5 py-1 text-[10px] uppercase tracking-[0.1em] text-text-secondary focus:border-accent-gold focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Refine cutout"
                  onClick={() => onRefine(c.key)}
                  className="flex h-7 w-7 items-center justify-center border border-border text-text-secondary transition-colors hover:border-accent-gold hover:text-accent-gold"
                >
                  <Wand2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        Low confidence? Use the wand to restore missed fabric or erase leftover skin and
        background by hand.
      </p>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={15} /> Different photo
        </Button>
        <Button onClick={onContinue} disabled={selectedCount === 0}>
          Continue with {selectedCount || "no"} piece{selectedCount === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
