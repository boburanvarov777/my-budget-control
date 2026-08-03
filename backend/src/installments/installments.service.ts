import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInstallmentDto,
  UpdateInstallmentDto,
} from './dto/installment.dto';

@Injectable()
export class InstallmentsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.installment.findMany({
      where: { userId },
      orderBy: { nextPaymentDate: 'asc' },
    });
  }

  create(userId: string, dto: CreateInstallmentDto) {
    const start = new Date(dto.startDate);
    const next = new Date(start);
    next.setMonth(next.getMonth() + 1);

    return this.prisma.installment.create({
      data: {
        userId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        monthlyPayment: dto.monthlyPayment,
        totalMonths: dto.totalMonths,
        startDate: start,
        nextPaymentDate: next,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateInstallmentDto) {
    await this.ensureOwned(userId, id);
    const item = await this.prisma.installment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();

    const paidMonths = dto.paidMonths ?? item.paidMonths;
    const next = new Date(item.startDate);
    next.setMonth(next.getMonth() + paidMonths + 1);

    return this.prisma.installment.update({
      where: { id },
      data: {
        paidMonths,
        nextPaymentDate: paidMonths >= item.totalMonths ? null : next,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.installment.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.installment.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Installment not found');
  }
}
