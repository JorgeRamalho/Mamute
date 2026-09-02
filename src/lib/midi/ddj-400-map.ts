/**
 * Traduz mensagens da DDJ-400 em `MixerAction` da cabine.
 *
 * Cobre os knobs e faders analógicos de 14 bits, a saber trim, EQ, filter,
 * channel fader, crossfader, os dois knobs de fone e o tempo fader, mais as
 * notes de transporte e os jogs. Pads e browser ficam para ondas seguintes.
 * Os bytes vêm de `ddj-400-protocol.ts` e os ranges de destino de
 * `midi-scales.ts`, de modo que este arquivo só decide **qual** controle é.
 */

import type { DeckId, JogMode, MixerAction } from "../../types/mixer";
import type { ParsedMidiMessage } from "./parse-message";
import {
  DDJ_STATUS,
  DECK_CC_14BIT,
  DECK_CC_JOG,
  DECK_NOTE,
  deckFromStatus,
  isPress,
  jogDelta,
  MIXER_CC_14BIT,
  type Cc14Bit,
} from "./ddj-400-protocol";
import {
  JOG_TICKS_PER_NUDGE,
  scaleEqDb,
  scaleFilter,
  scalePitch,
  scaleTrim,
  scaleUnit,
  takeJogNudge,
} from "./midi-scales";

interface Cc14Parts {
  readonly msb: number;
  readonly lsb: number;
}

export interface Ddj400MapContext {
  /** Último par MSB/LSB de cada controle de 14 bits, por canal. */
  last14: Map<string, Cc14Parts>;
  /** Ticks de jog ainda não convertidos em `nudge`, por deck e sensor. */
  jogTicks: Map<string, number>;
  /** Prato encostado, que só o topo em modo vinyl consulta. */
  jogTouched: Record<DeckId, boolean>;
  /** Último modo de prato deduzido do número do CC. */
  jogMode: Record<DeckId, JogMode | null>;
}

/**
 * Cria o contexto mutável do mapper, que guarda o que uma mensagem sozinha não
 * carrega, a saber o par 14-bit pendente e o estado dos pratos.
 */
export function createDdj400MapContext(): Ddj400MapContext {
  return {
    last14: new Map(),
    jogTicks: new Map(),
    jogTouched: { a: false, b: false },
    jogMode: { a: null, b: null },
  };
}

/**
 * Mapeia uma mensagem já parseada para uma ação da cabine, ou `null` quando o
 * controle ainda não pertence a este mapa.
 *
 * @param event Mensagem CC ou note já quebrada pelo parser genérico.
 * @param ctx Estado do mapper entre mensagens.
 */
export function mapDdj400(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  if (event.kind === "noteOn") {
    if (event.status === DDJ_STATUS.noteDeckA || event.status === DDJ_STATUS.noteDeckB) {
      return mapDeckNote(event, ctx);
    }
    return null;
  }
  if (event.kind !== "cc") return null;

  if (event.status === DDJ_STATUS.ccDeckA || event.status === DDJ_STATUS.ccDeckB) {
    return mapDeckCc(event, ctx);
  }
  if (event.status === DDJ_STATUS.ccMixer) {
    return mapMixerAnalog(event, ctx);
  }
  return null;
}

/**
 * Resolve os botões de transporte e o toque do prato.
 *
 * Só o press vira ação, porque a DDJ-400 **não** manda Note Off de status
 * `0x80`, e sim um segundo Note On com velocity zero ao soltar; sem esse filtro
 * o play dispararia duas vezes por toque. A exceção é o `jogTouch`, que precisa
 * justamente do release para soltar o flag, senão o prato ficaria marcado como
 * encostado para sempre.
 *
 * As ações de sync, PFL e cue saem sem `value`, ou seja, são intenção, porque a
 * controladora informa o gesto e não o estado de destino. Quem lê o snapshot e
 * decide é o reducer.
 *
 * @param event Note On no canal do deck A ou B.
 * @param ctx Estado do mapper entre mensagens.
 */
