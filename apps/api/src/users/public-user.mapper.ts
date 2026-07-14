import type { User } from '@prisma/client';
import type { Gender, PublicUser } from 'shared-types';

/**
 * Maps a Prisma User row to the PublicUser shape returned by the API.
 * Strips the password hash and serializes dates — every place a user leaves
 * the API must go through this.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    gender: (user.gender as Gender | null) ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
