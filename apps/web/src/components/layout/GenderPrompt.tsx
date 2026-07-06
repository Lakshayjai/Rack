"use client";

import { useState } from "react";
import { User, Flower2 } from "lucide-react";
import type { Gender } from "shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * One-time prompt for accounts created before gender preferences existed.
 * Saving tailors the category and garment-type options across the app.
 */
export function GenderPrompt() {
  const toast = useToast();
  const { user, updateProfile } = useAuth();
  const [choice, setChoice] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);

  // Only shown while the signed-in user has no stored preference.
  const open = Boolean(user && user.gender === null);

  const save = async () => {
    if (!choice) return;
    setSaving(true);
    try {
      await updateProfile(choice);
      toast.success("Your atelier is tailored");
    } catch {
      toast.error("Could not save your preference");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={() => undefined /* required choice — closes on save */}
      title="Whose atelier is this?"
      description="We tailor the categories and garment types to you."
      maxWidth="max-w-md"
    >
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { value: "male", label: "For Him", note: "shirts · tees · sneakers", icon: User },
            { value: "female", label: "For Her", note: "dresses · tops · heels", icon: Flower2 },
          ] as const
        ).map(({ value, label, note, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setChoice(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 border px-3 py-5 transition-all duration-200",
              choice === value
                ? "border-text-primary bg-text-primary text-bg-primary"
                : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
            )}
          >
            <Icon size={22} strokeWidth={1.25} />
            <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
            <span
              className={cn(
                "font-serif text-xs italic",
                choice === value ? "text-bg-primary/70" : "text-text-muted",
              )}
            >
              {note}
            </span>
          </button>
        ))}
      </div>
      <Button onClick={save} disabled={!choice} loading={saving} className="mt-6 w-full">
        Continue
      </Button>
    </Modal>
  );
}
