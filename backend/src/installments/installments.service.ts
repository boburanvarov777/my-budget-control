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
    const paidMonths = Math.min(
      dto.totalMonths,
      Math.max(0, dto.paidMonths ?? 0),
    );
    const nextPaymentDate = this.nextPaymentDate(start, paidMonths, dto.totalMonths);

    return this.prisma.installment.create({
      data: {
        userId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        downPayment: dto.downPayment ?? 0,
        monthlyPayment: dto.monthlyPayment,
        totalMonths: dto.totalMonths,
        paidMonths,
        startDate: start,
        nextPaymentDate,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateInstallmentDto) {
    const existing = await this.ensureOwned(userId, id);

    const totalMonths = dto.totalMonths ?? existing.totalMonths;
    const paidMonths = Math.min(
      totalMonths,
      Math.max(0, dto.paidMonths ?? existing.paidMonths),
    );
    const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const nextPaymentDate = this.nextPaymentDate(start, paidMonths, totalMonths);

    return this.prisma.installment.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.totalAmount != null ? { totalAmount: dto.totalAmount } : {}),
        ...(dto.downPayment != null ? { downPayment: dto.downPayment } : {}),
        ...(dto.monthlyPayment != null ? { monthlyPayment: dto.monthlyPayment } : {}),
        ...(dto.totalMonths != null ? { totalMonths: dto.totalMonths } : {}),
        ...(dto.startDate != null ? { startDate: start } : {}),
        paidMonths,
        nextPaymentDate,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.installment.delete({ where: { id } });
  }

  private nextPaymentDate(start: Date, paidMonths: number, totalMonths: number) {
    if (paidMonths >= totalMonths) return null;
    const next = new Date(start);
    next.setMonth(next.getMonth() + paidMonths + 1);
    return next;
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.installment.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Installment not found');
    return item;
  }
}
