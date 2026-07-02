import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Outfit, PublicUser } from 'shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OutfitsService, PaginatedOutfits } from './outfits.service';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { ListOutfitsDto } from './dto/list-outfits.dto';
import { ExportOutfitDto } from './dto/export-outfit.dto';
import { WornOutfitDto } from './dto/worn-outfit.dto';

@Controller('outfits')
@UseGuards(JwtAuthGuard)
export class OutfitsController {
  constructor(private readonly outfits: OutfitsService) {}

  @Post()
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateOutfitDto): Promise<Outfit> {
    return this.outfits.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: PublicUser,
    @Query() query: ListOutfitsDto,
  ): Promise<PaginatedOutfits> {
    return this.outfits.findAll(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<Outfit> {
    return this.outfits.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateOutfitDto,
  ): Promise<Outfit> {
    return this.outfits.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<{ success: true }> {
    return this.outfits.remove(user.id, id);
  }

  @Post(':id/export')
  export(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: ExportOutfitDto,
  ): Promise<Outfit> {
    return this.outfits.export(user.id, id, dto.imageData);
  }

  @Post(':id/worn')
  addWorn(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: WornOutfitDto,
  ): Promise<Outfit> {
    return this.outfits.addWorn(user.id, id, dto.date);
  }
}
