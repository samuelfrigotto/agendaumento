import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Financeiro</h1>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else {
        <div class="resumo-grid">
          <div class="card resumo-card">
            <span class="resumo-label">{{ resumo().mes }}</span>
            <span class="resumo-valor sucesso">R$ {{ resumo().faturado | number:'1.2-2' }}</span>
            <span class="resumo-desc">Faturado</span>
          </div>

          <div class="card resumo-card">
            <span class="resumo-label">A Receber</span>
            <span class="resumo-valor alerta">R$ {{ resumo().aReceber | number:'1.2-2' }}</span>
            <span class="resumo-desc">{{ pendentes().agendamentos.length }} pendente(s)</span>
          </div>

          <div class="card resumo-card">
            <span class="resumo-label">Total de Atendimentos</span>
            <span class="resumo-valor">{{ resumo().totalAgendamentos }}</span>
            <span class="resumo-desc">Este mes</span>
          </div>
        </div>

        <div class="content-grid">
          <section class="card">
            <h3>Historico (Ultimos 6 meses)</h3>
            <div class="historico-chart">
              @for (mes of historico(); track mes.mes) {
                <div class="chart-bar">
                  <div
                    class="bar"
                    [style.height.%]="calcularAlturaBarra(mes.faturado)"
                  ></div>
                  <span class="bar-label">{{ mes.mesFormatado }}</span>
                  <span class="bar-valor">R$ {{ mes.faturado | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </section>

          <section class="card">
            <h3>Pendentes de Pagamento</h3>
            <div class="pendentes-list">
              @for (agendamento of pendentes().agendamentos; track agendamento.id) {
                <div class="pendente-item">
                  <div class="pendente-info">
                    <span class="pendente-pet">{{ agendamento.petNome }}</span>
                    <span class="pendente-servico">{{ agendamento.servicoNome || 'Servico' }}</span>
                    <span class="pendente-data">{{ agendamento.dataHora | date:'dd/MM' }}</span>
                  </div>
                  <div class="pendente-actions">
                    <span class="pendente-preco">R$ {{ agendamento.preco | number:'1.0-0' }}</span>
                    <button class="btn btn-success btn-sm" (click)="marcarPago(agendamento.id)">
                      Marcar pago
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-muted text-center">Nenhum pagamento pendente</p>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
    }

    .page-title {
      margin-bottom: 1.5rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .resumo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .resumo-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.5rem;
    }

    .resumo-label {
      font-size: 0.875rem;
      color: var(--cor-texto-suave);
      text-transform: capitalize;
    }

    .resumo-valor {
      font-size: 2rem;
      font-weight: 700;
      font-family: var(--fonte-titulo);
      margin: 0.5rem 0;

      &.sucesso { color: var(--cor-sucesso); }
      &.alerta { color: var(--cor-alerta); }
    }

    .resumo-desc {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .card h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1rem;
    }

    .historico-chart {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 200px;
      padding-top: 1rem;
    }

    .chart-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .bar {
      width: 40px;
      background: var(--cor-primaria);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      min-height: 4px;
    }

    .bar-label {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
      text-transform: capitalize;
    }

    .bar-valor {
      font-size: 0.625rem;
      color: var(--cor-texto-suave);
    }

    .pendentes-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .pendente-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
    }

    .pendente-info {
      display: flex;
      flex-direction: column;
    }

    .pendente-pet {
      font-weight: 600;
    }

    .pendente-servico,
    .pendente-data {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .pendente-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .pendente-preco {
      font-weight: 600;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
  `]
})
export class FinanceiroComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  resumo = signal<any>({ mes: '', faturado: 0, aReceber: 0, totalAgendamentos: 0 });
  historico = signal<any[]>([]);
  pendentes = signal<any>({ total: 0, agendamentos: [] });

  private maxFaturamento = 0;

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    Promise.all([
      this.api.getFinanceiroResumo().toPromise(),
      this.api.getFinanceiroHistorico(6).toPromise(),
      this.api.getFinanceiroPendentes().toPromise()
    ]).then(([resumo, historico, pendentes]) => {
      this.resumo.set(resumo);
      this.historico.set(historico || []);
      this.pendentes.set(pendentes);

      this.maxFaturamento = Math.max(...(historico || []).map((h: any) => h.faturado), 1);
      this.loading.set(false);
    }).catch(() => {
      this.loading.set(false);
    });
  }

  calcularAlturaBarra(valor: number): number {
    return (valor / this.maxFaturamento) * 100;
  }

  marcarPago(id: string): void {
    this.api.marcarPago(id).subscribe({
      next: () => {
        this.carregarDados();
      }
    });
  }
}
