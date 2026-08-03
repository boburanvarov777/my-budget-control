import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from '../auth/auth.service';
import { looksLikePhone } from '../auth/telegram.util';

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
        message.contact.user_id,
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
      await this.auth.handleStart(
        chatId,
        message.from?.username,
        message.from?.first_name,
      );
      return { ok: true };
    }

    if (looksLikePhone(text)) {
      this.logger.log(`Manual phone attempt from chat ${chatId}`);
      await this.auth.handleManualPhoneAttempt(chatId);
    }

    return { ok: true };
  }
}
