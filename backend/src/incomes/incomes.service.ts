import { Injectable, NotFoundException } from '@nestjs/common';
import { Income } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/utils/decimal.util';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

function serializeIncome(row: Income) {
  return {
    ...row,
    amount: toNumber(row.amount),
  };
}

@Injectable()
export class IncomesService {
  constructor(private prisma: PrismaService) {}

  private dateFilter(month?: string, year?: string) {
    if (!month || !year) return undefined;
    const m = Number(month) - 1;
    const y = Number(year);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);
    return { gte: start, lte: end };
  }

  async findAll(userId: string, month?: string, year?: string) {
    const date = this.dateFilter(month, year);
    const rows = await this.prisma.income.findMany({
      where: { userId, ...(date ? { date } : {}) },
      orderBy: { date: 'desc' },
    });
    return rows.map(serializeIncome);
  }

  async create(userId: string, dto: CreateIncomeDto) {
    const row = await this.prisma.income.create({
      data: {
        userId,
        amount: dto.amount,
        date: new Date(dto.date),
        category: dto.category ?? 'SALARY',
        note: dto.note,
      },
    });
    return serializeIncome(row);
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto) {
    await this.ensureOwned(userId, id);
    const row = await this.prisma.income.update({
      where: { id },
      data: {
        ...(dto.amount != null ? { amount: dto.amount } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
      },
    });
    return serializeIncome(row);
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.income.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.income.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Income not found');
  }
}
