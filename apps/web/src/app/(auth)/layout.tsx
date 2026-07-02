import type { ReactNode } from "react";

/** Centered shell for the login/register pages. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-wide text-text-primary">
            WARDROB<span className="text-accent-gold">E</span>
          </h1>
          <p className="mt-2 font-accent text-lg text-text-secondary">
            design your everyday
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
