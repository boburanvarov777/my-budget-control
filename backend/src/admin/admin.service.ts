import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [users, incomes, expenses] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.income.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    return {
      users,
      totalIncome: Number(incomes._sum.amount ?? 0),
      totalExpense: Number(expenses._sum.amount ?? 0),
    };
  }

  getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
