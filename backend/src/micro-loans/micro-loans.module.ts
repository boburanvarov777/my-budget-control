import { Module } from '@nestjs/common';
import { MicroLoansController } from './micro-loans.controller';
import { MicroLoansService } from './micro-loans.service';

@Module({
  controllers: [MicroLoansController],
  providers: [MicroLoansService],
})
export class MicroLoansModule {}
