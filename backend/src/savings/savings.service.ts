import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingDto } from './dto/saving.dto';

@Injectable()
export class SavingsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.saving.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async getTotal(userId: string) {
    const agg = await this.prisma.saving.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return { total: Number(agg._sum.amount ?? 0) };
  }

  create(userId: string, dto: CreateSavingDto) {
    return this.prisma.saving.create({
      data: {
        userId,
        amount: dto.amount,
        name: dto.name ?? "Jamg'arma",
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note,
      },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.saving.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Saving not found');
    return this.prisma.saving.delete({ where: { id } });
  }
}
