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
              Ro'yxatdan o'tish uchun pastdagi tugmani bosing. Mini app yopiladi —
              chatda <strong>📱 Raqamni yuborish</strong> tugmasini bosing.
            </p>
          </div>

          <button
            type="button"
            class="premium-btn premium-btn-primary premium-btn-block"
            [disabled]="loading()"
            (click)="startRegistration()"
          >
            {{ loading() ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish" }}
          </button>

          <p class="field-hint">
            Raqamni qo'lda yozmang — faqat chatdagi tugma orqali yuboring.
          </p>
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
        margin: 12px auto 16px;
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
        gap: 20px;
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

      .field-hint {
        margin: 0;
        font-size: 13px;
        color: var(--color-muted);
        text-align: center;
        line-height: 1.45;
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
  private registering = false;

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
    if (this.registering) return;
    this.registering = true;
    this.loading.set(true);

    try {
      const initData = this.telegram.getInitData();
      if (!initData) {
        throw new Error('Ilovani Telegram ichida oching');
      }

      const { alreadyRegistered } = await this.auth.beginRegistration(initData);
      if (alreadyRegistered) {
        await this.auth.miniAppLogin(initData);
        await this.router.navigateByUrl('/dashboard');
        return;
      }

      this.telegram.closeApp();
      setTimeout(() => {
        alert(
          "Chatga qayting va pastdagi 📱 Raqamni yuborish tugmasini bosing.",
        );
      }, 600);
    } catch (e: unknown) {
      alert(this.extractError(e));
    } finally {
      this.registering = false;
      this.loading.set(false);
      if (this.phase() === 'loading') {
        this.phase.set('welcome');
      }
    }
  }

  private extractError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0 || e.status >= 502) {
        return "Server vaqtincha ishlamayapti. 1-2 daqiqadan keyin qayta urinib ko'ring.";
      }
      const msg = e.error?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      if (e.status === 401) {
        return "Telegram sessiyasi yaroqsiz. Botni @myBudgetControl_bot orqali oching.";
      }
    }
    if (e instanceof Error) return e.message;
    return 'Xatolik yuz berdi';
  }
}
