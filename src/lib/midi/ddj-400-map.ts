/**
 * Traduz CC de 14 bits da DDJ-400 em `MixerAction` da cabine.
 *
 * Esta PoC cobre os knobs e faders analógicos, a saber trim, EQ, filter,
 * channel fader, crossfader e os dois knobs de fone. Pitch, transporte e
 * pads ficam para ondas seguintes. Os bytes vêm de `ddj-400-protocol.ts`,
 * e as escalas de destino da UI ficam aqui.
 */

import type { DeckId, MixerAction } from "../../types/mixer";
import type { ParsedMidiMessage } from "./parse-message";
import {
  bipolarUnit14Bit,
  DDJ_STATUS,
  DECK_CC_14BIT,
  deckFromStatus,
  MIXER_CC_14BIT,
  unit14Bit,
  type Cc14Bit,
} from "./ddj-400-protocol";

const TRIM_MIN = 0.2;
const TRIM_SPAN = 0.8;
const EQ_CUT_DB = 24;
const EQ_BOOST_DB = 12;
const FILTER_RANGE = 100;

/**
 * Casas decimais dos controles unitários de 0 a 1.
 *
 * Três casas dão mil degraus, ao passo que as duas de antes davam cem, ou seja,
 * menos que os 128 de um CC de 7 bits. Com duas casas o par MSB/LSB não
 * comprava resolução nenhuma nesses controles, e o esforço de 14 bits era
 * jogado fora no arredondamento.
 */
const UNIT_DECIMALS = 3;

/** Casas decimais de EQ em dB e de filter, cujas escalas já são amplas. */
const WIDE_DECIMALS = 1;

interface Cc14Parts {
  readonly msb: number;
  readonly lsb: number;
}

export interface Ddj400MapContext {
  last14: Map<string, Cc14Parts>;
}

/**
 * Cria o contexto mutável do mapper, que guarda o último par MSB/LSB de cada
 * controle de 14 bits.
 */
export function createDdj400MapContext(): Ddj400MapContext {
  return { last14: new Map() };
}

/**
 * Mapeia uma mensagem já parseada para uma ação da cabine, ou `null` quando o
 * byte não é um knob ou fader desta PoC.
 *
 * @param event Mensagem CC ou note já quebrada pelo parser genérico.
 * @param ctx Pares 14-bit pendentes, um por controle e canal.
 */
export function mapDdj400(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  if (event.kind !== "cc") return null;

  if (event.status === DDJ_STATUS.ccDeckA || event.status === DDJ_STATUS.ccDeckB) {
    return mapDeckAnalog(event, ctx);
  }
  if (event.status === DDJ_STATUS.ccMixer) {
    return mapMixerAnalog(event, ctx);
  }
  return null;
}

/**
 * Resolve trim, EQ e channel fader, cujo deck sai do canal MIDI.
 *
 * @param event CC no canal do deck A ou B.
 * @param ctx Pares 14-bit do mapper.
 */
function mapDeckAnalog(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  const deck = deckFromStatus(event.status);
  if (!deck) return null;

  const match = matchCc14(DECK_CC_14BIT, event.data1);
  if (!match) return null;

  const bits = assemble14Bit(ctx, event.status, match.pair, match.part, event.data2);
  if (match.name === "channelFader") {
    return { type: "gain", id: deck, value: roundTo(unit14Bit(bits.msb, bits.lsb), UNIT_DECIMALS) };
  }
  if (match.name === "trim") {
    return { type: "trim", id: deck, value: scaleTrim(unit14Bit(bits.msb, bits.lsb)) };
  }
  if (match.name === "eqHigh") return eqAction(deck, "high", bits);
  if (match.name === "eqMid") return eqAction(deck, "mid", bits);
  if (match.name === "eqLow") return eqAction(deck, "low", bits);
  return null;
}

/**
 * Resolve crossfader, filtros e knobs de fone, que moram no canal do mixer.
 *
 * @param event CC no status `DDJ_STATUS.ccMixer`.
 * @param ctx Pares 14-bit do mapper.
 */
function mapMixerAnalog(event: ParsedMidiMessage, ctx: Ddj400MapContext): MixerAction | null {
  const match = matchCc14(MIXER_CC_14BIT, event.data1);
  if (!match) return null;

  const bits = assemble14Bit(ctx, event.status, match.pair, match.part, event.data2);
  const unit = unit14Bit(bits.msb, bits.lsb);
  const bipolar = bipolarUnit14Bit(bits.msb, bits.lsb);

  if (match.name === "crossfader") {
    return { type: "xf", value: roundTo(unit, UNIT_DECIMALS) };
  }
  if (match.name === "filterDeckA") {
    return { type: "filter", id: "a", value: scaleFilter(bipolar) };
  }
  if (match.name === "filterDeckB") {
    return { type: "filter", id: "b", value: scaleFilter(bipolar) };
  }
  if (match.name === "headphonesMixing") {
    return { type: "cueMix", value: roundTo(unit, UNIT_DECIMALS) };
  }
  if (match.name === "headphonesLevel") {
    return { type: "booth", value: roundTo(unit, UNIT_DECIMALS) };
  }
  return null;
}

/**
 * Monta a ação de EQ com a escala assimétrica da cabine, −24 dB a +12 dB.
 *
 * @param deck Canal que originou o CC.
 * @param band HIGH, MED ou LOW.
 * @param bits Par MSB/LSB já montado.
 */
function eqAction(deck: DeckId, band: "high" | "mid" | "low", bits: Cc14Parts): MixerAction {
  return { type: "eq", id: deck, band, value: scaleEq(bipolarUnit14Bit(bits.msb, bits.lsb)) };
}

/**
 * Junta MSB e LSB sem pular o valor quando só um dos dois bytes chega.
 *
 * O último LSB conhecido entra na conta do MSB novo, e o contrário também, e
 * por isso o knob da tela não salta para o coarse de LSB zero a cada giro.
 *
 * @param ctx Mapa de pares por controle.
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

/**
 * Leva o unitário 0–1 para o range de trim da cabine, 0.2 a 1.
 *
 * @param unit Saída de `unit14Bit`.
 */
function scaleTrim(unit: number): number {
  return roundTo(TRIM_MIN + unit * TRIM_SPAN, UNIT_DECIMALS);
}

/**
 * Leva o bipolar −1 a 1 para dB de EQ, com corte mais fundo que o boost.
 *
 * @param bipolar Saída de `bipolarUnit14Bit`, zero no detent.
 */
function scaleEq(bipolar: number): number {
  return roundTo(bipolar < 0 ? bipolar * EQ_CUT_DB : bipolar * EQ_BOOST_DB, WIDE_DECIMALS);
}

/**
 * Leva o bipolar −1 a 1 para o filter da cabine, −100 a 100.
 *
 * @param bipolar Saída de `bipolarUnit14Bit`, zero no detent.
 */
function scaleFilter(bipolar: number): number {
  return roundTo(bipolar * FILTER_RANGE, WIDE_DECIMALS);
}

/**
 * Arredonda para um número de casas decimais, para o knob da tela não oscilar
 * em frações longas.
 *
 * A conta multiplica antes e divide depois, e **não** o contrário, porque
 * `Math.round(x / 0.001) * 0.001` devolveria 0.6000000000000001 em vez de 0.6,
 * e o valor vazaria com ruído de ponto flutuante para o snapshot e para os
 * testes de mapa.
 *
 * @param value Valor já na escala de destino.
 * @param decimals Casas a preservar.
 */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
