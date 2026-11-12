import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bnav">
      <a routerLink="/tienda" routerLinkActive="on"><i>🍬</i><span>Tienda</span></a>
      <a routerLink="/carrito" routerLinkActive="on">
        <i>🛒</i><span>Carrito</span>
        @if (cart.count() > 0) { <b>{{ cart.count() }}</b> }
      </a>
      <a routerLink="/pedidos" routerLinkActive="on"><i>🧾</i><span>Pedidos</span></a>
      @if (auth.isAdmin()) {
        <a routerLink="/admin" routerLinkActive="on"><i>📊</i><span>Ventas</span></a>
      }
      <button type="button" (click)="auth.logout()"><i>🚪</i><span>Salir</span></button>
    </nav>
  `,
})
export class BottomNavComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
}
