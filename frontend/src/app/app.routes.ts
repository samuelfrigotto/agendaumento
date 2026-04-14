import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { clienteGuard } from './core/guards/cliente.guard';

export const routes: Routes = [
  // Pagina inicial redireciona para agendar
  {
    path: '',
    redirectTo: '/agendar',
    pathMatch: 'full'
  },

  // Area publica - Agendamento
  {
    path: 'agendar',
    loadComponent: () => import('./features/agendar/agendar.component').then(m => m.AgendarComponent)
  },

  // Auth do cliente
  {
    path: 'login',
    loadComponent: () => import('./features/cliente-auth/cliente-login/cliente-login.component').then(m => m.ClienteLoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/cliente-auth/cliente-registro/cliente-registro.component').then(m => m.ClienteRegistroComponent)
  },

  // Area do cliente (autenticado)
  {
    path: 'meus-agendamentos',
    loadComponent: () => import('./features/cliente-area/meus-agendamentos/meus-agendamentos.component').then(m => m.MeusAgendamentosComponent),
    canActivate: [clienteGuard]
  },

  // Admin - Auth
  {
    path: 'admin/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin/registro',
    loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },

  // Admin - Area protegida
  {
    path: 'admin',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'agenda',
        pathMatch: 'full'
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/agenda/agenda.component').then(m => m.AgendaComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'clientes/:id',
        loadComponent: () => import('./features/clientes/cliente-detalhe/cliente-detalhe.component').then(m => m.ClienteDetalheComponent)
      },
      {
        path: 'pets',
        loadComponent: () => import('./features/pets/pets.component').then(m => m.PetsComponent)
      },
      {
        path: 'pets/:id',
        loadComponent: () => import('./features/pets/pet-detalhe/pet-detalhe.component').then(m => m.PetDetalheComponent)
      },
      {
        path: 'financeiro',
        loadComponent: () => import('./features/financeiro/financeiro.component').then(m => m.FinanceiroComponent)
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./features/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent)
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: '/agendar'
  }
];
