import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { formatMoney, daysUntil } from '../../shared/utils/format.util';

@Component({
  selector: 'app-micro-loans',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Mikroqarz</h1>

      <form class="card space-y-3" (ngSubmit)="submit()">
        <select class="field" [(ngModel)]="form.provider" name="provider">
          @for (p of providers; track p) {
            <option [value]="p">{{ p }}</option>
          }
        </select>
        <input class="field" type="number" placeholder="Summa" [(ngModel)]="form.amount" name="amount" required />
        <input class="field" type="date" [(ngModel)]="form.takenDate" name="takenDate" required />
        <input class="field" type="date" [(ngModel)]="form.dueDate" name="dueDate" required />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      @for (loan of items(); track loan.id) {
        <div class="card">
          <div class="flex justify-between">
            <div>
              <p class="font-medium">{{ loan.provider }}</p>
              <p class="text-danger font-semibold">{{ format(loan.amount) }}</p>
            </div>
            <span class="badge" [class.urgent]="daysLeft(loan.dueDate) <= 1">
              {{ urgency(loan.dueDate) }}
            </span>
          </div>
          <p class="mt-2 text-xs text-muted">Qaytarish: {{ loan.dueDate | date: 'd MMM yyyy' }}</p>
          <button class="mt-3 text-sm text-success" (click)="markPaid(loan.id)">To'landi</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
    .text-muted { color: var(--color-muted); }
    .text-danger { color: var(--color-danger); }
    .text-success { color: var(--color-success); }
    .badge { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: var(--color-warning); color: #000; font-weight: 600; }
    .badge.urgent { background: var(--color-danger); color: #fff; }
  `],
})
export class MicroLoansComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  format = formatMoney;
  providers = ['UZUM', 'ALIF', 'YANGI', 'PAYME', 'OTHER'];

  form = {
    provider: 'UZUM',
    amount: null as number | null,
    takenDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
  };

  ngOnInit(): void { this.load(); }
  load(): void { this.api.get<any[]>('/micro-loans').subscribe((r) => this.items.set(r)); }

  daysLeft(d: string) { return daysUntil(d); }
  urgency(d: string) {
    const days = daysUntil(d);
    if (days <= 0) return 'BUGUN';
    if (days === 1) return 'ERTAGA';
    return `${days} kun qoldi`;
  }

  submit(): void {
    if (!this.form.amount || !this.form.dueDate) return;
    this.api.post('/micro-loans', this.form).subscribe(() => this.load());
  }

  markPaid(id: string): void {
    this.api.patch(`/micro-loans/${id}`, { isPaid: true }).subscribe(() => this.load());
  }
}
