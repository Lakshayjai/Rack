import { Injectable, NotFoundException } from '@nestjs/common';
import type { Outfit as PrismaOutfit, Prisma } from '@prisma/client';
import type { CanvasState, Outfit, OutfitSort } from 'shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { ListOutfitsDto } from './dto/list-outfits.dto';

export interface PaginatedOutfits {
  outfits: Outfit[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class OutfitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  private toDto(o: PrismaOutfit): Outfit {
    return {
      id: o.id,
      userId: o.userId,
      name: o.name,
      description: o.description,
      canvasState: o.canvasState as CanvasState,
      exportedImageUrl: o.exportedImageUrl,
      itemIds: o.itemIds,
      tags: o.tags,
      wornDates: o.wornDates.map((d) => d.toISOString()),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }

  async create(userId: string, dto: CreateOutfitDto): Promise<Outfit> {
    const outfit = await this.prisma.outfit.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        canvasState: dto.canvasState as Prisma.InputJsonValue,
        itemIds: dto.itemIds,
        tags: dto.tags ?? [],
      },
    });
    return this.toDto(outfit);
  }

  async findAll(userId: string, query: ListOutfitsDto): Promise<PaginatedOutfits> {
    const orderBy = this.orderByFor(query.sort);
    const where: Prisma.OutfitWhereInput = { userId };

    const [rows, total] = await Promise.all([
      this.prisma.outfit.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.outfit.count({ where }),
    ]);

    let outfits = rows.map((r) => this.toDto(r));
    // "Most worn" can't be expressed as a Prisma orderBy on an array length, so sort in-memory.
    if (query.sort === 'most-worn') {
      outfits = outfits.sort((a, b) => b.wornDates.length - a.wornDates.length);
    }
    return { outfits, total, page: query.page, limit: query.limit };
  }

  private orderByFor(sort: OutfitSort): Prisma.OutfitOrderByWithRelationInput {
    switch (sort) {
      case 'name-asc':
        return { name: 'asc' };
      case 'most-worn':
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  async findOne(userId: string, id: string): Promise<Outfit> {
    const outfit = await this.prisma.outfit.findFirst({ where: { id, userId } });
    if (!outfit) throw new NotFoundException('Outfit not found');
    return this.toDto(outfit);
  }

  async update(userId: string, id: string, dto: UpdateOutfitDto): Promise<Outfit> {
    await this.findOne(userId, id);
    const outfit = await this.prisma.outfit.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.canvasState !== undefined && {
          canvasState: dto.canvasState as Prisma.InputJsonValue,
        }),
        ...(dto.itemIds !== undefined && { itemIds: dto.itemIds }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
    return this.toDto(outfit);
  }

  /** Copies an outfit (canvas, pieces, tags) as a fresh starting point. */
  async duplicate(userId: string, id: string): Promise<Outfit> {
    const source = await this.findOne(userId, id);
    const copy = await this.prisma.outfit.create({
      data: {
        userId,
        name: `${source.name} (copy)`.slice(0, 80),
        description: source.description,
        canvasState: source.canvasState as Prisma.InputJsonValue,
        itemIds: source.itemIds,
        tags: source.tags,
      },
    });
    return this.toDto(copy);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    const outfit = await this.findOne(userId, id);
    if (outfit.exportedImageUrl) await this.upload.deleteByUrl(outfit.exportedImageUrl);
    await this.prisma.outfit.delete({ where: { id } });
    return { success: true };
  }

  /** Stores the exported PNG (base64 data URL) and saves its URL on the outfit. */
  async export(userId: string, id: string, imageData: string): Promise<Outfit> {
    const existing = await this.findOne(userId, id);
    if (existing.exportedImageUrl) await this.upload.deleteByUrl(existing.exportedImageUrl);

    const base64 = imageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const { url } = await this.upload.uploadBuffer(buffer, 'wardrobe/outfits');

    const outfit = await this.prisma.outfit.update({
      where: { id },
      data: { exportedImageUrl: url },
    });
    return this.toDto(outfit);
  }

  /** Appends a worn date (defaults to now). */
  async addWorn(userId: string, id: string, date?: string): Promise<Outfit> {
    const existing = await this.findOne(userId, id);
    const when = date ? new Date(date) : new Date();
    const outfit = await this.prisma.outfit.update({
      where: { id },
      data: { wornDates: { set: [...existing.wornDates.map((d) => new Date(d)), when] } },
    });
    return this.toDto(outfit);
  }
}
