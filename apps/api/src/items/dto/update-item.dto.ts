import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CATEGORIES, type Category } from 'shared-types';
import { toOptionalStringArray } from './string-array.transform';

/** Editable metadata fields (JSON PATCH body). All optional. */
export class UpdateItemDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  subtype?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toOptionalStringArray)
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toOptionalStringArray)
  styles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toOptionalStringArray)
  occasions?: string[];

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
  @Transform(toOptionalStringArray)
  pairedItemIds?: string[];
}
