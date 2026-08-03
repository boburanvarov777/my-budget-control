import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="premium-header">
      @if (eyebrow()) {
        <p class="premium-caption">{{ eyebrow() }}</p>
      }
      <h1 class="premium-title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="premium-small premium-muted">{{ subtitle() }}</p>
      }
    </header>
  `,
  styles: [
    `
      .premium-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
    `,
  ],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  eyebrow = input<string>('');
}
