import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../core/cart.service';
import { ArteIsisApiService } from '../../core/arteisis-api.service';
import { resolvePublicMediaUrl } from '../../core/media-url';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#f5f3f0] text-isis-dark">
      <div class="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-14">

        <a
          routerLink="/products"
          class="inline-flex items-center gap-2 text-sm font-accent uppercase tracking-widest text-isis-dark/50 hover:text-isis-blue mb-8"
        >
          ← Continuar comprando
        </a>

        <h1 class="text-2xl md:text-3xl font-bold uppercase tracking-tight text-isis-dark mb-10">
          Finalizar Pedido
        </h1>

        @if (success()) {
          <!-- Confirmação -->
          <div class="max-w-lg mx-auto text-center py-20 flex flex-col items-center gap-6">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-xl font-bold uppercase tracking-wide text-isis-dark">Pedido recebido!</h2>
            <p class="text-sm text-isis-dark/60 leading-relaxed">
              Seu pedido foi enviado com sucesso.<br />
              Entraremos em contato em breve para confirmar os detalhes.
            </p>
            <a
              routerLink="/products"
              class="mt-2 inline-block bg-isis-blue px-8 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-isis-blue/90 transition-colors"
            >
              Ver mais produtos
            </a>
          </div>
        } @else if (cart.items().length === 0) {
          <!-- Carrinho vazio -->
          <div class="text-center py-20 flex flex-col items-center gap-4">
            <mat-icon class="text-isis-dark/20 !text-5xl">shopping_bag</mat-icon>
            <p class="text-sm text-isis-dark/40">Seu carrinho está vazio.</p>
            <a
              routerLink="/products"
              class="text-xs font-bold uppercase tracking-widest text-isis-blue hover:underline"
            >
              Ver produtos
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

            <!-- Formulário do cliente -->
            <div class="bg-white border border-isis-blue/10 p-8 shadow-sm">
              <h2 class="text-xs font-bold uppercase tracking-widest text-isis-dark/50 mb-6">
                Seus dados para contato
              </h2>

              <div class="space-y-5">
                <div>
                  <label class="block text-xs uppercase tracking-widest text-isis-dark/50 mb-2">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="customerName"
                    placeholder="Seu nome"
                    class="w-full border border-isis-blue/20 bg-[#f5f3f0] px-4 py-3 text-sm text-isis-dark placeholder:text-isis-dark/30 focus:outline-none focus:border-isis-blue transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-xs uppercase tracking-widest text-isis-dark/50 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="customerEmail"
                    (blur)="emailTouched.set(true)"
                    placeholder="seu@email.com"
                    class="w-full border bg-[#f5f3f0] px-4 py-3 text-sm text-isis-dark placeholder:text-isis-dark/30 focus:outline-none transition-colors"
                    [class.border-red-400]="emailTouched() && !emailValid()"
                    [class.border-isis-blue/20]="!emailTouched() || emailValid()"
                    [class.focus:border-red-400]="emailTouched() && !emailValid()"
                    [class.focus:border-isis-blue]="!emailTouched() || emailValid()"
                  />
                  @if (emailTouched() && !emailValid()) {
                    <p class="mt-1 text-[10px] text-red-500">Informe um e-mail válido.</p>
                  }
                </div>

                <div>
                  <label class="block text-xs uppercase tracking-widest text-isis-dark/50 mb-2">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    [value]="customerPhone"
                    (input)="formatPhone($event)"
                    placeholder="(00) 00000-0000"
                    maxlength="15"
                    class="w-full border border-isis-blue/20 bg-[#f5f3f0] px-4 py-3 text-sm text-isis-dark placeholder:text-isis-dark/30 focus:outline-none focus:border-isis-blue transition-colors"
                  />
                </div>
              </div>

              @if (errorMsg()) {
                <p class="mt-4 text-xs text-red-500">{{ errorMsg() }}</p>
              }

              <button
                type="button"
                (click)="submit()"
                [disabled]="submitting()"
                class="mt-8 w-full bg-isis-blue py-4 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-isis-blue/25 hover:bg-isis-blue/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {{ submitting() ? 'Enviando...' : 'Confirmar pedido' }}
              </button>

              <p class="mt-4 text-[10px] text-isis-dark/30 text-center leading-relaxed">
                Ao confirmar, seu pedido será enviado para nossa equipe.<br />
                Entraremos em contato para confirmar e combinar a entrega.
              </p>
            </div>

            <!-- Resumo do pedido -->
            <div class="bg-white border border-isis-blue/10 p-6 shadow-sm">
              <h2 class="text-xs font-bold uppercase tracking-widest text-isis-dark/50 mb-5">
                Resumo do pedido
              </h2>

              <div class="space-y-4 divide-y divide-isis-blue/8">
                @for (item of cart.items(); track $index) {
                  <div class="flex gap-3 pt-4 first:pt-0">
                    <!-- Imagem pequena -->
                    <div class="w-14 h-14 shrink-0 bg-[#f5f3f0] border border-isis-blue/10 overflow-hidden">
                      @if (resolveImage(item.imageUrl); as img) {
                        <img [src]="img" [alt]="item.name" class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <mat-icon class="text-isis-dark/20 !text-xl">image</mat-icon>
                        </div>
                      }
                    </div>

                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold uppercase tracking-wide text-isis-dark truncate">{{ item.name }}</p>
                      <div class="mt-0.5 flex flex-wrap gap-x-3">
                        @if (item.selectedSize) {
                          <span class="text-[10px] text-isis-dark/50">Tam: {{ item.selectedSize }}</span>
                        }
                        @if (item.selectedColor) {
                          <span class="inline-flex items-center gap-1 text-[10px] text-isis-dark/50">
                            Cor:
                            <span class="inline-block w-2.5 h-2.5 rounded-sm border border-isis-dark/20" [style.background]="item.selectedColor"></span>
                          </span>
                        }
                      </div>
                      <div class="mt-1 flex justify-between items-end">
                        <span class="text-[10px] text-isis-dark/40">{{ item.quantity }}x {{ item.price | currency: 'BRL' }}</span>
                        <span class="text-xs font-bold text-isis-dark">{{ item.price * item.quantity | currency: 'BRL' }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="mt-6 pt-5 border-t border-isis-blue/10 flex justify-between items-center">
                <span class="text-xs uppercase tracking-widest text-isis-dark/50">Total</span>
                <span class="text-xl font-bold text-isis-dark">{{ cart.total() | currency: 'BRL' }}</span>
              </div>
            </div>

          </div>
        }
      </div>
    </div>
  `,
})
export class Checkout {
  readonly cart = inject(CartService);
  private readonly api = inject(ArteIsisApiService);
  private readonly router = inject(Router);

  customerName = '';
  customerEmail = '';
  customerPhone = '';

  submitting = signal(false);
  success = signal(false);
  errorMsg = signal('');
  emailTouched = signal(false);

  readonly emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerEmail));

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 11);
    let formatted = '';
    if (digits.length > 0) formatted = '(' + digits.slice(0, 2);
    if (digits.length > 2) formatted += ') ' + digits.slice(2, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7, 11);
    input.value = formatted;
    this.customerPhone = formatted;
  }

  resolveImage(url: string | null): string | null {
    if (!url) return null;
    return resolvePublicMediaUrl(url) || url;
  }

  submit(): void {
    this.errorMsg.set('');

    if (!this.customerName.trim()) {
      this.errorMsg.set('Por favor, informe seu nome.');
      return;
    }
    if (!this.customerEmail.trim() || !this.customerEmail.includes('@')) {
      this.errorMsg.set('Por favor, informe um e-mail válido.');
      return;
    }
    if (!this.customerPhone.trim()) {
      this.errorMsg.set('Por favor, informe seu telefone.');
      return;
    }

    this.submitting.set(true);

    const lines = this.cart.items().map((item) => {
      const parts: string[] = [item.name];
      if (item.selectedSize) parts.push(`Tam: ${item.selectedSize}`);
      return {
        productId: item.productId || null,
        description: parts.join(' — '),
        quantity: item.quantity,
        unitPrice: item.price,
        selectedColor: item.selectedColor || null,
      };
    });

    this.api
      .submitPublicOrder({
        customerName: this.customerName.trim(),
        customerEmail: this.customerEmail.trim(),
        customerPhone: this.customerPhone.trim(),
        lines,
      })
      .subscribe({
        next: () => {
          this.cart.clear();
          this.submitting.set(false);
          this.success.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.errorMsg.set('Ocorreu um erro ao enviar o pedido. Tente novamente.');
        },
      });
  }
}
