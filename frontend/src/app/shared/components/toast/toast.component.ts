import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toast.items(); track toast.id) {
        <div class="toast" [class.success]="toast.type === 'success'" [class.error]="toast.type === 'error'">
          <app-icon [name]="toast.type === 'success' ? 'circle-check' : 'circle-alert'" [size]="18" />
          <span>{{ toast.text }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: calc(92px + env(safe-area-inset-bottom));
        z-index: 80;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 32rem;
        margin: 0 auto;
        pointer-events: none;
      }

      .toast {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid var(--color-border);
        background: rgba(23, 23, 23, 0.96);
        color: var(--color-text);
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        animation: toastIn 220ms ease;
      }

      .toast.success {
        border-color: rgba(46, 204, 113, 0.45);
        color: var(--color-success);
      }

      .toast.error {
        border-color: rgba(229, 57, 53, 0.45);
        color: var(--color-danger);
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  toast = inject(ToastService);
}
