import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetPlanDto } from './dto/budget.dto';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async getPlan(userId: string, month: number, year: number) {
    const plan = await this.prisma.budgetPlan.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });
    if (!plan) return null;

    const mandatory = plan.mandatoryExpenses as Array<{
      name: string;
      amount: number;
    }>;
    const mandatoryTotal = mandatory.reduce((s, i) => s + i.amount, 0);
    const remaining = Number(plan.monthlyIncome) - mandatoryTotal;

    return {
      ...plan,
      monthlyIncome: Number(plan.monthlyIncome),
      freeMoney: Number(plan.freeMoney),
      mandatoryTotal,
      remaining,
      recommendations: plan.recommendedSavings,
    };
  }

  async createPlan(userId: string, dto: CreateBudgetPlanDto) {
    const mandatoryTotal = dto.mandatoryExpenses.reduce(
      (s, i) => s + i.amount,
      0,
    );
    const remaining = dto.monthlyIncome - mandatoryTotal;

    const recommendations = this.buildRecommendations(remaining);

    return this.prisma.budgetPlan.upsert({
      where: {
        userId_month_year: {
          userId,
          month: dto.month,
          year: dto.year,
        },
      },
      create: {
        userId,
        month: dto.month,
        year: dto.year,
        monthlyIncome: dto.monthlyIncome,
        mandatoryExpenses: dto.mandatoryExpenses,
        recommendedSavings: recommendations,
        freeMoney: remaining - Object.values(recommendations).reduce((a, b) => a + b, 0),
      },
      update: {
        monthlyIncome: dto.monthlyIncome,
        mandatoryExpenses: dto.mandatoryExpenses,
        recommendedSavings: recommendations,
        freeMoney: remaining - Object.values(recommendations).reduce((a, b) => a + b, 0),
      },
    });
  }

  private buildRecommendations(remaining: number) {
    if (remaining <= 0) {
      return { savings: 0, car: 0, investment: 0, free: 0 };
    }

    const savings = Math.round(remaining * 0.35);
    const car = Math.round(remaining * 0.2);
    const investment = Math.round(remaining * 0.25);
    const free = remaining - savings - car - investment;

    return { savings, car, investment, free };
  }
}
