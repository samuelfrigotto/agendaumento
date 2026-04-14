import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicApiService, Servico, TimeSlot } from '@core/services/public-api.service';
import { ClienteAuthService } from '@core/services/cliente-auth.service';
import { ClienteApiService } from '@core/services/cliente-api.service';

interface BookingIntent {
  servicoId: string;
  dataHora: string;
  servicoNome: string;
  data: string;
  hora: string;
}

@Component({
  selector: 'app-agendar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="agendar-container">
      <header class="agendar-header">
        <h1 class="logo">Agendaumento</h1>
        <div class="header-actions">
          @if (clienteAuth.isLoggedIn()) {
            <a routerLink="/meus-agendamentos" class="btn btn-outline">Meus Agendamentos</a>
            <button class="btn btn-text" (click)="clienteAuth.logout()">Sair</button>
          } @else {
            <a routerLink="/login" class="btn btn-outline">Entrar</a>
          }
        </div>
      </header>

      <main class="agendar-content">
        <!-- Step 1: Servicos -->
        @if (step() === 1) {
          <section class="step-section">
            <h2 class="step-title">Escolha o servico</h2>
            <p class="step-subtitle">Selecione o servico desejado para seu pet</p>

            @if (loadingServicos()) {
              <div class="loading-container">
                <span class="spinner"></span>
              </div>
            } @else {
              <div class="servicos-grid">
                @for (servico of servicos(); track servico.id) {
                  <div
                    class="servico-card"
                    [class.selected]="servicoSelecionado()?.id === servico.id"
                    (click)="selecionarServico(servico)"
                  >
                    <h3 class="servico-nome">{{ servico.nome }}</h3>
                    <p class="servico-duracao">{{ servico.duracaoMin }} minutos</p>
                    <p class="servico-preco">A partir de R$ {{ servico.precoPequeno | number:'1.2-2' }}</p>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- Step 2: Data -->
        @if (step() === 2) {
          <section class="step-section">
            <button class="btn-voltar" (click)="voltarStep()">← Voltar</button>
            <h2 class="step-title">Escolha a data</h2>
            <p class="step-subtitle">{{ servicoSelecionado()?.nome }} - {{ servicoSelecionado()?.duracaoMin }} min</p>

            <div class="calendario-grid">
              @for (dia of proximosDias(); track dia.data) {
                <button
                  class="dia-btn"
                  [class.selected]="dataSelecionada() === dia.data"
                  [class.hoje]="dia.isHoje"
                  (click)="selecionarData(dia.data)"
                >
                  <span class="dia-semana">{{ dia.diaSemana }}</span>
                  <span class="dia-numero">{{ dia.diaNumero }}</span>
                  <span class="dia-mes">{{ dia.mes }}</span>
                </button>
              }
            </div>
          </section>
        }

        <!-- Step 3: Horario -->
        @if (step() === 3) {
          <section class="step-section">
            <button class="btn-voltar" (click)="voltarStep()">← Voltar</button>
            <h2 class="step-title">Escolha o horario</h2>
            <p class="step-subtitle">{{ servicoSelecionado()?.nome }} - {{ dataFormatada() }}</p>

            @if (loadingSlots()) {
              <div class="loading-container">
                <span class="spinner"></span>
              </div>
            } @else {
              @if (slots().length === 0) {
                <div class="empty-slots">
                  <p>Nenhum horario disponivel nesta data</p>
                  <button class="btn btn-outline" (click)="voltarStep()">Escolher outra data</button>
                </div>
              } @else {
                <div class="slots-grid">
                  @for (slot of slots(); track slot.hora) {
                    <button
                      class="slot-btn"
                      [class.selected]="slotSelecionado()?.hora === slot.hora"
                      (click)="selecionarSlot(slot)"
                    >
                      {{ slot.hora }}
                    </button>
                  }
                </div>
              }
            }
          </section>
        }

        <!-- Step 4: Confirmar -->
        @if (step() === 4) {
          <section class="step-section">
            <button class="btn-voltar" (click)="voltarStep()">← Voltar</button>
            <h2 class="step-title">Confirmar agendamento</h2>

            <div class="resumo-card">
              <div class="resumo-item">
                <span class="resumo-label">Servico</span>
                <span class="resumo-value">{{ servicoSelecionado()?.nome }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Data</span>
                <span class="resumo-value">{{ dataFormatada() }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Horario</span>
                <span class="resumo-value">{{ slotSelecionado()?.hora }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Duracao</span>
                <span class="resumo-value">{{ servicoSelecionado()?.duracaoMin }} minutos</span>
              </div>
            </div>

            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }

            @if (sucesso()) {
              <div class="alert alert-success">
                <p>Agendamento realizado com sucesso!</p>
                <a routerLink="/meus-agendamentos" class="btn btn-primary">Ver meus agendamentos</a>
              </div>
            } @else {
              <button
                class="btn btn-primary btn-block"
                (click)="confirmar()"
                [disabled]="loadingConfirmar()"
              >
                @if (loadingConfirmar()) {
                  <span class="spinner"></span>
                } @else {
                  Confirmar Agendamento
                }
              </button>
            }
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .agendar-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .agendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .logo {
      font-family: var(--fonte-titulo);
      font-size: 1.5rem;
      color: white;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;

      .btn-outline {
        color: white;
        border-color: white;

        &:hover {
          background: white;
          color: var(--cor-primaria);
        }
      }

      .btn-text {
        color: white;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem 1rem;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
        }
      }
    }

    .agendar-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .step-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--sombra-modal);
    }

    .btn-voltar {
      background: none;
      border: none;
      color: var(--cor-texto-suave);
      cursor: pointer;
      margin-bottom: 1rem;
      font-size: 0.875rem;

      &:hover {
        color: var(--cor-primaria);
      }
    }

    .step-title {
      font-size: 1.5rem;
      color: var(--cor-texto);
      margin-bottom: 0.5rem;
    }

    .step-subtitle {
      color: var(--cor-texto-suave);
      margin-bottom: 2rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .servicos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .servico-card {
      padding: 1.5rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--cor-primaria);
        transform: translateY(-2px);
      }

      &.selected {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria-suave);
      }

      .servico-nome {
        font-size: 1.125rem;
        margin-bottom: 0.5rem;
      }

      .servico-duracao {
        color: var(--cor-texto-suave);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .servico-preco {
        color: var(--cor-primaria);
        font-weight: 600;
      }
    }

    .calendario-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.75rem;
    }

    .dia-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 0.5rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--cor-primaria);
      }

      &.selected {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria);
        color: white;

        .dia-semana, .dia-mes {
          color: rgba(255, 255, 255, 0.8);
        }
      }

      &.hoje {
        border-color: var(--cor-secundaria);
      }

      .dia-semana {
        font-size: 0.75rem;
        color: var(--cor-texto-suave);
        text-transform: uppercase;
      }

      .dia-numero {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0.25rem 0;
      }

      .dia-mes {
        font-size: 0.75rem;
        color: var(--cor-texto-suave);
      }
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
    }

    .slot-btn {
      padding: 0.75rem 1rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        border-color: var(--cor-primaria);
      }

      &.selected {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria);
        color: white;
      }
    }

    .empty-slots {
      text-align: center;
      padding: 2rem;
      color: var(--cor-texto-suave);

      p {
        margin-bottom: 1rem;
      }
    }

    .resumo-card {
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .resumo-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--cor-borda);

      &:last-child {
        border-bottom: none;
      }

      .resumo-label {
        color: var(--cor-texto-suave);
      }

      .resumo-value {
        font-weight: 500;
      }
    }

    .alert {
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .alert-error {
      background: #fef2f2;
      color: var(--cor-erro);
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #f0fdf4;
      color: var(--cor-sucesso);
      border: 1px solid #86efac;
      text-align: center;

      p {
        margin-bottom: 1rem;
      }
    }

    .btn-block {
      width: 100%;
      padding: 1rem;
    }
  `]
})
export class AgendarComponent implements OnInit {
  private publicApi = inject(PublicApiService);
  private clienteApi = inject(ClienteApiService);
  private router = inject(Router);
  clienteAuth = inject(ClienteAuthService);

  step = signal(1);
  servicos = signal<Servico[]>([]);
  loadingServicos = signal(false);

  servicoSelecionado = signal<Servico | null>(null);
  dataSelecionada = signal<string>('');
  slotSelecionado = signal<TimeSlot | null>(null);

  slots = signal<TimeSlot[]>([]);
  loadingSlots = signal(false);

  loadingConfirmar = signal(false);
  error = signal('');
  sucesso = signal(false);

  ngOnInit() {
    this.carregarServicos();
    this.verificarIntentSalvo();
  }

  private carregarServicos() {
    this.loadingServicos.set(true);
    this.publicApi.getServicos().subscribe({
      next: (res) => {
        this.servicos.set(res.servicos);
        this.loadingServicos.set(false);
      },
      error: () => {
        this.loadingServicos.set(false);
      }
    });
  }

  private verificarIntentSalvo() {
    const intent = sessionStorage.getItem('booking_intent');
    if (intent && this.clienteAuth.isLoggedIn()) {
      const data: BookingIntent = JSON.parse(intent);
      sessionStorage.removeItem('booking_intent');

      // Restaurar estado e ir para confirmacao
      this.publicApi.getServicos().subscribe(res => {
        const servico = res.servicos.find(s => s.id === data.servicoId);
        if (servico) {
          this.servicoSelecionado.set(servico);
          this.dataSelecionada.set(data.data);
          this.slotSelecionado.set({ hora: data.hora, dataHora: data.dataHora });
          this.step.set(4);
        }
      });
    }
  }

  proximosDias() {
    const dias = [];
    const hoje = new Date();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 14; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);

      dias.push({
        data: data.toISOString().split('T')[0],
        diaSemana: diasSemana[data.getDay()],
        diaNumero: data.getDate(),
        mes: meses[data.getMonth()],
        isHoje: i === 0
      });
    }

    return dias;
  }

  dataFormatada() {
    if (!this.dataSelecionada()) return '';
    const data = new Date(this.dataSelecionada() + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  selecionarServico(servico: Servico) {
    this.servicoSelecionado.set(servico);
    this.step.set(2);
  }

  selecionarData(data: string) {
    this.dataSelecionada.set(data);
    this.carregarSlots();
    this.step.set(3);
  }

  private carregarSlots() {
    const servico = this.servicoSelecionado();
    if (!servico) return;

    this.loadingSlots.set(true);
    this.publicApi.getDisponibilidade(this.dataSelecionada(), servico.id).subscribe({
      next: (res) => {
        this.slots.set(res.slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.slots.set([]);
        this.loadingSlots.set(false);
      }
    });
  }

  selecionarSlot(slot: TimeSlot) {
    this.slotSelecionado.set(slot);
    this.step.set(4);
  }

  voltarStep() {
    this.step.update(s => Math.max(1, s - 1));
  }

  confirmar() {
    if (!this.clienteAuth.isLoggedIn()) {
      // Salvar intent e redirecionar para login
      const intent: BookingIntent = {
        servicoId: this.servicoSelecionado()!.id,
        dataHora: this.slotSelecionado()!.dataHora,
        servicoNome: this.servicoSelecionado()!.nome,
        data: this.dataSelecionada(),
        hora: this.slotSelecionado()!.hora
      };
      sessionStorage.setItem('booking_intent', JSON.stringify(intent));
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/agendar' } });
      return;
    }

    // Verificar se tem pets cadastrados
    this.clienteApi.getPets().subscribe({
      next: (res) => {
        if (res.pets.length === 0) {
          // TODO: mostrar modal para cadastrar pet
          this.error.set('Voce precisa cadastrar um pet primeiro. Essa funcionalidade sera adicionada em breve.');
          return;
        }

        // Por enquanto, usar o primeiro pet
        const pet = res.pets[0];
        this.criarAgendamento(pet.id);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Erro ao verificar pets');
      }
    });
  }

  private criarAgendamento(petId: string) {
    this.loadingConfirmar.set(true);
    this.error.set('');

    this.clienteApi.criarAgendamento({
      petId,
      servicoId: this.servicoSelecionado()!.id,
      dataHora: this.slotSelecionado()!.dataHora
    }).subscribe({
      next: () => {
        this.loadingConfirmar.set(false);
        this.sucesso.set(true);
      },
      error: (err) => {
        this.loadingConfirmar.set(false);
        this.error.set(err.error?.error || 'Erro ao criar agendamento');
      }
    });
  }
}
