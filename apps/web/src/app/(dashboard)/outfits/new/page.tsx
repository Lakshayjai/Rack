"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import type { Category, ClothingItem } from "shared-types";
import { OUTFIT_TAG_PRESETS } from "shared-types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { CATEGORY_ICONS } from "@/lib/wardrobe-constants";
import { layoutOutfit, roleFor, type LayoutPiece } from "@/lib/outfit-layout";
import { thumb, cn } from "@/lib/utils";
import { Shirt } from "lucide-react";

interface Slot {
  key: string;
  category: Category;
  label: string;
  hint?: string;
  multi?: boolean;
}

const SLOTS: Slot[] = [
  { key: "top", category: "TOP", label: "Top" },
  { key: "bottom", category: "BOTTOM", label: "Bottom" },
  { key: "full", category: "DRESS", label: "Full-body", hint: "replaces top + bottom" },
  { key: "outerwear", category: "OUTERWEAR", label: "Outerwear", hint: "optional layer" },
  { key: "shoes", category: "SHOE", label: "Footwear" },
  { key: "accessories", category: "ACCESSORY", label: "Accessories", hint: "pick several", multi: true },
];

const MAX_ACCESSORIES = 6;

/**
 * "Make Outfit" wizard: pick pieces by slot, watch the flat-lay compose itself in
 * the live preview, then continue to the Composition Room where the same layout is
 * applied to the real canvas for fine-tuning, saving and export.
 */
