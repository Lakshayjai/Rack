"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Flower2 } from "lucide-react";
import type { Gender } from "shared-types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  username: z.string().min(2, "At least 2 characters").max(40),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(72),
});
type FormValues = z.infer<typeof schema>;

const GENDER_OPTIONS: { value: Gender; label: string; note: string; icon: typeof User }[] = [
  { value: "male", label: "For Him", note: "shirts · tees · sneakers", icon: User },
  { value: "female", label: "For Her", note: "dresses · tops · heels", icon: Flower2 },
];

/** Signup form: gender preference (tailors categories/types) + credentials. */
export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { register: registerUser, user, refresh } = useAuth();
  const [gender, setGender] = useState<Gender | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (user) router.replace("/outfits/new");
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!gender) {
      toast.error("Tell us whose atelier this is first");
      return;
    }
    try {
      await registerUser({ ...values, gender });
      toast.success("Welcome to your atelier");
      router.replace("/wardrobe");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 border border-border bg-bg-secondary p-8 shadow-plume"
    >
      {/* Whose atelier is this? — asked first, tailors categories & garment types */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] uppercase tracking-[0.22em] text-text-secondary">
          Whose atelier is this? <span className="text-accent-gold">*</span>
        </span>
        <div className="grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map(({ value, label, note, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGender(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 border px-3 py-4 transition-all duration-200",
                gender === value
                  ? "border-text-primary bg-text-primary text-bg-primary"
                  : "border-border text-text-secondary hover:border-accent-gold hover:text-accent-gold",
              )}
            >
              <Icon size={20} strokeWidth={1.25} />
              <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
              <span
                className={cn(
                  "font-serif text-xs italic",
                  gender === value ? "text-bg-primary/70" : "text-text-muted",
                )}
              >
                {note}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Input
        id="username"
        label="Username"
        autoComplete="username"
        placeholder="your name"
        error={errors.username?.message}
        {...register("username")}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="at least 8 characters"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        Begin
      </Button>
      <p className="text-center font-serif text-base italic text-text-secondary">
        Already a member?{" "}
        <Link href="/login" className="text-accent-gold underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
