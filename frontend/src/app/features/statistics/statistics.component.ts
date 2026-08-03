import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { formatMoney } from '../../shared/utils/format.util';

@Component({
  selector: 'app-statistics',
  standalone: true,
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Statistika</h1>

      <div class="flex gap-2">
        @for (p of periods; track p) {
          <button
            class="period-btn"
            [class.active]="period() === p"
            (click)="setPeriod(p)"
          >
            {{ labels[p] }}
          </button>
        }
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-2 gap-3">
          <div class="card">
            <p class="text-xs text-muted">Daromad</p>
            <p class="text-success font-semibold">{{ format(s.income) }}</p>
          </div>
          <div class="card">
            <p class="text-xs text-muted">Xarajat</p>
            <p class="text-danger font-semibold">{{ format(s.totalExpense) }}</p>
          </div>
        </div>

        <div class="card space-y-2">
          <h3 class="text-sm text-muted">Kategoriya bo'yicha</h3>
          @for (e of s.expenses; track e.category) {
            <div class="flex justify-between text-sm">
              <span>{{ e.category }}</span>
              <span>{{ format(e.amount) }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .text-muted { color: var(--color-muted); }
    .text-success { color: var(--color-success); }
    .text-danger { color: var(--color-danger); }
    .period-btn {
      flex: 1; border-radius: 12px; border: 1px solid var(--color-border);
      background: transparent; color: var(--color-muted); padding: 0.5rem; font-size: 12px;
    }
    .period-btn.active { background: var(--color-accent-soft); color: var(--color-accent); border-color: var(--color-accent); }
  `],
})
export class StatisticsComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<any>(null);
  period = signal<'day' | 'week' | 'month' | 'year'>('month');
  format = formatMoney;
  periods = ['day', 'week', 'month', 'year'] as const;
  labels = { day: 'Bugun', week: 'Hafta', month: 'Oy', year: 'Yil' };

  ngOnInit(): void { this.load(); }

  setPeriod(p: 'day' | 'week' | 'month' | 'year'): void {
    this.period.set(p);
    this.load();
  }

  load(): void {
    this.api.get<any>('/statistics', { period: this.period() }).subscribe((r) => this.stats.set(r));
  }
}
