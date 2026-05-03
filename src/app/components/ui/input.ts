import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import {
  formatBrazilPhoneMask,
  formatBrlCurrencyFromNumber,
  formatBrlCurrencyInput,
  formatEmailInput,
  formatOrderQtyInput,
  normalizeEmail,
  parseBrlCurrencyInput,
} from '../../core/form-validators';

@Component({
  selector: 'app-input',
  template: `
    <div class="flex flex-col gap-3 w-full">
      @if (label()) {
        <label [for]="id()" class="text-xs font-bold uppercase tracking-wider text-isis-dark/50 px-1">
          {{ label() }}
        </label>
      }
      <input
        [id]="id()"
        [type]="effectiveType()"
        [attr.inputmode]="inputmode()"
        [attr.autocomplete]="autocomplete()"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onBlur()"
        [class]="inputClass()"
      />
      @if (errorText()) {
        <p class="text-xs font-medium text-red-600 px-1">{{ errorText() }}</p>
      }
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
  /** Máscara: `phone-br`, `email`, `currency-brl` (R$ …), `order-qty` (inteiro ≥ 1), `stock-qty` (inteiro ≥ 0). */
  mask = input<'none' | 'phone-br' | 'email' | 'currency-brl' | 'order-qty' | 'stock-qty'>('none');
  errorText = input<string>('');

  effectiveType(): string {
    if (this.mask() === 'phone-br') return 'tel';
    if (this.mask() === 'currency-brl' || this.mask() === 'order-qty' || this.mask() === 'stock-qty') return 'text';
    return this.type();
  }

  inputmode(): string | null {
    if (this.mask() === 'phone-br') return 'numeric';
    if (this.mask() === 'email') return 'email';
    if (this.mask() === 'currency-brl' || this.mask() === 'order-qty' || this.mask() === 'stock-qty') return 'numeric';
    return null;
  }

  autocomplete(): string | null {
    return this.mask() === 'email' ? 'email' : null;
  }

  inputClass(): string {
    const base =
      'bg-isis-light border p-4 rounded-xl focus:outline-none transition-colors w-full text-isis-dark';
    const border = this.errorText()
      ? 'border-red-400 focus:border-red-500'
      : 'border-isis-blue/10 focus:border-isis-blue/40';
    return base + ' ' + border;
  }

  onInput(event: Event) {
    const el = event.target as HTMLInputElement | null;
    let v = el?.value ?? '';
    if (this.mask() === 'phone-br') {
      v = formatBrazilPhoneMask(v);
      if (el && el.value !== v) {
        el.value = v;
      }
    } else if (this.mask() === 'email') {
      v = formatEmailInput(v);
      if (el && el.value !== v) {
        el.value = v;
      }
    } else if (this.mask() === 'currency-brl') {
      v = formatBrlCurrencyInput(v);
      if (el && el.value !== v) {
        el.value = v;
      }
    } else if (this.mask() === 'order-qty' || this.mask() === 'stock-qty') {
      v = formatOrderQtyInput(v);
      if (el && el.value !== v) {
        el.value = v;
      }
    }
    this.value.set(v);
  }

  onBlur() {
    if (this.mask() === 'email') {
      this.value.set(normalizeEmail(this.value()));
    } else if (this.mask() === 'currency-brl') {
      const n = parseBrlCurrencyInput(this.value());
      this.value.set(formatBrlCurrencyFromNumber(Math.max(0, n)));
    } else if (this.mask() === 'order-qty') {
      let d = formatOrderQtyInput(this.value());
      if (d === '' || d === '0') {
        d = '1';
      }
      this.value.set(d);
    } else if (this.mask() === 'stock-qty') {
      let d = formatOrderQtyInput(this.value());
      if (d === '') {
        d = '0';
      } else {
        const n = Math.min(9_999_999, Math.max(0, parseInt(d, 10) || 0));
        d = String(n);
      }
      this.value.set(d);
    }
  }
}
