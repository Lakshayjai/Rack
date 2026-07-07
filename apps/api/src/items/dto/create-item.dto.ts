import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CATEGORIES, type Category } from 'shared-types';

/**
 * Parses a value that may arrive either as a real array (JSON PATCH body) or as
 * a JSON-encoded string (multipart form field on upload). Returns [] on failure.
 */
function toStringArray({ value }: { value: unknown }): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

/** Metadata accompanying an image upload (multipart fields or JSON body). */
export class CreateItemDto {
  @IsIn(CATEGORIES)
  category!: Category;

  /**
   * Pre-extracted transparent PNG as a data URL (from the /items/extract review flow).
   * When present, no file upload is required and background removal is skipped.
   */
  @IsOptional()
  @IsString()
  imageData?: string;

  /** Gender-aware garment type, e.g. "t-shirt", "jeans", "heels". */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  subtype?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  colors: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  styles: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  occasions: string[] = [];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /** Items this piece pairs with as a set (lehenga + choli + dupatta). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  pairedItemIds?: string[];
}
