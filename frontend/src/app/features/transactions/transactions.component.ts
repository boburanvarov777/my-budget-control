import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { coerceAmount, currentMonthYear } from '../../shared/utils/format.util';
import { extractApiError } from '../../shared/utils/http-error.util';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { TransactionDraftService } from '../../shared/services/transaction-draft.service';
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
    DateInputComponent,
    AmountPipe,
  ],
  template: `
    <section class="premium-page">
      <app-page-header
        title="Kirim-chiqim"
        subtitle="Daromad va xarajatlaringiz"
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
              <button type="button" class="link-btn" (click)="goToCategories()">Boshqarish</button>
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
            <app-date-input
              [(ngModel)]="form.date"
              name="date"
              [invalid]="!!errors()['date']"
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

      <div class="space-y-3">
        @if (tab() === 'income') {
          @for (item of incomes(); track item.id) {
            <div class="premium-list-item clickable" (click)="openDetail(item, 'income')">
              <div class="flex items-center gap-3">
                <div class="premium-list-icon active">
                  <app-icon name="trending-up" [size]="18" />
                </div>
                <div>
                  <p class="amount-lg text-success">{{ amountLabel(item.amount) }} so'm</p>
                  <p class="premium-small premium-muted">
                    {{ categoryLabel(item.category) }} · {{ item.date | date: 'd MMM' }}
                  </p>
                </div>
              </div>
              <button type="button" class="icon-btn" (click)="$event.stopPropagation(); removeIncome(item)">
                <app-icon name="trash-2" [size]="16" />
              </button>
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">Daromadlar yo'q</div>
          }
        } @else {
          @for (item of expenses(); track item.id) {
            <div class="premium-list-item clickable" (click)="openDetail(item, 'expense')">
              <div class="flex items-center gap-3">
                <div class="premium-list-icon">
                  <app-icon [name]="expenseIcon(item.category)" [size]="18" />
                </div>
                <div>
                  <p class="amount-lg text-danger">{{ amountLabel(item.amount) }} so'm</p>
                  <p class="premium-small premium-muted">
                    {{ categoryLabel(item.category) }} · {{ item.date | date: 'd MMM' }}
                  </p>
                </div>
              </div>
              <button type="button" class="icon-btn" (click)="$event.stopPropagation(); removeExpense(item)">
                <app-icon name="trash-2" [size]="16" />
              </button>
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">Xarajatlar yo'q</div>
          }
        }
      </div>
    </section>

    @if (detailItem(); as item) {
      <div class="modal-backdrop" (click)="closeDetail()">
        <div class="detail-modal" (click)="$event.stopPropagation()">
          <h2 class="premium-section-title">
            {{ detailType() === 'income' ? 'Daromad' : 'Xarajat' }}
          </h2>
          <p class="amount-xl" [class.text-success]="detailType() === 'income'" [class.text-danger]="detailType() === 'expense'">
            {{ item.amount | amount }} so'm
          </p>
          <div class="detail-rows">
            <div class="detail-row">
              <span class="premium-muted">Kategoriya</span>
              <span>{{ categoryLabel(item.category) }}</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Sana</span>
              <span>{{ item.date | date: 'd MMMM yyyy' }}</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Izoh</span>
              <span>{{ item.note?.trim() || '—' }}</span>
            </div>
          </div>
          <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeDetail()">
            Yopish
          </button>
        </div>
      </div>
    }

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
        padding: 0;
        cursor: pointer;
        color: var(--color-gold);
        font-size: 14px;
        text-decoration: none;
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

      .clickable { cursor: pointer; }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.72);
      }

      .detail-modal {
        width: 100%;
        max-width: 32rem;
        padding: 24px;
        border-radius: var(--radius-card);
        border: 1px solid var(--color-border);
        background: var(--color-card);
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: calc(80px + env(safe-area-inset-bottom));
      }

      .detail-rows {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 15px;
      }

      .detail-row span:last-child {
        text-align: right;
        max-width: 60%;
        word-break: break-word;
      }
    `,
  ],
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private draftService = inject(TransactionDraftService);

  tab = signal<Tab>('expense');
  showForm = signal(false);
  saving = signal(false);
  submitError = signal('');
  errors = signal<Record<string, string>>({});
  detailItem = signal<IncomeItem | ExpenseItem | null>(null);
  detailType = signal<Tab>('expense');

  incomes = signal<IncomeItem[]>([]);
  expenses = signal<ExpenseItem[]>([]);
  incomeCategories = signal<CategoryItem[]>([]);
  expenseCategories = signal<CategoryItem[]>([]);

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
    this.restoreDraft();
  }

  goToCategories(): void {
    this.draftService.save({
      tab: this.tab(),
      showForm: this.showForm(),
      form: {
        amount: this.form.amount,
        category: this.form.category,
        date: this.form.date,
        note: this.form.note,
      },
    });
    this.router.navigate(['/categories'], {
      queryParams: { from: 'transactions', tab: this.tab() },
    });
  }

  openDetail(item: IncomeItem | ExpenseItem, type: Tab): void {
    this.detailItem.set(item);
    this.detailType.set(type);
  }

  closeDetail(): void {
    this.detailItem.set(null);
  }

  private restoreDraft(): void {
    const draft = this.draftService.consume();
    if (!draft) return;
    this.tab.set(draft.tab);
    this.form = { ...draft.form };
    this.showForm.set(draft.showForm);
    this.loadCategories();
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
    const amount = coerceAmount(this.form.amount);

    if (amount <= 0) {
      errs['amount'] = 'Summani kiriting (masalan: 25 000)';
    }
    if (!this.form.category?.trim()) {
      errs['category'] = 'Kategoriyani tanlang';
    }
    if (!this.form.date?.trim()) {
      errs['date'] = 'Sanani tanlang';
    }

    this.errors.set(errs);
    if (Object.keys(errs).length) {
      this.toast.error(Object.values(errs)[0]);
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    const payload = {
      amount,
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
        this.toast.success(
          this.tab() === 'income'
            ? "Daromad muvaffaqiyatli qo'shildi"
            : "Xarajat muvaffaqiyatli qo'shildi",
        );
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const msg = extractApiError(e);
        this.submitError.set(msg);
        this.toast.error(msg);
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
    this.api.get<IncomeItem[]>('/incomes', { month, year }).subscribe((rows) =>
      this.incomes.set(
        rows.map((row) => ({
          ...row,
          amount: coerceAmount(row.amount),
        })),
      ),
    );
  }

  loadExpenses(): void {
    const { month, year } = currentMonthYear();
    this.api.get<ExpenseItem[]>('/expenses', { month, year }).subscribe((rows) =>
      this.expenses.set(
        rows.map((row) => ({
          ...row,
          amount: coerceAmount(row.amount),
        })),
      ),
    );
  }

  amountLabel(value: unknown): string {
    return coerceAmount(value).toLocaleString('uz-UZ').replace(/\u00a0/g, ' ');
  }

  async removeIncome(item: IncomeItem): Promise<void> {
    const ok = await this.confirm.ask(
      "O'chirishni tasdiqlang",
      `${this.formatItemLabel(item)} daromadini rostdan ham o'chirmoqchimisiz?`,
    );
    if (!ok) return;
    this.api.delete(`/incomes/${item.id}`).subscribe({
      next: () => {
        this.loadIncomes();
        this.toast.success("Daromad muvaffaqiyatli o'chirildi");
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
    });
  }

  async removeExpense(item: ExpenseItem): Promise<void> {
    const ok = await this.confirm.ask(
      "O'chirishni tasdiqlang",
      `${this.formatItemLabel(item)} xarajatini rostdan ham o'chirmoqchimisiz?`,
    );
    if (!ok) return;
    this.api.delete(`/expenses/${item.id}`).subscribe({
      next: () => {
        this.loadExpenses();
        this.toast.success("Xarajat muvaffaqiyatli o'chirildi");
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
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
    const amount = coerceAmount(item.amount);
    return `${this.categoryLabel(item.category)} · ${amount.toLocaleString('uz-UZ')} so'm`;
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
