"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Shirt, Layers, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";

interface UserStats {
  itemCount: number;
  outfitCount: number;
  totalWears: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    api.get<UserStats>("/users/stats").then(setStats).catch(() => setStats(null));
  }, []);

  const cards = [
    { icon: Shirt, label: "Items", value: stats?.itemCount ?? "—" },
    { icon: Layers, label: "Outfits", value: stats?.outfitCount ?? "—" },
    { icon: CalendarCheck, label: "Total wears", value: stats?.totalWears ?? "—" },
  ];

  return (
    <div className="animate-fade-in-up max-w-2xl">
      <PageHeader title="Settings" subtitle="Your profile and preferences." />

      <section className="rounded-2xl border border-border bg-bg-secondary p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-gold/20 font-display text-2xl text-accent-gold">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-display text-xl text-text-primary">{user?.username}</p>
            <p className="text-sm text-text-secondary">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {cards.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-bg-tertiary p-4 text-center"
            >
              <Icon size={20} className="mx-auto text-accent-gold" />
              <p className="mt-2 font-display text-2xl text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-bg-secondary p-6">
        <div>
          <p className="text-text-primary">Appearance</p>
          <p className="text-sm text-text-secondary">
            Currently using {theme} mode.
          </p>
        </div>
        <Button variant="secondary" onClick={toggle}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </section>
    </div>
  );
}
