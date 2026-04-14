import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClienteAuthService } from '../services/cliente-auth.service';

export const clienteGuard: CanActivateFn = () => {
  const clienteAuthService = inject(ClienteAuthService);
  const router = inject(Router);

  if (clienteAuthService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
