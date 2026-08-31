# Desenvolvimento

## Requisitos

Node.js 20+ e npm. Chromium do Playwright para os e2e.

```bash
npm install
npx playwright install chromium
```

## Scripts

| Script | Função |
| --- | --- |
| `npm run dev` | Vite em `http://127.0.0.1:5173` |
| `npm run build` | `tsc -b` + bundle em `dist/` |
| `npm run live` | Build + preview na porta 5500 |
| `npm run preview` | Preview Vite (4173) |
| `npm run typecheck` | TypeScript sem emit |
| `npm run lint` | oxlint |
| `npm test` | Playwright (`config/playwright.config.ts`) |
| `npm run test:ui` | Playwright UI |

## Live Server (VS Code)

1. No terminal: `npm run live:sync` — compila `dist/` e **recompila ao salvar** arquivos em `src/`
   - Ou execute a tarefa VS Code **Mamute: sincronizar Live Server** (`Ctrl+Shift+P` → Run Task)
2. Com `index.html` aberto, **Go Live** (porta 5500)
3. Após mudanças em `src/`, aguarde o build no terminal e recarregue (o Live Server recarrega sozinho quando `dist/` muda)

O `index.html` da raiz não executa TypeScript. Fora das portas do Vite (5173 / 4173) ele carrega o bundle em `dist/`. Sem o build, a página explica o que fazer.

Se `npm run dev` estiver rodando, o Go Live na porta 5500 **redireciona automaticamente** para `http://127.0.0.1:5173` (hot reload).

`.vscode/settings.json` serve a raiz do workspace (`/`). A pasta `src/` não é ignorada pelo Live Server — mudanças em `dist/` disparam reload.

## Deploy (Netlify)

`netlify.toml` na raiz:

- build: `npm run build`
- publish: `dist`
- SPA: `/*` → `/index.html` (200)
- headers: frame, sniff, referrer, permissions

Formulário de cadastro DJ: form oculto em `index.html` (`data-netlify="true"`) para o crawler da Netlify detectar os campos; o React envia via AJAX.

## Variáveis

Não há secrets no cliente. Para a Área do DJ com backend ativo (Netlify Functions + Database), configure no painel Netlify ou em `.env` local com `netlify dev`:

| Variável | Uso |
| --- | --- |
| `NETLIFY_DATABASE_URL` | Postgres (Netlify Database) — criada automaticamente ao provisionar |
| `RESEND_API_KEY` | Envio de códigos e links de verificação por e-mail |
| `EMAIL_FROM` | Remetente (ex.: `Mamute DJPLAYER <noreply@seudominio.com>`) |
| `SITE_URL` | URL pública do site (links de confirmação no e-mail) |

Sem `RESEND_API_KEY`, o cadastro e o login local continuam funcionando; os códigos por e-mail não são enviados.

APIs de parceiro (Beatport, Spotify, YouTube Data) exigem backend e ficam fora do escopo atual — ver [pesquisa/plataformas.md](pesquisa/plataformas.md).
