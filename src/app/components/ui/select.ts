import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  label: string;
  value: unknown;
}

@Component({
  selector: 'app-select',
  imports: [MatIconModule, CommonModule],
  template: `
    <div class="flex flex-col gap-1.5 w-full relative">
      @if (label()) {
        <label [for]="id()" class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1">
          {{ label() }}
        </label>
      }

      <div class="relative">
        <button
          type="button"
          [id]="id()"
          (click)="toggle()"
          class="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-isis-blue/15 bg-white p-4 text-left text-isis-dark shadow-sm transition-all hover:border-isis-blue/25 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-isis-blue/20 active:scale-[0.99]"
        >
          <span class="truncate pr-4" [class.opacity-40]="!selectedLabel()">
            {{ selectedLabel() || placeholder() }}
          </span>
          <mat-icon
            class="text-isis-blue/30 group-hover:text-isis-blue transition-all duration-300 transform shrink-0"
            [class.rotate-180]="isOpen()"
          >
            expand_more
          </mat-icon>
        </button>

        @if (isOpen()) {
          <div
            class="app-select-panel absolute z-[1350] mt-2 w-full origin-top overflow-hidden rounded-xl border border-isis-blue/15 bg-white py-0 shadow-[0_12px_40px_-8px_rgba(42,42,42,0.22)] animate-scale-in divide-y divide-isis-blue/10"
          >
            @for (option of options(); track $index) {
              <button
                type="button"
                (click)="pick(option)"
                class="app-select-option group/item flex w-full items-center justify-between border-0 bg-white px-4 py-3 text-left text-sm font-semibold text-isis-dark shadow-none transition-colors hover:bg-isis-light/90"
                [class.bg-isis-light]="isSelected(option)"
              >
                <span
                  class="transition-transform group-hover/item:translate-x-1"
                  [class.font-bold]="isSelected(option)"
                >
                  {{ option.label }}
                </span>
                @if (isSelected(option)) {
                  <mat-icon class="text-isis-blue scale-75 animate-scale-in">check</mat-icon>
                }
              </button>
            } @empty {
              <div class="bg-white px-4 py-3 text-xs italic text-isis-dark/40">Nenhuma opção disponível</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .app-select-panel {
        background-color: #ffffff !important;
        opacity: 1;
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
      }
      .app-select-option {
        background-color: #ffffff !important;
      }
      .app-select-option.bg-isis-light {
        background-color: #f1f5f9 !important;
      }
      .animate-scale-in {
        animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-8px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select {
  private readonly elementRef = inject(ElementRef);

  id = input<string>('');
  label = input<string>('');
  placeholder = input<string>('Selecione uma opção');
  options = input<SelectOption[]>([]);

  value = model<unknown>(null);

  isOpen = signal(false);
  selectedLabel = signal<string>('');

  constructor() {
    effect(() => {
      const v = this.value();
      const opts = this.options();
      const found = opts.find((o) => o.value === v);
      this.selectedLabel.set(found ? found.label : '');
    });
  }

  isSelected(option: SelectOption): boolean {
    return this.value() === option.value;
  }

  toggle() {
    this.isOpen.update((v) => !v);
  }

  pick(option: SelectOption) {
    this.value.set(option.value);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
