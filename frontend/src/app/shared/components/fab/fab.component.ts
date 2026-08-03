import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button type="button" class="fab" (click)="clicked.emit()" [attr.aria-label]="label()">
      <app-icon name="plus" [size]="22" />
    </button>
  `,
  styles: [
    `
      .fab {
        position: fixed;
        right: 20px;
        bottom: calc(88px + env(safe-area-inset-bottom));
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border: none;
        border-radius: 16px;
        background: var(--color-gold);
        color: #090909;
        box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2);
        cursor: pointer;
        transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .fab:active {
        transform: scale(0.96);
      }
    `,
  ],
})
export class FabComponent {
  label = input('Qo\'shish');
  clicked = output<void>();
}
