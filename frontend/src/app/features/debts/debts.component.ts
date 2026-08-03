import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    IconComponent,
  ],
  template: `
    <section class="premium-page">
      <app-page-header
        title="Qarzlar"
        subtitle="Kredit, muddatli to'lov va mikroqarzlar"
      />

      <div class="space-y-3">
        @for (item of debtLinks; track item.path) {
          <a [routerLink]="item.path" class="premium-list-item nav-link">
            <div class="flex items-center gap-3">
              <div class="premium-list-icon" [class.active]="item.primary">
                <app-icon [name]="item.icon" [size]="18" />
              </div>
              <div>
                <p class="premium-body">{{ item.label }}</p>
                <p class="premium-small premium-muted">{{ item.desc }}</p>
              </div>
            </div>
            <app-icon name="chevron-right" [size]="18" class="premium-muted" />
          </a>
        }
      </div>

      <div class="premium-section">
        <p class="premium-caption mb-3">Boshqa</p>
        <div class="premium-grid-links">
          @for (link of otherLinks; track link.path) {
            <a [routerLink]="link.path" class="premium-link-tile">
              <app-icon [name]="link.icon" [size]="16" />
              {{ link.label }}
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .space-y-3 > * + * { margin-top: 12px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .nav-link { text-decoration: none; color: inherit; cursor: pointer; }
      .premium-section { margin-top: 8px; }
    `,
  ],
})
export class DebtsComponent {
  debtLinks = [
    {
      path: '/credits',
      icon: 'credit-card',
      label: 'Kreditlar',
      desc: 'Bank kreditlari va to\'lov jadvali',
      primary: true,
    },
    {
      path: '/installments',
      icon: 'smartphone',
      label: 'Muddatli to\'lov',
      desc: 'Telefon va jihozlar bo\'lib to\'lash',
      primary: false,
    },
    {
      path: '/micro-loans',
      icon: 'wallet',
      label: 'Mikroqarzlar',
      desc: 'Uzum, Alif, Payme va boshqalar',
      primary: false,
    },
  ];

  otherLinks = [
    { path: '/savings', icon: 'piggy-bank', label: "Jamg'arma" },
    { path: '/budget', icon: 'wallet', label: 'Byudjet' },
    { path: '/calendar', icon: 'calendar', label: 'Kalendar' },
    { path: '/statistics', icon: 'bar-chart-3', label: 'Statistika' },
    { path: '/ai', icon: 'sparkles', label: 'AI' },
  ];
}
