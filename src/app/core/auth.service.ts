import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';
import { ArteIsisApiService, AuthMeResponse } from './arteisis-api.service';
import {
  ACCESS_TOKEN_KEY,
  ROLE_KEY,
  clearAuthStorage,
  readAuthRole,
  readAuthToken,
  writeAuthRole,
  writeAuthToken,
} from './auth.storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ArteIsisApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly user = signal<AuthMeResponse | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.migrateSessionStorageToLocal();
      this.restoreSession();
    }
  }

  /** Sessões antigas gravavam em sessionStorage; copia uma vez para localStorage. */
  private migrateSessionStorageToLocal(): void {
    try {
      if (typeof sessionStorage === 'undefined') {
        return;
      }
      if (readAuthToken()) {
        return;
      }
      const legacyToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      const legacyRole = sessionStorage.getItem(ROLE_KEY);
      if (legacyToken) {
        writeAuthToken(legacyToken);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      if (legacyRole) {
        writeAuthRole(legacyRole);
        sessionStorage.removeItem(ROLE_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  storedRole(): string | null {
    return readAuthRole();
  }

  hasStoredToken(): boolean {
    return !!readAuthToken();
  }

  login(email: string, password: string): Observable<void> {
    return this.api.login({ email, password }).pipe(
      tap((res) => {
        writeAuthToken(res.accessToken);
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
        writeAuthToken(res.accessToken);
      }),
      switchMap(() => this.api.getMe()),
      tap((me) => this.applySession(me)),
      map(() => undefined),
    );
  }

  logout(): void {
    clearAuthStorage();
    this.user.set(null);
  }

  private restoreSession(): void {
    if (!readAuthToken()) {
      this.user.set(null);
      return;
    }
    this.api.getMe().subscribe({
      next: (me) => this.applySession(me),
      error: () => this.logout(),
    });
  }

  private applySession(me: AuthMeResponse): void {
    writeAuthRole(me.role);
    this.user.set(me);
  }
}