function mapDeckNote(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  const deck = deckFromStatus(event.status);
  if (!deck) return null;

  if (event.data1 === DECK_NOTE.jogTouch) {
    ctx.jogTouched[deck] = isPress(event.data2);
    return null;
  }

  if (!isPress(event.data2)) return null;

  switch (event.data1) {
    case DECK_NOTE.play:
      return { type: "toggle", id: deck };
    case DECK_NOTE.cue:
      return { type: "cueButton", id: deck };
    case DECK_NOTE.pfl:
      return { type: "toggleCueMonitor", id: deck };
    case DECK_NOTE.sync:
      return { type: "toggleSync", id: deck };
    case DECK_NOTE.syncLong:
      // Note distinta que o firmware emite ao segurar o SYNC, e por isso o
      // mapper não precisa de timer para separar toque curto de longo.
      return { type: "masterDeck", id: deck };
    default:
      return null;
  }
}

/**
 * Separa os CCs do canal do deck entre jog relativo e controle de 14 bits.
 *
 * @param event CC no canal do deck A ou B.
 * @param ctx Estado do mapper entre mensagens.
 */
function mapDeckCc(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  const deck = deckFromStatus(event.status);
  if (!deck) return null;

  if (
    event.data1 === DECK_CC_JOG.platterVinyl ||
    event.data1 === DECK_CC_JOG.platterCdj ||
    event.data1 === DECK_CC_JOG.side
  ) {
    return mapJog(event, ctx, deck);
  }
  return mapDeckAnalog(event, ctx, deck);
}

/**
 * Converte os ticks do prato em `nudge`, decimando em vez de comparar limiar.
 *
 * O número do CC entrega o modo de graça, porque `platterVinyl` só chega com o
 * vinyl ligado e `platterCdj` só com ele desligado, e por isso o mapper alimenta
 * `jogMode` mesmo sem o botão da tela. A mensagem que anuncia a troca perde o
 * próprio tick, o que custa um vigésimo sexto de `nudge` num evento raro.
 *
 * O topo em modo vinyl exige prato encostado, imitando o CDJ, ao passo que a
 * borda responde sempre, porque ela é a faixa de bend e não tem sensor de toque.
 * O portão fica **antes** do acumulador, e não depois, senão os ticks girados
 * com o prato solto ficariam guardados e sairiam todos de uma vez no instante
 * em que o dedo encostasse.
 *
 * @param event CC de jog no canal do deck.
 * @param ctx Estado do mapper entre mensagens.
 * @param deck Deck resolvido pelo canal MIDI.
 */
function mapJog(
  event: ParsedMidiMessage,
  ctx: Ddj400MapContext,
  deck: DeckId,
): MixerAction | null {
  const isSide = event.data1 === DECK_CC_JOG.side;

  if (!isSide) {
    const mode: JogMode = event.data1 === DECK_CC_JOG.platterVinyl ? "vinyl" : "cdj";
    if (ctx.jogMode[deck] !== mode) {
      ctx.jogMode[deck] = mode;
      return { type: "jogMode", id: deck, value: mode };
    }
    if (mode === "vinyl" && !ctx.jogTouched[deck]) return null;
  }

  const key = `${deck}:${isSide ? "side" : "platter"}`;
  const divisor = isSide ? JOG_TICKS_PER_NUDGE.side : JOG_TICKS_PER_NUDGE.platter;
  const { direction, rest } = takeJogNudge(
    (ctx.jogTicks.get(key) ?? 0) + jogDelta(event.data2),
    divisor,
  );
  ctx.jogTicks.set(key, rest);
  return direction === 0 ? null : { type: "nudge", id: deck, direction };
}

/**
 * Resolve trim, EQ, channel fader e tempo, cujo deck sai do canal MIDI.
 *
 * @param event CC de 14 bits no canal do deck.
 * @param ctx Estado do mapper entre mensagens.
 * @param deck Deck resolvido pelo canal MIDI.
 */
