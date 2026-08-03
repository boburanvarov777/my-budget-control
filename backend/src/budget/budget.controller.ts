import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import { CreateBudgetPlanDto } from './dto/budget.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('budget')
@UseGuards(AuthGuard('jwt'))
export class BudgetController {
  constructor(private service: BudgetService) {}

  @Get()
  getCurrent(
    @CurrentUser() user: User,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    return this.service.getPlan(
      user.id,
      Number(month ?? now.getMonth() + 1),
      Number(year ?? now.getFullYear()),
    );
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBudgetPlanDto) {
    return this.service.createPlan(user.id, dto);
  }
}
