import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
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

export class CreateExpenseDto {
  @Transform(({ value }) => parseAmountValue(value))
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateExpenseDto {
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
