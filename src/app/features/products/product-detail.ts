import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, map, of, switchMap } from 'rxjs';
import { ArteIsisApiService, CatalogProductApiRow, ProductColorVariantApiRow } from '../../core/arteisis-api.service';
import { resolvePublicMediaUrl } from '../../core/media-url';
import { CATALOG_IMAGE_PLACEHOLDER } from '../home/featured-products';
import { CartService } from '../../core/cart.service';
import { AuthService } from '../../core/auth.service';

const GARMENT_CATEGORIES = new Set(['Camisetas', 'Moletons', 'Uniformes', 'Infantil']);
const BR_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG'] as const;

const SIZE_ORDER = [
  ...BR_SIZES,
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '2X',
  '3XL',
  'P',
  'G',
  'GG',
  'XG',
  'XGG',
];

const THUMB_FOCUS = ['50% 50%', '30% 20%', '70% 35%', '45% 70%', '60% 55%'] as const;

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b) || a.localeCompare(b),
  );
}

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#f5f3f0] text-isis-dark">
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14">
        <a
          routerLink="/products"
          class="inline-flex items-center gap-2 text-sm font-accent uppercase tracking-widest text-isis-dark/50 hover:text-isis-blue mb-8"
        >
          ← Voltar aos produtos
        </a>

        @if (error()) {
          <p class="text-center py-24 text-isis-dark/50">{{ error() }}</p>
        } @else if (row(); as p) {
          <div class="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
            <div class="w-full lg:flex-1 lg:max-w-[52%] order-1">
              <div class="aspect-square bg-white border border-isis-blue/10 overflow-hidden">
                <img
                  [src]="mainImage()"
                  [alt]="p.name"
                  class="w-full h-full object-cover transition-[object-position] duration-300"
                  [style.object-position]="thumbFocus[activeThumb()]"
                  referrerpolicy="no-referrer"
                />
              </div>
            </div>

            <div
              class="flex lg:flex-col gap-2 order-3 lg:order-2 w-full lg:w-24 shrink-0 justify-center lg:justify-start"
            >
              @for (i of thumbIndices; track i) {
                <button
                  type="button"
                  (click)="activeThumb.set(i)"
                  class="w-16 h-16 md:w-20 md:h-20 shrink-0 border overflow-hidden bg-white transition-all"
                  [class.border-isis-dark]="activeThumb() === i"
                  [class.border-isis-blue/15]="activeThumb() !== i"
                  [attr.aria-label]="'Vista ' + (i + 1)"
                >
                  <img
                    [src]="mainImage()"
                    alt=""
                    class="w-full h-full object-cover"
                    [style.object-position]="thumbFocus[i]"
                    referrerpolicy="no-referrer"
                  />
                </button>
              }
            </div>

            <div class="w-full lg:max-w-md bg-white border border-isis-blue/10 p-8 md:p-10 shadow-sm order-2 lg:order-3">
              <h1 class="text-2xl md:text-3xl font-bold uppercase tracking-tight text-isis-dark">
                {{ p.name }}
              </h1>
              <p class="mt-4 text-2xl font-bold">{{ p.price | currency: 'BRL' }}</p>

              @if (catalogColors().length > 0) {
                <div class="mt-8">
                  <p class="text-xs text-isis-dark/50 mb-3">Cor</p>
                  <div class="flex flex-wrap gap-2">
                    @for (c of catalogColors(); track $index) {
                      <button
                        type="button"
                        [style.background]="c.hex"
                        class="w-8 h-8 border border-isis-dark/20 shadow-sm rounded-sm hover:scale-105 transition-all"
                        [class.ring-2]="selectedColor() === c.hex"
                        [class.ring-isis-dark]="selectedColor() === c.hex"
                        [class.ring-offset-2]="selectedColor() === c.hex"
                        [class.opacity-40]="!c.available"
                        [attr.aria-pressed]="selectedColor() === c.hex"
                        [attr.aria-label]="'Selecionar cor ' + c.hex"
                        (click)="selectedColor.set(c.hex)"
                      >
                        <span class="sr-only">{{ c.hex }}</span>
                      </button>
                    }
                  </div>
                </div>
              }

              @if (showSizes()) {
                <div class="mt-8">
                  <p class="text-xs text-isis-dark/50 mb-3">Tamanho</p>
                  <div class="flex flex-wrap gap-2">
                    @for (sz of orderedSizes(); track sz) {
                      <button
                        type="button"
                        (click)="selectedSize.set(sz)"
                        class="min-w-[2.5rem] h-10 px-2 border text-xs font-bold uppercase tracking-wide transition-colors"
                        [class.border-isis-dark]="selectedSize() === sz"
                        [class.bg-isis-dark]="selectedSize() === sz"
                        [class.text-white]="selectedSize() === sz"
                        [class.border-isis-blue/15]="selectedSize() !== sz"
                        [class.opacity-40]="!isSizeAvailable(sz)"
                      >
                        {{ sz }}
                      </button>
                    }
                  </div>
                </div>
              }

              @if (!isAdmin()) {
                @if (addedToCart()) {
                  <div class="mt-10 flex items-center justify-center gap-2 w-full border border-green-500/30 bg-green-50 py-4 text-sm font-bold uppercase tracking-widest text-green-700">
                    ✓ Adicionado ao carrinho
                  </div>
                } @else {
                  <button
                    type="button"
                    (click)="addToCart()"
                    class="mt-10 block w-full border border-isis-blue/20 bg-isis-blue py-4 text-center text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-isis-blue/25 transition-colors hover:bg-isis-blue/90"
                  >
                    Adicionar ao Carrinho
                  </button>
                }
                @if (loginPrompt()) {
                  <p class="mt-3 text-center text-xs text-isis-rose font-semibold animate-pulse">
                    Faça login para adicionar ao carrinho. Redirecionando…
                  </p>
                }
              }
            </div>
          </div>
        } @else {
          <p class="text-center py-24 text-isis-dark/40">A carregar…</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ArteIsisApiService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');

  readonly thumbFocus = THUMB_FOCUS;
  readonly thumbIndices = [0, 1, 2, 3, 4] as const;

  activeThumb = signal(0);
  selectedSize = signal<string | null>(null);
  selectedColor = signal('#1a1a1a');
  addedToCart = signal(false);
  loginPrompt = signal(false);

  row = signal<CatalogProductApiRow | null>(null);
  error = signal('');

  catalogColors = computed<ProductColorVariantApiRow[]>(() => this.row()?.colors ?? []);

  showSizes = computed(() => {
    const r = this.row();
    return !!r && GARMENT_CATEGORIES.has(r.category);
  });

  mainImage = computed(() => {
    const r = this.row();
    if (!r) return CATALOG_IMAGE_PLACEHOLDER;
    const hex = this.selectedColor();
    const match = (r.colors ?? []).find((c) => c.hex === hex && c.imageUrl?.trim());
    if (match?.imageUrl) {
      const u = match.imageUrl.trim();
      return resolvePublicMediaUrl(u) || u;
    }
    const raw = r.image ?? CATALOG_IMAGE_PLACEHOLDER;
    return resolvePublicMediaUrl(raw) || raw;
  });

  orderedSizes = computed(() => {
    const r = this.row();
    if (!r) return [] as string[];
    const garment = GARMENT_CATEGORIES.has(r.category);
    const fromApi = r.sizes?.length ? [...r.sizes] : garment ? [...BR_SIZES] : [];
    if (!fromApi.length) return [];
    return sortSizes(fromApi);
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((pm) => {
          const id = pm.get('id');
          if (!id) {
            return of({ ok: false as const, msg: 'Produto não encontrado.' });
          }
          return this.api.getCatalogProduct(id).pipe(
            map((data) => ({ ok: true as const, data })),
            catchError(() => of({ ok: false as const, msg: 'Produto não encontrado ou indisponível.' })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res.ok) {
          this.row.set(null);
          this.error.set(res.msg);
          return;
        }
        this.error.set('');
        this.row.set(res.data);
        const ordered = this.orderedSizes();
        const avail = res.data.availableSizes ?? [];
        const firstSize =
          ordered.find((s) => (avail.length === 0 ? true : avail.includes(s))) ?? ordered[0] ?? null;
        this.selectedSize.set(firstSize);
        const cols = res.data.colors ?? [];
        const firstHex = cols.find((c) => c.available)?.hex ?? cols[0]?.hex ?? '#1a1a1a';
        this.selectedColor.set(firstHex);
      });
  }

  addToCart(): void {
    const p = this.row();
    if (!p) return;

    if (this.auth.user()?.role !== 'CUSTOMER') {
      this.loginPrompt.set(true);
      setTimeout(() => {
        void this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url },
        });
      }, 1500);
      return;
    }

    this.cart.addItem(p, 1, this.selectedSize(), this.selectedColor());
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2500);
  }

  isSizeAvailable(size: string): boolean {
    const r = this.row();
    if (!r) return true;
    const avail = r.availableSizes ?? [];
    if (avail.length === 0) {
      return true;
    }
    return avail.includes(size);
  }
}
