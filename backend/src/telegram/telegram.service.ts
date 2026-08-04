import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  deriveWebhookSecret,
  isValidWebhookSecret,
} from './webhook-secret.util';

/** Text of the reply-keyboard button the user taps in the bot chat to register. */
export const CONTACT_BUTTON_TEXT = '📱 Raqamni yuborish';

interface TelegramApiResponse<T = unknown> {
  ok?: boolean;
  description?: string;
  error_code?: number;
  result?: T;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  /** Cached result of getMe so we don't hit the API on every request. */
  private botUsernameCache: string | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private get token(): string | undefined {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  /**
   * Single entry point for the Bot API. Every caller gets a typed result and a
   * logged failure instead of a silently swallowed promise.
   */
  private async call<T>(
    method: string,
    payload: Record<string, unknown>,
  ): Promise<TelegramApiResponse<T>> {
    const token = this.token;
    if (!token) {
      this.logger.warn(`TELEGRAM_BOT_TOKEN not set — skipping ${method}`);
      return { ok: false, description: 'TELEGRAM_BOT_TOKEN not set' };
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/${method}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as TelegramApiResponse<T>;
      if (!data.ok) {
        this.logger.error(
          `Telegram ${method} failed: ${data.description ?? res.status}`,
        );
      }
      return data;
    } catch (err) {
      this.logger.error(`Telegram ${method} request threw`, err);
      return { ok: false, description: 'Network error' };
    }
  }

  /** Shared secret Telegram echoes back in X-Telegram-Bot-Api-Secret-Token. */
  private get webhookSecret(): string | null {
    return deriveWebhookSecret(this.token ?? '');
  }

  isValidWebhookSecret(received?: string): boolean {
    return isValidWebhookSecret(this.token, received);
  }

  /** Bot username without the leading @, e.g. "myBudgetControl_bot". */
  async getBotUsername(): Promise<string> {
    const configured = this.config.get<string>('TELEGRAM_BOT_USERNAME');
    if (configured) return configured.replace(/^@/, '');

    if (this.botUsernameCache) return this.botUsernameCache;

    const res = await this.call<{ username?: string }>('getMe', {});
    const username = res.result?.username;
    if (username) {
      this.botUsernameCache = username;
      return username;
    }
    return 'myBudgetControl_bot';
  }

  async sendMessage(chatId: string | number, text: string): Promise<boolean> {
    // Deliberately no parse_mode: these messages carry user-supplied text
    // (loan provider names, notes) and HTML parsing would reject a stray "<".
    const res = await this.call('sendMessage', { chat_id: chatId, text });
    return res.ok === true;
  }

  async sendMessageWithWebApp(
    chatId: string | number,
    text: string,
    buttonText: string,
    webAppUrl: string,
  ): Promise<boolean> {
    const res = await this.call('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl } }]],
      },
    });
    return res.ok === true;
  }

  /**
   * Shows the native "share my contact" reply keyboard in the bot chat.
   * Returns false when the bot cannot message the user (they never pressed
   * /start, or they blocked the bot) so callers can tell them what to do.
   */
  async sendContactRequest(
    chatId: string | number,
    text: string,
  ): Promise<boolean> {
    const res = await this.call('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: {
        keyboard: [[{ text: CONTACT_BUTTON_TEXT, request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: false,
        input_field_placeholder: "Raqamni qo'lda yozmang",
      },
    });
    return res.ok === true;
  }

  /**
   * Hides the contact keyboard. Telegram has no dedicated method for this, so
   * we send a throwaway message carrying remove_keyboard and delete it again —
   * otherwise the chat is left with a stray blank message.
   */
  async removeKeyboard(chatId: string | number): Promise<void> {
    const res = await this.call<{ message_id: number }>('sendMessage', {
      chat_id: chatId,
      text: '⌛',
      reply_markup: { remove_keyboard: true },
    });

    const messageId = res.result?.message_id;
    if (messageId != null) {
      await this.call('deleteMessage', {
        chat_id: chatId,
        message_id: messageId,
      });
    }
  }

  async setupBot(appUrl: string): Promise<void> {
    if (!this.token) return;

    const base = appUrl.replace(/\/$/, '');
    const webAppUrl = `${base}/auth`;
    const webhookUrl = `${base}/api/telegram/webhook`;

    await this.call('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Ilovani oching',
        web_app: { url: webAppUrl },
      },
    });

    await this.call('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message'],
      // Old pending updates are dropped so a restart never replays a stale
      // contact message and re-registers somebody.
      drop_pending_updates: true,
      // Telegram sends this back on every call so we can reject forged updates.
      secret_token: this.webhookSecret,
    });

    await this.call('setMyCommands', {
      commands: [{ command: 'start', description: "Ro'yxatdan o'tish" }],
    });

    const username = await this.getBotUsername();
    this.logger.log(
      `Bot @${username} configured: webapp=${webAppUrl} webhook=${webhookUrl}`,
    );
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
        daysLeft <= 0
          ? 'BUGUN'
          : daysLeft === 1
            ? 'ERTAGA'
            : `${daysLeft} kun qoldi`;

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
