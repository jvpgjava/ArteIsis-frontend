import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiDialogService } from '../../core/ui-dialog.service';
import { Button } from './button';

@Component({
  selector: 'app-ui-message-modal',
  standalone: true,
  imports: [CommonModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dialog.open()) {
      <div
        class="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-isis-dark/50 backdrop-blur-sm animate-fade-in"
        role="presentation"
        (click)="onBackdrop($event)"
      >
        <div
          class="relative w-full max-w-md rounded-3xl border border-isis-blue/10 bg-white p-8 shadow-2xl animate-scale-in"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'ui-dialog-title'"
          (click)="$event.stopPropagation()"
        >
          <h2 id="ui-dialog-title" class="font-display text-2xl text-isis-blue tracking-tight">
            {{ dialog.title() }}
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-isis-dark/80 whitespace-pre-wrap">
            {{ dialog.message() }}
          </p>
          <div class="mt-8 flex flex-wrap justify-end gap-3">
            @if (dialog.mode() === 'confirm') {
              <app-button variant="outline" size="sm" (click)="dialog.cancel()">Cancelar</app-button>
            }
            <app-button variant="primary" size="sm" (click)="dialog.ok()">
              {{ dialog.mode() === 'confirm' ? 'Confirmar' : 'OK' }}
            </app-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .animate-fade-in {
        animation: uiDlgFade 0.2s ease-out;
      }
      .animate-scale-in {
        animation: uiDlgScale 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes uiDlgFade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes uiDlgScale {
        from {
          opacity: 0;
          transform: scale(0.94);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class UiMessageModal {
  readonly dialog = inject(UiDialogService);

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dialog.backdropDismiss();
    }
  }
}
