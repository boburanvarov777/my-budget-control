import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { formatMoney } from '../../shared/utils/format.util';

interface DashboardData {
  greeting: string;
  month: {
    income: number;
    expense: number;
    debt: number;
    savings: number;
    remaining: number;
  };
  goals: Array<{
    id: string;
    name: string;
    icon?: string;
    targetAmount: number;
    savedAmount: number;
    progress: number;
  }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    StatCardComponent,
    ProgressBarComponent,
    RouterLink,
    IconComponent,
  ],
  template: `
    <section class="premium-page">
      @if (data(); as d) {
        <header class="hero">
          <p class="premium-caption">Xush kelibsiz</p>
          <h1 class="premium-title">{{ d.greeting }}</h1>
          <p class="premium-small premium-muted">Joriy oy moliyaviy holati</p>
        </header>

        <div class="premium-card-hero premium-card-accent">
          <div class="flex items-center gap-2 mb-2">
            <app-icon name="wallet" [size]="18" class="text-gold" />
            <span class="premium-caption">Qolgan balans</span>
          </div>
          <p class="amount-xl text-gold">{{ format(d.month.remaining) }}</p>
        </div>

        <div class="premium-grid-2">
          <app-stat-card label="Daromad" [amount]="d.month.income" variant="success" />
          <app-stat-card label="Xarajat" [amount]="d.month.expense" variant="danger" />
          <app-stat-card label="Qarz" [amount]="d.month.debt" variant="danger" [highlight]="true" />
          <app-stat-card label="Jamg'arma" [amount]="d.month.savings" variant="gold" />
        </div>

        @if (d.goals.length) {
          <div>
            <div class="section-head">
              <h2 class="premium-section-title">Maqsadlar</h2>
              <a routerLink="/goals" class="premium-small text-gold link">Barchasi</a>
            </div>
            <div class="space-y-3 mt-3">
              @for (goal of d.goals.slice(0, 3); track goal.id) {
                <div class="premium-card premium-card-accent">
                  <div class="flex items-center justify-between mb-3">
                    <p class="premium-body">{{ goal.name }}</p>
                    <span class="premium-chip">{{ goal.progress }}%</span>
                  </div>
                  <app-progress-bar
                    [progress]="goal.progress"
                    [subtitle]="format(goal.savedAmount) + ' / ' + format(goal.targetAmount)"
                  />
                </div>
              }
            </div>
          </div>
        }

        <div>
          <h2 class="premium-section-title mb-3">Tezkor kirish</h2>
          <div class="premium-grid-links">
            @for (link of quickLinks; track link.path) {
              <a [routerLink]="link.path" class="premium-link-tile">
                <app-icon [name]="link.icon" [size]="16" />
                {{ link.label }}
              </a>
            }
          </div>
        </div>
      } @else if (loading()) {
        <div class="premium-loading">
          <div class="premium-spinner"></div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .hero { display: flex; flex-direction: column; gap: 4px; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
      .gap-2 { gap: 8px; }
      .mb-2 { margin-bottom: 8px; }
      .mb-3 { margin-bottom: 12px; }
      .mt-3 { margin-top: 12px; }
      .space-y-3 > * + * { margin-top: 12px; }
      .section-head { display: flex; align-items: center; justify-content: space-between; }
      .link { text-decoration: none; }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  data = signal<DashboardData | null>(null);
  loading = signal(true);
  format = formatMoney;

  quickLinks = [
    { path: '/transactions', icon: 'trending-up', label: 'Tranzaksiya' },
    { path: '/debts', icon: 'credit-card', label: 'Qarzlar' },
    { path: '/budget', icon: 'wallet', label: 'Byudjet' },
    { path: '/statistics', icon: 'trending-down', label: 'Statistika' },
  ];

  ngOnInit(): void {
    this.api.get<DashboardData>('/dashboard').subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
