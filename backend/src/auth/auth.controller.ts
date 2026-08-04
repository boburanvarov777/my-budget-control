import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BeginRegistrationDto, MiniAppLoginDto } from './dto/auth-telegram.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Mini App asks the bot to show the "share contact" keyboard.
   *
   * There is deliberately no endpoint that accepts a phone number from the
   * client: a number is only trusted when Telegram itself delivers it to the
   * bot as a verified contact (see AuthService.handleBotContact).
   */
  @Post('begin-registration')
  @HttpCode(HttpStatus.OK)
  beginRegistration(@Body() dto: BeginRegistrationDto) {
    return this.authService.beginRegistration(dto);
  }

  @Post('mini-app-login')
  @HttpCode(HttpStatus.OK)
  miniAppLogin(@Body() dto: MiniAppLoginDto) {
    return this.authService.miniAppLogin(dto.initData);
  }
}
