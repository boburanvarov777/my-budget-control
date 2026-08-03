import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { TelegramService } from '../../../core/services/telegram.service';

@Component({
  selector: 'app-fullscreen-toggle',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="fullscreen-btn"
      (click)="toggle()"
      [attr.aria-label]="telegram.fullscreen() ? 'Kichiklashtirish' : 'Kattalashtirish'"
    >
      <app-icon
        [name]="telegram.fullscreen() ? 'minimize-2' : 'maximize-2'"
        [size]="18"
      />
    </button>
  `,
  styles: [
    `
      .fullscreen-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        background: var(--color-card);
        color: var(--color-muted);
        cursor: pointer;
        transition: color 250ms ease, border-color 250ms ease;
      }

      .fullscreen-btn:hover {
        color: var(--color-gold);
        border-color: rgba(212, 175, 55, 0.35);
      }
    `,
  ],
})
export class FullscreenToggleComponent {
  telegram = inject(TelegramService);

  toggle(): void {
    this.telegram.toggleFullscreen();
  }
}
