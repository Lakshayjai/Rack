"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side route guard for the dashboard. Because the API and web app run on
 * different origins, the authoritative session check is a call to /auth/me
 * (rather than middleware reading the cookie). Redirects to /login if unauthenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <Loader2 className="animate-spin text-accent-gold" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}
