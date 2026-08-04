import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { NoteInputComponent } from '../../shared/components/note-input/note-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { AmountPipe } from '../../shared/pipes/money.pipe';
import { coerceAmount, formatMoney } from '../../shared/utils/format.util';
import { extractApiError } from '../../shared/utils/http-error.util';

interface SavingItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  note?: string | null;
}

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    IconComponent,
    CurrencyInputComponent,
    NoteInputComponent,
    PageHeaderComponent,
    FabComponent,
    AmountPipe,
  ],
  template: `
    <section class="premium-page">
      @if (showForm()) {
        <button type="button" class="form-back" (click)="closeForm()">
          <app-icon name="chevron-left" [size]="18" />
          <span>Orqaga</span>
        </button>
        <h1 class="form-title">Jamg'arma qo'shish</h1>

        <form class="premium-card form-card" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Summa</label>
            <app-currency-input [(ngModel)]="form.amount" name="amount" placeholder="500 000" />
          </div>
          <div class="premium-field">
            <label class="premium-label">Nomi</label>
            <input class="premium-input" placeholder="Masalan: Zaxira fond" [(ngModel)]="form.name" name="name" />
          </div>
          <div class="premium-field">
            <label class="premium-label">Izoh</label>
            <app-note-input [(ngModel)]="form.note" name="note" placeholder="Ixtiyoriy" />
          </div>
          <div class="premium-grid-2 form-actions">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeForm()">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">Saqlash</button>
          </div>
        </form>
      } @else {
        <app-page-header
          title="Jamg'arma"
          subtitle="Tejagan pulingizni alohida kuzatib boring"
        />

        <div class="premium-card-hero premium-card-accent">
          <div class="hero-row">
            <app-icon name="piggy-bank" [size]="20" class="text-gold" />
            <span class="premium-caption">Jami jamg'arma</span>
          </div>
          <p class="amount-xl text-gold">{{ total() | amount }} so'm</p>
        </div>

        <div class="info-box">
          <p class="info-title">Nega kerak?</p>
          <p class="premium-small premium-muted">
            Jamg'arma — kutilmagan xarajatlar, maqsadlar va tinchlik uchun pulingiz.
            Har bir qo'shimcha kirim shu yerda ko'rinadi, dashboard balansingiz aniqroq bo'ladi.
          </p>
        </div>

        <div class="space-y-3">
          @for (item of items(); track item.id) {
            <div class="premium-card premium-card-accent">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="premium-list-icon active">
                    <app-icon name="wallet" [size]="18" />
                  </div>
                  <div class="min-w-0">
                    <p class="premium-body">{{ item.name }}</p>
                    <p class="amount-md text-success">{{ item.amount | amount }} so'm</p>
                    <p class="premium-small premium-muted">{{ item.date | date: 'd MMMM yyyy' }}</p>
                    @if (item.note?.trim()) {
                      <p class="note-preview">{{ item.note }}</p>
                    }
                  </div>
                </div>
                <button type="button" class="icon-btn" (click)="remove(item)">
                  <app-icon name="trash-2" [size]="16" />
                </button>
              </div>
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">
              Hali jamg'arma yo'q. + tugmasini bosing.
            </div>
          }
        </div>
      }
    </section>

    @if (!showForm()) {
      <app-fab (clicked)="openForm()" />
    }
  `,
  styles: [
    `
      .form-back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 16px;
        padding: 8px 0;
        border: none;
        background: none;
        color: var(--color-text);
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
      }

      .form-back:hover { color: var(--color-gold); }

      .form-title { margin: 0 0 16px; font-size: 22px; font-weight: 600; }
      .form-card > * + * { margin-top: 16px; }
      .form-actions { margin-top: 8px; }

      .hero-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .info-box {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(212, 175, 55, 0.25);
        background: var(--color-gold-soft);
      }

      .info-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-gold);
      }

      .space-y-3 > * + * { margin-top: 12px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .gap-3 { gap: 12px; }
      .min-w-0 { min-width: 0; }

      .amount-md { font-size: 18px; font-weight: 600; }

      .note-preview {
        margin: 6px 0 0;
        font-size: 13px;
        color: var(--color-muted);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--color-muted-2);
        cursor: pointer;
      }

      .icon-btn:hover { color: var(--color-danger); }

      .text-success { color: var(--color-success); }
    `,
  ],
})
export class SavingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  items = signal<SavingItem[]>([]);
  total = signal(0);
  showForm = signal(false);
  format = formatMoney;

  form = { amount: null as number | null, name: "Jamg'arma", note: '' };

  ngOnInit(): void {
    this.load();
  }

  openForm(): void {
    this.form = { amount: null, name: "Jamg'arma", note: '' };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  load(): void {
    this.api.get<SavingItem[]>('/savings').subscribe((rows) =>
      this.items.set(
        rows.map((row) => ({
          ...row,
          amount: coerceAmount(row.amount),
        })),
      ),
    );
    this.api.get<{ total: number }>('/savings/total').subscribe((r) =>
      this.total.set(coerceAmount(r.total)),
    );
  }

  submit(): void {
    const amount = coerceAmount(this.form.amount);
    if (amount <= 0) {
      this.toast.error('Summani kiriting');
      return;
    }

    this.api
      .post('/savings', {
        name: this.form.name?.trim() || "Jamg'arma",
        amount: Math.round(amount * 100) / 100,
        note: this.form.note?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.closeForm();
          this.load();
          this.toast.success("Jamg'arma qo'shildi");
        },
        error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
      });
  }

  async remove(item: SavingItem): Promise<void> {
    const ok = await this.confirm.ask("Jamg'armani o'chirish", `${item.name} — o'chirilsinmi?`);
    if (!ok) return;

    this.api.delete(`/savings/${item.id}`).subscribe({
      next: () => {
        this.load();
        this.toast.success("Jamg'arma o'chirildi");
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
    });
  }
}
