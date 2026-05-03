import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, RouterLink],
  template: `
    <header class="sticky top-0 z-[100] bg-white/95 backdrop-blur-md px-4 md:px-12 py-3 flex justify-between items-center h-20 border-b border-isis-blue/10 shadow-sm transition-all duration-300">
      <a routerLink="/" class="flex items-center group shrink-0">
        <div class="w-40 md:w-52 lg:w-64">
            <img src="/Logo1-ArteIsis.png" alt="Logo Arte Isis" class="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300">
        </div>
      </a>
      <nav class="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          <a routerLink="/" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px]">Início</a>
          <a (click)="scrollTo('portfolio')" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer">Portfólio</a>
          <a routerLink="/products" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px]">Produtos</a>
          <a (click)="scrollTo('quem-somos')" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer">Quem Somos</a>
          <a (click)="scrollTo('contato')" class="font-bold text-isis-dark/60 hover:text-isis-rose transition-colors uppercase tracking-[0.2em] text-[10px] cursor-pointer">Contato</a>
      </nav>
      <div class="flex items-center shrink-0">
        <button routerLink="/auth/login" class="p-2 hover:bg-isis-light rounded-full transition-all hover:scale-110 active:scale-95 group">
          <mat-icon class="text-isis-blue group-hover:text-isis-rose transition-colors">person_outline</mat-icon>
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
