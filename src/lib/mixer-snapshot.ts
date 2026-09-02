import type { DeckId, MixerSnapshot } from "../types/mixer";

/**
 * Clona o snapshot da cabine para o React enxergar mutação.
 *
 * O engine muta o objeto vivo, e por isso o reducer não pode devolver a
 * mesma referência. O clone é raso nos decks e profundo em EQ, loop, hot
 * cues e track, porque esses campos são os que a tela compara por identidade.
 *
 * @param snapshot Snapshot corrente do engine.
 */
export function cloneMixerSnapshot(snapshot: MixerSnapshot): MixerSnapshot {
  return {
    ...snapshot,
    a: {
      ...snapshot.a,
      eq: { ...snapshot.a.eq },
      eqKill: { ...snapshot.a.eqKill },
      loop: { ...snapshot.a.loop },
      hotCues: snapshot.a.hotCues.map((cue) => ({ ...cue })),
      track: { ...snapshot.a.track },
    },
    b: {
      ...snapshot.b,
      eq: { ...snapshot.b.eq },
      eqKill: { ...snapshot.b.eqKill },
      loop: { ...snapshot.b.loop },
      hotCues: snapshot.b.hotCues.map((cue) => ({ ...cue })),
      track: { ...snapshot.b.track },
    },
  };
}

/**
 * Converte a fase do deck no beat do compasso de oito, que é a unidade que
 * `setCueBeat` espera nos loops sintéticos.
 *
 * @param snapshot Snapshot de onde ler a fase.
 * @param id Deck a consultar.
 */
export function phaseToBeat(snapshot: MixerSnapshot, id: DeckId): number {
  return snapshot[id].phase * 8;
}
