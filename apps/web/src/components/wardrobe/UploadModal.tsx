"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2 } from "lucide-react";
import type { Category, ExtractionCandidate } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useAuth } from "@/hooks/useAuth";
import { MaskEditor } from "@/components/wardrobe/MaskEditor";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { alphaBbox } from "./upload/alpha-bbox";
import { ReviewStep } from "./upload/ReviewStep";
import { DetailsStep } from "./upload/DetailsStep";
import { EMPTY_DETAILS, type CandidateState, type ItemDetailsForm } from "./upload/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type Step = "photo" | "review" | "details";

/**
 * Add-item flow:
 *   1. photo   — drop a photo; garment extraction runs automatically.
 *   2. review  — pick which detected garments to keep (a worn photo can yield the
 *                shirt AND the pants), fix categories, refine masks by hand.
 *   3. details — shared colors/style/occasion metadata, then save each cutout as
 *                its own wardrobe item.
 * If the extraction service is down the flow degrades to the classic single-photo
 * upload (the API still attempts background removal server-side).
 */
export function UploadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const { uploadItem, extractItem, uploadExtracted } = useWardrobe();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);

  /** True when extraction failed and we fall back to the classic upload path. */
  const [legacyMode, setLegacyMode] = useState(false);
  const [candidates, setCandidates] = useState<CandidateState[]>([]);
  const [refineKey, setRefineKey] = useState<number | null>(null);

  const [form, setForm] = useState<ItemDetailsForm>(EMPTY_DETAILS);
  const patchForm = (changes: Partial<ItemDetailsForm>) =>
    setForm((cur) => ({ ...cur, ...changes }));

  const selected = candidates.filter((c) => c.selected);
  const single = selected.length === 1 ? selected[0] : null;

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep("photo");
    setFile(null);
    setPreviewUrl(null);
    setLegacyMode(false);
    setCandidates([]);
    setRefineKey(null);
    setForm(EMPTY_DETAILS);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  /** Validate the chosen photo and run garment extraction on it. */
  const selectFile = async (f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Please choose a JPG, PNG or WebP image");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));

    setExtracting(true);
    try {
      const result = await extractItem(f);
      const garments = result.candidates.filter((c) => c.label !== "item");
      // Worn photo → preselect each parsed garment; product shot → the whole item.
      const preselect = (c: ExtractionCandidate) =>
        result.mode === "person" && garments.length > 0
          ? c.label !== "item"
          : c.label === "item";
      setCandidates(
        result.candidates.map((c, i) => ({
          ...c,
          key: i,
          category: c.suggestedCategory,
          selected: preselect(c),
          refined: false,
        })),
      );
      setStep("review");
    } catch {
      toast.error("Garment extraction is unavailable — using the simple upload instead");
      setLegacyMode(true);
      setStep("details");
    } finally {
      setExtracting(false);
    }
  };

  // Details-step category defaults to the single selected candidate's category.
  useEffect(() => {
    if (step === "details" && !legacyMode && single) {
      patchForm({ category: single.category, subtype: null, ethnicMode: false });
    }
  }, [step, legacyMode, single?.category]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Swap in a hand-refined cutout and recompute its bounding box. */
  const applyRefine = async (key: number, dataUrl: string) => {
    const bbox = await alphaBbox(dataUrl);
    setCandidates((prev) =>
      prev.map((c) =>
        c.key === key
          ? { ...c, imageData: dataUrl, refined: true, ...(bbox ? { bbox } : {}) }
          : c,
      ),
    );
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const meta = {
        colors: form.colors,
        styles: form.styles,
        occasions: form.occasions,
        brand: form.brand,
        notes: form.notes,
      };
      if (legacyMode) {
        if (!file || !form.category) return;
        await uploadItem(file, {
          ...meta,
          category: form.category,
          subtype: form.subtype ?? undefined,
        });
        toast.success("Item added to your wardrobe");
      } else {
        for (const c of selected) {
          await uploadExtracted(c.imageData, {
            ...meta,
            category: single ? (form.category ?? c.category) : c.category,
            subtype: single && form.subtype ? form.subtype : undefined,
          });
        }
        toast.success(
          selected.length === 1
            ? "Item added to your wardrobe"
            : `${selected.length} items added to your wardrobe`,
        );
      }
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const canSave = legacyMode
    ? Boolean(file && form.category)
    : selected.length > 0 && (!single || Boolean(form.category));

  const refining = candidates.find((c) => c.key === refineKey) ?? null;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Add a piece"
      description={
        step === "review"
          ? "We removed the person and background — keep the garments you want."
          : "Upload a photo — garments are extracted automatically."
      }
      maxWidth={step === "review" ? "max-w-2xl" : undefined}
    >
      {step === "photo" && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void selectFile(f);
            }}
            className={cn(
              "relative flex h-60 w-full flex-col items-center justify-center gap-2 border border-dashed bg-white transition-all duration-200",
              dragOver
                ? "scale-[1.01] border-accent-gold bg-accent-gold/5"
                : "border-border hover:border-accent-gold/70",
            )}
          >
            {extracting && previewUrl ? (
              <>
                <Image src={previewUrl} alt="Preview" fill unoptimized className="object-contain p-2 opacity-40" />
                <div className="z-10 flex flex-col items-center gap-2">
                  <Loader2 size={22} className="animate-spin text-accent-gold" />
                  <span className="font-serif text-lg italic text-text-secondary">
                    Detecting garments…
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    removing person & background
                  </span>
                </div>
              </>
            ) : (
              <>
                <UploadCloud size={26} strokeWidth={1.25} className="text-accent-gold" />
                <span className="font-serif text-lg italic text-text-secondary">
                  Drop a clothing photo — worn or flat-lay
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  JPG · PNG · WebP — max 5MB
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void selectFile(f);
              }}
            />
          </button>
        </div>
      )}

      {step === "review" && (
        <ReviewStep
          candidates={candidates}
          onToggleSelected={(key) =>
            setCandidates((prev) =>
              prev.map((x) => (x.key === key ? { ...x, selected: !x.selected } : x)),
            )
          }
          onChangeCategory={(key, category: Category) =>
            setCandidates((prev) =>
              prev.map((x) => (x.key === key ? { ...x, category } : x)),
            )
          }
          onRefine={setRefineKey}
          onBack={() => {
            setStep("photo");
            setCandidates([]);
          }}
          onContinue={() => setStep("details")}
        />
      )}

      {step === "details" && (
        <DetailsStep
          form={form}
          patch={patchForm}
          gender={user?.gender}
          legacyMode={legacyMode}
          previewUrl={previewUrl}
          selected={selected}
          single={single}
          uploading={uploading}
          canSave={canSave}
          onBack={() => setStep(legacyMode ? "photo" : "review")}
          onCancel={() => handleClose(false)}
          onSave={handleSave}
        />
      )}

      {refining && previewUrl && (
        <MaskEditor
          open={refineKey !== null}
          onOpenChange={(o) => !o && setRefineKey(null)}
          originalUrl={previewUrl}
          cutoutData={refining.imageData}
          onApply={(dataUrl) => void applyRefine(refining.key, dataUrl)}
        />
      )}
    </Modal>
  );
}
