import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OUTFIT_SORTS, type OutfitSort } from 'shared-types';

/** Query params for GET /api/outfits — pagination + sort. */
export class ListOutfitsDto {
  @IsOptional()
  @IsIn(OUTFIT_SORTS)
  sort: OutfitSort = 'newest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
