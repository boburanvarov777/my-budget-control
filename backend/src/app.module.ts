import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IncomesModule } from './incomes/incomes.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CreditsModule } from './credits/credits.module';
import { MicroLoansModule } from './micro-loans/micro-loans.module';
import { InstallmentsModule } from './installments/installments.module';
import { GoalsModule } from './goals/goals.module';
import { SavingsModule } from './savings/savings.module';
import { BudgetModule } from './budget/budget.module';
import { CalendarModule } from './calendar/calendar.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { TelegramModule } from './telegram/telegram.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    IncomesModule,
    ExpensesModule,
    CreditsModule,
    MicroLoansModule,
    InstallmentsModule,
    GoalsModule,
    SavingsModule,
    BudgetModule,
    CalendarModule,
    StatisticsModule,
    ReportsModule,
    AiModule,
    AdminModule,
    TelegramModule,
    NotificationsModule,
  ],
})
export class AppModule {}
