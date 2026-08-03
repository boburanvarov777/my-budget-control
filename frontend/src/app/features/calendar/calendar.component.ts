import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MoneyPipe, AmountPipe } from '../../shared/pipes/money.pipe';
import { ApiService } from '../../core/services/api.service';
import { currentMonthYear } from '../../shared/utils/format.util';

interface CalendarEvent {
  date: string;
  title: string;
  type: string;
  amount: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, IconComponent, AmountPipe],
  template: `
    <section class="premium-page calendar-page">
      <app-page-header
        title="To'lov kalendari"
        subtitle="Bu oy rejalashtirilgan to'lovlar"
      />

      <div class="space-y-3">
        @for (event of events(); track event.date + event.title + event.type) {
          <div class="premium-list-item calendar-item">
            <div class="calendar-main">
              <div class="premium-list-icon active">
                <app-icon name="calendar" [size]="18" />
              </div>
              <div class="calendar-text">
                <p class="premium-caption text-gold">{{ event.date | date: 'd MMMM' }}</p>
                <p class="premium-body">{{ event.title }}</p>
                <p class="premium-small premium-muted capitalize">{{ event.type }}</p>
              </div>
            </div>
            <p class="amount-lg">{{ event.amount | amount }} so'm</p>
          </div>
        } @empty {
          <div class="premium-card premium-muted premium-small">Bu oy to'lovlar yo'q</div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .calendar-page {
        overflow-x: hidden;
        min-width: 0;
      }

      .space-y-3 > * + * {
        margin-top: 12px;
      }

      .calendar-item {
        align-items: flex-start;
        min-width: 0;
      }

      .calendar-main {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 0;
        flex: 1;
      }

      .calendar-text {
        min-width: 0;
        flex: 1;
      }

      .calendar-text .premium-body,
      .calendar-text .premium-caption {
        overflow-wrap: anywhere;
      }

      .calendar-item .amount-lg {
        flex-shrink: 0;
        white-space: nowrap;
      }
    `,
  ],
})
export class CalendarComponent implements OnInit {
  private api = inject(ApiService);
  events = signal<CalendarEvent[]>([]);

  ngOnInit(): void {
    const { month, year } = currentMonthYear();
    this.api.get<CalendarEvent[]>('/calendar', { month, year }).subscribe((r) =>
      this.events.set(r),
    );
  }
}
