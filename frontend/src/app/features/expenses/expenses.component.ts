import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { formatMoney, currentMonthYear } from '../../shared/utils/format.util';

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  note?: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Xarajatlar</h1>

      <form class="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" (ngSubmit)="submit()">
        <input type="number" class="field" placeholder="Summa" [(ngModel)]="form.amount" name="amount" required />
        <select class="field" [(ngModel)]="form.category" name="category">
          @for (c of categories; track c.value) {
            <option [value]="c.value">{{ c.icon }} {{ c.label }}</option>
          }
        </select>
        <input type="date" class="field" [(ngModel)]="form.date" name="date" required />
        <input type="text" class="field" placeholder="Izoh" [(ngModel)]="form.note" name="note" />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      <div class="space-y-2">
        @for (item of items(); track item.id) {
          <div class="item-row">
            <div>
              <p class="font-medium text-danger">{{ format(item.amount) }}</p>
              <p class="text-xs text-muted">{{ label(item.category) }} · {{ item.date | date: 'd MMM' }}</p>
            </div>
            <button type="button" class="text-danger" (click)="remove(item.id)">×</button>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .border-border { border-color: var(--color-border); }
      .bg-surface-2 { background: var(--color-surface-2); }
      .text-muted { color: var(--color-muted); }
      .text-danger { color: var(--color-danger); }
      .field {
        width: 100%; border-radius: 12px; border: 1px solid var(--color-border);
        background: var(--color-bg); color: var(--color-text); padding: 0.75rem 1rem;
      }
      .btn-primary {
        width: 100%; border-radius: 12px; background: var(--color-accent);
        color: white; padding: 0.75rem; border: none;
      }
      .item-row {
        display: flex; justify-content: space-between; align-items: center;
        border-radius: 16px; border: 1px solid var(--color-border);
        background: var(--color-surface-2); padding: 0.875rem 1rem;
      }
    `,
  ],
})
export class ExpensesComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<Expense[]>([]);
  format = formatMoney;

  categories = [
    { value: 'FOOD', icon: '🥩', label: 'Oziq-ovqat' },
    { value: 'TRANSPORT', icon: '🚗', label: 'Transport' },
    { value: 'UTILITIES', icon: '🏠', label: 'Kommunal' },
    { value: 'CHILD', icon: '👶', label: 'Bola' },
    { value: 'CAFE', icon: '🍔', label: 'Kafe' },
    { value: 'PHONE', icon: '📱', label: 'Telefon' },
    { value: 'GAMING', icon: '🎮', label: "O'yin" },
    { value: 'GIFT', icon: '🎁', label: "Sovg'a" },
    { value: 'SHOPPING', icon: '🛍', label: 'Shopping' },
    { value: 'PHARMACY', icon: '💊', label: 'Dorixona' },
    { value: 'OTHER', icon: '📦', label: 'Boshqa' },
  ];

  form = {
    amount: null as number | null,
    date: new Date().toISOString().slice(0, 10),
    category: 'FOOD',
    note: '',
  };

  ngOnInit(): void {
    this.load();
  }

  label(cat: string): string {
    return this.categories.find((c) => c.value === cat)?.label ?? cat;
  }

  load(): void {
    const { month, year } = currentMonthYear();
    this.api.get<Expense[]>('/expenses', { month, year }).subscribe((res) => this.items.set(res));
  }

  submit(): void {
    if (!this.form.amount) return;
    this.api
      .post('/expenses', {
        amount: this.form.amount,
        date: this.form.date,
        category: this.form.category,
        note: this.form.note || undefined,
      })
      .subscribe(() => {
        this.form.amount = null;
        this.form.note = '';
        this.load();
      });
  }

  remove(id: string): void {
    this.api.delete(`/expenses/${id}`).subscribe(() => this.load());
  }
}
