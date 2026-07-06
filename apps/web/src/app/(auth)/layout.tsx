import type { ReactNode } from "react";

/**
 * Entrance hall for login/register: split editorial layout — a serif manifesto
 * panel on the left (desktop), the form on ivory to the right.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Editorial panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-bg-tertiary p-14 lg:flex">
        <p className="eyebrow">Est. for you alone</p>
        <div>
          <h2 className="font-display text-5xl leading-tight tracking-wide text-text-primary">
            EVERY
            <br />
            PIECE,
            <br />
            PLACED.
          </h2>
          <div className="rule-gold mt-8 w-24" />
          <p className="mt-8 max-w-md font-serif text-2xl italic leading-relaxed text-text-secondary">
            A private atelier for your wardrobe — photograph your pieces, compose
            your looks, and dress with intention.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-text-muted">
          Wardrobe — The Private Atelier
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl tracking-[0.28em] text-text-primary">
              WARDROBE
            </h1>
            <p className="mt-2 font-serif text-lg italic text-accent-gold">
              the private atelier
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
