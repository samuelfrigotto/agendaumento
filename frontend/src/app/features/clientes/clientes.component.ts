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
  qtdPets: number;
  ultimoAgendamento?: string;
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

      <div class="search-bar">
        <input
          type="text"
          class="form-input"
          placeholder="Buscar por nome ou telefone..."
          [(ngModel)]="busca"
          (input)="onBuscar()"
        >
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
                    <a [routerLink]="['/clientes', cliente.id]" class="cliente-nome">
                      {{ cliente.nome }}
                    </a>
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
                      <a [routerLink]="['/clientes', cliente.id]" class="btn btn-secondary btn-sm">Ver</a>
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
  `]
})
export class ClientesComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  clientes = signal<Cliente[]>([]);
  pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });
  busca = '';

  private buscaTimeout: any;

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.loading.set(true);
    this.api.getClientes({
      page: this.pagination().page,
      limit: this.pagination().limit,
      busca: this.busca || undefined
    }).subscribe({
      next: (res) => {
        this.clientes.set(res.data);
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
      this.carregarClientes();
    }, 300);
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
    // TODO: Abrir modal de novo cliente
    console.log('Novo cliente');
  }

  editarCliente(cliente: Cliente): void {
    // TODO: Abrir modal de edicao
    console.log('Editar cliente', cliente);
  }
}
