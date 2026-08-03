import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IncomeCategory } from '@prisma/client';

export class CreateIncomeDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsEnum(IncomeCategory)
  @IsOptional()
  category?: IncomeCategory;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateIncomeDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(IncomeCategory)
  @IsOptional()
  category?: IncomeCategory;

  @IsString()
  @IsOptional()
  note?: string;
}
