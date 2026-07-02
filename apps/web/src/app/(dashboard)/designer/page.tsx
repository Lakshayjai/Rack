import { Layers } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Placeholder — replaced with the Fabric.js canvas designer in Phase 3.
export default function DesignerPage() {
  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Designer" subtitle="Compose outfits on a canvas." />
      <EmptyState
        icon={Layers}
        title="The canvas is coming"
        description="Drag-and-drop outfit design arrives in Phase 3."
      />
    </div>
  );
}
