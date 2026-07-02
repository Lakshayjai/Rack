import { Grid2x2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Placeholder — replaced with the outfit gallery + calendar in Phase 4.
export default function OutfitsPage() {
  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Outfits" subtitle="Your saved looks." />
      <EmptyState
        icon={Grid2x2}
        title="No outfits yet"
        description="Saved outfits and the worn-date calendar arrive in Phase 4."
      />
    </div>
  );
}
