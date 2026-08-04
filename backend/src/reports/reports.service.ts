import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyReport(userId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [income, expense, savings, credits] = await Promise.all([
      this.prisma.income.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.saving.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.credit.findMany({ where: { userId } }),
    ]);

    const totalDebt = credits.reduce((s, c) => s + Number(c.remainingDebt), 0);

    return {
      month,
      year,
      income: Number(income._sum.amount ?? 0),
      expense: Number(expense._sum.amount ?? 0),
      savings: Number(savings._sum.amount ?? 0),
      debt: totalDebt,
      remaining:
        Number(income._sum.amount ?? 0) - Number(expense._sum.amount ?? 0),
    };
  }
}
