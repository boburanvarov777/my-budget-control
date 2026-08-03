import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { AiQueryDto } from './dto/ai.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private service: AiService) {}

  @Post('ask')
  ask(@CurrentUser() user: User, @Body() dto: AiQueryDto) {
    return this.service.getAdvice(user.id, dto.message);
  }
}
