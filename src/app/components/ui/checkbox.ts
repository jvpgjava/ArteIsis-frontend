import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-checkbox',
  imports: [MatIconModule],
  template: `
    <label class="flex items-center gap-3 cursor-pointer group">
      <div class="relative flex items-center justify-center">
        <input
          type="checkbox"
          class="peer hidden"
          [checked]="value()"
          (change)="onChange($event)"
        />
        <div class="w-5 h-5 border-2 border-isis-blue/20 rounded-md peer-checked:bg-isis-blue peer-checked:border-isis-blue transition-all group-hover:border-isis-blue/40"></div>
        <mat-icon class="absolute text-white scale-75 opacity-0 peer-checked:opacity-100 transition-opacity">check</mat-icon>
      </div>
      <span class="text-sm text-isis-dark/70 group-hover:text-isis-dark transition-colors">
        {{ label() }}
        @if (count() !== undefined) {
          <span class="text-isis-dark/40 font-mono ml-1">({{ count() }})</span>
        }
      </span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkbox {
  label = input.required<string>();
  count = input<number>();
  value = model(false);

  onChange(event: Event) {
    const el = event.target as HTMLInputElement | null;
    this.value.set(!!el?.checked);
  }
}
