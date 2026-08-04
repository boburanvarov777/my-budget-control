import {
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Token-protected maintenance API for Railway shell-less ops (list/delete users).
 * Set MAINTENANCE_KEY on Railway and pass it as X-Maintenance-Key header.
 */
@Controller('internal/maintenance')
export class MaintenanceController {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private assertKey(header?: string) {
    const expected = this.config.get<string>('MAINTENANCE_KEY');
    if (!expected || header !== expected) {
      throw new UnauthorizedException();
    }
  }

  @Get('users')
  async listUsers(@Headers('x-maintenance-key') key?: string) {
    this.assertKey(key);
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            incomes: true,
            expenses: true,
            credits: true,
            microLoans: true,
            installments: true,
            goals: true,
            savings: true,
            budgetPlans: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return users;
  }

  @Delete('users/:query')
  async deleteUser(
    @Headers('x-maintenance-key') key: string | undefined,
    @Param('query') query: string,
  ) {
    this.assertKey(key);
    const digits = query.replace(/\D/g, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: query, mode: 'insensitive' } },
          { firstName: { equals: query, mode: 'insensitive' } },
          { telegramId: query },
          ...(digits ? [{ phone: { contains: digits } }] : []),
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        telegramId: true,
        _count: {
          select: {
            incomes: true,
            expenses: true,
            credits: true,
            microLoans: true,
            installments: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    await this.prisma.user.delete({ where: { id: user.id } });
    return { deleted: true, user };
  }
}
