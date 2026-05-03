import {RenderMode, ServerRoute} from '@angular/ssr';

/**
 * Rotas com dados em browser storage (JWT) ou guard não podem ser pré-renderizadas
 * como se o utilizador estivesse deslogado — senão o F5 em /admin “perde” a sessão.
 */
export const serverRoutes: ServerRoute[] = [
  {path: 'admin', renderMode: RenderMode.Client},
  {path: 'auth/login', renderMode: RenderMode.Client},
  {path: 'auth/register', renderMode: RenderMode.Client},
  {path: '**', renderMode: RenderMode.Prerender},
];
