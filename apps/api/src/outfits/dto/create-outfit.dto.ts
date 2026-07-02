import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { CanvasState } from 'shared-types';

/** Payload for POST /api/outfits. */
export class CreateOutfitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Serialized Fabric.js canvas JSON. */
  @IsObject()
  canvasState!: CanvasState;

  @IsArray()
  @IsString({ each: true })
  itemIds: string[] = [];
}
