import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { AuthService } from '../auth/auth.service';

interface TelegramUpdate {
  message?: {
    chat: { id: number; type?: string };
    text?: string;
    contact?: {
      phone_number: string;
      user_id?: number;
      first_name?: string;
    };
    from?: {
      id: number;
      is_bot?: boolean;
      first_name?: string;
      username?: string;
    };
  };
}

/** Looks like a phone number typed by hand into the chat. */
const MANUAL_PHONE_PATTERN = /^\+?\d[\d\s\-()]{7,}$/;

@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name);

  constructor(
    private telegram: TelegramService,
    private auth: AuthService,
  ) {}

  /**
   * Telegram webhook.
   *
   * Always answers 200: any non-2xx makes Telegram retry the same update in a
   * loop, which previously meant one thrown error could replay a registration
   * over and over.
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    // The endpoint is public, so without this check anyone who knows the URL
    // could POST a forged "contact" update and register arbitrary accounts.
    if (!this.telegram.isValidWebhookSecret(secretToken)) {
      this.logger.warn('Rejected webhook call with invalid secret token');
      throw new ForbiddenException();
    }

    try {
      await this.handleUpdate(update);
    } catch (err) {
      this.logger.error('Failed to handle Telegram update', err);
    }
    return { ok: true };
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;
    if (!message?.from?.id || message.from.is_bot) return;

    // Registration is a 1:1 conversation. In a group chat, chat.id is the
    // group and would be mistaken for the user's Telegram id.
    if (message.chat?.type && message.chat.type !== 'private') return;

    const userId = message.from.id;

    if (message.contact?.phone_number) {
      this.logger.log(`Contact received from user ${userId}`);
      await this.auth.handleBotContact(
        userId,
        message.from.username,
        message.contact.phone_number,
        message.contact.user_id,
        message.from.first_name,
      );
      return;
    }

    const text = message.text?.trim();
    if (!text) return;

    if (text === '/start' || text.startsWith('/start ')) {
      this.logger.log(`/start from user ${userId}`);
      await this.auth.handleStart(userId, message.from.first_name);
      return;
    }

    if (MANUAL_PHONE_PATTERN.test(text)) {
      await this.auth.handleManualPhoneAttempt(userId);
    }
  }
}
