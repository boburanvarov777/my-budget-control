import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';

export class CreateBudgetPlanDto {
  @IsInt()
  @Min(1)
  month!: number;

  @IsInt()
  @Min(2000)
  year!: number;

  @IsNumber()
  @Min(0)
  monthlyIncome!: number;

  @IsArray()
  mandatoryExpenses!: Array<{ name: string; amount: number }>;
}

export class BudgetRecommendationDto {
  @IsObject()
  recommendations!: Record<string, number>;
}
