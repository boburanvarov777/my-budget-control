import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BeginRegistrationDto, CompleteRegistrationDto } from './dto/auth-telegram.dto';
import {
  validateTelegramInitData,
  phonesMatch,
  usernamesMatch,
  normalizePhone,
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

  async handleStart(
    telegramId: number,
    username?: string,
    firstName?: string,
  ) {
    const tgId = String(telegramId);
    const existing = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    });
    const name = firstName ?? 'do\'st';

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

  async beginRegistration(dto: BeginRegistrationDto) {
    const tgUser = this.validateInitData(dto.initData);
    const telegramId = tgUser.id;
    const tgId = String(telegramId);

    const existing = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    });
    if (existing) {
      return {
        success: true,
        message: "Siz allaqachon ro'yxatdan o'tgansiz.",
      };
    }

    await this.telegram.sendContactRequest(
      telegramId,
      "📱 Ro'yxatdan o'tish uchun pastdagi tugmani bosing va o'z raqamingizni yuboring.\n\nRaqamni qo'lda yozmang — faqat tugma orqali.",
    );

    return {
      success: true,
      message: "Botga qayting va raqamingizni yuboring.",
    };
  }

  async handleBotContact(
    fromTelegramId: number,
    username: string | undefined,
    phone: string,
    contactUserId: number | undefined,
    firstName?: string,
  ) {
    const tgId = String(fromTelegramId);

    if (contactUserId == null || contactUserId !== fromTelegramId) {
      await this.telegram.removeKeyboard(fromTelegramId);
      await this.telegram.sendMessage(
        fromTelegramId,
        "❌ Bu sizning raqamingiz emas.\n\nFaqat o'z Telegram kontactingizni yuboring — boshqasining raqamini forward qilish ishlamaydi.",
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
      await this.telegram.sendMessage(fromTelegramId, result.message);
      return;
    }

    await this.telegram.sendMessageWithWebApp(
      fromTelegramId,
      "✅ Ro'yxatdan o'tdingiz!\n\nEndi ilovani oching va ma'lumotlaringizni kirita boshlang.",
      'Ilovani oching',
      this.dashboardUrl(),
    );
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const tgUser = this.validateInitData(dto.initData);
    const tgId = String(tgUser.id);

    const existing = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
    if (existing) {
      return this.miniAppLogin(dto.initData);
    }

    const result = await this.registerUser({
      telegramId: tgId,
      username: tgUser.username,
      phone: dto.phone,
      firstName: tgUser.first_name,
    });

    if (!result.ok) {
      throw new UnauthorizedException(result.message);
    }

    return this.miniAppLogin(dto.initData);
  }

  private async registerUser(params: {
    telegramId: string;
    username?: string | null;
    phone: string;
    firstName?: string | null;
  }): Promise<{ ok: true } | { ok: false; message: string }> {
    const { ownerPhone, ownerUsername, ownerTelegramId } = this.getOwnerConfig();

    if (ownerPhone && phonesMatch(params.phone, ownerPhone)) {
      const isOwnerTelegram =
        !!ownerTelegramId && params.telegramId === ownerTelegramId;
      const isOwnerUsername =
        !!ownerUsername && usernamesMatch(params.username, ownerUsername);
      if (!isOwnerTelegram && !isOwnerUsername) {
        return {
          ok: false,
          message:
            "❌ Sen bu foydalanuvchi emassan.\n\nO'zingning raqamingizni yubor.",
        };
      }
    }

    const normalizedPhone = normalizePhone(params.phone);

    const phoneTaken = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        telegramId: { not: params.telegramId },
      },
    });
    if (phoneTaken) {
      return {
        ok: false,
        message: "❌ Bu raqam boshqa akkauntga bog'langan.\n\nO'zingning raqamingizni yuboring.",
      };
    }

    const isOwner =
      !!ownerPhone &&
      phonesMatch(params.phone, ownerPhone) &&
      ((!!ownerTelegramId && params.telegramId === ownerTelegramId) ||
        (!!ownerUsername && usernamesMatch(params.username, ownerUsername)));

    await this.prisma.user.create({
      data: {
        telegramId: params.telegramId,
        username: params.username ?? null,
        phone: normalizedPhone,
        firstName: params.firstName ?? null,
        role: isOwner ? UserRole.ADMIN : UserRole.USER,
      },
    });

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
      throw new UnauthorizedException(
        "Avval ro'yxatdan o'ting.",
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
