import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getPaymentCalendar(userId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [credits, installments, microLoans] = await Promise.all([
      this.prisma.credit.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          nextPaymentDate: { gte: start, lte: end },
        },
      }),
      this.prisma.installment.findMany({
        where: {
          userId,
          nextPaymentDate: { gte: start, lte: end },
        },
      }),
      this.prisma.microLoan.findMany({
        where: {
          userId,
          isPaid: false,
          dueDate: { gte: start, lte: end },
        },
      }),
    ]);

    const events = [
      ...credits.map((c) => ({
        date: c.nextPaymentDate,
        title: c.name,
        amount: Number(c.monthlyPayment),
        type: 'credit' as const,
      })),
      ...installments.map((i) => ({
        date: i.nextPaymentDate,
        title: i.name,
        amount: Number(i.monthlyPayment),
        type: 'installment' as const,
      })),
      ...microLoans.map((m) => ({
        date: m.dueDate,
        title: m.provider,
        amount: Number(m.amount),
        type: 'micro-loan' as const,
      })),
    ].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    return events;
  }
}
