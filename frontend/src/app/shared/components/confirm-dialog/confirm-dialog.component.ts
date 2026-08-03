import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (confirm.visible()) {
      <div class="confirm-backdrop" (click)="confirm.cancel()">
        <div class="confirm-card" role="dialog" (click)="$event.stopPropagation()">
          <h2 class="premium-section-title">{{ confirm.title() }}</h2>
          <p class="premium-body premium-muted">{{ confirm.message() }}</p>
          <div class="confirm-actions">
            <button type="button" class="premium-btn premium-btn-secondary" (click)="confirm.cancel()">
              Yo'q
            </button>
            <button type="button" class="premium-btn premium-btn-danger" (click)="confirm.confirm()">
              Ha, o'chirish
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .confirm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(4px);
      }

      .confirm-card {
        width: 100%;
        max-width: 22rem;
        padding: 24px;
        border-radius: var(--radius-card);
        border: 1px solid var(--color-border);
        background: var(--color-card);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .confirm-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 8px;
      }

      .premium-btn-danger {
        background: var(--color-danger);
        color: #fff;
        border: none;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);
}
