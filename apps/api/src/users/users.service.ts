import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserStats {
  itemCount: number;
  outfitCount: number;
  totalWears: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregate wardrobe/outfit counts for the profile page, scoped to one user. */
  async getStats(userId: string): Promise<UserStats> {
    const [itemCount, outfits] = await Promise.all([
      this.prisma.clothingItem.count({ where: { userId } }),
      this.prisma.outfit.findMany({ where: { userId }, select: { wornDates: true } }),
    ]);
    const totalWears = outfits.reduce((sum, o) => sum + o.wornDates.length, 0);
    return { itemCount, outfitCount: outfits.length, totalWears };
  }
}
