# Arquitetura do frontend (Arte Isis)

## Visão geral

Aplicação **Angular 21** (standalone components, zoneless onde aplicável), estilos com **Tailwind CSS**, alguns componentes de interface com **Angular Material** (ícones). O cliente HTTP fala com a API Spring Boot configurada em `environment.apiBaseUrl`.

## Organização de pastas

| Área | Conteúdo |
|------|-----------|
| `src/app/core` | Serviços transversais, por exemplo `ArteIsisApiService` (REST admin + catálogo). |
| `src/app/components` | UI reutilizável (`button`, `input`, `select`, layout). |
| `src/app/features` | Ecrãs por domínio: `home`, `products`, `auth`, `admin`. |
| `src/environments` | URLs e flags por ambiente; produção substitui via `fileReplacements` no `angular.json`. |
| `src/app/app.routes.ts` | Rotas da SPA. |

## Fluxo de dados

1. **Componentes** obtêm `ArteIsisApiService` com `inject()` e subscrevem observables (muitas vezes com `takeUntilDestroyed` e `debounceTime` nas listagens).
2. O **serviço** usa `HttpClient` com `environment.apiBaseUrl` como prefixo (`/api/admin/...`, `/api/catalog/...`).
3. Os **DTOs** TypeScript em `arteisis-api.service.ts` espelham os records JSON do backend.

## Áreas funcionais

- **Catálogo público**: home (`FeaturedProducts`) e listagem (`ProductList`) chamam `GET /api/catalog/products` com filtros opcionais.
- **Admin**: painel em `features/admin/dashboard.ts` para pedidos, clientes e produtos (`/api/admin/...`).
- **Auth**: páginas de login/registo (podem ser ligadas à API quando existir autenticação no backend).

## SSR e build

O projeto está configurado com **SSR** (`outputMode: "server"`). Chamadas HTTP no browser usam a mesma `apiBaseUrl`; em SSR, garante que a URL da API é alcançável a partir do servidor ou evita chamadas bloqueantes no primeiro render se necessário.

## Relação com o backend

O frontend assume CORS permitido para a origem do dev server (por exemplo `http://localhost:3000`). A documentação de execução da API está no repositório `ArteIsis-backend`.

Integração atual: `ArteIsisApiService` usa `environment.apiBaseUrl` para todas as rotas REST; o painel `/admin` e as operações de escrita enviam JWT via `authInterceptor` após login. O contrato JSON segue os DTOs da API (pedidos com `customerId`, produtos admin com `unitPrice`, etc.). Para testar a API à parte do Angular, usa o OpenAPI ou a coleção Postman descritos em `ArteIsis-backend/docs/POSTMAN.md`.

## Autenticação

- `AuthService` e `authInterceptor` guardam o JWT em `sessionStorage` e enviam `Authorization` nas chamadas à API (exceto login/registo).
- `adminGuard` protege a rota `/admin` (verificação de papel no cliente; a API continua a ser a autoridade).
- Endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`.
