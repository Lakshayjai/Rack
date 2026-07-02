"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, Loader2 } from "lucide-react";
import { CATEGORIES, STYLES, OCCASIONS, type Category } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { CATEGORY_ICONS, PRESET_COLORS } from "@/lib/wardrobe-constants";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Toggle a value in a string[] (used by chip/swatch multi-selects). */
function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function UploadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const { uploadItem } = useWardrobe();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [category, setCategory] = useState<Category | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setCategory(null);
    setColors([]);
    setStyles([]);
    setOccasions([]);
    setBrand("");
    setNotes("");
  };

  const selectFile = (f: File) => {
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
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleUpload = async () => {
    if (!file || !category) return;
    setUploading(true);
    try {
      await uploadItem(file, { category, colors, styles, occasions, brand, notes });
      toast.success("Item added to your wardrobe");
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Add a piece"
      description="Upload a photo — the background is removed automatically."
    >
      <div className="flex flex-col gap-5">
        {/* Drop zone / preview */}
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
            if (f) selectFile(f);
          }}
          className={cn(
            "relative flex h-52 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all",
            dragOver
              ? "scale-[1.02] border-accent-gold bg-accent-gold/5"
              : "border-border hover:border-accent-gold/60",
          )}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              unoptimized
              className="object-contain p-2"
            />
          ) : (
            <>
              <UploadCloud size={28} className="text-text-muted" />
              <span className="text-sm text-text-secondary">
                Drop your clothing photo here or click to browse
              </span>
              <span className="text-xs text-text-muted">JPG, PNG, WebP · max 5MB</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) selectFile(f);
            }}
          />
        </button>

        {/* Category (required) */}
        <Field label="Category" required>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border py-3 text-[11px] capitalize transition-colors",
                    active
                      ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                      : "border-border text-text-secondary hover:border-accent-gold/50",
                  )}
                >
                  <Icon size={18} />
                  {cat.toLowerCase()}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Colors */}
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

        {/* Styles */}
        <Field label="Style">
          <ChipRow options={[...STYLES]} selected={styles} onToggle={(v) => setStyles((s) => toggle(s, v))} />
        </Field>

        {/* Occasions */}
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

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || !category || uploading} loading={uploading}>
            {uploading ? "Processing…" : "Add item"}
          </Button>
        </div>
        {uploading && (
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <Loader2 size={12} className="animate-spin" />
            Removing background and uploading — this can take a few seconds.
          </p>
        )}
      </div>
    </Modal>
  );
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
    <div className="flex flex-col gap-2">
      <span className="text-sm text-text-secondary">
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
            "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
            selected.includes(opt)
              ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
              : "border-border text-text-secondary hover:border-accent-gold/50",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
