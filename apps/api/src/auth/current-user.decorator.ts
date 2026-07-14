import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from 'shared-types';

/** Injects the authenticated PublicUser (populated by JwtStrategy) into a handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: PublicUser }>();
    return request.user;
  },
);
