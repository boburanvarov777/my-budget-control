import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RequestCodeDto, VerifyCodeDto, BeginRegistrationDto } from './dto/auth-telegram.dto';
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

  private validateTelegramUser(dto: RequestCodeDto | VerifyCodeDto) {
    const { tgUser, username } = this.validateSession(dto.initData, dto.username);
    const { allowedPhone } = this.getConfig();

    if (dto.phone && !phonesMatch(dto.phone, allowedPhone)) {
      throw new ForbiddenException(
        "O'zingizning raqamingizni yuboring. Boshqa raqam yoki nusxa ko'chirish ishlamaydi.",
      );
    }

    return { tgUser, username, allowedPhone };
  }

  async beginRegistration(dto: BeginRegistrationDto) {
    const { tgUser } = this.validateSession(dto.initData);
    const telegramId = tgUser.id;

    await this.telegram.sendContactRequest(
      telegramId,
      "📱 Pastdagi tugmani bosing va o'z raqamingizni yuboring.\n\nBoshqa raqam nusxasi yoki qo'lda yozish ishlamaydi.",
    );

    return {
      success: true,
      message: "Botga qayting va raqamingizni yuboring.",
    };
  }

  async handleBotContact(
    telegramId: number,
    username: string | undefined,
    phone: string,
    firstName?: string,
  ) {
    const { allowedPhone, allowedUsername } = this.getConfig();

    if (!usernamesMatch(username, allowedUsername)) {
      await this.telegram.sendMessage(
        telegramId,
        "❌ Ruxsat berilmagan. Bu bot faqat egasi uchun.",
      );
      return;
    }

    if (!phonesMatch(phone, allowedPhone)) {
      await this.telegram.removeKeyboard(telegramId);
      await this.telegram.sendContactRequest(
        telegramId,
        "❌ Noto'g'ri raqam.\n\nFaqat o'z Telegram raqamingizni yuboring — nusxa ko'chirish yoki qo'lda yozish ishlamaydi.",
      );
      return;
    }

    await this.telegram.removeKeyboard(telegramId);

    const tgId = String(telegramId);
    await this.prisma.verificationCode.updateMany({
      where: { telegramId: tgId, used: false },
      data: { used: true },
    });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.verificationCode.create({
      data: { telegramId: tgId, phone, code, expiresAt },
    });

    const channel =
      this.config.get<string>('VERIFICATION_CODES_CHANNEL') ?? '@VerificationCodes';
    const message =
      `🔐 Budget Control tasdiqlash kodi\n\n` +
      `Kod: <b>${code}</b>\n` +
      `Raqam: ${phone}\n` +
      `Foydalanuvchi: @${username ?? 'unknown'}\n` +
      `Amal qilish: 5 daqiqa`;

    await this.telegram.sendMessage(channel, message);

    await this.telegram.sendMessage(
      telegramId,
      `✅ Tasdiqlash kodi ${channel} kanaliga yuborildi.\n\n` +
        `1. ${channel} kanalini oching\n` +
        `2. Kodni nusxalang\n` +
        `3. Shu chatga faqat 6 xonali kodni yozing`,
    );
  }

  async handleBotCodeInput(
    telegramId: number,
    username: string | undefined,
    code: string,
    firstName?: string,
  ) {
    const { allowedUsername } = this.getConfig();

    if (!usernamesMatch(username, allowedUsername)) {
      await this.telegram.sendMessage(
        telegramId,
        '❌ Ruxsat berilmagan foydalanuvchi.',
      );
      return;
    }

    const tgId = String(telegramId);
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        telegramId: tgId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      await this.telegram.sendMessage(
        telegramId,
        "❌ Kod noto'g'ri yoki muddati tugagan.\n\n@VerificationCodes kanalidan yangi kod oling.",
      );
      return;
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    await this.prisma.user.upsert({
      where: { telegramId: tgId },
      create: {
        telegramId: tgId,
        username: username ?? null,
        phone: record.phone,
        firstName: firstName ?? null,
        role: UserRole.USER,
      },
      update: {
        username: username ?? null,
        phone: record.phone,
        firstName: firstName ?? null,
      },
    });

    const baseUrl =
      this.config.get<string>('WEBAPP_URL') ??
      'https://budget-app-production-c406.up.railway.app';
    const appUrl = `${baseUrl.replace(/\/$/, '')}/dashboard`;

    await this.telegram.sendMessageWithWebApp(
      telegramId,
      '✅ Ro\'yxatdan o\'tdingiz!\n\nEndi ilovani oching.',
      'Ilovani oching',
      appUrl,
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
        "Avval bot orqali ro'yxatdan o'ting.",
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

  async requestVerificationCode(dto: RequestCodeDto) {
    const { tgUser, username } = this.validateTelegramUser(dto);
    const telegramId = String(tgUser.id);

    await this.prisma.verificationCode.updateMany({
      where: { telegramId, used: false },
      data: { used: true },
    });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.verificationCode.create({
      data: {
        telegramId,
        phone: dto.phone,
        code,
        expiresAt,
      },
    });

    const channel = this.config.get<string>('VERIFICATION_CODES_CHANNEL') ?? '@VerificationCodes';
    const message =
      `🔐 Budget Control tasdiqlash kodi\n\n` +
      `Kod: <b>${code}</b>\n` +
      `Raqam: ${dto.phone}\n` +
      `Foydalanuvchi: @${username ?? 'unknown'}\n` +
      `Amal qilish: 5 daqiqa`;

    await this.telegram.sendMessage(channel, message);

    return {
      success: true,
      message: `Tasdiqlash kodi ${channel} kanaliga yuborildi. Kodni u yerdan olib, bot chatiga yozing.`,
      expiresInSeconds: 300,
    };
  }

  async verifyCodeAndLogin(dto: VerifyCodeDto) {
    const { tgUser, username } = this.validateTelegramUser(dto);
    const telegramId = String(tgUser.id);

    const record = await this.prisma.verificationCode.findFirst({
      where: {
        telegramId,
        code: dto.code,
        used: false,
        expiresAt: { gt: new Date() },
        ...(dto.phone ? { phone: dto.phone } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException(
        'Kod noto\'g\'ri yoki muddati tugagan. @VerificationCodes dan yangi kod oling.',
      );
    }

    const phone = record.phone;

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: username ?? null,
        phone,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        role: UserRole.USER,
      },
      update: {
        username: username ?? null,
        phone,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
      },
    });

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
