import { Controller, Get, UseGuards } from '@nestjs/common';
import type { PublicUser } from 'shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService, UserStats } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  getStats(@CurrentUser() user: PublicUser): Promise<UserStats> {
    return this.usersService.getStats(user.id);
  }
}
