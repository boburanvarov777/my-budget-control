import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-bg px-4">
      <div class="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl">
        <div class="mb-6 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
            🔐
          </div>
          <h1 class="text-xl font-semibold">Budget Control</h1>
          <p class="mt-2 text-sm text-muted">
            @if (step() === 1) {
              Faqat o'z Telegram raqamingizni yuboring. Boshqa raqam nusxasi ishlamaydi.
            } @else {
              @VerificationCodes kanalidan kodni oling va kiriting.
            }
          </p>
        </div>

        @if (error()) {
          <div class="error-box mb-4 rounded-xl px-4 py-3 text-sm">{{ error() }}</div>
        }

        @if (info()) {
          <div class="info-box mb-4 rounded-xl px-4 py-3 text-sm">{{ info() }}</div>
        }

        @if (step() === 1) {
          <button
            type="button"
            class="btn-primary w-full"
            [disabled]="loading()"
            (click)="sendPhone()"
          >
            {{ loading() ? 'Tekshirilmoqda...' : '📱 Raqamni yuborish' }}
          </button>
          <p class="mt-4 text-center text-xs text-muted">
            Telegram "Raqamni ulashish" oynasi ochiladi — o'z raqamingizni tanlang
          </p>
        } @else {
          <form class="space-y-3" (ngSubmit)="verify()">
            <input
              class="field"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="6 xonali kod"
              [(ngModel)]="code"
              name="code"
              required
            />
            <button type="submit" class="btn-primary w-full" [disabled]="loading()">
              {{ loading() ? 'Tekshirilmoqda...' : 'Tasdiqlash' }}
            </button>
            <button type="button" class="btn-link w-full" (click)="reset()">
              Qaytadan raqam yuborish
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .bg-bg { background: var(--color-bg); }
      .bg-surface { background: var(--color-surface); }
      .border-border { border-color: var(--color-border); }
      .bg-accent-soft { background: var(--color-accent-soft); }
      .text-muted { color: var(--color-muted); }
      .error-box {
        border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
        background: color-mix(in srgb, var(--color-danger) 10%, transparent);
        color: var(--color-danger);
      }
      .info-box {
        border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
        background: color-mix(in srgb, var(--color-accent) 10%, transparent);
        color: var(--color-accent);
      }
      .field {
        width: 100%; border-radius: 12px; border: 1px solid var(--color-border);
        background: var(--color-bg); color: var(--color-text);
        padding: 0.875rem 1rem; text-align: center; font-size: 1.25rem; letter-spacing: 0.3em;
      }
      .btn-primary {
        border-radius: 12px; background: var(--color-accent); color: white;
        padding: 0.875rem; border: none; font-weight: 500;
      }
      .btn-primary:disabled { opacity: 0.5; }
      .btn-link {
        background: none; border: none; color: var(--color-muted);
        font-size: 0.875rem; padding: 0.5rem;
      }
    `,
  ],
})
export class AuthComponent {
  private auth = inject(AuthService);
  private telegram = inject(TelegramService);
  private router = inject(Router);

  step = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);
  code = '';
  private phone = '';
  private initData = '';

  async sendPhone(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);

    try {
      this.initData = this.telegram.getInitData();
      if (!this.initData) throw new Error('Telegram Mini App ichida oching');

      this.phone = await this.telegram.requestPhone();

      const res = await this.auth.requestCode(
        this.initData,
        this.phone,
        this.telegram.getUsername(),
      );

      this.info.set(res.message);
      this.step.set(2);
    } catch (e: unknown) {
      this.error.set(this.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async verify(): Promise<void> {
    if (this.code.length !== 6) {
      this.error.set('6 xonali kod kiriting');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.verifyCode(
        this.initData,
        this.phone,
        this.code,
        this.telegram.getUsername(),
      );
      await this.router.navigateByUrl('/dashboard');
    } catch (e: unknown) {
      this.error.set(this.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.step.set(1);
    this.code = '';
    this.error.set(null);
    this.info.set(null);
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
