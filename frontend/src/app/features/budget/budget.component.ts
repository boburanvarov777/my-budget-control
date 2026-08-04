import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { formatMoney, currentMonthYear, coerceAmount } from '../../shared/utils/format.util';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [FormsModule, CurrencyInputComponent],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Budget Planner</h1>

      <form class="card space-y-3" (ngSubmit)="calculate()">
        <app-currency-input [(ngModel)]="monthlyIncome" name="income" placeholder="Oylik daromad" />
        @for (item of mandatory; track $index) {
          <div class="flex gap-2">
            <input class="field" placeholder="Nomi" [(ngModel)]="item.name" [name]="'n' + $index" />
            <app-currency-input [(ngModel)]="item.amount" [name]="'a' + $index" placeholder="Summa" />
          </div>
        }
        <button type="button" class="text-sm text-accent" (click)="addRow()">+ Qator qo'shish</button>
        <button type="submit" class="btn-primary">Hisoblash</button>
      </form>

      @if (result(); as r) {
        <div class="card space-y-3">
          <p class="text-muted">Majburiy: {{ format(r.mandatoryTotal) }}</p>
          <p class="text-lg font-semibold text-success">Qoladi: {{ format(r.remaining) }}</p>
          @if (r.recommendations; as rec) {
            <div class="space-y-1 text-sm">
              <p>Jamg'arma: {{ format(rec['savings'] ?? 0) }}</p>
              <p>Mashina: {{ format(rec['car'] ?? 0) }}</p>
              <p>Investitsiya: {{ format(rec['investment'] ?? 0) }}</p>
              <p>Erkin pul: {{ format(rec['free'] ?? 0) }}</p>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
    .text-muted { color: var(--color-muted); }
    .text-success { color: var(--color-success); }
    .text-accent { color: var(--color-accent); }
  `],
})
export class BudgetComponent implements OnInit {
  private api = inject(ApiService);
  format = formatMoney;
  monthlyIncome = 25000000 as number | null;
  mandatory: { name: string; amount: number | null }[] = [
    { name: 'Kredit', amount: 1600000 },
    { name: 'Telefon', amount: 3000000 },
    { name: 'Gap', amount: 1000000 },
    { name: 'Kommunal', amount: 900000 },
    { name: 'Bola', amount: 2000000 },
  ];
  result = signal<any>(null);

  ngOnInit(): void {
    const { month, year } = currentMonthYear();
    this.api.get<any>('/budget', { month, year }).subscribe({
      next: (r) => { if (r) this.result.set(r); },
    });
  }

  addRow(): void {
    this.mandatory.push({ name: '', amount: 0 });
  }

  calculate(): void {
    const { month, year } = currentMonthYear();
    const income = coerceAmount(this.monthlyIncome);
    this.api
      .post('/budget', {
        month,
        year,
        monthlyIncome: income,
        mandatoryExpenses: this.mandatory
          .filter((m) => m.name && coerceAmount(m.amount) > 0)
          .map((m) => ({ name: m.name, amount: coerceAmount(m.amount) })),
      })
      .subscribe((r) => this.result.set(r));
  }
}
