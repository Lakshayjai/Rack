import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Centered empty-state block: icon + title + copy + optional CTA. */
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <Icon size={48} className="text-text-muted" strokeWidth={1.25} />
      <h3 className="mt-4 font-display text-xl text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
