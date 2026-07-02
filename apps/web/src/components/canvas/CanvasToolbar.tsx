"use client";

import {
  Undo2,
  Redo2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eraser,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import type { CanvasController, CanvasStatus } from "@/types/canvas";
import { cn } from "@/lib/utils";

/** Toolbar above the canvas: undo/redo, layering, remove, clear, zone toggle, export. */
export function CanvasToolbar({
  controller,
  status,
  zonesVisible,
  onToggleZones,
  onExport,
}: {
  controller: CanvasController | null;
  status: CanvasStatus;
  zonesVisible: boolean;
  onToggleZones: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-secondary p-1.5">
      <ToolBtn label="Undo" onClick={() => controller?.undo()} disabled={!status.canUndo}>
        <Undo2 size={18} />
      </ToolBtn>
      <ToolBtn label="Redo" onClick={() => controller?.redo()} disabled={!status.canRedo}>
        <Redo2 size={18} />
      </ToolBtn>

      <Divider />

      <ToolBtn
        label="Bring forward"
        onClick={() => controller?.bringForward()}
        disabled={!status.hasSelection}
      >
        <ChevronUp size={18} />
      </ToolBtn>
      <ToolBtn
        label="Send backward"
        onClick={() => controller?.sendBackward()}
        disabled={!status.hasSelection}
      >
        <ChevronDown size={18} />
      </ToolBtn>
      <ToolBtn
        label="Remove selected"
        onClick={() => controller?.removeSelected()}
        disabled={!status.hasSelection}
      >
        <Trash2 size={18} />
      </ToolBtn>

      <Divider />

      <ToolBtn label={zonesVisible ? "Hide zones" : "Show zones"} onClick={onToggleZones}>
        {zonesVisible ? <Eye size={18} /> : <EyeOff size={18} />}
      </ToolBtn>
      <ToolBtn label="Clear canvas" onClick={() => controller?.clear()} disabled={!status.hasObjects}>
        <Eraser size={18} />
      </ToolBtn>

      <div className="ml-auto">
        <ToolBtn label="Export PNG" onClick={onExport} disabled={!status.hasObjects}>
          <Download size={18} />
        </ToolBtn>
      </div>
    </div>
  );
}

function ToolBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors",
        "hover:bg-bg-tertiary hover:text-text-primary",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold",
        "disabled:opacity-30 disabled:pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px bg-border" />;
}
