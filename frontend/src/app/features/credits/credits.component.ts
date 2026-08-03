import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { formatMoney, formatDate } from '../../shared/utils/format.util';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [FormsModule, DatePipe, ProgressBarComponent],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Kreditlar</h1>

      <form class="card space-y-3" (ngSubmit)="submit()">
        <input class="field" placeholder="Nomi" [(ngModel)]="form.name" name="name" required />
        <input class="field" type="number" placeholder="Summa" [(ngModel)]="form.totalAmount" name="totalAmount" required />
        <input class="field" type="number" placeholder="Foiz %" [(ngModel)]="form.interestRate" name="interestRate" />
        <input class="field" type="number" placeholder="Oylar" [(ngModel)]="form.months" name="months" required />
        <input class="field" type="date" [(ngModel)]="form.startDate" name="startDate" required />
        <input class="field" type="number" placeholder="Oy to'lov" [(ngModel)]="form.monthlyPayment" name="monthlyPayment" required />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      @for (c of items(); track c.id) {
        <div class="card space-y-2">
          <div class="flex justify-between">
            <h3 class="font-medium">{{ c.name }}</h3>
            <span class="badge">{{ c.status }}</span>
          </div>
          <app-progress-bar
            [progress]="progress(c)"
            [subtitle]="format(c.remainingDebt) + ' qolgan / ' + format(c.totalAmount)"
          />
          <div class="grid grid-cols-2 gap-2 text-sm text-muted">
            <span>To'lov: {{ format(c.monthlyPayment) }}</span>
            <span>Keyingi: {{ c.nextPaymentDate | date: 'd-MMMM' }}</span>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
    .text-muted { color: var(--color-muted); }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 999px; background: var(--color-accent-soft); color: var(--color-accent); }
  `],
})
export class CreditsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  format = formatMoney;

  form = {
    name: '',
    totalAmount: null as number | null,
    interestRate: 0,
    months: 12,
    startDate: new Date().toISOString().slice(0, 10),
    monthlyPayment: null as number | null,
  };

  ngOnInit(): void { this.load(); }
  load(): void { this.api.get<any[]>('/credits').subscribe((r) => this.items.set(r)); }

  progress(c: any): number {
    const total = Number(c.totalAmount);
    const rem = Number(c.remainingDebt);
    return total > 0 ? Math.round(((total - rem) / total) * 100) : 0;
  }

  submit(): void {
    if (!this.form.name || !this.form.totalAmount || !this.form.monthlyPayment) return;
    this.api.post('/credits', this.form).subscribe(() => {
      this.form.name = '';
      this.form.totalAmount = null;
      this.form.monthlyPayment = null;
      this.load();
    });
  }
}
