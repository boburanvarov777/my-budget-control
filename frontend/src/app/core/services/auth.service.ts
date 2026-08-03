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
  private readonly tokenKey = 'bc_access_token';
  private readonly userKey = 'bc_user';
  private readonly tokenValue = signal<string | null>(this.readStoredToken());
  readonly user = signal<AuthUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => !!this.tokenValue());

  constructor(private http: HttpClient) {}

  private readStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  private readStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  private persistSession(token: string, user: AuthUser): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private clearStoredSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  token(): string | null {
    return this.tokenValue();
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
    this.tokenValue.set(res.accessToken);
    this.user.set(res.user);
    this.persistSession(res.accessToken, res.user);
  }

  logout(): void {
    this.tokenValue.set(null);
    this.user.set(null);
    this.clearStoredSession();
  }
}