export default function NewOutfitPage() {
  const router = useRouter();
  const toast = useToast();
  const { items, loaded, fetchItems } = useWardrobe();

  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [activeSlot, setActiveSlot] = useState<string>("top");
  /** Measured natural aspect (h/w) per item, filled in as preview images load. */
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    void fetchItems().catch(() => toast.error("Could not load your wardrobe"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickItem = (slot: Slot, itemId: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      const current = next[slot.key] ?? [];
      if (slot.multi) {
        next[slot.key] = current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : current.length < MAX_ACCESSORIES
            ? [...current, itemId]
            : current;
      } else {
        next[slot.key] = current[0] === itemId ? [] : [itemId];
      }
      // A full-body piece replaces top + bottom, and vice versa.
      if (slot.key === "full" && (next.full?.length ?? 0) > 0) {
        next.top = [];
        next.bottom = [];
      }
      if ((slot.key === "top" || slot.key === "bottom") && (next[slot.key]?.length ?? 0) > 0) {
        next.full = [];
      }
      return next;
    });
  };

  const selectedIds = useMemo(
    () => SLOTS.flatMap((s) => picks[s.key] ?? []),
    [picks],
  );

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((i) => i.id === id))
        .filter((i): i is ClothingItem => Boolean(i)),
    [selectedIds, items],
  );

  const placements = useMemo(() => {
    const pieces: LayoutPiece[] = selectedItems.map((item) => ({
      id: item.id,
      url: item.imageUrl,
      role: roleFor(item.category),
      subtype: item.subtype,
      aspect: aspects[item.id],
    }));
    return layoutOutfit(pieces);
  }, [selectedItems, aspects]);

  const handleCompose = () => {
    if (selectedItems.length === 0) return;
    const query = new URLSearchParams({ items: selectedIds.join(",") });
    if (name.trim()) query.set("name", name.trim());
    if (tags.length) query.set("tags", tags.join(","));
    router.push(`/designer?${query.toString()}`);
  };

  const isEmpty = loaded && items.length === 0;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Make an Outfit"
        subtitle="Pick your pieces — we arrange the flat-lay for you."
        eyebrow="The Atelier"
      />

      {isEmpty ? (
        <EmptyState
          icon={Shirt}
          title="Your wardrobe is empty"
          description="Add a few pieces first — then come back and compose a look."
          action={<Button onClick={() => router.push("/wardrobe")}>Go to The Collection</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left — slot pickers */}
          <div className="flex flex-col gap-3">
            {SLOTS.map((slot) => {
              const slotItems = items.filter((i) => i.category === slot.category);
              const chosen = picks[slot.key] ?? [];
              const isOpen = activeSlot === slot.key;
              const Icon = CATEGORY_ICONS[slot.category];
              // Full-body is "replaced" (greyed) while top/bottom are chosen and vice versa.
              const replaced =
                (slot.key === "full" && ((picks.top?.length ?? 0) > 0 || (picks.bottom?.length ?? 0) > 0)) ||
                ((slot.key === "top" || slot.key === "bottom") && (picks.full?.length ?? 0) > 0);

              return (
                <section
                  key={slot.key}
                  className={cn(
                    "border bg-bg-secondary shadow-plume transition-opacity",
                    isOpen ? "border-accent-gold/60" : "border-border",
                    replaced && !isOpen && "opacity-50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSlot(isOpen ? "" : slot.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <Icon size={18} strokeWidth={1.5} className="text-accent-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-text-primary">
                      {slot.label}
                    </span>
                    {slot.hint && (
                      <span className="font-serif text-sm italic text-text-muted">{slot.hint}</span>
                    )}
                    <span className="ml-auto flex items-center gap-2">
                      {chosen.length > 0 && (
                        <span className="flex -space-x-2">
                          {chosen.slice(0, 3).map((id) => {
                            const item = items.find((i) => i.id === id);
                            return item ? (
                              <span key={id} className="relative h-8 w-8 overflow-hidden border border-border bg-white">
                                <Image src={thumb(item.imageUrl)} alt="" fill sizes="32px" className="object-contain p-0.5" />
                              </span>
                            ) : null;
                          })}
                          {chosen.length > 3 && (
                            <span className="flex h-8 w-8 items-center justify-center border border-border bg-bg-tertiary text-[10px] text-text-secondary">
                              +{chosen.length - 3}
                            </span>
                          )}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={cn("text-text-muted transition-transform", isOpen && "rotate-180")}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border p-4">
                      {slotItems.length === 0 ? (
                        <p className="py-4 text-center font-serif text-sm italic text-text-muted">
                          Nothing in this category yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                          {slotItems.map((item) => {
                            const active = chosen.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => pickItem(slot, item.id)}
                                title={item.subtype ?? item.category}
                                className={cn(
                                  "relative aspect-square overflow-hidden border bg-white transition-all duration-200",
                                  active
                                    ? "border-accent-gold shadow-plume"
                                    : "border-border hover:border-accent-gold/60",
                                )}
                              >
                                <Image
                                  src={thumb(item.imageUrl)}
                                  alt={item.subtype ?? item.category}
                                  fill
                                  sizes="100px"
                                  className="object-contain p-1"
                                />
                                {active && (
                                  <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center bg-accent-gold text-white">
                                    <Check size={11} strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Right — live flat-lay preview + naming */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[3/4] w-full overflow-hidden border border-border bg-[#f7f4ee] shadow-plume">
              {placements.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
                  <Sparkles size={24} strokeWidth={1.25} />
                  <span className="font-serif text-sm italic">
                    Your look composes itself here
                  </span>
                </div>
              ) : (
                placements.map((pl) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={pl.id}
                    src={pl.url}
                    alt=""
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      const aspect = el.naturalHeight / el.naturalWidth;
                      setAspects((prev) =>
                        prev[pl.id] === aspect ? prev : { ...prev, [pl.id]: aspect },
                      );
                    }}
                    className="absolute object-contain"
                    style={{
                      left: `${(pl.cx - pl.w / 2) * 100}%`,
                      top: `${(pl.cy - pl.h / 2) * 100}%`,
                      width: `${pl.w * 100}%`,
                      height: `${pl.h * 100}%`,
                      zIndex: pl.z,
                    }}
                  />
                ))
              )}
            </div>

            <Input
              label="Outfit name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Retro Football Casual"
            />

            <div className="flex flex-wrap items-center gap-1.5">
              {OUTFIT_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setTags((cur) =>
                      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
                    )
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
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setPicks({});
                  setName("");
                  setTags([]);
                }}
                disabled={selectedItems.length === 0}
              >
                <RotateCcw size={15} /> Reset
              </Button>
              <Button
                className="flex-1"
                onClick={handleCompose}
                disabled={selectedItems.length === 0}
              >
                <Sparkles size={16} /> Arrange & fine-tune
              </Button>
            </div>
            <p className="text-center text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {selectedItems.length} piece{selectedItems.length === 1 ? "" : "s"} selected
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
