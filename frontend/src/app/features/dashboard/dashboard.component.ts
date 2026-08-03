import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [StatCardComponent, ProgressBarComponent, RouterLink],
  template: `
    <section class="space-y-6">
      <header>
        <p class="text-sm text-muted">Salom</p>
        <h1 class="text-2xl font-semibold">{{ data()?.greeting ?? '...' }} 👋</h1>
        <p class="text-sm text-muted">Bu oy</p>
      </header>

      @if (data(); as d) {
        <div class="grid grid-cols-2 gap-3">
          <app-stat-card label="Daromad" [amount]="d.month.income" variant="success" />
          <app-stat-card label="Xarajat" [amount]="d.month.expense" variant="danger" />
          <app-stat-card label="Qarz" [amount]="d.month.debt" variant="danger" />
          <app-stat-card label="Jamg'arma" [amount]="d.month.savings" variant="accent" />
        </div>

        <div class="rounded-2xl border border-border bg-surface-2 p-4">
          <p class="text-sm text-muted">Qolgan pul</p>
          <p class="text-3xl font-bold text-success">{{ format(d.month.remaining) }}</p>
        </div>

        @if (d.goals.length) {
          <div class="space-y-4">
            <h2 class="text-sm font-medium text-muted">Goal Progress</h2>
            @for (goal of d.goals; track goal.id) {
              <div class="rounded-2xl border border-border bg-surface-2 p-4">
                <div class="mb-2 flex items-center gap-2">
                  <span>{{ goal.icon ?? '🎯' }}</span>
                  <span class="font-medium">{{ goal.name }}</span>
                </div>
                <app-progress-bar
                  [progress]="goal.progress"
                  [subtitle]="format(goal.savedAmount) + ' / ' + format(goal.targetAmount)"
                />
              </div>
            }
          </div>
        }

        <div class="grid grid-cols-2 gap-2">
          @for (link of menuLinks; track link.path) {
            <a
              [routerLink]="link.path"
              class="rounded-2xl border border-border bg-surface-2 px-3 py-3 text-sm transition hover:border-accent/40"
            >
              <span class="mr-1">{{ link.icon }}</span>{{ link.label }}
            </a>
          }
        </div>
      } @else if (loading()) {
        <p class="text-center text-muted">Yuklanmoqda...</p>
      }
    </section>
  `,
  styles: [
    `
      .border-border {
        border-color: var(--color-border);
      }
      .bg-surface-2 {
        background: var(--color-surface-2);
      }
      .text-muted {
        color: var(--color-muted);
      }
      .text-success {
        color: var(--color-success);
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  data = signal<DashboardData | null>(null);
  loading = signal(true);
  format = formatMoney;

  menuLinks = [
    { path: '/credits', icon: '📄', label: 'Kredit' },
    { path: '/installments', icon: '📱', label: 'Muddatli' },
    { path: '/micro-loans', icon: '💳', label: 'Mikroqarz' },
    { path: '/savings', icon: '🏦', label: "Jamg'arma" },
    { path: '/budget', icon: '📋', label: 'Budget' },
    { path: '/calendar', icon: '📅', label: 'Kalendar' },
    { path: '/statistics', icon: '📊', label: 'Hisobot' },
    { path: '/ai', icon: '🤖', label: 'AI' },
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
