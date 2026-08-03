import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SavingsService } from './savings.service';
import { CreateSavingDto } from './dto/saving.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('savings')
@UseGuards(AuthGuard('jwt'))
export class SavingsController {
  constructor(private service: SavingsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Get('total')
  getTotal(@CurrentUser() user: User) {
    return this.service.getTotal(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateSavingDto) {
    return this.service.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
