import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { FullscreenToggleComponent } from '../../shared/components/fullscreen-toggle/fullscreen-toggle.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, FullscreenToggleComponent, ConfirmDialogComponent],
  template: `
    <div class="shell premium-safe-top premium-safe-bottom">
      <div class="shell-topbar">
        <div class="shell-inner shell-topbar-inner">
          <span class="premium-caption">Budget Control</span>
          <app-fullscreen-toggle />
        </div>
      </div>
      <div class="shell-inner">
        <router-outlet />
      </div>
      <app-bottom-nav />
      <app-confirm-dialog />
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100dvh;
        background: var(--color-bg);
      }

      .shell-inner {
        max-width: 32rem;
        margin: 0 auto;
        padding: 0 16px;
        min-width: 0;
        overflow-x: hidden;
      }

      .shell-topbar {
        position: sticky;
        top: 0;
        z-index: 30;
        padding: 18px 0 8px;
        background: linear-gradient(180deg, var(--color-bg) 70%, transparent);
      }

      .shell-topbar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `,
  ],
})
export class ShellComponent {}
