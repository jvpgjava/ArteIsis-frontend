import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CatalogProductApiRow } from './arteisis-api.service';
import { AuthService } from './auth.service';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
  imageUrl: string | null;
}

const CART_KEY = 'arteisis_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);

  readonly items = signal<CartItem[]>([]);
  readonly sidebarOpen = signal(false);

  readonly itemCount = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() =>
    this.items().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.items.set(this.loadFromStorage());
    }

    // Limpa o carrinho sempre que o usuário não for CUSTOMER (logout, admin, não logado)
    effect(() => {
      const user = this.auth.user();
      if (user !== null && user?.role !== 'CUSTOMER') {
        this.clear();
      }
      if (user === null) {
        this.clear();
      }
    });
  }

  addItem(
    product: CatalogProductApiRow,
    quantity: number,
    selectedSize: string | null,
    selectedColor: string | null,
  ): void {
    const current = this.items();
    const existingIndex = current.findIndex(
      (i) =>
        i.productId === product.id &&
        i.selectedSize === selectedSize &&
        i.selectedColor === selectedColor,
    );
    if (existingIndex >= 0) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      this.items.set(updated);
    } else {
      this.items.set([
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          selectedSize,
          selectedColor,
          imageUrl: product.image,
        },
      ]);
    }
    this.persist();
    this.sidebarOpen.set(true);
  }

  removeItem(index: number): void {
    const updated = [...this.items()];
    updated.splice(index, 1);
    this.items.set(updated);
    this.persist();
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(index);
      return;
    }
    const updated = [...this.items()];
    updated[index] = { ...updated[index], quantity };
    this.items.set(updated);
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private persist(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(this.items()));
      } catch {
        /* ignore */
      }
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
