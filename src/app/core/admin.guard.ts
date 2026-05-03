import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { readStoredAccessToken } from './auth.interceptor';
import { readRoleFromAccessToken } from './auth.storage';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasStoredToken()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  const role = auth.storedRole() ?? readRoleFromAccessToken(readStoredAccessToken());
  if (role !== 'ADMIN') {
    router.navigate(['/']);
    return false;
  }
  return true;
};
