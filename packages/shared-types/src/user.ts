/**
 * Shared user/auth types.
 */

/** Whose wardrobe this is — tailors category and garment-type options in the UI. */
export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

/** The authenticated user shape returned by /api/auth/me (never includes password). */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  gender: Gender | null;
  createdAt: string;
  updatedAt: string;
}

/** JWT payload embedded in the auth cookie. */
export interface JwtPayload {
  sub: string; // user id
  email: string;
}
