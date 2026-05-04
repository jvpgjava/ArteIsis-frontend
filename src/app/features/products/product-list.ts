import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest, debounceTime, merge, of, skip, switchMap } from 'rxjs';
import { ProductCard, Product, mapCatalogRowToProduct } from '../home/featured-products';
import { ArteIsisApiService } from '../../core/arteisis-api.service';

/** Alinhado às categorias do painel admin (filtro = valor gravado em `product.category`). */
const CATEGORY_OPTIONS = ['Camisetas', 'Moletons', 'Escolar', 'Uniformes', 'Estampas', 'Infantil', 'Acessórios'] as const;

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
              <h3 class="text-sm font-bold uppercase tracking-widest text-isis-dark">Disponibilidade</h3>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  (click)="availabilityFilter.set('')"
                  [class.border-isis-blue]="availabilityFilter() === ''"
                  [class.bg-isis-blue/10]="availabilityFilter() === ''"
                  [class.text-isis-blue]="availabilityFilter() === ''"
                  [class.font-semibold]="availabilityFilter() === ''"
                  class="py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm text-isis-dark transition-all hover:bg-isis-blue/5 hover:text-isis-blue"
                >
                  Todas
                </button>
                <button
                  type="button"
                  (click)="availabilityFilter.set('Disponível')"
                  [class.border-isis-blue]="availabilityFilter() === 'Disponível'"
                  [class.bg-isis-blue/10]="availabilityFilter() === 'Disponível'"
                  [class.text-isis-blue]="availabilityFilter() === 'Disponível'"
                  [class.font-semibold]="availabilityFilter() === 'Disponível'"
                  class="py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm text-isis-dark transition-all hover:bg-isis-blue/5 hover:text-isis-blue"
                >
                  Disponível
                </button>
                <button
                  type="button"
                  (click)="availabilityFilter.set('Sob encomenda')"
                  [class.border-isis-blue]="availabilityFilter() === 'Sob encomenda'"
                  [class.bg-isis-blue/10]="availabilityFilter() === 'Sob encomenda'"
                  [class.text-isis-blue]="availabilityFilter() === 'Sob encomenda'"
                  [class.font-semibold]="availabilityFilter() === 'Sob encomenda'"
                  class="py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm text-isis-dark transition-all hover:bg-isis-blue/5 hover:text-isis-blue"
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
                    [class.border-isis-blue]="selectedCategories().includes(cat)"
                    [class.bg-isis-blue/10]="selectedCategories().includes(cat)"
                    [class.text-isis-blue]="selectedCategories().includes(cat)"
                    [class.font-semibold]="selectedCategories().includes(cat)"
                    class="w-full py-2 px-3 rounded-lg border border-isis-blue/10 text-left text-sm text-isis-dark transition-all hover:bg-isis-blue/5 hover:text-isis-blue"
                  >
                    {{ cat }}
                  </button>
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
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
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
  private readonly route = inject(ActivatedRoute);

  readonly categoryOptions = CATEGORY_OPTIONS;

  /** `signal` + `ngModelChange`: `[(ngModel)]` com `model()` não atualizava o valor ao digitar. */
  searchQuery = signal('');
  availabilityFilter = model('');
  selectedCategories = signal<string[]>([]);

  products = signal<Product[]>([]);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const c = params.get('categoria')?.trim();
      this.selectedCategories.set(c ? [c] : []);
    });

    const search$ = merge(
      of(this.searchQuery()),
      toObservable(this.searchQuery).pipe(skip(1), debounceTime(300)),
    );

    combineLatest([search$, toObservable(this.selectedCategories), toObservable(this.availabilityFilter)])
      .pipe(
        switchMap(([q, cats, av]) =>
          this.api.listCatalog({
            q: q.trim() || undefined,
            categories: cats.length ? [...cats] : undefined,
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
  }

  toggleCategory(cat: string) {
    const cur = this.selectedCategories();
    this.selectedCategories.set(cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat]);
  }
}
