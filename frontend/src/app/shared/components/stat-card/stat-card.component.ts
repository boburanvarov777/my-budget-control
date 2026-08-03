import { Component, input } from '@angular/core';
import { formatMoney } from '../../utils/format.util';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="rounded-2xl border border-border bg-surface-2 p-4">
      <p class="text-xs uppercase tracking-wide text-muted">{{ label() }}</p>
      <p class="mt-1 text-lg font-semibold" [class]="colorClass()">
        {{ formatted() }}
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .border-border {
        border-color: var(--color-border);
      }
      .bg-surface-2 {
        background: var(--color-surface-2);
      }
      .text-muted {
        color: var(--color-muted);
      }
      .text-success {
        color: var(--color-success);
      }
      .text-danger {
        color: var(--color-danger);
      }
      .text-accent {
        color: var(--color-accent);
      }
      .text-default {
        color: var(--color-text);
      }
    `,
  ],
})
export class StatCardComponent {
  label = input.required<string>();
  amount = input.required<number>();
  variant = input<'default' | 'success' | 'danger' | 'accent'>('default');

  formatted = () => formatMoney(this.amount());

  colorClass = () => {
    const map = {
      default: 'text-default',
      success: 'text-success',
      danger: 'text-danger',
      accent: 'text-accent',
    };
    return map[this.variant()];
  };
}
