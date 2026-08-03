import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private dateFilter(month?: string, year?: string) {
    if (!month || !year) return undefined;
    const m = Number(month) - 1;
    const y = Number(year);
    return {
      gte: new Date(y, m, 1),
      lte: new Date(y, m + 1, 0, 23, 59, 59),
    };
  }

  findAll(
    userId: string,
    month?: string,
    year?: string,
    category?: string,
  ) {
    const date = this.dateFilter(month, year);
    return this.prisma.expense.findMany({
      where: {
        userId,
        ...(date ? { date } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  create(userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        userId,
        amount: dto.amount,
        date: new Date(dto.date),
        category: dto.category,
        note: dto.note,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.ensureOwned(userId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.amount != null ? { amount: dto.amount } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Expense not found');
  }
}
