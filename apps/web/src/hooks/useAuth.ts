"use client";

import { useCallback } from "react";
import type { Gender, PublicUser } from "shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface Credentials {
  email: string;
  password: string;
}
interface RegisterInput extends Credentials {
  username: string;
  gender: Gender;
}

/**
 * Auth actions bound to the Zustand store. The server owns the session via an
 * HTTP-only cookie; this hook mirrors the resulting user into client state.
 */
export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  /** Fetch the current user from the cookie session; clears state on 401. */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.get<PublicUser>("/auth/me");
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setUser(null);
      else setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const login = useCallback(
    async (creds: Credentials) => {
      const me = await api.post<PublicUser>("/auth/login", creds);
      setUser(me);
      return me;
    },
    [setUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const me = await api.post<PublicUser>("/auth/register", input);
      setUser(me);
      return me;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, [setUser]);

  /** Persist profile preferences (e.g. the gender that tailors the UI). */
  const updateProfile = useCallback(
    async (gender: Gender) => {
      const me = await api.patch<PublicUser>("/users/me", { gender });
      setUser(me);
      return me;
    },
    [setUser],
  );

  return { user, loading, refresh, login, register, logout, updateProfile };
}
