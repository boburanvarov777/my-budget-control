import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { DecimalInputComponent } from '../../shared/components/decimal-input/decimal-input.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { MonthIndicatorComponent } from '../../shared/components/month-indicator/month-indicator.component';
import { AmountPipe } from '../../shared/pipes/money.pipe';
import { ToastService } from '../../shared/services/toast.service';
import { coerceAmount, formatMoney } from '../../shared/utils/format.util';
import { extractApiError } from '../../shared/utils/http-error.util';

interface InstallmentItem {
  id: string;
  name: string;
  totalAmount: number;
  downPayment?: number;
  monthlyPayment: number;
  totalMonths: number;
  paidMonths: number;
  startDate: string;
  nextPaymentDate?: string | null;
}

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    PageHeaderComponent,
    FabComponent,
    IconComponent,
    DecimalInputComponent,
    DateInputComponent,
    MonthIndicatorComponent,
    AmountPipe,
  ],
  template: `
    <section class="premium-page">
      @if (showForm()) {
        <button type="button" class="form-back" (click)="closeForm()">
          <app-icon name="chevron-left" [size]="20" />
          Nazad
        </button>
        <h1 class="form-title">Yangi muddatli to'lov</h1>

        <form class="premium-card form-card" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Boshlang'ich to'lov <span class="optional">(ixtiyoriy)</span></label>
            <app-decimal-input
              [(ngModel)]="form.downPayment"
              name="downPayment"
              placeholder="Masalan: 500 000"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Nomi</label>
            <input
              class="premium-input"
              placeholder="Masalan: iPhone 17 Pro Max"
              [(ngModel)]="form.name"
              name="name"
              required
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Jami summa</label>
            <app-decimal-input
              [(ngModel)]="form.totalAmount"
              name="totalAmount"
              placeholder="12 000 000"
            />
          </div>

          <div class="field-spacer"></div>

          <div class="premium-field">
            <label class="premium-label">Oylar soni</label>
            <input
              class="premium-input"
              type="number"
              min="1"
              [(ngModel)]="form.totalMonths"
              name="totalMonths"
              required
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Oyiga to'lov</label>
            <app-decimal-input
              [(ngModel)]="form.monthlyPayment"
              name="monthlyPayment"
              placeholder="1 500 000.50"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Boshlanish sanasi</label>
            <app-date-input [(ngModel)]="form.startDate" name="startDate" />
          </div>

          <div class="premium-grid-2 form-actions">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeForm()">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">Qo'shish</button>
          </div>
        </form>
      } @else {
        <app-page-header title="Muddatli to'lov" subtitle="Telefon va jihozlar bo'lib to'lash" />

        <div class="space-y-3">
          @for (item of items(); track item.id) {
            <div class="premium-card premium-card-accent clickable" (click)="openDetail(item)">
              <div class="flex items-center gap-3 mb-3">
                <div class="premium-list-icon active">
                  <app-icon name="smartphone" [size]="18" />
                </div>
                <div class="flex-1">
                  <p class="premium-body">{{ item.name }}</p>
                  <p class="premium-small premium-muted">Oyiga {{ format(item.monthlyPayment) }}</p>
                </div>
              </div>
              <app-month-indicator
                [total]="item.totalMonths"
                [paid]="item.paidMonths"
                [showLegend]="true"
              />
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">
              Muddatli to'lovlar yo'q. + tugmasini bosing.
            </div>
          }
        </div>
      }
    </section>

    @if (!showForm()) {
      <app-fab (clicked)="openForm()" />
    }

    @if (detailItem(); as item) {
      <div class="modal-backdrop" (click)="closeDetail()">
        <div class="detail-modal" (click)="$event.stopPropagation()">
          <h2 class="premium-section-title">{{ item.name }}</h2>

          <app-month-indicator
            [total]="item.totalMonths"
            [paid]="item.paidMonths"
            [showLegend]="false"
          />

          <div class="detail-rows">
            <div class="detail-row">
              <span class="premium-muted">Jami summa</span>
              <span>{{ item.totalAmount | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Boshlang'ich to'lov</span>
              <span>{{ (item.downPayment ?? 0) | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Oyiga to'lov</span>
              <span>{{ item.monthlyPayment | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">To'langan oylar</span>
              <span class="text-success">{{ item.paidMonths }} oy</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Qolgan oylar</span>
              <span>{{ remainingMonths(item) }} oy</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Boshlangan sana</span>
              <span>{{ item.startDate | date: 'd MMMM yyyy' }}</span>
            </div>
            @if (item.nextPaymentDate) {
              <div class="detail-row">
                <span class="premium-muted">Keyingi to'lov</span>
                <span>{{ item.nextPaymentDate | date: 'd MMMM yyyy' }}</span>
              </div>
            }
          </div>

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
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .flex-1 { flex: 1; }
      .clickable { cursor: pointer; }

      .form-back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 12px;
        padding: 0;
        border: none;
        background: none;
        color: var(--color-gold);
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
      }

      .form-title {
        margin: 0 0 16px;
        font-size: 22px;
        font-weight: 600;
      }

      .form-card > * + * { margin-top: 16px; }

      .field-spacer { height: 8px; }

      .optional {
        font-weight: 400;
        color: var(--color-muted);
        font-size: 13px;
      }

      .form-actions { margin-top: 8px; }

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
        max-width: 58%;
        word-break: break-word;
      }

      .text-success { color: var(--color-success); }
    `,
  ],
})
export class InstallmentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<InstallmentItem[]>([]);
  showForm = signal(false);
  detailItem = signal<InstallmentItem | null>(null);
  format = formatMoney;

  form = {
    downPayment: null as number | null,
    name: '',
    totalAmount: null as number | null,
    monthlyPayment: null as number | null,
    totalMonths: 6,
    startDate: new Date().toISOString().slice(0, 10),
  };

  ngOnInit(): void {
    this.load();
  }

  openForm(): void {
    this.form = {
      downPayment: null,
      name: '',
      totalAmount: null,
      monthlyPayment: null,
      totalMonths: 6,
      startDate: new Date().toISOString().slice(0, 10),
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  openDetail(item: InstallmentItem): void {
    this.detailItem.set(item);
  }

  closeDetail(): void {
    this.detailItem.set(null);
  }

  remainingMonths(item: InstallmentItem): number {
    return Math.max(0, item.totalMonths - item.paidMonths);
  }

  load(): void {
    this.api.get<InstallmentItem[]>('/installments').subscribe((rows) =>
      this.items.set(
        rows.map((row) => ({
          ...row,
          totalAmount: coerceAmount(row.totalAmount),
          downPayment: coerceAmount(row.downPayment),
          monthlyPayment: coerceAmount(row.monthlyPayment),
          paidMonths: Number(row.paidMonths) || 0,
          totalMonths: Number(row.totalMonths) || 0,
        })),
      ),
    );
  }

  submit(): void {
    const totalAmount = coerceAmount(this.form.totalAmount);
    const monthlyPayment = coerceAmount(this.form.monthlyPayment);
    const downPayment = coerceAmount(this.form.downPayment);
    const totalMonths = Number(this.form.totalMonths);

    if (!this.form.name?.trim() || totalAmount <= 0 || monthlyPayment <= 0 || totalMonths <= 0) {
      this.toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    this.api
      .post('/installments', {
        name: this.form.name.trim(),
        totalAmount: Math.round(totalAmount * 100) / 100,
        downPayment: Math.round(downPayment * 100) / 100,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalMonths,
        startDate: this.form.startDate,
      })
      .subscribe({
        next: () => {
          this.closeForm();
          this.load();
          this.toast.success("Muddatli to'lov qo'shildi");
        },
        error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
      });
  }
}
