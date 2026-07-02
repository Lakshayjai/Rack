"use client";

import { CANVAS_HEIGHT, ZONES } from "@/types/canvas";

/**
 * Dashed drop-zone guides drawn over the canvas. Purely visual and non-interactive;
 * shown only while the canvas is empty to invite the user to drag items in.
 */
export function ZoneOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {ZONES.map((zone) => {
        const topPct = (zone.from / CANVAS_HEIGHT) * 100;
        const heightPct = ((zone.to - zone.from) / CANVAS_HEIGHT) * 100;
        return (
          <div
            key={zone.key}
            className="absolute left-2 right-2 flex items-center justify-center rounded-lg border-2 border-dashed"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              borderColor: `${zone.color}66`,
            }}
          >
            <span className="text-sm" style={{ color: `${zone.color}99` }}>
              {zone.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
