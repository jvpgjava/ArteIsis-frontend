import { HttpInterceptorFn } from '@angular/common/http';
import { readAuthToken } from './auth.storage';

export function readStoredAccessToken(): string | null {
  return readAuthToken();
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return next(req);
  }
  const token = readAuthToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
