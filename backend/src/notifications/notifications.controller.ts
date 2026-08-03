import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: User) {
    return this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  }
}
