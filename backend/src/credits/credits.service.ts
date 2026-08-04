import { Injectable, NotFoundException } from '@nestjs/common';
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
    const nextPayment = new Date(start);
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    return this.prisma.credit.create({
      data: {
        userId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        downPayment: dto.downPayment ?? 0,
        interestRate: dto.interestRate ?? 0,
        months: dto.months,
        startDate: start,
        monthlyPayment: dto.monthlyPayment,
        remainingDebt: dto.totalAmount,
        nextPaymentDate: nextPayment,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCreditDto) {
    await this.ensureOwned(userId, id);
    return this.prisma.credit.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.remainingDebt != null
          ? { remainingDebt: dto.remainingDebt }
          : {}),
        ...(dto.nextPaymentDate
          ? { nextPaymentDate: new Date(dto.nextPaymentDate) }
          : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.credit.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.credit.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Credit not found');
  }
}
