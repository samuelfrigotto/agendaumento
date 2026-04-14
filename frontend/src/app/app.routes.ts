import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/agenda',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
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
  {
    path: '**',
    redirectTo: '/agenda'
  }
];
