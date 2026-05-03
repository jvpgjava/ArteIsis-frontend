import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './hero';
import { FeaturedProducts } from './featured-products';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, FeaturedProducts, Button, Input, Select, Textarea, MatIconModule],
  template: `
    <app-hero />
    <section class="py-24 px-8 md:px-12 bg-white" id="quem-somos">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div class="relative flex justify-center">
            <img 
              src="/Logo2-ArteIsis.png" 
              alt="Serigrafia Profissional Arte Isis" 
              class="relative z-10 w-full h-auto max-w-sm md:max-w-md object-contain"
              referrerpolicy="no-referrer"
            />
        </div>
        <div>
          <span class="text-isis-rose font-bold uppercase tracking-widest text-xs mb-4 block">Quem Somos</span>
          <h2 class="text-4xl md:text-5xl font-display mb-8 text-isis-blue uppercase tracking-tight">A EMPRESA ARTE ISIS</h2>
          <div class="space-y-6 text-isis-dark/80 text-lg leading-relaxed">
            <p>
              Nascemos da paixão pela arte e pela necessidade de oferecer produtos personalizados que realmente expressem a identidade de nossos clientes.
            </p>
            <p>
              Especializados em serigrafia, trabalhamos com foco total na qualidade da estampa e no conforto do material. Cada peça que sai do nosso estúdio é tratada como uma obra de arte única.
            </p>
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-base">
                <li class="flex items-center gap-3">
                    <mat-icon class="text-isis-blue">brush</mat-icon>
                    <span>Serigrafia de Alta Definição</span>
                </li>
                <li class="flex items-center gap-3">
                    <mat-icon class="text-isis-rose">school</mat-icon>
                    <span>Uniformes Empresariais e Escolares</span>
                </li>
                <li class="flex items-center gap-3">
                    <mat-icon class="text-isis-blue">auto_awesome</mat-icon>
                    <span>Coleções Exclusivas</span>
                </li>
                <li class="flex items-center gap-3">
                    <mat-icon class="text-isis-rose">palette</mat-icon>
                    <span>Foco em Sustentabilidade</span>
                </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section class="py-24 bg-isis-light" id="portfolio">
      <div class="px-8 md:px-12 max-w-7xl mx-auto">
        <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-display mb-4 text-isis-blue uppercase tracking-tight">NOSSOS PRODUTOS</h2>
            <p class="text-isis-dark/60 max-w-2xl mx-auto">Escolha a base perfeita para a sua ideia.</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          @for (cat of categories; track cat.title) {
            <div class="group cursor-pointer">
              <div class="relative aspect-[3/4] overflow-hidden rounded-3xl bg-white mb-4 shadow-sm group-hover:shadow-xl transition-all border border-isis-blue/5 group-hover:border-isis-blue/20">
                <img 
                  [src]="cat.image" 
                  [alt]="cat.title"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerpolicy="no-referrer"
                />
                <div class="absolute inset-0 bg-isis-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <p class="text-center font-bold uppercase tracking-[0.2em] text-[10px] text-isis-blue group-hover:text-isis-rose transition-colors">
                {{ cat.title }}
              </p>
            </div>
          }
        </div>
      </div>
    </section>

    <app-featured-products />

    <section class="py-24 px-8 md:px-12 bg-white" id="contato">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-6xl font-display mb-8 text-isis-blue uppercase tracking-tight">VAMOS CONVERSAR?</h2>
        <p class="text-isis-dark/60 text-lg mb-12">Tem uma ideia? Nossa equipe está pronta para transformá-la em arte!</p>
        
        <form class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-isis-light/30 p-10 md:p-16 rounded-[2.5rem] border border-isis-blue/5">
          <app-input label="Nome" placeholder="Seu nome completo" />
          <app-input label="E-mail" type="email" placeholder="seu@email.com" />
          
          <app-select 
            label="Assunto" 
            class="md:col-span-2"
            [options]="[
              { label: 'Orçamento para Uniformes', value: 'uniformes' },
              { label: 'Pedido de Camisetas Personalizadas', value: 'camisetas' },
              { label: 'Parcerias', value: 'parcerias' },
              { label: 'Outros', value: 'outros' }
            ]"
          />

          <app-textarea label="Sua Ideia" class="md:col-span-2" placeholder="Conte-nos um pouco sobre a estampa que você deseja..." />
          
          <div class="md:col-span-2 flex justify-center mt-6">
            <app-button variant="secondary" size="lg" class="w-full md:w-auto">Enviar Mensagem</app-button>
          </div>
        </form>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  categories = [
    { 
      title: 'Camisetas', 
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800'
    },
    { 
      title: 'Moletons', 
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'
    },
    { 
      title: 'Escolar', 
      image: 'https://images.unsplash.com/photo-1549442993-338a15842c99?auto=format&fit=crop&q=80&w=800'
    },
    { 
      title: 'Uniformes', 
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'
    },
    { 
      title: 'Estampas', 
      image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800'
    }
  ];
}
