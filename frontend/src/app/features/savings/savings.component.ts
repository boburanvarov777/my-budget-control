import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { formatMoney } from '../../shared/utils/format.util';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="space-y-4">
      <div class="card">
        <p class="text-sm text-muted">Jami jamg'arma</p>
        <p class="text-3xl font-bold text-accent">{{ format(total()) }}</p>
      </div>

      <form class="card space-y-3" (ngSubmit)="submit()">
        <input class="field" type="number" placeholder="Summa" [(ngModel)]="form.amount" name="amount" required />
        <input class="field" placeholder="Nomi" [(ngModel)]="form.name" name="name" />
        <input class="field" type="text" placeholder="Izoh" [(ngModel)]="form.note" name="note" />
        <button type="submit" class="btn-primary">Qo'shish</button>
      </form>

      @for (item of items(); track item.id) {
        <div class="card flex justify-between">
          <div>
            <p class="font-medium">{{ item.name }}</p>
            <p class="text-success">{{ format(item.amount) }}</p>
            <p class="text-xs text-muted">{{ item.date | date: 'd MMM yyyy' }}</p>
          </div>
          <button class="text-danger" (click)="remove(item.id)">×</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
    .text-muted { color: var(--color-muted); }
    .text-success { color: var(--color-success); }
    .text-accent { color: var(--color-accent); }
    .text-danger { color: var(--color-danger); }
  `],
})
export class SavingsComponent implements OnInit {
  private api = inject(ApiService);
  items = signal<any[]>([]);
  total = signal(0);
  format = formatMoney;

  form = { amount: null as number | null, name: "Jamg'arma", note: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<any[]>('/savings').subscribe((r) => this.items.set(r));
    this.api.get<{ total: number }>('/savings/total').subscribe((r) => this.total.set(r.total));
  }

  submit(): void {
    if (!this.form.amount) return;
    this.api.post('/savings', this.form).subscribe(() => {
      this.form.amount = null;
      this.load();
    });
  }

  remove(id: string): void {
    this.api.delete(`/savings/${id}`).subscribe(() => this.load());
  }
}
