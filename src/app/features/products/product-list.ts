import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest, debounceTime, switchMap } from 'rxjs';
import { ProductCard, Product, mapCatalogRowToProduct } from '../home/featured-products';
import { ArteIsisApiService } from '../../core/arteisis-api.service';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2X'] as const;
const CATEGORY_OPTIONS = ['Camisetas', 'Moletons', 'Uniformes', 'Infantil'] as const;

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink, MatIconModule, ProductCard, FormsModule],
  template: `
    <div class="bg-isis-light min-h-screen">
      <div class="px-8 md:px-12 py-6 border-b border-isis-blue/5 bg-white overflow-x-auto whitespace-nowrap">
        <div class="flex items-center gap-2 text-xs font-accent uppercase tracking-widest text-isis-dark/40">
          <a routerLink="/" class="hover:text-isis-blue">Início</a>
          <mat-icon class="scale-50">chevron_right</mat-icon>
          <span class="text-isis-rose font-bold">Produtos</span>
        </div>
      </div>

      <div class="max-w-[1920px] mx-auto flex flex-col lg:flex-row">
        <aside class="w-full lg:w-72 p-8 md:p-12 border-r border-isis-blue/5 bg-white lg:min-h-[calc(100vh-144px)]">
          <h2 class="text-2xl font-display text-isis-blue mb-10">Filtros</h2>

          <div class="space-y-10">
            <div class="space-y-4">
              <h3 class="text-sm font-bold uppercase tracking-widest text-isis-dark">Tamanho</h3>
              <div class="grid grid-cols-3 gap-2">
                @for (size of sizeOptions; track size) {
                  <button
                    type="button"
                    (click)="toggleSize(size)"
                    [class.bg-isis-blue]="selectedSizes().includes(size)"
                    [class.text-white]="selectedSizes().includes(size)"
                    [class.border-isis-blue]="selectedSizes().includes(size)"
                    class="py-3 border border-isis-blue/10 rounded-lg text-sm hover:border-isis-blue hover:bg-isis-blue/5 transition-all"
                  >
                    {{ size }}
                  </button>
                }
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-sm font-bold uppercase tracking-widest text-isis-dark">Disponibilidade</h3>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  (click)="availabilityFilter.set('')"
                  [class.bg-isis-blue]="availabilityFilter() === ''"
                  [class.text-white]="availabilityFilter() === ''"
                  class="py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm hover:bg-isis-blue/5 transition-all"
                >
                  Todas
                </button>
                <button
                  type="button"
                  (click)="availabilityFilter.set('Disponível')"
                  [class.bg-isis-blue]="availabilityFilter() === 'Disponível'"
                  [class.text-white]="availabilityFilter() === 'Disponível'"
                  class="py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm hover:bg-isis-blue/5 transition-all"
                >
                  Disponível
                </button>
                <button
                  type="button"
                  (click)="availabilityFilter.set('Sob encomenda')"
                  [class.bg-isis-blue]="availabilityFilter() === 'Sob encomenda'"
                  [class.text-white]="availabilityFilter() === 'Sob encomenda'"
                  class="py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm hover:bg-isis-blue/5 transition-all"
                >
                  Sob encomenda
                </button>
              </div>
            </div>

            <div class="space-y-4 border-t border-isis-blue/5 pt-8">
              <h3 class="text-sm font-bold uppercase tracking-widest text-isis-dark">Categorias</h3>
              <div class="space-y-2">
                @for (cat of categoryOptions; track cat) {
                  <button
                    type="button"
                    (click)="toggleCategory(cat)"
                    [class.bg-isis-blue]="selectedCategories().includes(cat)"
                    [class.text-white]="selectedCategories().includes(cat)"
                    class="w-full py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm hover:bg-isis-blue/5 transition-all"
                  >
                    {{ cat }}
                  </button>
                }
              </div>
            </div>

            <div class="space-y-4 border-t border-isis-blue/5 pt-8">
              <h3 class="text-sm font-bold uppercase tracking-widest text-isis-dark">Cores</h3>
              <div class="flex flex-wrap gap-3">
                @for (color of colors; track color) {
                  <button
                    type="button"
                    [style.background]="color"
                    class="w-8 h-8 rounded-full border border-isis-blue/10 shadow-sm hover:scale-110 transition-transform"
                    aria-label="Filtro de cor (visual apenas)"
                  ></button>
                }
              </div>
            </div>
          </div>
        </aside>

        <div class="flex-1 p-8 md:p-12">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <h1 class="text-4xl md:text-5xl font-display text-isis-blue">PRODUTOS</h1>

            <div class="flex flex-wrap gap-4 w-full md:w-auto">
              <div class="relative flex-1 md:w-80 group">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  placeholder="Buscar produtos..."
                  class="w-full bg-white border border-isis-blue/10 p-4 pl-12 rounded-2xl focus:outline-none focus:border-isis-blue/40 transition-colors shadow-sm"
                />
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-isis-blue/40 group-focus-within:text-isis-blue transition-colors"
                  >search</mat-icon
                >
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            } @empty {
              <p class="col-span-full text-center text-sm text-isis-dark/40 py-16 font-accent uppercase tracking-widest">
                Nenhum produto encontrado com estes filtros.
              </p>
            }
          </div>
        </div>
      </div>
    </div>
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
export class ProductList {
  private readonly api = inject(ArteIsisApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sizeOptions = SIZE_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;
  colors = ['#000000', '#FFFFFF', '#666666', '#FF0000', '#3b6b8a', '#db7077', '#0000FF', '#00FF00'];

  searchQuery = model('');
  availabilityFilter = model('');
  selectedCategories = signal<string[]>([]);
  selectedSizes = signal<string[]>([]);

  products = signal<Product[]>([]);

  constructor() {
    afterNextRender(() => {
      combineLatest([
        toObservable(this.searchQuery).pipe(debounceTime(300)),
        toObservable(this.selectedCategories),
        toObservable(this.selectedSizes),
        toObservable(this.availabilityFilter),
      ])
        .pipe(
          switchMap(([q, cats, sizes, av]) =>
            this.api.listCatalog({
              q: q.trim() || undefined,
              categories: cats.length ? [...cats] : undefined,
              sizes: sizes.length ? [...sizes] : undefined,
              availability: av.trim() || undefined,
            }),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (rows) => this.products.set(rows.map(mapCatalogRowToProduct)),
          error: (e) => {
            console.error(e);
            this.products.set([]);
          },
        });
    });
  }

  toggleSize(size: string) {
    const cur = this.selectedSizes();
    this.selectedSizes.set(cur.includes(size) ? cur.filter((s) => s !== size) : [...cur, size]);
  }

  toggleCategory(cat: string) {
    const cur = this.selectedCategories();
    this.selectedCategories.set(cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat]);
  }
}
