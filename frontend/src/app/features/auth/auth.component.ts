import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-bg px-4">
      <div class="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl">
        <div class="mb-6 text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl"
          >
            💳
          </div>
          <h1 class="text-xl font-semibold">Budget Control</h1>
          <p class="mt-2 text-sm text-muted">
            Shaxsiy moliyaviy ma'lumotlaringiz himoyalangan. Faqat tasdiqlangan
            foydalanuvchi kirishi mumkin.
          </p>
        </div>

        @if (error()) {
          <div class="error-box mb-4 rounded-xl px-4 py-3 text-sm">
            {{ error() }}
          </div>
        }

        <button
          type="button"
          class="w-full rounded-2xl bg-accent px-4 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          [disabled]="loading()"
          (click)="authenticate()"
        >
          @if (loading()) {
            Tekshirilmoqda...
          } @else {
            Telefon raqamni yuborish
          }
        </button>

        <p class="mt-4 text-center text-xs text-muted">
          Telegram orqali telefon va username tekshiriladi
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .bg-bg {
        background: var(--color-bg);
      }
      .bg-surface {
        background: var(--color-surface);
      }
      .border-border {
        border-color: var(--color-border);
      }
      .bg-accent {
        background: var(--color-accent);
      }
      .bg-accent-soft {
        background: var(--color-accent-soft);
      }
      .text-muted {
        color: var(--color-muted);
      }
      .text-danger {
        color: var(--color-danger);
      }
      .error-box {
        border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
        background: color-mix(in srgb, var(--color-danger) 10%, transparent);
        color: var(--color-danger);
      }
    `,
  ],
})
export class AuthComponent {
  private auth = inject(AuthService);
  private telegram = inject(TelegramService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  async authenticate(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const initData = this.telegram.getInitData();
      if (!initData) {
        throw new Error('Telegram Mini App ichida oching');
      }

      let phone = await this.telegram.requestPhone();
      if (!phone) {
        phone = prompt('Telefon raqamingiz (+998...):') ?? '';
      }
      if (!phone) {
        throw new Error('Telefon raqam talab qilinadi');
      }

      await this.auth.login(initData, phone, this.telegram.getUsername());
      await this.router.navigateByUrl('/dashboard');
    } catch (e: unknown) {
      let msg = 'Kirish rad etildi';
      if (e instanceof Error) msg = e.message;
      if (e && typeof e === 'object' && 'error' in e) {
        const err = (e as { error?: { message?: string | string[] } }).error;
        if (err?.message) {
          msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        }
      }
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
