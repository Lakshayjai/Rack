"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2, Check, Wand2, AlertTriangle, ArrowLeft } from "lucide-react";
import { STYLES, OCCASIONS, CATEGORIES, type Category, type ExtractionCandidate } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useAuth } from "@/hooks/useAuth";
import { MaskEditor } from "@/components/wardrobe/MaskEditor";
import {
  CATEGORY_LABELS,
  PRESET_COLORS,
  subtypesFor,
} from "@/lib/wardrobe-constants";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const LABEL_TEXT: Record<ExtractionCandidate["label"], string> = {
  upper: "Upper garment",
  lower: "Lower garment",
  full: "Full-body",
  item: "Whole item",
};

const CHECKER: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #ece8de 25%, transparent 25%, transparent 75%, #ece8de 75%), " +
    "linear-gradient(45deg, #ece8de 25%, transparent 25%, transparent 75%, #ece8de 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 7px 7px",
  backgroundColor: "#faf8f3",
};

type Step = "photo" | "review" | "details";

/** One extraction candidate plus its editable review state. */
interface CandidateState extends ExtractionCandidate {
  key: number;
  category: Category;
  selected: boolean;
  refined: boolean;
}

/** Toggle a value in a string[] (used by chip/swatch multi-selects). */
function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Recompute the alpha bounding box of a (possibly refined) transparent PNG. */
async function alphaBbox(
  dataUrl: string,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      resolve(
        maxX < 0
          ? null
          : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
      );
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

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

  const [category, setCategory] = useState<Category | null>(null);
  const [subtype, setSubtype] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");

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
    setCategory(null);
    setSubtype(null);
    setColors([]);
    setStyles([]);
    setOccasions([]);
    setBrand("");
    setNotes("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

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
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

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
      setCategory(single.category);
      setSubtype(null);
    }
  }, [step, legacyMode, single?.category]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const meta = { colors, styles, occasions, brand, notes };
      if (legacyMode) {
        if (!file || !category) return;
        await uploadItem(file, { ...meta, category, subtype: subtype ?? undefined });
        toast.success("Item added to your wardrobe");
      } else {
        for (const c of selected) {
          await uploadExtracted(c.imageData, {
            ...meta,
            category: single ? (category ?? c.category) : c.category,
            subtype: single && subtype ? subtype : undefined,
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
    ? Boolean(file && category)
    : selected.length > 0 && (!single || Boolean(category));

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
                  onClick={() =>
                    setCandidates((prev) =>
                      prev.map((x) => (x.key === c.key ? { ...x, selected: !x.selected } : x)),
                    )
                  }
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
                      onChange={(e) =>
                        setCandidates((prev) =>
                          prev.map((x) =>
                            x.key === c.key ? { ...x, category: e.target.value as Category } : x,
                          ),
                        )
                      }
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
                      onClick={() => setRefineKey(c.key)}
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
            <Button variant="ghost" onClick={() => { setStep("photo"); setCandidates([]); }}>
              <ArrowLeft size={15} /> Different photo
            </Button>
            <Button onClick={() => setStep("details")} disabled={selected.length === 0}>
              Continue with {selected.length || "no"} piece{selected.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}

      {step === "details" && (
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
          {(legacyMode || single) && (
            <Field label="Category" required>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setSubtype(null);
                      }}
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
              </div>
            </Field>
          )}

          {(legacyMode || single) && category && subtypesFor(user?.gender, category).length > 0 && (
            <Field label="Type">
              <ChipRow
                options={subtypesFor(user?.gender, category)}
                selected={subtype ? [subtype] : []}
                onToggle={(t) => setSubtype((cur) => (cur === t ? null : t))}
              />
            </Field>
          )}

          <Field label="Colors">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(({ name, hex }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setColors((c) => toggle(c, name))}
                  title={name}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    colors.includes(name) ? "border-accent-gold" : "border-border",
                  )}
                  style={{ backgroundColor: hex }}
                  aria-pressed={colors.includes(name)}
                  aria-label={name}
                />
              ))}
            </div>
          </Field>

          <Field label="Style">
            <ChipRow options={[...STYLES]} selected={styles} onToggle={(v) => setStyles((s) => toggle(s, v))} />
          </Field>

          <Field label="Occasion">
            <ChipRow options={[...OCCASIONS]} selected={occasions} onToggle={(v) => setOccasions((o) => toggle(o, v))} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Brand (optional)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Uniqlo"
            />
          </div>
          <Textarea
            label="Notes (optional)"
            value={notes}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering…"
          />

          <div className="flex justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => (legacyMode ? setStep("photo") : setStep("review"))}
            >
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canSave || uploading} loading={uploading}>
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

/** Draws a candidate's cutout cropped to its garment bounding box (plus padding). */
function CandidateThumb({
  imageData,
  bbox,
}: {
  imageData: string;
  bbox: { x: number; y: number; width: number; height: number };
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const pad = Math.round(Math.max(bbox.width, bbox.height) * 0.07);
      const x = Math.max(0, bbox.x - pad);
      const y = Math.max(0, bbox.y - pad);
      const w = Math.min(img.naturalWidth - x, bbox.width + pad * 2);
      const h = Math.min(img.naturalHeight - y, bbox.height + pad * 2);
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, x, y, w, h, 0, 0, w, h);
    };
    img.src = imageData;
  }, [imageData, bbox]);

  return <canvas ref={ref} className="max-h-full max-w-full" style={{ objectFit: "contain" }} />;
}

function Field({
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

function ChipRow({
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
