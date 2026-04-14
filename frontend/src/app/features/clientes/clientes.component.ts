import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  emailAuth?: string;
  qtdPets: number;
  ultimoAgendamento?: string;
  autocadastro?: boolean;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Clientes</h1>
        <button class="btn btn-primary" (click)="novoCliente()">+ Novo Cliente</button>
      </header>

      <div class="filtros-bar">
        <input
          type="text"
          class="form-input search-input"
          placeholder="Buscar por nome ou telefone..."
          [(ngModel)]="busca"
          (input)="onBuscar()"
        >
        <label class="filtro-checkbox">
          <input type="checkbox" [(ngModel)]="filtroAutocadastro" (change)="onFiltroChange()">
          <span>Apenas cadastrados pelo app</span>
        </label>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else {
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Pets</th>
                <th>Ultimo agendamento</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              @for (cliente of clientes(); track cliente.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/admin/clientes', cliente.id]" class="cliente-nome">
                      {{ cliente.nome }}
                    </a>
                    @if (cliente.autocadastro) {
                      <span class="badge badge-app" title="Cadastrado pelo app">APP</span>
                    }
                  </td>
                  <td>
                    <a [href]="'https://wa.me/55' + cliente.telefone.replace(/\\D/g, '')" target="_blank" class="telefone-link">
                      {{ cliente.telefone }}
                    </a>
                  </td>
                  <td>{{ cliente.qtdPets }} pet(s)</td>
                  <td>
                    @if (cliente.ultimoAgendamento) {
                      {{ cliente.ultimoAgendamento | date:'dd/MM/yyyy' }}
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/admin/clientes', cliente.id]" class="btn btn-secondary btn-sm">Ver</a>
                      <button class="btn btn-secondary btn-sm" (click)="editarCliente(cliente)">Editar</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center text-muted">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              }
            </tbody>
          </table>
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

    <!-- Modal de Cliente (Novo/Editar) -->
    @if (modalAberto()) {
      <div class="modal-overlay" (click)="fecharModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ clienteEditando() ? 'Editar Cliente' : 'Novo Cliente' }}</h3>
            <button class="btn-fechar" (click)="fecharModal()">×</button>
          </div>

          <div class="modal-body">
            @if (modalErro()) {
              <div class="alert alert-error">{{ modalErro() }}</div>
            }

            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input type="text" class="form-input" [(ngModel)]="form.nome" placeholder="Nome completo">
            </div>

            <div class="form-group">
              <label class="form-label">Telefone *</label>
              <input
                type="tel"
                class="form-input"
                [(ngModel)]="form.telefone"
                placeholder="(00) 00000-0000"
                (input)="formatarTelefone($event)"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" [(ngModel)]="form.email" placeholder="email@exemplo.com">
            </div>

            <div class="form-group">
              <label class="form-label">Endereco</label>
              <input type="text" class="form-input" [(ngModel)]="form.endereco" placeholder="Endereco completo">
            </div>

            <div class="form-group">
              <label class="form-label">Observacoes</label>
              <textarea class="form-input" [(ngModel)]="form.observacoes" rows="2" placeholder="Observacoes sobre o cliente"></textarea>
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="fecharModal()">Cancelar</button>
              <button
                class="btn btn-primary"
                (click)="salvarCliente()"
                [disabled]="salvando() || !form.nome || !form.telefone"
              >
                @if (salvando()) {
                  <span class="spinner spinner-sm"></span>
                } @else {
                  {{ clienteEditando() ? 'Salvar' : 'Criar' }}
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

    .filtros-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;

      .search-input {
        flex: 1;
        min-width: 200px;
      }
    }

    .filtro-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--cor-texto-suave);
      cursor: pointer;
      white-space: nowrap;

      input {
        cursor: pointer;
      }
    }

    .badge {
      display: inline-block;
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-sm);
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    .badge-app {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--cor-borda);
    }

    .table th {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--cor-texto-suave);
      font-weight: 600;
    }

    .cliente-nome {
      font-weight: 600;
      color: var(--cor-texto);

      &:hover {
        color: var(--cor-primaria);
      }
    }

    .telefone-link {
      color: var(--cor-secundaria);

      &:hover {
        text-decoration: underline;
      }
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
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
      max-width: 450px;
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

    textarea.form-input {
      resize: vertical;
      min-height: 60px;
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
  `]
})
export class ClientesComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  clientes = signal<Cliente[]>([]);
  pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });
  busca = '';
  filtroAutocadastro = false;

  // Modal
  modalAberto = signal(false);
  clienteEditando = signal<Cliente | null>(null);
  modalErro = signal('');
  salvando = signal(false);
  form = {
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: ''
  };

  private buscaTimeout: any;

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.loading.set(true);
    this.api.getClientes({
      page: this.pagination().page,
      limit: this.pagination().limit,
      busca: this.busca || undefined,
      autocadastro: this.filtroAutocadastro || undefined
    }).subscribe({
      next: (res) => {
        this.clientes.set(res.data || res.clientes || []);
        if (res.pagination) {
          this.pagination.set(res.pagination);
        }
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
      this.carregarClientes();
    }, 300);
  }

  onFiltroChange(): void {
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.carregarClientes();
  }

  paginaAnterior(): void {
    if (this.pagination().page > 1) {
      this.pagination.update(p => ({ ...p, page: p.page - 1 }));
      this.carregarClientes();
    }
  }

  proximaPagina(): void {
    if (this.pagination().page < this.pagination().totalPages) {
      this.pagination.update(p => ({ ...p, page: p.page + 1 }));
      this.carregarClientes();
    }
  }

  novoCliente(): void {
    this.clienteEditando.set(null);
    this.form = { nome: '', telefone: '', email: '', endereco: '', observacoes: '' };
    this.modalErro.set('');
    this.modalAberto.set(true);
  }

  editarCliente(cliente: Cliente): void {
    this.clienteEditando.set(cliente);
    this.form = {
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      endereco: '',
      observacoes: ''
    };
    this.modalErro.set('');
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.clienteEditando.set(null);
  }

  formatarTelefone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 6) {
      valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }

    input.value = valor;
    this.form.telefone = valor;
  }

  salvarCliente(): void {
    if (!this.form.nome || !this.form.telefone) return;

    this.salvando.set(true);
    this.modalErro.set('');

    const dados = {
      nome: this.form.nome,
      telefone: this.form.telefone,
      email: this.form.email || undefined,
      endereco: this.form.endereco || undefined,
      observacoes: this.form.observacoes || undefined
    };

    const request = this.clienteEditando()
      ? this.api.atualizarCliente(this.clienteEditando()!.id, dados)
      : this.api.criarCliente(dados);

    request.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModal();
        this.carregarClientes();
      },
      error: (err) => {
        this.salvando.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao salvar cliente');
      }
    });
  }
}
