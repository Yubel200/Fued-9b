import { Injectable } from '@angular/core';

/** Centraliza la IP del equipo que publica Apache/PHP en la red local. */
@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private readonly storageKey = 'api_server_ip';
  private readonly defaultIp = '192.168.101.19';

  get serverIp(): string {
    return localStorage.getItem(this.storageKey) || this.defaultIp;
  }

  setServerIp(value: string): boolean {
    const ip = value.trim();
    const validIp = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(ip);
    if (!validIp) return false;
    localStorage.setItem(this.storageKey, ip);
    return true;
  }

  get apiBaseUrl(): string {
    // Apache escucha en el puerto 80, por lo que no hace falta indicarlo.
    return `http://${this.serverIp}/php-api`;
  }

  endpoint(fileName: string): string {
    return `${this.apiBaseUrl}/${fileName}`;
  }
}
