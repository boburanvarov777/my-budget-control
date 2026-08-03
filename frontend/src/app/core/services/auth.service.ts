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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenValue: string | null = null;
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokenValue);

  constructor(private http: HttpClient) {}

  token(): string | null {
    return this.tokenValue;
  }

  async beginRegistration(initData: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/begin-registration`, { initData }),
    );
  }

  async miniAppLogin(initData: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/mini-app-login`, {
        initData,
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
