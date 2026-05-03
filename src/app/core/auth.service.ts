import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';
import { ArteIsisApiService, AuthMeResponse } from './arteisis-api.service';
import { ACCESS_TOKEN_KEY, ROLE_KEY } from './auth.storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ArteIsisApiService);
  private readonly router = inject(Router);

  readonly user = signal<AuthMeResponse | null>(null);

  constructor() {
    this.restoreSession();
  }

  storedRole(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage.getItem(ROLE_KEY);
  }

  hasStoredToken(): boolean {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    return !!sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  login(email: string, password: string): Observable<void> {
    return this.api.login({ email, password }).pipe(
      tap((res) => {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      }),
      switchMap(() => this.api.getMe()),
      tap((me) => this.applySession(me)),
      map(() => undefined),
    );
  }

  register(email: string, password: string, fullName: string): Observable<void> {
    const name = fullName.trim() || null;
    return this.api.register({ email, password, fullName: name }).pipe(
      tap((res) => {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      }),
      switchMap(() => this.api.getMe()),
      tap((me) => this.applySession(me)),
      map(() => undefined),
    );
  }

  logout(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    this.user.set(null);
  }

  private restoreSession(): void {
    if (!this.hasStoredToken()) {
      this.user.set(null);
      return;
    }
    this.api.getMe().subscribe({
      next: (me) => this.applySession(me),
      error: () => this.logout(),
    });
  }

  private applySession(me: AuthMeResponse): void {
    sessionStorage.setItem(ROLE_KEY, me.role);
    this.user.set(me);
  }
}
