import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMicroLoanDto, UpdateMicroLoanDto } from './dto/micro-loan.dto';

@Injectable()
export class MicroLoansService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.microLoan.findMany({
      where: { userId, isPaid: false },
      orderBy: { dueDate: 'asc' },
    });
  }

  create(userId: string, dto: CreateMicroLoanDto) {
    return this.prisma.microLoan.create({
      data: {
        userId,
        provider: dto.provider,
        amount: dto.amount,
        takenDate: new Date(dto.takenDate),
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateMicroLoanDto) {
    await this.ensureOwned(userId, id);
    return this.prisma.microLoan.update({
      where: { id },
      data: { ...(dto.isPaid != null ? { isPaid: dto.isPaid } : {}) },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.microLoan.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.microLoan.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Micro loan not found');
  }
}
