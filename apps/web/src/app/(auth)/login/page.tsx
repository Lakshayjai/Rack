"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, user, refresh } = useAuth();

  // If already authenticated, skip straight to the app.
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (user) router.replace("/wardrobe");
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values);
      router.replace("/wardrobe");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 border border-border bg-bg-secondary p-8 shadow-plume"
    >
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
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        Enter
      </Button>
      <p className="text-center font-serif text-base italic text-text-secondary">
        New here?{" "}
        <Link href="/register" className="text-accent-gold underline-offset-4 hover:underline">
          Create your atelier
        </Link>
      </p>
    </form>
  );
}
