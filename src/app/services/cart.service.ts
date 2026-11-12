import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Producto } from './models';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);
  count = computed(() => this.items().reduce((s, i) => s + i.cantidad, 0));
  total = computed(() => Math.round(this.items().reduce((s, i) => s + i.price * i.cantidad, 0) * 100) / 100);

  qty(id: number) { return this.items().find((i) => i.id === id)?.cantidad ?? 0; }

  add(p: Producto) {
    this.items.update((l) => {
      if (l.some((i) => i.id === p.id)) {
        return l.map((i) => (i.id === p.id ? { ...i, stock: p.stock, cantidad: Math.min(i.cantidad + 1, p.stock) } : i));
      }
      return [...l, { id: p.id, name: p.name, price: p.price, img: p.img, stock: p.stock, cantidad: 1 }];
    });
  }
  dec(id: number) {
    this.items.update((l) => l.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0));
  }
  clear() { this.items.set([]); }
}
