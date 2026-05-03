import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { readStoredAccessToken } from './auth.interceptor';
import { readAuthRole, readRoleFromAccessToken } from './auth.storage';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasStoredToken()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  const role = readAuthRole() ?? readRoleFromAccessToken(readStoredAccessToken());
  if (role !== 'ADMIN') {
    router.navigate(['/']);
    return false;
  }
  return true;
};
