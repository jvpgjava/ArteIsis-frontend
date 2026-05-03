import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-textarea',
  template: `
    <div class="flex flex-col gap-2.5 w-full">
      @if (label()) {
        <label [for]="id()" class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1">
          {{ label() }}
        </label>
      }
      <textarea
        [id]="id()"
        [rows]="rows()"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        [class]="areaClass()"
      ></textarea>
      @if (errorText()) {
        <p class="text-xs font-medium text-red-600 px-1">{{ errorText() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Textarea {
  id = input<string>('');
  label = input<string>('');
  rows = input<number>(4);
  placeholder = input<string>('');
  value = model<string>('');
  errorText = input<string>('');

  areaClass(): string {
    const base =
      'bg-isis-light border p-4 rounded-xl focus:outline-none transition-colors w-full text-isis-dark resize-none';
    const border = this.errorText()
      ? 'border-red-400 focus:border-red-500'
      : 'border-isis-blue/10 focus:border-isis-blue/40';
    return base + ' ' + border;
  }

  onInput(event: Event) {
    const el = event.target as HTMLTextAreaElement | null;
    this.value.set(el?.value ?? '');
  }
}
