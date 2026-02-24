import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, map } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait until auth is initialized
  await firstValueFrom(
    toObservable(authService.initialized).pipe(filter(init => init))
  );

  if (authService.isAuthenticated) {
    return true;
  }

  // Redirect to login page if not authenticated
  return router.parseUrl('/login');
};
