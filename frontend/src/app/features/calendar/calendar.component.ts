import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { formatMoney, currentMonthYear } from '../../shared/utils/format.util';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">To'lov kalendari</h1>

      @for (event of events(); track $index) {
        <div class="card flex justify-between items-center">
          <div>
            <p class="text-sm text-accent">{{ event.date | date: 'd MMMM' }}</p>
            <p class="font-medium">{{ event.title }}</p>
            <p class="text-xs text-muted capitalize">{{ event.type }}</p>
          </div>
          <p class="font-semibold">{{ format(event.amount) }}</p>
        </div>
      } @empty {
        <p class="text-muted text-center">Bu oy to'lovlar yo'q</p>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .text-muted { color: var(--color-muted); }
    .text-accent { color: var(--color-accent); }
  `],
})
export class CalendarComponent implements OnInit {
  private api = inject(ApiService);
  events = signal<any[]>([]);
  format = formatMoney;

  ngOnInit(): void {
    const { month, year } = currentMonthYear();
    this.api.get<any[]>('/calendar', { month, year }).subscribe((r) => this.events.set(r));
  }
}
