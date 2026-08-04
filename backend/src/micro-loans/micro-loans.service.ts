import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMicroLoanDto, UpdateMicroLoanDto } from './dto/micro-loan.dto';

@Injectable()
export class MicroLoansService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.microLoan.findMany({
      where: { userId },
      orderBy: [{ isPaid: 'asc' }, { dueDate: 'asc' }],
    });
  }

  create(userId: string, dto: CreateMicroLoanDto) {
    const taken = new Date(dto.takenDate);
    const due = dto.dueDate
      ? new Date(dto.dueDate)
      : (() => {
          const next = new Date(taken);
          next.setMonth(next.getMonth() + 1);
          return next;
        })();

    return this.prisma.microLoan.create({
      data: {
        userId,
        provider: dto.provider,
        amount: dto.amount,
        takenDate: taken,
        dueDate: due,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateMicroLoanDto) {
    await this.ensureOwned(userId, id);
    return this.prisma.microLoan.update({
      where: { id },
      data: {
        ...(dto.provider != null ? { provider: dto.provider } : {}),
        ...(dto.amount != null ? { amount: dto.amount } : {}),
        ...(dto.takenDate != null
          ? { takenDate: new Date(dto.takenDate) }
          : {}),
        ...(dto.dueDate != null ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.isPaid != null ? { isPaid: dto.isPaid } : {}),
      },
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
