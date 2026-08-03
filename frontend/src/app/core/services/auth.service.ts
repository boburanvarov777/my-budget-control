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
  private readonly tokenKey = 'budget_jwt';
  private readonly userKey = 'budget_user';

  readonly user = signal<AuthUser | null>(this.loadUser());
  readonly isAuthenticated = computed(() => !!this.token());

  constructor(private http: HttpClient) {}

  token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  private loadUser(): AuthUser | null {
    const raw = sessionStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  async login(initData: string, phone: string, username?: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/telegram`, {
        initData,
        phone,
        username,
      }),
    );

    sessionStorage.setItem(this.tokenKey, res.accessToken);
    sessionStorage.setItem(this.userKey, JSON.stringify(res.user));
    this.user.set(res.user);
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.user.set(null);
  }
}
