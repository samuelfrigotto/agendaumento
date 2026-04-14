import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Agendamento {
  id: string;
  dataHora: string;
  duracaoMin: number;
  preco: number;
  status: string;
  pet: { id: string; nome: string; fotoUrl?: string };
  cliente: { id: string; nome: string; telefone: string };
  servico?: { id: string; nome: string };
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
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
  `]
})
export class AgendaComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  agendamentos = signal<Agendamento[]>([]);
  dataBase = signal(new Date());

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
    // TODO: Abrir modal de novo agendamento
    console.log('Novo agendamento');
  }

  abrirAgendamento(agendamento: Agendamento): void {
    // TODO: Abrir modal de detalhes
    console.log('Abrir agendamento', agendamento);
  }
}
