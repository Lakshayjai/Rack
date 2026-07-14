"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Shirt, Layers, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import type { UserStats } from "shared-types";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";

/** Profile page: user card, wardrobe stats, and the light/dark theme toggle. */
export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    api.get<UserStats>("/users/stats").then(setStats).catch(() => setStats(null));
  }, []);

  const cards = [
    { icon: Shirt, label: "Pieces", value: stats?.itemCount ?? "—" },
    { icon: Layers, label: "Outfits", value: stats?.outfitCount ?? "—" },
    { icon: CalendarCheck, label: "Wears", value: stats?.totalWears ?? "—" },
  ];

  return (
    <div className="animate-fade-in-up max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Your profile and preferences."
        eyebrow="Private Salon"
      />

      <section className="border border-border bg-bg-secondary p-8 shadow-plume">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent-gold/50 font-display text-2xl text-accent-gold">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-display text-2xl tracking-wide text-text-primary">
              {user?.username}
            </p>
            <p className="mt-1 font-serif text-base italic text-text-secondary">{user?.email}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 divide-x divide-border border-t border-border pt-6">
          {cards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-4 text-center first:pl-0 last:pr-0">
              <Icon size={18} strokeWidth={1.25} className="mx-auto text-accent-gold" />
              <p className="mt-3 font-display text-3xl text-text-primary">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 flex items-center justify-between border border-border bg-bg-secondary p-8 shadow-plume">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">
            Appearance
          </p>
          <p className="mt-2 font-serif text-lg italic text-text-secondary">
            {theme === "light" ? "Daylight ivory" : "Evening espresso"}
          </p>
        </div>
        <Button variant="secondary" onClick={toggle}>
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          {theme === "light" ? "Evening" : "Daylight"}
        </Button>
      </section>
    </div>
  );
}
