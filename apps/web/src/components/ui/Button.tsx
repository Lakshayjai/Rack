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

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-gold text-black font-semibold hover:bg-accent-gold-dim focus-visible:ring-accent-gold",
  secondary:
    "border border-accent-gold text-accent-gold bg-transparent hover:bg-accent-gold/10 focus-visible:ring-accent-gold",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary focus-visible:ring-border",
  danger:
    "bg-error/10 text-error border border-error/30 hover:bg-error/20 focus-visible:ring-error",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
};

/** Themed button with variants, sizes and a loading spinner. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
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
      "w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center",
      "text-text-primary hover:bg-border transition-colors duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold",
      "disabled:opacity-40 disabled:pointer-events-none",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";
