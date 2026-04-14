import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Agendaumento</h1>
          <p class="auth-subtitle">Entre na sua conta</p>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--cor-fundo-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--sombra-modal);
      padding: 2.5rem;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-title {
      font-family: var(--fonte-titulo);
      font-size: 2rem;
      color: var(--cor-primaria);
      margin-bottom: 0.5rem;
    }

    .auth-subtitle {
      color: var(--cor-texto-suave);
    }

    .auth-form {
      margin-bottom: 1rem;
    }

    .btn-block {
      width: 100%;
      padding: 1rem;
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
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/admin/agenda']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Erro ao fazer login');
      }
    });
  }
}
