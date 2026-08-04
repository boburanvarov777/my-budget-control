import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { DecimalInputComponent } from '../../shared/components/decimal-input/decimal-input.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { MonthIndicatorComponent } from '../../shared/components/month-indicator/month-indicator.component';
import { AmountPipe } from '../../shared/pipes/money.pipe';
import { ToastService } from '../../shared/services/toast.service';
import {
  calcAnnualInterestRate,
  coerceAmount,
  creditPaidMonths,
  creditRemainingMonths,
  formatMoney,
  parseDecimal,
  sanitizeDecimalInput,
} from '../../shared/utils/format.util';

interface CreditItem {
  id: string;
  name: string;
  totalAmount: number;
  downPayment?: number;
  interestRate: number;
  months: number;
  startDate: string;
  monthlyPayment: number;
  remainingDebt: number;
  nextPaymentDate?: string | null;
  status: string;
}

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgClass,
    DecimalInputComponent,
    DateInputComponent,
    PageHeaderComponent,
    FabComponent,
    IconComponent,
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
        <h1 class="form-title">Yangi kredit</h1>

        <form class="premium-card form-card" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Boshlang'ich to'lov <span class="optional">(ixtiyoriy)</span></label>
            <app-decimal-input
              [(ngModel)]="form.downPayment"
              name="downPayment"
              placeholder="Masalan: 2 000 000"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Nomi</label>
            <input class="premium-input" placeholder="Masalan: Ipoteka" [(ngModel)]="form.name" name="name" required />
          </div>

          <div class="premium-field">
            <label class="premium-label">Kredit summasi</label>
            <app-decimal-input
              [(ngModel)]="form.totalAmount"
              name="totalAmount"
              placeholder="10 000 000.50"
              (ngModelChange)="onCreditFieldsChange()"
            />
          </div>

          <div class="field-spacer"></div>

          <div class="premium-field">
            <label class="premium-label">Oylar soni</label>
            <input
              class="premium-input"
              type="number"
              min="1"
              [(ngModel)]="form.months"
              name="months"
              (ngModelChange)="onCreditFieldsChange()"
              required
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Oyiga to'lov</label>
            <app-decimal-input
              [(ngModel)]="form.monthlyPayment"
              name="monthlyPayment"
              placeholder="850 000.25"
              (ngModelChange)="onCreditFieldsChange()"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Foiz % (yillik)</label>
            <input
              class="premium-input"
              inputmode="decimal"
              [ngModel]="interestDisplay()"
              (ngModelChange)="onInterestInput($event)"
              name="interestRate"
              placeholder="Avtomatik hisoblanadi"
            />
            @if (interestAuto()) {
              <p class="field-hint">Jami summa, oylar va oy to'lovidan avtomatik hisoblandi</p>
            } @else {
              <p class="field-hint">Qo'lda kiritildi — summa yoki oylar o'zgarsa avtomatik qayta hisoblanadi</p>
            }
          </div>

          <div class="premium-field">
            <label class="premium-label">Boshlanish sanasi</label>
            <app-date-input [(ngModel)]="form.startDate" name="startDate" />
          </div>

          <div class="premium-grid-2 form-actions">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeForm()">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">Saqlash</button>
          </div>
        </form>
      } @else {
        <app-page-header title="Kreditlar" subtitle="Bank kreditlari va to'lovlar" />

        <div class="space-y-3">
          @for (c of items(); track c.id) {
            <div class="premium-card premium-card-accent clickable" (click)="openDetail(c)">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="premium-list-icon active">
                    <app-icon name="credit-card" [size]="18" />
                  </div>
                  <div>
                    <p class="premium-body">{{ c.name }}</p>
                    <p class="premium-small premium-muted">Oyiga {{ format(c.monthlyPayment) }}</p>
                  </div>
                </div>
                <span class="premium-chip" [ngClass]="statusClass(c.status)">{{ c.status }}</span>
              </div>
              <app-month-indicator
                [total]="c.months"
                [paid]="paidMonths(c)"
                [showLegend]="true"
              />
            </div>
          } @empty {
            <div class="premium-card premium-muted premium-small">Kreditlar yo'q</div>
          }
        </div>
      }
    </section>

    @if (!showForm()) {
      <app-fab (clicked)="openForm()" />
    }

    @if (detailItem(); as c) {
      <div class="modal-backdrop" (click)="closeDetail()">
        <div class="detail-modal" (click)="$event.stopPropagation()">
          <h2 class="premium-section-title">{{ c.name }}</h2>

          <app-month-indicator
            [total]="c.months"
            [paid]="paidMonths(c)"
            [showLegend]="false"
          />

          <div class="detail-rows">
            <div class="detail-row">
              <span class="premium-muted">Kredit summasi</span>
              <span>{{ c.totalAmount | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Boshlang'ich to'lov</span>
              <span>{{ (c.downPayment ?? 0) | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Oyiga to'lov</span>
              <span>{{ c.monthlyPayment | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Foiz (yillik)</span>
              <span>{{ coerceAmount(c.interestRate) }}%</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">To'langan oylar</span>
              <span class="text-success">{{ paidMonths(c) }} oy</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Qolgan oylar</span>
              <span>{{ remainingMonths(c) }} oy</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Qolgan qarz</span>
              <span class="text-danger">{{ c.remainingDebt | amount }} so'm</span>
            </div>
            <div class="detail-row">
              <span class="premium-muted">Boshlangan sana</span>
              <span>{{ c.startDate | date: 'd MMMM yyyy' }}</span>
            </div>
            @if (c.nextPaymentDate) {
              <div class="detail-row">
                <span class="premium-muted">Keyingi to'lov</span>
                <span>{{ c.nextPaymentDate | date: 'd MMMM yyyy' }}</span>
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
      .justify-between { justify-content: space-between; }
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .clickable { cursor: pointer; }

      .field-hint {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--color-muted);
      }

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
      .text-danger { color: var(--color-danger); }
    `,
  ],
})
export class CreditsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<CreditItem[]>([]);
  showForm = signal(false);
  detailItem = signal<CreditItem | null>(null);
  interestManual = signal(false);
  interestAuto = signal(false);
  format = formatMoney;
  coerceAmount = coerceAmount;
  paidMonths = creditPaidMonths;
  remainingMonths = creditRemainingMonths;

  form = {
    downPayment: null as number | null,
    name: '',
    totalAmount: null as number | null,
    interestRate: null as number | null,
    months: 12,
    startDate: new Date().toISOString().slice(0, 10),
    monthlyPayment: null as number | null,
  };

  ngOnInit(): void {
    this.load();
  }

  openForm(): void {
    this.interestManual.set(false);
    this.interestAuto.set(false);
    this.form = {
      downPayment: null,
      name: '',
      totalAmount: null,
      interestRate: null,
      months: 12,
      startDate: new Date().toISOString().slice(0, 10),
      monthlyPayment: null,
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  openDetail(item: CreditItem): void {
    this.detailItem.set(item);
  }

  closeDetail(): void {
    this.detailItem.set(null);
  }

  interestDisplay(): string {
    const rate = this.form.interestRate;
    if (rate == null || !Number.isFinite(rate)) return '';
    return String(rate);
  }

  onInterestInput(value: string): void {
    this.interestManual.set(true);
    this.interestAuto.set(false);
    const sanitized = sanitizeDecimalInput(value, 2);
    this.form.interestRate = parseDecimal(sanitized, 2);
  }

  onCreditFieldsChange(): void {
    this.interestManual.set(false);

    const principal = coerceAmount(this.form.totalAmount);
    const monthlyPayment = coerceAmount(this.form.monthlyPayment);
    const months = Number(this.form.months);

    if (principal <= 0 || monthlyPayment <= 0 || months <= 0) {
      this.interestAuto.set(false);
      this.form.interestRate = null;
      return;
    }

    this.form.interestRate = calcAnnualInterestRate(principal, monthlyPayment, months);
    this.interestAuto.set(true);
  }

  load(): void {
    this.api.get<CreditItem[]>('/credits').subscribe((rows) =>
      this.items.set(
        rows.map((row) => ({
          ...row,
          totalAmount: coerceAmount(row.totalAmount),
          downPayment: coerceAmount(row.downPayment),
          monthlyPayment: coerceAmount(row.monthlyPayment),
          remainingDebt: coerceAmount(row.remainingDebt),
          interestRate: coerceAmount(row.interestRate),
          months: Number(row.months) || 0,
        })),
      ),
    );
  }

  statusClass(status: string): Record<string, boolean> {
    return {
      'premium-chip-success': status === 'PAID',
      'premium-chip-danger': status === 'OVERDUE',
      'premium-chip-warning': status !== 'PAID' && status !== 'OVERDUE',
    };
  }

  submit(): void {
    const totalAmount = coerceAmount(this.form.totalAmount);
    const monthlyPayment = coerceAmount(this.form.monthlyPayment);
    const downPayment = coerceAmount(this.form.downPayment);
    const months = Number(this.form.months);

    if (!this.form.name?.trim() || totalAmount <= 0 || monthlyPayment <= 0 || months <= 0) {
      this.toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    const interestRate = this.interestManual()
      ? coerceAmount(this.form.interestRate)
      : calcAnnualInterestRate(totalAmount, monthlyPayment, months);

    this.api
      .post('/credits', {
        name: this.form.name.trim(),
        totalAmount: Math.round(totalAmount * 100) / 100,
        downPayment: Math.round(downPayment * 100) / 100,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        months,
        startDate: this.form.startDate,
        interestRate: Math.round(interestRate * 100) / 100,
      })
      .subscribe({
        next: () => {
          this.closeForm();
          this.load();
          this.toast.success("Kredit muvaffaqiyatli qo'shildi");
        },
        error: () => this.toast.error('Saqlashda xatolik'),
      });
  }
}
