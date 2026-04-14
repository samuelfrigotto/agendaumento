import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-cliente-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <a routerLink="/clientes" class="back-link">← Voltar para clientes</a>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else if (cliente()) {
        <header class="page-header">
          <div>
            <h1 class="page-title">{{ cliente()!.nome }}</h1>
            <p class="text-muted">{{ cliente()!.telefone }}</p>
          </div>
          <button class="btn btn-primary">Novo Agendamento</button>
        </header>

        <div class="content-grid">
          <section class="card">
            <h3>Pets</h3>
            <div class="pets-list">
              @for (pet of cliente()!.pets; track pet.id) {
                <a [routerLink]="['/pets', pet.id]" class="pet-card">
                  <div class="pet-avatar">
                    @if (pet.fotoUrl) {
                      <img [src]="pet.fotoUrl" [alt]="pet.nome">
                    } @else {
                      <span>🐾</span>
                    }
                  </div>
                  <div class="pet-info">
                    <span class="pet-nome">{{ pet.nome }}</span>
                    <span class="pet-raca">{{ pet.raca || 'Sem raca' }} - {{ pet.tamanho || 'Tamanho?' }}</span>
                  </div>
                </a>
              } @empty {
                <p class="text-muted">Nenhum pet cadastrado</p>
              }
            </div>
          </section>

          <section class="card">
            <h3>Historico de Agendamentos</h3>
            <div class="agendamentos-list">
              @for (agendamento of cliente()!.agendamentos; track agendamento.id) {
                <div class="agendamento-item">
                  <div class="agendamento-info">
                    <span class="agendamento-pet">{{ agendamento.petNome }}</span>
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
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1000px;
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

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-title {
      margin: 0 0 0.25rem 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .card h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .pets-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pet-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--cor-texto);
      transition: background var(--transicao);

      &:hover {
        background: var(--cor-primaria-light);
      }
    }

    .pet-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--cor-borda);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      span {
        font-size: 1.5rem;
      }
    }

    .pet-info {
      display: flex;
      flex-direction: column;
    }

    .pet-nome {
      font-weight: 600;
    }

    .pet-raca {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
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

    .agendamento-pet {
      font-weight: 600;
    }

    .agendamento-servico,
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
export class ClienteDetalheComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  cliente = signal<any>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarCliente(id);
    }
  }

  carregarCliente(id: string): void {
    this.api.getCliente(id).subscribe({
      next: (cliente) => {
        this.cliente.set(cliente);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
