import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, RouterLink],
  template: `
    <header class="sticky top-0 z-[100] bg-white/95 backdrop-blur-md px-4 md:px-12 py-3 flex justify-between items-center h-20 border-b border-isis-blue/10 shadow-sm transition-all duration-300">
      <a routerLink="/" class="flex items-center group shrink-0">
        <div class="w-40 md:w-52 lg:w-64">
          <img
            src="/Logo1-ArteIsis.png"
            alt="Logo Arte Isis"
            class="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </a>
      <nav class="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
        <a routerLink="/" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px]">Início</a>
        <button type="button" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer bg-transparent border-0 p-0 font-sans" (click)="scrollTo('portfolio')">Portfólio</button>
        <a routerLink="/products" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px]">Produtos</a>
        <button type="button" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer bg-transparent border-0 p-0 font-sans" (click)="scrollTo('quem-somos')">Quem Somos</button>
        <button type="button" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer bg-transparent border-0 p-0 font-sans" (click)="scrollTo('contato')">Contato</button>
      </nav>
      <div class="flex items-center gap-2 md:gap-4 shrink-0">
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
            class="text-[10px] font-bold uppercase tracking-widest text-isis-dark/50 hover:text-isis-rose px-2 py-2 rounded-full transition-colors"
          >
            Sair
          </button>
        }
        @if (!isLoggedIn()) {
          <button routerLink="/auth/login" class="p-2 hover:bg-isis-light rounded-full transition-all hover:scale-110 active:scale-95 group">
            <mat-icon class="text-isis-blue group-hover:text-isis-rose transition-colors">person_outline</mat-icon>
          </button>
        }
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      /* Alinha ícone Material com texto pequeno (evita “saltar” para cima no pill). */
      .arte-header-admin-link .arte-header-admin-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        margin: 0;
        font-size: 1rem;
        line-height: 1;
      }
      .arte-header-admin-link .arte-header-admin-icon svg {
        width: 1rem;
        height: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');
  readonly isLoggedIn = computed(() => !!this.auth.user());

  scrollTo(id: string) {
    const path = this.router.url.split(/[?#]/)[0];
    const onHome = path === '' || path === '/';
    if (onHome) {
      const element = document.getElementById(id);
      if (element) {
        this.scrollElementWithHeaderOffset(element);
        return;
      }
    }
    void this.router.navigate(['/'], { fragment: id }).then(() => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          this.scrollElementWithHeaderOffset(el);
        }
      }, 120);
    });
  }

  private scrollElementWithHeaderOffset(element: HTMLElement) {
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }

  logout() {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
