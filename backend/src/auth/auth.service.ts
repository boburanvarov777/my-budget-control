import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  validateTelegramInitData,
  phonesMatch,
  usernamesMatch,
} from './telegram.util';
import { UserRole } from '@prisma/client';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private telegram: TelegramService,
  ) {}

  private getConfig() {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const allowedPhone = this.config.get<string>('ALLOWED_PHONE');
    const allowedUsername = this.config.get<string>('ALLOWED_USERNAME');

    if (!botToken || !allowedPhone || !allowedUsername) {
      throw new UnauthorizedException('Server auth not configured');
    }

    return { botToken, allowedPhone, allowedUsername };
  }

  private validateSession(initData: string, username?: string) {
    const { botToken, allowedUsername } = this.getConfig();
    const tgUser = validateTelegramInitData(initData, botToken);
    if (!tgUser) {
      throw new UnauthorizedException('Telegram sessiyasi yaroqsiz');
    }
    const resolvedUsername = username ?? tgUser.username;
    if (!usernamesMatch(resolvedUsername, allowedUsername)) {
      throw new ForbiddenException(
        'Ruxsat berilmagan. Bu ilova faqat egasi uchun.',
      );
    }
    return { tgUser, username: resolvedUsername };
  }

  async handleStart(
    telegramId: number,
    username: string | undefined,
    firstName?: string,
  ) {
    const { allowedUsername } = this.getConfig();
    const tgId = String(telegramId);
    const name = firstName ?? 'Bobur';

    const existing = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
    if (existing) {
      const baseUrl =
        this.config.get<string>('WEBAPP_URL') ??
        'https://budget-app-production-c406.up.railway.app';
      const appUrl = `${baseUrl.replace(/\/$/, '')}/dashboard`;

      await this.telegram.sendMessageWithWebApp(
        telegramId,
        `Salom ${name} 👋\n\nSiz allaqachon ro'yxatdan o'tgansiz. Ilovani oching.`,
        'Ilovani oching',
        appUrl,
      );
      return;
    }

    if (!usernamesMatch(username, allowedUsername)) {
      await this.telegram.sendMessage(
        telegramId,
        `Salom 👋\n\n` +
          `❌ Siz bu user emassiz. Bu bot faqat @${allowedUsername} uchun.\n\n` +
          `O'zingizning Telegram akkauntingizdan foydalaning.`,
      );
      return;
    }

    await this.telegram.sendContactRequest(
      telegramId,
      `Salom ${name} 👋\n\n` +
        `Budget Control — shaxsiy moliyaviy boshqaruv ilovasi.\n\n` +
        `📱 Pastdagi tugmani bosing va faqat o'z raqamingizni yuboring.\n\n` +
        `Raqamni chatga yozmang yoki boshqasining raqamini yubormang.`,
    );
  }

  async handleBotContact(
    telegramId: number,
    username: string | undefined,
    phone: string,
    contactUserId: number | undefined,
    firstName?: string,
  ) {
    const { allowedPhone, allowedUsername } = this.getConfig();
    const tgId = String(telegramId);

    if (contactUserId != null && contactUserId !== telegramId) {
      await this.telegram.removeKeyboard(telegramId);
      await this.telegram.sendMessage(
        telegramId,
        "❌ Bu sizning raqamingiz emas.\n\n" +
          "Boshqa odamning raqamini yubormang. O'zingizning raqamingizni faqat tugma orqali yuboring.",
      );
      return;
    }

    if (!usernamesMatch(username, allowedUsername)) {
      await this.telegram.removeKeyboard(telegramId);
      await this.telegram.sendMessage(
        telegramId,
        `❌ Siz bu user emassiz. Bu bot faqat @${allowedUsername} uchun.\n\n` +
          `O'zingizning Telegram akkauntingizdan kirishingiz kerak.`,
      );
      return;
    }

    const existing = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
    if (existing) {
      await this.telegram.removeKeyboard(telegramId);
      await this.telegram.sendMessage(
        telegramId,
        "✅ Siz allaqachon ro'yxatdan o'tgansiz. Pastdagi \"Ilovani oching\" tugmasini bosing.",
      );
      return;
    }

    if (!phonesMatch(phone, allowedPhone)) {
      await this.telegram.removeKeyboard(telegramId);
      await this.telegram.sendMessage(
        telegramId,
        "❌ Noto'g'ri raqam.\n\n" +
          "Faqat o'z Telegram raqamingizni yuboring — nusxa ko'chirish yoki qo'lda yozish ishlamaydi.",
      );
      return;
    }

    await this.telegram.removeKeyboard(telegramId);

    await this.prisma.user.create({
      data: {
        telegramId: tgId,
        username: username ?? null,
        phone,
        firstName: firstName ?? null,
        role: UserRole.USER,
      },
    });

    const baseUrl =
      this.config.get<string>('WEBAPP_URL') ??
      'https://budget-app-production-c406.up.railway.app';
    const appUrl = `${baseUrl.replace(/\/$/, '')}/dashboard`;

    await this.telegram.sendMessageWithWebApp(
      telegramId,
      "✅ Ro'yxatdan o'tdingiz!\n\nEndi ilovani oching va ma'lumotlaringizni qo'shing.",
      'Ilovani oching',
      appUrl,
    );
  }

  async handleManualPhoneAttempt(telegramId: number) {
    await this.telegram.sendMessage(
      telegramId,
      "❌ Raqamni chatga yozmang.\n\n" +
        "/start buyrug'ini yuboring va faqat \"📱 Raqamni yuborish\" tugmasi orqali o'z raqamingizni yuboring.",
    );
  }

  async miniAppLogin(initData: string, username?: string) {
    const { tgUser, username: resolvedUsername } = this.validateSession(
      initData,
      username,
    );
    const telegramId = String(tgUser.id);

    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      throw new UnauthorizedException(
        "Avval botda /start yuboring va raqamingizni tasdiqlang.",
      );
    }

    const token = this.jwt.sign({
      sub: user.id,
      telegramId: user.telegramId,
      role: user.role,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
