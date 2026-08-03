import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Period = 'day' | 'week' | 'month' | 'year';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  private getRange(period: Period) {
    const now = new Date();
    const start = new Date(now);

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end: now };
  }

  async getStatistics(userId: string, period: Period) {
    const { start, end } = this.getRange(period);

    const [incomeAgg, expenses, savingsAgg] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.saving.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const topExpenses = expenses.map((e) => ({
      category: e.category,
      amount: Number(e._sum.amount ?? 0),
    }));

    return {
      period,
      income: Number(incomeAgg._sum.amount ?? 0),
      expenses: topExpenses,
      totalExpense: topExpenses.reduce((s, e) => s + e.amount, 0),
      savings: Number(savingsAgg._sum.amount ?? 0),
    };
  }
}
