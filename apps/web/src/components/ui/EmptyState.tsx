import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Centered empty-state vignette: fine-line icon, serif copy, one clear CTA. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-border bg-bg-secondary py-24 text-center shadow-plume">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border">
        <Icon size={30} className="text-accent-gold" strokeWidth={1} />
      </div>
      <h3 className="mt-6 font-display text-2xl tracking-wide text-text-primary">{title}</h3>
      {description && (
        <p className="mt-3 max-w-sm font-serif text-lg italic text-text-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
