import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Header} from './components/layout/header';
import {Footer} from './components/layout/footer';
import {UiMessageModal} from './components/ui/ui-message-modal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, UiMessageModal],
  template: `
    <app-header />
    <main class="min-h-screen">
      <router-outlet />
    </main>
    <app-footer />
    <app-ui-message-modal />
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class App {}
