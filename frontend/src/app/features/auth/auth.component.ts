import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

type AuthPhase = 'welcome' | 'phone' | 'code';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="relative min-h-screen bg-bg">
      @if (phase() === 'welcome') {
        <div class="modal-overlay">
          <div class="modal-card">
            <div class="modal-icon">👋</div>
            <h2 class="modal-title">Iltimos, ro'yxatdan o'ting</h2>
            <p class="modal-text">
              Bu ilova shaxsiy moliyaviy ma'lumotlaringizni himoya qiladi.
              Davom etish uchun ro'yxatdan o'ting.
            </p>
            <button type="button" class="btn-primary w-full" (click)="startRegistration()">
              Ro'yxatdan o'tish
            </button>
          </div>
        </div>
      }

      <div class="flex min-h-screen items-center justify-center px-4" [class.hidden]="phase() === 'welcome'">
        <div class="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <div class="mb-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
              🔐
            </div>
            <h1 class="text-xl font-semibold">Ro'yxatdan o'tish</h1>
            <p class="mt-2 text-sm text-muted">
              @if (phase() === 'phone') {
                O'z raqamingizni yuboring. Boshqa raqam nusxasi yoki qo'lda yozish ishlamaydi.
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

          @if (phase() === 'phone') {
            <button
              type="button"
              class="btn-primary w-full"
              [disabled]="loading()"
              (click)="sendPhone()"
            >
              {{ loading() ? 'Tekshirilmoqda...' : '📱 Raqamni yuborish' }}
            </button>
            <p class="mt-4 text-center text-xs text-muted">
              Telegram "Raqamni ulashish" oynasida faqat o'z raqamingizni tanlang
            </p>
          }

          @if (phase() === 'code') {
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
              <button type="button" class="btn-link w-full" (click)="resetPhone()">
                Qaytadan raqam yuborish
              </button>
            </form>
          }
        </div>
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
      .hidden { visibility: hidden; pointer-events: none; }
      .modal-overlay {
        position: fixed; inset: 0; z-index: 50;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
        padding: 1rem;
      }
      .modal-card {
        width: 100%; max-width: 22rem;
        border-radius: 1.5rem; border: 1px solid var(--color-border);
        background: var(--color-surface); padding: 1.75rem;
        text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      }
      .modal-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
      .modal-title { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
      .modal-text { font-size: 0.875rem; color: var(--color-muted); margin: 0 0 1.25rem; line-height: 1.5; }
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
        padding: 0.875rem; border: none; font-weight: 500; cursor: pointer;
      }
      .btn-primary:disabled { opacity: 0.5; }
      .btn-link {
        background: none; border: none; color: var(--color-muted);
        font-size: 0.875rem; padding: 0.5rem; cursor: pointer;
      }
    `,
  ],
})
export class AuthComponent {
  private auth = inject(AuthService);
  private telegram = inject(TelegramService);
  private router = inject(Router);

  phase = signal<AuthPhase>('welcome');
  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);
  code = '';
  private phone = '';
  private initData = '';

  startRegistration(): void {
    this.telegram.expandApp();
    this.phase.set('phone');
    this.error.set(null);
  }

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
      this.phase.set('code');
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

  resetPhone(): void {
    this.phase.set('phone');
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
