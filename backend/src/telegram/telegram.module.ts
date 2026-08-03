import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramService } from './telegram.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
