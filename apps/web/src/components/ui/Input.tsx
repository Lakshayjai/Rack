"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/*
 * Editorial underline fields — no boxes, just a hairline that turns gold on focus.
 */
const FIELD =
  "w-full bg-transparent border-0 border-b border-border px-0 py-2.5 text-[15px] text-text-primary " +
  "placeholder:text-text-muted placeholder:font-light transition-colors duration-200 " +
  "focus:outline-none focus:border-accent-gold focus:ring-0";

const LABEL = "text-[11px] uppercase tracking-[0.22em] text-text-secondary";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Labeled underline input with error text, wired for React Hook Form via ref. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(FIELD, error && "border-error focus:border-error", className)}
        {...props}
      />
      {error && <span className="font-serif text-sm italic text-error">{error}</span>}
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
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(FIELD, "resize-none", error && "border-error", className)}
        {...props}
      />
      {error && <span className="font-serif text-sm italic text-error">{error}</span>}
    </div>
  ),
);
Textarea.displayName = "Textarea";
