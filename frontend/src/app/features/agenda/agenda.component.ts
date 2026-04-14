import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: string;
  dataHora: string;
  duracaoMin: number;
  preco: number;
  status: string;
  observacoes?: string;
  pet: { id: string; nome: string; fotoUrl?: string };
  cliente: { id: string; nome: string; telefone: string };
  servico?: { id: string; nome: string };
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
}

interface Pet {
  id: string;
  nome: string;
  tamanho: string;
}

interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agenda-container">
      <header class="agenda-header">
        <div class="header-nav">
          <button class="btn btn-secondary" (click)="semanaAnterior()">◄</button>
          <h2 class="header-title">{{ tituloSemana() }}</h2>
          <button class="btn btn-secondary" (click)="proximaSemana()">►</button>
          <button class="btn btn-secondary ml-2" (click)="irParaHoje()">Hoje</button>
        </div>
        <button class="btn btn-primary" (click)="novoAgendamento()">+ Novo Agendamento</button>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else {
        <div class="agenda-grid">
          <div class="agenda-times">
            <div class="time-header"></div>
            @for (hora of horas; track hora) {
              <div class="time-slot">{{ hora }}</div>
            }
          </div>

          @for (dia of diasSemana(); track dia.date) {
            <div class="agenda-column">
              <div class="day-header" [class.today]="dia.isToday">
                <span class="day-name">{{ dia.dayName }}</span>
                <span class="day-number">{{ dia.dayNumber }}</span>
              </div>
              <div class="day-slots">
                @for (agendamento of getAgendamentosDoDia(dia.date); track agendamento.id) {
                  <div
                    class="agendamento-card"
                    [class]="'status-' + agendamento.status"
                    [style.top.px]="calcularTop(agendamento)"
                    [style.height.px]="calcularAltura(agendamento)"
                    (click)="abrirAgendamento(agendamento)"
                  >
                    <span class="pet-nome">{{ agendamento.pet.nome }}</span>
                    <span class="servico">{{ agendamento.servico?.nome || 'Servico' }}</span>
                    <span class="preco">R$ {{ agendamento.preco | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal de Novo Agendamento -->
    @if (modalNovoAberto()) {
      <div class="modal-overlay" (click)="fecharModalNovo()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Novo Agendamento</h3>
            <button class="btn-fechar" (click)="fecharModalNovo()">×</button>
          </div>

          <div class="modal-body">
            @if (novoErro()) {
              <div class="alert alert-error">{{ novoErro() }}</div>
            }

            <!-- Busca de Cliente -->
            <div class="form-group">
              <label class="form-label">Cliente</label>
              <input
                type="text"
                class="form-input"
                placeholder="Buscar cliente por nome..."
                [(ngModel)]="buscaCliente"
                (input)="buscarClientes()"
              >
              @if (clientesBusca().length > 0) {
                <div class="search-results">
                  @for (cliente of clientesBusca(); track cliente.id) {
                    <div class="search-item" (click)="selecionarCliente(cliente)">
                      <span class="item-nome">{{ cliente.nome }}</span>
                      <span class="item-tel">{{ cliente.telefone || '' }}</span>
                    </div>
                  }
                </div>
              }
              @if (clienteSelecionadoNovo()) {
                <div class="selected-item">
                  <span>{{ clienteSelecionadoNovo()!.nome }}</span>
                  <button class="btn-remove" (click)="limparCliente()">×</button>
                </div>
              }
            </div>

            <!-- Pet -->
            @if (clienteSelecionadoNovo()) {
              <div class="form-group">
                <label class="form-label">Pet</label>
                @if (carregandoPets()) {
                  <span class="spinner spinner-sm"></span>
                } @else if (petsCliente().length === 0) {
                  <p class="text-muted">Nenhum pet cadastrado para este cliente</p>
                } @else {
                  <select class="form-input" [(ngModel)]="petIdNovo">
                    <option value="">Selecione um pet</option>
                    @for (pet of petsCliente(); track pet.id) {
                      <option [value]="pet.id">{{ pet.nome }} ({{ pet.tamanho }})</option>
                    }
                  </select>
                }
              </div>
            }

            <!-- Servico -->
            <div class="form-group">
              <label class="form-label">Servico</label>
              <select class="form-input" [(ngModel)]="servicoIdNovo">
                <option value="">Selecione um servico</option>
                @for (servico of servicosLista(); track servico.id) {
                  <option [value]="servico.id">{{ servico.nome }} ({{ servico.duracaoMin }}min)</option>
                }
              </select>
            </div>

            <!-- Data e Hora -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Data</label>
                <input type="date" class="form-input" [(ngModel)]="dataNovo">
              </div>
              <div class="form-group">
                <label class="form-label">Horario</label>
                <input type="time" class="form-input" [(ngModel)]="horaNovo">
              </div>
            </div>

            <!-- Observacoes -->
            <div class="form-group">
              <label class="form-label">Observacoes (opcional)</label>
              <textarea class="form-input" [(ngModel)]="observacoesNovo" rows="2"></textarea>
            </div>

            <button
              class="btn btn-primary btn-block"
              (click)="criarNovoAgendamento()"
              [disabled]="salvandoNovo() || !podecriar()"
            >
              @if (salvandoNovo()) {
                <span class="spinner spinner-sm"></span>
              } @else {
                Criar Agendamento
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Detalhes/Edicao -->
    @if (modalAberto()) {
      <div class="modal-overlay" (click)="fecharModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Detalhes do Agendamento</h3>
            <button class="btn-fechar" (click)="fecharModal()">×</button>
          </div>

          @if (agendamentoSelecionado(); as ag) {
            <div class="modal-body">
              @if (modalErro()) {
                <div class="alert alert-error">{{ modalErro() }}</div>
              }

              @if (modalSucesso()) {
                <div class="alert alert-success">{{ modalSucesso() }}</div>
              }

              <div class="info-section">
                <div class="info-row">
                  <span class="label">Cliente:</span>
                  <span class="value">{{ ag.cliente.nome }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Telefone:</span>
                  <span class="value">{{ ag.cliente.telefone || '-' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Pet:</span>
                  <span class="value">{{ ag.pet.nome }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Servico:</span>
                  <span class="value">{{ ag.servico?.nome || '-' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Valor:</span>
                  <span class="value">R$ {{ ag.preco | number:'1.2-2' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Duracao:</span>
                  <span class="value">{{ ag.duracaoMin }} minutos</span>
                </div>
              </div>

              <!-- Realocacao -->
              <div class="form-section">
                <h4>Data e Horario</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Data</label>
                    <input
                      type="date"
                      class="form-input"
                      [(ngModel)]="novaData"
                      [disabled]="ag.status === 'cancelado' || ag.status === 'concluido'"
                    >
                  </div>
                  <div class="form-group">
                    <label class="form-label">Horario</label>
                    <input
                      type="time"
                      class="form-input"
                      [(ngModel)]="novaHora"
                      [disabled]="ag.status === 'cancelado' || ag.status === 'concluido'"
                    >
                  </div>
                </div>
                @if (ag.status !== 'cancelado' && ag.status !== 'concluido') {
                  <button
                    class="btn btn-secondary"
                    (click)="realocarAgendamento()"
                    [disabled]="salvandoRealocacao()"
                  >
                    @if (salvandoRealocacao()) {
                      <span class="spinner spinner-sm"></span>
                    } @else {
                      Realocar
                    }
                  </button>
                }
              </div>

              <!-- Status -->
              <div class="form-section">
                <h4>Status</h4>
                <div class="status-buttons">
                  @for (st of statusOptions; track st.value) {
                    <button
                      class="btn-status"
                      [class.active]="ag.status === st.value"
                      [class]="'btn-' + st.value"
                      (click)="alterarStatus(st.value)"
                      [disabled]="salvandoStatus() || ag.status === 'cancelado'"
                    >
                      {{ st.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Acoes -->
              <div class="form-section">
                <h4>Acoes</h4>
                <div class="action-buttons">
                  @if (ag.status !== 'cancelado' && ag.status !== 'concluido') {
                    <button
                      class="btn btn-danger"
                      (click)="cancelarAgendamento()"
                      [disabled]="salvandoStatus()"
                    >
                      Cancelar Agendamento
                    </button>
                  }
                  @if (ag.status === 'concluido') {
                    <button
                      class="btn btn-success"
                      (click)="marcarPago()"
                      [disabled]="salvandoStatus()"
                    >
                      Marcar como Pago
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .agenda-container {
      height: calc(100vh - 4rem);
      display: flex;
      flex-direction: column;
    }

    .agenda-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-title {
      font-size: 1.25rem;
      min-width: 200px;
      text-align: center;
    }

    .ml-2 {
      margin-left: 0.5rem;
    }

    .loading-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .agenda-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 60px repeat(7, 1fr);
      gap: 1px;
      background: var(--cor-borda);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .agenda-times {
      background: var(--cor-fundo-card);
    }

    .time-header {
      height: 60px;
      border-bottom: 1px solid var(--cor-borda);
    }

    .time-slot {
      height: 60px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
      border-bottom: 1px solid var(--cor-borda);
    }

    .agenda-column {
      background: var(--cor-fundo-card);
    }

    .day-header {
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid var(--cor-borda);
      background: var(--cor-fundo);

      &.today {
        background: var(--cor-primaria-light);

        .day-number {
          background: var(--cor-primaria);
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .day-name {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--cor-texto-suave);
    }

    .day-number {
      font-size: 1rem;
      font-weight: 600;
    }

    .day-slots {
      position: relative;
      height: calc(13 * 60px); // 08:00 - 20:00
    }

    .agendamento-card {
      position: absolute;
      left: 4px;
      right: 4px;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-size: 0.75rem;
      transition: transform var(--transicao);

      &:hover {
        transform: scale(1.02);
        z-index: 10;
      }

      &.status-agendado { background: var(--status-agendado); }
      &.status-confirmado { background: var(--status-confirmado); }
      &.status-em_andamento { background: var(--status-em-andamento); }
      &.status-concluido { background: var(--status-concluido); }
      &.status-cancelado { background: var(--status-cancelado); opacity: 0.6; }
    }

    .pet-nome {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .servico {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preco {
      font-weight: 600;
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

    .info-section {
      margin-bottom: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--cor-borda);

      &:last-child {
        border-bottom: none;
      }
    }

    .label {
      color: var(--cor-texto-suave);
    }

    .value {
      font-weight: 500;
    }

    .form-section {
      margin-bottom: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--cor-borda);

      h4 {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
        color: var(--cor-texto-suave);
        text-transform: uppercase;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .status-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .btn-status {
      padding: 0.5rem 1rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        border-color: var(--cor-primaria);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria-suave);
      }

      &.btn-agendado.active { background: #fef3c7; border-color: #f59e0b; }
      &.btn-confirmado.active { background: #dbeafe; border-color: #3b82f6; }
      &.btn-em_andamento.active { background: #e0e7ff; border-color: #6366f1; }
      &.btn-concluido.active { background: #d1fae5; border-color: #10b981; }
      &.btn-cancelado.active { background: #fee2e2; border-color: #ef4444; }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background: #dc2626;
      }
    }

    .btn-success {
      background: #10b981;
      color: white;
      border: none;

      &:hover:not(:disabled) {
        background: #059669;
      }
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

    .alert-success {
      background: #f0fdf4;
      color: #059669;
      border: 1px solid #86efac;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
    }

    // Modal novo agendamento
    .modal-lg {
      max-width: 550px;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--cor-borda);
      border-radius: var(--radius-md);
      box-shadow: var(--sombra-card);
      z-index: 10;
      max-height: 200px;
      overflow-y: auto;
    }

    .search-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--cor-borda);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--cor-fundo);
      }

      .item-nome {
        font-weight: 500;
      }

      .item-tel {
        color: var(--cor-texto-suave);
        font-size: 0.875rem;
      }
    }

    .selected-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: var(--cor-primaria-suave);
      border-radius: var(--radius-md);
      margin-top: 0.5rem;

      .btn-remove {
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
    }

    .form-group {
      margin-bottom: 1rem;
      position: relative;
    }

    .text-muted {
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
    }

    textarea.form-input {
      resize: vertical;
      min-height: 60px;
    }

    .btn-block {
      width: 100%;
    }
  `]
})
export class AgendaComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  agendamentos = signal<Agendamento[]>([]);
  dataBase = signal(new Date());

  // Modal de detalhes
  modalAberto = signal(false);
  agendamentoSelecionado = signal<Agendamento | null>(null);
  novaData = '';
  novaHora = '';
  salvandoRealocacao = signal(false);
  salvandoStatus = signal(false);
  modalErro = signal('');
  modalSucesso = signal('');

  // Modal de novo agendamento
  modalNovoAberto = signal(false);
  novoErro = signal('');
  salvandoNovo = signal(false);
  buscaCliente = '';
  clientesBusca = signal<Cliente[]>([]);
  clienteSelecionadoNovo = signal<Cliente | null>(null);
  petsCliente = signal<Pet[]>([]);
  carregandoPets = signal(false);
  petIdNovo = '';
  servicosLista = signal<Servico[]>([]);
  servicoIdNovo = '';
  dataNovo = '';
  horaNovo = '';
  observacoesNovo = '';

  statusOptions = [
    { value: 'agendado', label: 'Agendado' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluido', label: 'Concluido' }
  ];

  horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  ngOnInit(): void {
    this.carregarAgendamentos();
  }

  diasSemana() {
    const inicio = startOfWeek(this.dataBase(), { weekStartsOn: 0 });
    const dias = [];

    for (let i = 0; i < 7; i++) {
      const data = addDays(inicio, i);
      dias.push({
        date: data,
        dayName: format(data, 'EEE', { locale: ptBR }),
        dayNumber: format(data, 'd'),
        isToday: isSameDay(data, new Date())
      });
    }

    return dias;
  }

  tituloSemana() {
    const inicio = startOfWeek(this.dataBase(), { weekStartsOn: 0 });
    const fim = addDays(inicio, 6);
    return `${format(inicio, 'd MMM', { locale: ptBR })} - ${format(fim, 'd MMM yyyy', { locale: ptBR })}`;
  }

  carregarAgendamentos(): void {
    this.loading.set(true);
    this.api.getAgendamentosSemana(this.dataBase().toISOString()).subscribe({
      next: (res) => {
        this.agendamentos.set(res.agendamentos || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getAgendamentosDoDia(data: Date): Agendamento[] {
    return this.agendamentos().filter(a => isSameDay(new Date(a.dataHora), data));
  }

  calcularTop(agendamento: Agendamento): number {
    const data = new Date(agendamento.dataHora);
    const horas = data.getHours();
    const minutos = data.getMinutes();
    return ((horas - 8) * 60 + minutos);
  }

  calcularAltura(agendamento: Agendamento): number {
    return Math.max(agendamento.duracaoMin || 60, 30);
  }

  semanaAnterior(): void {
    this.dataBase.set(addDays(this.dataBase(), -7));
    this.carregarAgendamentos();
  }

  proximaSemana(): void {
    this.dataBase.set(addDays(this.dataBase(), 7));
    this.carregarAgendamentos();
  }

  irParaHoje(): void {
    this.dataBase.set(new Date());
    this.carregarAgendamentos();
  }

  novoAgendamento(): void {
    this.modalNovoAberto.set(true);
    this.novoErro.set('');
    this.buscaCliente = '';
    this.clientesBusca.set([]);
    this.clienteSelecionadoNovo.set(null);
    this.petsCliente.set([]);
    this.petIdNovo = '';
    this.servicoIdNovo = '';
    this.dataNovo = format(new Date(), 'yyyy-MM-dd');
    this.horaNovo = '09:00';
    this.observacoesNovo = '';

    // Carregar servicos
    this.api.getServicos().subscribe({
      next: (res) => {
        this.servicosLista.set(res.servicos || []);
      }
    });
  }

  fecharModalNovo(): void {
    this.modalNovoAberto.set(false);
  }

  buscarClientes(): void {
    if (this.buscaCliente.length < 2) {
      this.clientesBusca.set([]);
      return;
    }

    this.api.getClientes({ busca: this.buscaCliente, limit: 5 }).subscribe({
      next: (res) => {
        this.clientesBusca.set(res.clientes || []);
      }
    });
  }

  selecionarCliente(cliente: Cliente): void {
    this.clienteSelecionadoNovo.set(cliente);
    this.clientesBusca.set([]);
    this.buscaCliente = '';
    this.petIdNovo = '';

    // Carregar pets do cliente
    this.carregandoPets.set(true);
    this.api.getPets({ clienteId: cliente.id }).subscribe({
      next: (res) => {
        this.petsCliente.set(res.pets || []);
        this.carregandoPets.set(false);
        // Selecionar automaticamente se tiver apenas um pet
        if (res.pets?.length === 1) {
          this.petIdNovo = res.pets[0].id;
        }
      },
      error: () => {
        this.carregandoPets.set(false);
      }
    });
  }

  limparCliente(): void {
    this.clienteSelecionadoNovo.set(null);
    this.petsCliente.set([]);
    this.petIdNovo = '';
  }

  podecriar(): boolean {
    return !!(
      this.clienteSelecionadoNovo() &&
      this.petIdNovo &&
      this.servicoIdNovo &&
      this.dataNovo &&
      this.horaNovo
    );
  }

  criarNovoAgendamento(): void {
    if (!this.podecriar()) return;

    const dataHora = `${this.dataNovo}T${this.horaNovo}:00`;

    this.salvandoNovo.set(true);
    this.novoErro.set('');

    this.api.criarAgendamento({
      petId: this.petIdNovo,
      servicoId: this.servicoIdNovo,
      dataHora,
      observacoes: this.observacoesNovo || undefined
    }).subscribe({
      next: () => {
        this.salvandoNovo.set(false);
        this.fecharModalNovo();
        this.carregarAgendamentos();
      },
      error: (err) => {
        this.salvandoNovo.set(false);
        if (err.status === 409) {
          this.novoErro.set('Este horario ja esta ocupado. Escolha outro horario.');
        } else {
          this.novoErro.set(err.error?.error || 'Erro ao criar agendamento');
        }
      }
    });
  }

  abrirAgendamento(agendamento: Agendamento): void {
    this.agendamentoSelecionado.set(agendamento);
    this.modalErro.set('');
    this.modalSucesso.set('');

    // Preencher campos de realocacao
    const dataHora = new Date(agendamento.dataHora);
    this.novaData = format(dataHora, 'yyyy-MM-dd');
    this.novaHora = format(dataHora, 'HH:mm');

    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.agendamentoSelecionado.set(null);
  }

  realocarAgendamento(): void {
    const ag = this.agendamentoSelecionado();
    if (!ag || !this.novaData || !this.novaHora) return;

    const novaDataHora = `${this.novaData}T${this.novaHora}:00`;

    this.salvandoRealocacao.set(true);
    this.modalErro.set('');
    this.modalSucesso.set('');

    this.api.atualizarAgendamento(ag.id, { dataHora: novaDataHora }).subscribe({
      next: () => {
        this.salvandoRealocacao.set(false);
        this.modalSucesso.set('Agendamento realocado com sucesso!');
        this.carregarAgendamentos();

        // Atualizar agendamento local
        this.agendamentoSelecionado.set({ ...ag, dataHora: novaDataHora });
      },
      error: (err) => {
        this.salvandoRealocacao.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao realocar agendamento');
      }
    });
  }

  alterarStatus(novoStatus: string): void {
    const ag = this.agendamentoSelecionado();
    if (!ag || ag.status === novoStatus) return;

    this.salvandoStatus.set(true);
    this.modalErro.set('');
    this.modalSucesso.set('');

    this.api.atualizarStatusAgendamento(ag.id, novoStatus).subscribe({
      next: () => {
        this.salvandoStatus.set(false);
        this.modalSucesso.set('Status atualizado!');
        this.carregarAgendamentos();

        // Atualizar agendamento local
        this.agendamentoSelecionado.set({ ...ag, status: novoStatus });
      },
      error: (err) => {
        this.salvandoStatus.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao alterar status');
      }
    });
  }

  cancelarAgendamento(): void {
    const ag = this.agendamentoSelecionado();
    if (!ag) return;

    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    this.alterarStatus('cancelado');
  }

  marcarPago(): void {
    const ag = this.agendamentoSelecionado();
    if (!ag) return;

    this.salvandoStatus.set(true);
    this.modalErro.set('');
    this.modalSucesso.set('');

    this.api.marcarPago(ag.id).subscribe({
      next: () => {
        this.salvandoStatus.set(false);
        this.modalSucesso.set('Marcado como pago!');
        this.carregarAgendamentos();
      },
      error: (err) => {
        this.salvandoStatus.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao marcar como pago');
      }
    });
  }
}
