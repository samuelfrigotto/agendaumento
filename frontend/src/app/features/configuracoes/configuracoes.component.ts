import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Configuracoes</h1>

      <div class="config-grid">
        <section class="card">
          <h3>Dados do Negocio</h3>
          <form [formGroup]="perfilForm" (ngSubmit)="salvarPerfil()">
            <div class="form-group">
              <label class="form-label">Seu nome</label>
              <input type="text" formControlName="nome" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">Nome do negocio</label>
              <input type="text" formControlName="nomeNegocio" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input type="tel" formControlName="telefone" class="form-input">
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="salvandoPerfil()">
              @if (salvandoPerfil()) {
                <span class="spinner"></span>
              } @else {
                Salvar
              }
            </button>

            @if (perfilSalvo()) {
              <span class="success-msg">Salvo com sucesso!</span>
            }
          </form>
        </section>

        <section class="card">
          <h3>Servicos</h3>
          <div class="servicos-list">
            @for (servico of servicos(); track servico.id) {
              <div class="servico-item">
                <div class="servico-info">
                  <span class="servico-nome">{{ servico.nome }}</span>
                  <span class="servico-duracao">{{ servico.duracaoMin }} min</span>
                </div>
                <div class="servico-precos">
                  <span>P: R$ {{ servico.precoPequeno || 0 }}</span>
                  <span>M: R$ {{ servico.precoMedio || 0 }}</span>
                  <span>G: R$ {{ servico.precoGrande || 0 }}</span>
                </div>
              </div>
            } @empty {
              <p class="text-muted">Nenhum servico cadastrado</p>
            }
          </div>
          <button class="btn btn-secondary mt-3" (click)="novoServico()">+ Novo Servico</button>
        </section>

        <section class="card">
          <h3>WhatsApp</h3>
          <div class="whatsapp-status">
            @if (whatsappStatus().connected) {
              <span class="status-badge conectado">Conectado</span>
            } @else {
              <span class="status-badge desconectado">Desconectado</span>
            }
          </div>
          <p class="text-muted mt-2">
            O WhatsApp e usado para enviar mensagens automaticas de confirmacao e aviso de pet pronto.
          </p>
          <button class="btn btn-secondary mt-3" (click)="verificarWhatsApp()">
            Verificar conexao
          </button>
        </section>

        <section class="card">
          <h3>Sua Conta</h3>
          <div class="conta-info">
            <p><strong>Email:</strong> {{ authService.banhista()?.email }}</p>
            <p><strong>Plano:</strong> <span class="plano">{{ authService.banhista()?.plano }}</span></p>
            @if (authService.banhista()?.trialFim) {
              <p><strong>Trial expira em:</strong> {{ authService.banhista()?.trialFim | date:'dd/MM/yyyy' }}</p>
            }
          </div>
          <button class="btn btn-secondary mt-3">Alterar senha</button>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1000px;
    }

    .page-title {
      margin-bottom: 1.5rem;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .card h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1rem;
    }

    .success-msg {
      color: var(--cor-sucesso);
      font-size: 0.875rem;
      margin-left: 1rem;
    }

    .servicos-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .servico-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
    }

    .servico-info {
      display: flex;
      flex-direction: column;
    }

    .servico-nome {
      font-weight: 600;
    }

    .servico-duracao {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .servico-precos {
      display: flex;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .whatsapp-status {
      margin-bottom: 0.5rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;

      &.conectado {
        background: #d1fae5;
        color: #065f46;
      }

      &.desconectado {
        background: #fee2e2;
        color: #991b1b;
      }
    }

    .conta-info {
      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
      }

      .plano {
        text-transform: capitalize;
        color: var(--cor-primaria);
        font-weight: 600;
      }
    }

    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class ConfiguracoesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  authService = inject(AuthService);

  perfilForm: FormGroup = this.fb.group({
    nome: [''],
    nomeNegocio: [''],
    telefone: ['']
  });

  salvandoPerfil = signal(false);
  perfilSalvo = signal(false);
  servicos = signal<any[]>([]);
  whatsappStatus = signal<any>({ connected: false });

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carregar perfil
    this.api.getPerfil().subscribe({
      next: (perfil) => {
        this.perfilForm.patchValue({
          nome: perfil.nome,
          nomeNegocio: perfil.nomeNegocio,
          telefone: perfil.telefone
        });
      }
    });

    // Carregar servicos
    this.api.getServicos().subscribe({
      next: (servicos) => {
        this.servicos.set(servicos);
      }
    });

    // Verificar WhatsApp
    this.verificarWhatsApp();
  }

  salvarPerfil(): void {
    this.salvandoPerfil.set(true);
    this.perfilSalvo.set(false);

    this.api.atualizarPerfil(this.perfilForm.value).subscribe({
      next: () => {
        this.salvandoPerfil.set(false);
        this.perfilSalvo.set(true);
        setTimeout(() => this.perfilSalvo.set(false), 3000);
      },
      error: () => {
        this.salvandoPerfil.set(false);
      }
    });
  }

  novoServico(): void {
    // TODO: Abrir modal de novo servico
    console.log('Novo servico');
  }

  verificarWhatsApp(): void {
    this.api.getWhatsappStatus().subscribe({
      next: (status) => {
        this.whatsappStatus.set(status);
      },
      error: () => {
        this.whatsappStatus.set({ connected: false });
      }
    });
  }
}
