import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ClienteAuthService } from '@core/services/cliente-auth.service';

@Component({
  selector: 'app-cliente-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <a routerLink="/agendar" class="back-link">← Voltar</a>
          <h1 class="auth-title">Entrar</h1>
          <p class="auth-subtitle">Acesse sua conta para agendar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              formControlName="email"
              class="form-input"
              placeholder="seu@email.com"
            >
            @if (form.get('email')?.touched && form.get('email')?.errors?.['required']) {
              <span class="form-error">Email e obrigatorio</span>
            }
            @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
              <span class="form-error">Email invalido</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <input
              type="password"
              formControlName="senha"
              class="form-input"
              placeholder="Sua senha"
            >
            @if (form.get('senha')?.touched && form.get('senha')?.errors?.['required']) {
              <span class="form-error">Senha e obrigatoria</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loading() || form.invalid"
          >
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              Entrar
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Ainda nao tem conta?</p>
          <a [routerLink]="['/registro']" [queryParams]="{ returnUrl: returnUrl }" class="auth-link">Criar conta</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background:
        radial-gradient(circle at 20% 80%, rgba(251, 146, 60, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(234, 88, 12, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(249, 115, 22, 0.08) 0%, transparent 30%),
        linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        pointer-events: none;
      }
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--cor-fundo-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--sombra-modal);
      padding: 2rem;
    }

    .back-link {
      display: inline-block;
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
      margin-bottom: 1rem;
      text-decoration: none;

      &:hover {
        color: var(--cor-primaria);
      }
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth-title {
      font-family: var(--fonte-titulo);
      font-size: 1.5rem;
      color: var(--cor-texto);
      margin-bottom: 0.5rem;
    }

    .auth-subtitle {
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
    }

    .auth-form {
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-input {
      font-size: 16px; // Evita zoom no iOS
    }

    .btn-block {
      width: 100%;
      padding: 1rem;
      font-size: 1rem;
      min-height: 48px; // Touch-friendly
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .alert-error {
      background-color: #fef2f2;
      color: var(--cor-erro);
      border: 1px solid #fecaca;
    }

    .auth-footer {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--cor-borda);

      p {
        color: var(--cor-texto-suave);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
    }

    .auth-link {
      font-weight: 600;
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 1.5rem;
        margin: 0 0.5rem;
      }
    }
  `]
})
export class ClienteLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteAuth = inject(ClienteAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  loading = signal(false);
  error = signal('');
  returnUrl = '/agendar';

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/agendar';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.clienteAuth.login(this.form.value).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Erro ao fazer login');
      }
    });
  }
}
