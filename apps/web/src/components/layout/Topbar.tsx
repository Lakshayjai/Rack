"use client";

import Link from "next/link";
import { Search } from "lucide-react";

/** Top bar: mobile logo + a decorative global search field. */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-bg-secondary/80 px-4 backdrop-blur md:px-6">
      <Link href="/wardrobe" className="font-display text-xl tracking-wide md:hidden">
        WARDROB<span className="text-accent-gold">E</span>
      </Link>
      <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-muted sm:flex">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search your wardrobe…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
    </header>
  );
}
