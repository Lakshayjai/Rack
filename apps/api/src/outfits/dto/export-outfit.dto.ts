import { IsString, Matches } from 'class-validator';

/** Payload for POST /api/outfits/:id/export — a PNG data URL from canvas.toDataURL(). */
export class ExportOutfitDto {
  @IsString()
  @Matches(/^data:image\/png;base64,/, { message: 'imageData must be a PNG data URL' })
  imageData!: string;
}
