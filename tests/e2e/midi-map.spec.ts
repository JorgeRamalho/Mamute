import { expect, test } from "@playwright/test";
import { createDdj400MapContext, mapDdj400 } from "../../src/lib/midi/ddj-400-map";
import {
  DDJ_STATUS,
  DECK_CC_14BIT,
  DECK_NOTE,
  MIXER_CC_14BIT,
} from "../../src/lib/midi/ddj-400-protocol";
import { isDdj400PortName } from "../../src/lib/midi/midi-session";
import { coalesceMode, createMidiActionQueue } from "../../src/lib/midi/midi-coalesce";
import { parseMidiMessage, type ParsedMidiMessage } from "../../src/lib/midi/parse-message";
import type { MixerAction } from "../../src/types/mixer";

test.describe("mapa MIDI DDJ-400 — knobs e faders", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "mapa puro, um projeto basta");
  });

  test("parser ignora sysex e monta CC com o status original", () => {
    expect(isDdj400PortName("MIDIIN2 (2- DDJ-400)")).toBe(true);
    expect(isDdj400PortName("Pioneer DDJ400")).toBe(true);
    expect(isDdj400PortName("Launchpad Mini")).toBe(false);
    expect(parseMidiMessage(new Uint8Array([0xf0, 0x00, 0x01]))).toBeNull();
    expect(parseMidiMessage(new Uint8Array([DDJ_STATUS.ccDeckA, DECK_CC_14BIT.trim.msb]))).toBeNull();
    expect(parseMidiMessage(new Uint8Array([DDJ_STATUS.ccDeckA, DECK_CC_14BIT.trim.msb, 0x40]))).toEqual({
      status: DDJ_STATUS.ccDeckA,
      channel: 0,
      kind: "cc",
      data1: DECK_CC_14BIT.trim.msb,
      data2: 0x40,
    });
  });

  test("trim, EQ, filter e faders cobrem mínimo, detent e fim de curso", () => {
    const ctx = createDdj400MapContext();

    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.trim, 0, 0)).toEqual({
      type: "trim",
      id: "a",
      value: 0.2,
    });
    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.trim, 0x40, 0)).toEqual({
      type: "trim",
      id: "a",
      value: 0.6,
    });
    expect(send14(ctx, DDJ_STATUS.ccDeckB, DECK_CC_14BIT.trim, 0x7f, 0x7f)).toEqual({
      type: "trim",
      id: "b",
      value: 1,
    });

    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.eqHigh, 0, 0)).toEqual({
      type: "eq",
      id: "a",
      band: "high",
      value: -24,
    });
    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.eqMid, 0x40, 0)).toEqual({
      type: "eq",
      id: "a",
      band: "mid",
      value: 0,
    });
    expect(send14(ctx, DDJ_STATUS.ccDeckB, DECK_CC_14BIT.eqLow, 0x7f, 0x7f)).toEqual({
      type: "eq",
      id: "b",
      band: "low",
      value: 12,
    });

    expect(send14(ctx, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.filterDeckA, 0, 0)).toEqual({
      type: "filter",
      id: "a",
      value: -100,
    });
    expect(send14(ctx, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.filterDeckB, 0x40, 0)).toEqual({
      type: "filter",
      id: "b",
      value: 0,
    });
    expect(send14(ctx, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.filterDeckA, 0x7f, 0x7f)).toEqual({
      type: "filter",
      id: "a",
      value: 100,
    });

    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.channelFader, 0, 0)).toEqual({
      type: "gain",
      id: "a",
      value: 0,
    });
    expect(send14(ctx, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.crossfader, 0x7f, 0x7f)).toEqual({
      type: "xf",
      value: 1,
    });
    expect(send14(ctx, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.headphonesMixing, 0x7f, 0x7f)).toEqual({
      type: "cueMix",
      value: 1,
    });
    expect(send14(ctx, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.headphonesLevel, 0, 0)).toEqual({
      type: "booth",
      value: 0,
    });
  });

  test("EQ negativo usa corte de 24 dB, e não um fator simétrico", () => {
    const ctx = createDdj400MapContext();
    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.eqHigh, 0x20, 0)).toEqual({
      type: "eq",
      id: "a",
      band: "high",
      value: -12,
    });
    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.eqHigh, 0x60, 0)).toEqual({
      type: "eq",
      id: "a",
      band: "high",
      value: 6,
    });
  });

  test("note e tempo fader não emitem ação nesta PoC", () => {
    const ctx = createDdj400MapContext();
    expect(
      mapDdj400(
        {
          status: DDJ_STATUS.noteDeckA,
          channel: 0,
          kind: "noteOn",
          data1: DECK_NOTE.play,
          data2: 0x7f,
        },
        ctx,
      ),
    ).toBeNull();
    expect(send14(ctx, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.tempo, 0x40, 0)).toBeNull();
  });
});

