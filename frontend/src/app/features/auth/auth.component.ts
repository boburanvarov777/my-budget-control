import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

type AuthPhase = 'welcome' | 'code';

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
              Davom etish uchun ro'yxatdan o'ting — botga qaytasiz va raqamingizni yuborasiz.
            </p>
            <button
              type="button"
              class="btn-primary w-full"
              [disabled]="loading()"
              (click)="startRegistration()"
            >
              {{ loading() ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish" }}
            </button>
          </div>
        </div>
      }

      @if (phase() === 'code') {
        <div class="flex min-h-screen items-center justify-center px-4">
          <div class="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div class="mb-6 text-center">
              <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
                🔐
              </div>
              <h1 class="text-xl font-semibold">Tasdiqlash kodi</h1>
              <p class="mt-2 text-sm text-muted">
                @VerificationCodes kanalidan kodni oling va kiriting.
              </p>
            </div>

            @if (error()) {
              <div class="error-box mb-4 rounded-xl px-4 py-3 text-sm">{{ error() }}</div>
            }

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
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .bg-bg { background: var(--color-bg); }
      .bg-surface { background: var(--color-surface); }
      .border-border { border-color: var(--color-border); }
      .bg-accent-soft { background: var(--color-accent-soft); }
      .text-muted { color: var(--color-muted); }
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
    `,
  ],
})
export class AuthComponent implements OnInit {
  private auth = inject(AuthService);
  private telegram = inject(TelegramService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  phase = signal<AuthPhase>('welcome');
  loading = signal(false);
  error = signal<string | null>(null);
  code = '';
  private initData = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['step'] === 'code') {
        this.phase.set('code');
        this.initData = this.telegram.getInitData();
      }
    });
  }

  async startRegistration(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.initData = this.telegram.getInitData();
      if (!this.initData) throw new Error('Telegram Mini App ichida oching');

      await this.auth.beginRegistration(this.initData);
      this.telegram.closeApp();
    } catch (e: unknown) {
      this.error.set(this.extractError(e));
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
      if (!this.initData) {
        this.initData = this.telegram.getInitData();
      }
      await this.auth.verifyCode(
        this.initData,
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
