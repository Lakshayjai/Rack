"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/*
 * Couture buttons: uppercase, letter-spaced, sharp edges.
 * Primary is ink with an antique-gold hover; secondary is a hairline frame.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-text-primary text-bg-primary hover:bg-accent-gold hover:text-white focus-visible:ring-accent-gold",
  secondary:
    "border border-text-primary/70 text-text-primary bg-transparent hover:border-accent-gold hover:text-accent-gold focus-visible:ring-accent-gold",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary focus-visible:ring-border",
  danger:
    "border border-error/40 text-error bg-transparent hover:bg-error hover:text-white focus-visible:ring-error",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[11px]",
  md: "px-6 py-3 text-xs",
};

/** Themed button with variants, sizes and a loading spinner. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-none font-medium uppercase tracking-[0.18em]",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

/** Circular icon-only button used in hover overlays and toolbars. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }
>(({ className, label, children, ...props }, ref) => (
  <button
    ref={ref}
    aria-label={label}
    title={label}
    className={cn(
      "w-10 h-10 rounded-full border border-border bg-bg-secondary flex items-center justify-center",
      "text-text-primary transition-colors duration-200 hover:border-accent-gold hover:text-accent-gold",
      "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold",
      "disabled:opacity-40 disabled:pointer-events-none",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";
