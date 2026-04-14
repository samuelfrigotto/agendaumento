import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';

interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
  precoPequeno: number;
  precoMedio: number;
  precoGrande: number;
  precoGigante: number;
  categoria: string;
  ativo: boolean;
}

const CATEGORIAS = [
  { value: 'banho_tosa', label: 'Banho e Tosa', icon: '🛁' },
  { value: 'consulta', label: 'Consulta', icon: '🩺' },
  { value: 'exame', label: 'Exame', icon: '🔬' },
  { value: 'cirurgia', label: 'Cirurgia', icon: '🏥' },
  { value: 'vacina', label: 'Vacina', icon: '💉' },
  { value: 'internacao', label: 'Internacao', icon: '🛏️' },
  { value: 'outro', label: 'Outro', icon: '📋' }
];

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Servicos</h1>
        <button class="btn btn-primary" (click)="novoServico()">+ Novo Servico</button>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <span class="spinner"></span>
        </div>
      } @else {
        <!-- Agrupar por categoria -->
        @for (grupo of servicosAgrupados(); track grupo.categoria) {
          <div class="categoria-section">
            <h2 class="categoria-titulo">
              <span class="categoria-icon">{{ grupo.icon }}</span>
              {{ grupo.label }}
              <span class="categoria-count">({{ grupo.servicos.length }})</span>
            </h2>

            <div class="servicos-grid">
              @for (servico of grupo.servicos; track servico.id) {
                <div class="servico-card" [class.inativo]="!servico.ativo">
                  <div class="servico-header">
                    <h3 class="servico-nome">{{ servico.nome }}</h3>
                    @if (!servico.ativo) {
                      <span class="badge badge-inativo">Inativo</span>
                    }
                  </div>
                  <p class="servico-duracao">{{ servico.duracaoMin }} minutos</p>

                  <div class="precos-grid">
                    <div class="preco-item">
                      <span class="preco-label">Pequeno</span>
                      <span class="preco-valor">R$ {{ servico.precoPequeno | number:'1.2-2' }}</span>
                    </div>
                    <div class="preco-item">
                      <span class="preco-label">Medio</span>
                      <span class="preco-valor">R$ {{ servico.precoMedio | number:'1.2-2' }}</span>
                    </div>
                    <div class="preco-item">
                      <span class="preco-label">Grande</span>
                      <span class="preco-valor">R$ {{ servico.precoGrande | number:'1.2-2' }}</span>
                    </div>
                    <div class="preco-item">
                      <span class="preco-label">Gigante</span>
                      <span class="preco-valor">R$ {{ servico.precoGigante | number:'1.2-2' }}</span>
                    </div>
                  </div>

                  <div class="servico-actions">
                    <button class="btn btn-secondary btn-sm" (click)="editarServico(servico)">Editar</button>
                    @if (servico.ativo) {
                      <button class="btn btn-danger btn-sm" (click)="desativarServico(servico)">Desativar</button>
                    } @else {
                      <button class="btn btn-success btn-sm" (click)="ativarServico(servico)">Ativar</button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>Nenhum servico cadastrado</p>
            <button class="btn btn-primary" (click)="novoServico()">Criar primeiro servico</button>
          </div>
        }
      }
    </div>

    <!-- Modal de Servico (Novo/Editar) -->
    @if (modalAberto()) {
      <div class="modal-overlay" (click)="fecharModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ servicoEditando() ? 'Editar Servico' : 'Novo Servico' }}</h3>
            <button class="btn-fechar" (click)="fecharModal()">×</button>
          </div>

          <div class="modal-body">
            @if (modalErro()) {
              <div class="alert alert-error">{{ modalErro() }}</div>
            }

            <div class="form-group">
              <label class="form-label">Nome do Servico *</label>
              <input type="text" class="form-input" [(ngModel)]="form.nome" placeholder="Ex: Banho e Tosa">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Categoria *</label>
                <select class="form-input" [(ngModel)]="form.categoria">
                  @for (cat of categorias; track cat.value) {
                    <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Duracao (min) *</label>
                <input type="number" class="form-input" [(ngModel)]="form.duracaoMin" min="15" step="15">
              </div>
            </div>

            <h4 class="section-title">Precos por Tamanho</h4>

            <div class="precos-form">
              <div class="form-group">
                <label class="form-label">Pequeno *</label>
                <input type="number" class="form-input" [(ngModel)]="form.precoPequeno" min="0" step="5">
              </div>
              <div class="form-group">
                <label class="form-label">Medio *</label>
                <input type="number" class="form-input" [(ngModel)]="form.precoMedio" min="0" step="5">
              </div>
              <div class="form-group">
                <label class="form-label">Grande *</label>
                <input type="number" class="form-input" [(ngModel)]="form.precoGrande" min="0" step="5">
              </div>
              <div class="form-group">
                <label class="form-label">Gigante *</label>
                <input type="number" class="form-input" [(ngModel)]="form.precoGigante" min="0" step="5">
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="fecharModal()">Cancelar</button>
              <button
                class="btn btn-primary"
                (click)="salvarServico()"
                [disabled]="salvando() || !podeGravar()"
              >
                @if (salvando()) {
                  <span class="spinner spinner-sm"></span>
                } @else {
                  {{ servicoEditando() ? 'Salvar' : 'Criar' }}
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
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

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .categoria-section {
      margin-bottom: 2rem;
    }

    .categoria-titulo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      margin-bottom: 1rem;
      color: var(--cor-texto);
    }

    .categoria-icon {
      font-size: 1.5rem;
    }

    .categoria-count {
      font-weight: 400;
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
    }

    .servicos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .servico-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--sombra-card);

      &.inativo {
        opacity: 0.6;
      }
    }

    .servico-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .servico-nome {
      margin: 0;
      font-size: 1.125rem;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-inativo {
      background: #fee2e2;
      color: #991b1b;
    }

    .servico-duracao {
      color: var(--cor-texto-suave);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .precos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .preco-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: var(--cor-fundo);
      border-radius: var(--radius-sm);
    }

    .preco-label {
      color: var(--cor-texto-suave);
      font-size: 0.75rem;
    }

    .preco-valor {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .servico-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--cor-borda);
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;

      &:hover {
        background: #dc2626;
      }
    }

    .btn-success {
      background: #10b981;
      color: white;
      border: none;

      &:hover {
        background: #059669;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: var(--radius-lg);

      p {
        color: var(--cor-texto-suave);
        margin-bottom: 1rem;
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

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .section-title {
      font-size: 0.875rem;
      color: var(--cor-texto-suave);
      text-transform: uppercase;
      margin: 1.5rem 0 1rem 0;
    }

    .precos-form {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
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

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
    }
  `]
})
export class ServicosComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  servicos = signal<Servico[]>([]);
  categorias = CATEGORIAS;

  // Modal
  modalAberto = signal(false);
  servicoEditando = signal<Servico | null>(null);
  modalErro = signal('');
  salvando = signal(false);
  form = {
    nome: '',
    categoria: 'banho_tosa',
    duracaoMin: 60,
    precoPequeno: 0,
    precoMedio: 0,
    precoGrande: 0,
    precoGigante: 0
  };

  ngOnInit(): void {
    this.carregarServicos();
  }

  carregarServicos(): void {
    this.loading.set(true);
    this.api.getServicos().subscribe({
      next: (res) => {
        this.servicos.set(res.servicos || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  servicosAgrupados() {
    const servicos = this.servicos();
    const grupos: { categoria: string; label: string; icon: string; servicos: Servico[] }[] = [];

    servicos.forEach(servico => {
      const cat = CATEGORIAS.find(c => c.value === servico.categoria) || CATEGORIAS.find(c => c.value === 'outro')!;
      let grupo = grupos.find(g => g.categoria === servico.categoria);

      if (!grupo) {
        grupo = { categoria: servico.categoria, label: cat.label, icon: cat.icon, servicos: [] };
        grupos.push(grupo);
      }
      grupo.servicos.push(servico);
    });

    // Ordenar categorias
    const ordem = CATEGORIAS.map(c => c.value);
    return grupos.sort((a, b) => ordem.indexOf(a.categoria) - ordem.indexOf(b.categoria));
  }

  novoServico(): void {
    this.servicoEditando.set(null);
    this.form = {
      nome: '',
      categoria: 'banho_tosa',
      duracaoMin: 60,
      precoPequeno: 50,
      precoMedio: 70,
      precoGrande: 90,
      precoGigante: 110
    };
    this.modalErro.set('');
    this.modalAberto.set(true);
  }

  editarServico(servico: Servico): void {
    this.servicoEditando.set(servico);
    this.form = {
      nome: servico.nome,
      categoria: servico.categoria || 'banho_tosa',
      duracaoMin: servico.duracaoMin,
      precoPequeno: servico.precoPequeno,
      precoMedio: servico.precoMedio,
      precoGrande: servico.precoGrande,
      precoGigante: servico.precoGigante
    };
    this.modalErro.set('');
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.servicoEditando.set(null);
  }

  podeGravar(): boolean {
    return !!(
      this.form.nome &&
      this.form.categoria &&
      this.form.duracaoMin > 0 &&
      this.form.precoPequeno >= 0 &&
      this.form.precoMedio >= 0 &&
      this.form.precoGrande >= 0 &&
      this.form.precoGigante >= 0
    );
  }

  salvarServico(): void {
    if (!this.podeGravar()) return;

    this.salvando.set(true);
    this.modalErro.set('');

    const dados = {
      nome: this.form.nome,
      categoria: this.form.categoria,
      duracaoMin: this.form.duracaoMin,
      precoPequeno: this.form.precoPequeno,
      precoMedio: this.form.precoMedio,
      precoGrande: this.form.precoGrande,
      precoGigante: this.form.precoGigante
    };

    const request = this.servicoEditando()
      ? this.api.atualizarServico(this.servicoEditando()!.id, dados)
      : this.api.criarServico(dados);

    request.subscribe({
      next: () => {
        this.salvando.set(false);
        this.fecharModal();
        this.carregarServicos();
      },
      error: (err) => {
        this.salvando.set(false);
        this.modalErro.set(err.error?.error || 'Erro ao salvar servico');
      }
    });
  }

  desativarServico(servico: Servico): void {
    if (!confirm(`Deseja desativar o servico "${servico.nome}"?`)) return;

    this.api.atualizarServico(servico.id, { ativo: false }).subscribe({
      next: () => this.carregarServicos(),
      error: (err) => alert(err.error?.error || 'Erro ao desativar servico')
    });
  }

  ativarServico(servico: Servico): void {
    this.api.atualizarServico(servico.id, { ativo: true }).subscribe({
      next: () => this.carregarServicos(),
      error: (err) => alert(err.error?.error || 'Erro ao ativar servico')
    });
  }
}
