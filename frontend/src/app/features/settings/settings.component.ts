import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { formatMoney, currentMonthYear } from '../../shared/utils/format.util';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    PageHeaderComponent,
    IconComponent,
  ],
  template: `
    <section class="premium-page">
      <app-page-header title="Profil" subtitle="Hisob va sozlamalar" />

      @if (user(); as u) {
        <div class="premium-card-hero premium-card-accent">
          <div class="flex items-center gap-3">
            <div class="avatar">
              <app-icon name="user" [size]="22" />
            </div>
            <div>
              <p class="premium-section-title">{{ u.firstName ?? u.username ?? 'Foydalanuvchi' }}</p>
              @if (u.username) {
                <p class="premium-small premium-muted">@{{ u.username }}</p>
              }
            </div>
          </div>
        </div>
      }

      @if (report(); as r) {
        <div class="premium-card">
          <div class="flex items-center gap-2 mb-3">
            <app-icon name="file-text" [size]="16" class="text-gold" />
            <h3 class="premium-caption">Oy oxiri hisobot</h3>
          </div>
          <div class="premium-card-row">
            <span class="premium-muted">Daromad</span>
            <span class="text-success">{{ format(r.income) }}</span>
          </div>
          <div class="premium-card-row">
            <span class="premium-muted">Xarajat</span>
            <span class="text-danger">{{ format(r.expense) }}</span>
          </div>
          <div class="premium-card-row">
            <span class="premium-muted">Jamg'arma</span>
            <span class="text-gold">{{ format(r.savings) }}</span>
          </div>
          <div class="premium-card-row">
            <span class="premium-muted">Qolgan</span>
            <span>{{ format(r.remaining) }}</span>
          </div>
        </div>
      }

      <div class="premium-card">
        <div class="flex items-center gap-2 mb-3">
          <app-icon name="bell" [size]="16" class="text-gold" />
          <h3 class="premium-caption">Bildirishnomalar</h3>
        </div>
        @for (n of notifications(); track n.id) {
          <div class="notify-item">
            <p class="premium-small">{{ n.title }}</p>
            <p class="premium-caption">{{ n.message }}</p>
          </div>
        } @empty {
          <p class="premium-small premium-muted">Bildirishnomalar yo'q</p>
        }
      </div>

      <button type="button" class="premium-btn premium-btn-danger premium-btn-block" (click)="logout()">
        <app-icon name="log-out" [size]="18" />
        Chiqish
      </button>
    </section>
  `,
  styles: [
    `
      .flex { display: flex; }
      .items-center { align-items: center; }
      .gap-2 { gap: 8px; }
      .gap-3 { gap: 12px; }
      .mb-3 { margin-bottom: 12px; }
      .avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: var(--color-gold-soft);
        border: 1px solid rgba(212, 175, 55, 0.35);
        color: var(--color-gold);
      }
      .notify-item {
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border);
      }
      .notify-item:last-child { border-bottom: none; padding-bottom: 0; }
    `,
  ],
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
