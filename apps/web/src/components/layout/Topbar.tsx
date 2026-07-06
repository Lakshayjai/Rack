"use client";

import Link from "next/link";
import { Search } from "lucide-react";

/** Minimal top bar: mobile wordmark + a quiet underline search. */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-bg-primary/85 px-4 backdrop-blur-md md:px-8">
      <Link
        href="/wardrobe"
        className="font-display text-lg tracking-[0.24em] text-text-primary md:hidden"
      >
        WARDROBE
      </Link>
      <div className="mx-auto hidden w-full max-w-sm items-center gap-2 border-b border-border py-1.5 text-text-muted focus-within:border-accent-gold sm:flex">
        <Search size={15} strokeWidth={1.5} />
        <input
          type="search"
          placeholder="Search the atelier…"
          className="w-full bg-transparent text-sm font-light text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
    </header>
  );
}
