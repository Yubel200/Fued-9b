import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton,
  AlertController 
} from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonButton, 
    CommonModule, 
    FormsModule
  ]
})
export class LoginPage {
  username = '';
  password = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private alertController = inject(AlertController);

  private loginUrl = 'http://localhost/php-api/login.php';
  private registerUrl = 'http://localhost/php-api/register.php';

  async onLogin() {
    if (!this.username.trim() || !this.password.trim()) {
      this.showAlert('Campos requeridos', 'Por favor ingresa usuario y contraseña.');
      return;
    }

    const payload = {
      username: this.username.trim(),
      password: this.password
    };

    this.http.post<any>(this.loginUrl, payload).subscribe({
      next: (res) => {
        if (res.success) {
          // Solo redirige si PHP responde success: true
          this.router.navigate(['/tabs/tab2']);
        }
      },
      error: (err) => {
        const res = err.error;

        if (err.status === 401 && res?.user_exists) {
          this.showAlert('Error de acceso', 'Contraseña incorrecta.');
        } else if (err.status === 404 && res?.user_exists === false) {
          this.promptRegister();
        } else {
          this.showAlert('Error', res?.message || 'No se pudo conectar con el servidor.');
        }
      }
    });
  }

  async promptRegister() {
    const alert = await this.alertController.create({
      header: 'Usuario no registrado',
      message: `El usuario "${this.username}" no existe. ¿Deseas crear una cuenta nueva con estas credenciales?`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre completo (Opcional)'
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Correo electrónico (Opcional)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Registrar',
          handler: (data) => {
            this.onRegister(data.name, data.email);
          }
        }
      ]
    });
    await alert.present();
  }

  onRegister(name: string, email: string) {
    const payload = {
      username: this.username.trim(),
      password: this.password,
      name: name ? name.trim() : '',
      email: email ? email.trim() : ''
    };

    this.http.post<any>(this.registerUrl, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.showAlert('¡Registro exitoso!', 'Usuario creado correctamente. Presiona "Ingresar" para iniciar sesión.');
        }
      },
      error: (err) => {
        const res = err.error;
        this.showAlert('Error al registrar', res?.message || 'Error al conectar con el servidor.');
      }
    });
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