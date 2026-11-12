import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './services/auth.service';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'tienda', canActivate: [authGuard], loadComponent: () => import('./pages/tienda.page').then((m) => m.TiendaPage) },
  { path: 'carrito', canActivate: [authGuard], loadComponent: () => import('./pages/carrito.page').then((m) => m.CarritoPage) },
  { path: 'pedidos', canActivate: [authGuard], loadComponent: () => import('./pages/pedidos.page').then((m) => m.PedidosPage) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage) },
  { path: '', redirectTo: 'tienda', pathMatch: 'full' },
  { path: '**', redirectTo: 'tienda' },
];
