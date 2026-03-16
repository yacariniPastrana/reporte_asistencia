import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';

  if (isLoggedIn) {
    return true;
  }

  // Redirigir al login si no está autenticado
  router.navigate(['/login']);
  return false;
};
