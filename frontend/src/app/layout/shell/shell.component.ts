import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="shell premium-safe-top premium-safe-bottom">
      <div class="shell-inner">
        <router-outlet />
      </div>
      <app-bottom-nav />
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
      }
    `,
  ],
})
export class ShellComponent {}
