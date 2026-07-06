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

/** Gallery-plaque modal: sharp ivory panel, hairline frame, serif title. */
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1c1917]/30 backdrop-blur-[2px] data-[state=open]:animate-fade-in-up" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-none border border-border bg-bg-secondary p-8 shadow-plume-lg",
            "animate-modal-in max-h-[90vh] overflow-y-auto",
            maxWidth,
          )}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {title && (
                <>
                  <Dialog.Title className="font-display text-2xl tracking-wide text-text-primary">
                    {title}
                  </Dialog.Title>
                  <div className="rule-gold mt-2 w-12" />
                </>
              )}
              {description && (
                <Dialog.Description className="mt-3 font-serif text-base italic text-text-secondary">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="p-1 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
