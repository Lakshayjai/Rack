"use client";

import { useEffect, useRef } from "react";
import type { Bbox } from "./alpha-bbox";

/** Draws a candidate's cutout cropped to its garment bounding box (plus padding). */
export function CandidateThumb({ imageData, bbox }: { imageData: string; bbox: Bbox }) {
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
