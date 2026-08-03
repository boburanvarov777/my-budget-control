import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  BeginRegistrationDto,
  RequestCodeDto,
  VerifyCodeDto,
} from './dto/auth-telegram.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('begin-registration')
  beginRegistration(@Body() dto: BeginRegistrationDto) {
    return this.authService.beginRegistration(dto);
  }

  @Post('request-code')
  requestCode(@Body() dto: RequestCodeDto) {
    return this.authService.requestVerificationCode(dto);
  }

  @Post('verify-code')
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCodeAndLogin(dto);
  }
}
