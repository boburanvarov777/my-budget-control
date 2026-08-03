import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RequestCodeDto, VerifyCodeDto } from './dto/auth-telegram.dto';
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

  private validateTelegramUser(dto: RequestCodeDto | VerifyCodeDto) {
    const { botToken, allowedPhone, allowedUsername } = this.getConfig();

    const tgUser = validateTelegramInitData(dto.initData, botToken);
    if (!tgUser) {
      throw new UnauthorizedException('Telegram sessiyasi yaroqsiz');
    }

    const username = dto.username ?? tgUser.username;
    if (!usernamesMatch(username, allowedUsername)) {
      throw new ForbiddenException(
        'Ruxsat berilmagan. Bu ilova faqat egasi uchun.',
      );
    }

    if (!phonesMatch(dto.phone, allowedPhone)) {
      throw new ForbiddenException(
        "O'zingizning raqamingizni yuboring. Boshqa raqam yoki nusxa ko'chirish ishlamaydi — faqat Telegram orqali o'z raqamingizni ulashing.",
      );
    }

    return { tgUser, username, allowedPhone };
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
    await this.telegram.sendMessage(telegramId, message);

    return {
      success: true,
      message: `Tasdiqlash kodi ${channel} kanaliga va Telegram xabaringizga yuborildi. Kodni shu yerdan oling.`,
      expiresInSeconds: 300,
    };
  }

  async verifyCodeAndLogin(dto: VerifyCodeDto) {
    const { tgUser, username } = this.validateTelegramUser(dto);
    const telegramId = String(tgUser.id);

    const record = await this.prisma.verificationCode.findFirst({
      where: {
        telegramId,
        phone: dto.phone,
        code: dto.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException(
        'Kod noto\'g\'ri yoki muddati tugagan. @VerificationCodes dan yangi kod oling.',
      );
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: username ?? null,
        phone: dto.phone,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        role: UserRole.USER,
      },
      update: {
        username: username ?? null,
        phone: dto.phone,
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
