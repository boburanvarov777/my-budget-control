import { Injectable } from '@angular/core';

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
  requestContact?: (
    callback: (shared: boolean, contact?: { phone_number: string }) => void,
  ) => void;
  requestPhoneNumber?: (
    callback: (shared: boolean, phone?: string) => void,
  ) => void;
  requestFullscreen?: () => void;
  openTelegramLink?: (url: string) => void;
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  get webApp(): TelegramWebApp | null {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp ?? null : null;
  }

  init(): void {
    const tg = this.webApp;
    if (!tg) return;
    tg.ready();
    tg.setHeaderColor('#09090b');
    tg.setBackgroundColor('#09090b');
  }

  expandApp(): void {
    const tg = this.webApp;
    if (!tg) return;
    tg.expand();
    if (typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen();
    }
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
