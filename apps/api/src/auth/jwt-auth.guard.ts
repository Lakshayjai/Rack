import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards routes by requiring a valid JWT auth cookie (see JwtStrategy). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
