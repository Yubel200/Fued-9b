import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';
import { ApiService, errMsg } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { BottomNavComponent } from '../shared/bottom-nav.component';

@Component({
  selector: 'app-carrito',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, CurrencyPipe, DatePipe, FormsModule, RouterLink, BottomNavComponent],
  template: `
    <ion-header><ion-toolbar><ion-title>Tu carrito</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page">
        @if (done(); as d) {
          <section class="done">
            <h2>¡Pedido #{{ d.id }} confirmado!</h2>
            <p>{{ d.mensaje }}</p>
            <p>Total: <b>{{ d.total | currency }}</b> · Entrega estimada: {{ fecha(d.entrega) | date: 'HH:mm' }}</p>
            <a class="btn" routerLink="/pedidos">Ver mis pedidos</a>
            <button class="link" (click)="done.set(null)">Hacer otro pedido</button>
          </section>
        } @else if (cart.items().length === 0) {
          <p class="empty">Tu carrito está vacío.</p>
          <a class="btn" routerLink="/tienda">Ir a la tienda</a>
        } @else {
          @for (i of cart.items(); track i.id) {
            <div class="line">
              <img [src]="i.img" [alt]="i.name" />
              <div class="grow"><b>{{ i.name }}</b><small>{{ i.price | currency }} c/u</small></div>
              <div class="stepper">
                <button (click)="cart.dec(i.id)">−</button><b>{{ i.cantidad }}</b>
                <button (click)="mas(i.id)" [disabled]="i.cantidad >= i.stock">+</button>
              </div>
              <span class="price">{{ i.price * i.cantidad | currency }}</span>
            </div>
          }
          <p class="total">Total <b>{{ cart.total() | currency }}</b></p>

          <h3>Datos de entrega</h3>
          <label>Nombre completo<input [(ngModel)]="nombre" /></label>
          <label>Dirección<input [(ngModel)]="direccion" /></label>
          <label>Teléfono<input [(ngModel)]="telefono" type="tel" inputmode="tel" /></label>
          <label>Referencias (opcional)<input [(ngModel)]="referencias" /></label>

          <h3>Método de pago</h3>
          <div class="seg">
            <button [class.on]="metodo() === 'efectivo'" (click)="metodo.set('efectivo')">💵 Efectivo</button>
            <button [class.on]="metodo() === 'tarjeta'" (click)="metodo.set('tarjeta')">💳 Tarjeta</button>
          </div>

          @if (metodo() === 'tarjeta') {
            <div class="cardbox">
              <small>Pago simulado: no se cobra nada. Prueba con 4242 4242 4242 4242 (aprobada) o 4000 0000 0000 0002 (rechazada).</small>
              <label>Número<input [ngModel]="numero" (ngModelChange)="numero = fmtNum($event)" inputmode="numeric" maxlength="23" placeholder="4242 4242 4242 4242" /></label>
              <div class="two">
                <label>Vence (MM/AA)<input [ngModel]="vence" (ngModelChange)="vence = fmtVence($event)" inputmode="numeric" maxlength="5" placeholder="12/29" /></label>
                <label>CVV<input [(ngModel)]="cvv" inputmode="numeric" maxlength="4" type="password" /></label>
              </div>
              <label>Titular<input [(ngModel)]="titular" /></label>
            </div>
          } @else {
            <p class="sub">Pagas en efectivo cuando recibas tu pedido.</p>
          }

          @if (error()) { <p class="err">{{ error() }}</p> }
          <button class="btn big" [disabled]="busy()" (click)="pagar()">
            {{ busy() ? 'Procesando pago…' : metodo() === 'tarjeta' ? 'Pagar ' + (cart.total() | currency) : 'Confirmar pedido ' + (cart.total() | currency) }}
          </button>
        }
      </div>
    </ion-content>
    <app-bottom-nav />
  `,
})
export class CarritoPage {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  cart = inject(CartService);

  metodo = signal<'efectivo' | 'tarjeta'>('efectivo');
  error = signal('');
  busy = signal(false);
  done = signal<{ id: number; total: number; mensaje: string; entrega: string } | null>(null);

  nombre = this.auth.user()?.name ?? '';
  direccion = ''; telefono = ''; referencias = '';
  numero = ''; vence = ''; cvv = ''; titular = '';

  fecha(s: string) { return (s ?? '').replace(' ', 'T'); }
  mas(id: number) {
    const i = this.cart.items().find((x) => x.id === id);
    if (i) this.cart.add({ id: i.id, name: i.name, price: i.price, img: i.img, stock: i.stock, available: true });
  }
  fmtNum(v: string) { return v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim(); }
  fmtVence(v: string) { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; }

  private validar(): string {
    if (this.nombre.trim().length < 3) return 'Escribe tu nombre completo.';
    if (this.direccion.trim().length < 5) return 'Escribe tu dirección.';
    if (this.telefono.replace(/\D/g, '').length < 7) return 'Escribe un teléfono válido.';
    if (this.metodo() === 'tarjeta' && (this.numero.replace(/\D/g, '').length < 13 || this.vence.length < 5 || this.cvv.length < 3 || !this.titular.trim()))
      return 'Completa los datos de la tarjeta.';
    return '';
  }

  async pagar() {
    const v = this.validar();
    if (v) { this.error.set(v); return; }
    this.error.set(''); this.busy.set(true);
    try {
      if (this.metodo() === 'tarjeta') await new Promise((r) => setTimeout(r, 1500)); // simulación visual del cobro
      const r = await this.api.post<any>('pedidos.php', {
        items: this.cart.items().map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
        nombre_completo: this.nombre.trim(), direccion: this.direccion.trim(),
        telefono: this.telefono.trim(), referencias: this.referencias.trim(),
        metodo_pago: this.metodo(),
        tarjeta: this.metodo() === 'tarjeta' ? { numero: this.numero, vence: this.vence, cvv: this.cvv, titular: this.titular } : undefined,
      });
      this.done.set({ id: r.pedido_id, total: r.total, mensaje: r.message, entrega: r.fecha_entrega_estimada });
      this.cart.clear();
      this.numero = ''; this.vence = ''; this.cvv = ''; this.titular = '';
    } catch (e) {
      this.error.set(errMsg(e));
    } finally {
      this.busy.set(false);
    }
  }
}
