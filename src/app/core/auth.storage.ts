/** Chaves em sessionStorage (o papel no cliente é só UX; a API valida o JWT). */
export const ACCESS_TOKEN_KEY = 'arteisis.accessToken';
export const ROLE_KEY = 'arteisis.role';

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
