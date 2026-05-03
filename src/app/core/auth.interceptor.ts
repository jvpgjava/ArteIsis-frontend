import { HttpInterceptorFn } from '@angular/common/http';
import { ACCESS_TOKEN_KEY } from './auth.storage';

export function readStoredAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return next(req);
  }
  const token = readStoredAccessToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
