import { InstallmentCurrency } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInstallmentDto {
  @IsString()
  name!: string;

  @IsEnum(InstallmentCurrency)
  @IsOptional()
  currency?: InstallmentCurrency;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  downPayment?: number;

  @IsNumber()
  @Min(0)
  monthlyPayment!: number;

  @IsInt()
  @Min(1)
  totalMonths!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  paidMonths?: number;

  @IsDateString()
  startDate!: string;
}

export class UpdateInstallmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(InstallmentCurrency)
  @IsOptional()
  currency?: InstallmentCurrency;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  downPayment?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyPayment?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  totalMonths?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  paidMonths?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}
