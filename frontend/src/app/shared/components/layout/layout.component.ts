import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">Agendaumento</h1>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/agenda" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span>
            <span class="nav-text">Agenda</span>
          </a>
          <a routerLink="/admin/clientes" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span class="nav-text">Clientes</span>
          </a>
          <a routerLink="/admin/pets" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🐾</span>
            <span class="nav-text">Pets</span>
          </a>
          <a routerLink="/admin/servicos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">✂️</span>
            <span class="nav-text">Servicos</span>
          </a>
          <a routerLink="/admin/financeiro" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💰</span>
            <span class="nav-text">Financeiro</span>
          </a>
          <a routerLink="/admin/configuracoes" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Configuracoes</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <span class="user-name">{{ authService.banhista()?.nome }}</span>
            <span class="user-plan">{{ authService.banhista()?.plano }}</span>
          </div>
          <button class="btn-logout" (click)="logout()">Sair</button>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 240px;
      background-color: var(--cor-fundo-sidebar);
      color: var(--cor-texto-claro);
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      font-family: var(--fonte-titulo);
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--cor-primaria);
      margin: 0;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: all var(--transicao);

      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: var(--cor-texto-claro);
      }

      &.active {
        background-color: var(--cor-primaria);
        color: var(--cor-texto-claro);
      }
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .nav-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.75rem;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-plan {
      font-size: 0.75rem;
      color: var(--cor-primaria);
      text-transform: capitalize;
    }

    .btn-logout {
      width: 100%;
      padding: 0.5rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.7);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.75rem;
      transition: all var(--transicao);

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--cor-texto-claro);
      }
    }

    .main-content {
      flex: 1;
      margin-left: 240px;
      padding: 2rem;
      min-height: 100vh;
    }
  `]
})
export class LayoutComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
