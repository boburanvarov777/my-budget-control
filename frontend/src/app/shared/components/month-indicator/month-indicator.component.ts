import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-month-indicator',
  standalone: true,
  template: `
    <div class="month-indicator" [class.compact]="total() > 24">
      @for (m of range(); track m) {
        <span
          class="month-dot"
          [class.paid]="m <= paid()"
          [class.unpaid]="m > paid()"
          [title]="m + '-oy'"
        ></span>
      }
    </div>
    @if (showLegend()) {
      <p class="month-legend premium-caption premium-muted">
        {{ paid() }} oy to'langan · {{ remaining() }} oy qoldi
      </p>
    }
  `,
  styles: [
    `
      .month-indicator {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .month-indicator.compact {
        gap: 3px;
      }

      .month-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        flex-shrink: 0;
      }

      .month-indicator.compact .month-dot {
        width: 7px;
        height: 7px;
      }

      .month-dot.paid {
        background: var(--color-success);
        box-shadow: 0 0 0 1px rgba(46, 204, 113, 0.35);
      }

      .month-dot.unpaid {
        background: var(--color-border);
        border: 1px solid rgba(161, 161, 170, 0.35);
      }

      .month-legend {
        margin: 8px 0 0;
      }
    `,
  ],
})
export class MonthIndicatorComponent {
  total = input.required<number>();
  paid = input.required<number>();
  showLegend = input(true);

  remaining = computed(() => Math.max(0, this.total() - this.paid()));

  range = computed(() =>
    Array.from({ length: Math.max(0, this.total()) }, (_, i) => i + 1),
  );
}