test.describe("fila de coalesce de um frame", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "fila pura, um projeto basta");
  });

  test("knob e fader guardam só o último valor de cada controle", () => {
    const queue = createMidiActionQueue();

    expect(queue.push({ type: "gain", id: "a", value: 0.2 })).toBeNull();
    expect(queue.push({ type: "gain", id: "a", value: 0.8 })).toBeNull();
    expect(queue.push({ type: "gain", id: "b", value: 0.3 })).toBeNull();

    expect(queue.drain()).toEqual([
      { type: "gain", id: "a", value: 0.8 },
      { type: "gain", id: "b", value: 0.3 },
    ]);
    expect(queue.isEmpty()).toBe(true);
  });

  test("EQ não deixa uma banda engolir a outra nem um deck engolir o outro", () => {
    const queue = createMidiActionQueue();

    queue.push({ type: "eq", id: "a", band: "high", value: 3 });
    queue.push({ type: "eq", id: "a", band: "low", value: -6 });
    queue.push({ type: "eq", id: "b", band: "high", value: 9 });
    queue.push({ type: "eq", id: "a", band: "high", value: 4 });

    expect(queue.drain()).toEqual([
      { type: "eq", id: "a", band: "high", value: 4 },
      { type: "eq", id: "a", band: "low", value: -6 },
      { type: "eq", id: "b", band: "high", value: 9 },
    ]);
  });

  test("o jog acumula, porque nudge é passo relativo e não valor absoluto", () => {
    const queue = createMidiActionQueue();

    for (let tick = 0; tick < 3; tick += 1) {
      expect(queue.push({ type: "nudge", id: "a", direction: 1 })).toBeNull();
    }
    queue.push({ type: "nudge", id: "b", direction: -1 });
    queue.push({ type: "nudge", id: "b", direction: -1 });

    // Se a fila tratasse o jog como knob, três ticks virariam um só e o prato
    // andaria um terço do gesto.
    expect(queue.drain()).toEqual([
      { type: "nudge", id: "a", direction: 1 },
      { type: "nudge", id: "a", direction: 1 },
      { type: "nudge", id: "a", direction: 1 },
      { type: "nudge", id: "b", direction: -1 },
      { type: "nudge", id: "b", direction: -1 },
    ]);
  });

  test("ticks opostos no mesmo frame se cancelam", () => {
    const queue = createMidiActionQueue();

    queue.push({ type: "nudge", id: "a", direction: 1 });
    queue.push({ type: "nudge", id: "a", direction: -1 });

    expect(queue.drain()).toEqual([]);
  });

  test("botão sai na hora e não espera frame", () => {
    const queue = createMidiActionQueue();

    expect(queue.push({ type: "toggle", id: "a" })).toEqual({ type: "toggle", id: "a" });
    expect(queue.push({ type: "cueMonitor", id: "b", value: true })).toEqual({
      type: "cueMonitor",
      id: "b",
      value: true,
    });
    expect(queue.isEmpty()).toBe(true);
    expect(queue.drain()).toEqual([]);
  });

  test("a classificação separa as três naturezas de ação", () => {
    expect(coalesceMode({ type: "xf", value: 0.5 })).toBe("continuous");
    expect(coalesceMode({ type: "pitch", id: "a", value: 2 })).toBe("continuous");
    expect(coalesceMode({ type: "nudge", id: "a", direction: 1 })).toBe("accumulate");
    expect(coalesceMode({ type: "toggleLoop", id: "a" })).toBe("immediate");
    expect(coalesceMode({ type: "loadTrack", id: "a", trackId: "x" })).toBe("immediate");
  });
});

/**
 * Monta um CC sintético com o status e os dois data bytes.
 *
 * @param status Primeiro byte da mensagem.
 * @param data1 Número do CC.
 * @param data2 Valor de 0 a 127.
 */
function cc(status: number, data1: number, data2: number): ParsedMidiMessage {
  return { status, channel: status & 0x0f, kind: "cc", data1, data2 };
}

/**
 * Envia o par MSB/LSB e devolve a ação do LSB, que fecha os 14 bits.
 *
 * @param ctx Contexto mutável do mapper.
 * @param status Canal MIDI do controle.
 * @param pair Endereço 14-bit do protocolo.
 * @param msb Byte mais significativo.
 * @param lsb Byte menos significativo.
 */
function send14(
  ctx: ReturnType<typeof createDdj400MapContext>,
  status: number,
  pair: { msb: number; lsb: number },
  msb: number,
  lsb: number,
): MixerAction | null {
  mapDdj400(cc(status, pair.msb, msb), ctx);
  return mapDdj400(cc(status, pair.lsb, lsb), ctx);
}
