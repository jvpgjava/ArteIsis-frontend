import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Select, SelectOption } from '../../components/ui/select';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { combineLatest, debounceTime, finalize, switchMap } from 'rxjs';
import { ArteIsisApiService, OrderApiRow, OrderWriteBody, PortfolioItemAdminApiRow } from '../../core/arteisis-api.service';
import {
  formatBrlCurrencyFromNumber,
  isValidBrazilPhoneDigits,
  isValidEmail,
  parseBrlCurrencyInput,
  stripPhoneDigits,
} from '../../core/form-validators';
import { resolvePublicMediaUrl } from '../../core/media-url';

interface Order {
  id: string;
  customerId: string;
  customer: string;
  product: string;
  date: Date;
  status: 'Pendente' | 'Produção' | 'Concluído';
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock?: number;
  label?: string | null;
  availability?: string | null;
  imageUrl?: string | null;
  sizes?: string[];
}

interface PortfolioRow {
  id: string;
  title: string;
  imageUrl: string;
  active: boolean;
}

const ORDER_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Produção', value: 'Produção' },
  { label: 'Concluído', value: 'Concluído' },
];

/** Filtro da listagem de pedidos (mesmo `app-select` do contacto). */
const ORDER_STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: 'Status: Todos', value: '' },
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Produção', value: 'Produção' },
  { label: 'Concluído', value: 'Concluído' },
];

const PRODUCT_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Camisetas', value: 'Camisetas' },
  { label: 'Moletons', value: 'Moletons' },
  { label: 'Escolar', value: 'Escolar' },
  { label: 'Uniformes', value: 'Uniformes' },
  { label: 'Estampas', value: 'Estampas' },
  { label: 'Infantil', value: 'Infantil' },
  { label: 'Acessórios', value: 'Acessórios' },
];

const PRODUCT_LABEL_OPTIONS: SelectOption[] = [
  { label: 'Sem etiqueta', value: '' },
  { label: 'Novo', value: 'Novo' },
  { label: 'Destaque', value: 'Destaque' },
];

const AVAILABILITY_OPTIONS: SelectOption[] = [
  { label: 'Disponível', value: 'Disponível' },
  { label: 'Sob encomenda', value: 'Sob encomenda' },
];

function parseApiLocalDate(value: string | unknown): Date {
  const s = typeof value === 'string' ? value.slice(0, 10) : String(value).slice(0, 10);
  return new Date(`${s}T12:00:00`);
}

function mapOrder(r: OrderApiRow): Order {
  return {
    id: r.id,
    customerId: r.customerId,
    customer: r.customerName,
    product: r.productSummary,
    date: parseApiLocalDate(r.date as unknown),
    status: r.status as Order['status'],
    total: Number(r.total),
  };
}

