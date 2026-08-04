import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

interface UsdRateResponse {
  rate: number;
  date: string;
  source: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private api = inject(ApiService);
  private timer: ReturnType<typeof setInterval> | null = null;

  usdRate = signal<number | null>(null);
  rateDate = signal<string | null>(null);
  loading = signal(false);

  ensureLoaded(): void {
    if (this.usdRate() == null) this.refresh();
    if (!this.timer) {
      this.timer = setInterval(() => this.refresh(), 10 * 60 * 1000);
    }
  }

  refresh(): void {
    this.loading.set(true);
    this.api.get<UsdRateResponse>('/exchange-rates/usd').subscribe({
      next: (row) => {
        this.usdRate.set(row.rate);
        this.rateDate.set(row.date);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
