import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { PublicUser } from 'shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/public-user.mapper';

/**
 * Guards routes by requiring a valid JWT auth cookie (see JwtStrategy).
 *
 * TEMPORARY: when AUTH_DISABLED=true (apps/api/.env), the JWT check is skipped and
 * every request runs as the first user in the database (created on the fly if none
 * exists), so the app can be used without logging in. Remove the flag to restore auth.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /** Cached id of the fallback user; the row itself is re-read per request. */
  private devUserId: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.get<boolean>('authDisabled')) {
      return super.canActivate(context);
    }
    return this.allowAsDevUser(context);
  }

  /** Attaches the fallback user to the request and lets it through. */
  private async allowAsDevUser(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    req.user = await this.resolveDevUser();
    return true;
  }

  private async resolveDevUser(): Promise<PublicUser> {
    let user = this.devUserId
      ? await this.prisma.user.findUnique({ where: { id: this.devUserId } })
      : await this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!user) {
      user = await this.prisma.user.create({
        // Placeholder password — this account cannot log in via /auth/login.
        data: { email: 'dev@wardrobe.local', username: 'dev', password: 'auth-disabled' },
      });
    }

    this.devUserId = user.id;
    return toPublicUser(user);
  }
}
