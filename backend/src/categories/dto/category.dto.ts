import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsEnum(CategoryType)
  type!: CategoryType;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  label!: string;

  @IsString()
  @IsOptional()
  @MaxLength(8)
  icon?: string;
}
