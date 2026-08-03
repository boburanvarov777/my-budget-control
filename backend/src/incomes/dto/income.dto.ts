import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

function parseAmountValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    return digits ? Number(digits) : value;
  }
  return value;
}

export class CreateIncomeDto {
  @Transform(({ value }) => parseAmountValue(value))
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateIncomeDto {
  @Transform(({ value }) => parseAmountValue(value))
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
