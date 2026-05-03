import { ChangeDetectionStrategy, Component, inject, model, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthService } from '../../core/auth.service';
import {
  isValidBrazilPhoneDigits,
  isValidEmail,
  normalizeEmail,
  stripPhoneDigits,
} from '../../core/form-validators';

@Component({
  selector: 'app-register',
  imports: [RouterLink, Button, Input, FormsModule],
  template: `
    <div class="min-h-[90vh] flex items-center justify-center px-4 py-20 bg-isis-light/30">
      <div class="w-full max-w-2xl bg-white p-10 rounded-3xl shadow-xl border border-isis-blue/5">
        <div class="text-center mb-10">
          <h1 class="text-4xl font-display text-isis-blue mb-2 uppercase tracking-tight">CRIAR CONTA</h1>
          <p class="text-isis-dark/50 italic">Junte-se à Arte Isis e transforme suas ideias em arte.</p>
        </div>

        <form class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8" (ngSubmit)="submit()">
          <app-input
            label="Nome Completo"
            placeholder="Nome"
            [(value)]="fullName"
            [errorText]="errName()"
          />
          <app-input
            label="Telefone"
            placeholder="(11) 99999-9999"
            mask="phone-br"
            [(value)]="phone"
            [errorText]="errPhone()"
          />
          <div class="md:col-span-2">
            <app-input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              mask="email"
              [(value)]="email"
              [errorText]="errEmail()"
            />
          </div>
          <app-input
            label="Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            [(value)]="password"
            [errorText]="errPassword()"
          />
          <app-input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            [(value)]="passwordConfirm"
            [errorText]="errPasswordConfirm()"
          />

          @if (error()) {
            <p class="md:col-span-2 text-xs font-bold text-red-600 uppercase tracking-wider">{{ error() }}</p>
          }

          <div class="md:col-span-2">
            <app-button type="submit" class="w-full mt-4" variant="primary" [disabled]="loading()">
              {{ loading() ? 'A registar…' : 'Cadastrar' }}
            </app-button>
          </div>
        </form>

        <div class="mt-10 pt-8 border-t border-isis-blue/5 text-center">
          <p class="text-sm text-isis-dark/60 mb-4">Já tem uma conta?</p>
          <app-button routerLink="/auth/login" variant="outline" class="w-full">Fazer Login</app-button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  fullName = model('');
  phone = model('');
  email = model('');
  password = model('');
  passwordConfirm = model('');

  errName = signal('');
  errPhone = signal('');
  errEmail = signal('');
  errPassword = signal('');
  errPasswordConfirm = signal('');

  error = signal<string | null>(null);
  loading = signal(false);

  submit() {
    this.clearFieldErrors();
    this.error.set(null);
    const name = String(this.fullName() ?? '').trim();
    const mail = normalizeEmail(String(this.email() ?? ''));
    const phoneDigits = stripPhoneDigits(String(this.phone() ?? ''));
    const p1 = String(this.password() ?? '');
    const p2 = String(this.passwordConfirm() ?? '');

    let ok = true;
    if (name.length < 3) {
      this.errName.set('Informe o nome completo (mín. 3 caracteres).');
      ok = false;
    }
    if (!isValidBrazilPhoneDigits(phoneDigits)) {
      this.errPhone.set('Telefone inválido. Use DDD + número (10 ou 11 dígitos).');
      ok = false;
    }
    if (!isValidEmail(mail)) {
      this.errEmail.set('E-mail inválido.');
      ok = false;
    }
    if (p1.length < 8) {
      this.errPassword.set('A senha deve ter pelo menos 8 caracteres.');
      ok = false;
    }
    if (p1 !== p2) {
      this.errPasswordConfirm.set('As senhas não coincidem.');
      ok = false;
    }
    if (!ok) {
      return;
    }

    this.loading.set(true);
    this.auth.register(mail, p1, name, phoneDigits).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (err) => {
        const msg =
          err?.status === 409
            ? 'Este e-mail já está registado.'
            : 'Não foi possível concluir o registo. Tente novamente.';
        this.error.set(msg);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private clearFieldErrors() {
    this.errName.set('');
    this.errPhone.set('');
    this.errEmail.set('');
    this.errPassword.set('');
    this.errPasswordConfirm.set('');
  }
}
