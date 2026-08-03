import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthTelegramDto } from './dto/auth-telegram.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  authenticate(@Body() dto: AuthTelegramDto) {
    return this.authService.authenticateWithTelegram(dto);
  }
}
