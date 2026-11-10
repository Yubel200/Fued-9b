import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, AlertController } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiConfigService } from '../services/api-config.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle,   
    IonContent, 
    ExploreContainerComponent, 
    FormsModule, 
    CommonModule
  ],
})
export class Tab1Page {
  private router = inject(Router);
  private http = inject(HttpClient);
  private alertController = inject(AlertController);

  // Campos Login
  username = '';
  password = '';
  serverIp = '';
  private apiConfig = inject(ApiConfigService);

  // Campos Registro
  regUsername = '';
  regName = '';
  regEmail = '';
  regPassword = '';

  // Control de foco
  isUserFocused = false;
  isPasswordFocused = false;
  isNameFocused = false;
  isEmailFocused = false;

  // Estado del modo (Login vs Registro)
  isRegisterMode = false;

  // Clases y animaciones
  isTest = false;
  isTestTwo = false;
  isAuthenticated = false;

  isAuthentShowing = false;
  isAuthentVisible = false;
  authentRight = 90;
  authentOpacity = 0;

  private get loginUrl() { return this.apiConfig.endpoint('login.php'); }
  private get registerUrl() { return this.apiConfig.endpoint('register.php'); }

  constructor() { this.serverIp = this.apiConfig.serverIp; }

  saveServerIp(): boolean {
    const saved = this.apiConfig.setServerIp(this.serverIp);
    if (!saved) this.showAlert('IP no válida', 'Escribe una IPv4 válida, por ejemplo 192.168.101.19.');
    else this.showAlert('Conexión configurada', `Las APIs se consultarán en http://${this.serverIp}/php-api.`);
    return saved;
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
  }

  
onLogin() {
  if (!this.apiConfig.setServerIp(this.serverIp)) {
    this.showAlert('IP no válida', 'Escribe una IPv4 válida.');
    return;
  }

  if (!this.username.trim() || !this.password) {
    this.showAlert('Campos requeridos', 'Ingresa usuario y contraseña.');
    return;
  }

  this.startAnimation();

  const credentials = {
    username: this.username.trim(),
    password: this.password
  };

  this.http.post<any>(this.loginUrl, credentials).subscribe({
    next: res => {
      this.resetAnimation();

      if (res?.success && res.token && res.user) {
        localStorage.setItem('tienda_token', res.token);
        localStorage.setItem('tienda_user', JSON.stringify(res.user));

        this.isAuthenticated = true;
        this.router.navigate(['/tabs/tab2']);
      } else {
        this.showAlert('Error de acceso', res?.message || 'No se pudo iniciar sesión.');
      }
    },
    error: err => {
      this.resetAnimation();
      this.showAlert(
        'Error de acceso',
        err.error?.message || 'No se pudo conectar con el servidor.'
      );
    }
  });
}


  onRegister() {
    if (!this.apiConfig.setServerIp(this.serverIp)) {
      this.showAlert('IP no válida', 'Escribe una IPv4 válida, por ejemplo 192.168.101.19.');
      return;
    }
    if (!this.regUsername.trim() || !this.regPassword.trim()) {
      this.showAlert('Campos requeridos', 'Usuario y contraseña son obligatorios.');
      return;
    }

    this.startAnimation();

    const payload = {
      username: this.regUsername.trim(),
      password: this.regPassword,
      name: this.regName.trim() || this.regUsername.trim(),
      email: this.regEmail.trim()
    };

    // 1. Enviar registro a PHP
    this.http.post<any>(this.registerUrl, payload).subscribe({
      next: (res) => {
        if (res.success) {
          // 2. Si el registro es exitoso, iniciar sesión automáticamente
          this.username = this.regUsername;
          this.password = this.regPassword;
          this.loginAfterRegister();
        }
      },
      error: (err) => {
        this.resetAnimation();
        const res = err.error;
        if (err.status === 409) {
          this.showAlert('Usuario ocupado', 'El nombre de usuario ya está registrado.');
        } else {
          this.showAlert('Error de registro', res?.message || 'No se pudo crear el usuario.');
        }
      }
    });
  }

  
private loginAfterRegister() {
  const credentials = {
    username: this.username.trim(),
    password: this.password
  };

  this.http.post<any>(this.loginUrl, credentials).subscribe({
    next: res => {
      this.resetAnimation();

      if (res?.success && res?.token && res?.user) {

        // Guardar el token de autenticación
        localStorage.setItem('tienda_token', res.token);

        // Guardar los datos del usuario
        localStorage.setItem('tienda_user', JSON.stringify(res.user));

        // Indicar que el usuario inició sesión
        this.isAuthenticated = true;

        // Entrar a la tienda
        this.router.navigate(['/tabs/tab2']);

      } else {
        this.showAlert(
          'Registro exitoso',
          'Tu cuenta fue creada. Inicia sesión manualmente.'
        );

        this.isRegisterMode = false;
      }
    },

    error: err => {
      this.resetAnimation();

      this.showAlert(
        'Registro exitoso',
        err.error?.message ||
        'Tu cuenta fue creada, pero debes iniciar sesión manualmente.'
      );

      this.isRegisterMode = false;
    }
  });
}


  private startAnimation() {
    this.isTest = true;
    setTimeout(() => { this.isTestTwo = true; }, 300);
    setTimeout(() => {
      this.isAuthentShowing = true;
      this.authentRight = -320;
      this.authentOpacity = 1;
      this.isAuthentVisible = true;
    }, 500);
  }

  private resetAnimation() {
    this.authentRight = 90;
    this.authentOpacity = 0;
    this.isAuthentVisible = false;
    this.isAuthentShowing = false;
    this.isTestTwo = false;
    this.isTest = false;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}