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

interface Pet {
  id: string;
  nome: string;
  especie: string;
  raca?: string;
  tamanho?: string;
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
        <!-- Indicador de progresso -->
        <div class="progress-indicator">
          <div class="progress-step" [class.active]="step() >= 1" [class.completed]="step() > 1">
            <span class="step-number">1</span>
            <span class="step-label">Servico</span>
          </div>
          <div class="progress-line" [class.completed]="step() > 1"></div>
          <div class="progress-step" [class.active]="step() >= 2" [class.completed]="step() > 2">
            <span class="step-number">2</span>
            <span class="step-label">Data</span>
          </div>
          <div class="progress-line" [class.completed]="step() > 2"></div>
          <div class="progress-step" [class.active]="step() >= 3" [class.completed]="step() > 3">
            <span class="step-number">3</span>
            <span class="step-label">Horario</span>
          </div>
          <div class="progress-line" [class.completed]="step() > 3"></div>
          <div class="progress-step" [class.active]="step() >= 4">
            <span class="step-number">4</span>
            <span class="step-label">Confirmar</span>
          </div>
        </div>

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
                    <span class="servico-icon">{{ getServicoIcon(servico.nome) }}</span>
                    <div class="servico-info">
                      <h3 class="servico-nome">{{ servico.nome }}</h3>
                      <p class="servico-duracao">{{ servico.duracaoMin }} minutos</p>
                    </div>
                    <p class="servico-preco">R$ {{ servico.precoPequeno | number:'1.0-0' }}+</p>
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

