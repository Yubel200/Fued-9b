import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { ApiService, errMsg } from '../services/api.service';
import { AdminStats } from '../services/models';
import { BottomNavComponent } from '../shared/bottom-nav.component';

Chart.register(...registerables);
const COLORES = ['#e5195f', '#ffc531', '#7a3cff', '#2bb673', '#ff7a3d', '#1fa2d6', '#c6f06b', '#25133f', '#ff8fb8', '#9a8bb5'];

@Component({
  selector: 'app-admin',
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, CurrencyPipe, DatePipe, BottomNavComponent],
  template: `
    <ion-header><ion-toolbar><ion-title>Panel de ventas</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page wide">
        <button class="btn ghost" (click)="cargar()">Actualizar</button>
        @if (error()) { <p class="err">{{ error() }}</p> }

        @if (d(); as s) {
          <div class="kpis">
            <div><small>Ventas</small><b>{{ s.resumen.ventas | currency }}</b></div>
            <div><small>Pedidos</small><b>{{ s.resumen.pedidos }}</b></div>
            <div><small>Clientes</small><b>{{ s.resumen.clientes }}</b></div>
            <div><small>Ticket promedio</small><b>{{ s.resumen.ticket | currency }}</b></div>
          </div>
        }

        <section class="panel"><h3>Dulces más vendidos (unidades)</h3><div class="cv tall"><canvas #cTop></canvas></div></section>
        <section class="panel"><h3>Ventas de los últimos 14 días</h3><div class="cv"><canvas #cDias></canvas></div></section>
        <section class="panel"><h3>Compras por cliente</h3><div class="cv"><canvas #cCli></canvas></div></section>
        <section class="panel"><h3>Método de pago</h3><div class="cv"><canvas #cMet></canvas></div></section>

        @if (d(); as s) {
          <section class="panel">
            <h3>Clientes</h3>
            <div class="scroll"><table>
              <tr><th>Usuario</th><th>Nombre</th><th>Compras</th><th>Gastado</th></tr>
              @for (c of s.clientes; track c.id) {
                <tr><td>{{ c.username }}</td><td>{{ c.name }}</td><td>{{ c.compras }}</td><td>{{ c.gastado | currency }}</td></tr>
              }
            </table></div>
          </section>
          <section class="panel">
            <h3>Últimos pedidos</h3>
            <div class="scroll"><table>
              <tr><th>#</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Estado</th><th></th></tr>
              @for (o of s.ultimos; track o.id) {
                <tr>
                  <td>{{ o.id }}</td><td>{{ o.username }}</td><td>{{ o.total | currency }}</td>
                  <td>{{ o.metodo_pago }}</td>
                  <td><span class="chip" [class]="'chip ' + o.estado">{{ o.estado }}</span></td>
                  <td>@if (o.estado === 'pendiente') { <button class="btn mini" (click)="entregar(o.id)">Entregado</button> }</td>
                </tr>
              }
            </table></div>
          </section>
        }
      </div>
    </ion-content>
    <app-bottom-nav />
  `,
})
export class AdminPage implements OnDestroy {
  private api = inject(ApiService);
  d = signal<AdminStats | null>(null);
  error = signal('');
  private charts: Chart[] = [];

  @ViewChild('cTop') cTop!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cDias') cDias!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cCli') cCli!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cMet') cMet!: ElementRef<HTMLCanvasElement>;

  ionViewWillEnter() { this.cargar(); }
  ngOnDestroy() { this.charts.forEach((c) => c.destroy()); }

  async cargar() {
    try {
      this.d.set(await this.api.get<AdminStats>('admin_stats.php'));
      this.error.set('');
      setTimeout(() => this.dibujar(), 0);
    } catch (e) { this.error.set(errMsg(e)); }
  }

  async entregar(id: number) {
    try { await this.api.post(`pedidos.php?accion=entregar&id=${id}`); await this.cargar(); }
    catch (e) { this.error.set(errMsg(e)); }
  }

  private dibujar() {
    const s = this.d();
    if (!s || !this.cTop) return;
    this.charts.forEach((c) => c.destroy());
    const base = { responsive: true, maintainAspectRatio: false };

    this.charts = [
      new Chart(this.cTop.nativeElement, {
        type: 'bar',
        data: { labels: s.top_productos.map((p) => p.nombre), datasets: [{ label: 'Unidades vendidas', data: s.top_productos.map((p) => p.unidades), backgroundColor: COLORES }] },
        options: { ...base, indexAxis: 'y', plugins: { legend: { display: false } } },
      }),
      new Chart(this.cDias.nativeElement, {
        type: 'line',
        data: { labels: s.ventas_dia.map((v) => v.fecha.slice(5)), datasets: [{ label: 'Ventas ($)', data: s.ventas_dia.map((v) => v.ventas), borderColor: '#e5195f', backgroundColor: 'rgba(229,25,95,.15)', fill: true, tension: 0.3 }] },
        options: base,
      }),
      new Chart(this.cCli.nativeElement, {
        type: 'bar',
        data: { labels: s.clientes.map((c) => c.username), datasets: [{ label: 'Compras', data: s.clientes.map((c) => c.compras), backgroundColor: '#7a3cff' }] },
        options: { ...base, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      }),
      new Chart(this.cMet.nativeElement, {
        type: 'doughnut',
        data: { labels: s.metodos.map((m) => m.metodo), datasets: [{ data: s.metodos.map((m) => m.pedidos), backgroundColor: ['#ffc531', '#e5195f'] }] },
        options: base,
      }),
    ];
  }
}
