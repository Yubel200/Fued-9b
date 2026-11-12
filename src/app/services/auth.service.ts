import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ApiService } from './api.service';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  user = signal<User | null>(this.read());
  isAdmin = computed(() => this.user()?.role === 'admin');

  get token() { return localStorage.getItem('token'); }

  private read(): User | null {
    try { return JSON.parse(localStorage.getItem('user') ?? 'null'); } catch { return null; }
  }

  async login(username: string, password: string): Promise<User> {
    const r = await this.api.post<{ token: string; user: User }>('login.php', { username, password });
    localStorage.setItem('token', r.token);
    localStorage.setItem('user', JSON.stringify(r.user));
    this.user.set(r.user);
    return r.user;
  }

  register(d: { username: string; password: string; name: string; email: string }) {
    return this.api.post('register.php', d);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}

export const authGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.token && a.user() ? true : inject(Router).createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  if (a.token && a.isAdmin()) return true;
  return inject(Router).createUrlTree([a.token ? '/tienda' : '/login']);
};