            <div class="calendario-scroll">
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
                  <span class="empty-icon">📅</span>
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
                <span class="success-icon">✓</span>
                <p>Agendamento realizado com sucesso!</p>
                <a routerLink="/meus-agendamentos" class="btn btn-primary">Ver meus agendamentos</a>
              </div>
            } @else {
              <!-- Selecao de Pet -->
              @if (clienteAuth.isLoggedIn()) {
                @if (loadingPets()) {
                  <div class="loading-pets">
                    <span class="spinner"></span>
                    <span>Carregando seus pets...</span>
                  </div>
                } @else if (pets().length === 0) {
                  <!-- Formulario de cadastro de pet -->
                  <div class="cadastro-pet">
                    <h3>Cadastre seu pet</h3>
                    <p class="cadastro-pet-info">Para agendar, voce precisa cadastrar seu pet</p>

                    <div class="form-group">
                      <label class="form-label">Nome do pet *</label>
                      <input type="text" class="form-input" [(ngModel)]="novoPet.nome" placeholder="Nome do seu pet">
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">Especie *</label>
                        <select class="form-input" [(ngModel)]="novoPet.especie">
                          <option value="">Selecione</option>
                          <option value="cachorro">Cachorro</option>
                          <option value="gato">Gato</option>
                          <option value="ave">Ave</option>
                          <option value="roedor">Roedor</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Tamanho</label>
                        <select class="form-input" [(ngModel)]="novoPet.tamanho">
                          <option value="">Selecione</option>
                          <option value="pequeno">Pequeno</option>
                          <option value="medio">Medio</option>
                          <option value="grande">Grande</option>
                          <option value="gigante">Gigante</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Raca</label>
                      <input type="text" class="form-input" [(ngModel)]="novoPet.raca" placeholder="Raca (opcional)">
                    </div>

                    <button
                      class="btn btn-primary btn-block"
                      (click)="cadastrarPetEAgendar()"
                      [disabled]="loadingConfirmar() || !novoPet.nome || !novoPet.especie"
                    >
                      @if (loadingConfirmar()) {
                        <span class="spinner"></span>
                      } @else {
                        Cadastrar e Agendar
                      }
                    </button>
                  </div>
                } @else {
                  <!-- Selecao de pet existente -->
                  <div class="selecao-pet">
                    <h3>Selecione o pet</h3>
                    <div class="pets-grid">
                      @for (pet of pets(); track pet.id) {
                        <button
                          class="pet-btn"
                          [class.selected]="petSelecionado()?.id === pet.id"
                          (click)="selecionarPet(pet)"
                        >
                          <span class="pet-icon">{{ getEspecieIcon(pet.especie) }}</span>
                          <span class="pet-nome">{{ pet.nome }}</span>
                          <span class="pet-info">{{ pet.raca || pet.especie }}</span>
                        </button>
                      }
                    </div>

                    <button
                      class="btn btn-primary btn-block"
                      (click)="confirmarAgendamento()"
                      [disabled]="loadingConfirmar() || !petSelecionado()"
                    >
                      @if (loadingConfirmar()) {
                        <span class="spinner"></span>
                      } @else {
                        Confirmar Agendamento
                      }
                    </button>
                  </div>
                }
              } @else {
                <button
                  class="btn btn-primary btn-block"
                  (click)="confirmar()"
                >
                  Entrar para Confirmar
                </button>
              }
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
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .logo {
      font-family: var(--fonte-titulo);
      font-size: 1.25rem;
      color: white;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;

      .btn-outline {
        color: white;
        border-color: white;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;

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
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
        }
      }
    }

    .agendar-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    // Progress indicator
    .progress-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      padding: 0 1rem;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      transition: all 0.3s;
    }

    .step-label {
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.7);
      text-transform: uppercase;
    }

    .progress-step.active .step-number {
      background: white;
      color: var(--cor-primaria);
    }

    .progress-step.completed .step-number {
      background: #10b981;
      color: white;
    }

    .progress-line {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.3);
      margin: 0 0.5rem;
      max-width: 60px;
      transition: all 0.3s;
    }

    .progress-line.completed {
      background: #10b981;
    }

    .step-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--sombra-modal);
    }

    .btn-voltar {
      background: none;
      border: none;
      color: var(--cor-texto-suave);
      cursor: pointer;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      padding: 0.5rem 0;
      min-height: 44px;

      &:hover {
        color: var(--cor-primaria);
      }
    }

    .step-title {
      font-size: 1.25rem;
      color: var(--cor-texto);
      margin-bottom: 0.5rem;
    }

    .step-subtitle {
      color: var(--cor-texto-suave);
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    // Servicos grid
    .servicos-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .servico-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
      min-height: 72px;

      &:hover {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria-suave);
      }

      &:active {
        transform: scale(0.98);
      }

      &.selected {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria-suave);
      }
    }

    .servico-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .servico-info {
      flex: 1;
    }

    .servico-nome {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.125rem;
    }

    .servico-duracao {
      color: var(--cor-texto-suave);
      font-size: 0.8rem;
      margin: 0;
    }

    .servico-preco {
      font-weight: 700;
      color: var(--cor-primaria);
      font-size: 1rem;
      margin: 0;
    }

    // Calendario
    .calendario-scroll {
      overflow-x: auto;
      margin: 0 -1.5rem;
      padding: 0 1.5rem 0.5rem;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .calendario-grid {
      display: flex;
      gap: 0.5rem;
    }

    .dia-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      min-width: 70px;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;

      &:hover {
        border-color: var(--cor-primaria);
      }

      &:active {
        transform: scale(0.95);
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
        font-size: 0.7rem;
        color: var(--cor-texto-suave);
        text-transform: uppercase;
      }

      .dia-numero {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.125rem 0;
      }

      .dia-mes {
        font-size: 0.7rem;
        color: var(--cor-texto-suave);
      }
    }

    // Slots
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .slot-btn {
      padding: 1rem 0.5rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      font-weight: 500;
      font-size: 1rem;
      transition: all 0.2s;
      min-height: 52px;

      &:hover {
        border-color: var(--cor-primaria);
      }

      &:active {
        transform: scale(0.95);
      }

      &.selected {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria);
        color: white;
      }
    }

    .empty-slots {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--cor-texto-suave);

      .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
      }

      p {
        margin-bottom: 1rem;
      }
    }

    // Resumo
    .resumo-card {
      background: var(--cor-fundo);
      border-radius: var(--radius-md);
      padding: 1rem;
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
        font-size: 0.875rem;
      }

      .resumo-value {
        font-weight: 500;
        text-align: right;
      }
    }

    // Selecao de pet
    .selecao-pet, .cadastro-pet {
      h3 {
        font-size: 1rem;
        margin-bottom: 1rem;
        color: var(--cor-texto);
      }
    }

    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .pet-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem;
      border: 2px solid var(--cor-borda);
      border-radius: var(--radius-md);
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 100px;

      &:hover {
        border-color: var(--cor-primaria);
      }

      &.selected {
        border-color: var(--cor-primaria);
        background: var(--cor-primaria-suave);
      }
    }

    .pet-icon {
      font-size: 2rem;
    }

    .pet-nome {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .pet-info {
      font-size: 0.75rem;
      color: var(--cor-texto-suave);
    }

    .loading-pets {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem;
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
    }

    // Cadastro de pet
    .cadastro-pet-info {
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.375rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--cor-borda);
      border-radius: var(--radius-md);
      font-size: 16px; // Evita zoom no iOS

      &:focus {
        outline: none;
        border-color: var(--cor-primaria);
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    // Alerts
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

      .success-icon {
        display: block;
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      p {
        margin-bottom: 1rem;
        font-weight: 500;
      }
    }

    .btn-block {
      width: 100%;
      padding: 1rem;
      font-size: 1rem;
      min-height: 52px;
    }

    // Tablet e Desktop
    @media (min-width: 768px) {
      .agendar-header {
        padding: 1rem 2rem;
      }

      .logo {
        font-size: 1.5rem;
      }

      .agendar-content {
        padding: 2rem;
      }

      .progress-indicator {
        margin-bottom: 2rem;
      }

      .step-number {
        width: 36px;
        height: 36px;
        font-size: 0.875rem;
      }

      .step-label {
        font-size: 0.75rem;
      }

      .progress-line {
        max-width: 100px;
      }

      .step-section {
        padding: 2rem;
      }

      .step-title {
        font-size: 1.5rem;
      }

      .servicos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }

      .servico-card {
        flex-direction: column;
        text-align: center;
        padding: 1.5rem;
        min-height: 140px;
      }

      .servico-icon {
        font-size: 2.5rem;
      }

      .servico-info {
        flex: none;
      }

      .calendario-scroll {
        overflow-x: visible;
        margin: 0;
        padding: 0;
      }

      .calendario-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        overflow-x: visible;
      }

      .dia-btn {
        min-width: auto;
      }

      .slots-grid {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      }

      .pets-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      }
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

  // Pets
  pets = signal<Pet[]>([]);
  loadingPets = signal(false);
  petSelecionado = signal<Pet | null>(null);
  novoPet = { nome: '', especie: '', raca: '', tamanho: '' };

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

      this.publicApi.getServicos().subscribe(res => {
        const servico = res.servicos.find(s => s.id === data.servicoId);
        if (servico) {
          this.servicoSelecionado.set(servico);
          this.dataSelecionada.set(data.data);
          this.slotSelecionado.set({ hora: data.hora, dataHora: data.dataHora });
          this.step.set(4);
          this.carregarPets();
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

  getServicoIcon(nome: string): string {
    const lower = nome.toLowerCase();
    if (lower.includes('banho') || lower.includes('tosa')) return '🛁';
    if (lower.includes('consult')) return '🩺';
    if (lower.includes('vacin')) return '💉';
    if (lower.includes('exame')) return '🔬';
    if (lower.includes('cirurg')) return '🏥';
    if (lower.includes('dent')) return '🦷';
    return '🐾';
  }

  getEspecieIcon(especie: string): string {
    const icons: Record<string, string> = {
      'cachorro': '🐕',
      'gato': '🐱',
      'ave': '🦜',
      'roedor': '🐹',
      'reptil': '🦎'
    };
    return icons[especie?.toLowerCase()] || '🐾';
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

  carregarSlots() {
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
    if (this.clienteAuth.isLoggedIn()) {
      this.carregarPets();
    }
  }

  voltarStep() {
    this.error.set('');
    this.step.update(s => Math.max(1, s - 1));
  }

  private carregarPets() {
    this.loadingPets.set(true);
    this.clienteApi.getPets().subscribe({
      next: (res) => {
        this.pets.set(res.pets || []);
        if (res.pets && res.pets.length === 1) {
          this.petSelecionado.set(res.pets[0]);
        }
        this.loadingPets.set(false);
      },
      error: () => {
        this.pets.set([]);
        this.loadingPets.set(false);
      }
    });
  }

  selecionarPet(pet: Pet) {
    this.petSelecionado.set(pet);
  }

  confirmar() {
    if (!this.clienteAuth.isLoggedIn()) {
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

    this.carregarPets();
  }

  cadastrarPetEAgendar() {
    if (!this.novoPet.nome || !this.novoPet.especie) return;

    this.loadingConfirmar.set(true);
    this.error.set('');

    this.clienteApi.criarPet({
      nome: this.novoPet.nome,
      especie: this.novoPet.especie,
      raca: this.novoPet.raca || undefined,
      tamanho: this.novoPet.tamanho || undefined
    }).subscribe({
      next: (res) => {
        this.criarAgendamento(res.id);
      },
      error: (err) => {
        this.loadingConfirmar.set(false);
        this.error.set(err.error?.error || 'Erro ao cadastrar pet');
      }
    });
  }

  confirmarAgendamento() {
    if (!this.petSelecionado()) {
      this.error.set('Selecione um pet para continuar');
      return;
    }
    this.criarAgendamento(this.petSelecionado()!.id);
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

        if (err.status === 409) {
          this.error.set('Este horario acabou de ser reservado. Por favor, escolha outro horario.');
          this.slotSelecionado.set(null);
          this.step.set(3);
          this.carregarSlots();
        } else {
          this.error.set(err.error?.error || 'Erro ao criar agendamento');
        }
      }
    });
  }
}
