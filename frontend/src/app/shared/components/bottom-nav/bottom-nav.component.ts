import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md"
    >
      <div class="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="nav-active"
            class="flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] text-muted transition"
          >
            <span class="text-base">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .border-border {
        border-color: var(--color-border);
      }
      .bg-surface {
        background: var(--color-surface);
      }
      .text-muted {
        color: var(--color-muted);
      }
      .nav-active {
        color: var(--color-accent);
        background: var(--color-accent-soft);
      }
    `,
  ],
})
export class BottomNavComponent {
  items = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/income', icon: '💰', label: 'Daromad' },
    { path: '/expenses', icon: '💸', label: 'Xarajat' },
    { path: '/goals', icon: '🎯', label: 'Maqsad' },
    { path: '/settings', icon: '⚙️', label: 'Sozlama' },
  ];
}
