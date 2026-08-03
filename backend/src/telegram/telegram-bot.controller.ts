import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string; username?: string };
  };
}

@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name);

  constructor(
    private telegram: TelegramService,
    private config: ConfigService,
  ) {}

  @Post('webhook')
  async webhook(@Body() update: TelegramUpdate) {
    const message = update.message;
    if (!message?.text || !message.chat?.id) {
      return { ok: true };
    }

    const text = message.text.trim();
    const chatId = message.chat.id;
    const appUrl =
      this.config.get<string>('WEBAPP_URL') ??
      this.config.get<string>('FRONTEND_URL') ??
      'https://budget-app-production-c406.up.railway.app';

    if (text === '/start' || text.startsWith('/start ')) {
      const name = message.from?.first_name ?? 'Bobur';
      await this.telegram.sendMessageWithWebApp(
        chatId,
        `Salom ${name} 👋\n\nBudget Control — shaxsiy moliyaviy boshqaruv ilovasi.\n\nPastdagi tugmani bosing va o'z raqamingizni ulashing.`,
        '💳 Ilovani ochish',
        appUrl,
      );
    }

    return { ok: true };
  }
}
