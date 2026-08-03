import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FullscreenToggleComponent } from '../../shared/components/fullscreen-toggle/fullscreen-toggle.component';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [IconComponent, FullscreenToggleComponent],
  template: `
    <div class="auth-screen premium-safe-top premium-safe-bottom">
      <div class="auth-topbar">
        <app-fullscreen-toggle />
      </div>

      @if (phase() === 'welcome') {
        <div class="auth-content">
          <div class="auth-brand">
            <div class="brand-icon">
              <app-icon name="shield" [size]="28" />
            </div>
            <p class="premium-caption">Budget Control</p>
            <h1 class="premium-title">Shaxsiy moliya</h1>
            <p class="premium-body premium-muted">
              Premium moliyaviy boshqaruv ilovasi. Ro'yxatdan o'tish uchun botda
              /start bosing va o'z raqamingizni yuboring.
            </p>
          </div>

          <button
            type="button"
            class="premium-btn premium-btn-primary premium-btn-block"
            [disabled]="loading()"
            (click)="startRegistration()"
          >
            {{ loading() ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish" }}
          </button>
        </div>
      }

      @if (loading() && phase() !== 'welcome') {
        <div class="premium-loading">
          <div class="premium-spinner"></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .auth-screen {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        padding: 24px 16px;
        background: var(--color-bg);
      }

      .auth-topbar {
        display: flex;
        justify-content: flex-end;
        width: 100%;
        max-width: 32rem;
        margin: 0 auto 16px;
      }

      .auth-screen:has(.auth-content),
      .auth-screen:has(.premium-loading) {
        align-items: center;
        justify-content: center;
      }

      .auth-content {
        width: 100%;
        max-width: 22rem;
        display: flex;
        flex-direction: column;
        gap: 32px;
        animation: fadeIn 250ms ease;
      }

      .auth-brand {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .brand-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 16px;
        border: 1px solid rgba(212, 175, 55, 0.35);
        background: var(--color-gold-soft);
        color: var(--color-gold);
      }
    `,
  ],
})
export class AuthComponent implements OnInit {
  private auth = inject(AuthService);
  private telegram = inject(TelegramService);
  private router = inject(Router);

  phase = signal<'welcome' | 'loading'>('loading');
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const initData = await this.waitForInitData();
    if (!initData) {
      this.phase.set('welcome');
      this.loading.set(false);
      return;
    }

    try {
      await this.auth.miniAppLogin(initData);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.phase.set('welcome');
    } finally {
      this.loading.set(false);
    }
  }

  private async waitForInitData(maxMs = 3000): Promise<string> {
    const started = Date.now();
    while (Date.now() - started < maxMs) {
      const initData = this.telegram.getInitData();
      if (initData) return initData;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return this.telegram.getInitData();
  }

  async startRegistration(): Promise<void> {
    this.loading.set(true);

    try {
      const initData = this.telegram.getInitData();
      if (!initData) throw new Error('Telegram Mini App ichida oching');

      await this.auth.beginRegistration(initData);
      this.telegram.closeApp();
    } catch (e: unknown) {
      this.phase.set('welcome');
      this.loading.set(false);
      alert(this.extractError(e));
    }
  }

  private extractError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = e.error?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }
    if (e instanceof Error) return e.message;
    return 'Xatolik yuz berdi';
  }
}
