# Arte Isis — Frontend

SPA em **Angular 21** com **Tailwind CSS**. Consome a API REST do repositório **ArteIsis-backend**.

Este guia assume **Windows 10/11**. Em Linux ou macOS: instale o **Node.js LTS**, abra um terminal na pasta do projeto e use os mesmos comandos `npm` indicados abaixo.

---

## O que precisa instalado

| Ferramenta | Versão indicada |
|------------|-------------------|
| **Node.js** | **20 LTS** ou **22 LTS** (Angular 21 pede Node recente; use a versão **Current** ou **LTS** indicada em [nodejs.org](https://nodejs.org/en/download) se o `npm install` avisar) |
| **npm** | Vem incluído com o Node.js |

Opcional (para mudar de versão do Node sem dor de cabeça no Windows): **nvm-windows** —  
**https://github.com/coreybutler/nvm-windows/releases**  
(Instale o `nvm-setup.exe`, reinicie o terminal, depois por exemplo `nvm install 22` e `nvm use 22`.)

---

## 1. Instalar o Node.js

1. Abra: **https://nodejs.org/en/download**
2. Baixe o instalador **Windows** (**.msi** recomendado) — versão **LTS**.
3. Execute o instalador e aceite as opções por defeito (inclui **npm** e adiciona o Node ao **PATH**).
4. **Feche e volte a abrir** o PowerShell.
5. Confirme:
   ```powershell
   node -v
   npm -v
   ```
   Deve mostrar versões sem erro.

Se `node` não for reconhecido, reinstale marcando a opção de adicionar ao PATH ou adicione manualmente a pasta de instalação (ex.: `C:\Program Files\nodejs\`) à variável de ambiente **Path**.

**Path no Windows (resumo):** **Windows + R** → `sysdm.cpl` → **Avançado** → **Variáveis de Ambiente…** → selecione **Path** → **Editar…** → **Novo** → cole `C:\Program Files\nodejs\` (ou o caminho real da sua instalação) → **OK**. Feche e reabra o terminal e teste `node -v`.

---

## 2. Clonar o repositório e instalar dependências

```powershell
cd C:\caminho\para\o\projeto\ArteIsis-frontend
npm install
```

O `npm install` descarrega as dependências listadas em `package.json` (pode demorar alguns minutos na primeira vez).

---

## 3. Onde a API está configurada (`apiBaseUrl`)

Os ficheiros ficam em `src/environments/`. O `angular.json` escolhe qual usar em cada **configuration** de build/serve.

| Ficheiro | Uso típico |
|----------|------------|
| `environment.local.ts` | API em `http://localhost:8080` (desenvolvimento local) |
| `environment.hml.ts` | Homologação — altere o URL da API |
| `environment.prod.ts` | Produção — altere o URL da API |

O ficheiro `environment.ts` reexporta `environment.local` por convenção; em `ng serve` com `--configuration=development` ou `local`, o `angular.json` substitui `environment.ts` por `environment.local.ts` (ambos apontam para a API local).

**Se a API não correr na porta 8080**, edite por exemplo `src/environments/environment.local.ts`:

```typescript
export const environment = {
  production: false,
  envName: 'local' as const,
  apiBaseUrl: 'http://localhost:8080', // altere porta ou host se necessário
};
```

---

## 4. Subir o backend antes do frontend

O painel e o catálogo precisam da API. Na pasta **ArteIsis-backend**, siga o **README.md** do backend e execute por exemplo:

```powershell
mvn spring-boot:run
```

Confirme que **CORS** no backend inclui a origem do front (ex.: `http://localhost:3000` em `application-local.properties`).

---

## 5. Correr o frontend em desenvolvimento

Na pasta **ArteIsis-frontend**:

```powershell
npm run dev
```

Por defeito isto usa a configuração **development** do Angular (ver `package.json` e `angular.json`), com o site em:

**http://localhost:3000**

Outros scripts úteis:

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta **3000**, config **development** → ambiente local) |
| `npm run dev:local` | Explícito para config **local** |
| `npm run dev:hml` | Aponta para API de homologação (config **hml**) |
| `npm run build` | Build de produção (padrão do CLI neste projeto) |
| `npm run build:local` | Build com config **local** |
| `npm run build:hml` | Build **hml** |
| `npm run build:prod` | Build **production** |

---

## 6. Rotas úteis (após `npm run dev`)

| URL | Descrição |
|-----|-----------|
| `http://localhost:3000/` | Página inicial |
| `http://localhost:3000/products` | Catálogo de produtos |
| `http://localhost:3000/auth/login` | Login |
| `http://localhost:3000/admin` | Painel administrativo (utilizador com papel **ADMIN** na API) |

O login chama `POST /api/auth/login`. O primeiro administrador pode ser criado automaticamente pela API quando a base está vazia (ver README do backend).

---

## 7. Build de produção

```powershell
npm run build:prod
```

A saída fica em `dist/` (inclui SSR conforme `angular.json`). Para servir o SSR localmente após build, o projeto expõe por exemplo:

```powershell
npm run serve:ssr:app
```

(Consulte a mensagem do CLI e o `angular.json` para o nome exato da aplicação.)

---

## 8. Resumo ultra-rápido

```powershell
cd ArteIsis-frontend
npm install
# Garantir backend em http://localhost:8080 (ou ajustar environment.local.ts)
npm run dev
```

Abrir **http://localhost:3000**.

---

## Documentação extra

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — arquitetura do frontend  
- Backend: `ArteIsis-backend/README.md` e `ArteIsis-backend/docs/ARCHITECTURE.md`  
- Postman / OpenAPI: `ArteIsis-backend/docs/POSTMAN.md`
