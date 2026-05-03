import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderApiRow {
  id: string;
  customerId: string;
  customerName: string;
  productSummary: string;
  date: string;
  status: string;
  total: number;
}

export interface CustomerApiRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
}

export interface ProductAdminApiRow {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
  stock: number;
  imageUrl: string | null;
  label: string | null;
  availability: string | null;
  active: boolean;
  sizes: string[];
}

export interface CatalogProductApiRow {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  label: string | null;
  availability: string | null;
  sizes: string[];
}

export interface OrderWriteBody {
  customerId: string;
  status?: string | null;
  orderDate: string;
  lines: { productId?: string | null; description: string; quantity: number; unitPrice: number }[];
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface AuthMeResponse {
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class ArteIsisApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  listOrders(filters: { q?: string; status?: string; date?: string }): Observable<OrderApiRow[]> {
    let p = new HttpParams();
    if (filters.q) p = p.set('q', filters.q);
    if (filters.status) p = p.set('status', filters.status);
    if (filters.date) p = p.set('date', filters.date);
    return this.http.get<OrderApiRow[]>(`${this.base}/api/admin/orders`, { params: p });
  }

  getOrder(id: string): Observable<OrderApiRow> {
    return this.http.get<OrderApiRow>(`${this.base}/api/admin/orders/${id}`);
  }

  createOrder(body: OrderWriteBody): Observable<OrderApiRow> {
    return this.http.post<OrderApiRow>(`${this.base}/api/admin/orders`, body);
  }

  updateOrder(id: string, body: OrderWriteBody): Observable<OrderApiRow> {
    return this.http.put<OrderApiRow>(`${this.base}/api/admin/orders/${id}`, body);
  }

  listCustomers(q?: string): Observable<CustomerApiRow[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<CustomerApiRow[]>(`${this.base}/api/admin/customers`, { params });
  }

  getCustomer(id: string): Observable<CustomerApiRow> {
    return this.http.get<CustomerApiRow>(`${this.base}/api/admin/customers/${id}`);
  }

  createCustomer(body: { name: string; email: string; phone: string }): Observable<CustomerApiRow> {
    return this.http.post<CustomerApiRow>(`${this.base}/api/admin/customers`, body);
  }

  updateCustomer(id: string, body: { name: string; email: string; phone: string }): Observable<CustomerApiRow> {
    return this.http.put<CustomerApiRow>(`${this.base}/api/admin/customers/${id}`, body);
  }

  listProductsAdmin(q?: string): Observable<ProductAdminApiRow[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ProductAdminApiRow[]>(`${this.base}/api/admin/products`, { params });
  }

  createProduct(body: {
    name: string;
    unitPrice: number;
    category: string;
    stock: number;
    imageUrl?: string | null;
    label?: string | null;
    availability?: string | null;
    active: boolean;
    sizes: string[];
  }): Observable<ProductAdminApiRow> {
    return this.http.post<ProductAdminApiRow>(`${this.base}/api/admin/products`, body);
  }

  updateProduct(
    id: string,
    body: {
      name: string;
      unitPrice: number;
      category: string;
      stock: number;
      imageUrl?: string | null;
      label?: string | null;
      availability?: string | null;
      active: boolean;
      sizes: string[];
    },
  ): Observable<ProductAdminApiRow> {
    return this.http.put<ProductAdminApiRow>(`${this.base}/api/admin/products/${id}`, body);
  }

  listCatalog(filters: { q?: string; categories?: string[]; sizes?: string[]; availability?: string }): Observable<CatalogProductApiRow[]> {
    let p = new HttpParams();
    if (filters.q) p = p.set('q', filters.q);
    (filters.categories ?? []).forEach((c) => (p = p.append('category', c)));
    (filters.sizes ?? []).forEach((s) => (p = p.append('size', s)));
    if (filters.availability) p = p.set('availability', filters.availability);
    return this.http.get<CatalogProductApiRow[]>(`${this.base}/api/catalog/products`, { params: p });
  }

  login(body: { email: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/login`, body);
  }

  register(body: { email: string; password: string; fullName?: string | null }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/register`, body);
  }

  getMe(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${this.base}/api/auth/me`);
  }
}
