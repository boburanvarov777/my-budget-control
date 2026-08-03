import { Injectable, signal } from '@angular/core';

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
  requestContact?: (
    callback: (shared: boolean, contact?: { phone_number: string }) => void,
  ) => void;
  requestPhoneNumber?: (
    callback: (shared: boolean, phone?: string) => void,
  ) => void;
  openTelegramLink?: (url: string) => void;
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
  }

  isFullscreen(): boolean {
    return this.fullscreen() || !!this.webApp?.isFullscreen;
  }

  enterFullscreen(): void {
    const tg = this.webApp;
    if (!tg) return;
    tg.expand();
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

  getInitData(): string {
    return this.webApp?.initData ?? '';
  }

  getUsername(): string | undefined {
    return this.webApp?.initDataUnsafe.user?.username;
  }

  /** Faqat Telegram orqali o'z raqamini ulash — qo'lda kiritish yo'q */
  async requestPhone(): Promise<string> {
    const tg = this.webApp;
    if (!tg) {
      throw new Error('Ilovani Telegram ichida oching');
    }

    if (typeof tg.requestPhoneNumber === 'function') {
      const phone = await new Promise<string | null>((resolve) => {
        tg.requestPhoneNumber!((shared, phoneNumber) => {
          resolve(shared && phoneNumber ? phoneNumber : null);
        });
      });
      if (phone) return phone;
    }

    if (typeof tg.requestContact === 'function') {
      const phone = await new Promise<string | null>((resolve) => {
        tg.requestContact!((shared, contact) => {
          resolve(shared && contact?.phone_number ? contact.phone_number : null);
        });
      });
      if (phone) return phone;
    }

    throw new Error(
      "Telegram orqali o'z raqamingizni yuborish majburiy. Pastdagi tugmani bosing va 'Raqamni yuborish'ni tanlang.",
    );
  }
}
