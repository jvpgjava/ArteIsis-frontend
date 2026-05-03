import { ChangeDetectionStrategy, Component, HostListener, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Hero } from './hero';
import { FeaturedProducts } from './featured-products';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectOption } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { MatIconModule } from '@angular/material/icon';
import { ArteIsisApiService } from '../../core/arteisis-api.service';
import { isValidEmail, normalizeEmail } from '../../core/form-validators';

const CONTACT_SUBJECT_OPTIONS: SelectOption[] = [
  { label: 'Orçamento', value: 'uniformes' },
  {
    label: 'Pedido de Camisetas, Moletons ou Uniformes personalizados',
    value: 'camisetas',
  },
  { label: 'Estampas', value: 'estampas' },
  { label: 'Parcerias', value: 'parcerias' },
  { label: 'Outros', value: 'outros' },
];

const NOSSOS_PRODUTOS_LINKS: { category: string; image: string }[] = [
  {
    category: 'Camisetas',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
  },
  {
    category: 'Moletons',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
  },
  {
    category: 'Escolar',
    image:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
  },
  {
    category: 'Uniformes',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
  },
  {
    category: 'Estampas',
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, FeaturedProducts, Button, Input, Select, Textarea, MatIconModule, FormsModule, RouterLink],
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
              Nascemos da paixão pela arte e pela necessidade de oferecer produtos personalizados que realmente expressem a identidade de
              nossos clientes.
            </p>
            <p>
              Especializados em serigrafia, trabalhamos com foco total na qualidade da estampa e no conforto do material. Cada peça que sai
              do nosso estúdio é tratada como uma obra de arte única.
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
    <section class="py-24 bg-isis-light" id="nossos-produtos-bases">
      <div class="px-8 md:px-12 max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-display mb-4 text-isis-blue uppercase tracking-tight">NOSSOS PRODUTOS</h2>
          <p class="text-isis-dark/60 max-w-2xl mx-auto">Escolha a base perfeita para a sua ideia.</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          @for (cat of nossosProdutosLinks; track cat.category) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ categoria: cat.category }"
              class="group block cursor-pointer no-underline text-isis-blue visited:text-isis-blue"
            >
              <div
                class="relative aspect-[3/4] overflow-hidden rounded-3xl bg-white mb-4 shadow-sm group-hover:shadow-xl transition-all border border-isis-blue/5 group-hover:border-isis-blue/20"
              >
                <img
                  [src]="cat.image"
                  [alt]="cat.category"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerpolicy="no-referrer"
                />
                <div class="absolute inset-0 bg-isis-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <p
                class="text-center font-bold uppercase tracking-[0.2em] text-[10px] text-current group-hover:text-isis-rose transition-colors"
              >
                {{ cat.category }}
              </p>
            </a>
          }
        </div>
      </div>
    </section>

    <app-featured-products />

    <section class="py-24 px-8 md:px-12 bg-white" id="contato">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-6xl font-display mb-8 text-isis-blue uppercase tracking-tight">VAMOS CONVERSAR?</h2>
        <p class="text-isis-dark/60 text-lg mb-12">Tem uma ideia? Nossa equipe está pronta para transformá-la em arte!</p>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-isis-light/30 p-10 md:p-16 rounded-[2.5rem] border border-isis-blue/5" (ngSubmit)="submitContact()">
          <app-input label="Nome" placeholder="Seu nome completo" [(value)]="contactName" [errorText]="errContactName()" />
          <app-input label="E-mail" type="email" placeholder="seu@email.com" mask="email" [(value)]="contactEmail" [errorText]="errContactEmail()" />

          <app-select label="Assunto" class="md:col-span-2" [options]="contactSubjectOptions" [(value)]="contactSubject" />

          <app-textarea
            label="Sua Ideia"
            class="md:col-span-2"
            placeholder="Conte-nos um pouco sobre a estampa que você deseja..."
            [(value)]="contactMessage"
            [errorText]="errContactMessage()"
          />

          @if (contactFeedback()) {
            <p class="md:col-span-2 text-center text-sm text-red-600 font-medium">
              {{ contactFeedback() }}
            </p>
          }

          <div class="md:col-span-2 flex justify-center mt-6">
            <app-button type="submit" variant="secondary" size="lg" class="w-full md:w-auto" [disabled]="contactSending()">
              {{ contactSending() ? 'A enviar…' : 'Enviar Mensagem' }}
            </app-button>
          </div>
        </form>
      </div>
    </section>

    @if (contactThanksOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="contact-thanks-message">
        <button
          type="button"
          class="absolute inset-0 w-full h-full cursor-default border-0 bg-isis-dark/45 backdrop-blur-[2px] p-0"
          aria-label="Fechar"
          (click)="closeContactThanks()"
        ></button>
        <div class="relative z-10 w-full max-w-md rounded-[2rem] bg-white p-10 md:p-12 shadow-2xl shadow-isis-blue/15 border border-isis-blue/10 text-center">
          <div class="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-isis-rose/15 text-isis-rose">
            <mat-icon class="!text-3xl !w-8 !h-8">mark_email_read</mat-icon>
          </div>
          <p
            id="contact-thanks-message"
            class="font-display text-xl md:text-2xl text-isis-blue leading-snug tracking-tight mb-10"
          >
            Agradecemos seu contato, entraremos em contato em breve!
          </p>
          <app-button type="button" variant="primary" size="md" (click)="closeContactThanks()">Fechar</app-button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly api = inject(ArteIsisApiService);

  readonly contactSubjectOptions = CONTACT_SUBJECT_OPTIONS;
  readonly nossosProdutosLinks = NOSSOS_PRODUTOS_LINKS;

  contactName = model('');
  contactEmail = model('');
  contactSubject = model('uniformes');
  contactMessage = model('');

  contactSending = signal(false);
  contactFeedback = signal<string | null>(null);
  contactThanksOpen = signal(false);

  errContactName = signal('');
  errContactEmail = signal('');
  errContactMessage = signal('');

  submitContact() {
    this.clearContactFieldErrors();
    this.contactFeedback.set(null);
    this.contactThanksOpen.set(false);
    const name = String(this.contactName() ?? '').trim();
    const email = normalizeEmail(String(this.contactEmail() ?? ''));
    const subject = String(this.contactSubject() ?? '').trim();
    const message = String(this.contactMessage() ?? '').trim();

    let ok = true;
    if (name.length < 2) {
      this.errContactName.set('Informe o nome (mín. 2 caracteres).');
      ok = false;
    }
    if (!isValidEmail(email)) {
      this.errContactEmail.set('E-mail inválido.');
      ok = false;
    }
    if (message.length < 5) {
      this.errContactMessage.set('A mensagem deve ter pelo menos 5 caracteres.');
      ok = false;
    } else if (message.length > 4000) {
      this.errContactMessage.set('A mensagem pode ter no máximo 4000 caracteres.');
      ok = false;
    }
    if (!subject) {
      this.contactFeedback.set('Selecione um assunto.');
      ok = false;
    }
    if (!ok) {
      return;
    }

    this.contactSending.set(true);
    this.api.submitContact({ name, email, subject, message }).subscribe({
      next: () => {
        this.contactFeedback.set(null);
        this.contactName.set('');
        this.contactEmail.set('');
        this.contactSubject.set('uniformes');
        this.contactMessage.set('');
        this.contactThanksOpen.set(true);
      },
      error: (err) => {
        const st = err?.status;
        if (st === 503 || st === 502) {
          this.contactFeedback.set('O envio por e-mail não está disponível neste servidor. Tenta mais tarde ou contacta-nos por outro canal.');
        } else if (st === 400) {
          this.contactFeedback.set('Dados inválidos. Verifica o formulário.');
        } else {
          this.contactFeedback.set('Não foi possível enviar. Verifica a ligação à API.');
        }
      },
      complete: () => this.contactSending.set(false),
    });
  }

  private clearContactFieldErrors() {
    this.errContactName.set('');
    this.errContactEmail.set('');
    this.errContactMessage.set('');
  }

  closeContactThanks() {
    this.contactThanksOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.contactThanksOpen()) {
      this.closeContactThanks();
    }
  }
}
