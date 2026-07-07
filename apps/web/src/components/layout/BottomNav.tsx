"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "./nav";
import { cn } from "@/lib/utils";

/** Mobile bottom navigation bar. Replaces the sidebar under md. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg-secondary/95 backdrop-blur md:hidden">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-[0.14em] transition-colors",
              active ? "text-accent-gold" : "text-text-secondary",
            )}
          >
            <Icon size={19} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
