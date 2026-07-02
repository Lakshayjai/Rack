import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CATEGORIES, type Category } from 'shared-types';

function toStringArray({ value }: { value: unknown }): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

/** Editable metadata fields (JSON PATCH body). All optional. */
export class UpdateItemDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  styles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  occasions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
