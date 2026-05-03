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
          class="flex items-center justify-between bg-isis-light border border-isis-blue/10 p-4 rounded-xl focus:outline-none focus:border-isis-blue/40 transition-all w-full text-isis-dark text-left cursor-pointer hover:bg-white active:scale-[0.99] group shadow-sm hover:shadow-md"
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
            class="absolute z-[110] w-full mt-2 bg-white border border-isis-blue/5 rounded-2xl shadow-2xl overflow-hidden py-2 animate-scale-in origin-top ring-1 ring-black/5"
          >
            @for (option of options(); track $index) {
              <button
                type="button"
                (click)="pick(option)"
                class="w-full flex items-center justify-between px-5 py-3.5 text-sm text-isis-dark hover:bg-isis-light transition-all text-left group/item"
                [class.bg-isis-light/40]="isSelected(option)"
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
              <div class="px-5 py-3 text-xs text-isis-dark/30 italic">Nenhuma opção disponível</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
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
