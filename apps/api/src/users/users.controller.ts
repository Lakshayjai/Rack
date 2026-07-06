import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { PublicUser } from 'shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService, UserStats } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  getStats(@CurrentUser() user: PublicUser): Promise<UserStats> {
    return this.usersService.getStats(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    return this.usersService.updateProfile(user.id, dto.gender);
  }
}
