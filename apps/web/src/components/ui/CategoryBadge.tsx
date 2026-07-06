import type { Category } from "shared-types";
import { cn } from "@/lib/utils";

/** Couture category tag. Colors are defined as .badge-<CATEGORY> in globals.css. */
export function CategoryBadge({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        `badge-${category}`,
        className,
      )}
    >
      {category.toLowerCase()}
    </span>
  );
}
