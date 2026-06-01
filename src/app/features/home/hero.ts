import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section class="relative min-h-[85vh] w-full overflow-hidden flex items-center justify-center py-20 px-4">
      <div class="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1621600411688-4be93cd68504?auto=format&fit=crop&q=80&w=2070"
          alt="Serigrafia Arte Isis"
          class="w-full h-full object-cover opacity-30 grayscale"
          referrerpolicy="no-referrer"
        />
        <div class="absolute inset-0 bg-gradient-to-br from-isis-blue/80 via-isis-blue/40 to-isis-rose/60"></div>
      </div>
      <div class="relative z-10 text-center max-w-5xl animate-fade-in-up">
        <h1 class="text-5xl md:text-7xl lg:text-8xl text-white font-display tracking-tight leading-[0.95] mb-8 drop-shadow-sm">
          Muito mais do que <br>
          <span class="italic underline text-white/90">uma estampa, é sua ideia</span> <br>
          <span class="decoration-isis-rose underline-offset-8">transformada</span> <br>
          em arte!
        </h1>
        <p class="text-white text-lg md:text-2xl font-light max-w-2xl mx-auto opacity-90 leading-relaxed font-sans pb-8">
          Trabalhamos com serigrafia de alta qualidade para uniformes, moletons e coleções exclusivas. Transformamos seu conceito em
          realidade.
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .animate-fade-in-up {
        animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {}
