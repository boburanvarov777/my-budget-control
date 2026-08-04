import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FullscreenToggleComponent } from '../../shared/components/fullscreen-toggle/fullscreen-toggle.component';
import { AuthService } from '../../core/services/auth.service';
import { TelegramService } from '../../core/services/telegram.service';

/**
 * Ro'yxatdan o'tish ekrani.
 *
 * Oqim:
 *   1. Mini app ochiladi -> avtomatik login sinaladi.
 *   2. Akkaunt yo'q bo'lsa "Ro'yxatdan o'tish" tugmasi ko'rinadi.
 *   3. Tugma bosiladi -> backend bot chatiga "Raqamni yuborish" tugmasini
 *      chiqaradi -> mini app YOPILADI va @myBudgetControl_bot chati ochiladi.
 *   4. Foydalanuvchi chatdagi tugma orqali raqamini yuboradi -> bot uni
 *      ro'yxatdan o'tkazadi va "Ilovani oching" tugmasini beradi.
 *
 * Raqam hech qachon mini app ichida so'ralmaydi: uni faqat Telegram'ning o'zi
 * tasdiqlangan kontakt sifatida botga yuborishi mumkin.
 */
type Phase = 'loading' | 'welcome' | 'sent' | 'outside-telegram';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [IconComponent, FullscreenToggleComponent],
  template: `
    <div class="auth-screen premium-safe-top premium-safe-bottom">
      <div class="auth-topbar">
        <app-fullscreen-toggle />
      </div>

      @if (phase() === 'loading') {
        <div class="premium-loading">
          <div class="premium-spinner"></div>
        </div>
      }

      @if (phase() === 'welcome') {
        <div class="auth-content">
          <div class="auth-brand">
            <div class="brand-icon">
              <app-icon name="shield" [size]="28" />
            </div>
            <p class="premium-caption">Budget Control</p>
            <h1 class="premium-title">Shaxsiy moliya</h1>
            <p class="premium-body premium-muted">
              Pastdagi tugmani bosing. Mini app yopiladi va
              <strong>&#64;{{ botUsername() }}</strong> chati ochiladi — u yerda
              <strong>📱 Raqamni yuborish</strong> tugmasini bosing.
            </p>
          </div>

          @if (error()) {
            <div class="auth-error" role="alert">
              <app-icon name="circle-alert" [size]="18" />
              <span>{{ error() }}</span>
            </div>
          }

          <button
            type="button"
            class="premium-btn premium-btn-primary premium-btn-block"
            [disabled]="busy()"
            (click)="startRegistration()"
          >
            {{ busy() ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish" }}
          </button>

          <p class="field-hint">
            Raqamni qo'lda yozmang — faqat chatdagi tugma orqali yuboring.
          </p>
        </div>
      }

      @if (phase() === 'sent') {
        <div class="auth-content">
          <div class="auth-brand">
            <div class="brand-icon">
              <app-icon name="circle-check" [size]="28" />
            </div>
            <h1 class="premium-title">Botga o'ting</h1>
            <p class="premium-body premium-muted">{{ sentMessage() }}</p>
          </div>

          @if (error()) {
            <div class="auth-error" role="alert">
              <app-icon name="circle-alert" [size]="18" />
              <span>{{ error() }}</span>
            </div>
          }

          <button
            type="button"
            class="premium-btn premium-btn-primary premium-btn-block"
            (click)="openBot()"
          >
            &#64;{{ botUsername() }} ni ochish
          </button>

          <button
            type="button"
            class="premium-btn premium-btn-block"
            [disabled]="busy()"
            (click)="retryLogin()"
          >
            {{ busy() ? 'Tekshirilmoqda...' : 'Raqamni yubordim — tekshirish' }}
          </button>
        </div>
      }

      @if (phase() === 'outside-telegram') {
        <div class="auth-content">
          <div class="auth-brand">
            <div class="brand-icon">
              <app-icon name="circle-alert" [size]="28" />
            </div>
            <h1 class="premium-title">Telegram ichida oching</h1>
            <p class="premium-body premium-muted">
              Bu ilova faqat Telegram mini app sifatida ishlaydi.
              &#64;{{ botUsername() }} botini oching va menyudagi
              <strong>Ilovani oching</strong> tugmasini bosing.
            </p>
          </div>

          <button
            type="button"
            class="premium-btn premium-btn-primary premium-btn-block"
            (click)="openBot()"
          >
            Botni ochish
          </button>
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

      .auth-error {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(229, 57, 53, 0.45);
        background: rgba(229, 57, 53, 0.1);
        color: var(--color-danger);
        font-size: 13px;
        line-height: 1.45;
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

  readonly phase = signal<Phase>('loading');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sentMessage = signal('');
  readonly botUsername = signal(this.telegram.getBotUsername());

  async ngOnInit(): Promise<void> {
    const initData = await this.waitForInitData();

    // Telegram tashqarisida initData bo'lmaydi — bu yerda "Ro'yxatdan o'tish"
    // tugmasini ko'rsatish ma'nosiz, chunki u baribir ishlamaydi.
    if (!initData) {
      this.phase.set('outside-telegram');
      return;
    }

    await this.tryLogin(initData, { silent: true });
  }

  /**
   * Telegram SDK `initData` ni sahifa yuklangandan keyin biroz kechroq
   * to'ldirishi mumkin, shuning uchun qisqa muddat kutamiz.
   */
  private async waitForInitData(maxMs = 3000): Promise<string> {
    const started = Date.now();
    while (Date.now() - started < maxMs) {
      const initData = this.telegram.getInitData();
      if (initData) return initData;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return this.telegram.getInitData();
  }

  private async tryLogin(
    initData: string,
    options: { silent?: boolean } = {},
  ): Promise<boolean> {
    try {
      await this.auth.miniAppLogin(initData);
      await this.router.navigateByUrl('/dashboard');
      return true;
    } catch (e: unknown) {
      // 401 = hali ro'yxatdan o'tmagan. Bu xato emas, oddiy holat.
      if (!options.silent && !this.isUnauthorized(e)) {
        this.error.set(this.describeError(e));
      }
      if (this.phase() === 'loading') {
        this.phase.set('welcome');
      }
      return false;
    }
  }

  async startRegistration(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');

    try {
      const initData = this.telegram.getInitData();
      if (!initData) {
        this.phase.set('outside-telegram');
        return;
      }

      const result = await this.auth.beginRegistration(initData);
      if (result.botUsername) {
        this.botUsername.set(result.botUsername);
      }

      if (result.alreadyRegistered) {
        await this.tryLogin(initData);
        return;
      }

      if (!result.contactRequestSent) {
        // Bot foydalanuvchiga birinchi bo'lib yoza olmaydi: u hech qachon
        // /start bosmagan yoki botni bloklagan. Mini appni yopib qo'ysak
        // foydalanuvchi bo'sh chatda qoladi — shuning uchun tushuntiramiz.
        this.sentMessage.set(
          `Avval @${this.botUsername()} ni oching va /start bosing. ` +
            `Shundan keyin "📱 Raqamni yuborish" tugmasi chiqadi.`,
        );
        this.phase.set('sent');
        return;
      }

      this.sentMessage.set(
        `@${this.botUsername()} chatida "📱 Raqamni yuborish" tugmasi tayyor. ` +
          `Shu tugmani bosing — raqamingiz Telegram orqali yuboriladi.`,
      );
      this.phase.set('sent');

      // Mini appni yopib, o'z botimiz chatini ochamiz.
      this.telegram.openBotChat(this.botUsername());
    } catch (e: unknown) {
      this.error.set(this.describeError(e));
      if (this.phase() !== 'sent') {
        this.phase.set('welcome');
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** "Raqamni yubordim" — mini app yopilmagan bo'lsa qayta tekshirish. */
  async retryLogin(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');

    try {
      const initData = this.telegram.getInitData();
      if (!initData) {
        this.phase.set('outside-telegram');
        return;
      }

      const ok = await this.tryLogin(initData, { silent: true });
      if (!ok) {
        this.phase.set('sent');
        this.error.set(
          `Hali ro'yxatdan o'tmadingiz. @${this.botUsername()} chatidagi ` +
            `"📱 Raqamni yuborish" tugmasini bosing.`,
        );
      }
    } finally {
      this.busy.set(false);
    }
  }

  openBot(): void {
    this.telegram.openBotChat(this.botUsername());
  }

  private isUnauthorized(e: unknown): boolean {
    return e instanceof HttpErrorResponse && e.status === 401;
  }

  private describeError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0 || e.status >= 502) {
        return "Server vaqtincha ishlamayapti. 1-2 daqiqadan keyin qayta urinib ko'ring.";
      }
      const msg = e.error?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string' && msg.trim()) return msg;
      if (e.status === 401) {
        return `Telegram sessiyasi yaroqsiz. Ilovani @${this.botUsername()} orqali qayta oching.`;
      }
    }
    if (e instanceof Error && e.message) return e.message;
    return 'Xatolik yuz berdi';
  }
}
