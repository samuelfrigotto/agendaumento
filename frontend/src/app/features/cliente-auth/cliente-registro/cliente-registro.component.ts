import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ClienteAuthService } from '@core/services/cliente-auth.service';

@Component({
  selector: 'app-cliente-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <a routerLink="/agendar" class="back-link">← Voltar</a>
          <h1 class="auth-title">Criar conta</h1>
          <p class="auth-subtitle">Cadastre-se para agendar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }

          <div class="form-group">
            <label class="form-label">Nome completo</label>
            <input
              type="text"
              formControlName="nome"
              class="form-input"
              placeholder="Seu nome"
            >
            @if (form.get('nome')?.touched && form.get('nome')?.errors?.['required']) {
              <span class="form-error">Nome e obrigatorio</span>
            }
            @if (form.get('nome')?.touched && form.get('nome')?.errors?.['minlength']) {
              <span class="form-error">Nome deve ter pelo menos 2 caracteres</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">CPF</label>
            <input
              type="text"
              formControlName="cpf"
              class="form-input"
              placeholder="000.000.000-00"
              maxlength="14"
              (input)="formatarCpf($event)"
            >
            @if (form.get('cpf')?.touched && form.get('cpf')?.errors?.['required']) {
              <span class="form-error">CPF e obrigatorio</span>
            }
            @if (form.get('cpf')?.touched && form.get('cpf')?.errors?.['pattern']) {
              <span class="form-error">CPF invalido</span>
            }
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
            <label class="form-label">Telefone (opcional)</label>
            <input
              type="tel"
              formControlName="telefone"
              class="form-input"
              placeholder="(00) 00000-0000"
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
              <span class="form-error">Senha deve ter pelo menos 6 caracteres</span>
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
          <a [routerLink]="['/login']" [queryParams]="{ returnUrl: returnUrl }" class="auth-link">Fazer login</a>
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
      margin-bottom: 2rem;
    }

    .auth-title {
      font-family: var(--fonte-titulo);
      font-size: 1.75rem;
      color: var(--cor-texto);
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
export class ClienteRegistroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteAuth = inject(ClienteAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal('');
  returnUrl = '/agendar';

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/agendar';
  }

  formatarCpf(event: Event) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }

    input.value = valor;
    this.form.get('cpf')?.setValue(valor);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.clienteAuth.registro(this.form.value).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Erro ao criar conta');
      }
    });
  }
}
