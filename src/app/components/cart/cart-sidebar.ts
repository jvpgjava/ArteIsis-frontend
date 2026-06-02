import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../core/cart.service';
import { AuthService } from '../../core/auth.service';
import { resolvePublicMediaUrl } from '../../core/media-url';

@Component({
  selector: 'app-cart-sidebar',
  imports: [CommonModule, CurrencyPipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isCustomer()) {
    <!-- Overlay -->
    @if (cart.sidebarOpen()) {
      <div
        class="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
        (click)="cart.closeSidebar()"
      ></div>
    }

    <!-- Gaveta -->
    <aside
      class="fixed top-0 right-0 z-[201] h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300"
      [class.translate-x-0]="cart.sidebarOpen()"
      [class.translate-x-full]="!cart.sidebarOpen()"
    >
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-isis-blue/10">
        <h2 class="text-sm font-bold uppercase tracking-widest text-isis-dark">
          Carrinho
          @if (cart.itemCount() > 0) {
            <span class="ml-2 text-isis-blue">({{ cart.itemCount() }})</span>
          }
        </h2>
        <button
          type="button"
          (click)="cart.closeSidebar()"
          class="p-1.5 rounded-full hover:bg-isis-light transition-colors"
          aria-label="Fechar carrinho"
        >
          <mat-icon class="text-isis-dark/50">close</mat-icon>
        </button>
      </div>

      <!-- Itens -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        @if (cart.items().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
            <mat-icon class="text-isis-dark/20 !text-5xl">shopping_bag</mat-icon>
            <p class="text-sm text-isis-dark/40">Seu carrinho está vazio.</p>
            <button
              type="button"
              (click)="cart.closeSidebar()"
              class="text-xs font-bold uppercase tracking-widest text-isis-blue hover:underline"
            >
              Continuar comprando
            </button>
          </div>
        }

        @for (item of cart.items(); track $index; let i = $index) {
          <div class="flex gap-4 py-4 border-b border-isis-blue/8 last:border-0">
            <!-- Imagem -->
            <div class="w-20 h-20 shrink-0 bg-[#f5f3f0] border border-isis-blue/10 overflow-hidden">
              @if (resolveImage(item.imageUrl); as img) {
                <img [src]="img" [alt]="item.name" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full flex items-center justify-center">
                  <mat-icon class="text-isis-dark/20">image</mat-icon>
                </div>
              }
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold uppercase tracking-wide text-isis-dark truncate">{{ item.name }}</p>

              <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                @if (item.selectedSize) {
                  <span class="text-[10px] text-isis-dark/50">Tam: {{ item.selectedSize }}</span>
                }
                @if (item.selectedColor) {
                  <span class="inline-flex items-center gap-1 text-[10px] text-isis-dark/50">
                    Cor:
                    <span
                      class="inline-block w-3 h-3 rounded-sm border border-isis-dark/20"
                      [style.background]="item.selectedColor"
                    ></span>
                  </span>
                }
              </div>

              <p class="mt-1.5 text-xs font-bold text-isis-dark">
                {{ item.price | currency: 'BRL' }}
              </p>

              <!-- Controles de quantidade -->
              <div class="mt-2 flex items-center gap-3">
                <div class="flex items-center border border-isis-blue/20">
                  <button
                    type="button"
                    class="w-7 h-7 flex items-center justify-center text-isis-dark/60 hover:bg-isis-light transition-colors text-sm"
                    (click)="cart.updateQuantity(i, item.quantity - 1)"
                    aria-label="Diminuir"
                  >−</button>
                  <span class="w-8 text-center text-xs font-bold">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="w-7 h-7 flex items-center justify-center text-isis-dark/60 hover:bg-isis-light transition-colors text-sm"
                    (click)="cart.updateQuantity(i, item.quantity + 1)"
                    aria-label="Aumentar"
                  >+</button>
                </div>
                <button
                  type="button"
                  (click)="cart.removeItem(i)"
                  class="text-[10px] text-isis-dark/30 hover:text-isis-rose transition-colors uppercase tracking-wide"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Rodapé -->
      @if (cart.items().length > 0) {
        <div class="px-6 py-5 border-t border-isis-blue/10 space-y-4 bg-white">
          <div class="flex justify-between items-center">
            <span class="text-xs uppercase tracking-widest text-isis-dark/50">Total</span>
            <span class="text-lg font-bold text-isis-dark">{{ cart.total() | currency: 'BRL' }}</span>
          </div>
          <button
            type="button"
            (click)="goToCheckout()"
            class="w-full bg-isis-blue py-4 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-isis-blue/25 hover:bg-isis-blue/90 transition-colors"
          >
            Finalizar pedido
          </button>
          <button
            type="button"
            (click)="cart.closeSidebar()"
            class="w-full py-2 text-xs font-bold uppercase tracking-widest text-isis-dark/40 hover:text-isis-dark transition-colors"
          >
            Continuar comprando
          </button>
        </div>
      }
    </aside>
    } <!-- fim @if (isCustomer()) -->
  `,
})
export class CartSidebar {
  readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isCustomer = computed(() => this.auth.user()?.role === 'CUSTOMER');

  resolveImage(url: string | null): string | null {
    if (!url) return null;
    return resolvePublicMediaUrl(url) || url;
  }

  goToCheckout(): void {
    this.cart.closeSidebar();
    void this.router.navigateByUrl('/checkout');
  }
}
