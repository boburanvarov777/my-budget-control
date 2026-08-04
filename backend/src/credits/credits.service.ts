import { Injectable, NotFoundException } from '@nestjs/common';
import { CreditStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditDto, UpdateCreditDto } from './dto/credit.dto';

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.credit.findMany({
      where: { userId },
      orderBy: { nextPaymentDate: 'asc' },
    });
  }

  create(userId: string, dto: CreateCreditDto) {
    const start = new Date(dto.startDate);
    const paidMonths = Math.min(dto.months, Math.max(0, dto.paidMonths ?? 0));
    const payment = this.buildPaymentState(
      dto.totalAmount,
      dto.monthlyPayment,
      dto.months,
      paidMonths,
      start,
    );

    return this.prisma.credit.create({
      data: {
        userId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        downPayment: dto.downPayment ?? 0,
        interestRate: dto.interestRate ?? 0,
        months: dto.months,
        paidMonths,
        startDate: start,
        monthlyPayment: dto.monthlyPayment,
        remainingDebt: payment.remainingDebt,
        nextPaymentDate: payment.nextPaymentDate,
        status: payment.status,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCreditDto) {
    const existing = await this.ensureOwned(userId, id);

    const totalAmount = dto.totalAmount ?? Number(existing.totalAmount);
    const monthlyPayment =
      dto.monthlyPayment ?? Number(existing.monthlyPayment);
    const months = dto.months ?? existing.months;
    const paidMonths = Math.min(
      months,
      Math.max(0, dto.paidMonths ?? existing.paidMonths),
    );
    const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;

    const payment = this.buildPaymentState(
      totalAmount,
      monthlyPayment,
      months,
      paidMonths,
      start,
    );

    return this.prisma.credit.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.totalAmount != null ? { totalAmount: dto.totalAmount } : {}),
        ...(dto.monthlyPayment != null
          ? { monthlyPayment: dto.monthlyPayment }
          : {}),
        ...(dto.months != null ? { months: dto.months } : {}),
        ...(dto.interestRate != null ? { interestRate: dto.interestRate } : {}),
        ...(dto.startDate != null ? { startDate: start } : {}),
        paidMonths,
        remainingDebt: payment.remainingDebt,
        nextPaymentDate: payment.nextPaymentDate,
        status: dto.status ?? payment.status,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.credit.delete({ where: { id } });
  }

  private buildPaymentState(
    totalAmount: number,
    monthlyPayment: number,
    months: number,
    paidMonths: number,
    startDate: Date,
  ) {
    const remainingDebt = Math.max(
      0,
      totalAmount - paidMonths * monthlyPayment,
    );
    const nextPaymentDate = new Date(startDate);
    if (paidMonths >= months || remainingDebt <= 0) {
      return {
        remainingDebt: 0,
        nextPaymentDate: null,
        status: CreditStatus.PAID,
      };
    }
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + paidMonths + 1);
    return {
      remainingDebt,
      nextPaymentDate,
      status: CreditStatus.ACTIVE,
    };
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.credit.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Credit not found');
    return item;
  }
}
