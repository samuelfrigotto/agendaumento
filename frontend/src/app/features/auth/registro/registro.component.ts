import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Agendaumento</h1>
          <p class="auth-subtitle">Crie sua conta gratis por 14 dias</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <div class="form-group">
            <label class="form-label">Seu nome</label>
            <input
              type="text"
              formControlName="nome"
              class="form-input"
              placeholder="Maria Silva"
            >
            @if (form.get('nome')?.touched && form.get('nome')?.errors?.['required']) {
              <span class="form-error">Nome e obrigatorio</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Nome do negocio</label>
            <input
              type="text"
              formControlName="nomeNegocio"
              class="form-input"
              placeholder="Pet Lindo da Maria"
            >
          </div>

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
            <label class="form-label">Telefone/WhatsApp</label>
            <input
              type="tel"
              formControlName="telefone"
              class="form-input"
              placeholder="(11) 99999-9999"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <input
              type="password"
              formControlName="senha"
              class="form-input"
              placeholder="Minimo 6 caracteres"
            >
            @if (form.get('senha')?.touched && form.get('senha')?.errors?.['required']) {
              <span class="form-error">Senha e obrigatoria</span>
            }
            @if (form.get('senha')?.touched && form.get('senha')?.errors?.['minlength']) {
              <span class="form-error">Senha deve ter no minimo 6 caracteres</span>
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
              Criar conta
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Ja tem uma conta?</p>
          <a routerLink="/login" class="auth-link">Fazer login</a>
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
      margin-bottom: 1.5rem;
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
  `]
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    nomeNegocio: [''],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal('');

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.registro(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/agenda']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Erro ao criar conta');
      }
    });
  }
}
