import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

@Component({
  selector: 'app-auth',
  standalone: true,
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

      @if (loading() && phase() !== 'welcome') {
        <div class="flex min-h-screen items-center justify-center text-muted">
          Yuklanmoqda...
        </div>
      }
    </div>
  `,
  styles: [
    `
      .bg-bg { background: var(--color-bg); }
      .border-border { border-color: var(--color-border); }
      .bg-surface { background: var(--color-surface); }
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

  phase = signal<'welcome' | 'loading'>('loading');
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const initData = this.telegram.getInitData();
    if (!initData) {
      this.phase.set('welcome');
      this.loading.set(false);
      return;
    }

    try {
      await this.auth.miniAppLogin(initData, this.telegram.getUsername());
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.phase.set('welcome');
      this.loading.set(false);
    }
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
