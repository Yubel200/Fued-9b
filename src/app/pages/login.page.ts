import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { errMsg } from '../services/api.service';

@Component({
  selector: 'app-login',
  imports: [IonContent, FormsModule],
  template: `
    <ion-content>
      <div class="page login">
        <h1>🍭 Dulcería</h1>
        <p class="sub">{{ modo() === 'login' ? 'Entra para hacer tu pedido' : 'Crea tu cuenta' }}</p>

        @if (modo() === 'registro') {
          <label>Nombre<input [(ngModel)]="name" autocomplete="name" /></label>
          <label>Correo<input [(ngModel)]="email" type="email" autocomplete="email" /></label>
        }
        <label>Usuario<input [(ngModel)]="username" autocomplete="username" /></label>
        <label>Contraseña<input [(ngModel)]="password" type="password" autocomplete="current-password" (keyup.enter)="enviar()" /></label>

        @if (error()) { <p class="err">{{ error() }}</p> }
        @if (info()) { <p class="okmsg">{{ info() }}</p> }

        <button class="btn big" [disabled]="busy()" (click)="enviar()">
          {{ busy() ? 'Un momento…' : modo() === 'login' ? 'Entrar' : 'Crear cuenta' }}
        </button>
        <button class="link" type="button" (click)="cambiar()">
          {{ modo() === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta' }}
        </button>
      </div>
    </ion-content>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  modo = signal<'login' | 'registro'>('login');
  error = signal('');
  info = signal('');
  busy = signal(false);
  username = ''; password = ''; name = ''; email = '';

  cambiar() { this.modo.update((m) => (m === 'login' ? 'registro' : 'login')); this.error.set(''); this.info.set(''); }

  async enviar() {
    this.error.set(''); this.info.set('');
    if (!this.username.trim() || !this.password) { this.error.set('Ingresa usuario y contraseña.'); return; }
    this.busy.set(true);
    try {
      if (this.modo() === 'registro') {
        if (!this.name.trim() || !this.email.trim()) { this.error.set('Completa nombre y correo.'); return; }
        await this.auth.register({ username: this.username.trim(), password: this.password, name: this.name.trim(), email: this.email.trim() });
        this.modo.set('login');
        this.info.set('Cuenta creada. Ya puedes entrar.');
      } else {
        const u = await this.auth.login(this.username.trim(), this.password);
        this.router.navigateByUrl(u.role === 'admin' ? '/admin' : '/tienda');
      }
    } catch (e) {
      this.error.set(errMsg(e));
    } finally {
      this.busy.set(false);
    }
  }
}
