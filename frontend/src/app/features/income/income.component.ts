import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/services/toast.service';
import { currentMonthYear } from '../../shared/utils/format.util';
import { extractApiError } from '../../shared/utils/http-error.util';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { NoteInputComponent } from '../../shared/components/note-input/note-input.component';
import { AmountPipe } from '../../shared/pipes/money.pipe';

interface Income {
  id: string;
  amount: number;
  date: string;
  category: string;
  note?: string;
}

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyInputComponent, DateInputComponent, NoteInputComponent, AmountPipe],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Daromad</h1>

      <form class="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" (ngSubmit)="submit()">
        <app-currency-input [(ngModel)]="form.amount" name="amount" placeholder="300 000" />
        <app-date-input [(ngModel)]="form.date" name="date" />
        <select class="field" [(ngModel)]="form.category" name="category">
          @for (c of categories; track c.value) {
            <option [value]="c.value">{{ c.label }}</option>
          }
        </select>
        <app-note-input [(ngModel)]="form.note" name="note" placeholder="Izoh" />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      <div class="space-y-2">
        @for (item of items(); track item.id) {
          <div class="item-row">
            <div>
              <p class="font-medium text-success">{{ item.amount | amount }} so'm</p>
              <p class="text-xs text-muted">{{ item.category }} · {{ item.date | date: 'd MMM' }}</p>
            </div>
            <button type="button" class="text-danger text-sm" (click)="remove(item.id)">×</button>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .border-border {
        border-color: var(--color-border);
      }
      .bg-surface-2 {
        background: var(--color-surface-2);
      }
      .text-muted {
        color: var(--color-muted);
      }
      .text-success {
        color: var(--color-success);
      }
      .text-danger {
        color: var(--color-danger);
      }
      .field {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--color-border);
        background: var(--color-bg);
        color: var(--color-text);
        padding: 0.75rem 1rem;
      }
      .btn-primary {
        width: 100%;
        border-radius: 12px;
        background: var(--color-accent);
        color: white;
        padding: 0.75rem;
        border: none;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 16px;
        border: 1px solid var(--color-border);
        background: var(--color-surface-2);
        padding: 0.875rem 1rem;
      }
    `,
  ],
})
export class IncomeComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  items = signal<Income[]>([]);

  categories = [
    { value: 'SALARY', label: 'Ish haqi' },
    { value: 'BONUS', label: 'Bonus' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'SALE', label: 'Sotuv' },
    { value: 'OTHER', label: 'Boshqa' },
  ];

  form = {
    amount: null as number | null,
    date: new Date().toISOString().slice(0, 10),
    category: 'SALARY',
    note: '',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const { month, year } = currentMonthYear();
    this.api.get<Income[]>('/incomes', { month, year }).subscribe((res) => this.items.set(res));
  }

  submit(): void {
    if (!this.form.amount) {
      this.toast.error('Summani kiriting');
      return;
    }
    this.api
      .post('/incomes', {
        amount: this.form.amount,
        date: this.form.date,
        category: this.form.category,
        note: this.form.note || undefined,
      })
      .subscribe({
        next: () => {
          this.form.amount = null;
          this.form.note = '';
          this.load();
          this.toast.success("Daromad muvaffaqiyatli qo'shildi");
        },
        error: (e) => this.toast.error(extractApiError(e)),
      });
  }

  remove(id: string): void {
    this.api.delete(`/incomes/${id}`).subscribe({
      next: () => {
        this.load();
        this.toast.success("Daromad muvaffaqiyatli o'chirildi");
      },
      error: (e) => this.toast.error(extractApiError(e)),
    });
  }
}
