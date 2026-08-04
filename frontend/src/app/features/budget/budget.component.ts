import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ToastService } from '../../shared/services/toast.service';
import { AmountPipe } from '../../shared/pipes/money.pipe';
import { coerceAmount, currentMonthYear, formatMoney } from '../../shared/utils/format.util';
import { extractApiError } from '../../shared/utils/http-error.util';

interface MandatoryRow {
  name: string;
  amount: number | null;
}

interface BudgetResult {
  monthlyIncome: number;
  mandatoryTotal: number;
  remaining: number;
  recommendations?: Record<string, number> | null;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [FormsModule, IconComponent, CurrencyInputComponent, PageHeaderComponent, AmountPipe],
  template: `
    <section class="premium-page">
      <app-page-header
        [title]="'Byudjet — ' + monthLabel()"
        subtitle="Daromadingizni rejalashtiring va qayerga ketishini ko'ring"
      />

      <div class="info-box">
        <p class="info-title">Nega kerak?</p>
        <p class="premium-small premium-muted">
          Byudjet — oylik daromadingizdan avval majburiy to'lovlarni ajratish rejasi.
          Qolgan pulni jamg'arma, maqsad va erkin xarajatlarga bo'lishni ko'rsatadi.
        </p>
      </div>

      <form class="premium-card form-card" (ngSubmit)="calculate()">
        <div class="premium-field">
          <label class="premium-label">Oylik daromad</label>
          <app-currency-input [(ngModel)]="monthlyIncome" name="income" placeholder="25 000 000" />
        </div>

        <div class="section-label">
          <span class="premium-label">Majburiy xarajatlar</span>
          <button type="button" class="link-btn" (click)="addRow()">+ Qo'shish</button>
        </div>

        @for (item of mandatory; track $index) {
          <div class="expense-row">
            <input
              class="premium-input"
              placeholder="Nomi (kredit, uy...)"
              [(ngModel)]="item.name"
              [name]="'n' + $index"
            />
            <app-currency-input [(ngModel)]="item.amount" [name]="'a' + $index" placeholder="Summa" />
            @if (mandatory.length > 1) {
              <button type="button" class="icon-btn" (click)="removeRow($index)">
                <app-icon name="trash-2" [size]="16" />
              </button>
            }
          </div>
        }

        <button type="submit" class="premium-btn premium-btn-primary premium-btn-block" [disabled]="saving()">
          {{ saving() ? 'Hisoblanmoqda...' : 'Hisoblash va saqlash' }}
        </button>
      </form>

      @if (result(); as r) {
        <div class="premium-card-hero premium-card-accent">
          <div class="hero-row">
            <app-icon name="wallet" [size]="18" class="text-gold" />
            <span class="premium-caption">Oy oxiriga qoladi</span>
          </div>
          <p class="amount-xl" [class.text-success]="r.remaining >= 0" [class.text-danger]="r.remaining < 0">
            {{ r.remaining | amount }} so'm
          </p>
        </div>

        <div class="premium-grid-2">
          <div class="stat-mini">
            <span class="premium-muted">Daromad</span>
            <span class="stat-value">{{ r.monthlyIncome | amount }}</span>
          </div>
          <div class="stat-mini">
            <span class="premium-muted">Majburiy</span>
            <span class="stat-value text-danger">{{ r.mandatoryTotal | amount }}</span>
          </div>
        </div>

        @if (r.remaining > 0 && r.recommendations; as rec) {
          <div>
            <h2 class="premium-section-title mb-3">Tavsiya etilgan taqsimot</h2>
            <div class="space-y-3">
              @for (block of recommendationBlocks(rec); track block.key) {
                <div class="premium-card premium-card-accent alloc-row">
                  <div class="flex items-center gap-3">
                    <div class="premium-list-icon active">
                      <app-icon [name]="block.icon" [size]="18" />
                    </div>
                    <div class="flex-1">
                      <p class="premium-body">{{ block.label }}</p>
                      <p class="premium-small premium-muted">{{ block.percent }}%</p>
                    </div>
                    <span class="amount-md text-gold">{{ block.amount | amount }} so'm</span>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else if (r.remaining <= 0) {
          <div class="warn-box">
            <app-icon name="circle-alert" [size]="18" />
            <p>Majburiy xarajatlar daromaddan oshib ketdi. Xarajatlarni qisqartirish yoki daromadni oshirish kerak.</p>
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .info-box {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(212, 175, 55, 0.25);
        background: var(--color-gold-soft);
        margin-bottom: 16px;
      }

      .info-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-gold);
      }

      .form-card > * + * { margin-top: 16px; }

      .section-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .link-btn {
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        color: var(--color-gold);
        font-size: 14px;
      }

      .expense-row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 8px;
        align-items: center;
      }

      @media (max-width: 400px) {
        .expense-row {
          grid-template-columns: 1fr;
        }
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

      .hero-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .premium-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 16px 0;
      }

      .stat-mini {
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid var(--color-border);
        background: var(--color-card);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-value { font-size: 18px; font-weight: 600; }

      .space-y-3 > * + * { margin-top: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-3 { gap: 12px; }
      .flex-1 { flex: 1; }

      .amount-md { font-size: 17px; font-weight: 600; }
      .text-success { color: var(--color-success); }
      .text-danger { color: var(--color-danger); }

      .warn-box {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(229, 57, 53, 0.35);
        background: rgba(229, 57, 53, 0.08);
        color: var(--color-danger);
        font-size: 14px;
        line-height: 1.45;
      }

      .warn-box p { margin: 0; }
    `,
  ],
})
export class BudgetComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  format = formatMoney;
  monthlyIncome = null as number | null;
  mandatory: MandatoryRow[] = [
    { name: 'Kredit', amount: null },
    { name: 'Kommunal', amount: null },
    { name: 'Oziq-ovqat', amount: null },
  ];
  result = signal<BudgetResult | null>(null);
  saving = signal(false);

  ngOnInit(): void {
    this.loadPlan();
  }

  monthLabel(): string {
    const { month, year } = currentMonthYear();
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
  }

  loadPlan(): void {
    const { month, year } = currentMonthYear();
    this.api.get<any>('/budget', { month, year }).subscribe({
      next: (r) => {
        if (!r) return;
        this.result.set(this.normalizeResult(r));
        this.monthlyIncome = coerceAmount(r.monthlyIncome);
        const rows = (r.mandatoryExpenses as MandatoryRow[]) ?? [];
        if (rows.length) {
          this.mandatory = rows.map((row) => ({
            name: row.name,
            amount: coerceAmount(row.amount),
          }));
        }
      },
    });
  }

  addRow(): void {
    this.mandatory.push({ name: '', amount: null });
  }

  removeRow(index: number): void {
    this.mandatory.splice(index, 1);
  }

  recommendationBlocks(rec: Record<string, number>) {
    const defs = [
      { key: 'savings', label: "Jamg'arma", icon: 'piggy-bank', percent: 35 },
      { key: 'car', label: 'Mashina maqsadi', icon: 'car', percent: 20 },
      { key: 'investment', label: 'Investitsiya', icon: 'trending-up', percent: 25 },
      { key: 'free', label: 'Erkin pul', icon: 'sparkles', percent: 20 },
    ];
    return defs
      .map((d) => ({ ...d, amount: coerceAmount(rec[d.key]) }))
      .filter((d) => d.amount > 0);
  }

  calculate(): void {
    const income = coerceAmount(this.monthlyIncome);
    if (income <= 0) {
      this.toast.error('Oylik daromadni kiriting');
      return;
    }

    const { month, year } = currentMonthYear();
    this.saving.set(true);

    this.api
      .post('/budget', {
        month,
        year,
        monthlyIncome: income,
        mandatoryExpenses: this.mandatory
          .filter((m) => m.name?.trim() && coerceAmount(m.amount) > 0)
          .map((m) => ({ name: m.name.trim(), amount: coerceAmount(m.amount) })),
      })
      .subscribe({
        next: (r) => {
          this.result.set(this.normalizeResult(r));
          this.saving.set(false);
          this.toast.success('Byudjet saqlandi');
        },
        error: (e: HttpErrorResponse) => {
          this.saving.set(false);
          this.toast.error(extractApiError(e));
        },
      });
  }

  private normalizeResult(r: any): BudgetResult {
    const mandatory = (r.mandatoryExpenses as MandatoryRow[]) ?? [];
    const mandatoryTotal =
      r.mandatoryTotal ??
      mandatory.reduce((s, i) => s + coerceAmount(i.amount), 0);
    const monthlyIncome = coerceAmount(r.monthlyIncome);
    const remaining = r.remaining ?? monthlyIncome - mandatoryTotal;

    return {
      monthlyIncome,
      mandatoryTotal,
      remaining,
      recommendations: r.recommendations ?? r.recommendedSavings ?? null,
    };
  }
}
