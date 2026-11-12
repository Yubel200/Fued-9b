import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';
import { ApiService, errMsg } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { Producto } from '../services/models';
import { BottomNavComponent } from '../shared/bottom-nav.component';

@Component({
  selector: 'app-tienda',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, CurrencyPipe, BottomNavComponent],
  template: `
    <ion-header><ion-toolbar><ion-title>🍭 Dulcería</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page">
        <p class="sub">Hola, {{ auth.user()?.name }}. ¿Qué se te antoja?</p>
        @if (error()) { <p class="err">{{ error() }}</p> }
        <div class="grid">
          @for (p of productos(); track p.id) {
            <article class="prod" [class.off]="!p.available || p.stock < 1">
              <img [src]="p.img" [alt]="p.name" loading="lazy" />
              <h3>{{ p.name }}</h3>
              <div class="row">
                <span class="price">{{ p.price | currency }}</span>
                <small>{{ p.available && p.stock > 0 ? p.stock + ' disponibles' : 'Agotado' }}</small>
              </div>
              @if (p.available && p.stock > 0) {
                @if (cart.qty(p.id) > 0) {
                  <div class="stepper">
                    <button (click)="cart.dec(p.id)">−</button>
                    <b>{{ cart.qty(p.id) }}</b>
                    <button (click)="cart.add(p)" [disabled]="cart.qty(p.id) >= p.stock">+</button>
                  </div>
                } @else {
                  <button class="btn" (click)="cart.add(p)">Agregar</button>
                }
              } @else {
                <button class="btn" disabled>Agotado</button>
              }
            </article>
          }
        </div>
      </div>
    </ion-content>
    <app-bottom-nav />
  `,
})
export class TiendaPage {
  private api = inject(ApiService);
  auth = inject(AuthService);
  cart = inject(CartService);
  productos = signal<Producto[]>([]);
  error = signal('');

  ionViewWillEnter() { this.cargar(); }

  async cargar() {
    try { this.productos.set(await this.api.get<Producto[]>('productos.php')); this.error.set(''); }
    catch (e) { this.error.set(errMsg(e)); }
  }
}
