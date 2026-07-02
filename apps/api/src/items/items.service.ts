import { Injectable, NotFoundException } from '@nestjs/common';
import type { ClothingItem as PrismaItem, Prisma } from '@prisma/client';
import type { ClothingItem, Category } from 'shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ListItemsDto } from './dto/list-items.dto';

export interface PaginatedItems {
  items: ClothingItem[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  /** Serializes a Prisma row (Date objects) into the shared API shape (ISO strings). */
  private toDto(item: PrismaItem): ClothingItem {
    return {
      id: item.id,
      userId: item.userId,
      imageUrl: item.imageUrl,
      thumbUrl: item.thumbUrl,
      category: item.category as Category,
      colors: item.colors,
      styles: item.styles,
      occasions: item.occasions,
      brand: item.brand,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async create(
    userId: string,
    dto: CreateItemDto,
    imageUrl: string,
    thumbUrl: string | null,
  ): Promise<ClothingItem> {
    const item = await this.prisma.clothingItem.create({
      data: {
        userId,
        imageUrl,
        thumbUrl,
        category: dto.category,
        colors: dto.colors,
        styles: dto.styles,
        occasions: dto.occasions,
        brand: dto.brand ?? null,
        notes: dto.notes ?? null,
      },
    });
    return this.toDto(item);
  }

  async findAll(userId: string, query: ListItemsDto): Promise<PaginatedItems> {
    const where: Prisma.ClothingItemWhereInput = { userId };
    if (query.category) where.category = query.category;
    if (query.style) where.styles = { has: query.style };
    if (query.color) where.colors = { has: query.color };
    if (query.search) {
      const term = query.search;
      where.OR = [
        { brand: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
        { colors: { has: term.toLowerCase() } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.clothingItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.clothingItem.count({ where }),
    ]);

    return { items: rows.map((r) => this.toDto(r)), total, page: query.page, limit: query.limit };
  }

  /** Fetches one item, enforcing ownership. */
  async findOne(userId: string, id: string): Promise<ClothingItem> {
    const item = await this.prisma.clothingItem.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Item not found');
    return this.toDto(item);
  }

  async update(userId: string, id: string, dto: UpdateItemDto): Promise<ClothingItem> {
    await this.findOne(userId, id); // ownership check
    const item = await this.prisma.clothingItem.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.colors !== undefined && { colors: dto.colors }),
        ...(dto.styles !== undefined && { styles: dto.styles }),
        ...(dto.occasions !== undefined && { occasions: dto.occasions }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
    return this.toDto(item);
  }

  /** Deletes an item and its Cloudinary asset. */
  async remove(userId: string, id: string): Promise<{ success: true }> {
    const item = await this.findOne(userId, id);
    await this.upload.deleteByUrl(item.imageUrl);
    await this.prisma.clothingItem.delete({ where: { id } });
    return { success: true };
  }
}
