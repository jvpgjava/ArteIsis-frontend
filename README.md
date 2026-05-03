# Arte Isis — Frontend

SPA em Angular 21 com Tailwind. Consome a API REST do repositório **ArteIsis-backend**.

## Pré-requisitos

- Node.js 20+ (recomendado LTS)
- npm
- API em execução com CORS a permitir a origem do frontend (por exemplo `http://localhost:3000`)

## Ambientes (`apiBaseUrl`)

Os ficheiros estão em `src/environments/`. O Angular substitui `environment.ts` em cada configuração de build (`angular.json`).

| Ficheiro | Uso |
|----------|-----|
| `environment.local.ts` | Desenvolvimento local (`http://localhost:8080` por defeito) |
| `environment.hml.ts` | Homologação (ajusta o URL da API) |
| `environment.prod.ts` | Produção (ajusta o URL da API) |

Comandos úteis:

```bash
npm run dev          # local (configuration development → environment.local.ts)
npm run dev:local    # explícito local
npm run dev:hml      # aponta para a API de HML
npm run build        # produção (padrão do CLI neste projeto)
npm run build:local
npm run build:hml
npm run build:prod
```

## Passo a passo — correr localmente

1. Na raiz do frontend: `npm install`.

2. Ajusta `src/environments/environment.local.ts` se a API não estiver em `http://localhost:8080`.

3. Sobe o backend (ver `ArteIsis-backend/README.md`).

4. `npm run dev` e abre `http://localhost:3000`.

Rotas úteis: `/` (home), `/products` (catálogo), `/auth/login`, `/admin` (painel; requer utilizador **ADMIN** na API).

## Autenticação

O login chama `POST /api/auth/login`. O painel `/admin` está protegido no cliente (`adminGuard`) e na API (`/api/admin/**` exige JWT com papel **ADMIN**). Utilizador inicial criado na primeira subida da API (ver README do backend).

## Build

```bash
npm run build:prod
```

Saída em `dist/` (inclui SSR conforme `angular.json`).

## Documentação de arquitetura

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Backend

Instruções em `ArteIsis-backend/README.md` e `ArteIsis-backend/docs/ARCHITECTURE.md`. Postman/OpenAPI: `ArteIsis-backend/docs/POSTMAN.md`.