/** `yyyy-MM-dd` → `Date` local (meio-dia evita desvio UTC). */
function parseIsoLocalDate(iso: string): Date | null {
  const t = String(iso ?? '').trim();
  if (!t) {
    return null;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) {
    return null;
  }
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function formatLocalDateToIso(d: Date | null | undefined): string {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    Button,
    Checkbox,
    Input,
    Select,
    FormsModule,
  ],
  template: `
    <div class="min-w-0 px-8 md:px-12 py-12 bg-isis-light min-h-[80vh]">
      <div class="max-w-7xl mx-auto min-w-0 space-y-12">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-display text-isis-blue uppercase tracking-tight">PAINEL DE CONTROLE</h1>
          <div class="flex flex-wrap gap-4 items-center justify-end">
            <app-button (click)="view.set('orders'); resetFilters()" [variant]="view() === 'orders' ? 'primary' : 'outline'">Pedidos</app-button>
            <app-button (click)="view.set('customers')" [variant]="view() === 'customers' ? 'primary' : 'outline'">Clientes</app-button>
            <app-button (click)="view.set('products')" [variant]="view() === 'products' ? 'primary' : 'outline'">Produtos</app-button>
            <app-button (click)="goPortfolio()" [variant]="view() === 'portfolio' ? 'primary' : 'outline'">Portfólio</app-button>
          </div>
        </div>

        @if (view() === 'orders') {
          <div class="space-y-6 animate-fade-in">
            <div class="w-full space-y-4">
              <h2 class="text-2xl font-display text-isis-blue">LISTAGEM DE PEDIDOS</h2>
              <div
                class="relative z-10 grid w-full grid-cols-1 gap-3 md:grid-cols-12 md:items-end md:gap-4"
              >
                <div class="relative min-w-0 md:col-span-4 lg:col-span-5">
                  <label class="sr-only" for="orders-search-q">Pesquisar pedidos</label>
                  <mat-icon
                    class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-isis-dark/25 !h-[22px] !w-[22px] !text-[22px]"
                    >search</mat-icon>
                  <input
                    id="orders-search-q"
                    type="text"
                    [(ngModel)]="searchQuery"
                    placeholder="Pesquisar…"
                    class="font-sans h-[3.25rem] w-full rounded-xl border border-isis-blue/15 bg-white py-0 pl-11 pr-4 text-sm font-semibold text-isis-dark shadow-sm placeholder:text-isis-dark/35 transition-all focus:outline-none focus:ring-2 focus:ring-isis-blue/20"
                  />
                </div>
                <div class="min-w-0 md:col-span-3 lg:col-span-3">
                  <app-select
                    class="w-full [&>div>div>button]:h-[3.25rem] [&>div>div>button]:min-h-0 [&>div>div>button]:rounded-xl [&>div>div>button]:border-isis-blue/15 [&>div>div>button]:bg-white [&>div>div>button]:px-4 [&>div>div>button]:py-0 [&>div>div>button]:text-xs [&>div>div>button]:font-bold [&>div>div>button]:uppercase [&>div>div>button]:tracking-wider [&>div>div>button]:shadow-sm"
                    placeholder="Status: todos"
                    [options]="orderStatusFilterOptions"
                    [(value)]="statusFilter"
                  />
                </div>
                <div class="min-w-0 md:col-span-3 lg:col-span-2">
                  <mat-form-field
                    appearance="outline"
                    class="arte-mat-date-field arte-mat-date-field--toolbar"
                    subscriptSizing="dynamic"
                  >
                    <input
                      matInput
                      [matDatepicker]="ordersDatePicker"
                      [(ngModel)]="ordersDateForPicker"
                      placeholder="Data"
                      readonly
                      aria-label="Filtrar por data do pedido"
                      class="font-sans text-xs font-bold uppercase tracking-wider"
                    />
                    <mat-datepicker-toggle matIconSuffix [for]="ordersDatePicker">
                      <mat-icon matDatepickerToggleIcon>calendar_today</mat-icon>
                    </mat-datepicker-toggle>
                    <mat-datepicker #ordersDatePicker panelClass="arte-datepicker-panel">
                      <mat-datepicker-actions>
                        <button type="button" class="arte-picker-btn-clear" (click)="clearOrdersDateFilter(ordersDatePicker)">
                          Limpar
                        </button>
                        <button
                          type="button"
                          class="arte-picker-btn-today ms-2 sm:ms-3"
                          (click)="setOrdersDateFilterToday(ordersDatePicker)"
                        >
                          Hoje
                        </button>
                      </mat-datepicker-actions>
                    </mat-datepicker>
                  </mat-form-field>
                </div>
                <div class="flex w-full min-w-0 md:col-span-2 lg:col-span-2 md:justify-end">
                  <app-button
                    variant="secondary"
                    size="md"
                    (click)="openOrderModal()"
                    class="w-full md:w-auto [&_button]:flex [&_button]:h-[3.25rem] [&_button]:min-h-0 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-xl [&_button]:px-6 [&_button]:py-0 [&_button]:text-xs [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-widest"
                  >
                    <mat-icon class="scale-90">add</mat-icon>
                    Novo pedido
                  </app-button>
                </div>
              </div>
            </div>

            <div class="min-w-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="min-w-0 overflow-x-auto">
                <table class="w-full min-w-0 text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Cliente</th>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Produto</th>
                      <th class="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-isis-dark/55">Data</th>
                      <th class="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-isis-dark/55">Status</th>
                      <th class="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-isis-dark/55">Valor</th>
                      <th class="px-6 py-4 w-24 min-w-[5.5rem]" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of orders(); track order.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="px-6 py-5 align-middle text-left text-sm font-semibold text-isis-dark">{{ order.customer }}</td>
                        <td class="px-6 py-5 align-middle text-left text-sm font-semibold text-isis-dark">{{ order.product }}</td>
                        <td class="px-6 py-5 align-middle text-center text-sm font-semibold text-isis-dark tabular-nums">
                          {{ order.date | date: 'dd/MM/yyyy' }}
                        </td>
                        <td class="px-6 py-5 align-middle text-center">
                          <span class="text-sm font-semibold uppercase tracking-wide text-isis-blue">{{ order.status }}</span>
                        </td>
                        <td class="px-6 py-5 align-middle text-right text-sm font-semibold text-isis-blue tabular-nums">
                          {{ order.total | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}
                        </td>
                        <td class="px-6 py-5 align-middle text-right">
                          <div class="inline-flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              (click)="openOrderModal(order)"
                              aria-label="Editar pedido"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90"
                            >
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deleteOrderRow(order)"
                              aria-label="Remover pedido"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-rose/10 rounded-xl transition-all text-isis-rose scale-90"
                            >
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (orders().length === 0) {
                      <tr>
                        <td colspan="6" class="p-24 text-center">
                          <div class="flex flex-col items-center gap-3 text-isis-dark/20">
                            <mat-icon class="scale-[1.5]">manage_search</mat-icon>
                            <p class="text-xs font-bold uppercase tracking-widest">Nenhum pedido encontrado</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } @else if (view() === 'customers') {
          <div class="space-y-6 animate-fade-in">
            <div class="w-full space-y-4">
              <h2 class="text-2xl font-display text-isis-blue">LISTAGEM DE CLIENTES</h2>
              <div
                class="flex w-full flex-col gap-4 md:flex-row md:items-stretch md:gap-4"
              >
                <div class="relative min-w-0 flex-1">
                  <mat-icon
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-isis-dark/25 z-10 pointer-events-none !text-[22px] !w-[22px] !h-[22px]"
                    >search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="customerSearchQuery"
                    placeholder="Pesquisar por nome, e-mail ou telefone..."
                    class="w-full min-h-[3.25rem] rounded-xl border border-isis-blue/15 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-isis-dark shadow-sm placeholder:text-isis-dark/35 focus:outline-none focus:ring-2 focus:ring-isis-blue/20 font-sans transition-all"
                  />
                </div>
                <app-button
                  variant="secondary"
                  size="md"
                  (click)="openCustomerModal()"
                  class="w-full shrink-0 md:w-auto md:self-center md:min-w-[13rem] [&_button]:flex [&_button]:h-[3.25rem] [&_button]:min-h-0 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-xl [&_button]:px-6 [&_button]:py-0 [&_button]:text-xs [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-widest"
                >
                  <mat-icon class="scale-90 -ml-0.5">person_add</mat-icon>
                  Novo Cliente
                </app-button>
              </div>
            </div>

            <div class="min-w-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="min-w-0 overflow-x-auto">
                <table class="w-full min-w-0 text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Cliente</th>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Contato</th>
                      <th class="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-isis-dark/55">Histórico</th>
                      <th class="px-6 py-4 w-24 min-w-[5.5rem]" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (customer of customers(); track customer.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="px-6 py-5 align-middle text-left text-sm font-semibold text-isis-dark">{{ customer.name }}</td>
                        <td class="px-6 py-5 align-middle text-left">
                          <div class="flex flex-col gap-1">
                            <span class="text-sm font-semibold text-isis-dark">{{ customer.email }}</span>
                            <span class="text-sm font-medium text-isis-dark/80 font-mono tracking-tight">{{ customer.phone }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-5 align-middle text-center">
                          <button
                            type="button"
                            (click)="viewCustomerOrders(customer)"
                            class="inline-flex items-center justify-center rounded-lg border border-isis-blue/20 bg-isis-blue/5 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-isis-blue transition-colors hover:border-isis-blue/35 hover:bg-isis-blue/10"
                          >
                            {{ customer.orders }} {{ customer.orders === 1 ? 'PEDIDO' : 'PEDIDOS' }}
                          </button>
                        </td>
                        <td class="px-6 py-5 align-middle text-right">
                          <div class="inline-flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              (click)="openCustomerModal(customer)"
                              aria-label="Editar cliente"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90"
                            >
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deleteCustomerRow(customer)"
                              aria-label="Remover cliente"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-rose/10 rounded-xl transition-all text-isis-rose scale-90"
                            >
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (customers().length === 0) {
                      <tr>
                        <td colspan="4" class="p-24 text-center">
                          <div class="flex flex-col items-center gap-3 text-isis-dark/20">
                            <mat-icon class="scale-[1.5]">person_search</mat-icon>
                            <p class="text-xs font-bold uppercase tracking-widest">Nenhum cliente encontrado</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } @else if (view() === 'products') {
          <div class="space-y-6 animate-fade-in">
            <div class="w-full space-y-4">
              <h2 class="text-2xl font-display text-isis-blue">LISTAGEM DE PRODUTOS</h2>
              <div
                class="flex w-full flex-col gap-4 md:flex-row md:items-stretch md:gap-4"
              >
                <div class="relative min-w-0 flex-1">
                  <mat-icon
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-isis-dark/25 z-10 pointer-events-none !text-[22px] !w-[22px] !h-[22px]"
                    >search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="productSearchQuery"
                    placeholder="Pesquisar por nome ou categoria..."
                    class="w-full min-h-[3.25rem] rounded-xl border border-isis-blue/15 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-isis-dark shadow-sm placeholder:text-isis-dark/35 focus:outline-none focus:ring-2 focus:ring-isis-blue/20 font-sans transition-all"
                  />
                </div>
                <app-button
                  variant="secondary"
                  size="md"
                  (click)="openProductModal()"
                  class="w-full shrink-0 md:w-auto md:self-center md:min-w-[13rem] [&_button]:flex [&_button]:h-[3.25rem] [&_button]:min-h-0 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-xl [&_button]:px-6 [&_button]:py-0 [&_button]:text-xs [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-widest"
                >
                  <mat-icon class="scale-90 -ml-0.5">add_box</mat-icon>
                  Novo Produto
                </app-button>
              </div>
            </div>

            <div class="min-w-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="min-w-0 overflow-x-auto">
                <table class="w-full min-w-0 text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Produto</th>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Categoria</th>
                      <th class="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-isis-dark/55">Valor</th>
                      <th class="px-6 py-4 w-24 min-w-[5.5rem]" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (product of products(); track product.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="px-6 py-5 align-middle text-left text-sm font-semibold text-isis-dark">{{ product.name }}</td>
                        <td class="px-6 py-5 align-middle text-left text-sm font-semibold uppercase tracking-wide text-isis-blue">
                          {{ product.category }}
                        </td>
                        <td class="px-6 py-5 align-middle text-right text-sm font-semibold text-isis-dark tabular-nums">
                          {{ product.price | currency: 'BRL' }}
                        </td>
                        <td class="px-6 py-5 align-middle text-right">
                          <div class="inline-flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              (click)="openProductModal(product)"
                              aria-label="Editar produto"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90"
                            >
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deleteProductRow(product)"
                              aria-label="Remover produto"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-rose/10 rounded-xl transition-all text-isis-rose scale-90"
                            >
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (products().length === 0) {
                      <tr>
                        <td colspan="4" class="p-24 text-center">
                          <div class="flex flex-col items-center gap-3 text-isis-dark/20">
                            <mat-icon class="scale-[1.5]">search_off</mat-icon>
                            <p class="text-xs font-bold uppercase tracking-widest">Nenhum produto cadastrado</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } @else {
          <div class="space-y-6 animate-fade-in">
            <div class="w-full space-y-4">
              <h2 class="text-2xl font-display text-isis-blue">PORTFÓLIO</h2>
              <div
                class="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6"
              >
                <p class="text-sm leading-relaxed text-isis-dark/55 md:max-w-3xl">
                  As imagens colocadas aqui aparecem na secção &quot;Portfólio&quot; da página inicial.
                </p>
                <app-button
                  variant="secondary"
                  size="md"
                  (click)="openPortfolioModal()"
                  class="w-full shrink-0 md:w-auto md:min-w-[12rem] [&_button]:flex [&_button]:h-[3.25rem] [&_button]:min-h-0 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-xl [&_button]:px-6 [&_button]:py-0 [&_button]:text-xs [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-widest"
                >
                  <mat-icon class="scale-90 -ml-0.5">add_photo_alternate</mat-icon>
                  Novo item
                </app-button>
              </div>
            </div>
            <div class="min-w-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="min-w-0 overflow-x-auto">
                <table class="w-full min-w-0 text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="px-6 py-4 w-24 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Imagem</th>
                      <th class="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-isis-dark/55">Título</th>
                      <th class="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-isis-dark/55">Ativo</th>
                      <th class="px-6 py-4 w-24 min-w-[5.5rem]" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of portfolioRows(); track row.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="px-6 py-5 align-middle text-left">
                          <img
                            [src]="mediaUrl(row.imageUrl)"
                            [alt]="row.title"
                            class="h-14 w-14 rounded-lg object-cover border border-isis-blue/10"
                            referrerpolicy="no-referrer"
                          />
                        </td>
                        <td class="px-6 py-5 align-middle text-left text-sm font-semibold text-isis-dark">{{ row.title }}</td>
                        <td class="px-6 py-5 align-middle text-center">
                          <span class="text-sm font-semibold uppercase tracking-wide text-isis-blue">
                            {{ row.active ? 'Sim' : 'Não' }}
                          </span>
                        </td>
                        <td class="px-6 py-5 align-middle text-right whitespace-nowrap">
                          <div class="inline-flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              (click)="openPortfolioModal(row)"
                              aria-label="Editar item de portfólio"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90 inline-flex align-middle"
                            >
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deletePortfolioRow(row)"
                              aria-label="Remover item de portfólio"
                              class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-rose/10 rounded-xl transition-all text-isis-rose scale-90 inline-flex align-middle"
                            >
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (portfolioRows().length === 0) {
                      <tr>
                        <td colspan="4" class="p-24 text-center">
                          <div class="flex flex-col items-center gap-3 text-isis-dark/20">
                            <mat-icon class="scale-[1.5]">collections</mat-icon>
                            <p class="text-xs font-bold uppercase tracking-widest">Nenhum item de portfólio</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        @if (showOrderForm()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-isis-dark/40 backdrop-blur-sm animate-fade-in">
            <div class="bg-white w-full max-w-lg p-10 rounded-3xl shadow-2xl space-y-8 animate-scale-in">
              <div class="flex justify-between items-center">
                <h3 class="text-2xl font-display text-isis-blue">{{ selectedOrder() ? 'EDITAR PEDIDO' : 'NOVO PEDIDO' }}</h3>
                <button (click)="closeModals()" class="text-isis-dark/40 hover:text-isis-rose transition-colors">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="flex flex-col gap-8">
                <app-select
                  label="Cliente"
                  placeholder="Selecione o cliente"
                  [options]="customerSelectOptions()"
                  [(value)]="orderCustomerId"
                />
                <app-input label="Descrição do pedido" placeholder="Ex: 10 Camisetas algodão" [(value)]="orderDescription" />
                <app-select
                  label="Status do pedido"
                  [options]="orderStatusOptions"
                  [(value)]="orderStatus"
                />
                <div class="grid grid-cols-2 gap-4">
                  <app-input label="Quantidade" type="text" placeholder="1" mask="order-qty" [(value)]="orderQuantityStr" />
                  <app-input label="Valor total" type="text" placeholder="R$ 0,00" mask="currency-brl" [(value)]="orderTotalStr" />
                </div>
                <mat-form-field appearance="outline" class="arte-mat-date-field w-full" subscriptSizing="dynamic">
                  <mat-label class="text-xs font-bold uppercase tracking-wider text-isis-dark/50">Data do pedido</mat-label>
                  <input
                    matInput
                    [matDatepicker]="orderModalDatePicker"
                    [(ngModel)]="orderModalDateForPicker"
                    readonly
                    id="order-date-field"
                  />
                  <mat-datepicker-toggle matIconSuffix [for]="orderModalDatePicker">
                    <mat-icon matDatepickerToggleIcon>calendar_today</mat-icon>
                  </mat-datepicker-toggle>
                  <mat-datepicker #orderModalDatePicker panelClass="arte-datepicker-panel">
                    <mat-datepicker-actions>
                      <button type="button" class="arte-picker-btn-clear" (click)="clearOrderModalDate(orderModalDatePicker)">
                        Limpar
                      </button>
                      <button
                        type="button"
                        class="arte-picker-btn-today ms-2 sm:ms-3"
                        (click)="setOrderModalDateToday(orderModalDatePicker)"
                      >
                        Hoje
                      </button>
                    </mat-datepicker-actions>
                  </mat-datepicker>
                </mat-form-field>
                <app-button class="w-full mt-2" (click)="saveOrder()">
                  {{ selectedOrder() ? 'Salvar alterações' : 'Criar pedido' }}
                </app-button>
              </div>
            </div>
          </div>
        }

        @if (showCustomerForm()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-isis-dark/40 backdrop-blur-sm animate-fade-in">
            <div class="bg-white w-full max-w-lg p-10 rounded-3xl shadow-2xl space-y-8 animate-scale-in">
              <div class="flex justify-between items-center">
                <h3 class="text-2xl font-display text-isis-blue">{{ selectedCustomer() ? 'EDITAR CLIENTE' : 'NOVO CLIENTE' }}</h3>
                <button (click)="closeModals()" class="text-isis-dark/40 hover:text-isis-rose transition-colors">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="flex flex-col gap-8">
                <app-input label="Nome completo" placeholder="Nome" [(value)]="customerFormName" />
                <app-input label="Telefone" placeholder="(11) 99999-9999" mask="phone-br" [(value)]="customerFormPhone" />
                <app-input label="E-mail" type="email" placeholder="cliente@email.com" mask="email" [(value)]="customerFormEmail" />
                <app-button class="w-full mt-2" (click)="saveCustomer()">
                  {{ selectedCustomer() ? 'Salvar alterações' : 'Cadastrar cliente' }}
                </app-button>
              </div>
            </div>
          </div>
        }

        @if (showProductForm()) {
          <div
            class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain p-4 py-8 sm:items-center sm:py-10 bg-isis-dark/40 backdrop-blur-sm animate-fade-in"
          >
            <div
              class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col min-h-0"
            >
              <div
                class="max-h-[min(90vh,44rem)] overflow-y-auto overflow-x-hidden flex flex-col min-h-0 p-8 sm:p-10"
              >
                <div class="flex shrink-0 justify-between items-center gap-4 pb-6 border-b border-isis-blue/5">
                  <h3 class="text-2xl font-display text-isis-blue">{{ selectedProduct() ? 'EDITAR PRODUTO' : 'NOVO PRODUTO' }}</h3>
                  <button type="button" (click)="closeModals()" class="shrink-0 text-isis-dark/40 hover:text-isis-rose transition-colors">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="flex flex-col gap-6 pt-6">
                  <app-input label="Nome do produto" placeholder="Ex: Camiseta serigrafada" [(value)]="productFormName" />
                  <app-select label="Categoria" [options]="productCategoryOptions" [(value)]="productFormCategory" />
                  <app-input label="Valor unitário (R$)" placeholder="R$ 0,00" mask="currency-brl" [(value)]="productFormPriceStr" />
                  <app-input label="Estoque inicial" type="text" placeholder="0" mask="stock-qty" [(value)]="productFormStockStr" />
                  <app-select label="Etiqueta (catálogo)" [options]="productLabelOptions" [(value)]="productFormLabel" />
                  <app-select label="Disponibilidade" [options]="availabilityOptions" [(value)]="productFormAvailability" />
                  <div class="flex flex-col gap-3 rounded-2xl border border-isis-blue/10 bg-isis-light/40 p-4">
                    <span class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-0.5">Imagem (JPG, PNG ou WEBP)</span>
                    @if (productFormImageUrl()) {
                      <div class="mx-auto flex h-32 w-full max-w-[10rem] items-center justify-center rounded-xl border border-isis-blue/15 bg-white p-2 shadow-sm">
                        <img
                          [src]="mediaUrl(productFormImageUrl())"
                          alt="Pré-visualização"
                          class="max-h-[7rem] max-w-full object-contain"
                        />
                      </div>
                    }
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      (change)="onProductImageSelected($event)"
                      class="block w-full min-w-0 max-w-full cursor-pointer text-xs leading-normal text-isis-dark/70 file:mr-0 file:mb-2 file:inline-flex file:w-full file:shrink-0 file:cursor-pointer file:items-center file:justify-center file:rounded-xl file:border-0 file:bg-isis-blue file:px-4 file:py-2.5 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white hover:file:bg-isis-blue/90 sm:file:mr-4 sm:file:mb-0 sm:file:inline-flex sm:file:w-auto"
                    />
                    @if (productImageUploading()) {
                      <p class="text-xs text-isis-dark/45">A enviar imagem…</p>
                    }
                  </div>
                  <app-button class="w-full shrink-0 pb-1 pt-2" (click)="saveProduct()">
                    {{ selectedProduct() ? 'Salvar alterações' : 'Cadastrar produto' }}
                  </app-button>
                </div>
              </div>
            </div>
          </div>
        }

        @if (showPortfolioForm()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-isis-dark/40 backdrop-blur-sm animate-fade-in">
            <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col min-h-0">
              <div class="max-h-[90vh] overflow-y-auto overflow-x-hidden p-8 sm:p-10 space-y-8">
                <div class="flex justify-between items-center">
                  <h3 class="text-2xl font-display text-isis-blue">{{ selectedPortfolio() ? 'EDITAR PORTFÓLIO' : 'NOVO ITEM' }}</h3>
                  <button type="button" (click)="closeModals()" class="text-isis-dark/40 hover:text-isis-rose transition-colors">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="flex flex-col gap-8">
                  <app-input label="Título (como aparece na home)" placeholder="Ex: Camisetas" [(value)]="portfolioFormTitle" />
                  <div class="flex flex-col gap-3">
                    <span class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1">Imagem (JPG, PNG ou WEBP)</span>
                    @if (portfolioFormImageUrl()) {
                      <img
                        [src]="mediaUrl(portfolioFormImageUrl())"
                        alt="Pré-visualização"
                        class="h-36 w-36 rounded-xl border border-isis-blue/15 object-cover shadow-sm"
                      />
                    }
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      (change)="onPortfolioImageSelected($event)"
                      class="block w-full text-sm text-isis-dark/70 file:mr-4 file:rounded-lg file:border-0 file:bg-isis-blue file:px-4 file:py-2.5 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white hover:file:bg-isis-blue/90"
                    />
                    @if (portfolioImageUploading()) {
                      <p class="text-xs text-isis-dark/45">A enviar imagem…</p>
                    }
                  </div>
                  <app-checkbox label="Visível em tela inicial" [(value)]="portfolioFormActive" />
                  <app-button class="w-full mt-4" (click)="savePortfolio()">
                    {{ selectedPortfolio() ? 'Salvar alterações' : 'Cadastrar item' }}
                  </app-button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      .animate-scale-in {
        animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly api = inject(ArteIsisApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** Resolve `/api/public/media/...` para `<img src>`. */
  protected readonly mediaUrl = resolvePublicMediaUrl;

  view = signal<'orders' | 'customers' | 'products' | 'portfolio'>('orders');
  showOrderForm = signal(false);
  showCustomerForm = signal(false);
  showProductForm = signal(false);
  showPortfolioForm = signal(false);

  selectedOrder = signal<Order | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  selectedProduct = signal<Product | null>(null);
  selectedPortfolio = signal<PortfolioRow | null>(null);

  searchQuery = model('');
  statusFilter = model('');
  dateFilter = model('');
  /** Cache ISO↔Date para `[(ngModel)]` do datepicker (evita novo `Date` a cada CD). */
  private _ordersPickerIsoCache = '';
  private _ordersPickerDateCache: Date | null = null;
  private _orderModalPickerIsoCache = '';
  private _orderModalPickerDateCache: Date | null = null;

  get ordersDateForPicker(): Date | null {
    const iso = this.dateFilter();
    if (this._ordersPickerIsoCache !== iso) {
      this._ordersPickerIsoCache = iso;
      this._ordersPickerDateCache = parseIsoLocalDate(iso);
    }
    return this._ordersPickerDateCache;
  }

  set ordersDateForPicker(v: Date | string | null) {
    this.onOrdersDateFilterChange(v instanceof Date ? v : null);
    this._ordersPickerIsoCache = this.dateFilter();
    this._ordersPickerDateCache = parseIsoLocalDate(this.dateFilter());
  }

  get orderModalDateForPicker(): Date | null {
    const iso = this.orderDateStr();
    if (this._orderModalPickerIsoCache !== iso) {
      this._orderModalPickerIsoCache = iso;
      this._orderModalPickerDateCache = parseIsoLocalDate(iso);
    }
    return this._orderModalPickerDateCache;
  }

  set orderModalDateForPicker(v: Date | string | null) {
    this.onOrderModalDateChange(v instanceof Date ? v : null);
    this._orderModalPickerIsoCache = this.orderDateStr();
    this._orderModalPickerDateCache = parseIsoLocalDate(this.orderDateStr());
  }

  customerSearchQuery = model('');
  productSearchQuery = model('');

  orders = signal<Order[]>([]);
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  portfolioRows = signal<PortfolioRow[]>([]);

  orderCustomerId = model('');
  orderDescription = model('');
  orderStatus = model('Pendente');
  orderQuantityStr = model('1');
  orderTotalStr = model('R$ 0,00');
  orderDateStr = model('');

  customerFormName = model('');
  customerFormEmail = model('');
  customerFormPhone = model('');

  productFormName = model('');
  productFormCategory = model('Camisetas');
  productFormPriceStr = model('R$ 0,00');
  productFormStockStr = model('0');
  productFormLabel = model('');
  productFormAvailability = model('Disponível');
  productFormImageUrl = model('');
  productImageUploading = signal(false);

  portfolioFormTitle = model('');
  portfolioFormImageUrl = model('');
  portfolioFormActive = model(true);
  portfolioImageUploading = signal(false);

  readonly orderStatusOptions = ORDER_STATUS_OPTIONS;
  readonly orderStatusFilterOptions = ORDER_STATUS_FILTER_OPTIONS;
  readonly productCategoryOptions = PRODUCT_CATEGORY_OPTIONS;
  readonly productLabelOptions = PRODUCT_LABEL_OPTIONS;
  readonly availabilityOptions = AVAILABILITY_OPTIONS;

  customerSelectOptions = computed<SelectOption[]>(() => {
    const head: SelectOption[] = [{ label: '— Selecione —', value: '' }];
    return head.concat(this.customers().map((c) => ({ label: c.name, value: c.id })));
  });

  constructor() {
    combineLatest([
      toObservable(this.searchQuery),
      toObservable(this.statusFilter),
      toObservable(this.dateFilter),
    ])
      .pipe(
        debounceTime(300),
        switchMap(([q, st, dt]) =>
          this.api.listOrders({
            q: q.trim() || undefined,
            status: st.trim() || undefined,
            date: dt.trim() || undefined,
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) => this.orders.set(rows.map(mapOrder)),
        error: (e) => console.error(e),
      });

    toObservable(this.customerSearchQuery)
      .pipe(
        debounceTime(300),
        switchMap((q) => this.api.listCustomers(q.trim() || undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) =>
          this.customers.set(
            rows.map((r) => ({
              id: r.id,
              name: r.name,
              email: r.email,
              phone: r.phone,
              orders: r.orders,
            })),
          ),
        error: (e) => console.error(e),
      });

    toObservable(this.productSearchQuery)
      .pipe(
        debounceTime(300),
        switchMap((q) => this.api.listProductsAdmin(q.trim() || undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) =>
          this.products.set(
            rows.map((r) => ({
              id: r.id,
              name: r.name,
              price: Number(r.unitPrice),
              category: r.category,
              stock: r.stock,
              label: r.label,
              availability: r.availability,
              imageUrl: r.imageUrl,
              sizes: r.sizes ?? [],
            })),
          ),
        error: (e) => console.error(e),
      });
  }

  openOrderModal(order?: Order) {
    this.selectedOrder.set(order ?? null);
    const today = new Date().toISOString().slice(0, 10);
    if (order) {
      this.orderCustomerId.set(order.customerId);
      this.orderDescription.set(order.product);
      this.orderStatus.set(order.status);
      this.orderQuantityStr.set('1');
      this.orderTotalStr.set(formatBrlCurrencyFromNumber(order.total));
      this.orderDateStr.set(order.date.toISOString().slice(0, 10));
    } else {
      this.orderCustomerId.set('');
      this.orderDescription.set('');
      this.orderStatus.set('Pendente');
      this.orderQuantityStr.set('1');
      this.orderTotalStr.set('R$ 0,00');
      this.orderDateStr.set(today);
    }
    this.showOrderForm.set(true);
  }

  openCustomerModal(customer?: Customer) {
    this.selectedCustomer.set(customer ?? null);
    if (customer) {
      this.customerFormName.set(customer.name);
      this.customerFormEmail.set(customer.email);
      this.customerFormPhone.set(customer.phone);
    } else {
      this.customerFormName.set('');
      this.customerFormEmail.set('');
      this.customerFormPhone.set('');
    }
    this.showCustomerForm.set(true);
  }

  openProductModal(product?: Product) {
    this.selectedProduct.set(product ?? null);
    if (product) {
      this.productFormName.set(product.name);
      this.productFormCategory.set(product.category);
      this.productFormPriceStr.set(formatBrlCurrencyFromNumber(Math.max(0, Number(product.price) || 0)));
      this.productFormStockStr.set(String(Math.max(0, Math.floor(Number(product.stock) || 0))));
      this.productFormLabel.set(product.label ?? '');
      this.productFormAvailability.set(product.availability ?? 'Disponível');
      this.productFormImageUrl.set(product.imageUrl ?? '');
    } else {
      this.productFormName.set('');
      this.productFormCategory.set('Camisetas');
      this.productFormPriceStr.set('R$ 0,00');
      this.productFormStockStr.set('0');
      this.productFormLabel.set('');
      this.productFormAvailability.set('Disponível');
      this.productFormImageUrl.set('');
    }
    this.showProductForm.set(true);
  }

  onProductImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.productImageUploading.set(true);
    this.api
      .uploadImage(file)
      .pipe(finalize(() => this.productImageUploading.set(false)))
      .subscribe({
        next: (res) => this.productFormImageUrl.set(res.url),
        error: () => window.alert('Não foi possível enviar a imagem. Usa JPG, PNG ou WEBP (máx. 5 MB).'),
      });
  }

  onPortfolioImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.portfolioImageUploading.set(true);
    this.api
      .uploadImage(file)
      .pipe(finalize(() => this.portfolioImageUploading.set(false)))
      .subscribe({
        next: (res) => this.portfolioFormImageUrl.set(res.url),
        error: () => window.alert('Não foi possível enviar a imagem. Usa JPG, PNG ou WEBP (máx. 5 MB).'),
      });
  }

  viewCustomerOrders(customer: Customer) {
    this.view.set('orders');
    this.searchQuery.set(customer.name);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.dateFilter.set('');
    this.customerSearchQuery.set('');
    this.productSearchQuery.set('');
  }

  onOrdersDateFilterChange(value: Date | string | null) {
    this.dateFilter.set(formatLocalDateToIso(value instanceof Date ? value : null));
  }

  clearOrdersDateFilter(dp: MatDatepicker<Date>) {
    this.dateFilter.set('');
    dp.close();
  }

  setOrdersDateFilterToday(dp: MatDatepicker<Date>) {
    this.dateFilter.set(formatLocalDateToIso(new Date()));
    dp.close();
  }

  onOrderModalDateChange(value: Date | string | null) {
    this.orderDateStr.set(formatLocalDateToIso(value instanceof Date ? value : null));
  }

  clearOrderModalDate(dp: MatDatepicker<Date>) {
    this.orderDateStr.set('');
    dp.close();
  }

  setOrderModalDateToday(dp: MatDatepicker<Date>) {
    this.orderDateStr.set(formatLocalDateToIso(new Date()));
    dp.close();
  }

  saveOrder() {
    const cid = String(this.orderCustomerId() ?? '').trim();
    if (!cid) {
      window.alert('Selecione um cliente.');
      return;
    }
    const desc = this.orderDescription().trim();
    if (!desc) {
      window.alert('Informe a descrição do pedido.');
      return;
    }
    const qtyDigits = this.orderQuantityStr().replace(/\D/g, '');
    const qty = Math.max(1, Math.min(9_999_999, parseInt(qtyDigits || '1', 10) || 1));
    const total = Math.max(0, parseBrlCurrencyInput(this.orderTotalStr()));
    const unit = qty > 0 ? total / qty : total;
    const body: OrderWriteBody = {
      customerId: cid,
      status: String(this.orderStatus() ?? 'Pendente'),
      orderDate: this.orderDateStr().trim() || new Date().toISOString().slice(0, 10),
      lines: [{ description: desc, quantity: qty, unitPrice: unit }],
    };
    const sel = this.selectedOrder();
    const req$ = sel ? this.api.updateOrder(sel.id, body) : this.api.createOrder(body);
    req$.subscribe({
      next: () => {
        this.closeModals();
        this.reloadOrders();
      },
      error: (e) => {
        console.error(e);
        window.alert('Não foi possível salvar o pedido.');
      },
    });
  }

  saveCustomer() {
    const name = this.customerFormName().trim();
    const email = this.customerFormEmail().trim().toLowerCase();
    const phoneDigits = stripPhoneDigits(this.customerFormPhone());
    if (!name || !email || !phoneDigits) {
      window.alert('Preencha nome, e-mail e telefone.');
      return;
    }
    if (!isValidEmail(email)) {
      window.alert('E-mail inválido.');
      return;
    }
    if (!isValidBrazilPhoneDigits(phoneDigits)) {
      window.alert('Telefone inválido (10 ou 11 dígitos com DDD).');
      return;
    }
    const phone = phoneDigits;
    const sel = this.selectedCustomer();
    const req$ = sel
      ? this.api.updateCustomer(sel.id, { name, email, phone })
      : this.api.createCustomer({ name, email, phone });
    req$.subscribe({
      next: () => {
        this.closeModals();
        this.refreshCustomers();
      },
      error: (e) => {
        console.error(e);
        window.alert('Não foi possível salvar o cliente.');
      },
    });
  }

  saveProduct() {
    const name = this.productFormName().trim();
    const category = String(this.productFormCategory() ?? '').trim();
    const price = Math.max(0, parseBrlCurrencyInput(this.productFormPriceStr()));
    const stock = Math.max(0, Math.floor(parseInt(this.productFormStockStr().replace(/\D/g, ''), 10) || 0));
    if (!name || !category) {
      window.alert('Preencha nome e categoria.');
      return;
    }
    const labelRaw = String(this.productFormLabel() ?? '').trim();
    const label = labelRaw === '' ? null : labelRaw;
    const availability = String(this.productFormAvailability() ?? 'Disponível');
    const sel = this.selectedProduct();
    const img = this.productFormImageUrl().trim();
    const imageUrl = img || (sel?.imageUrl?.trim() ?? '') || null;
    const body = {
      name,
      unitPrice: price,
      category,
      stock,
      imageUrl: imageUrl === '' ? null : imageUrl,
      label,
      availability,
      active: true,
      sizes: sel?.sizes ?? [],
    };
    const req$ = sel ? this.api.updateProduct(sel.id, body) : this.api.createProduct(body);
    req$.subscribe({
      next: () => {
        this.closeModals();
        this.refreshProducts();
      },
      error: (e) => {
        console.error(e);
        window.alert('Não foi possível salvar o produto.');
      },
    });
  }

  closeModals() {
    this.showOrderForm.set(false);
    this.showCustomerForm.set(false);
    this.showProductForm.set(false);
    this.showPortfolioForm.set(false);
    this.selectedOrder.set(null);
    this.selectedCustomer.set(null);
    this.selectedProduct.set(null);
    this.selectedPortfolio.set(null);
  }

  goPortfolio() {
    this.view.set('portfolio');
    this.refreshPortfolioAdmin();
  }

  refreshPortfolioAdmin() {
    this.api.listPortfolioAdmin().subscribe({
      next: (rows) => this.portfolioRows.set(rows.map((r) => this.mapPortfolioRow(r))),
      error: (e) => console.error(e),
    });
  }

  openPortfolioModal(row?: PortfolioRow) {
    this.selectedPortfolio.set(row ?? null);
    if (row) {
      this.portfolioFormTitle.set(row.title);
      this.portfolioFormImageUrl.set(row.imageUrl);
      this.portfolioFormActive.set(row.active);
    } else {
      this.portfolioFormTitle.set('');
      this.portfolioFormImageUrl.set('');
      this.portfolioFormActive.set(true);
    }
    this.showPortfolioForm.set(true);
  }

  savePortfolio() {
    const title = this.portfolioFormTitle().trim();
    const path = this.portfolioFormImageUrl().trim() || (this.selectedPortfolio()?.imageUrl?.trim() ?? '');
    if (!title || !path) {
      window.alert('Preencha o título e envie uma imagem (JPG, PNG ou WEBP).');
      return;
    }
    const body = { title, imageUrl: path, active: this.portfolioFormActive() };
    const sel = this.selectedPortfolio();
    const req$ = sel ? this.api.updatePortfolioItem(sel.id, body) : this.api.createPortfolioItem(body);
    req$.subscribe({
      next: () => {
        this.closeModals();
        this.refreshPortfolioAdmin();
      },
      error: () => window.alert('Não foi possível salvar o item de portfólio.'),
    });
  }

  deleteOrderRow(order: Order) {
    if (!window.confirm('Remover este pedido? Esta ação não pode ser desfeita.')) {
      return;
    }
    this.api.deleteOrder(order.id).subscribe({
      next: () => this.reloadOrders(),
      error: () => window.alert('Não foi possível remover o pedido.'),
    });
  }

  deleteCustomerRow(customer: Customer) {
    if (!window.confirm('Remover este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }
    this.api.deleteCustomer(customer.id).subscribe({
      next: () => this.refreshCustomers(),
      error: (e: unknown) => {
        if (e instanceof HttpErrorResponse && e.status === 409) {
          window.alert(
            'Não é possível remover este cliente enquanto existirem pedidos associados. Remova ou reatribua os pedidos primeiro.',
          );
        } else {
          window.alert('Não foi possível remover o cliente.');
        }
      },
    });
  }

  deleteProductRow(product: Product) {
    if (!window.confirm('Remover este produto? Esta ação não pode ser desfeita.')) {
      return;
    }
    this.api.deleteProduct(product.id).subscribe({
      next: () => this.refreshProducts(),
      error: () => window.alert('Não foi possível remover o produto.'),
    });
  }

  deletePortfolioRow(row: PortfolioRow) {
    if (!window.confirm('Remover este item do portfólio?')) {
      return;
    }
    this.api.deletePortfolioItem(row.id).subscribe({
      next: () => this.refreshPortfolioAdmin(),
      error: () => window.alert('Não foi possível remover.'),
    });
  }

  private mapPortfolioRow(r: PortfolioItemAdminApiRow): PortfolioRow {
    return {
      id: r.id,
      title: r.title,
      imageUrl: r.imageUrl,
      active: r.active,
    };
  }

  private reloadOrders() {
    this.api
      .listOrders({
        q: this.searchQuery().trim() || undefined,
        status: this.statusFilter().trim() || undefined,
        date: this.dateFilter().trim() || undefined,
      })
      .subscribe({
        next: (rows) => this.orders.set(rows.map(mapOrder)),
        error: (e) => console.error(e),
      });
  }

  private refreshCustomers() {
    this.api.listCustomers(this.customerSearchQuery().trim() || undefined).subscribe({
      next: (rows) =>
        this.customers.set(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            orders: r.orders,
          })),
        ),
      error: (e) => console.error(e),
    });
  }

  private refreshProducts() {
    this.api.listProductsAdmin(this.productSearchQuery().trim() || undefined).subscribe({
      next: (rows) =>
        this.products.set(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            price: Number(r.unitPrice),
            category: r.category,
            stock: r.stock,
            label: r.label,
            availability: r.availability,
            imageUrl: r.imageUrl,
            sizes: r.sizes ?? [],
          })),
        ),
      error: (e) => console.error(e),
    });
  }
}
