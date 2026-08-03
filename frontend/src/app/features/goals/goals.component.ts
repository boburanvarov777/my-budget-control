import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { formatMoney } from '../../shared/utils/format.util';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [FormsModule, ProgressBarComponent],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Maqsadlar</h1>

      <form class="card space-y-3" (ngSubmit)="submit()">
        <input class="field" placeholder="Nomi (masalan Malibu)" [(ngModel)]="form.name" name="name" required />
        <select class="field" [(ngModel)]="form.type" name="type">
          @for (t of types; track t.value) {
            <option [value]="t.value">{{ t.icon }} {{ t.label }}</option>
          }
        </select>
        <input class="field" type="number" placeholder="Kerak summa" [(ngModel)]="form.targetAmount" name="targetAmount" required />
        <input class="field" type="number" placeholder="Yig'ilgan" [(ngModel)]="form.savedAmount" name="savedAmount" />
        <input class="field" type="number" placeholder="Har oy" [(ngModel)]="form.monthlyAmount" name="monthlyAmount" />
        <input class="field" type="date" [(ngModel)]="form.targetDate" name="targetDate" />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      @for (goal of items(); track goal.id) {
        <div class="card space-y-2">
          <div class="flex items-center gap-2">
            <span>{{ icon(goal.type) }}</span>
            <h3 class="font-medium">{{ goal.name }}</h3>
          </div>
          <app-progress-bar
            [progress]="progress(goal)"
            [subtitle]="format(goal.savedAmount) + ' / ' + format(goal.targetAmount)"
          />
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
  `],
})
export class GoalsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  format = formatMoney;

  types = [
    { value: 'CAR', icon: '🚗', label: 'Mashina' },
    { value: 'HOUSE', icon: '🏠', label: 'Uy' },
    { value: 'TRAVEL', icon: '✈️', label: 'Sayohat' },
    { value: 'LAPTOP', icon: '💻', label: 'Notebook' },
    { value: 'PHONE', icon: '📱', label: 'Telefon' },
    { value: 'EMERGENCY', icon: '🏦', label: 'Emergency Fund' },
    { value: 'CUSTOM', icon: '🎯', label: 'Boshqa' },
  ];

  form = {
    name: '',
    type: 'CAR',
    targetAmount: null as number | null,
    savedAmount: 0,
    monthlyAmount: 0,
    targetDate: '',
  };

  ngOnInit(): void { this.load(); }
  load(): void { this.api.get<any[]>('/goals').subscribe((r) => this.items.set(r)); }

  icon(type: string) {
    return this.types.find((t) => t.value === type)?.icon ?? '🎯';
  }

  progress(g: any) {
    const t = Number(g.targetAmount);
    return t > 0 ? Math.min(100, Math.round((Number(g.savedAmount) / t) * 100)) : 0;
  }

  submit(): void {
    if (!this.form.name || !this.form.targetAmount) return;
    this.api.post('/goals', this.form).subscribe(() => this.load());
  }
}