function mapDeckAnalog(
  event: ParsedMidiMessage,
  ctx: Ddj400MapContext,
  deck: DeckId,
): MixerAction | null {
  const match = matchCc14(DECK_CC_14BIT, event.data1);
  if (!match) return null;

  const { msb, lsb } = assemble14Bit(ctx, event.status, match.pair, match.part, event.data2);
  switch (match.name) {
    case "channelFader":
      return { type: "gain", id: deck, value: scaleUnit(msb, lsb) };
    case "trim":
      return { type: "trim", id: deck, value: scaleTrim(msb, lsb) };
    case "tempo":
      return { type: "pitch", id: deck, value: scalePitch(msb, lsb) };
    case "eqHigh":
      return { type: "eq", id: deck, band: "high", value: scaleEqDb(msb, lsb) };
    case "eqMid":
      return { type: "eq", id: deck, band: "mid", value: scaleEqDb(msb, lsb) };
    case "eqLow":
      return { type: "eq", id: deck, band: "low", value: scaleEqDb(msb, lsb) };
    default:
      return null;
  }
}

/**
 * Resolve crossfader, filtros e knobs de fone, que moram no canal do mixer.
 *
 * @param event CC no status `DDJ_STATUS.ccMixer`.
 * @param ctx Estado do mapper entre mensagens.
 */
function mapMixerAnalog(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  const match = matchCc14(MIXER_CC_14BIT, event.data1);
  if (!match) return null;

  const { msb, lsb } = assemble14Bit(ctx, event.status, match.pair, match.part, event.data2);
  switch (match.name) {
    case "crossfader":
      return { type: "xf", value: scaleUnit(msb, lsb) };
    case "filterDeckA":
      return { type: "filter", id: "a", value: scaleFilter(msb, lsb) };
    case "filterDeckB":
      return { type: "filter", id: "b", value: scaleFilter(msb, lsb) };
    case "headphonesMixing":
      return { type: "cueMix", value: scaleUnit(msb, lsb) };
    case "headphonesLevel":
      return { type: "booth", value: scaleUnit(msb, lsb) };
    default:
      return null;
  }
}

/**
 * Junta MSB e LSB sem pular o valor quando só um dos dois bytes chega.
 *
 * O último LSB conhecido entra na conta do MSB novo, e o contrário também, e
 * por isso o knob da tela não salta para o coarse de LSB zero a cada giro.
 *
 * @param ctx Estado do mapper entre mensagens.
 * @param status Canal MIDI, porque o mesmo CC no deck A e no B são controles distintos.
 * @param pair Endereço 14-bit do protocolo.
 * @param part Qual byte desta mensagem.
 * @param value Byte de 0 a 127.
 */
function assemble14Bit(
  ctx: Ddj400MapContext,
  status: number,
  pair: Cc14Bit,
  part: "msb" | "lsb",
  value: number,
): Cc14Parts {
  const key = `${status}:${pair.msb}`;
  const previous = ctx.last14.get(key) ?? { msb: 0, lsb: 0 };
  const next = part === "msb" ? { msb: value, lsb: previous.lsb } : { msb: previous.msb, lsb: value };
  ctx.last14.set(key, next);
  return next;
}

/**
 * Descobre se o número do CC é o MSB ou o LSB de um par conhecido.
 *
 * @param table Tabela de pares do protocolo.
 * @param cc Segundo byte da mensagem.
 */
function matchCc14(
  table: Record<string, Cc14Bit>,
  cc: number,
): { name: string; pair: Cc14Bit; part: "msb" | "lsb" } | null {
  for (const [name, pair] of Object.entries(table)) {
    if (cc === pair.msb) return { name, pair, part: "msb" };
    if (cc === pair.lsb) return { name, pair, part: "lsb" };
  }
  return null;
}
