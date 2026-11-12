import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';
import { ApiService, errMsg } from '../services/api.service';
import { Pedido } from '../services/models';
import { BottomNavComponent } from '../shared/bottom-nav.component';

@Component({
  selector: 'app-pedidos',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, CurrencyPipe, DatePipe, BottomNavComponent],
  template: `
    <ion-header><ion-toolbar><ion-title>Mis pedidos</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page">
        @if (error()) { <p class="err">{{ error() }}</p> }
        @if (pedidos().length === 0 && !error()) { <p class="empty">Aún no has hecho pedidos.</p> }
        <p class="sub">Compras realizadas: <b>{{ activos() }}</b></p>
        @for (p of pedidos(); track p.id) {
          <article class="order">
            <header>
              <b>Pedido #{{ p.id }}</b>
              <span class="chip" [class]="'chip ' + p.estado">{{ p.estado }}</span>
            </header>
            <small>{{ fecha(p.fecha_creacion) | date: 'dd/MM/yyyy HH:mm' }} · {{ p.metodo_pago }} · pago {{ p.estado_pago }}</small>
            <ul>
              @for (i of p.items; track i.producto_id) {
                <li>{{ i.cantidad }} × {{ i.nombre_producto }} <span>{{ i.subtotal | currency }}</span></li>
              }
            </ul>
            <footer>
              <b>{{ p.total | currency }}</b>
              @if (p.estado === 'pendiente') { <button class="btn ghost" (click)="cancelar(p.id)">Cancelar</button> }
            </footer>
          </article>
        }
      </div>
    </ion-content>
    <app-bottom-nav />
  `,
})
export class PedidosPage {
  private api = inject(ApiService);
  pedidos = signal<Pedido[]>([]);
  error = signal('');

  ionViewWillEnter() { this.cargar(); }
  fecha(s: string) { return s.replace(' ', 'T'); }
  activos() { return this.pedidos().filter((p) => p.estado !== 'cancelado').length; }

  async cargar() {
    try { this.pedidos.set((await this.api.get<{ pedidos: Pedido[] }>('pedidos.php')).pedidos); this.error.set(''); }
    catch (e) { this.error.set(errMsg(e)); }
  }
  async cancelar(id: number) {
    if (!confirm('¿Cancelar este pedido?')) return;
    try { await this.api.post(`pedidos.php?accion=cancelar&id=${id}`); await this.cargar(); }
    catch (e) { this.error.set(errMsg(e)); }
  }
}
