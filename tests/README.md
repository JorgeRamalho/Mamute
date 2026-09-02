# tests/

Testes de ponta a ponta. A config do Playwright está em `config/playwright.config.ts` (`npm test`).

## e2e/

| Arquivo | Papel |
| --- | --- |
| `seo.spec.ts` | Título, idioma, meta, landmarks e H1 por rota. |
| `usability.spec.ts` | Fluxos de uso (navegação, mixer, formulário, academia). |
| `identity.spec.ts` | Tipografia, tokens CSS, overflow e menu. |
| `mixer.spec.ts` | Layout, acessibilidade e regressão de rótulo da cabine. |
| `midi-status.spec.ts` | Chip da sessão MIDI nos quatro estados, e a `/mixer` viva sem controladora. |
| `midi-map.spec.ts` | Mapa puro da DDJ-400 e fila de coalesce, rodando no Node sem página. |
| `midi-inject.spec.ts` | Bytes injetados na página até o slider, com o orçamento de latência. |

Viewports: desktop 1440×900, tablet 768×1024, mobile 390×844.
