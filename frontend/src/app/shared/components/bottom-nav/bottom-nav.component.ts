import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IconComponent,
  ],
  template: `
    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="nav-item"
          >
            <app-icon [name]="item.icon" [size]="20" />
            <span>{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: [
    `
      .bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        padding-bottom: env(safe-area-inset-bottom);
        background: rgba(17, 17, 17, 0.96);
        border-top: 1px solid var(--color-border);
        backdrop-filter: blur(12px);
      }

      .bottom-nav-inner {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        max-width: 32rem;
        margin: 0 auto;
        padding: 8px 4px 10px;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px 2px;
        border-radius: 12px;
        color: var(--color-muted-2);
        text-decoration: none;
        font-size: 9px;
        font-weight: 500;
        letter-spacing: 0.01em;
        transition: color 250ms ease, background 250ms ease;
      }

      .nav-item.active {
        color: var(--color-gold);
        background: var(--color-gold-soft);
      }
    `,
  ],
})
export class BottomNavComponent {
  items = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard', exact: true },
    { path: '/transactions', icon: 'arrow-left-right', label: 'Kirim-chiqim' },
    { path: '/categories', icon: 'tags', label: 'Kategoriya' },
    { path: '/goals', icon: 'target', label: 'Maqsad' },
    { path: '/debts', icon: 'credit-card', label: 'Qarz' },
    { path: '/settings', icon: 'user', label: 'Profil' },
  ];
}
