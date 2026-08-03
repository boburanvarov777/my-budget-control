import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div class="space-y-2">
      @if (label()) {
        <div class="flex items-center justify-between text-sm">
          <span>{{ label() }}</span>
          <span class="text-muted">{{ progress() }}%</span>
        </div>
      }
      <div class="h-2 overflow-hidden rounded-full bg-border">
        <div
          class="h-full rounded-full bg-accent transition-all duration-500"
          [style.width.%]="progress()"
        ></div>
      </div>
      @if (subtitle()) {
        <p class="text-xs text-muted">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .bg-border {
        background: var(--color-border);
      }
      .bg-accent {
        background: var(--color-accent);
      }
      .text-muted {
        color: var(--color-muted);
      }
    `,
  ],
})
export class ProgressBarComponent {
  label = input<string>('');
  subtitle = input<string>('');
  progress = input.required<number>();
}
