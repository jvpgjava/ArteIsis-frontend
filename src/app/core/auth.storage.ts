/** Chaves em localStorage (persistem em F5; a API valida o JWT). */
export const ACCESS_TOKEN_KEY = 'arteisis.accessToken';
export const ROLE_KEY = 'arteisis.role';

function browserStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

export function readAuthToken(): string | null {
  return browserStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function readAuthRole(): string | null {
  return browserStorage()?.getItem(ROLE_KEY) ?? null;
}

export function writeAuthToken(token: string): void {
  browserStorage()?.setItem(ACCESS_TOKEN_KEY, token);
}

export function writeAuthRole(role: string): void {
  browserStorage()?.setItem(ROLE_KEY, role);
}

export function clearAuthStorage(): void {
  const s = browserStorage();
  s?.removeItem(ACCESS_TOKEN_KEY);
  s?.removeItem(ROLE_KEY);
}

export function readRoleFromAccessToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as { role?: string };
    return typeof json.role === 'string' ? json.role : null;
  } catch {
    return null;
  }
}
