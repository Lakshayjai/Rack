import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Rewrites a Cloudinary delivery URL to request a transformed variant
 * (e.g. a thumbnail). No-op for non-Cloudinary URLs.
 */
export function cloudinaryTransform(url: string, transform: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/** 200px webp thumbnail transform used across grids. */
export function thumb(url: string): string {
  return cloudinaryTransform(url, "w_200,c_fill,f_webp");
}
