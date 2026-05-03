import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  imports: [MatIconModule],
  template: `
    <footer class="bg-isis-dark text-white px-8 md:px-12 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto">
        <div class="flex flex-col gap-6">
            <div class="w-48 md:w-56">
                <img src="/Logo1-ArteIsis.png" alt="Logo Arte Isis" class="w-full h-auto object-contain">
            </div>
            <p class="text-isis-light/60 text-sm leading-relaxed max-w-md">
                Transformando suas ideias em artes únicas através da serigrafia de alta qualidade. Muito mais do que uma estampa.
            </p>
            <div class="flex gap-4">
                <a href="https://www.instagram.com/arteisisserigrafia" target="_blank" rel="noopener noreferrer" class="bg-white/5 hover:bg-isis-rose p-3 rounded-xl transition-all duration-300 flex items-center justify-center group">
                    <svg class="w-6 h-6 fill-white group-hover:scale-110 transition-transform" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.012 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.012 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.012-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.019.935 20.35.63 19.56.3c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.237-.421-.563-.224-.96-.479-1.382-.899-.419-.419-.679-.824-.896-1.38-.164-.42-.359-1.065-.413-2.235-.057-1.274-.07-1.649-.07-4.859 0-3.211.015-3.586.074-4.859.061-1.171.256-1.816.421-2.237.224-.563.479-.96.899-1.382.419-.419.824-.679 1.38-.896.42-.164 1.065-.359 2.235-.413 1.274-.057 1.649-.07 4.859-.07zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
            </div>
        </div>
        <div class="flex flex-col gap-3 md:items-end">
          <h4 class="uppercase font-display tracking-widest text-sm mb-4 text-isis-rose">Institucional</h4>
          <div class="flex flex-col gap-3 text-isis-light/60 text-sm md:items-end">
            <a href="#" class="hover:text-white transition-colors">Quem Somos</a>
            <a href="#" class="hover:text-white transition-colors">Portfólio</a>
          </div>
        </div>
      </div>
      <div class="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-isis-light/40">
        <p>© 2026 Arte Isis. Todos os direitos reservados.</p>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
