import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type CbuRateRow = {
  Rate: string;
  Date: string;
  Ccy: string;
};

@Injectable()
export class ExchangeRatesService {
  private cache: { rate: number; date: string; fetchedAt: number } | null =
    null;
  private readonly ttlMs = 15 * 60 * 1000;

  async getUsdRate() {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.ttlMs) {
      return {
        rate: this.cache.rate,
        date: this.cache.date,
        source: 'CBU',
        updatedAt: new Date(this.cache.fetchedAt).toISOString(),
      };
    }

    const res = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/');
    if (!res.ok) {
      throw new ServiceUnavailableException(
        'Valyuta kursi vaqtincha mavjud emas',
      );
    }

    const rows = (await res.json()) as CbuRateRow[];
    const latest = rows[0];
    if (!latest?.Rate) {
      throw new ServiceUnavailableException('Valyuta kursi topilmadi');
    }

    const rate = Number.parseFloat(latest.Rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new ServiceUnavailableException("Valyuta kursi noto'g'ri");
    }

    this.cache = { rate, date: latest.Date, fetchedAt: now };
    return {
      rate,
      date: latest.Date,
      source: 'CBU',
      updatedAt: new Date(now).toISOString(),
    };
  }
}
