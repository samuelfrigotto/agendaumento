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
  cliente: { id: string; nome: string; telefone: string };
  ultimoAgendamento?: string;
}

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Pets</h1>
        <button class="btn btn-primary" (click)="novoPet()">+ Novo Pet</button>
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
            <a [routerLink]="['/pets', pet.id]" class="pet-card card">
              <div class="pet-foto">
                @if (pet.fotoUrl) {
                  <img [src]="pet.fotoUrl" [alt]="pet.nome">
                } @else {
                  <span class="pet-icon">🐾</span>
                }
              </div>
              <div class="pet-info">
                <h3 class="pet-nome">{{ pet.nome }}</h3>
                <p class="pet-raca">{{ pet.raca || 'Sem raca' }}, {{ pet.tamanho || 'Tamanho?' }}</p>
                <p class="pet-dono">Dono: {{ pet.cliente.nome }}</p>
                @if (pet.observacoes) {
                  <p class="pet-obs">⚠️ {{ pet.observacoes | slice:0:50 }}...</p>
                }
                @if (pet.ultimoAgendamento) {
                  <p class="pet-ultimo">Ultimo: {{ pet.ultimoAgendamento | date:'dd/MM/yyyy' }}</p>
                }
              </div>
            </a>
          } @empty {
            <div class="empty-state">
              <p>Nenhum pet encontrado</p>
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
      display: block;
      text-decoration: none;
      color: var(--cor-texto);
      transition: transform var(--transicao), box-shadow var(--transicao);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--sombra-modal);
      }
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

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--cor-texto-suave);
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
  `]
})
export class PetsComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  pets = signal<Pet[]>([]);
  pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });
  busca = '';

  private buscaTimeout: any;

  ngOnInit(): void {
    this.carregarPets();
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

  novoPet(): void {
    // TODO: Abrir modal de novo pet
    console.log('Novo pet');
  }
}
