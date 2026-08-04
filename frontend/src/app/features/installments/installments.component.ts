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
import { coerceAmount, calcInstallmentMarkupPercent, formatMoney, monthsElapsedSince } from '../../shared/utils/format.util';
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
          <app-icon name="chevron-left" [size]="18" />
          <span>Orqaga</span>
        </button>
        <h1 class="form-title">{{ formTitle() }}</h1>

        <form class="premium-card form-card" (ngSubmit)="submit()">
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
            <label class="premium-label">Tan narxi</label>
            <app-decimal-input
              [(ngModel)]="form.totalAmount"
              name="totalAmount"
              placeholder="12 000 000"
              (ngModelChange)="onPricingChange()"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Boshlang'ich to'lov <span class="optional">(ixtiyoriy)</span></label>
            <app-decimal-input
              [(ngModel)]="form.downPayment"
              name="downPayment"
              placeholder="Masalan: 500 000"
              (ngModelChange)="onPricingChange()"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Oylar soni</label>
            <input
              class="premium-input"
              type="number"
              min="1"
              [(ngModel)]="form.totalMonths"
              name="totalMonths"
              (ngModelChange)="onPricingChange()"
              required
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Oyiga to'lov</label>
            <app-decimal-input
              [(ngModel)]="form.monthlyPayment"
              name="monthlyPayment"
              placeholder="1 500 000.50"
              (ngModelChange)="onPricingChange()"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Boshlanish sanasi</label>
            <app-date-input
              [(ngModel)]="form.startDate"
              name="startDate"
              (ngModelChange)="onStartDateChange()"
            />
          </div>

          <div class="premium-field">
            <label class="premium-label">Allaqachon to'langan oylar</label>
            <input
              class="premium-input"
              type="number"
              min="0"
              [max]="form.totalMonths"
              [(ngModel)]="form.paidMonths"
              name="paidMonths"
              (ngModelChange)="onPaidMonthsManual()"
            />
            @if (suggestedPaidMonths() != null) {
              <p class="field-hint">
                Boshlanish sanasidan: {{ suggestedPaidMonths() }} oy —
                <button type="button" class="link-btn" (click)="applySuggestedPaidMonths()">qo'llash</button>
              </p>
            }
          </div>

          @if (markupPercent() != null) {
            <div class="markup-box">
              <span class="premium-muted">Ustama (foiz)</span>
              <span class="markup-value">{{ markupPercent() }}%</span>
            </div>
          }

          <div class="premium-grid-2 form-actions">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="closeForm()">
              Bekor
            </button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">
              {{ submitLabel() }}
            </button>
          </div>
        </form>
      } @else {
        <app-page-header title="Muddatli to'lov" subtitle="Telefon va jihozlar bo'lib to'lash" />

        <div class="space-y-3">
          @for (item of items(); track item.id) {
            <div
              class="premium-card premium-card-accent clickable"
              [class.card-completed]="isComplete(item)"
              (click)="openDetail(item)"
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="premium-list-icon" [class.active]="!isComplete(item)" [class.completed]="isComplete(item)">
                  @if (isComplete(item)) {
                    <app-icon name="circle-check" [size]="18" />
                  } @else {
                    <app-icon name="smartphone" [size]="18" />
                  }
                </div>
                <div class="flex-1">
                  <p class="premium-body">{{ item.name }}</p>
                  <p class="premium-small premium-muted">Oyiga {{ format(item.monthlyPayment) }}</p>
                </div>
                @if (isComplete(item)) {
                  <span class="premium-chip premium-chip-success">Yopilgan</span>
                }
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
              <span class="premium-muted">Tan narxi</span>
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
            @if (itemMarkup(item) != null) {
              <div class="detail-row">
                <span class="premium-muted">Ustama (foiz)</span>
                <span>{{ itemMarkup(item) }}%</span>
              </div>
            }
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

          <button type="button" class="premium-btn premium-btn-primary premium-btn-block" (click)="editFromDetail()">
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
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .flex-1 { flex: 1; }
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
        transition: color var(--transition);
      }

      .form-back:hover {
        color: var(--color-gold);
      }

      .form-back span {
        letter-spacing: -0.01em;
      }

      .form-title {
        margin: 0 0 16px;
        font-size: 22px;
        font-weight: 600;
      }

      .form-card > * + * { margin-top: 16px; }

      .optional {
        font-weight: 400;
        color: var(--color-muted);
        font-size: 13px;
      }

      .form-actions { margin-top: 8px; }

      .markup-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid rgba(212, 175, 55, 0.35);
        background: var(--color-gold-soft);
      }

      .markup-value {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-gold);
      }

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

      .field-hint {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--color-muted);
      }

      .link-btn {
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        color: var(--color-gold);
        font-size: inherit;
        text-decoration: underline;
      }
    `,
  ],
})
export class InstallmentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<InstallmentItem[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  detailItem = signal<InstallmentItem | null>(null);
  markupPercent = signal<number | null>(null);
  paidMonthsManual = signal(false);
  suggestedPaidMonths = signal<number | null>(null);
  format = formatMoney;

  form = {
    downPayment: null as number | null,
    name: '',
    totalAmount: null as number | null,
    monthlyPayment: null as number | null,
    totalMonths: 6,
    paidMonths: 0,
    startDate: new Date().toISOString().slice(0, 10),
  };

  ngOnInit(): void {
    this.load();
  }

  formTitle(): string {
    return this.editingId() ? "Muddatli to'lovni tahrirlash" : "Yangi muddatli to'lov";
  }

  submitLabel(): string {
    return this.editingId() ? 'Yangilash' : "Qo'shish";
  }

  openForm(): void {
    this.editingId.set(null);
    this.paidMonthsManual.set(false);
    this.form = {
      downPayment: null,
      name: '',
      totalAmount: null,
      monthlyPayment: null,
      totalMonths: 6,
      paidMonths: 0,
      startDate: new Date().toISOString().slice(0, 10),
    };
    this.markupPercent.set(null);
    this.updateSuggestedPaidMonths();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  openDetail(item: InstallmentItem): void {
    this.detailItem.set(item);
  }

  closeDetail(): void {
    this.detailItem.set(null);
  }

  editFromDetail(): void {
    const item = this.detailItem();
    if (!item) return;

    this.editingId.set(item.id);
    this.paidMonthsManual.set(true);
    this.form = {
      downPayment: item.downPayment ?? null,
      name: item.name,
      totalAmount: item.totalAmount,
      monthlyPayment: item.monthlyPayment,
      totalMonths: item.totalMonths,
      paidMonths: item.paidMonths,
      startDate: item.startDate.slice(0, 10),
    };
    this.onPricingChange();
    this.updateSuggestedPaidMonths();
    this.closeDetail();
    this.showForm.set(true);
  }

  onStartDateChange(): void {
    this.updateSuggestedPaidMonths();
    if (!this.paidMonthsManual()) {
      this.applySuggestedPaidMonths();
    }
  }

  onPaidMonthsManual(): void {
    this.paidMonthsManual.set(true);
    const totalMonths = Number(this.form.totalMonths) || 0;
    this.form.paidMonths = Math.min(totalMonths, Math.max(0, Number(this.form.paidMonths) || 0));
  }

  updateSuggestedPaidMonths(): void {
    const elapsed = monthsElapsedSince(this.form.startDate);
    const totalMonths = Number(this.form.totalMonths) || 0;
    this.suggestedPaidMonths.set(totalMonths > 0 ? Math.min(totalMonths, elapsed) : elapsed);
  }

  applySuggestedPaidMonths(): void {
    const suggested = this.suggestedPaidMonths();
    if (suggested == null) return;
    this.form.paidMonths = suggested;
    this.paidMonthsManual.set(false);
  }

  remainingMonths(item: InstallmentItem): number {
    return Math.max(0, item.totalMonths - item.paidMonths);
  }

  isComplete(item: InstallmentItem): boolean {
    return item.paidMonths >= item.totalMonths;
  }

  onPricingChange(): void {
    this.markupPercent.set(
      calcInstallmentMarkupPercent(
        coerceAmount(this.form.totalAmount),
        coerceAmount(this.form.downPayment),
        coerceAmount(this.form.monthlyPayment),
        Number(this.form.totalMonths),
      ),
    );
  }

  itemMarkup(item: InstallmentItem): number | null {
    return calcInstallmentMarkupPercent(
      item.totalAmount,
      item.downPayment ?? 0,
      item.monthlyPayment,
      item.totalMonths,
    );
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

    const paidMonths = Math.min(totalMonths, Math.max(0, Number(this.form.paidMonths) || 0));
    const payload = {
      name: this.form.name.trim(),
      totalAmount: Math.round(totalAmount * 100) / 100,
      downPayment: Math.round(downPayment * 100) / 100,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalMonths,
      paidMonths,
      startDate: this.form.startDate,
    };

    const editingId = this.editingId();
    const req = editingId
      ? this.api.patch(`/installments/${editingId}`, payload)
      : this.api.post('/installments', payload);

    req.subscribe({
      next: () => {
        this.closeForm();
        this.load();
        this.toast.success(editingId ? 'Muddatli to\'lov yangilandi' : "Muddatli to'lov qo'shildi");
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
    });
  }
}
