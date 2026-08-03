import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GoalType } from '@prisma/client';

export class CreateGoalDto {
  @IsString()
  name!: string;

  @IsEnum(GoalType)
  @IsOptional()
  type?: GoalType;

  @IsNumber()
  @Min(0)
  targetAmount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  savedAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyAmount?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  savedAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyAmount?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
