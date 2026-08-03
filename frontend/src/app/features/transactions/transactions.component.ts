import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { currentMonthYear } from '../../shared/utils/format.util';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { AmountPipe } from '../../shared/pipes/money.pipe';

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

interface CategoryItem {
  id: string | null;
  code: string;
  label: string;
  icon?: string | null;
  custom: boolean;
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
    CurrencyInputComponent,
    AmountPipe,
  ],
  template: `
    <section class="premium-page">
      <app-page-header
        title="Tranzaksiyalar"
        subtitle="Daromad va xarajatlaringiz · PostgreSQL bazasida saqlanadi"
      />

      <div class="premium-segment">
        <button
          type="button"
          class="premium-segment-btn"
          [class.active]="tab() === 'income'"
          (click)="switchTab('income')"
        >
          Daromad
        </button>
        <button
          type="button"
          class="premium-segment-btn"
          [class.active]="tab() === 'expense'"
          (click)="switchTab('expense')"
        >
          Xarajat
        </button>
      </div>

      @if (showForm()) {
        <form class="premium-card form-card" (ngSubmit)="submit()" novalidate>
          <div class="premium-field">
            <label class="premium-label">Summa (so'm)</label>
            <app-currency-input
              [(ngModel)]="form.amount"
              name="amount"
              placeholder="300 000"
              [invalid]="!!errors()['amount']"
            />
            @if (errors()['amount']) {
              <p class="field-error">{{ errors()['amount'] }}</p>
            }
          </div>

          <div class="premium-field">
            <div class="label-row">
              <label class="premium-label">Kategoriya</label>
              <button type="button" class="link-btn" (click)="showCategoryManager.set(true)">
                Boshqarish
              </button>
            </div>
            <select
              class="premium-select"
              [class.premium-select-error]="!!errors()['category']"
              [(ngModel)]="form.category"
              name="category"
            >
              @for (c of activeCategories(); track c.code) {
                <option [value]="c.code">
                  {{ categoryOptionLabel(c) }}
                </option>
              }
            </select>
            @if (errors()['category']) {
              <p class="field-error">{{ errors()['category'] }}</p>
            }
          </div>

          <div class="premium-field">
            <label class="premium-label">Sana</label>
            <input
              type="date"
              class="premium-input"
              [class.premium-input-error]="!!errors()['date']"
              [(ngModel)]="form.date"
              name="date"
            />
            @if (errors()['date']) {
              <p class="field-error">{{ errors()['date'] }}</p>
            }
          </div>

          <div class="premium-field">
            <label class="premium-label">Izoh</label>
            <input
              type="text"
              class="premium-input"
              placeholder="Ixtiyoriy"
              [(ngModel)]="form.note"
              name="note"
            />
          </div>

          @if (submitError()) {
            <p class="field-error">{{ submitError() }}</p>
          }

          <div class="premium-grid-2">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeForm()">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block" [disabled]="saving()">
              {{ saving() ? 'Saqlanmoqda...' : 'Saqlash' }}
            </button>
          </div>
        </form>
      }

      @if (showCategoryManager()) {
        <div class="modal-backdrop" (click)="showCategoryManager.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2 class="premium-section-title">Kategoriyalar</h2>
            <p class="premium-small premium-muted">
              {{ tab() === 'income' ? 'Daromad' : 'Xarajat' }} kategoriyalarini qo'shing yoki o'chiring
            </p>

            <div class="add-row">
              <input
                type="text"
                class="premium-input"
                placeholder="Yangi kategoriya nomi"
                [(ngModel)]="newCategoryLabel"
                name="newCategory"
              />
              <button type="button" class="premium-btn premium-btn-primary" (click)="addCategory()" [disabled]="addingCategory()">
                Qo'shish
              </button>
            </div>

            @if (categoryError()) {
              <p class="field-error">{{ categoryError() }}</p>
            }

            <div class="category-list">
              @for (c of activeCategories(); track c.code) {
                <div class="category-row">
                  <span>{{ categoryOptionLabel(c) }}</span>
                  @if (c.custom && c.id) {
                    <button type="button" class="icon-btn" (click)="removeCategory(c.id, c.label)">
                      <app-icon name="trash-2" [size]="16" />
                    </button>
                  } @else {
                    <span class="premium-small premium-muted">Tizim</span>
                  }
                </div>
              }
            </div>

            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="showCategoryManager.set(false)">
              Yopish
            </button>
          </div>
        </div>
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
                  <p class="amount-lg text-success">{{ item.amount | amount }} so'm</p>
                  <p class="premium-small premium-muted">
                    {{ categoryLabel(item.category) }} · {{ item.date | date: 'd MMM' }}
                  </p>
                </div>
              </div>
              <button type="button" class="icon-btn" (click)="removeIncome(item)">
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
                  <p class="amount-lg text-danger">{{ item.amount | amount }} so'm</p>
                  <p class="premium-small premium-muted">
                    {{ categoryLabel(item.category) }} · {{ item.date | date: 'd MMM' }}
                  </p>
                </div>
              </div>
              <button type="button" class="icon-btn" (click)="removeExpense(item)">
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
      .form-card > * + * { margin-top: 16px; }
      .space-y-3 > * + * { margin-top: 12px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-3 { gap: 12px; }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .label-row .premium-label { margin-bottom: 0; }

      .link-btn {
        border: none;
        background: none;
        color: var(--color-gold);
        font-size: 14px;
        cursor: pointer;
        padding: 0;
      }

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
      }

      .icon-btn:hover { color: var(--color-danger); }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.65);
      }

      .modal-card {
        width: 100%;
        max-width: 32rem;
        max-height: 80dvh;
        overflow: auto;
        padding: 20px;
        border-radius: var(--radius-card);
        border: 1px solid var(--color-border);
        background: var(--color-card);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .add-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
      }

      .category-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 240px;
        overflow: auto;
      }

      .category-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--color-border);
        background: var(--color-bg);
      }
    `,
  ],
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);

  tab = signal<Tab>('expense');
  showForm = signal(false);
  showCategoryManager = signal(false);
  saving = signal(false);
  addingCategory = signal(false);
  submitError = signal('');
  categoryError = signal('');
  errors = signal<Record<string, string>>({});

  incomes = signal<IncomeItem[]>([]);
  expenses = signal<ExpenseItem[]>([]);
  incomeCategories = signal<CategoryItem[]>([]);
  expenseCategories = signal<CategoryItem[]>([]);

  newCategoryLabel = '';

  activeCategories = computed(() =>
    this.tab() === 'income' ? this.incomeCategories() : this.expenseCategories(),
  );

  form = {
    amount: null as number | null,
    category: 'FOOD',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  };

  ngOnInit(): void {
    this.loadCategories();
    this.load();
  }

  switchTab(next: Tab): void {
    this.tab.set(next);
    this.closeForm();
  }

  openForm(): void {
    this.errors.set({});
    this.submitError.set('');
    this.form = {
      amount: null,
      category: this.defaultCategory(),
      date: new Date().toISOString().slice(0, 10),
      note: '',
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.errors.set({});
    this.submitError.set('');
  }

  submit(): void {
    const errs: Record<string, string> = {};

    if (this.form.amount == null || this.form.amount <= 0) {
      errs['amount'] = 'Summani kiriting (masalan: 25 000)';
    }
    if (!this.form.category?.trim()) {
      errs['category'] = 'Kategoriyani tanlang';
    }
    if (!this.form.date?.trim()) {
      errs['date'] = 'Sanani tanlang';
    }

    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.saving.set(true);
    this.submitError.set('');

    const payload = {
      amount: this.form.amount!,
      category: this.form.category,
      date: this.form.date,
      note: this.form.note?.trim() || undefined,
    };

    const req =
      this.tab() === 'income'
        ? this.api.post('/incomes', payload)
        : this.api.post('/expenses', payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.tab() === 'income' ? this.loadIncomes() : this.loadExpenses();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.submitError.set(this.extractError(e));
      },
    });
  }

  load(): void {
    this.loadIncomes();
    this.loadExpenses();
  }

  loadCategories(): void {
    this.api.get<CategoryItem[]>('/categories', { type: 'INCOME' }).subscribe({
      next: (r) => this.incomeCategories.set(r),
      error: () => this.incomeCategories.set(this.fallbackIncomeCategories()),
    });
    this.api.get<CategoryItem[]>('/categories', { type: 'EXPENSE' }).subscribe({
      next: (r) => this.expenseCategories.set(r),
      error: () => this.expenseCategories.set(this.fallbackExpenseCategories()),
    });
  }

  loadIncomes(): void {
    const { month, year } = currentMonthYear();
    this.api.get<IncomeItem[]>('/incomes', { month, year }).subscribe((r) => this.incomes.set(r));
  }

  loadExpenses(): void {
    const { month, year } = currentMonthYear();
    this.api.get<ExpenseItem[]>('/expenses', { month, year }).subscribe((r) => this.expenses.set(r));
  }

  async removeIncome(item: IncomeItem): Promise<void> {
    const ok = await this.confirm.ask(
      "O'chirishni tasdiqlang",
      `${this.formatItemLabel(item)} daromadini rostdan ham o'chirmoqchimisiz?`,
    );
    if (!ok) return;
    this.api.delete(`/incomes/${item.id}`).subscribe(() => this.loadIncomes());
  }

  async removeExpense(item: ExpenseItem): Promise<void> {
    const ok = await this.confirm.ask(
      "O'chirishni tasdiqlang",
      `${this.formatItemLabel(item)} xarajatini rostdan ham o'chirmoqchimisiz?`,
    );
    if (!ok) return;
    this.api.delete(`/expenses/${item.id}`).subscribe(() => this.loadExpenses());
  }

  addCategory(): void {
    const label = this.newCategoryLabel.trim();
    if (!label) {
      this.categoryError.set('Kategoriya nomini kiriting');
      return;
    }

    this.addingCategory.set(true);
    this.categoryError.set('');

    this.api
      .post('/categories', {
        type: this.tab() === 'income' ? 'INCOME' : 'EXPENSE',
        label,
      })
      .subscribe({
        next: () => {
          this.newCategoryLabel = '';
          this.addingCategory.set(false);
          this.loadCategories();
        },
        error: (e: HttpErrorResponse) => {
          this.addingCategory.set(false);
          this.categoryError.set(this.extractError(e));
        },
      });
  }

  async removeCategory(id: string, label: string): Promise<void> {
    const ok = await this.confirm.ask(
      "Kategoriyani o'chirish",
      `"${label}" kategoriyasini rostdan ham o'chirmoqchimisiz?`,
    );
    if (!ok) return;

    this.api.delete(`/categories/${id}`).subscribe({
      next: () => {
        if (this.form.category && !this.activeCategories().some((c) => c.code === this.form.category)) {
          this.form.category = this.defaultCategory();
        }
        this.loadCategories();
      },
      error: (e: HttpErrorResponse) => this.categoryError.set(this.extractError(e)),
    });
  }

  categoryLabel(code: string): string {
    const all = [...this.incomeCategories(), ...this.expenseCategories()];
    return all.find((c) => c.code === code)?.label ?? code;
  }

  categoryOptionLabel(c: CategoryItem): string {
    return c.icon ? `${c.icon} ${c.label}` : c.label;
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

  private defaultCategory(): string {
    return this.tab() === 'income' ? 'SALARY' : 'FOOD';
  }

  private formatItemLabel(item: IncomeItem | ExpenseItem): string {
    return `${this.categoryLabel(item.category)} · ${item.amount.toLocaleString('uz-UZ')} so'm`;
  }

  private extractError(e: HttpErrorResponse): string {
    const msg = e.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return 'Xatolik yuz berdi. Qayta urinib ko\'ring.';
  }

  private fallbackIncomeCategories(): CategoryItem[] {
    return [
      { id: null, code: 'SALARY', label: 'Maosh', custom: false },
      { id: null, code: 'BONUS', label: 'Bonus', custom: false },
      { id: null, code: 'FREELANCE', label: 'Freelance', custom: false },
      { id: null, code: 'SALE', label: 'Sotuv', custom: false },
      { id: null, code: 'OTHER', label: 'Boshqa', custom: false },
    ];
  }

  private fallbackExpenseCategories(): CategoryItem[] {
    return [
      { id: null, code: 'FOOD', label: 'Oziq-ovqat', icon: '🥩', custom: false },
      { id: null, code: 'TRANSPORT', label: 'Transport', icon: '🚗', custom: false },
      { id: null, code: 'OTHER', label: 'Boshqa', icon: '📦', custom: false },
    ];
  }
}
