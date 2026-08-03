import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MiniAppLoginDto } from './dto/auth-telegram.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('mini-app-login')
  miniAppLogin(@Body() dto: MiniAppLoginDto) {
    return this.authService.miniAppLogin(dto.initData, dto.username);
  }
}
