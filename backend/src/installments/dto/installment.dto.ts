import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInstallmentDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsNumber()
  @Min(0)
  monthlyPayment!: number;

  @IsInt()
  @Min(1)
  totalMonths!: number;

  @IsDateString()
  startDate!: string;
}

export class UpdateInstallmentDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  paidMonths?: number;
}
