import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CATEGORIES, type Category } from 'shared-types';
import { toStringArray } from './string-array.transform';

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
