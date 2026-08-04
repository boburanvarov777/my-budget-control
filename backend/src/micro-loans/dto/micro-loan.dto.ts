import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { MicroLoanProvider } from '@prisma/client';

export class CreateMicroLoanDto {
  @IsEnum(MicroLoanProvider)
  provider!: MicroLoanProvider;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  takenDate!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateMicroLoanDto {
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}
