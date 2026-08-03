import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="progress-wrap">
      @if (label()) {
        <div class="progress-head premium-small">
          <span>{{ label() }}</span>
          <span class="premium-muted">{{ progress() }}%</span>
        </div>
      }
      <div class="premium-progress-track">
        <div class="premium-progress-fill" [style.width.%]="clamped()"></div>
      </div>
      @if (subtitle()) {
        <p class="premium-caption mt-2">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .progress-wrap {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .progress-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .mt-2 {
        margin-top: 4px;
      }
    `,
  ],
})
export class ProgressBarComponent {
  label = input<string>('');
  subtitle = input<string>('');
  progress = input.required<number>();

  clamped = () => Math.min(100, Math.max(0, this.progress()));
}
