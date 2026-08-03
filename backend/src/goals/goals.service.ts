import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        targetAmount: dto.targetAmount,
        savedAmount: dto.savedAmount ?? 0,
        monthlyAmount: dto.monthlyAmount ?? 0,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        icon: dto.icon,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.ensureOwned(userId, id);
    return this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.savedAmount != null ? { savedAmount: dto.savedAmount } : {}),
        ...(dto.monthlyAmount != null
          ? { monthlyAmount: dto.monthlyAmount }
          : {}),
        ...(dto.targetDate ? { targetDate: new Date(dto.targetDate) } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return this.prisma.goal.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const item = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Goal not found');
  }
}
