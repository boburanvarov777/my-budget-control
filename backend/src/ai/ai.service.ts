import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async getAdvice(userId: string, message: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [foodExpenses, credits, goals, microLoans] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          userId,
          category: 'FOOD',
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.credit.findMany({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.goal.findMany({ where: { userId } }),
      this.prisma.microLoan.findMany({
        where: { userId, isPaid: false },
      }),
    ]);

    const tips: string[] = [];
    const foodTotal = Number(foodExpenses._sum.amount ?? 0);

    if (foodTotal > 3_000_000) {
      tips.push(
        `Siz bu oy ${this.format(foodTotal)} ko'p ovqatga sarflagansiz. Haftalik ovqat rejasini tuzing.`,
      );
    }

    const phoneInstallment = await this.prisma.installment.findFirst({
      where: { userId, name: { contains: 'iPhone', mode: 'insensitive' } },
    });
    if (phoneInstallment && phoneInstallment.paidMonths < 2) {
      tips.push(
        `Telefonni 2 oy oldin yopsangiz taxminan ${this.format(Number(phoneInstallment.monthlyPayment) * 2 * 0.75)} tejaysiz.`,
      );
    }

    if (microLoans.length >= 2) {
      tips.push(
        'Ko\'p mikroqarz olish oylik jamg\'armangizni sekinlashtiradi. Yangi qarz olishdan oldin mavjudlarini yoping.',
      );
    }

    const carGoal = goals.find((g) => g.type === 'CAR');
    if (carGoal) {
      const left =
        Number(carGoal.targetAmount) - Number(carGoal.savedAmount);
      if (left > 0) {
        tips.push(
          `Mashina maqsadingiz uchun yana ${this.format(left)} kerak.`,
        );
      }
    }

    if (credits.length) {
      const totalDebt = credits.reduce(
        (s, c) => s + Number(c.remainingDebt),
        0,
      );
      tips.push(
        `Jami faol kredit qarzingiz: ${this.format(totalDebt)}. Qo'shimcha kredit olishdan saqlaning.`,
      );
    }

    if (!tips.length) {
      tips.push(
        'Moliyaviy holatingiz barqaror ko\'rinadi. Jamg\'arma va maqsadlar bo\'yicha muntazam to\'lov qiling.',
      );
    }

    return {
      question: message,
      answer: tips.slice(0, 3).join('\n\n'),
      tips,
    };
  }

  private format(amount: number) {
    return `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;
  }
}
