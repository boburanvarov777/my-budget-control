import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-bg p-6">
      @if (loading()) {
        <p class="text-muted">Yuklanmoqda...</p>
      } @else {
        <div class="max-w-sm text-center">
          <div class="mb-3 text-4xl">🔐</div>
          <h2 class="mb-2 text-lg font-semibold">Kirish talab qilinadi</h2>
          <p class="text-sm leading-relaxed text-muted">
            Botda /start buyrug'ini yuboring va faqat o'z raqamingizni
            "📱 Raqamni yuborish" tugmasi orqali tasdiqlang.
            Keyin ilovani qayta oching.
          </p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .bg-bg { background: var(--color-bg); }
      .text-muted { color: var(--color-muted); }
    `,
  ],
})
export class AuthComponent implements OnInit {
  private auth = inject(AuthService);
  private telegram = inject(TelegramService);
  private router = inject(Router);

  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const initData = this.telegram.getInitData();
    if (!initData) {
      this.loading.set(false);
      return;
    }

    try {
      await this.auth.miniAppLogin(initData, this.telegram.getUsername());
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.loading.set(false);
    }
  }
}
