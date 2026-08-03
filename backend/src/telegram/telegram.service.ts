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

  async sendMessage(chatId: string | number, text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set');
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
      const data = (await res.json()) as { ok?: boolean; description?: string };
      if (!data.ok) {
        this.logger.error(`Telegram API error: ${data.description ?? res.status}`);
      }
    } catch (err) {
      this.logger.error('Failed to send Telegram message', err);
    }
  }

  async sendMessageWithWebApp(
    chatId: string | number,
    text: string,
    buttonText: string,
    webAppUrl: string,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: {
            inline_keyboard: [
              [{ text: buttonText, web_app: { url: webAppUrl } }],
            ],
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; description?: string };
      if (!data.ok) {
        this.logger.error(`Telegram web_app button error: ${data.description}`);
      }
    } catch (err) {
      this.logger.error('Failed to send web app button', err);
    }
  }

  async setupBot(appUrl: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    const base = appUrl.replace(/\/$/, '');
    const webAppUrl = `${base}/auth`;
    const webhookUrl = `${base}/api/telegram/webhook`;

    try {
      await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: "Ro'yxatdan o'ting",
            web_app: { url: webAppUrl },
          },
        }),
      });

      await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
          drop_pending_updates: true,
        }),
      });

      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [{ command: 'start', description: "Ro'yxatdan o'tish" }],
        }),
      });

      this.logger.log(`Bot configured: webapp=${webAppUrl} webhook=${webhookUrl}`);
    } catch (err) {
      this.logger.error('Bot setup failed', err);
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
