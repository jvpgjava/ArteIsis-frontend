import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [attr.type]="type()"
      [class]="'inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 active:scale-95 group ' + variantClasses() + ' ' + sizeClasses()"
      [disabled]="disabled()"
    >
      <ng-content></ng-content>
    </button>
  `,
  host: {
    'class': 'inline-block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  variant = input<'primary' | 'secondary' | 'outline' | 'ghost' | 'outline-white'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  protected variantClasses() {
    switch (this.variant()) {
      case 'primary':
        return 'bg-isis-blue text-white hover:bg-isis-blue/90 shadow-lg shadow-isis-blue/20';
      case 'secondary':
        return 'bg-isis-rose text-white hover:bg-isis-rose/90 shadow-lg shadow-isis-rose/20 text-white';
      case 'outline':
        return 'bg-transparent border-2 border-isis-blue text-isis-blue hover:bg-isis-blue hover:text-white';
      case 'outline-white':
        return 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-isis-blue';
      case 'ghost':
        return 'bg-transparent text-isis-blue hover:bg-isis-light';
      default:
        return 'bg-isis-blue text-white';
    }
  }

  protected sizeClasses() {
    switch (this.size()) {
      case 'sm': return 'px-4 py-1.5 text-xs tracking-wider uppercase';
      case 'md': return 'px-8 py-3 text-sm tracking-widest uppercase';
      case 'lg': return 'px-12 py-5 text-base tracking-[0.2em] uppercase font-extrabold';
      default: return 'px-8 py-3 text-sm tracking-widest uppercase';
    }
  }
}
