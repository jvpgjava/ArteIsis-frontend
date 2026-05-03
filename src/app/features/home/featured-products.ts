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
import { RouterLink } from '@angular/router';
import { ArteIsisApiService, CatalogProductApiRow, PortfolioItemApiRow } from '../../core/arteisis-api.service';
import { resolvePublicMediaUrl } from '../../core/media-url';

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

export interface PortfolioHighlightItem {
  id: string;
  title: string;
  image: string;
}

export function mapPortfolioRowToHighlight(r: PortfolioItemApiRow): PortfolioHighlightItem {
  const raw = r.imageUrl ?? '';
  return {
    id: r.id,
    title: r.title,
    image: resolvePublicMediaUrl(raw) || raw,
  };
}

export function mapCatalogRowToProduct(r: CatalogProductApiRow): Product {
  const raw = r.image ?? CATALOG_IMAGE_PLACEHOLDER;
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: r.price,
    image: resolvePublicMediaUrl(raw) || raw,
    label: r.label ?? undefined,
  };
}

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  template: `
    <a [routerLink]="['/products', product().id]" class="group cursor-pointer block text-inherit no-underline">
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
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  product = input.required<Product>();
}

@Component({
  selector: 'app-featured-products',
  imports: [CommonModule],
  template: `
    <section class="py-24 bg-isis-light" id="portfolio">
      <div class="px-8 md:px-12 max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-display mb-4 text-isis-blue uppercase tracking-tight">PORTFÓLIO</h2>
          <p class="text-isis-dark/60 max-w-2xl mx-auto">Veja alguns dos nossos trabalhos recentes.</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          @for (item of portfolioItems(); track item.id) {
            <div class="group cursor-pointer">
              <div
                class="relative aspect-[3/4] overflow-hidden rounded-3xl bg-white mb-4 shadow-sm group-hover:shadow-xl transition-all border border-isis-blue/5 group-hover:border-isis-blue/20"
              >
                <img
                  [src]="item.image"
                  [alt]="item.title"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerpolicy="no-referrer"
                />
                <div class="absolute inset-0 bg-isis-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <p
                class="text-center font-bold uppercase tracking-[0.2em] text-[10px] text-isis-blue group-hover:text-isis-rose transition-colors"
              >
                {{ item.title }}
              </p>
            </div>
          } @empty {
            <p class="col-span-full text-center text-sm text-isis-dark/40 font-accent uppercase tracking-widest py-4">
              Nenhum trabalho em destaque no portfólio ainda.
            </p>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProducts {
  private readonly api = inject(ArteIsisApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** Itens ativos de `/api/catalog/portfolio` (painel admin → portfólio na home). */
  portfolioItems = signal<PortfolioHighlightItem[]>([]);

  constructor() {
    afterNextRender(() => {
      this.api
        .listPublicPortfolio()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (rows) => this.portfolioItems.set(rows.map(mapPortfolioRowToHighlight)),
          error: (e) => {
            console.error(e);
            this.portfolioItems.set([]);
          },
        });
    });
  }
}
