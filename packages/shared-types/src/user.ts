/**
 * Shared user/auth types.
 */

/** The authenticated user shape returned by /api/auth/me (never includes password). */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

/** JWT payload embedded in the auth cookie. */
export interface JwtPayload {
  sub: string; // user id
  email: string;
}
