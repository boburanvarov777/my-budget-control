import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { formatMoney } from '../../shared/utils/format.util';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [FormsModule, ProgressBarComponent],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Muddatli to'lov</h1>

      <form class="card space-y-3" (ngSubmit)="submit()">
        <input class="field" placeholder="Nomi (masalan iPhone 17 Pro Max)" [(ngModel)]="form.name" name="name" required />
        <input class="field" type="number" placeholder="Jami summa" [(ngModel)]="form.totalAmount" name="totalAmount" required />
        <input class="field" type="number" placeholder="Oyiga to'lov" [(ngModel)]="form.monthlyPayment" name="monthlyPayment" required />
        <input class="field" type="number" placeholder="Oylar soni" [(ngModel)]="form.totalMonths" name="totalMonths" required />
        <input class="field" type="date" [(ngModel)]="form.startDate" name="startDate" required />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      @for (item of items(); track item.id) {
        <div class="card space-y-2">
          <h3 class="font-medium">{{ item.name }}</h3>
          <p class="text-sm text-muted">Oyiga {{ format(item.monthlyPayment) }}</p>
          <app-progress-bar
            [progress]="Math.round((item.paidMonths / item.totalMonths) * 100)"
            [subtitle]="item.paidMonths + ' oy to\\'langan · ' + (item.totalMonths - item.paidMonths) + ' oy qoldi'"
          />
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
    .text-muted { color: var(--color-muted); }
  `],
})
export class InstallmentsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  format = formatMoney;
  Math = Math;

  form = {
    name: '',
    totalAmount: null as number | null,
    monthlyPayment: null as number | null,
    totalMonths: 6,
    startDate: new Date().toISOString().slice(0, 10),
  };

  ngOnInit(): void { this.load(); }
  load(): void { this.api.get<any[]>('/installments').subscribe((r) => this.items.set(r)); }

  submit(): void {
    if (!this.form.name || !this.form.totalAmount || !this.form.monthlyPayment) return;
    this.api.post('/installments', this.form).subscribe(() => this.load());
  }
}
