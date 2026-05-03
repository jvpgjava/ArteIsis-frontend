import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ArteIsisApiService, CatalogProductApiRow } from '../../core/arteisis-api.service';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  label?: string;
  colorway?: string;
}

export const CATALOG_IMAGE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800';

export function mapCatalogRowToProduct(r: CatalogProductApiRow): Product {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: r.price,
    image: r.image ?? CATALOG_IMAGE_PLACEHOLDER,
    label: r.label ?? undefined,
  };
}

@Component({
  selector: 'app-product-card',
  imports: [CommonModule],
  template: `
    <div class="group cursor-pointer">
      <div class="relative aspect-square overflow-hidden bg-nike-light-gray mb-4">
        <img
          [src]="product().image"
          [alt]="product().name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerpolicy="no-referrer"
        />
        @if (product().label) {
          <span class="absolute top-4 left-4 bg-white px-3 py-1 text-xs font-bold uppercase tracking-tight">
            {{ product().label }}
          </span>
        }
      </div>
      <div class="flex flex-col gap-1">
        <h3 class="font-display text-xl text-isis-blue transition-colors group-hover:text-isis-rose">{{ product().name }}</h3>
        <p class="text-isis-dark/50 text-xs font-accent uppercase tracking-widest">{{ product().category }}</p>
        <p class="mt-2 font-bold text-isis-dark">{{ product().price | currency: 'BRL' }}</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  product = input.required<Product>();
}

@Component({
  selector: 'app-featured-products',
  imports: [ProductCard, CommonModule],
  template: `
    <section class="py-24 px-4 md:px-12 bg-isis-light">
      <div class="flex justify-between items-end mb-12 max-w-7xl mx-auto">
        <div>
          <h2 class="text-4xl md:text-5xl font-display text-isis-blue uppercase tracking-tight">Portfólio & Artes</h2>
          <p class="text-isis-dark/50 mt-2">Veja alguns dos nossos trabalhos recentes.</p>
        </div>
        <div class="hidden md:flex gap-2">
          <button class="w-12 h-12 rounded-full bg-white border border-isis-blue/10 flex items-center justify-center hover:bg-isis-blue hover:text-white transition-all">
            <span class="material-icons">chevron_left</span>
          </button>
          <button class="w-12 h-12 rounded-full bg-white border border-isis-blue/10 flex items-center justify-center hover:bg-isis-blue hover:text-white transition-all">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      <div class="flex overflow-x-auto gap-8 pb-8 no-scrollbar scroll-smooth snap-x max-w-7xl mx-auto">
        @for (product of products(); track product.id) {
          <app-product-card [product]="product" class="min-w-[320px] md:min-w-[450px] snap-start" />
        } @empty {
          <p class="text-sm text-isis-dark/40 font-accent uppercase tracking-widest">Nenhum produto no catálogo ainda.</p>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProducts {
  private readonly api = inject(ArteIsisApiService);
  private readonly destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);

  constructor() {
    afterNextRender(() => {
      this.api
        .listCatalog({})
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (rows) => this.products.set(rows.slice(0, 12).map(mapCatalogRowToProduct)),
          error: (e) => {
            console.error(e);
            this.products.set([]);
          },
        });
    });
  }
}
