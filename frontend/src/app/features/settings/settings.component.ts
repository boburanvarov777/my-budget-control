import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { formatMoney, currentMonthYear } from '../../shared/utils/format.util';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">Sozlamalar</h1>

      @if (user(); as u) {
        <div class="card">
          <p class="font-medium">{{ u.firstName ?? u.username }}</p>
          <p class="text-sm text-muted">@{{ u.username ?? 'username' }}</p>
        </div>
      }

      @if (report(); as r) {
        <div class="card space-y-2">
          <h3 class="text-sm text-muted">Oy oxiri hisobot</h3>
          <p>Daromad: {{ format(r.income) }}</p>
          <p>Xarajat: {{ format(r.expense) }}</p>
          <p>Jamg'arma: {{ format(r.savings) }}</p>
          <p>Qolgan: {{ format(r.remaining) }}</p>
        </div>
      }

      <div class="card space-y-2">
        <h3 class="text-sm text-muted">Bildirishnomalar</h3>
        @for (n of notifications(); track n.id) {
          <div class="text-sm border-b border-border pb-2">
            <p>{{ n.title }}</p>
            <p class="text-muted text-xs">{{ n.message }}</p>
          </div>
        } @empty {
          <p class="text-muted text-sm">Bildirishnomalar yo'q</p>
        }
      </div>

      <button class="btn-danger" (click)="logout()">Chiqish</button>
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .text-muted { color: var(--color-muted); }
    .border-border { border-color: var(--color-border); }
    .btn-danger { width: 100%; border-radius: 12px; background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); padding: 0.75rem; }
  `],
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  user = this.auth.user;
  report = signal<any>(null);
  notifications = signal<any[]>([]);
  format = formatMoney;

  ngOnInit(): void {
    const { month, year } = currentMonthYear();
    this.api.get<any>('/reports/monthly', { month, year }).subscribe((r) => this.report.set(r));
    this.api.get<any[]>('/notifications').subscribe((r) => this.notifications.set(r));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/auth');
  }
}
