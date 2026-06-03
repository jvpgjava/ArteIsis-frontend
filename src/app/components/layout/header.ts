import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, RouterLink],
  template: `
    <header class="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-isis-blue/10 shadow-sm transition-all duration-300">

      <!-- Barra principal -->
      <div class="px-4 md:px-12 py-3 flex justify-between items-center h-20">
        <a routerLink="/" (click)="closeMobileMenu()" class="flex items-center group shrink-0">
          <div class="w-40 md:w-52 lg:w-64">
            <img
              src="/Logo1-ArteIsis.png"
              alt="Logo Arte Isis"
              class="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </a>

        <!-- Nav desktop -->
        <nav class="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          <a routerLink="/" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px]">Início</a>
          <button type="button" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer bg-transparent border-0 p-0 font-sans" (click)="scrollTo('portfolio')">Portfólio</button>
          <a routerLink="/products" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px]">Produtos</a>
          <button type="button" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer bg-transparent border-0 p-0 font-sans" (click)="scrollTo('quem-somos')">Quem Somos</button>
          <button type="button" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer bg-transparent border-0 p-0 font-sans" (click)="scrollTo('contato')">Contato</button>
        </nav>

        <!-- Ações (direita) -->
        <div class="flex items-center gap-2 md:gap-3 shrink-0">
          @if (isAdmin()) {
            <a
              routerLink="/admin"
              class="arte-header-admin-link hidden sm:inline-flex items-center justify-center gap-2 rounded-full border border-isis-blue/15 bg-isis-light/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest leading-none text-isis-blue hover:bg-isis-blue hover:text-white transition-colors"
            >
              <mat-icon class="arte-header-admin-icon shrink-0">dashboard</mat-icon>
              <span class="leading-none">Painel de controle</span>
            </a>
            <a
              routerLink="/admin"
              class="sm:hidden p-2 rounded-full border border-isis-blue/15 text-isis-blue hover:bg-isis-light"
              aria-label="Painel de controle"
            >
              <mat-icon>dashboard</mat-icon>
            </a>
          }
          @if (isLoggedIn()) {
            <button
              type="button"
              (click)="logout()"
              class="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-isis-dark/50 hover:text-isis-rose px-2 py-2 rounded-full transition-colors"
            >
              Sair
            </button>
          }
          @if (!isLoggedIn()) {
            <button routerLink="/auth/login" class="p-2 hover:bg-isis-light rounded-full transition-all hover:scale-110 active:scale-95 group">
              <mat-icon class="text-isis-blue group-hover:text-isis-rose transition-colors">person_outline</mat-icon>
            </button>
          }
          @if (isCustomer()) {
            <button
              type="button"
              (click)="openCart()"
              class="relative p-2 hover:bg-isis-light rounded-full transition-all hover:scale-110 active:scale-95 group"
              aria-label="Abrir carrinho"
            >
              <mat-icon class="text-isis-dark/60 group-hover:text-isis-rose transition-colors">shopping_bag</mat-icon>
              @if (cartCount() > 0) {
                <span class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-isis-rose text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {{ cartCount() }}
                </span>
              }
            </button>
          }

          <!-- Botão hamburguer — visível apenas abaixo de lg -->
          <button
            type="button"
            (click)="toggleMobileMenu()"
            class="lg:hidden p-2 rounded-full hover:bg-isis-light transition-colors"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-label="Menu"
          >
            <mat-icon class="text-isis-dark/70 transition-transform duration-200"
              [class.rotate-90]="mobileMenuOpen()">
              {{ mobileMenuOpen() ? 'close' : 'menu' }}
            </mat-icon>
          </button>
        </div>
      </div>

      <!-- Menu mobile — aparece abaixo da barra quando aberto -->
      @if (mobileMenuOpen()) {
        <nav class="lg:hidden border-t border-isis-blue/10 bg-white/98 backdrop-blur-md px-6 py-4 flex flex-col gap-1 animate-fade-in">
          <a
            routerLink="/"
            (click)="closeMobileMenu()"
            class="w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-isis-dark/60 hover:bg-isis-light hover:text-isis-rose transition-colors"
          >
            Início
          </a>
          <button
            type="button"
            (click)="scrollToMobile('portfolio')"
            class="w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-isis-dark/60 hover:bg-isis-light hover:text-isis-rose transition-colors bg-transparent border-0 font-sans"
          >
            Portfólio
          </button>
          <a
            routerLink="/products"
            (click)="closeMobileMenu()"
            class="w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-isis-dark/60 hover:bg-isis-light hover:text-isis-rose transition-colors"
          >
            Produtos
          </a>
          <button
            type="button"
            (click)="scrollToMobile('quem-somos')"
            class="w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-isis-dark/60 hover:bg-isis-light hover:text-isis-rose transition-colors bg-transparent border-0 font-sans"
          >
            Quem Somos
          </button>
          <button
            type="button"
            (click)="scrollToMobile('contato')"
            class="w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-isis-dark/60 hover:bg-isis-light hover:text-isis-rose transition-colors bg-transparent border-0 font-sans"
          >
            Contato
          </button>

          @if (isLoggedIn()) {
            <div class="mt-2 pt-3 border-t border-isis-blue/8">
              <button
                type="button"
                (click)="logoutMobile()"
                class="w-full text-left py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-widest text-isis-rose hover:bg-isis-rose/5 transition-colors bg-transparent border-0 font-sans"
              >
                Sair
              </button>
            </div>
          }
        </nav>
      }
    </header>
  `,
  styles: [
    `
      :host { display: block; }
      .arte-header-admin-link .arte-header-admin-icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 1rem; height: 1rem; margin: 0; font-size: 1rem; line-height: 1;
      }
      .arte-header-admin-link .arte-header-admin-icon svg { width: 1rem; height: 1rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);

  readonly isAdmin    = computed(() => this.auth.user()?.role === 'ADMIN');
  readonly isLoggedIn = computed(() => !!this.auth.user());
  readonly isCustomer = computed(() => this.auth.user()?.role === 'CUSTOMER');
  readonly cartCount  = computed(() => this.cart.itemCount());

  mobileMenuOpen = signal(false);

  @HostListener('document:keydown.escape')
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  scrollTo(id: string): void {
    const path = this.router.url.split(/[?#]/)[0];
    const onHome = path === '' || path === '/';
    if (onHome) {
      const el = document.getElementById(id);
      if (el) { this.scrollWithOffset(el); return; }
    }
    void this.router.navigate(['/'], { fragment: id }).then(() => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) this.scrollWithOffset(el);
      }, 120);
    });
  }

  scrollToMobile(id: string): void {
    this.closeMobileMenu();
    setTimeout(() => this.scrollTo(id), 150);
  }

  private scrollWithOffset(element: HTMLElement): void {
    const offset = element.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }

  openCart(): void { this.cart.openSidebar(); }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  logoutMobile(): void {
    this.closeMobileMenu();
    this.logout();
  }
}
