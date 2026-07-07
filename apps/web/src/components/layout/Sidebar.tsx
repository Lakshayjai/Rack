"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, isNavActive } from "./nav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

/** Desktop sidebar: centered wordmark, tracked uppercase nav, user footer. */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      toast.error("Could not log out");
    }
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-secondary md:flex">
      {/* Wordmark */}
      <div className="flex flex-col items-center gap-1 px-6 pb-8 pt-10">
        <Link href="/outfits/new" className="font-display text-[22px] tracking-[0.28em] text-text-primary">
          WARDROBE
        </Link>
        <span className="font-serif text-sm italic text-accent-gold">the private atelier</span>
      </div>

      <nav className="flex-1 space-y-1 px-6">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 border-b border-transparent px-1 py-3.5 text-[12px] uppercase tracking-[0.22em] transition-colors duration-200",
                active
                  ? "border-b-accent-gold text-accent-gold"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Icon size={17} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-gold/50 font-display text-accent-gold">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text-primary">{user?.username}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-1 py-2 text-[11px] uppercase tracking-[0.22em] text-text-secondary transition-colors hover:text-error"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
