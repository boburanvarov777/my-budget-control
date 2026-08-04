import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface BeginRegistrationResult {
  /** Bu Telegram akkaunt allaqachon bazada bor. */
  alreadyRegistered: boolean;
  /** Bot chatida "Raqamni yuborish" tugmasi ko'rindi. */
  contactRequestSent: boolean;
  /** Qaysi botni ochish kerakligini backend aytadi. */
  botUsername: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** JWT faqat xotirada — localStorage/sessionStorage ishlatilmaydi */
  private readonly tokenValue = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokenValue());

  constructor(private http: HttpClient) {}

  token(): string | null {
    return this.tokenValue();
  }

  /**
   * Backend endi aniq flag qaytaradi. Ilgari bu yerda javob matni bo'yicha
   * qidiruv ("allaqachon ro'yxatdan") qilinardi — matn bir harfga o'zgarsa
   * oqim buzilar edi.
   */
  async beginRegistration(initData: string): Promise<BeginRegistrationResult> {
    return firstValueFrom(
      this.http.post<BeginRegistrationResult>(
        `${environment.apiUrl}/auth/begin-registration`,
        { initData },
      ),
    );
  }

  async miniAppLogin(initData: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/mini-app-login`, {
        initData,
      }),
    );
    this.tokenValue.set(res.accessToken);
    this.user.set(res.user);
  }

  logout(): void {
    this.tokenValue.set(null);
    this.user.set(null);
  }
}
