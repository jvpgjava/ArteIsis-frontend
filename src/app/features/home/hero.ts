import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section class="relative min-h-[85vh] w-full overflow-hidden flex items-center justify-center py-20 px-4">
      <div class="absolute inset-0 z-0">
        <img
          src="/Fundo-home.jpeg"
          alt="Serigrafia Arte Isis"
          class="h-full w-full object-cover"
          referrerpolicy="no-referrer"
        />
        <div class="pointer-events-none absolute inset-0 bg-black/55" aria-hidden="true"></div>
      </div>
      <div class="relative z-10 text-center max-w-5xl animate-fade-in-up">
        <h1 class="text-5xl md:text-7xl lg:text-8xl text-white font-display tracking-tight leading-[0.95] mb-8 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
          Muito mais do que <br>
          <span class="italic underline text-white/90">uma estampa, é sua ideia</span> <br>
          <span class="decoration-isis-rose underline-offset-8">transformada</span> <br>
          em arte!
        </h1>
        <p class="text-white text-lg md:text-2xl font-bold max-w-2xl mx-auto leading-relaxed font-sans pb-8 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
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
