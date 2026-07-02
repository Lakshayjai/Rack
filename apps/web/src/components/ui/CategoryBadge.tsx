import type { Category } from "shared-types";
import { cn } from "@/lib/utils";

/** Color-coded category pill. Colors are defined as .badge-<CATEGORY> in globals.css. */
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        `badge-${category}`,
        className,
      )}
    >
      {category.toLowerCase()}
    </span>
  );
}
