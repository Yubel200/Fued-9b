import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
  ActionSheetController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, trash, close, cart, lockClosed } from 'ionicons/icons';
import type { UserPhoto } from '../services/photo.service';
import { PhotoService } from '../services/photo.service';

interface Producto {
  id: number;
  name: string;
  price: number;
  img: string;
  stock: number;
  available: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonIcon
  ],
})
export class Tab2Page implements OnInit {
  // Servicios Inyectados
  public photoService = inject(PhotoService);
  private actionSheetController = inject(ActionSheetController);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Propiedades de la Tienda de Dulces
  products: Producto[] = [];
  cart: CartItem[] = [];
  isCartOpen: boolean = false;
  isAdminUnlocked: boolean = false;
  readonly ADMIN_PASSWORD = "1234";
  private apiUrl = 'http://localhost/php-api/productos.php';

  constructor() {
    addIcons({ camera, trash, close, cart, lockClosed });
  }

  async ngOnInit() {
    // Carga tus fotos guardadas
    await this.photoService.loadSaved();
    // Carga los productos de la base de datos MySQL / PHP API
    this.loadProducts();
  }

  // --- MÉTODOS DE LA TIENDA DE DULCES ---

  loadProducts() {
    this.http.get<Producto[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log('Productos recibidos desde PHP:', data);
        
        // Mapeamos para asegurar que 'available' sea un booleano real y no un valor numérico/cadena
        this.products = data.map(p => ({
          ...p,
          available: Boolean(Number(p.available)) || p.stock > 0
        }));

        // Forzamos la detección de cambios visual en Angular
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al conectar con la API de productos', err);
      }
    });
  }

  // Maneja la falla de carga de imágenes sin bucles infinitos
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.onerror = null;
    target.src = 'https://picsum.photos/200';
  }

  get totalCartCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalCartAmount(): number {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  addToCart(product: Producto) {
    if (!product.available || product.stock <= 0) return;

    const existingItem = this.cart.find(item => item.id === product.id);
    const currentCartQty = existingItem ? existingItem.quantity : 0;

    if (currentCartQty + 1 > product.stock) {
      alert(`Lo sentimos, solo quedan ${product.stock} unidades de ${product.name}.`);
      return;
    }

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
  }

  updateQuantity(productId: number, change: number) {
    const item = this.cart.find(i => i.id === productId);
    const product = this.products.find(p => p.id === productId);

    if (item && product) {
      if (change > 0 && item.quantity + change > product.stock) {
        alert(`Solo disponemos de ${product.stock} unidades.`);
        return;
      }
      item.quantity += change;
      if (item.quantity <= 0) {
        this.cart = this.cart.filter(i => i.id !== productId);
      }
    }
  }

  openCart() { this.isCartOpen = true; }
  closeCart() { this.isCartOpen = false; }

  toggleAdminPanel() {
    if (this.isAdminUnlocked) {
      this.isAdminUnlocked = false;
    } else {
      const pass = prompt("Ingresa la contraseña de administrador:");
      if (pass === this.ADMIN_PASSWORD) {
        this.isAdminUnlocked = true;
      } else if (pass !== null) {
        alert("Contraseña incorrecta.");
      }
    }
  }

  updateStock(product: Producto, event: any) {
    const newStock = parseInt(event.target.value, 10);
    product.stock = isNaN(newStock) ? 0 : Math.max(0, newStock);
    product.available = product.stock > 0;
  }

  updateAvailability(product: Producto, event: any) {
    product.available = event.target.value === 'true';
  }

  sendOrderWhatsApp() {
    if (this.cart.length === 0) {
      alert('Por favor agrega al menos un producto al carrito antes de pedir.');
      return;
    }

    let message = "¡Hola! Quisiera hacer el siguiente pedido:\n\n";
    let total = 0;

    this.cart.forEach(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      message += `• ${item.quantity}x ${item.name} ($${subtotal.toFixed(2)})\n`;

      const product = this.products.find(p => p.id === item.id);
      if (product) {
        product.stock -= item.quantity;
        if (product.stock <= 0) {
          product.stock = 0;
          product.available = false;
        }
      }
    });

    message += `\n*Total a pagar: $${total.toFixed(2)}*\n\n`;
    message += "Quedo a la espera para la confirmación. ¡Muchas gracias!";

    this.cart = [];
    this.closeCart();

    const whatsappURL = `https://wa.me/50763898335?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  }

  // --- MÉTODOS DE LA CÁMARA / GALERÍA DE FOTOS ---

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  public async showActionSheet(photo: UserPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.photoService.deletePhoto(photo, position);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {},
        },
      ],
    });
    await actionSheet.present();
  }
}