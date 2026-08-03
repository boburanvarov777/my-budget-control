import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CreditStatus } from '@prisma/client';

export class CreateCreditDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  interestRate?: number;

  @IsInt()
  @Min(1)
  months!: number;

  @IsDateString()
  startDate!: string;

  @IsNumber()
  @Min(0)
  monthlyPayment!: number;
}

export class UpdateCreditDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  remainingDebt?: number;

  @IsDateString()
  @IsOptional()
  nextPaymentDate?: string;

  @IsEnum(CreditStatus)
  @IsOptional()
  status?: CreditStatus;
}
