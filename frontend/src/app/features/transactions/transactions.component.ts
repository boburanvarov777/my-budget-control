import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { ApiService } from '../../core/services/api.service';
import { formatMoney, currentMonthYear } from '../../shared/utils/format.util';

type Tab = 'income' | 'expense';

interface IncomeItem {
  id: string;
  amount: number;
  date: string;
  category: string;
  note?: string;
}

interface ExpenseItem {
  id: string;
  amount: number;
  date: string;
  category: string;
  note?: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    PageHeaderComponent,
    FabComponent,
    IconComponent,
  ],
  template: `
    <section class="premium-page">
      <app-page-header
        title="Tranzaksiyalar"
        subtitle="Daromad va xarajatlaringiz"
      />

      <div class="premium-segment">
        <button
          type="button"
          class="premium-segment-btn"
          [class.active]="tab() === 'income'"
          (click)="tab.set('income')"
        >
          Daromad
        </button>
        <button
          type="button"
          class="premium-segment-btn"
          [class.active]="tab() === 'expense'"
          (click)="tab.set('expense')"
        >
          Xarajat
        </button>
      </div>

      @if (showForm()) {
        <form class="premium-card space-y-4" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Summa (so'm)</label>
            <input
              type="number"
              class="premium-input"
              placeholder="0"
              [(ngModel)]="form.amount"
              name="amount"
              required
            />
          </div>

          @if (tab() === 'income') {
            <div class="premium-field">
              <label class="premium-label">Kategoriya</label>
              <select class="premium-select" [(ngModel)]="form.category" name="category">
                @for (c of incomeCategories; track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              </select>
            </div>
          } @else {
            <div class="premium-field">
              <label class="premium-label">Kategoriya</label>
              <select class="premium-select" [(ngModel)]="form.category" name="category">
                @for (c of expenseCategories; track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              </select>
            </div>
          }

          <div class="premium-field">
            <label class="premium-label">Sana</label>
            <input type="date" class="premium-input" [(ngModel)]="form.date" name="date" required />
          </div>

          <div class="premium-field">
            <label class="premium-label">Izoh</label>
            <input type="text" class="premium-input" placeholder="Ixtiyoriy" [(ngModel)]="form.note" name="note" />
          </div>

          <div class="premium-grid-2">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="showForm.set(false)">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">Saqlash</button>
          </div>
        </form>
      }

      <div class="space-y-3">
        @if (tab() === 'income') {
          @for (item of incomes(); track item.id) {
            <div class="premium-list-item">
              <div class="flex items-center gap-3">
                <div class="premium-list-icon active">
                  <app-icon name="trending-up" [size]="18" />
                </div>
                <div>
                  <p class="amount-lg text-success">{{ format(item.amount) }}</p>
                  <p class="premium-small premium-muted">
                    {{ incomeLabel(item.category) }} · {{ item.date | date: 'd MMM' }}
                  </p>
                </div>
              </div>
              <button type="button" class="icon-btn" (click)="removeIncome(item.id)">
                <app-icon name="trash-2" [size]="16" />
              </button>
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">Daromadlar yo'q</div>
          }
        } @else {
          @for (item of expenses(); track item.id) {
            <div class="premium-list-item">
              <div class="flex items-center gap-3">
                <div class="premium-list-icon">
                  <app-icon [name]="expenseIcon(item.category)" [size]="18" />
                </div>
                <div>
                  <p class="amount-lg text-danger">{{ format(item.amount) }}</p>
                  <p class="premium-small premium-muted">
                    {{ expenseLabel(item.category) }} · {{ item.date | date: 'd MMM' }}
                  </p>
                </div>
              </div>
              <button type="button" class="icon-btn" (click)="removeExpense(item.id)">
                <app-icon name="trash-2" [size]="16" />
              </button>
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">Xarajatlar yo'q</div>
          }
        }
      </div>
    </section>

    <app-fab (clicked)="openForm()" />
  `,
  styles: [
    `
      .space-y-3 > * + * { margin-top: 12px; }
      .space-y-4 > * + * { margin-top: 16px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-3 { gap: 12px; }
      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--color-muted-2);
        cursor: pointer;
        transition: color 250ms ease;
      }
      .icon-btn:hover { color: var(--color-danger); }
    `,
  ],
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);
  tab = signal<Tab>('expense');
  showForm = signal(false);
  incomes = signal<IncomeItem[]>([]);
  expenses = signal<ExpenseItem[]>([]);
  format = formatMoney;

  incomeCategories = [
    { value: 'SALARY', label: 'Maosh' },
    { value: 'BONUS', label: 'Bonus' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'SALE', label: 'Sotuv' },
    { value: 'OTHER', label: 'Boshqa' },
  ];

  expenseCategories = [
    { value: 'FOOD', label: 'Oziq-ovqat' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'UTILITIES', label: 'Kommunal' },
    { value: 'CHILD', label: 'Bola' },
    { value: 'CAFE', label: 'Kafe' },
    { value: 'PHONE', label: 'Telefon' },
    { value: 'GAMING', label: 'O\'yin' },
    { value: 'GIFT', label: 'Sovg\'a' },
    { value: 'SHOPPING', label: 'Shopping' },
    { value: 'PHARMACY', label: 'Dori-darmon' },
    { value: 'OTHER', label: 'Boshqa' },
  ];

  form = {
    amount: null as number | null,
    category: 'OTHER',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  };

  ngOnInit(): void {
    this.load();
  }

  openForm(): void {
    this.form = {
      amount: null,
      category: this.tab() === 'income' ? 'SALARY' : 'FOOD',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    };
    this.showForm.set(true);
  }

  submit(): void {
    if (!this.form.amount) return;
    const payload = {
      amount: this.form.amount,
      category: this.form.category,
      date: this.form.date,
      note: this.form.note || undefined,
    };

    if (this.tab() === 'income') {
      this.api.post('/incomes', payload).subscribe(() => {
        this.showForm.set(false);
        this.loadIncomes();
      });
    } else {
      this.api.post('/expenses', payload).subscribe(() => {
        this.showForm.set(false);
        this.loadExpenses();
      });
    }
  }

  load(): void {
    this.loadIncomes();
    this.loadExpenses();
  }

  loadIncomes(): void {
    const { month, year } = currentMonthYear();
    this.api.get<IncomeItem[]>('/incomes', { month, year }).subscribe((r) => this.incomes.set(r));
  }

  loadExpenses(): void {
    const { month, year } = currentMonthYear();
    this.api.get<ExpenseItem[]>('/expenses', { month, year }).subscribe((r) => this.expenses.set(r));
  }

  removeIncome(id: string): void {
    this.api.delete(`/incomes/${id}`).subscribe(() => this.loadIncomes());
  }

  removeExpense(id: string): void {
    this.api.delete(`/expenses/${id}`).subscribe(() => this.loadExpenses());
  }

  incomeLabel(v: string): string {
    return this.incomeCategories.find((c) => c.value === v)?.label ?? v;
  }

  expenseLabel(v: string): string {
    return this.expenseCategories.find((c) => c.value === v)?.label ?? v;
  }

  expenseIcon(v: string): string {
    const map: Record<string, string> = {
      FOOD: 'utensils-crossed',
      TRANSPORT: 'car',
      UTILITIES: 'home',
      CHILD: 'baby',
      CAFE: 'coffee',
      PHONE: 'smartphone',
      GAMING: 'gamepad-2',
      GIFT: 'gift',
      SHOPPING: 'shopping-bag',
      PHARMACY: 'pill',
      OTHER: 'circle-dollar-sign',
    };
    return map[v] ?? 'circle-dollar-sign';
  }
}
