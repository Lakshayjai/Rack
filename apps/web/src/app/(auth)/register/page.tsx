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
  username: z.string().min(2, "At least 2 characters").max(40),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(72),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { register: registerUser, user, refresh } = useAuth();

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
      await registerUser(values);
      toast.success("Welcome to your wardrobe");
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
