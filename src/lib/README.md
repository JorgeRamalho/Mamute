# src/lib/

Lógica de domínio e adaptação de ambiente. Sem JSX.

| Arquivo | Papel |
| --- | --- |
| `audio-engine.ts` | Dual deck Web Audio (loops sintéticos, EQ, pitch, crossfader). |
| `storage.ts` | Perfil DJ em `localStorage`. |
| `academy.ts` | Progresso das aulas em `localStorage`. |
| `base.ts` | Basename do router, URL do Live Server e `publicAsset()` para favicon. |
| `midi/ddj-400-protocol.ts` | Status bytes, CCs e notes da Pioneer DDJ-400, mais a decodificação de 14 bits e do jog. |
| `midi/parse-message.ts` | Quebra o `Uint8Array` da Web MIDI em CC ou note e ignora sysex. |
| `midi/midi-session.ts` | `requestMIDIAccess` e filtro do input cujo nome contém DDJ-400. |
| `midi/ddj-400-map.ts` | Função pura que traduz CC de 14 bits e notes de transporte em `MixerAction` na escala da cabine. |
| `midi/midi-coalesce.ts` | Fila de um frame que junta ação contínua, soma a cumulativa e deixa a imediata passar direto. |
| `midi/use-midi-controller.ts` | Hook que liga a sessão MIDI ao `dispatch` da cabine e mede a latência até a tela. |
