import { ChangeDetectionStrategy, Component, inject, model, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, Button, Input, FormsModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-isis-light/30">
      <div class="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-isis-blue/5">
        <div class="text-center mb-10">
          <h1 class="text-4xl font-display text-isis-blue mb-2">BEM-VINDO</h1>
          <p class="text-isis-dark/50">Acesse sua conta para gerenciar seus pedidos.</p>
        </div>

        <form class="flex flex-col gap-8" (ngSubmit)="submit()">
          <app-input label="E-mail" type="email" placeholder="seu@email.com" [(value)]="email" />
          <app-input label="Senha" type="password" placeholder="••••••••" [(value)]="password" />

          @if (error()) {
            <p class="text-xs font-bold text-red-600 uppercase tracking-wider">{{ error() }}</p>
          }

          <app-button
            type="submit"
            class="w-full cursor-pointer"
            variant="primary"
            [class.opacity-60]="loading()"
            [disabled]="loading()"
          >
            {{ loading() ? 'A entrar…' : 'Entrar' }}
          </app-button>
        </form>

        <div class="mt-10 pt-8 border-t border-isis-blue/5 text-center">
          <p class="text-sm text-isis-dark/60 mb-4">Ainda não tem uma conta?</p>
          <app-button routerLink="/auth/register" variant="outline" class="w-full">Criar Conta</app-button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = model('');
  password = model('');
  error = signal<string | null>(null);
  loading = signal(false);

  submit() {
    this.error.set(null);
    const e = String(this.email() ?? '').trim();
    const p = String(this.password() ?? '');
    if (!e || !p) {
      this.error.set('Preencha e-mail e senha.');
      return;
    }
    this.loading.set(true);
    this.auth.login(e, p).subscribe({
      next: () => {
        const role = this.auth.storedRole();
        const raw = this.route.snapshot.queryParamMap.get('returnUrl');
        let target = raw ?? (role === 'ADMIN' ? '/admin' : '/');
        if (target.startsWith('/admin') && role !== 'ADMIN') {
          target = '/';
        }
        void this.router.navigateByUrl(target);
      },
      error: () => {
        this.error.set('Credenciais inválidas ou servidor indisponível.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
