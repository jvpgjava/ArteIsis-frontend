import { Injectable, signal } from '@angular/core';

type Deferred =
  | { kind: 'alert'; resolve: () => void }
  | { kind: 'confirm'; resolve: (v: boolean) => void };

/**
 * Diálogos in-app (substitui `window.alert` / `window.confirm`).
 * O componente `<app-ui-message-modal />` deve estar no layout raiz.
 */
@Injectable({ providedIn: 'root' })
export class UiDialogService {
  readonly open = signal(false);
  readonly title = signal('');
  readonly message = signal('');
  readonly mode = signal<'alert' | 'confirm'>('alert');

  private deferred: Deferred | null = null;

  /** Mensagem com um botão OK. */
  alert(message: string, title = 'Atenção'): Promise<void> {
    return new Promise((resolve) => {
      this.deferred = { kind: 'alert', resolve };
      this.title.set(title);
      this.message.set(message);
      this.mode.set('alert');
      this.open.set(true);
    });
  }

  /** Pergunta com Cancelar / Confirmar. */
  confirm(message: string, title = 'Confirmar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.deferred = { kind: 'confirm', resolve };
      this.title.set(title);
      this.message.set(message);
      this.mode.set('confirm');
      this.open.set(true);
    });
  }

  ok(): void {
    const d = this.deferred;
    this.deferred = null;
    this.open.set(false);
    if (!d) {
      return;
    }
    if (d.kind === 'alert') {
      d.resolve();
    } else {
      d.resolve(true);
    }
  }

  cancel(): void {
    const d = this.deferred;
    this.deferred = null;
    this.open.set(false);
    if (d?.kind === 'confirm') {
      d.resolve(false);
    }
  }

  /** Clique no fundo escurecido: alert fecha como OK; confirm cancela. */
  backdropDismiss(): void {
    if (this.mode() === 'confirm') {
      this.cancel();
    } else {
      this.ok();
    }
  }
}
