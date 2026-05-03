import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, map, of, switchMap } from 'rxjs';
import { ArteIsisApiService, CatalogProductApiRow } from '../../core/arteisis-api.service';
import { resolvePublicMediaUrl } from '../../core/media-url';
import { CATALOG_IMAGE_PLACEHOLDER } from '../home/featured-products';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '2X', '3XL', 'P', 'M', 'G', 'GG', 'XG'];

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

            <div class="w-full lg:max-w-md bg-white border border-isis-blue/10 p-8 md:p-10 shadow-sm relative order-2 lg:order-3">
              <button
                type="button"
                class="absolute top-6 right-6 text-isis-dark/25 hover:text-isis-rose transition-colors p-2"
                aria-label="Favoritos (em breve)"
              >
                <span class="material-icons text-[22px]">favorite_border</span>
              </button>

              <h1 class="text-2xl md:text-3xl font-bold uppercase tracking-tight text-isis-dark pr-10">
                {{ p.name }}
              </h1>
              <p class="mt-4 text-2xl font-bold">{{ p.price | currency: 'BRL' }}</p>
              <p class="text-xs text-isis-dark/45 mt-1">Preço com impostos conforme política da loja.</p>

              <p class="mt-6 text-sm leading-relaxed text-isis-dark/80">
                {{ description() }}
              </p>

              <div class="mt-8">
                <p class="text-xs text-isis-dark/50 mb-3">Cor</p>
                <div class="flex flex-wrap gap-2">
                  @for (c of swatchColors; track c) {
                    <button
                      type="button"
                      [style.background]="c"
                      class="w-8 h-8 border border-isis-dark/20 shadow-sm rounded-sm hover:scale-105 transition-transform"
                      [class.ring-2]="selectedColor() === c"
                      [class.ring-isis-dark]="selectedColor() === c"
                      [class.ring-offset-2]="selectedColor() === c"
                      [attr.aria-pressed]="selectedColor() === c"
                      [attr.aria-label]="'Selecionar cor ' + c"
                      (click)="selectedColor.set(c)"
                    >
                      <span class="sr-only">{{ c }}</span>
                    </button>
                  }
                </div>
              </div>

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
                    >
                      {{ sz }}
                    </button>
                  }
                </div>
              </div>

              <div class="mt-8 flex gap-4 text-[10px] font-accent uppercase tracking-widest text-isis-dark/40">
                <span class="cursor-pointer hover:text-isis-blue">Guia de medidas</span>
                <span>|</span>
                <span class="cursor-pointer hover:text-isis-blue">Como encomendar</span>
              </div>

              <a
                routerLink="/"
                fragment="contato"
                class="mt-10 block w-full py-4 text-center text-sm font-bold uppercase tracking-widest bg-[#e8e6e3] text-isis-dark hover:bg-[#dddad5] transition-colors border border-isis-blue/10"
              >
                Encomendar
              </a>
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
  private readonly api = inject(ArteIsisApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly swatchColors = ['#e5e5e5', '#888888', '#1a1a1a', '#7eb8a8', '#f5f5f5', '#a8c4e0'];
  readonly thumbFocus = THUMB_FOCUS;
  readonly thumbIndices = [0, 1, 2, 3, 4] as const;

  activeThumb = signal(0);
  selectedSize = signal<string | null>(null);
  selectedColor = signal('#1a1a1a');

  row = signal<CatalogProductApiRow | null>(null);
  error = signal('');

  mainImage = computed(() => {
    const r = this.row();
    if (!r) return CATALOG_IMAGE_PLACEHOLDER;
    const raw = r.image ?? CATALOG_IMAGE_PLACEHOLDER;
    return resolvePublicMediaUrl(raw) || raw;
  });

  orderedSizes = computed(() => {
    const r = this.row();
    if (!r?.sizes?.length) return ['XS', 'S', 'M', 'L', 'XL', '2XL'];
    return sortSizes([...r.sizes]);
  });

  description = computed(() => {
    const r = this.row();
    if (!r) return '';
    const av = r.availability ?? '';
    return `${r.category}${av ? ' · ' + av : ''}. Peça do catálogo Arte Isis — fale connosco para variantes e prazos.`;
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
        const sizes = res.data.sizes ?? [];
        const ordered = sizes.length ? sortSizes([...sizes]) : ['XS', 'S', 'M', 'L', 'XL', '2XL'];
        this.selectedSize.set(ordered[0] ?? 'M');
      });
  }
}
