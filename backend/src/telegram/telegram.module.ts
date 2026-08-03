import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { TelegramBotController } from './telegram-bot.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ScheduleModule.forRoot(), forwardRef(() => AuthModule)],
  controllers: [TelegramBotController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private telegram: TelegramService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const appUrl =
      this.config.get<string>('WEBAPP_URL') ??
      this.config.get<string>('FRONTEND_URL') ??
      'https://budget-app-production-c406.up.railway.app';
    void this.telegram.setupBot(appUrl);
  }
}
