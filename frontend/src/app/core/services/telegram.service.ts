import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  readonly fullscreen = signal(false);

  get webApp(): TelegramWebApp | null {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp ?? null : null;
  }

  init(): void {
    const tg = this.webApp;
    if (!tg) return;
    tg.ready();
    tg.setHeaderColor('#090909');
    tg.setBackgroundColor('#090909');
    this.expandToFullHeight();
  }

  /** Mini app ochilganda to'liq balandlikka kengaytirish (Telegram header qoladi) */
  expandToFullHeight(): void {
    const tg = this.webApp;
    if (!tg) return;

    const expand = () => {
      if (!tg.isExpanded) tg.expand();
    };

    expand();
    requestAnimationFrame(expand);
    setTimeout(expand, 50);
    setTimeout(expand, 300);
  }

  isFullscreen(): boolean {
    return this.fullscreen() || !!this.webApp?.isFullscreen;
  }

  enterFullscreen(): void {
    const tg = this.webApp;
    if (!tg) return;
    this.expandToFullHeight();
    tg.requestFullscreen?.();
    this.fullscreen.set(true);
  }

  exitFullscreen(): void {
    this.webApp?.exitFullscreen?.();
    this.fullscreen.set(false);
  }

  toggleFullscreen(): void {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  closeApp(): void {
    const tg = this.webApp;
    if (!tg) return;
    tg.close();
  }

  /**
   * O'z botimiz username'i.
   *
   * DIQQAT: bu yerda `initDataUnsafe.receiver` ISHLATILMAYDI. `receiver` —
   * mini app attachment menu orqali ochilganda suhbatdoshning akkaunti, ya'ni
   * BOSHQA bot/odam. Ilgari o'sha qiymat olinar edi va "Ro'yxatdan o'tish"
   * tugmasi foydalanuvchini butunlay boshqa botga olib ketardi.
   * Bot username faqat backend'dan yoki environment'dan olinadi.
   */
  getBotUsername(): string {
    return environment.telegramBotUsername.replace(/^@/, '');
  }

  /**
   * Mini appni yopib, o'z botimiz chatini ochadi.
   * `openTelegramLink` Telegram'ning o'zi mini appni yopib chatga o'tkazadi;
   * eski klientlarda ishlamasa `close()` zaxira sifatida chaqiriladi.
   */
  openBotChat(botUsername?: string): void {
    const username = (botUsername ?? this.getBotUsername()).replace(/^@/, '');
    const url = `https://t.me/${username}`;
    const tg = this.webApp;

    if (!tg) {
      window.open(url, '_blank');
      return;
    }

    if (typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(url);
    } else if (typeof tg.openLink === 'function') {
      tg.openLink(url);
    }

    // Ba'zi klientlarda openTelegramLink mini appni yopmaydi.
    setTimeout(() => tg.close(), 300);
  }

  getInitData(): string {
    return this.webApp?.initData ?? '';
  }

  getUsername(): string | undefined {
    return this.webApp?.initDataUnsafe.user?.username;
  }
}
