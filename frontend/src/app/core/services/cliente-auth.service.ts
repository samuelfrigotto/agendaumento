import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
}

export interface ClienteAuthResponse {
  cliente: Cliente;
  accessToken: string;
  refreshToken: string;
}

export interface ClienteLoginData {
  email: string;
  senha: string;
}

export interface ClienteRegistroData {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteAuthService {
  private readonly TOKEN_KEY = 'agendaumento_cliente_token';
  private readonly REFRESH_KEY = 'agendaumento_cliente_refresh';
  private readonly USER_KEY = 'agendaumento_cliente_user';

  private _cliente = signal<Cliente | null>(this.getStoredUser());

  cliente = this._cliente.asReadonly();
  isLoggedIn = computed(() => !!this._cliente());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(data: ClienteLoginData): Observable<ClienteAuthResponse> {
    return this.http.post<ClienteAuthResponse>(`${environment.apiUrl}/auth/cliente/login`, data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  registro(data: ClienteRegistroData): Observable<ClienteAuthResponse> {
    return this.http.post<ClienteAuthResponse>(`${environment.apiUrl}/auth/cliente/registro`, data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._cliente.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthResponse(response: ClienteAuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.cliente));
    this._cliente.set(response.cliente);
  }

  private getStoredUser(): Cliente | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }
}
