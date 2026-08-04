import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { formatMoney, coerceAmount } from '../../shared/utils/format.util';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgClass,
    ProgressBarComponent,
    CurrencyInputComponent,
    DateInputComponent,
    PageHeaderComponent,
    FabComponent,
    IconComponent,
  ],
  template: `
    <section class="premium-page">
      <app-page-header title="Kreditlar" subtitle="Bank kreditlari va to'lovlar" />

      @if (showForm()) {
        <form class="premium-card space-y-4" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Nomi</label>
            <input class="premium-input" placeholder="Masalan: Ipoteka" [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="premium-grid-2">
            <div class="premium-field">
              <label class="premium-label">Jami summa</label>
              <app-currency-input [(ngModel)]="form.totalAmount" name="totalAmount" placeholder="Jami summa" />
            </div>
            <div class="premium-field">
              <label class="premium-label">Foiz %</label>
              <input class="premium-input" type="number" [(ngModel)]="form.interestRate" name="interestRate" />
            </div>
          </div>
          <div class="premium-grid-2">
            <div class="premium-field">
              <label class="premium-label">Oylar</label>
              <input class="premium-input" type="number" [(ngModel)]="form.months" name="months" required />
            </div>
            <div class="premium-field">
              <label class="premium-label">Oy to'lov</label>
              <app-currency-input [(ngModel)]="form.monthlyPayment" name="monthlyPayment" placeholder="Oy to'lov" />
            </div>
          </div>
          <div class="premium-field">
            <label class="premium-label">Boshlanish sanasi</label>
            <app-date-input [(ngModel)]="form.startDate" name="startDate" />
          </div>
          <div class="premium-grid-2">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="showForm.set(false)">Bekor</button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">Saqlash</button>
          </div>
        </form>
      }

      @for (c of items(); track c.id) {
        <div class="premium-card premium-card-accent">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="premium-list-icon active">
                <app-icon name="credit-card" [size]="18" />
              </div>
              <h3 class="premium-body">{{ c.name }}</h3>
            </div>
            <span class="premium-chip" [ngClass]="statusClass(c.status)">{{ c.status }}</span>
          </div>
          <app-progress-bar
            [progress]="progress(c)"
            [subtitle]="format(c.remainingDebt) + ' qolgan / ' + format(c.totalAmount)"
          />
          <div class="premium-grid-2 mt-3">
            <div>
              <p class="premium-caption">Oylik to'lov</p>
              <p class="premium-small">{{ format(c.monthlyPayment) }}</p>
            </div>
            <div>
              <p class="premium-caption">Keyingi to'lov</p>
              <p class="premium-small">{{ c.nextPaymentDate | date: 'd MMMM' }}</p>
            </div>
          </div>
        </div>
      } @empty {
        <div class="premium-card premium-muted premium-small">Kreditlar yo'q</div>
      }
    </section>

    <app-fab (clicked)="showForm.set(true)" />
  `,
  styles: [
    `
      .space-y-4 > * + * { margin-top: 16px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .mt-3 { margin-top: 12px; }
    `,
  ],
})
export class CreditsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  showForm = signal(false);
  format = formatMoney;

  form = {
    name: '',
    totalAmount: null as number | null,
    interestRate: 0,
    months: 12,
    startDate: new Date().toISOString().slice(0, 10),
    monthlyPayment: null as number | null,
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<any[]>('/credits').subscribe((r) => this.items.set(r));
  }

  progress(c: any): number {
    const total = Number(c.totalAmount);
    const rem = Number(c.remainingDebt);
    return total > 0 ? Math.round(((total - rem) / total) * 100) : 0;
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
    if (!this.form.name || totalAmount <= 0 || monthlyPayment <= 0) return;
    this.api.post('/credits', {
      ...this.form,
      totalAmount,
      monthlyPayment,
    }).subscribe(() => {
      this.form.name = '';
      this.form.totalAmount = null;
      this.form.monthlyPayment = null;
      this.showForm.set(false);
      this.load();
    });
  }
}
