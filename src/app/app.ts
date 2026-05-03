import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Header} from './components/layout/header';
import {Footer} from './components/layout/footer';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <app-header />
    <main class="min-h-screen">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class App {}
