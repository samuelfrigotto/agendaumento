import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ClienteAuthService } from '../services/cliente-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const clienteAuthService = inject(ClienteAuthService);

  // Rotas publicas - nao precisa de token
  if (req.url.includes('/api/public/') || req.url.includes('/api/auth/')) {
    return next(req);
  }

  // Rotas do cliente - usar token do cliente
  if (req.url.includes('/api/cliente/')) {
    const token = clienteAuthService.getToken();
    if (token) {
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(clonedReq);
    }
    return next(req);
  }

  // Rotas do banhista (admin) - usar token do banhista
  const token = authService.getToken();
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  return next(req);
};
