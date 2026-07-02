import { Skeleton } from "@/components/ui/Skeleton";

/** Route-level loading skeleton for dashboard pages. */
export default function DashboardLoading() {
  return (
    <div className="animate-fade-in-up">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}
