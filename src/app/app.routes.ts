import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'empleados',
        loadComponent: () => import('./features/empleados/empleados').then(m => m.EmpleadosComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes').then(m => m.ReportesComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
