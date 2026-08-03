import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async sendMessage(chatId: string, text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
    } catch (err) {
      this.logger.error('Failed to send Telegram message', err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkDuePayments() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const loans = await this.prisma.microLoan.findMany({
      where: {
        isPaid: false,
        notified: false,
        dueDate: { lte: tomorrow, gte: today },
      },
      include: { user: true },
    });

    for (const loan of loans) {
      const daysLeft = Math.ceil(
        (loan.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const urgency =
        daysLeft <= 0 ? 'BUGUN' : daysLeft === 1 ? 'ERTAGA' : `${daysLeft} kun qoldi`;

      const message = `⚠️ ${urgency}: ${loan.provider} qarzi tugaydi\n${Number(loan.amount).toLocaleString('uz-UZ')} so'm\nTo'lashni unutmang.`;

      await this.sendMessage(loan.user.telegramId, message);
      await this.prisma.notification.create({
        data: {
          userId: loan.userId,
          title: `${loan.provider} qarzi`,
          message,
          type: 'warning',
        },
      });
      await this.prisma.microLoan.update({
        where: { id: loan.id },
        data: { notified: true },
      });
    }
  }
}
