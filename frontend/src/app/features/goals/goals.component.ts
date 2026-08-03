import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { formatMoney } from '../../shared/utils/format.util';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    FormsModule,
    ProgressBarComponent,
    PageHeaderComponent,
    FabComponent,
    IconComponent,
  ],
  template: `
    <section class="premium-page">
      <app-page-header title="Maqsadlar" subtitle="Moliyaviy maqsadlaringiz" />

      @if (showForm()) {
        <form class="premium-card space-y-4" (ngSubmit)="submit()">
          <div class="premium-field">
            <label class="premium-label">Nomi</label>
            <input class="premium-input" placeholder="Masalan: Malibu" [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="premium-field">
            <label class="premium-label">Tur</label>
            <select class="premium-select" [(ngModel)]="form.type" name="type">
              @for (t of types; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="premium-grid-2">
            <div class="premium-field">
              <label class="premium-label">Maqsad summa</label>
              <input class="premium-input" type="number" [(ngModel)]="form.targetAmount" name="targetAmount" required />
            </div>
            <div class="premium-field">
              <label class="premium-label">Yig'ilgan</label>
              <input class="premium-input" type="number" [(ngModel)]="form.savedAmount" name="savedAmount" />
            </div>
          </div>
          <div class="premium-grid-2">
            <div class="premium-field">
              <label class="premium-label">Har oy</label>
              <input class="premium-input" type="number" [(ngModel)]="form.monthlyAmount" name="monthlyAmount" />
            </div>
            <div class="premium-field">
              <label class="premium-label">Muddat</label>
              <input class="premium-input" type="date" [(ngModel)]="form.targetDate" name="targetDate" />
            </div>
          </div>
          <div class="premium-grid-2">
            <button type="button" class="premium-btn premium-btn-secondary premium-btn-block" (click)="showForm.set(false)">Bekor</button>
            <button type="submit" class="premium-btn premium-btn-primary premium-btn-block">Saqlash</button>
          </div>
        </form>
      }

      @for (goal of items(); track goal.id) {
        <div class="premium-card premium-card-accent">
          <div class="flex items-center gap-3 mb-3">
            <div class="premium-list-icon active">
              <app-icon [name]="iconName(goal.type)" [size]="18" />
            </div>
            <div class="flex-1">
              <p class="premium-body">{{ goal.name }}</p>
              <p class="premium-caption">{{ typeLabel(goal.type) }}</p>
            </div>
            <span class="premium-chip">{{ progress(goal) }}%</span>
          </div>
          <app-progress-bar
            [progress]="progress(goal)"
            [subtitle]="format(goal.savedAmount) + ' / ' + format(goal.targetAmount)"
          />
        </div>
      } @empty {
        <div class="premium-card premium-muted premium-small">Maqsadlar yo'q. + tugmasini bosing.</div>
      }
    </section>

    <app-fab (clicked)="showForm.set(true)" />
  `,
  styles: [
    `
      .space-y-4 > * + * { margin-top: 16px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .flex-1 { flex: 1; }
    `,
  ],
})
export class GoalsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  showForm = signal(false);
  format = formatMoney;

  types = [
    { value: 'CAR', label: 'Mashina' },
    { value: 'HOUSE', label: 'Uy' },
    { value: 'TRAVEL', label: 'Sayohat' },
    { value: 'LAPTOP', label: 'Notebook' },
    { value: 'PHONE', label: 'Telefon' },
    { value: 'EMERGENCY', label: 'Zaxira fond' },
    { value: 'CUSTOM', label: 'Boshqa' },
  ];

  form = {
    name: '',
    type: 'CAR',
    targetAmount: null as number | null,
    savedAmount: 0,
    monthlyAmount: 0,
    targetDate: '',
  };

  ngOnInit(): void {
    this.api.get<any[]>('/goals').subscribe((r) => this.items.set(r));
  }

  progress(goal: any): number {
    const target = Number(goal.targetAmount);
    const saved = Number(goal.savedAmount);
    return target > 0 ? Math.round((saved / target) * 100) : 0;
  }

  iconName(type: string): string {
    const map: Record<string, string> = {
      CAR: 'car',
      HOUSE: 'home',
      TRAVEL: 'plane',
      LAPTOP: 'laptop',
      PHONE: 'smartphone',
      EMERGENCY: 'shield',
      CUSTOM: 'target',
    };
    return map[type] ?? 'target';
  }

  typeLabel(type: string): string {
    return this.types.find((t) => t.value === type)?.label ?? type;
  }

  submit(): void {
    if (!this.form.name || !this.form.targetAmount) return;
    this.api.post('/goals', this.form).subscribe(() => {
      this.form.name = '';
      this.form.targetAmount = null;
      this.showForm.set(false);
      this.api.get<any[]>('/goals').subscribe((r) => this.items.set(r));
    });
  }
}
