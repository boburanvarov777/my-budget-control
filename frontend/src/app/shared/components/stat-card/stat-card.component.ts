import { Component, input } from '@angular/core';
import { AmountPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [AmountPipe],
  template: `
    <div class="stat-card" [class.stat-card-accent]="highlight()">
      <p class="premium-caption">{{ label() }}</p>
      <p class="amount-lg mt-2" [class]="colorClass()">{{ amount() | amount }}</p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .stat-card {
        background: var(--color-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-card);
        padding: 16px;
        box-shadow: var(--shadow-soft);
      }

      .stat-card-accent {
        position: relative;
      }

      .stat-card-accent::after {
        content: '';
        position: absolute;
        top: 0;
        left: 16px;
        right: 16px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
        opacity: 0.5;
      }

      .mt-2 {
        margin-top: 8px;
      }
    `,
  ],
})
export class StatCardComponent {
  label = input.required<string>();
  amount = input.required<number>();
  variant = input<'default' | 'success' | 'danger' | 'gold'>('default');
  highlight = input(false);

  colorClass = () => {
    const map = {
      default: '',
      success: 'text-success',
      danger: 'text-danger',
      gold: 'text-gold',
    };
    return map[this.variant()];
  };
}
