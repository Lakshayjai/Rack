"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import type { Outfit } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { thumb } from "@/lib/utils";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Month calendar of worn outfits. Each day shows previews of outfits worn that day;
 * clicking a day opens a picker to mark an outfit as worn on that date.
 */
export function OutfitCalendar({
  outfits,
  onMarkWorn,
}: {
  outfits: Outfit[];
  onMarkWorn: (outfitId: string, dateISO: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [pickDate, setPickDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const wornOn = (day: Date): Outfit[] =>
    outfits.filter((o) => o.wornDates.some((d) => isSameDay(new Date(d), day)));

  return (
    <div className="rounded-2xl border border-border bg-bg-secondary p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-display text-xl text-text-primary">{format(month, "MMMM yyyy")}</h2>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const worn = wornOn(day);
          const inMonth = isSameMonth(day, month);
          const today = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              onClick={() => setPickDate(day)}
              className={cn(
                "flex min-h-[64px] flex-col gap-1 rounded-lg border p-1 text-left transition-colors",
                inMonth ? "border-border hover:border-accent-gold/50" : "border-transparent opacity-40",
                today && "ring-1 ring-accent-gold",
              )}
            >
              <span className={cn("text-[11px]", today ? "text-accent-gold" : "text-text-muted")}>
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {worn.slice(0, 3).map((o) => (
                  <div key={o.id} className="relative h-5 w-5 overflow-hidden rounded bg-bg-tertiary" title={o.name}>
                    {o.exportedImageUrl ? (
                      <Image src={o.exportedImageUrl} alt={o.name} fill sizes="20px" className="object-cover" />
                    ) : (
                      <Layers size={10} className="absolute inset-0 m-auto text-text-muted" />
                    )}
                  </div>
                ))}
                {worn.length > 3 && (
                  <span className="text-[10px] text-text-muted">+{worn.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pick which outfit was worn on the selected day. */}
      <Modal
        open={pickDate !== null}
        onOpenChange={(o) => !o && setPickDate(null)}
        title={pickDate ? `Worn on ${format(pickDate, "MMM d, yyyy")}` : ""}
        description="Select an outfit to mark as worn on this day."
        maxWidth="max-w-md"
      >
        {outfits.length === 0 ? (
          <p className="text-sm text-text-muted">You have no saved outfits yet.</p>
        ) : (
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto">
            {outfits.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  if (pickDate) onMarkWorn(o.id, pickDate.toISOString());
                  setPickDate(null);
                }}
                className="overflow-hidden rounded-lg border border-border bg-bg-secondary text-left hover:border-accent-gold/50"
              >
                <div className="relative aspect-square bg-bg-tertiary">
                  {o.exportedImageUrl ? (
                    <Image src={o.exportedImageUrl} alt={o.name} fill sizes="100px" className="object-contain" />
                  ) : (
                    <Layers size={20} className="absolute inset-0 m-auto text-text-muted" />
                  )}
                </div>
                <p className="truncate p-1.5 text-xs text-text-primary">{o.name}</p>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
