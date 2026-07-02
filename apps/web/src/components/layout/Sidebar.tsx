"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

/** Desktop sidebar: logo, primary nav, and user + logout footer. Hidden on mobile. */
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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-bg-tertiary md:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/wardrobe" className="font-display text-2xl tracking-wide">
          WARDROB<span className="text-accent-gold">E</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "border-l-2 border-accent-gold bg-accent-gold/10 text-accent-gold"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gold/20 font-display text-accent-gold">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text-primary">{user?.username}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
