# tests/

Testes de ponta a ponta. A config do Playwright está em `config/playwright.config.ts` (`npm test`).

## e2e/

| Arquivo | Papel |
| --- | --- |
| `seo.spec.ts` | Título, idioma, meta, landmarks e H1 por rota. |
| `usability.spec.ts` | Fluxos de uso (navegação, mixer, formulário, academia). |
| `identity.spec.ts` | Tipografia, tokens CSS, overflow e menu. |

Viewports: desktop 1440×900, tablet 768×1024, mobile 390×844.
