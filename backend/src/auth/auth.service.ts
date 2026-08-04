import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BeginRegistrationDto } from './dto/auth-telegram.dto';
import {
  validateTelegramInitData,
  phonesMatch,
  usernamesMatch,
  normalizePhone,
} from './telegram.util';
import { Prisma, UserRole } from '@prisma/client';
import {
  CONTACT_BUTTON_TEXT,
  TelegramService,
} from '../telegram/telegram.service';

/** What the Mini App gets back when it asks to start registration. */
export interface BeginRegistrationResult {
  /** true when this Telegram account already has an account in our database. */
  alreadyRegistered: boolean;
  /** true when the contact keyboard is now waiting in the bot chat. */
  contactRequestSent: boolean;
  /** Bot the Mini App must open — never inferred from initDataUnsafe. */
  botUsername: string;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private telegram: TelegramService,
  ) {}

  private getBotToken(): string {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Server auth not configured');
    }
    return botToken;
  }

  private getOwnerConfig() {
    return {
      ownerPhone: this.config.get<string>('ALLOWED_PHONE'),
      ownerUsername: this.config.get<string>('ALLOWED_USERNAME'),
      ownerTelegramId: this.config.get<string>('ALLOWED_TELEGRAM_ID'),
    };
  }

  private validateInitData(initData: string) {
    const tgUser = validateTelegramInitData(initData, this.getBotToken());
    if (!tgUser) {
      throw new UnauthorizedException('Telegram sessiyasi yaroqsiz');
    }
    return tgUser;
  }

  private dashboardUrl(): string {
    const baseUrl =
      this.config.get<string>('WEBAPP_URL') ??
      'https://budget-app-production-c406.up.railway.app';
    return `${baseUrl.replace(/\/$/, '')}/dashboard`;
  }

  async handleStart(telegramId: number, firstName?: string) {
    const tgId = String(telegramId);
    const existing = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    });
    const name = firstName ?? "do'st";

    if (existing) {
      await this.telegram.sendMessageWithWebApp(
        telegramId,
        `Salom ${name} 👋\n\nSiz allaqachon ro'yxatdan o'tgansiz.\n\nIlovani ochish uchun pastdagi tugmani bosing.`,
        'Ilovani oching',
        this.dashboardUrl(),
      );
      return;
    }

    await this.telegram.sendContactRequest(
      telegramId,
      `Salom ${name} 👋\n\nBudget Control — shaxsiy moliyaviy boshqaruv ilovasi.\n\n` +
        `📱 Ro'yxatdan o'tish uchun pastdagi tugmani bosing va faqat o'z raqamingizni yuboring.\n\n` +
        `Raqamni qo'lda yozish yoki boshqasining kontaktini yuborish mumkin emas.`,
    );
  }

  /**
   * Step 1 of registration, called from the Mini App.
   *
   * We never accept a phone number from the client. All this does is put the
   * native "share contact" keyboard in the bot chat; the actual account is
   * created in handleBotContact() once Telegram itself vouches for the number.
   */
  async beginRegistration(
    dto: BeginRegistrationDto,
  ): Promise<BeginRegistrationResult> {
    const tgUser = this.validateInitData(dto.initData);
    const telegramId = tgUser.id;
    const tgId = String(telegramId);

    const botUsername = await this.telegram.getBotUsername();

    const existing = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    });
    if (existing) {
      return {
        alreadyRegistered: true,
        contactRequestSent: false,
        botUsername,
        message: "Siz allaqachon ro'yxatdan o'tgansiz.",
      };
    }

    const contactRequestSent = await this.telegram.sendContactRequest(
      telegramId,
      `📱 Ro'yxatdan o'tish uchun pastdagi "${CONTACT_BUTTON_TEXT}" tugmasini bosing.\n\n` +
        `Raqamni qo'lda yozmang — faqat tugma orqali yuboring.`,
    );

    // The bot cannot write first: if the user opened the Mini App from a link
    // without ever pressing /start, sendMessage fails and closing the app would
    // leave them staring at an empty chat. Tell the client so it can react.
    return {
      alreadyRegistered: false,
      contactRequestSent,
      botUsername,
      message: contactRequestSent
        ? `Botga qayting va "${CONTACT_BUTTON_TEXT}" tugmasini bosing.`
        : `Avval @${botUsername} botiga kiring va /start bosing.`,
    };
  }

  /**
   * Step 2 of registration: Telegram delivered a contact card to the bot.
   *
   * This is the only place a user row is ever created. Telegram guarantees
   * contact.user_id is the real owner of the number, so a forwarded or
   * hand-typed contact can never pass this check.
   */
  async handleBotContact(
    fromTelegramId: number,
    username: string | undefined,
    phone: string,
    contactUserId: number | undefined,
    firstName?: string,
  ): Promise<void> {
    const tgId = String(fromTelegramId);

    if (contactUserId == null || contactUserId !== fromTelegramId) {
      await this.telegram.removeKeyboard(fromTelegramId);
      await this.telegram.sendMessage(
        fromTelegramId,
        "❌ Bu sizning raqamingiz emas.\n\nFaqat o'z Telegram kontaktingizni yuboring — " +
          'boshqasining kontaktini forward qilish ishlamaydi.',
      );
      return;
    }

    const existing = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    });
    if (existing) {
      await this.telegram.removeKeyboard(fromTelegramId);
      await this.telegram.sendMessageWithWebApp(
        fromTelegramId,
        "✅ Siz allaqachon ro'yxatdan o'tgansiz.\n\nIlovani ochish uchun pastdagi tugmani bosing.",
        'Ilovani oching',
        this.dashboardUrl(),
      );
      return;
    }

    const result = await this.registerUser({
      telegramId: tgId,
      username,
      phone,
      firstName,
    });

    await this.telegram.removeKeyboard(fromTelegramId);

    if (!result.ok) {
      this.logger.warn(
        `Registration refused for telegramId=${tgId}: ${result.reason}`,
      );
      await this.telegram.sendMessage(fromTelegramId, result.message);
      return;
    }

    this.logger.log(
      `Registered telegramId=${tgId} username=${username ?? '-'}`,
    );
    await this.telegram.sendMessageWithWebApp(
      fromTelegramId,
      "✅ Ro'yxatdan o'tdingiz!\n\nEndi ilovani oching va ma'lumotlaringizni kirita boshlang.",
      'Ilovani oching',
      this.dashboardUrl(),
    );
  }

  /**
   * Is this Telegram account the owner of the app?
   * Any one of the three configured identifiers matching is enough, so a
   * changed username or a re-installed account never locks the owner out.
   */
  private isOwnerAccount(params: {
    telegramId: string;
    username?: string | null;
    phone: string;
  }): boolean {
    const { ownerPhone, ownerUsername, ownerTelegramId } =
      this.getOwnerConfig();
    return (
      (!!ownerTelegramId && params.telegramId === ownerTelegramId) ||
      (!!ownerUsername && usernamesMatch(params.username, ownerUsername)) ||
      (!!ownerPhone && phonesMatch(params.phone, ownerPhone))
    );
  }

  /**
   * By default the app is private: only the owner configured through
   * ALLOWED_PHONE / ALLOWED_USERNAME / ALLOWED_TELEGRAM_ID may register.
   * Set REGISTRATION_MODE=public to open it up to everyone.
   */
  private isPublicRegistration(): boolean {
    const mode = this.config.get<string>('REGISTRATION_MODE');
    if (mode) return mode.trim().toLowerCase() === 'public';

    const { ownerPhone, ownerUsername, ownerTelegramId } =
      this.getOwnerConfig();
    const hasOwnerConfig = !!(ownerPhone || ownerUsername || ownerTelegramId);
    // No owner configured at all => nobody could ever register; stay open.
    return !hasOwnerConfig;
  }

  private async registerUser(params: {
    telegramId: string;
    username?: string | null;
    phone: string;
    firstName?: string | null;
  }): Promise<{ ok: true } | { ok: false; message: string; reason: string }> {
    const isOwner = this.isOwnerAccount(params);

    if (!isOwner && !this.isPublicRegistration()) {
      return {
        ok: false,
        reason: 'not owner and registration is owner-only',
        message:
          "❌ Bu ilova shaxsiy — ro'yxatdan o'tish yopiq.\n\n" +
          "Kirish kerak bo'lsa ilova egasiga murojaat qiling.",
      };
    }

    const { ownerPhone } = this.getOwnerConfig();
    // Somebody else sending the owner's number: refuse rather than hand out
    // an ADMIN account to a stranger.
    if (!isOwner && ownerPhone && phonesMatch(params.phone, ownerPhone)) {
      return {
        ok: false,
        reason: "phone matches owner but account doesn't",
        message:
          "❌ Bu raqam sizniki emas.\n\nO'zingizning raqamingizni yuboring.",
      };
    }

    const normalizedPhone = normalizePhone(params.phone);

    const phoneTaken = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        telegramId: { not: params.telegramId },
      },
      select: { id: true },
    });
    if (phoneTaken) {
      return {
        ok: false,
        reason: 'phone already linked to another account',
        message:
          "❌ Bu raqam boshqa akkauntga bog'langan.\n\n" +
          "O'zingizning raqamingizni yuboring.",
      };
    }

    try {
      await this.prisma.user.create({
        data: {
          telegramId: params.telegramId,
          username: params.username ?? null,
          phone: normalizedPhone,
          firstName: params.firstName ?? null,
          role: isOwner ? UserRole.ADMIN : UserRole.USER,
        },
      });
    } catch (err) {
      // Two contact messages can land at once; the unique index on telegramId
      // makes the second one a no-op instead of a crash.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return { ok: true };
      }
      throw err;
    }

    return { ok: true };
  }

  async handleManualPhoneAttempt(telegramId: number) {
    await this.telegram.sendMessage(
      telegramId,
      "❌ Raqamni qo'lda yozmang.\n\n/start bosib, faqat tugma orqali o'z kontactingizni yuboring.",
    );
  }

  async miniAppLogin(initData: string) {
    const tgUser = this.validateInitData(initData);
    const telegramId = String(tgUser.id);

    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      throw new UnauthorizedException("Avval ro'yxatdan o'ting.");
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
