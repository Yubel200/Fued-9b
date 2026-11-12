import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  get<T>(path: string) { return firstValueFrom(this.http.get<T>(`${this.base}/${path}`)); }
  post<T>(path: string, body: unknown = {}) { return firstValueFrom(this.http.post<T>(`${this.base}/${path}`, body)); }
}

export function errMsg(e: any): string {
  if (e?.error?.message) return e.error.message;
  if (e?.status === 0) return 'No se pudo conectar con el servidor. Revisa que Apache esté encendido y la URL de la API.';
  return 'Ocurrió un error. Intenta de nuevo.';
}

/** Agrega el token a cada petición y saca al usuario si la sesión expiró. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const r = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(r).pipe(
    catchError((e) => {
      if (e.status === 401 && !req.url.endsWith('login.php')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigateByUrl('/login');
      }
      return throwError(() => e);
    })
  );
};
