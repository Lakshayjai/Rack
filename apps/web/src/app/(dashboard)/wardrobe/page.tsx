import { Shirt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Placeholder — replaced with the full wardrobe grid + upload flow in Phase 2.
export default function WardrobePage() {
  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Wardrobe" subtitle="Your clothing, organized." />
      <EmptyState
        icon={Shirt}
        title="Your wardrobe is empty"
        description="Uploading and background removal arrive in the next build phase."
      />
    </div>
  );
}
