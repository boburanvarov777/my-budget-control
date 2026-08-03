import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    contact?: {
      phone_number: string;
      user_id?: number;
      first_name?: string;
    };
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
  };
}

@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name);

  constructor(
    private telegram: TelegramService,
    private auth: AuthService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() update: TelegramUpdate) {
    const message = update.message;
    if (!message?.chat?.id) {
      return { ok: true };
    }

    const chatId = message.chat.id;

    if (message.contact?.phone_number) {
      this.logger.log(`Contact received from chat ${chatId}`);
      await this.auth.handleBotContact(
        chatId,
        message.from?.username,
        message.contact.phone_number,
        message.from?.first_name,
      );
      return { ok: true };
    }

    const text = message.text?.trim();
    if (!text) {
      return { ok: true };
    }

    if (text === '/start' || text.startsWith('/start ')) {
      this.logger.log(`/start from chat ${chatId}`);
      const name = message.from?.first_name ?? 'Bobur';
      await this.telegram.sendMessage(
        chatId,
        `Salom ${name} 👋\n\n` +
          `Budget Control — shaxsiy moliyaviy boshqaruv ilovasi.\n\n` +
          `Ro'yxatdan o'tish uchun pastdagi "Ilovani oching" tugmasini bosing.`,
      );
      return { ok: true };
    }

    if (/^\d{6}$/.test(text)) {
      this.logger.log(`Code input from chat ${chatId}`);
      await this.auth.handleBotCodeInput(
        chatId,
        message.from?.username,
        text,
        message.from?.first_name,
      );
    }

    return { ok: true };
  }
}
