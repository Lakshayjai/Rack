import type { ReactNode } from "react";

/** Editorial masthead: gold eyebrow, Cinzel title, serif subtitle, hairline rule. */
export function PageHeader({
  title,
  subtitle,
  eyebrow = "The Atelier",
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{eyebrow}</p>
          <h1 className="font-display text-3xl tracking-wide text-text-primary md:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 font-serif text-lg italic text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </div>
      <div className="rule-gold mt-5" />
    </div>
  );
}
