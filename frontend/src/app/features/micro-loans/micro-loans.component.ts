import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { DecimalInputComponent } from '../../shared/components/decimal-input/decimal-input.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { AmountPipe } from '../../shared/pipes/money.pipe';
import { ToastService } from '../../shared/services/toast.service';
import { addMonthsToDate, coerceAmount, daysUntil, formatMoney } from '../../shared/utils/format.util';
import { extractApiError } from '../../shared/utils/http-error.util';

interface MicroLoanItem {
  id: string;
  provider: string;
  amount: number;
  takenDate: string;
  dueDate: string;
  isPaid: boolean;
}

@Component({
  selector: 'app-micro-loans',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgClass,
    PageHeaderComponent,
    FabComponent,
    IconComponent,
    DecimalInputComponent,
    DateInputComponent,
    AmountPipe,
  ],
  template: `
    <section class="premium-page">
      @if (showForm()) {
        <button type="button" class="form-back" (click)="closeForm()">
          <app-icon name="chevron-left" [size]="18" />
          <span>Orqaga</span>
        </button>
        <h1 class="form-title">{{ editingId() ? 'Mikroqarzni tahrirlash' : 'Yangi mikroqarz' }}</h1>

        <form class="premium-card form-card" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Qayerdan olindi</label>
            <select class="premium-select" [(ngModel)]="form.provider" name="provider">
              @for (p of providers; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
          </div>

          <div class="premium-field">
            <label class="premium-label">Summa</label>
            <app-decimal-input [(ngModel)]="form.amount" name="amount" placeholder="500 000" />
          </div>

          <div class="premium-field">
            <label class="premium-label">Olingan sana</label>
            <app-date-input [(ngModel)]="form.takenDate" name="takenDate" />
            @if (!editingId()) {
              <p class="field-hint">Qaytarish sanasi avtomatik 1 oy keyin belgilanadi</p>
            }
          </div>

          @if (editingId()) {
            <div class="premium-field">
              <label class="premium-label">Qaytarish sanasi</label>
              <app-date-input [(ngModel)]="form.dueDate" name="dueDate" />
            </div>
          }

          <div class="premium-grid-2 form-actions">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeForm()">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">
              {{ editingId() ? 'Yangilash' : 'Saqlash' }}
            </button>
          </div>
        </form>
      } @else {
        <app-page-header title="Mikroqarz" subtitle="Uzum, Alif va boshqa xizmatlar" />

        <div class="space-y-3">
          @for (loan of items(); track loan.id) {
            <div
              class="premium-card premium-card-accent clickable"
              [class.card-completed]="loan.isPaid"
              (click)="openDetail(loan)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="premium-list-icon" [class.active]="!loan.isPaid" [class.completed]="loan.isPaid">
                    @if (loan.isPaid) {
                      <app-icon name="circle-check" [size]="18" />
                    } @else {
                      <app-icon name="wallet" [size]="18" />
                    }
                  </div>
                  <div>
                    <p class="premium-body">{{ providerLabel(loan.provider) }}</p>
                    <p class="amount-md" [class.text-success]="loan.isPaid" [class.text-danger]="!loan.isPaid">
                      {{ loan.amount | amount }} so'm
                    </p>
                  </div>
                </div>
                @if (!loan.isPaid) {
                  <span class="premium-chip" [ngClass]="urgencyClass(loan.dueDate)">
                    {{ urgency(loan.dueDate) }}
                  </span>
                } @else {
                  <span class="premium-chip premium-chip-success">Yopilgan</span>
                }
              </div>
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">Mikroqarzlar yo'q. + tugmasini bosing.</div>
          }
        </div>
      }
    </section>

    @if (!showForm()) {
      <app-fab (clicked)="openForm()" />
    }

    @if (detailItem(); as loan) {
      <div class="modal-backdrop" (click)="closeDetail()">
        <div class="detail-modal" (click)="$event.stopPropagation()">
          <h2 class="premium-section-title">{{ providerLabel(loan.provider) }}</h2>
          <p class="amount-xl" [class.text-success]="loan.isPaid" [class.text-danger]="!loan.isPaid">
            {{ loan.amount | amount }} so'm
          </p>

          <div class="detail-rows">
            <div class="detail-row">
              <span class="premium-muted">Olingan sana</span>
              <span>{{ loan.takenDate | date: 'd MMMM yyyy' }}</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Qaytarish sanasi</span>
              <span>{{ loan.dueDate | date: 'd MMMM yyyy' }}</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Holat</span>
              <span [class.text-success]="loan.isPaid">{{ loan.isPaid ? 'Yopilgan' : urgency(loan.dueDate) }}</span>
            </div>
          </div>

          @if (!loan.isPaid) {
            <button type="button" class="premium-btn premium-btn-primary premium-btn-block" (click)="markPaid(loan.id)">
              To'landi deb belgilash
            </button>
          }

          <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="editFromDetail()">
            Tahrirlash
          </button>
          <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeDetail()">
            Yopish
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .space-y-3 > * + * { margin-top: 12px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .gap-3 { gap: 12px; }
      .clickable { cursor: pointer; }

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

      .field-hint {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--color-muted);
      }

      .amount-md { font-size: 18px; font-weight: 600; }
      .amount-xl { font-size: 32px; font-weight: 600; }
      .text-success { color: var(--color-success); }
      .text-danger { color: var(--color-danger); }

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

      .detail-rows { display: flex; flex-direction: column; gap: 12px; }

      .detail-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 15px;
      }

      .detail-row span:last-child {
        text-align: right;
        max-width: 58%;
      }
    `,
  ],
})
export class MicroLoansComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<MicroLoanItem[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  detailItem = signal<MicroLoanItem | null>(null);

  providers = [
    { value: 'UZUM', label: 'Uzum Nasiya' },
    { value: 'ALIF', label: 'Alif Nasiya' },
    { value: 'YANGI', label: 'Yangi Bank' },
    { value: 'PAYME', label: 'Payme Nasiya' },
    { value: 'OTHER', label: 'Boshqa' },
  ];

  form = {
    provider: 'UZUM',
    amount: null as number | null,
    takenDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
  };

  ngOnInit(): void {
    this.load();
  }

  openForm(): void {
    this.editingId.set(null);
    this.form = {
      provider: 'UZUM',
      amount: null,
      takenDate: new Date().toISOString().slice(0, 10),
      dueDate: addMonthsToDate(new Date().toISOString().slice(0, 10), 1),
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  openDetail(loan: MicroLoanItem): void {
    this.detailItem.set(loan);
  }

  closeDetail(): void {
    this.detailItem.set(null);
  }

  editFromDetail(): void {
    const loan = this.detailItem();
    if (!loan) return;

    this.editingId.set(loan.id);
    this.form = {
      provider: loan.provider,
      amount: loan.amount,
      takenDate: loan.takenDate.slice(0, 10),
      dueDate: loan.dueDate.slice(0, 10),
    };
    this.closeDetail();
    this.showForm.set(true);
  }

  providerLabel(code: string): string {
    return this.providers.find((p) => p.value === code)?.label ?? code;
  }

  load(): void {
    this.api.get<MicroLoanItem[]>('/micro-loans').subscribe((rows) =>
      this.items.set(
        rows.map((row) => ({
          ...row,
          amount: coerceAmount(row.amount),
          isPaid: !!row.isPaid,
        })),
      ),
    );
  }

  daysLeft(d: string): number {
    return daysUntil(d);
  }

  urgency(d: string): string {
    const days = daysUntil(d);
    if (days < 0) return 'Muddati o\'tgan';
    if (days === 0) return 'Bugun';
    if (days === 1) return 'Ertaga';
    return `${days} kun qoldi`;
  }

  urgencyClass(d: string): Record<string, boolean> {
    const days = daysUntil(d);
    return {
      'premium-chip-danger': days <= 1,
      'premium-chip-warning': days > 1 && days <= 7,
    };
  }

  submit(): void {
    const amount = coerceAmount(this.form.amount);
    if (amount <= 0) {
      this.toast.error('Summani kiriting');
      return;
    }

    const editingId = this.editingId();
    const payload = editingId
      ? {
          provider: this.form.provider,
          amount: Math.round(amount * 100) / 100,
          takenDate: this.form.takenDate,
          dueDate: this.form.dueDate,
        }
      : {
          provider: this.form.provider,
          amount: Math.round(amount * 100) / 100,
          takenDate: this.form.takenDate,
          dueDate: addMonthsToDate(this.form.takenDate, 1),
        };

    const req = editingId
      ? this.api.patch(`/micro-loans/${editingId}`, payload)
      : this.api.post('/micro-loans', payload);

    req.subscribe({
      next: () => {
        this.closeForm();
        this.load();
        this.toast.success(editingId ? 'Mikroqarz yangilandi' : "Mikroqarz qo'shildi");
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
    });
  }

  markPaid(id: string): void {
    this.api.patch(`/micro-loans/${id}`, { isPaid: true }).subscribe({
      next: () => {
        this.closeDetail();
        this.load();
        this.toast.success('Mikroqarz yopildi');
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
    });
  }
}
