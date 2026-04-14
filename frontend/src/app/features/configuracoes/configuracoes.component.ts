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

interface SecaoColapsavel {
  id: string;
  aberta: boolean;
}

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Configuracoes</h1>

      <div class="config-sections">
        <!-- Secao: Dados do Negocio -->
        <section class="config-section">
          <button class="section-header" (click)="toggleSecao('negocio')">
            <div class="section-title">
              <span class="section-icon">🏪</span>
              <h3>Dados do Negocio</h3>
            </div>
            <span class="toggle-icon" [class.aberto]="secaoAberta('negocio')">▼</span>
          </button>
          @if (secaoAberta('negocio')) {
            <div class="section-content">
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

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="salvandoPerfil()">
                    @if (salvandoPerfil()) {
                      <span class="spinner spinner-sm"></span>
                    } @else {
                      Salvar
                    }
                  </button>
                  @if (perfilSalvo()) {
                    <span class="success-msg">Salvo com sucesso!</span>
                  }
                </div>
              </form>
            </div>
          }
        </section>

        <!-- Secao: Tipos de Animais -->
        <section class="config-section">
          <button class="section-header" (click)="toggleSecao('animais')">
            <div class="section-title">
              <span class="section-icon">🐾</span>
              <h3>Tipos de Animais</h3>
            </div>
            <span class="toggle-icon" [class.aberto]="secaoAberta('animais')">▼</span>
          </button>
          @if (secaoAberta('animais')) {
            <div class="section-content">
              <p class="text-muted mb-3">Configure as especies e racas disponiveis para seus clientes</p>

              <!-- Lista agrupada por especie -->
              @for (especie of especiesAgrupadas(); track especie.nome) {
                <div class="especie-group">
                  <div class="especie-header">
                    <div class="especie-info">
                      <span class="especie-icon">{{ getEspecieIcon(especie.nome) }}</span>
                      <span class="especie-nome">{{ especie.nome | titlecase }}</span>
                      <span class="especie-count">({{ especie.racas.length }} racas)</span>
                    </div>
                    <button class="btn-add-raca" (click)="abrirModalRaca(especie.nome)" title="Adicionar raca">
                      +
                    </button>
                  </div>
                  <div class="racas-list">
                    @for (raca of especie.racas; track raca.id) {
                      <div class="raca-item">
                        <span>{{ raca.raca || 'Sem raca especifica' }}</span>
                        <button class="btn-icon" (click)="removerTipo(raca)" title="Remover">×</button>
                      </div>
                    }
                  </div>
                </div>
              } @empty {
                <p class="text-muted text-center">Nenhum tipo de animal cadastrado</p>
              }

              <!-- Adicionar nova especie -->
              <div class="novo-tipo mt-3">
                <p class="form-label">Adicionar nova especie</p>
                <div class="form-row">
                  <select class="form-input" [(ngModel)]="novoTipo.especie">
                    <option value="">Selecione a especie</option>
                    <option value="cachorro">Cachorro</option>
                    <option value="gato">Gato</option>
                    <option value="ave">Ave</option>
                    <option value="roedor">Roedor</option>
                    <option value="reptil">Reptil</option>
                    <option value="outro">Outro</option>
                  </select>
                  <button
                    class="btn btn-primary"
                    (click)="adicionarEspecie()"
                    [disabled]="!novoTipo.especie || salvandoTipo()"
                  >
                    @if (salvandoTipo()) {
                      <span class="spinner spinner-sm"></span>
                    } @else {
                      Adicionar
                    }
                  </button>
                </div>
                @if (tipoErro()) {
                  <p class="error-msg">{{ tipoErro() }}</p>
                }
              </div>
            </div>
          }
        </section>

        <!-- Secao: WhatsApp -->
        <section class="config-section">
          <button class="section-header" (click)="toggleSecao('whatsapp')">
            <div class="section-title">
              <span class="section-icon">📱</span>
              <h3>WhatsApp</h3>
            </div>
            <span class="toggle-icon" [class.aberto]="secaoAberta('whatsapp')">▼</span>
          </button>
          @if (secaoAberta('whatsapp')) {
            <div class="section-content">
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
            </div>
          }
        </section>

        <!-- Secao: Sua Conta -->
        <section class="config-section">
          <button class="section-header" (click)="toggleSecao('conta')">
            <div class="section-title">
              <span class="section-icon">👤</span>
              <h3>Sua Conta</h3>
            </div>
            <span class="toggle-icon" [class.aberto]="secaoAberta('conta')">▼</span>
          </button>
          @if (secaoAberta('conta')) {
            <div class="section-content">
              <div class="conta-info">
                <p><strong>Email:</strong> {{ authService.banhista()?.email }}</p>
                <p><strong>Plano:</strong> <span class="plano">{{ authService.banhista()?.plano }}</span></p>
                @if (authService.banhista()?.trialFim) {
                  <p><strong>Trial expira em:</strong> {{ authService.banhista()?.trialFim | date:'dd/MM/yyyy' }}</p>
                }
              </div>
              <button class="btn btn-secondary mt-3">Alterar senha</button>
            </div>
          }
        </section>
      </div>
    </div>

    <!-- Modal para adicionar raca -->
    @if (modalRacaAberto()) {
      <div class="modal-overlay" (click)="fecharModalRaca()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Adicionar Raca - {{ especieModal() | titlecase }}</h3>
            <button class="btn-fechar" (click)="fecharModalRaca()">×</button>
          </div>
          <div class="modal-body">
            @if (modalErro()) {
              <div class="alert alert-error">{{ modalErro() }}</div>
            }
            <div class="form-group">
              <label class="form-label">Nome da raca</label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="novaRaca"
                placeholder="Ex: Golden Retriever"
                (keyup.enter)="adicionarRaca()"
              >
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="fecharModalRaca()">Cancelar</button>
              <button
                class="btn btn-primary"
                (click)="adicionarRaca()"
                [disabled]="!novaRaca || salvandoRaca()"
              >
                @if (salvandoRaca()) {
                  <span class="spinner spinner-sm"></span>
                } @else {
                  Adicionar
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container {
      max-width: 800px;
    }

    .page-title {
      margin-bottom: 1.5rem;
    }

    .config-sections {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .config-section {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--sombra-card);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;

      &:hover {
        background: var(--cor-fundo);
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      h3 {
        margin: 0;
        font-size: 1rem;
      }
    }

    .section-icon {
      font-size: 1.25rem;
    }

    .toggle-icon {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
      transition: transform 0.2s;

      &.aberto {
        transform: rotate(180deg);
      }
    }

    .section-content {
      padding: 0 1.5rem 1.5rem;
      border-top: 1px solid var(--cor-borda);
      padding-top: 1.5rem;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .success-msg {
      color: var(--cor-sucesso);
      font-size: 0.875rem;
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
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--cor-borda);
    }

    .especie-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .btn-add-raca {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--cor-primaria);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;

      &:hover {
        background: var(--cor-primaria-hover);
      }
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

    // Modal
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 400px;
      box-shadow: var(--sombra-modal);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--cor-borda);

      h3 {
        margin: 0;
        font-size: 1rem;
      }
    }

    .btn-fechar {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--cor-texto-suave);
      padding: 0;
      line-height: 1;

      &:hover {
        color: var(--cor-texto);
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .text-center {
      text-align: center;
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

  // Secoes colapsaveis - todas abertas por padrao
  secoesAbertas = signal<Set<string>>(new Set(['negocio', 'animais', 'whatsapp', 'conta']));

  // Tipos de animais
  tiposAnimais = signal<TipoAnimal[]>([]);
  novoTipo = { especie: '' };
  salvandoTipo = signal(false);
  tipoErro = signal('');

  // Modal de raca
  modalRacaAberto = signal(false);
  especieModal = signal('');
  novaRaca = '';
  salvandoRaca = signal(false);
  modalErro = signal('');

  ngOnInit(): void {
    this.carregarDados();
  }

  toggleSecao(secao: string): void {
    const abertas = new Set(this.secoesAbertas());
    if (abertas.has(secao)) {
      abertas.delete(secao);
    } else {
      abertas.add(secao);
    }
    this.secoesAbertas.set(abertas);
  }

  secaoAberta(secao: string): boolean {
    return this.secoesAbertas().has(secao);
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

  adicionarEspecie(): void {
    if (!this.novoTipo.especie) return;

    this.salvandoTipo.set(true);
    this.tipoErro.set('');

    this.api.criarTipoAnimal({
      especie: this.novoTipo.especie
    }).subscribe({
      next: () => {
        this.salvandoTipo.set(false);
        this.novoTipo = { especie: '' };
        this.carregarTiposAnimais();
      },
      error: (err) => {
        this.salvandoTipo.set(false);
        this.tipoErro.set(err.error?.error || 'Erro ao adicionar especie');
      }
    });
  }

  abrirModalRaca(especie: string): void {
    this.especieModal.set(especie);
    this.novaRaca = '';
    this.modalErro.set('');
    this.modalRacaAberto.set(true);
  }

  fecharModalRaca(): void {
    this.modalRacaAberto.set(false);
    this.especieModal.set('');
    this.novaRaca = '';
  }

  adicionarRaca(): void {
    if (!this.novaRaca) return;

    this.salvandoRaca.set(true);
    this.modalErro.set('');

    this.api.criarTipoAnimal({
      especie: this.especieModal(),
      raca: this.novaRaca
    }).subscribe({
      next: () => {
        this.salvandoRaca.set(false);
        this.fecharModalRaca();
        this.carregarTiposAnimais();
      },
      error: (err) => {
        this.salvandoRaca.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao adicionar raca');
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
