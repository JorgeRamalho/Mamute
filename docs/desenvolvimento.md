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

1. `npm run build` (gera `dist/assets/main.js` e `dist/assets/index.css`)
2. Com `index.html` aberto, Go Live (porta 5500)

O `index.html` da raiz não executa TypeScript. Fora das portas do Vite (5173 / 4173) ele carrega o bundle em `dist/`. Sem o build, a página explica o que fazer.

`.vscode/settings.json` serve a raiz do workspace (`/`), para o Go Live abrir o `index.html` que você está vendo.

## Deploy (Netlify)

`netlify.toml` na raiz:

- build: `npm run build`
- publish: `dist`
- SPA: `/*` → `/index.html` (200)
- headers: frame, sniff, referrer, permissions

Formulário de cadastro DJ: form oculto em `index.html` (`data-netlify="true"`) para o crawler da Netlify detectar os campos; o React envia via AJAX.

## Variáveis

Não há secrets no cliente. APIs de parceiro (Beatport, Spotify, YouTube Data) exigem backend e ficam fora do escopo atual — ver [pesquisa/plataformas.md](pesquisa/plataformas.md).
