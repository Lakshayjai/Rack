import { create } from "zustand";
import type { PublicUser } from "shared-types";

interface AuthState {
  user: PublicUser | null;
  /** True until the initial /auth/me check resolves. */
  loading: boolean;
  setUser: (user: PublicUser | null) => void;
  setLoading: (loading: boolean) => void;
}

/** Holds the authenticated user for the session (source of truth is the HTTP-only cookie). */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
