import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/services/auth.service';

interface TipoAnimal {
  id: string;
  especie: string;
  raca: string | null;
  ativo: boolean;
}

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
          <h3>Tipos de Animais</h3>
          <p class="text-muted mb-3">Configure as especies e racas disponiveis para seus clientes</p>

          <!-- Lista agrupada por especie -->
          @for (especie of especiesAgrupadas(); track especie.nome) {
            <div class="especie-group">
              <div class="especie-header">
                <span class="especie-icon">{{ getEspecieIcon(especie.nome) }}</span>
                <span class="especie-nome">{{ especie.nome | titlecase }}</span>
                <span class="especie-count">({{ especie.racas.length }} racas)</span>
              </div>
              <div class="racas-list">
                @for (raca of especie.racas; track raca.id) {
                  <div class="raca-item" [class.inativo]="!raca.ativo">
                    <span>{{ raca.raca || 'Sem raca especifica' }}</span>
                    <button class="btn-icon" (click)="removerTipo(raca)">×</button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Adicionar novo tipo -->
          <div class="novo-tipo mt-3">
            <div class="form-row">
              <select class="form-input" [(ngModel)]="novoTipo.especie">
                <option value="">Especie</option>
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
                <option value="ave">Ave</option>
                <option value="roedor">Roedor</option>
                <option value="reptil">Reptil</option>
                <option value="outro">Outro</option>
              </select>
              <input
                type="text"
                class="form-input"
                placeholder="Raca (opcional)"
                [(ngModel)]="novoTipo.raca"
              >
              <button
                class="btn btn-primary"
                (click)="adicionarTipo()"
                [disabled]="!novoTipo.especie || salvandoTipo()"
              >
                @if (salvandoTipo()) {
                  <span class="spinner spinner-sm"></span>
                } @else {
                  +
                }
              </button>
            </div>
            @if (tipoErro()) {
              <p class="error-msg">{{ tipoErro() }}</p>
            }
          </div>
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

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .card h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .success-msg {
      color: var(--cor-sucesso);
      font-size: 0.875rem;
      margin-left: 1rem;
    }

    .error-msg {
      color: var(--cor-erro);
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }

    // Tipos de Animais
    .especie-group {
      margin-bottom: 1rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .especie-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--cor-borda);
      font-weight: 600;
    }

    .especie-icon {
      font-size: 1.25rem;
    }

    .especie-count {
      font-weight: 400;
      color: var(--cor-texto-suave);
      font-size: 0.75rem;
    }

    .racas-list {
      padding: 0.5rem;
    }

    .raca-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--cor-borda);

      &:last-child {
        border-bottom: none;
      }

      &.inativo {
        opacity: 0.5;
        text-decoration: line-through;
      }
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--cor-texto-suave);
      font-size: 1.25rem;
      padding: 0 0.25rem;

      &:hover {
        color: var(--cor-erro);
      }
    }

    .novo-tipo {
      .form-row {
        display: flex;
        gap: 0.5rem;

        .form-input {
          flex: 1;
        }

        .btn {
          flex-shrink: 0;
          padding: 0.5rem 1rem;
        }
      }
    }

    // WhatsApp
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

    .mb-3 { margin-bottom: 1rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }

    .spinner-sm {
      width: 16px;
      height: 16px;
    }
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
  whatsappStatus = signal<any>({ connected: false });

  // Tipos de animais
  tiposAnimais = signal<TipoAnimal[]>([]);
  novoTipo = { especie: '', raca: '' };
  salvandoTipo = signal(false);
  tipoErro = signal('');

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

    // Carregar tipos de animais
    this.carregarTiposAnimais();

    // Verificar WhatsApp
    this.verificarWhatsApp();
  }

  carregarTiposAnimais(): void {
    this.api.getTiposAnimais().subscribe({
      next: (res) => {
        this.tiposAnimais.set(res.tipos || []);
      }
    });
  }

  especiesAgrupadas() {
    const tipos = this.tiposAnimais();
    const grupos: { nome: string; racas: TipoAnimal[] }[] = [];

    tipos.forEach(tipo => {
      let grupo = grupos.find(g => g.nome === tipo.especie);
      if (!grupo) {
        grupo = { nome: tipo.especie, racas: [] };
        grupos.push(grupo);
      }
      grupo.racas.push(tipo);
    });

    return grupos.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  getEspecieIcon(especie: string): string {
    const icons: Record<string, string> = {
      'cachorro': '🐕',
      'gato': '🐱',
      'ave': '🦜',
      'roedor': '🐹',
      'reptil': '🦎',
      'outro': '🐾'
    };
    return icons[especie?.toLowerCase()] || '🐾';
  }

  adicionarTipo(): void {
    if (!this.novoTipo.especie) return;

    this.salvandoTipo.set(true);
    this.tipoErro.set('');

    this.api.criarTipoAnimal({
      especie: this.novoTipo.especie,
      raca: this.novoTipo.raca || undefined
    }).subscribe({
      next: () => {
        this.salvandoTipo.set(false);
        this.novoTipo = { especie: '', raca: '' };
        this.carregarTiposAnimais();
      },
      error: (err) => {
        this.salvandoTipo.set(false);
        this.tipoErro.set(err.error?.error || 'Erro ao adicionar tipo');
      }
    });
  }

  removerTipo(tipo: TipoAnimal): void {
    if (!confirm(`Remover ${tipo.raca || tipo.especie}?`)) return;

    this.api.deletarTipoAnimal(tipo.id).subscribe({
      next: () => {
        this.carregarTiposAnimais();
      }
    });
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
