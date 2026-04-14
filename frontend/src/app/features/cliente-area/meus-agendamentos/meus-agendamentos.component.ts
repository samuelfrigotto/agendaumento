import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClienteApiService, Agendamento } from '@core/services/cliente-api.service';
import { ClienteAuthService } from '@core/services/cliente-auth.service';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="meus-agendamentos-container">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/agendar" class="logo">Agendaumento</a>
          <div class="header-actions">
            <span class="user-name">{{ clienteAuth.cliente()?.nome }}</span>
            <button class="btn btn-text" (click)="clienteAuth.logout()">Sair</button>
          </div>
        </div>
      </header>

      <main class="page-content">
        <div class="page-title-row">
          <h1 class="page-title">Meus Agendamentos</h1>
          <a routerLink="/agendar" class="btn btn-primary">Novo Agendamento</a>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <span class="spinner"></span>
          </div>
        } @else {
          @if (agendamentos().length === 0) {
            <div class="empty-state">
              <h3>Nenhum agendamento</h3>
              <p>Voce ainda nao tem agendamentos. Que tal marcar um?</p>
              <a routerLink="/agendar" class="btn btn-primary">Agendar agora</a>
            </div>
          } @else {
            <div class="agendamentos-list">
              @for (agendamento of agendamentos(); track agendamento.id) {
                <div class="agendamento-card" [class.cancelado]="agendamento.status === 'cancelado'" [class.concluido]="agendamento.status === 'concluido'">
                  <div class="agendamento-data">
                    <span class="data-dia">{{ formatarDia(agendamento.dataHora) }}</span>
                    <span class="data-mes">{{ formatarMes(agendamento.dataHora) }}</span>
                  </div>

                  <div class="agendamento-info">
                    <h3 class="servico-nome">{{ agendamento.servico.nome }}</h3>
                    <p class="pet-nome">{{ agendamento.pet.nome }}</p>
                    <p class="horario">{{ formatarHora(agendamento.dataHora) }} - {{ agendamento.duracaoMin }} min</p>
                  </div>

                  <div class="agendamento-status">
                    <span class="status-badge" [class]="'status-' + agendamento.status">
                      {{ formatarStatus(agendamento.status) }}
                    </span>

                    @if (podeCancelar(agendamento)) {
                      <button
                        class="btn btn-text btn-danger"
                        (click)="cancelar(agendamento)"
                        [disabled]="cancelando() === agendamento.id"
                      >
                        @if (cancelando() === agendamento.id) {
                          <span class="spinner spinner-sm"></span>
                        } @else {
                          Cancelar
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    .meus-agendamentos-container {
      min-height: 100vh;
      background: var(--cor-fundo);
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .header-content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-family: var(--fonte-titulo);
      font-size: 1.25rem;
      color: white;
      text-decoration: none;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .user-name {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
        display: none;
      }

      .btn-text {
        color: white;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        min-height: 44px; // Touch-friendly

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
        }
      }
    }

    .page-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
    }

    .page-title-row {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.25rem;
      color: var(--cor-texto);
    }

    .btn-primary {
      text-align: center;
      min-height: 48px; // Touch-friendly
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--sombra-card);

      h3 {
        color: var(--cor-texto);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--cor-texto-suave);
        margin-bottom: 1.5rem;
      }
    }

    .agendamentos-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .agendamento-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: var(--radius-md);
      box-shadow: var(--sombra-card);
      transition: opacity 0.2s;

      &.cancelado, &.concluido {
        opacity: 0.6;
      }
    }

    .agendamento-data {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--cor-primaria-suave);
      border-radius: var(--radius-md);

      .data-dia {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--cor-primaria);
      }

      .data-mes {
        font-size: 0.875rem;
        color: var(--cor-primaria);
        text-transform: uppercase;
      }
    }

    .agendamento-info {
      flex: 1;

      .servico-nome {
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }

      .pet-nome {
        color: var(--cor-texto-suave);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .horario {
        font-size: 0.875rem;
        color: var(--cor-texto-suave);
      }
    }

    .agendamento-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--cor-borda);
    }

    .status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-agendado {
      background: #fef3c7;
      color: #92400e;
    }

    .status-confirmado {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-em_andamento {
      background: #e0e7ff;
      color: #3730a3;
    }

    .status-concluido {
      background: #d1fae5;
      color: #065f46;
    }

    .status-cancelado {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-danger {
      color: var(--cor-erro);
      padding: 0.5rem 1rem;
      min-height: 44px; // Touch-friendly
      background: transparent;
      border: none;
      cursor: pointer;

      &:hover {
        background: #fef2f2;
        border-radius: var(--radius-md);
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
    }

    // Tablet e Desktop
    @media (min-width: 768px) {
      .page-header {
        padding: 1rem 2rem;
      }

      .logo {
        font-size: 1.5rem;
      }

      .header-actions {
        gap: 1rem;

        .user-name {
          display: block;
        }
      }

      .page-content {
        padding: 2rem;
      }

      .page-title-row {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }

      .page-title {
        font-size: 1.5rem;
      }

      .agendamentos-list {
        gap: 1rem;
      }

      .agendamento-card {
        flex-direction: row;
        padding: 1.5rem;
        gap: 1.5rem;
      }

      .agendamento-data {
        flex-direction: column;
        justify-content: center;
        min-width: 60px;
        padding: 1rem;
      }

      .agendamento-status {
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        border-top: none;
        padding-top: 0;
      }
    }
  `]
})
export class MeusAgendamentosComponent implements OnInit {
  private clienteApi = inject(ClienteApiService);
  clienteAuth = inject(ClienteAuthService);

  agendamentos = signal<Agendamento[]>([]);
  loading = signal(false);
  cancelando = signal<string | null>(null);

  ngOnInit() {
    this.carregarAgendamentos();
  }

  private carregarAgendamentos() {
    this.loading.set(true);
    this.clienteApi.getAgendamentos().subscribe({
      next: (res) => {
        this.agendamentos.set(res.agendamentos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  formatarDia(dataHora: string): string {
    return new Date(dataHora).getDate().toString();
  }

  formatarMes(dataHora: string): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[new Date(dataHora).getMonth()];
  }

  formatarHora(dataHora: string): string {
    const data = new Date(dataHora);
    return `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
  }

  formatarStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'em_andamento': 'Em andamento',
      'concluido': 'Concluido',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  podeCancelar(agendamento: Agendamento): boolean {
    if (['cancelado', 'concluido', 'em_andamento'].includes(agendamento.status)) {
      return false;
    }

    const dataAgendamento = new Date(agendamento.dataHora);
    const agora = new Date();
    const diffHoras = (dataAgendamento.getTime() - agora.getTime()) / (1000 * 60 * 60);

    return diffHoras >= 2;
  }

  cancelar(agendamento: Agendamento) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    this.cancelando.set(agendamento.id);

    this.clienteApi.cancelarAgendamento(agendamento.id).subscribe({
      next: () => {
        this.cancelando.set(null);
        this.carregarAgendamentos();
      },
      error: (err) => {
        this.cancelando.set(null);
        alert(err.error?.error || 'Erro ao cancelar agendamento');
      }
    });
  }
}
