import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-textarea',
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      @if (label()) {
        <label [for]="id()" class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1">
          {{ label() }}
        </label>
      }
      <textarea
        [id]="id()"
        [rows]="rows()"
        [placeholder]="placeholder()"
        class="bg-isis-light border border-isis-blue/10 p-4 rounded-xl focus:outline-none focus:border-isis-blue/40 transition-colors w-full text-isis-dark resize-none"
      ></textarea>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Textarea {
  id = input<string>('');
  label = input<string>('');
  rows = input<number>(4);
  placeholder = input<string>('');
}
