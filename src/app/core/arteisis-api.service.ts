import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderApiRow {
  id: string;
  customerId: string;
  customerName: string;
  productSummary: string;
  date: string;
  status: string;
  colors?: string[];
  /** Total em R$ (camelCase habitual). */
  total?: number | string | null;
  /** Alguns proxies/backends enviam o montante com este nome. */
  totalAmount?: number | string | null;
  valor?: number | string | null;
}

export interface CustomerApiRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
}

export interface ProductColorVariantApiRow {
  hex: string;
  imageUrl: string;
  available: boolean;
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
  availableSizes: string[];
  colorVariants: ProductColorVariantApiRow[];
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
  availableSizes: string[];
  colors: ProductColorVariantApiRow[];
}

export interface OrderWriteBody {
  customerId: string;
  status?: string | null;
  orderDate: string;
  lines: { productId?: string | null; description: string; quantity: number; unitPrice: number; selectedColor?: string | null }[];
}

export interface PublicOrderBody {
  lines: { productId?: string | null; description: string; quantity: number; unitPrice: number; selectedColor?: string | null }[];
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface AuthMeResponse {
  email: string;
  role: string;
  phone?: string | null;
}

export interface PortfolioItemApiRow {
  id: string;
  title: string;
  imageUrl: string;
  sortOrder: number;
}

export interface PortfolioItemAdminApiRow extends PortfolioItemApiRow {
  active: boolean;
}

export interface ImageUploadResponse {
  url: string;
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

  deleteOrder(id: string): Observable<void> {
    return this.http.delete(`${this.base}/api/admin/orders/${id}`).pipe(map(() => undefined));
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

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete(`${this.base}/api/admin/customers/${id}`).pipe(map(() => undefined));
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
    availableSizes: string[];
    colorVariants: { hex: string; imageUrl?: string | null; available: boolean }[];
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
      availableSizes: string[];
      colorVariants: { hex: string; imageUrl?: string | null; available: boolean }[];
    },
  ): Observable<ProductAdminApiRow> {
    return this.http.put<ProductAdminApiRow>(`${this.base}/api/admin/products/${id}`, body);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete(`${this.base}/api/admin/products/${id}`).pipe(map(() => undefined));
  }

  listPublicPortfolio(): Observable<PortfolioItemApiRow[]> {
    return this.http.get<PortfolioItemApiRow[]>(`${this.base}/api/catalog/portfolio`);
  }

  listPortfolioAdmin(): Observable<PortfolioItemAdminApiRow[]> {
    return this.http.get<PortfolioItemAdminApiRow[]>(`${this.base}/api/admin/portfolio-items`);
  }

  createPortfolioItem(body: { title: string; imageUrl: string; active: boolean }): Observable<PortfolioItemAdminApiRow> {
    return this.http.post<PortfolioItemAdminApiRow>(`${this.base}/api/admin/portfolio-items`, body);
  }

  updatePortfolioItem(
    id: string,
    body: { title: string; imageUrl: string; active: boolean },
  ): Observable<PortfolioItemAdminApiRow> {
    return this.http.put<PortfolioItemAdminApiRow>(`${this.base}/api/admin/portfolio-items/${id}`, body);
  }

  uploadImage(file: File): Observable<ImageUploadResponse> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImageUploadResponse>(`${this.base}/api/admin/upload/image`, fd);
  }

  deletePortfolioItem(id: string): Observable<void> {
    return this.http.delete(`${this.base}/api/admin/portfolio-items/${id}`).pipe(map(() => undefined));
  }

  listCatalog(filters: { q?: string; categories?: string[]; sizes?: string[]; availability?: string }): Observable<CatalogProductApiRow[]> {
    let p = new HttpParams();
    if (filters.q) p = p.set('q', filters.q);
    (filters.categories ?? []).forEach((c) => (p = p.append('category', c)));
    (filters.sizes ?? []).forEach((s) => (p = p.append('size', s)));
    if (filters.availability) p = p.set('availability', filters.availability);
    return this.http.get<CatalogProductApiRow[]>(`${this.base}/api/catalog/products`, { params: p });
  }

  getCatalogProduct(id: string): Observable<CatalogProductApiRow> {
    return this.http.get<CatalogProductApiRow>(`${this.base}/api/catalog/products/${encodeURIComponent(id)}`);
  }

  login(body: { email: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/login`, body);
  }

  register(body: {
    email: string;
    password: string;
    fullName?: string | null;
    phone?: string | null;
  }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/register`, body);
  }

  getMe(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${this.base}/api/auth/me`);
  }

  submitContact(body: { name: string; email: string; phone?: string | null; subject: string; message: string }): Observable<void> {
    return this.http.post(`${this.base}/api/public/contact`, body, { responseType: 'text' }).pipe(map(() => undefined));
  }

  submitPublicOrder(body: PublicOrderBody): Observable<OrderApiRow> {
    return this.http.post<OrderApiRow>(`${this.base}/api/public/orders`, body);
  }
}
