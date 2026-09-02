/**
 * Fila de ações MIDI de um frame, para a controladora não clonar o snapshot a
 * cada byte.
 *
 * Um fader de 14 bits manda MSB e LSB em rajada, e o jog manda dezenas de CCs
 * por segundo. Sem fila, cada milímetro de curso dispara dois `dispatch` e
 * dois `cloneSnapshot`. Com fila, o hook descarrega uma vez por
 * `requestAnimationFrame`.
 *
 * O ponto delicado é que **não** existe uma regra única de agrupamento, porque
 * as ações da cabine têm três naturezas distintas. Tratar todas como a
 * primeira é o erro que faria o prato andar um décimo do gesto.
 */

import type { DeckId, MixerAction } from "../../types/mixer";

/**
 * Como uma ação atravessa a fila.
 *
 * `continuous` é knob e fader, cujo valor é absoluto, e por isso o último byte
 * do frame substitui os anteriores sem perda. `accumulate` é o jog, cujo valor
 * é um passo relativo, e por isso descartar os intermediários encurtaria o
 * gesto. `immediate` é botão, que não espera frame porque clique não é rajada e
 * o atraso apareceria como input lag no transporte.
 */
export type CoalesceMode = "continuous" | "accumulate" | "immediate";

/**
 * Classifica a ação pela natureza do seu valor.
 *
 * @param action Ação já mapeada a partir do MIDI.
 */
export function coalesceMode(action: MixerAction): CoalesceMode {
  switch (action.type) {
    case "gain":
    case "trim":
    case "filter":
    case "eq":
    case "xf":
    case "master":
    case "booth":
    case "cueMix":
    case "pitch":
      return "continuous";
    case "nudge":
      return "accumulate";
    default:
      return "immediate";
  }
}

/**
 * Chave de agrupamento de uma ação contínua.
 *
 * O deck e a banda entram na chave, senão o EQ HIGH do deck A engoliria o LOW
 * do deck B no mesmo frame.
 *
 * @param action Ação contínua, ou seja, cuja `coalesceMode` é `continuous`.
 */
export function coalesceKey(action: MixerAction): string {
  if (action.type === "eq") return `eq:${action.id}:${action.band}`;
  if ("id" in action) return `${action.type}:${action.id}`;
  return action.type;
}

export interface MidiActionQueue {
  /**
   * Enfileira a ação e devolve o que precisa ir agora.
   *
   * @returns A própria ação quando ela é `immediate`, senão `null`, porque ela
   * fica guardada até o `drain`.
   */
  push: (action: MixerAction) => MixerAction | null;
  /** Esvazia a fila do frame, na ordem em que os controles chegaram. */
  drain: () => MixerAction[];
  /** Diz se há algo guardado, para o hook não agendar frame à toa. */
  isEmpty: () => boolean;
}

/**
 * Cria a fila mutável de um frame.
 *
 * O `Map` preserva a ordem de inserção, e por isso dois knobs girados juntos
 * chegam ao reducer na ordem em que o DJ os tocou.
 */
export function createMidiActionQueue(): MidiActionQueue {
  const continuous = new Map<string, MixerAction>();
  const steps = new Map<DeckId, number>();

  return {
    push(action) {
      const mode = coalesceMode(action);
      if (mode === "immediate") return action;
      if (mode === "accumulate" && action.type === "nudge") {
        steps.set(action.id, (steps.get(action.id) ?? 0) + action.direction);
        return null;
      }
      continuous.set(coalesceKey(action), action);
      return null;
    },

    drain() {
      const out = [...continuous.values()];
      continuous.clear();

      for (const [id, total] of steps) {
        const direction = total < 0 ? -1 : 1;
        for (let step = 0; step < Math.abs(total); step += 1) {
          out.push({ type: "nudge", id, direction });
        }
      }
      steps.clear();

      return out;
    },

    isEmpty() {
      return continuous.size === 0 && steps.size === 0;
    },
  };
}
