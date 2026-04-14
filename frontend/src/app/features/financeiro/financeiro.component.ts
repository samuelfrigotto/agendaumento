import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';

interface AgendamentoPendente {
  id: string;
  petNome: string;
  clienteNome: string;
  servicoNome: string;
  dataHora: string;
  preco: number;
  status: string;
}

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
                    <span class="pendente-cliente">{{ agendamento.clienteNome }}</span>
                    <span class="pendente-pet">{{ agendamento.petNome }} - {{ agendamento.servicoNome || 'Servico' }}</span>
                    <span class="pendente-data">{{ agendamento.dataHora | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="pendente-actions">
                    <span class="pendente-preco">R$ {{ agendamento.preco | number:'1.2-2' }}</span>
                    <div class="btn-group">
                      <button
                        class="btn btn-success btn-sm"
                        (click)="abrirModalPagar(agendamento)"
                        [disabled]="processando()"
                      >
                        Pagar
                      </button>
                      <button
                        class="btn btn-danger btn-sm"
                        (click)="abrirModalCancelar(agendamento)"
                        [disabled]="processando()"
                      >
                        Cancelar
                      </button>
                    </div>
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

    <!-- Modal Confirmar Pagamento -->
    @if (modalPagarAberto()) {
      <div class="modal-overlay" (click)="fecharModais()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Confirmar Pagamento</h3>
            <button class="btn-fechar" (click)="fecharModais()">×</button>
          </div>
          <div class="modal-body">
            @if (agendamentoSelecionado(); as ag) {
              <div class="confirm-info">
                <p><strong>Cliente:</strong> {{ ag.clienteNome }}</p>
                <p><strong>Pet:</strong> {{ ag.petNome }}</p>
                <p><strong>Servico:</strong> {{ ag.servicoNome }}</p>
                <p><strong>Valor:</strong> R$ {{ ag.preco | number:'1.2-2' }}</p>
              </div>

              <div class="form-group">
                <label class="form-label">Forma de Pagamento</label>
                <select class="form-input" [(ngModel)]="formaPagamento">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartao de Credito</option>
                  <option value="cartao_debito">Cartao de Debito</option>
                </select>
              </div>

              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="fecharModais()">Cancelar</button>
                <button
                  class="btn btn-success"
                  (click)="confirmarPagamento()"
                  [disabled]="processando()"
                >
                  @if (processando()) {
                    <span class="spinner spinner-sm"></span>
                  } @else {
                    Confirmar Pagamento
                  }
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Confirmar Cancelamento -->
    @if (modalCancelarAberto()) {
      <div class="modal-overlay" (click)="fecharModais()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Cancelar Agendamento</h3>
            <button class="btn-fechar" (click)="fecharModais()">×</button>
          </div>
          <div class="modal-body">
            @if (agendamentoSelecionado(); as ag) {
              <div class="alert alert-warning">
                Tem certeza que deseja cancelar este agendamento?
              </div>

              <div class="confirm-info">
                <p><strong>Cliente:</strong> {{ ag.clienteNome }}</p>
                <p><strong>Pet:</strong> {{ ag.petNome }}</p>
                <p><strong>Servico:</strong> {{ ag.servicoNome }}</p>
                <p><strong>Valor:</strong> R$ {{ ag.preco | number:'1.2-2' }}</p>
              </div>

              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="fecharModais()">Voltar</button>
                <button
                  class="btn btn-danger"
                  (click)="confirmarCancelamento()"
                  [disabled]="processando()"
                >
                  @if (processando()) {
                    <span class="spinner spinner-sm"></span>
                  } @else {
                    Confirmar Cancelamento
                  }
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
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
      max-height: 400px;
      overflow-y: auto;
    }

    .pendente-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      gap: 1rem;

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .pendente-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .pendente-cliente {
      font-weight: 600;
    }

    .pendente-pet {
      font-size: 0.875rem;
      color: var(--cor-texto);
    }

    .pendente-data {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .pendente-actions {
      display: flex;
      align-items: center;
      gap: 1rem;

      @media (max-width: 600px) {
        width: 100%;
        justify-content: space-between;
      }
    }

    .pendente-preco {
      font-weight: 600;
      font-size: 1.125rem;
      color: var(--cor-primaria);
    }

    .btn-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-danger {
      background: transparent;
      color: var(--cor-erro);
      border: 1px solid var(--cor-erro);

      &:hover {
        background: var(--cor-erro);
        color: white;
      }
    }

    .btn-success {
      background: var(--cor-sucesso);
      color: white;
      border: none;

      &:hover {
        background: #059669;
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

    .confirm-info {
      background: var(--cor-fundo);
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;

      p {
        margin: 0.25rem 0;
        font-size: 0.875rem;
      }
    }

    .form-group {
      margin-bottom: 1rem;
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

    .alert-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
    }
  `]
})
export class FinanceiroComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  resumo = signal<any>({ mes: '', faturado: 0, aReceber: 0, totalAgendamentos: 0 });
  historico = signal<any[]>([]);
  pendentes = signal<any>({ total: 0, agendamentos: [] });

  // Modais
  modalPagarAberto = signal(false);
  modalCancelarAberto = signal(false);
  agendamentoSelecionado = signal<AgendamentoPendente | null>(null);
  processando = signal(false);
  formaPagamento = 'dinheiro';

  private maxFaturamento = 0;

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading.set(true);
    Promise.all([
      this.api.getFinanceiroResumo().toPromise(),
      this.api.getFinanceiroHistorico(6).toPromise(),
      this.api.getFinanceiroPendentes().toPromise()
    ]).then(([resumo, historico, pendentes]) => {
      this.resumo.set(resumo || { mes: '', faturado: 0, aReceber: 0, totalAgendamentos: 0 });
      this.historico.set(historico || []);
      this.pendentes.set(pendentes || { total: 0, agendamentos: [] });

      this.maxFaturamento = Math.max(...(historico || []).map((h: any) => h.faturado), 1);
      this.loading.set(false);
    }).catch(() => {
      this.loading.set(false);
    });
  }

  calcularAlturaBarra(valor: number): number {
    return (valor / this.maxFaturamento) * 100;
  }

  abrirModalPagar(agendamento: AgendamentoPendente): void {
    this.agendamentoSelecionado.set(agendamento);
    this.formaPagamento = 'dinheiro';
    this.modalPagarAberto.set(true);
  }

  abrirModalCancelar(agendamento: AgendamentoPendente): void {
    this.agendamentoSelecionado.set(agendamento);
    this.modalCancelarAberto.set(true);
  }

  fecharModais(): void {
    this.modalPagarAberto.set(false);
    this.modalCancelarAberto.set(false);
    this.agendamentoSelecionado.set(null);
  }

  confirmarPagamento(): void {
    const ag = this.agendamentoSelecionado();
    if (!ag) return;

    this.processando.set(true);

    this.api.marcarPago(ag.id, this.formaPagamento).subscribe({
      next: () => {
        this.processando.set(false);
        this.fecharModais();
        this.carregarDados();
      },
      error: (err) => {
        this.processando.set(false);
        alert(err.error?.error || 'Erro ao marcar como pago');
      }
    });
  }

  confirmarCancelamento(): void {
    const ag = this.agendamentoSelecionado();
    if (!ag) return;

    this.processando.set(true);

    this.api.atualizarStatusAgendamento(ag.id, 'cancelado').subscribe({
      next: () => {
        this.processando.set(false);
        this.fecharModais();
        this.carregarDados();
      },
      error: (err) => {
        this.processando.set(false);
        alert(err.error?.error || 'Erro ao cancelar agendamento');
      }
    });
  }
}
