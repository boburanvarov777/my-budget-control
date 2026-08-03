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
  requestContact?: (callback: (shared: boolean, contact?: { phone_number: string }) => void) => void;
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
    tg.expand();
    tg.setHeaderColor('#09090b');
    tg.setBackgroundColor('#09090b');
  }

  getInitData(): string {
    return this.webApp?.initData ?? '';
  }

  getUsername(): string | undefined {
    return this.webApp?.initDataUnsafe.user?.username;
  }

  async requestPhone(): Promise<string | null> {
    const tg = this.webApp;
    if (!tg) return null;

    if (typeof tg.requestContact === 'function') {
      return new Promise((resolve) => {
        tg.requestContact!((shared, contact) => {
          resolve(shared && contact?.phone_number ? contact.phone_number : null);
        });
      });
    }

    return null;
  }
}
