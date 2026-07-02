import { IsISO8601, IsOptional } from 'class-validator';

/** Payload for POST /api/outfits/:id/worn — marks the outfit worn on a date (defaults to now). */
export class WornOutfitDto {
  @IsOptional()
  @IsISO8601()
  date?: string;
}
