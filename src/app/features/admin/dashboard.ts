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
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectOption } from '../../components/ui/select';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, debounceTime, switchMap } from 'rxjs';
import { ArteIsisApiService, OrderApiRow, OrderWriteBody } from '../../core/arteisis-api.service';
import { AuthService } from '../../core/auth.service';

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

const ORDER_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Pendente', value: 'Pendente' },
  { label: 'Produção', value: 'Produção' },
  { label: 'Concluído', value: 'Concluído' },
];

const PRODUCT_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Camisetas', value: 'Camisetas' },
  { label: 'Moletons', value: 'Moletons' },
  { label: 'Uniformes', value: 'Uniformes' },
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

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule, Button, Input, Select, FormsModule],
  template: `
    <div class="px-8 md:px-12 py-12 bg-isis-light min-h-[80vh]">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="flex justify-between items-center">
          <h1 class="text-4xl font-display text-isis-blue uppercase tracking-tight">PAINEL DE CONTROLE</h1>
          <div class="flex flex-wrap gap-4 items-center justify-end">
            <app-button (click)="view.set('orders'); resetFilters()" [variant]="view() === 'orders' ? 'primary' : 'outline'">Pedidos</app-button>
            <app-button (click)="view.set('customers')" [variant]="view() === 'customers' ? 'primary' : 'outline'">Clientes</app-button>
            <app-button (click)="view.set('products')" [variant]="view() === 'products' ? 'primary' : 'outline'">Produtos</app-button>
            <app-button variant="ghost" size="sm" (click)="logout()">Sair</app-button>
          </div>
        </div>

        @if (view() === 'orders') {
          <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col lg:row justify-between items-start lg:items-center gap-6">
              <h2 class="text-2xl font-display text-isis-blue">LISTAGEM DE PEDIDOS</h2>

              <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-white/50 p-2 rounded-2xl border border-isis-blue/5">
                <div class="relative flex-grow md:flex-grow-0 md:w-64">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-isis-dark/20 z-10 scale-75">search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    placeholder="Pesquisar..."
                    class="w-full pl-10 pr-4 py-2 bg-white border border-isis-blue/10 rounded-xl text-xs font-bold text-isis-dark placeholder:text-isis-dark/30 focus:outline-none focus:ring-2 focus:ring-isis-blue/10 transition-all font-sans shadow-sm"
                  />
                </div>

                <div class="relative w-full md:w-40">
                  <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-isis-dark/20 z-10 scale-75 pointer-events-none">expand_more</mat-icon>
                  <select
                    [(ngModel)]="statusFilter"
                    class="w-full pl-4 pr-10 py-2 bg-white border border-isis-blue/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-isis-dark focus:outline-none focus:ring-2 focus:ring-isis-blue/10 transition-all font-sans cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="">Status: Todos</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Produção">Produção</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div class="relative w-full md:w-44">
                  <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-isis-dark/20 z-10 scale-75 pointer-events-none">calendar_today</mat-icon>
                  <input
                    type="date"
                    [(ngModel)]="dateFilter"
                    class="w-full px-4 py-2 bg-white border border-isis-blue/10 rounded-xl text-xs font-bold text-isis-dark focus:outline-none focus:ring-2 focus:ring-isis-blue/10 transition-all font-sans shadow-sm"
                  />
                </div>

                <div class="h-8 w-px bg-isis-blue/10 hidden md:block mx-1"></div>

                <app-button variant="secondary" size="sm" (click)="openOrderModal()" class="w-full md:w-auto">
                  <mat-icon class="scale-75 -ml-1">add</mat-icon>
                  Novo Pedido
                </app-button>
              </div>
            </div>

            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40">Cliente</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40">Produto</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40 text-center">Data</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40 text-center">Status</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40 text-right">Valor</th>
                      <th class="p-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of orders(); track order.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="p-6 text-sm font-bold text-isis-dark">{{ order.customer }}</td>
                        <td class="p-6 text-sm text-isis-dark/60 font-medium">{{ order.product }}</td>
                        <td class="p-6 text-sm font-bold text-isis-dark/40 text-center tracking-tighter">{{ order.date | date: 'dd/MM/yyyy' }}</td>
                        <td class="p-6 text-center">
                          <span
                            class="text-[10px] font-bold uppercase tracking-[0.15em]"
                            [ngClass]="{
                              'text-yellow-600': order.status === 'Pendente',
                              'text-blue-500': order.status === 'Produção',
                              'text-green-600': order.status === 'Concluído',
                            }"
                          >
                            {{ order.status }}
                          </span>
                        </td>
                        <td class="p-6 text-sm font-bold text-isis-blue text-right">{{ order.total | currency: 'BRL' }}</td>
                        <td class="p-6 text-right">
                          <button
                            (click)="openOrderModal(order)"
                            class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90"
                          >
                            <mat-icon>edit</mat-icon>
                          </button>
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
          <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col lg:row justify-between items-start lg:items-center gap-6">
              <h2 class="text-2xl font-display text-isis-blue">LISTAGEM DE CLIENTES</h2>

              <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-white/50 p-2 rounded-2xl border border-isis-blue/5">
                <div class="relative w-full md:w-80">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-isis-dark/20 z-10 scale-75">search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="customerSearchQuery"
                    placeholder="Pesquisar por nome, e-mail ou telefone..."
                    class="w-full pl-10 pr-4 py-2 bg-white border border-isis-blue/10 rounded-xl text-xs font-bold text-isis-dark placeholder:text-isis-dark/30 focus:outline-none focus:ring-2 focus:ring-isis-blue/10 transition-all font-sans shadow-sm"
                  />
                </div>
                <div class="h-8 w-px bg-isis-blue/10 hidden md:block mx-1"></div>
                <app-button variant="secondary" size="sm" (click)="openCustomerModal()" class="w-full md:w-auto">
                  <mat-icon class="scale-75 -ml-1">person_add</mat-icon>
                  Novo Cliente
                </app-button>
              </div>
            </div>

            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40">Cliente</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40">Contato</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40 text-center">Histórico</th>
                      <th class="p-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (customer of customers(); track customer.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="p-6">
                          <span class="text-sm font-bold text-isis-dark">{{ customer.name }}</span>
                        </td>
                        <td class="p-6">
                          <div class="flex flex-col">
                            <span class="text-[10px] font-bold text-isis-dark/50">{{ customer.email }}</span>
                            <span class="text-[10px] font-bold text-isis-dark/30 font-mono tracking-tighter">{{ customer.phone }}</span>
                          </div>
                        </td>
                        <td class="p-6 text-center">
                          <button
                            (click)="viewCustomerOrders(customer)"
                            class="text-[10px] font-bold text-isis-rose hover:text-isis-blue transition-colors uppercase tracking-[0.15em] bg-isis-rose/5 px-3 py-1 rounded-full"
                          >
                            {{ customer.orders }} Pedidos
                          </button>
                        </td>
                        <td class="p-6 text-right">
                          <button
                            (click)="openCustomerModal(customer)"
                            class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90"
                          >
                            <mat-icon>edit</mat-icon>
                          </button>
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
        } @else {
          <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col lg:row justify-between items-start lg:items-center gap-6">
              <h2 class="text-2xl font-display text-isis-blue">LISTAGEM DE PRODUTOS</h2>

              <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-white/50 p-2 rounded-2xl border border-isis-blue/5">
                <div class="relative w-full md:w-80">
                  <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-isis-dark/20 z-10 scale-75">search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="productSearchQuery"
                    placeholder="Pesquisar por nome ou categoria..."
                    class="w-full pl-10 pr-4 py-2 bg-white border border-isis-blue/10 rounded-xl text-xs font-bold text-isis-dark placeholder:text-isis-dark/30 focus:outline-none focus:ring-2 focus:ring-isis-blue/10 transition-all font-sans shadow-sm"
                  />
                </div>
                <div class="h-8 w-px bg-isis-blue/10 hidden md:block mx-1"></div>
                <app-button variant="secondary" size="sm" (click)="openProductModal()" class="w-full md:w-auto">
                  <mat-icon class="scale-75 -ml-1">add_box</mat-icon>
                  Novo Produto
                </app-button>
              </div>
            </div>

            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-isis-blue/5">
              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead class="bg-isis-light/30 border-b border-isis-blue/5">
                    <tr>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40">Produto</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40">Categoria</th>
                      <th class="p-6 text-[10px] font-bold uppercase tracking-widest text-isis-dark/40 text-right">Valor Unitário</th>
                      <th class="p-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (product of products(); track product.id) {
                      <tr class="border-b border-isis-blue/5 hover:bg-isis-light/5 transition-colors group">
                        <td class="p-6">
                          <span class="text-sm font-bold text-isis-dark">{{ product.name }}</span>
                        </td>
                        <td class="p-6">
                          <span class="text-[10px] font-bold uppercase tracking-widest bg-isis-blue/5 text-isis-blue px-2.5 py-1 rounded-lg">
                            {{ product.category }}
                          </span>
                        </td>
                        <td class="p-6 text-sm font-bold text-isis-dark text-right">{{ product.price | currency: 'BRL' }}</td>
                        <td class="p-6 text-right">
                          <button
                            (click)="openProductModal(product)"
                            class="p-2 opacity-0 group-hover:opacity-100 hover:bg-isis-light rounded-xl transition-all text-isis-blue scale-90"
                          >
                            <mat-icon>edit</mat-icon>
                          </button>
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
              <div class="space-y-6">
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
                  <app-input label="Quantidade" type="number" placeholder="1" [(value)]="orderQuantityStr" />
                  <app-input label="Valor total (R$)" type="number" placeholder="0" [(value)]="orderTotalStr" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="order-date-field" class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1"
                    >Data do pedido</label
                  >
                  <input
                    id="order-date-field"
                    type="date"
                    [(ngModel)]="orderDateStr"
                    class="bg-isis-light border border-isis-blue/10 p-4 rounded-xl focus:outline-none focus:border-isis-blue/40 w-full text-isis-dark"
                  />
                </div>
                <app-button class="w-full" (click)="saveOrder()">
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
              <div class="space-y-6">
                <app-input label="Nome completo" placeholder="Nome" [(value)]="customerFormName" />
                <app-input label="Telefone" placeholder="(11) 99999-9999" [(value)]="customerFormPhone" />
                <app-input label="E-mail" type="email" placeholder="cliente@email.com" [(value)]="customerFormEmail" />
                <app-button class="w-full" (click)="saveCustomer()">
                  {{ selectedCustomer() ? 'Salvar alterações' : 'Cadastrar cliente' }}
                </app-button>
              </div>
            </div>
          </div>
        }

        @if (showProductForm()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-isis-dark/40 backdrop-blur-sm animate-fade-in">
            <div class="bg-white w-full max-w-lg p-10 rounded-3xl shadow-2xl space-y-8 animate-scale-in">
              <div class="flex justify-between items-center">
                <h3 class="text-2xl font-display text-isis-blue">{{ selectedProduct() ? 'EDITAR PRODUTO' : 'NOVO PRODUTO' }}</h3>
                <button (click)="closeModals()" class="text-isis-dark/40 hover:text-isis-rose transition-colors">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="space-y-6">
                <app-input label="Nome do produto" placeholder="Ex: Camiseta serigrafada" [(value)]="productFormName" />
                <app-select label="Categoria" [options]="productCategoryOptions" [(value)]="productFormCategory" />
                <app-input label="Valor unitário (R$)" type="number" placeholder="0.00" [(value)]="productFormPriceStr" />
                <app-input label="Estoque inicial" type="number" placeholder="0" [(value)]="productFormStockStr" />
                <app-select label="Etiqueta (catálogo)" [options]="productLabelOptions" [(value)]="productFormLabel" />
                <app-select label="Disponibilidade" [options]="availabilityOptions" [(value)]="productFormAvailability" />
                <app-button class="w-full" (click)="saveProduct()">
                  {{ selectedProduct() ? 'Salvar alterações' : 'Cadastrar produto' }}
                </app-button>
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  view = signal<'orders' | 'customers' | 'products'>('orders');
  showOrderForm = signal(false);
  showCustomerForm = signal(false);
  showProductForm = signal(false);

  selectedOrder = signal<Order | null>(null);
  selectedCustomer = signal<Customer | null>(null);
  selectedProduct = signal<Product | null>(null);

  searchQuery = model('');
  statusFilter = model('');
  dateFilter = model('');
  customerSearchQuery = model('');
  productSearchQuery = model('');

  orders = signal<Order[]>([]);
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);

  orderCustomerId = model('');
  orderDescription = model('');
  orderStatus = model('Pendente');
  orderQuantityStr = model('1');
  orderTotalStr = model('0');
  orderDateStr = model('');

  customerFormName = model('');
  customerFormEmail = model('');
  customerFormPhone = model('');

  productFormName = model('');
  productFormCategory = model('Camisetas');
  productFormPriceStr = model('0');
  productFormStockStr = model('0');
  productFormLabel = model('');
  productFormAvailability = model('Disponível');

  readonly orderStatusOptions = ORDER_STATUS_OPTIONS;
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
      this.orderTotalStr.set(String(order.total));
      this.orderDateStr.set(order.date.toISOString().slice(0, 10));
    } else {
      this.orderCustomerId.set('');
      this.orderDescription.set('');
      this.orderStatus.set('Pendente');
      this.orderQuantityStr.set('1');
      this.orderTotalStr.set('0');
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
      this.productFormPriceStr.set(String(product.price));
      this.productFormStockStr.set(String(product.stock ?? 0));
      this.productFormLabel.set(product.label ?? '');
      this.productFormAvailability.set(product.availability ?? 'Disponível');
    } else {
      this.productFormName.set('');
      this.productFormCategory.set('Camisetas');
      this.productFormPriceStr.set('0');
      this.productFormStockStr.set('0');
      this.productFormLabel.set('');
      this.productFormAvailability.set('Disponível');
    }
    this.showProductForm.set(true);
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
    const qty = Math.max(1, Math.floor(Number(this.orderQuantityStr()) || 1));
    const total = Number(this.orderTotalStr().replace(',', '.')) || 0;
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
    const email = this.customerFormEmail().trim();
    const phone = this.customerFormPhone().trim();
    if (!name || !email || !phone) {
      window.alert('Preencha nome, e-mail e telefone.');
      return;
    }
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
    const price = Number(this.productFormPriceStr().replace(',', '.')) || 0;
    const stock = Math.max(0, Math.floor(Number(this.productFormStockStr()) || 0));
    if (!name || !category) {
      window.alert('Preencha nome e categoria.');
      return;
    }
    const labelRaw = String(this.productFormLabel() ?? '').trim();
    const label = labelRaw === '' ? null : labelRaw;
    const availability = String(this.productFormAvailability() ?? 'Disponível');
    const sel = this.selectedProduct();
    const body = {
      name,
      unitPrice: price,
      category,
      stock,
      imageUrl: (sel?.imageUrl ?? null) as string | null,
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
    this.selectedOrder.set(null);
    this.selectedCustomer.set(null);
    this.selectedProduct.set(null);
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

  logout() {
    this.auth.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
