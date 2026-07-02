"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Tailwind max-width class for the panel. */
  maxWidth?: string;
}

/** Accessible modal built on Radix Dialog, styled to the design system. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "max-w-xl",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in-up" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-bg-tertiary p-6 shadow-2xl",
            "animate-modal-in max-h-[90vh] overflow-y-auto",
            maxWidth,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              {title && (
                <Dialog.Title className="font-display text-2xl text-text-primary">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="mt-1 text-sm text-text-secondary">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
