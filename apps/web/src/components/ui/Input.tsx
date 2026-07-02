"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-lg bg-bg-secondary border border-border px-3 py-2.5 text-base text-text-primary " +
  "placeholder:text-text-muted transition-colors duration-150 " +
  "focus:outline-none focus:border-accent-gold focus-visible:ring-1 focus-visible:ring-accent-gold";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Labeled text input with error text, wired for React Hook Form via ref. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(FIELD, error && "border-error focus:border-error", className)}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  ),
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(FIELD, "resize-none", error && "border-error", className)}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  ),
);
Textarea.displayName = "Textarea";
