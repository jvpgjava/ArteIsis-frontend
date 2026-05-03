import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `
    <div class="flex flex-col gap-2.5 w-full">
      @if (label()) {
        <label [for]="id()" class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1">
          {{ label() }}
        </label>
      }
      <input
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        class="bg-isis-light border border-isis-blue/10 p-4 rounded-xl focus:outline-none focus:border-isis-blue/40 transition-colors w-full text-isis-dark"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {
  id = input<string>('');
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  value = model<string>('');

  onInput(event: Event) {
    const el = event.target as HTMLInputElement | null;
    this.value.set(el?.value ?? '');
  }
}
