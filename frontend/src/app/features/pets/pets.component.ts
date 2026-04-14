import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';

interface Pet {
  id: string;
  nome: string;
  especie: string;
  raca?: string;
  tamanho?: string;
  fotoUrl?: string;
  observacoes?: string;
  clienteId?: string;
  cliente: { id: string; nome: string; telefone: string };
  ultimoAgendamento?: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
}

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Pets</h1>
      </header>

      <div class="search-bar">
        <input
          type="text"
          class="form-input"
          placeholder="Buscar por nome ou raca..."
          [(ngModel)]="busca"
          (input)="onBuscar()"
        >
      </div>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else {
        <div class="pets-grid">
          @for (pet of pets(); track pet.id) {
            <div class="pet-card card">
              <a [routerLink]="['/admin/pets', pet.id]" class="pet-link">
                <div class="pet-foto">
                  @if (pet.fotoUrl) {
                    <img [src]="pet.fotoUrl" [alt]="pet.nome">
                  } @else {
                    <span class="pet-icon">{{ getEspecieIcon(pet.especie) }}</span>
                  }
                </div>
                <div class="pet-info">
                  <h3 class="pet-nome">{{ pet.nome }}</h3>
                  <p class="pet-raca">{{ pet.especie }} - {{ pet.raca || 'Sem raca' }}, {{ pet.tamanho || 'Tamanho?' }}</p>
                  <p class="pet-dono">Dono: {{ pet.cliente.nome }}</p>
                  @if (pet.observacoes) {
                    <p class="pet-obs">{{ pet.observacoes | slice:0:50 }}{{ pet.observacoes.length > 50 ? '...' : '' }}</p>
                  }
                  @if (pet.ultimoAgendamento) {
                    <p class="pet-ultimo">Ultimo: {{ pet.ultimoAgendamento | date:'dd/MM/yyyy' }}</p>
                  }
                </div>
              </a>
              <div class="pet-actions">
                <button class="btn btn-secondary btn-sm" (click)="editarPet(pet)">Editar</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>Nenhum pet cadastrado</p>
              <p class="empty-hint">Os pets sao cadastrados pelos clientes no app</p>
            </div>
          }
        </div>

        @if (pagination().totalPages > 1) {
          <div class="pagination">
            <button
              class="btn btn-secondary btn-sm"
              [disabled]="pagination().page <= 1"
              (click)="paginaAnterior()"
            >
              Anterior
            </button>
            <span>Pagina {{ pagination().page }} de {{ pagination().totalPages }}</span>
            <button
              class="btn btn-secondary btn-sm"
              [disabled]="pagination().page >= pagination().totalPages"
              (click)="proximaPagina()"
            >
              Proxima
            </button>
          </div>
        }
      }
    </div>

    <!-- Modal de Pet (Novo/Editar) -->
    @if (modalAberto()) {
      <div class="modal-overlay" (click)="fecharModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Editar Pet</h3>
            <button class="btn-fechar" (click)="fecharModal()">×</button>
          </div>

          <div class="modal-body">
            @if (modalErro()) {
              <div class="alert alert-error">{{ modalErro() }}</div>
            }

            <!-- Selecao de Cliente -->
            <div class="form-group">
              <label class="form-label">Dono *</label>
              @if (clienteSelecionado()) {
                <div class="cliente-selecionado">
                  <span>{{ clienteSelecionado()?.nome }} - {{ clienteSelecionado()?.telefone }}</span>
                  <button class="btn-remover" (click)="removerCliente()">×</button>
                </div>
              } @else {
                <input
                  type="text"
                  class="form-input"
                  placeholder="Buscar cliente por nome ou telefone..."
                  [(ngModel)]="buscaCliente"
                  (input)="onBuscarCliente()"
                >
                @if (clientesBusca().length > 0) {
                  <div class="dropdown-list">
                    @for (cliente of clientesBusca(); track cliente.id) {
                      <button class="dropdown-item" (click)="selecionarCliente(cliente)">
                        {{ cliente.nome }} - {{ cliente.telefone }}
                      </button>
                    }
                  </div>
                }
              }
            </div>

            <div class="form-group">
              <label class="form-label">Nome do Pet *</label>
              <input type="text" class="form-input" [(ngModel)]="form.nome" placeholder="Nome do pet">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Especie *</label>
                <select class="form-input" [(ngModel)]="form.especie" (ngModelChange)="onEspecieChange($event)">
                  <option value="">Selecione...</option>
                  @for (esp of especiesDisponiveis(); track esp) {
                    <option [value]="esp">{{ esp | titlecase }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Raca</label>
                @if (loadingRacas()) {
                  <div class="form-input loading-racas">
                    <span class="spinner spinner-sm"></span>
                    <span>Carregando...</span>
                  </div>
                } @else if (racasDisponiveis().length > 0) {
                  <select class="form-input" [(ngModel)]="form.raca">
                    <option value="">Selecione...</option>
                    @for (raca of racasDisponiveis(); track raca) {
                      <option [value]="raca">{{ raca }}</option>
                    }
                    <option value="__outro__">Outra (digitar)</option>
                  </select>
                  @if (form.raca === '__outro__') {
                    <input
                      type="text"
                      class="form-input mt-1"
                      [(ngModel)]="racaCustom"
                      placeholder="Digite a raca"
                    >
                  }
                } @else {
                  <input type="text" class="form-input" [(ngModel)]="form.raca" placeholder="Raca do pet">
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tamanho</label>
              <select class="form-input" [(ngModel)]="form.tamanho">
                <option value="">Selecione...</option>
                <option value="pequeno">Pequeno (ate 10kg)</option>
                <option value="medio">Medio (10-25kg)</option>
                <option value="grande">Grande (25-45kg)</option>
                <option value="gigante">Gigante (acima de 45kg)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Observacoes</label>
              <textarea class="form-input" [(ngModel)]="form.observacoes" rows="3" placeholder="Observacoes sobre o pet (alergias, temperamento, etc)"></textarea>
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="fecharModal()">Cancelar</button>
              <button
                class="btn btn-primary"
                (click)="salvarPet()"
                [disabled]="salvando() || !form.nome || !form.especie || !clienteSelecionado()"
              >
                @if (salvando()) {
                  <span class="spinner spinner-sm"></span>
                } @else {
                  {{ petEditando() ? 'Salvar' : 'Criar' }}
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
      max-width: 1200px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-title {
      margin: 0;
    }

    .search-bar {
      margin-bottom: 1.5rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .pet-card {
      display: flex;
      flex-direction: column;
      transition: transform var(--transicao), box-shadow var(--transicao);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--sombra-modal);
      }
    }

    .pet-link {
      display: block;
      text-decoration: none;
      color: var(--cor-texto);
    }

    .pet-foto {
      width: 100%;
      height: 180px;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .pet-icon {
        font-size: 4rem;
      }
    }

    .pet-nome {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
    }

    .pet-raca {
      margin: 0 0 0.25rem 0;
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
    }

    .pet-dono {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .pet-obs {
      margin: 0;
      font-size: 0.75rem;
      color: var(--cor-alerta);
    }

    .pet-ultimo {
      margin: 0.5rem 0 0 0;
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .pet-actions {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--cor-borda);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--cor-texto-suave);

      .empty-hint {
        font-size: 0.875rem;
        margin-top: 0.5rem;
        opacity: 0.8;
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
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
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--sombra-modal);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--cor-borda);

      h3 {
        margin: 0;
        font-size: 1.125rem;
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

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .cliente-selecionado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      border: 1px solid var(--cor-borda);
    }

    .btn-remover {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--cor-texto-suave);
      padding: 0 0.25rem;

      &:hover {
        color: var(--cor-erro);
      }
    }

    .dropdown-list {
      position: absolute;
      width: calc(100% - 3rem);
      background: white;
      border: 1px solid var(--cor-borda);
      border-radius: var(--radius-md);
      box-shadow: var(--sombra-card);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;

      &:hover {
        background: var(--cor-fundo);
      }
    }

    textarea.form-input {
      resize: vertical;
      min-height: 80px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--cor-borda);
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

    .spinner-sm {
      width: 16px;
      height: 16px;
    }

    .loading-racas {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--cor-texto-suave);
      background: var(--cor-fundo);
    }

    .mt-1 {
      margin-top: 0.5rem;
    }
  `]
})
export class PetsComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  pets = signal<Pet[]>([]);
  pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });
  busca = '';

  // Modal
  modalAberto = signal(false);
  petEditando = signal<Pet | null>(null);
  modalErro = signal('');
  salvando = signal(false);
  form = {
    nome: '',
    especie: '',
    raca: '',
    tamanho: '',
    observacoes: ''
  };

  // Busca de clientes
  buscaCliente = '';
  clientesBusca = signal<Cliente[]>([]);
  clienteSelecionado = signal<Cliente | null>(null);

  // Especies e racas
  especiesDisponiveis = signal<string[]>([]);
  racasDisponiveis = signal<string[]>([]);
  loadingRacas = signal(false);
  racaCustom = '';

  private buscaTimeout: any;
  private buscaClienteTimeout: any;

  ngOnInit(): void {
    this.carregarPets();
    this.carregarEspecies();
  }

  carregarEspecies(): void {
    this.api.getEspecies().subscribe({
      next: (res) => {
        this.especiesDisponiveis.set(res.especies || []);
      },
      error: () => {
        // Fallback para especies padrao
        this.especiesDisponiveis.set(['cachorro', 'gato', 'ave', 'roedor', 'reptil', 'outro']);
      }
    });
  }

  onEspecieChange(especie: string): void {
    this.form.raca = '';
    this.racaCustom = '';
    this.racasDisponiveis.set([]);

    if (!especie) return;

    this.loadingRacas.set(true);
    this.api.getRacas(especie).subscribe({
      next: (res) => {
        this.racasDisponiveis.set(res.racas || []);
        this.loadingRacas.set(false);
      },
      error: () => {
        this.racasDisponiveis.set([]);
        this.loadingRacas.set(false);
      }
    });
  }

  carregarPets(): void {
    this.loading.set(true);
    this.api.getPets({
      page: this.pagination().page,
      limit: this.pagination().limit,
      busca: this.busca || undefined
    }).subscribe({
      next: (res) => {
        this.pets.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onBuscar(): void {
    clearTimeout(this.buscaTimeout);
    this.buscaTimeout = setTimeout(() => {
      this.pagination.update(p => ({ ...p, page: 1 }));
      this.carregarPets();
    }, 300);
  }

  paginaAnterior(): void {
    if (this.pagination().page > 1) {
      this.pagination.update(p => ({ ...p, page: p.page - 1 }));
      this.carregarPets();
    }
  }

  proximaPagina(): void {
    if (this.pagination().page < this.pagination().totalPages) {
      this.pagination.update(p => ({ ...p, page: p.page + 1 }));
      this.carregarPets();
    }
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

  novoPet(): void {
    this.petEditando.set(null);
    this.form = { nome: '', especie: '', raca: '', tamanho: '', observacoes: '' };
    this.clienteSelecionado.set(null);
    this.buscaCliente = '';
    this.clientesBusca.set([]);
    this.racasDisponiveis.set([]);
    this.racaCustom = '';
    this.modalErro.set('');
    this.modalAberto.set(true);
  }

  editarPet(pet: Pet): void {
    this.petEditando.set(pet);
    this.form = {
      nome: pet.nome || '',
      especie: pet.especie || '',
      raca: pet.raca || '',
      tamanho: pet.tamanho || '',
      observacoes: pet.observacoes || ''
    };
    this.clienteSelecionado.set(pet.cliente);
    this.buscaCliente = '';
    this.clientesBusca.set([]);
    this.racaCustom = '';
    this.modalErro.set('');
    this.modalAberto.set(true);

    // Carregar racas da especie atual
    if (pet.especie) {
      this.loadingRacas.set(true);
      this.api.getRacas(pet.especie).subscribe({
        next: (res) => {
          const racas = res.racas || [];
          this.racasDisponiveis.set(racas);
          this.loadingRacas.set(false);

          // Se a raca atual nao esta na lista, usar campo customizado
          if (pet.raca && !racas.includes(pet.raca)) {
            this.racaCustom = pet.raca;
            this.form.raca = '__outro__';
          }
        },
        error: () => {
          this.racasDisponiveis.set([]);
          this.loadingRacas.set(false);
        }
      });
    }
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.petEditando.set(null);
    this.clientesBusca.set([]);
  }

  onBuscarCliente(): void {
    clearTimeout(this.buscaClienteTimeout);
    if (!this.buscaCliente || this.buscaCliente.length < 2) {
      this.clientesBusca.set([]);
      return;
    }

    this.buscaClienteTimeout = setTimeout(() => {
      this.api.getClientes({ busca: this.buscaCliente, limit: 10 }).subscribe({
        next: (res) => {
          this.clientesBusca.set(res.data || res.clientes || []);
        },
        error: () => {
          this.clientesBusca.set([]);
        }
      });
    }, 300);
  }

  selecionarCliente(cliente: Cliente): void {
    this.clienteSelecionado.set(cliente);
    this.buscaCliente = '';
    this.clientesBusca.set([]);
  }

  removerCliente(): void {
    this.clienteSelecionado.set(null);
  }

  salvarPet(): void {
    if (!this.form.nome || !this.form.especie || !this.clienteSelecionado()) return;

    this.salvando.set(true);
    this.modalErro.set('');

    // Se selecionou "Outra", usa o valor digitado
    const raca = this.form.raca === '__outro__' ? this.racaCustom : this.form.raca;

    const dados = {
      nome: this.form.nome,
      especie: this.form.especie,
      raca: raca || undefined,
      tamanho: this.form.tamanho || undefined,
      observacoes: this.form.observacoes || undefined,
      clienteId: this.clienteSelecionado()!.id
    };

    const request = this.petEditando()
      ? this.api.atualizarPet(this.petEditando()!.id, dados)
      : this.api.criarPet(dados);

    request.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModal();
        this.carregarPets();
      },
      error: (err) => {
        this.salvando.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao salvar pet');
      }
    });
  }
}
