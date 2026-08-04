import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
@UseGuards(AuthGuard('jwt'))
export class ExchangeRatesController {
  constructor(private service: ExchangeRatesService) {}

  @Get('usd')
  getUsdRate() {
    return this.service.getUsdRate();
  }
}
