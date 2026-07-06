import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { Gender, JwtPayload, PublicUser } from 'shared-types';
import { PrismaService } from '../prisma/prisma.service';

/** Reads the JWT from the HTTP-only `access_token` cookie. */
function cookieExtractor(req: Request): string | null {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.access_token ?? null;
}

/**
 * Validates the JWT from the auth cookie and resolves the current user.
 * The resolved PublicUser is attached to `req.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'insecure-dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      gender: (user.gender as Gender | null) ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
