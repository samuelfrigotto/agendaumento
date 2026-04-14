import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface Banhista {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  nomeNegocio?: string;
  plano: string;
  trialFim?: string;
}

export interface AuthResponse {
  banhista: Banhista;
  accessToken: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  senha: string;
}

export interface RegistroData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  nomeNegocio?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'agendaumento_token';
  private readonly REFRESH_KEY = 'agendaumento_refresh';
  private readonly USER_KEY = 'agendaumento_user';

  private _banhista = signal<Banhista | null>(this.getStoredUser());

  banhista = this._banhista.asReadonly();
  isLoggedIn = computed(() => !!this._banhista());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(data: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  registro(data: RegistroData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/registro`, data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._banhista.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.banhista));
    this._banhista.set(response.banhista);
  }

  private getStoredUser(): Banhista | null {
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
