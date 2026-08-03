import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="min-h-screen bg-bg pb-24">
      <div class="mx-auto max-w-lg px-4 pt-4">
        <router-outlet />
      </div>
      <app-bottom-nav />
    </div>
  `,
  styles: [
    `
      .bg-bg {
        background: var(--color-bg);
      }
    `,
  ],
})
export class ShellComponent {}
