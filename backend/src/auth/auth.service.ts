import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTelegramDto } from './dto/auth-telegram.dto';
import {
  validateTelegramInitData,
  phonesMatch,
  usernamesMatch,
} from './telegram.util';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async authenticateWithTelegram(dto: AuthTelegramDto) {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const allowedPhone = this.config.get<string>('ALLOWED_PHONE');
    const allowedUsername = this.config.get<string>('ALLOWED_USERNAME');

    if (!botToken || !allowedPhone || !allowedUsername) {
      throw new UnauthorizedException('Server auth not configured');
    }

    const tgUser = validateTelegramInitData(dto.initData, botToken);
    if (!tgUser) {
      throw new UnauthorizedException('Invalid Telegram session');
    }

    if (!phonesMatch(dto.phone, allowedPhone)) {
      throw new ForbiddenException('Ruxsat berilmagan telefon raqam');
    }

    const username = dto.username ?? tgUser.username;
    if (!usernamesMatch(username, allowedUsername)) {
      throw new ForbiddenException('Ruxsat berilmagan username');
    }

    const telegramId = String(tgUser.id);
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
