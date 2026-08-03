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

interface RequestCodeResponse {
  success: boolean;
  message: string;
  expiresInSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenValue: string | null = null;
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokenValue);

  constructor(private http: HttpClient) {}

  token(): string | null {
    return this.tokenValue;
  }

  async requestCode(
    initData: string,
    phone: string,
    username?: string,
  ): Promise<RequestCodeResponse> {
    return firstValueFrom(
      this.http.post<RequestCodeResponse>(`${environment.apiUrl}/auth/request-code`, {
        initData,
        phone,
        username,
      }),
    );
  }

  async verifyCode(
    initData: string,
    phone: string,
    code: string,
    username?: string,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/verify-code`, {
        initData,
        phone,
        code,
        username,
      }),
    );

    this.tokenValue = res.accessToken;
    this.user.set(res.user);
  }

  logout(): void {
    this.tokenValue = null;
    this.user.set(null);
  }
}
