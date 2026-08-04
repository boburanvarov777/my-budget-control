import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private monthRange(date = new Date()) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    return { start, end };
  }

  private toNumber(value: Decimal | number | null | undefined): number {
    if (value == null) return 0;
    return Number(value);
  }

  async getSummary(user: User) {
    const { start, end } = this.monthRange();

    const [incomes, expenses, credits, goals, savingsAgg] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId: user.id, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId: user.id, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.credit.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
      }),
      this.prisma.goal.findMany({ where: { userId: user.id } }),
      this.prisma.saving.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      }),
    ]);

    const income = this.toNumber(incomes._sum.amount);
    const expense = this.toNumber(expenses._sum.amount);
    const debt = credits.reduce(
      (sum, c) => sum + this.toNumber(c.remainingDebt),
      0,
    );
    const savings = this.toNumber(savingsAgg._sum.amount);
    const remaining = income - expense;

    const goalProgress = goals.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      targetAmount: this.toNumber(g.targetAmount),
      savedAmount: this.toNumber(g.savedAmount),
      progress:
        this.toNumber(g.targetAmount) > 0
          ? Math.min(
              100,
              Math.round(
                (this.toNumber(g.savedAmount) / this.toNumber(g.targetAmount)) *
                  100,
              ),
            )
          : 0,
    }));

    return {
      greeting: user.firstName ?? user.username ?? 'Foydalanuvchi',
      month: {
        income,
        expense,
        debt,
        savings,
        remaining,
      },
      goals: goalProgress,
      credits: credits.map((c) => ({
        id: c.id,
        name: c.name,
        totalAmount: this.toNumber(c.totalAmount),
        remainingDebt: this.toNumber(c.remainingDebt),
        monthlyPayment: this.toNumber(c.monthlyPayment),
        nextPaymentDate: c.nextPaymentDate,
        status: c.status,
      })),
    };
  }
}
