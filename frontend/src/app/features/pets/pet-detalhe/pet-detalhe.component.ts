import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-pet-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <a routerLink="/pets" class="back-link">← Voltar para pets</a>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else if (pet()) {
        <div class="pet-header">
          <div class="pet-foto">
            @if (pet()!.fotoUrl) {
              <img [src]="pet()!.fotoUrl" [alt]="pet()!.nome">
            } @else {
              <span>🐾</span>
            }
          </div>
          <div class="pet-info">
            <h1>{{ pet()!.nome }}</h1>
            <p class="pet-raca">{{ pet()!.raca || 'Sem raca' }} - {{ pet()!.tamanho || 'Tamanho?' }}</p>
            <p class="pet-dono">
              Dono: <a [routerLink]="['/clientes', pet()!.cliente.id]">{{ pet()!.cliente.nome }}</a>
              <span class="telefone">{{ pet()!.cliente.telefone }}</span>
            </p>
          </div>
          <div class="pet-actions">
            <button class="btn btn-primary">Novo Agendamento</button>
            <button class="btn btn-secondary">Editar</button>
          </div>
        </div>

        @if (pet()!.observacoes) {
          <div class="card observacoes">
            <h3>⚠️ Observacoes</h3>
            <p>{{ pet()!.observacoes }}</p>
          </div>
        }

        <div class="card">
          <h3>Historico de Agendamentos</h3>
          <div class="agendamentos-list">
            @for (agendamento of pet()!.agendamentos; track agendamento.id) {
              <div class="agendamento-item">
                <div class="agendamento-info">
                  <span class="agendamento-servico">{{ agendamento.servicoNome || 'Servico' }}</span>
                  <span class="agendamento-data">{{ agendamento.dataHora | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="agendamento-status">
                  <span class="badge" [class]="'badge-' + agendamento.status">{{ agendamento.status }}</span>
                  <span class="agendamento-preco">R$ {{ agendamento.preco | number:'1.0-0' }}</span>
                </div>
              </div>
            } @empty {
              <p class="text-muted">Nenhum agendamento</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 800px;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: var(--cor-texto-suave);
      font-size: 0.875rem;

      &:hover {
        color: var(--cor-primaria);
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .pet-header {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .pet-foto {
      width: 120px;
      height: 120px;
      border-radius: var(--radius-lg);
      background: var(--cor-fundo);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      span {
        font-size: 3rem;
      }
    }

    .pet-info {
      flex: 1;

      h1 {
        margin: 0 0 0.25rem 0;
      }

      .pet-raca {
        margin: 0 0 0.5rem 0;
        color: var(--cor-texto-suave);
      }

      .pet-dono {
        margin: 0;
        font-size: 0.875rem;

        a {
          font-weight: 600;
        }

        .telefone {
          color: var(--cor-texto-suave);
          margin-left: 0.5rem;
        }
      }
    }

    .pet-actions {
      display: flex;
      gap: 0.5rem;
    }

    .observacoes {
      margin-bottom: 1.5rem;
      background: #fffbeb;
      border: 1px solid var(--cor-alerta);

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
      }

      p {
        margin: 0;
      }
    }

    .card h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .agendamentos-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .agendamento-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
    }

    .agendamento-info {
      display: flex;
      flex-direction: column;
    }

    .agendamento-servico {
      font-weight: 600;
    }

    .agendamento-data {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .agendamento-status {
      text-align: right;
    }

    .agendamento-preco {
      display: block;
      font-weight: 600;
      margin-top: 0.25rem;
    }
  `]
})
export class PetDetalheComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  pet = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarPet(id);
    }
  }

  carregarPet(id: string): void {
    this.api.getPet(id).subscribe({
      next: (pet) => {
        this.pet.set(pet);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
